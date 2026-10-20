"""Paints the hero sky and the foreground cloud bank as WebP images.

Run: python3 scripts/paint-sky.py   (numpy + Pillow)
Writes src/assets/sky.webp and src/assets/clouds.webp. Change SEED for a new sky.
"""
import numpy as np
from PIL import Image

SEED = 29
rng = np.random.default_rng(SEED)


def noise(w, h, cell):
    gw, gh = w // cell + 3, h // cell + 3
    g = Image.fromarray(rng.random((gh, gw)).astype(np.float32), "F")
    return np.asarray(g.resize((gw * cell, gh * cell), Image.BICUBIC))[:h, :w]


def fbm(w, h, base, octaves=6):
    out, amp, total = np.zeros((h, w), np.float32), 1.0, 0.0
    for o in range(octaves):
        out += amp * noise(w, h, max(2, base >> o))
        total += amp
        amp *= 0.5
    return out / total


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def _box(a, r, axis):
    k = 2 * r + 1
    pad = [(0, 0), (0, 0)]
    pad[axis] = (r + 1, r)
    c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis)
    return (np.take(c, range(k, c.shape[axis]), axis) - np.take(c, range(0, c.shape[axis] - k), axis)) / k


def blur(a, r):
    """Three box passes per axis, close to a Gaussian of radius r."""
    r = max(1, int(round(r / 1.7)))
    for _ in range(3):
        a = _box(_box(a, r, 0), r, 1)
    return a


def ramp(t, stops):
    t = np.clip(t, 0, 1)
    xs = [s[0] for s in stops]
    return np.stack([np.interp(t, xs, [s[1][c] for s in stops]) for c in range(3)], -1)


def puffs(w, h, spots):
    """Height field of overlapping spheres: (x, y, radius) in pixels."""
    hgt = np.zeros((h, w), np.float32)
    for cx, cy, r in spots:
        x0, x1 = int(max(0, cx - r)), int(min(w, cx + r + 1))
        y0, y1 = int(max(0, cy - r)), int(min(h, cy + r + 1))
        if x0 >= x1 or y0 >= y1:
            continue
        yy, xx = np.mgrid[y0:y1, x0:x1]
        d2 = r * r - (xx - cx) ** 2 - (yy - cy) ** 2
        z = np.sqrt(np.clip(d2, 0, None)) 
        np.maximum(hgt[y0:y1, x0:x1], np.where(d2 > 0, z + 1, 0), out=hgt[y0:y1, x0:x1])
    return hgt


def lit(hgt, w, h, light=(0.45, -0.75, 0.55), levels=5):
    """Lambert-lit cumulus: lavender shade, warm peach, gold, cream tops."""
    soft = blur(hgt, 7)
    gy, gx = np.gradient(soft)
    n = np.dstack([-gx, -gy, np.ones_like(gx) * 1.1])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    l = np.array(light) / np.linalg.norm(light)
    s = np.clip(n @ l, 0, 1)
    # Crevices between billows sit in shade; thick interiors glow softly.
    cavity = np.clip((blur(hgt, 24) - soft) / 40, 0, 1)
    s = np.clip(s * 0.8 + 0.25 - 0.5 * cavity + 0.08 * (fbm(w, h, 48, 3) - 0.5), 0, 1)
    s = np.round(s * levels) / levels
    s = blur(s, 2.6)
    return ramp(s, [
        (0.0, (150, 134, 186)),
        (0.25, (212, 150, 160)),
        (0.45, (246, 172, 128)),
        (0.62, (255, 204, 146)),
        (0.8, (255, 232, 196)),
        (1.0, (255, 249, 236)),
    ])


def mass(w, h, outline, n):
    """Puffs under an outline y = outline(x): big billows at the outline, filled below,
    mid puffs for cauliflower texture and small ones along the edge."""
    spots = []
    for _ in range(n):
        x = rng.uniform(-0.05, 1.05) * w
        top = outline(x / w) * h
        if top >= h:
            continue
        kind = rng.random()
        if kind < 0.18:  # billow
            r = rng.uniform(60, 170)
            y = top + r * rng.uniform(0.35, 1.0)
        elif kind < 0.3:  # body fill
            r = rng.uniform(120, 240)
            y = rng.uniform(top + r, h + r)
        elif kind < 0.7:  # cauliflower
            r = rng.uniform(24, 70)
            y = top + r * 0.6 + rng.uniform(0, 0.3) * (h - top)
        else:  # edge detail
            r = rng.uniform(9, 28)
            y = top + r * rng.uniform(0.4, 1.3)
        spots.append((x, y, r))
    return puffs(w, h, spots)


def sky(w=1920, h=1080):
    y = np.linspace(0, 1, h)[:, None] * np.ones((1, w))
    x = np.ones((h, 1)) * np.linspace(0, 1, w)[None, :]
    base = ramp(y + 0.06 * fbm(w, h, 256, 3), [
        (0.0, (46, 86, 170)),
        (0.3, (92, 138, 210)),
        (0.55, (164, 166, 214)),
        (0.75, (232, 176, 178)),
        (1.0, (250, 206, 162)),
    ])
    base += (x * (1 - y) * 18)[..., None]  # warmer, brighter toward the sun side
    glow = np.exp(-(((x - 0.8) / 0.35) ** 2 + ((y - 0.7) / 0.3) ** 2))
    base = base * (1 - 0.45 * glow[..., None]) + np.array([255, 214, 170]) * 0.45 * glow[..., None]

    # High wispy streaks.
    wisp = np.asarray(Image.fromarray(fbm(w // 6, h, 64, 5), "F").resize((w, h), Image.BICUBIC))
    wa = smooth(0.56, 0.72, wisp) * smooth(0.05, 0.25, y) * (1 - smooth(0.55, 0.75, y)) * 0.7
    base = base * (1 - wa[..., None]) + np.array([255, 228, 228]) * wa[..., None]

    # Cumulus: a tall tower on the right and a low line along the horizon.
    tower = lambda u: (0.74 + 0.05 * np.sin(u * 17)
                       - 0.5 * np.exp(-((u - 0.87) / 0.12) ** 4)
                       - 0.12 * np.exp(-((u - 0.62) / 0.08) ** 2)
                       - 0.08 * np.exp(-((u - 0.08) / 0.07) ** 2))
    hgt = mass(w, h, tower, 1600)
    m = smooth(0.5, 2.5, hgt)
    col = lit(hgt, w, h)
    out = base * (1 - m[..., None]) + col * m[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def bank(w=1920, h=760):
    edge = lambda u: 0.3 + 0.1 * np.sin(u * 7 + 1) + 0.05 * np.sin(u * 19)
    hgt = mass(w, h, edge, 2200)
    a = smooth(0.5, 2.0, hgt)
    a[int(h * 0.6):] = 1.0  # solid below the puffs
    col = lit(hgt, w, h, light=(0.3, -0.85, 0.5))
    rgba = np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


if __name__ == "__main__":
    sky().save("src/assets/sky.webp", quality=80, method=6)
    bank().save("src/assets/clouds.webp", quality=82, method=6)
    print("painted")
