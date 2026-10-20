"""Renders the hero sky and the foreground cloud bank as volumetric clouds.

Run: python3 scripts/paint-sky.py   (numpy, numba, Pillow; takes a minute or two)
Writes src/assets/sky.webp and src/assets/clouds.webp. Change SEED for a new sky.

Each cloud is a cluster of spheres grown upward from a flat base, baked into a
voxel grid with low-frequency noise for billows. Sun and sky shadowing are baked
into two more grids, then every pixel raymarches through the volume with
two-lobe scattering, a powder term and distance haze.
"""
import math
import numpy as np
from numba import njit, prange
from PIL import Image

SEED = 29
W, H = 1600, 900
FOV_Y = math.radians(42)
PITCH = math.radians(9)  # camera tilted up a little
SUN = np.array([-0.8, 0.2, -0.15])  # low sunset sun, off to the left
SUN /= np.linalg.norm(SUN)

rng = np.random.default_rng(SEED)


# ---------- noise ----------

@njit(inline="always", cache=True)
def hash3(i, j, k):
    h = (i * 374761393 + j * 668265263 + k * 1274126177) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = h ^ (h >> 16)
    return (h & 0xFFFFFF) / 16777216.0


@njit(inline="always", cache=True)
def vnoise(x, y, z):
    xi, yi, zi = math.floor(x), math.floor(y), math.floor(z)
    xf, yf, zf = x - xi, y - yi, z - zi
    u = xf * xf * (3 - 2 * xf)
    v = yf * yf * (3 - 2 * yf)
    w = zf * zf * (3 - 2 * zf)
    i, j, k = int(xi), int(yi), int(zi)
    a = hash3(i, j, k) + (hash3(i + 1, j, k) - hash3(i, j, k)) * u
    b = hash3(i, j + 1, k) + (hash3(i + 1, j + 1, k) - hash3(i, j + 1, k)) * u
    c = hash3(i, j, k + 1) + (hash3(i + 1, j, k + 1) - hash3(i, j, k + 1)) * u
    d = hash3(i, j + 1, k + 1) + (hash3(i + 1, j + 1, k + 1) - hash3(i, j + 1, k + 1)) * u
    return (a + (b - a) * v) + ((c + (d - c) * v) - (a + (b - a) * v)) * w


@njit(inline="always", cache=True)
def fbm(x, y, z, octaves):
    s, amp, tot = 0.0, 1.0, 0.0
    for _ in range(octaves):
        s += amp * vnoise(x, y, z)
        tot += amp
        amp *= 0.5
        x, y, z = x * 2.03 + 17.1, y * 2.03 + 3.7, z * 2.03 + 11.3
    return s / tot


# ---------- cloud shapes ----------

def cumulus(cx, base, cz, width, height, levels=3, n=10):
    """Spheres grown upward from a flat base: (x, y, z, r, base)."""
    out = []
    for _ in range(n):
        x = cx + rng.uniform(-0.5, 0.5) * width
        edge = 1 - abs(x - cx) / (0.5 * width)
        r = height * rng.uniform(0.28, 0.42) * (0.55 + 0.45 * edge)
        out.append((x, base + r * 0.55, cz + rng.uniform(-0.3, 0.3) * width, r, base))
    layer = list(out)
    for lvl in range(levels):
        nxt = []
        for x, y, z, r, b in layer:
            for _ in range(rng.integers(1, 4)):
                if rng.random() < 0.25 + 0.1 * lvl:
                    continue
                a = rng.uniform(0, 2 * math.pi)
                up = rng.uniform(0.55, 0.95)
                d = np.array([math.cos(a) * (1 - up), up, math.sin(a) * (1 - up)])
                d /= np.linalg.norm(d)
                cr = r * rng.uniform(0.5, 0.72)
                nxt.append((x + d[0] * r * 0.75, y + d[1] * r * 0.75, z + d[2] * r * 0.75, cr, b))
        out += nxt
        layer = nxt
    return out


@njit(parallel=True, cache=True)
def bake(spheres, lo, vox, shape, octs):
    """Signed coverage field: about 1 inside, negative outside, billowed by noise."""
    nx, ny, nz = shape
    f = np.full((nx, ny, nz), -1.0, np.float32)
    for s in range(spheres.shape[0]):
        cx, cy, cz, r, b = spheres[s]
        reach = r * 1.6
        x0 = max(0, int((cx - reach - lo[0]) / vox)); x1 = min(nx, int((cx + reach - lo[0]) / vox) + 1)
        y0 = max(0, int((cy - reach - lo[1]) / vox)); y1 = min(ny, int((cy + reach - lo[1]) / vox) + 1)
        z0 = max(0, int((cz - reach - lo[2]) / vox)); z1 = min(nz, int((cz + reach - lo[2]) / vox) + 1)
        for i in prange(x0, x1):
            px = lo[0] + i * vox
            for j in range(y0, y1):
                py = lo[1] + j * vox
                flat = min(1.0, max(0.0, (py - b + 1.5) / 5.0))  # flat cloud base
                for k in range(z0, z1):
                    pz = lo[2] + k * vox
                    d = math.sqrt((px - cx) ** 2 + (py - cy) ** 2 + (pz - cz) ** 2)
                    v = (1 - d / r) * flat - 2.5 * (1 - flat)
                    if v > f[i, j, k]:
                        f[i, j, k] = v
    for i in prange(nx):
        px = lo[0] + i * vox
        for j in range(ny):
            py = lo[1] + j * vox
            for k in range(nz):
                if f[i, j, k] < -0.9:
                    continue
                pz = lo[2] + k * vox
                n1 = fbm(px * 0.035, py * 0.035, pz * 0.035, octs)
                n2 = fbm(px * 0.11, py * 0.11, pz * 0.11, 3)
                f[i, j, k] += (n1 - 0.5) * 0.9 + (n2 - 0.5) * 0.35
    return f


@njit(inline="always", cache=True)
def sample(f, lo, vox, x, y, z):
    nx, ny, nz = f.shape
    gx, gy, gz = (x - lo[0]) / vox, (y - lo[1]) / vox, (z - lo[2]) / vox
    if gx < 0 or gy < 0 or gz < 0 or gx >= nx - 1 or gy >= ny - 1 or gz >= nz - 1:
        return -1.0
    i, j, k = int(gx), int(gy), int(gz)
    u, v, w = gx - i, gy - j, gz - k
    c00 = f[i, j, k] + (f[i + 1, j, k] - f[i, j, k]) * u
    c10 = f[i, j + 1, k] + (f[i + 1, j + 1, k] - f[i, j + 1, k]) * u
    c01 = f[i, j, k + 1] + (f[i + 1, j, k + 1] - f[i, j, k + 1]) * u
    c11 = f[i, j + 1, k + 1] + (f[i + 1, j + 1, k + 1] - f[i, j + 1, k + 1]) * u
    c0 = c00 + (c10 - c00) * v
    c1 = c01 + (c11 - c01) * v
    return c0 + (c1 - c0) * w


@njit(inline="always", cache=True)
def dens(v):
    return min(1.0, max(0.0, v * 5.0))


@njit(parallel=True, cache=True)
def shadow(f, lo, vox, dx, dy, dz, sigma, steps):
    """Transmittance from every voxel toward a light direction."""
    nx, ny, nz = f.shape
    t = np.ones((nx, ny, nz), np.float32)
    st = vox * 1.5
    for i in prange(nx):
        for j in range(ny):
            for k in range(nz):
                if f[i, j, k] < -0.5:
                    continue
                x, y, z = lo[0] + i * vox, lo[1] + j * vox, lo[2] + k * vox
                acc = 0.0
                for s in range(steps):
                    x += dx * st; y += dy * st; z += dz * st
                    v = sample(f, lo, vox, x, y, z)
                    if v == -1.0 and s > 2:
                        break
                    acc += dens(v) * st
                t[i, j, k] = math.exp(-acc * sigma)
    return t


# ---------- render ----------

@njit(inline="always", cache=True)
def sky_color(dx, dy, dz):
    e = max(-0.2, dy)
    hz = math.exp(-max(e, 0.0) * 4.5)
    r = 0.02 + 0.04 * (1 - e) ** 5 + 0.95 * hz
    g = 0.16 + 0.24 * (1 - e) ** 4 + 0.42 * hz
    b = 0.55 + 0.30 * (1 - e) ** 3 - 0.05 * hz
    # glow toward the low sun on the left
    sg = max(0.0, dx * -0.8 + dz * -0.15 + dy * 0.2)
    glow = sg ** 6 * hz
    r += 1.1 * glow
    g += 0.55 * glow
    b += 0.15 * glow
    # cirrus streaks on a high plane
    if dy > 0.03:
        t = 900.0 / dy
        px, pz = dx * t, dz * t
        n = fbm(px * 0.0012, 0.0, pz * 0.0045, 5)
        a = min(1.0, max(0.0, (n - 0.64) / 0.12)) * 0.4 * min(1.0, dy * 6)
        r = r * (1 - a) + 1.5 * a
        g = g * (1 - a) + 0.9 * a
        b = b * (1 - a) + 0.75 * a
    return r, g, b


@njit(parallel=True, cache=True)
def render(f, ts, tu, lo, hi, vox, w, h, tan_y, pitch, sun, with_sky, sigma):
    img = np.zeros((h, w, 4), np.float32)
    aspect = w / h
    cp, sp = math.cos(pitch), math.sin(pitch)
    sun_col = (4.8, 2.35, 0.85)
    amb_col = (0.20, 0.22, 0.48)
    bnc_col = (0.45, 0.24, 0.30)
    for py in prange(h):
        for px in range(w):
            u = ((px + 0.5) / w * 2 - 1) * tan_y * aspect
            v = (1 - (py + 0.5) / h * 2) * tan_y
            dx, dy, dz = u, v * cp + sp, -v * sp + cp
            n = math.sqrt(dx * dx + dy * dy + dz * dz)
            dx, dy, dz = dx / n, dy / n, dz / n
            # ray / box
            t0, t1 = 0.0, 1e9
            for d, l, hh in ((dx, lo[0], hi[0]), (dy, lo[1], hi[1]), (dz, lo[2], hi[2])):
                if abs(d) < 1e-6:
                    continue
                ta, tb = l / d, hh / d
                if ta > tb:
                    ta, tb = tb, ta
                t0, t1 = max(t0, ta), min(t1, tb)
            ok = t1 > t0
            cr = cg = cb = 0.0
            T = 1.0
            if ok:
                mu = -(dx * sun[0] + dy * sun[1] + dz * sun[2])
                g1, g2 = 0.55, -0.25
                ph = 0.75 * (1 - g1 * g1) / (1 + g1 * g1 - 2 * g1 * mu) ** 1.5 \
                    + 0.25 * (1 - g2 * g2) / (1 + g2 * g2 - 2 * g2 * mu) ** 1.5
                t = t0 + hash3(px, py, 7) * vox  # jitter against banding
                while t < t1 and T > 0.005:
                    x, y, z = dx * t, dy * t, dz * t
                    base = sample(f, lo, vox, x, y, z)
                    if base < -0.35:
                        t += vox * 3.0
                        continue
                    ero = fbm(x * 0.28, y * 0.28, z * 0.28, 4) - 0.5
                    d = dens(base + ero * 0.45 * (1.2 - min(1.0, max(0.0, base))))
                    st = vox * 0.9
                    if d > 0.0:
                        s_sun = sample(ts, lo, vox, x, y, z)
                        s_up = sample(tu, lo, vox, x, y, z)
                        powder = 1.0 - 0.6 * math.exp(-d * 4.0)
                        lr = sun_col[0] * s_sun * ph * powder + amb_col[0] * s_up + bnc_col[0] * (1 - s_up)
                        lg = sun_col[1] * s_sun * ph * powder + amb_col[1] * s_up + bnc_col[1] * (1 - s_up)
                        lb = sun_col[2] * s_sun * ph * powder + amb_col[2] * s_up + bnc_col[2] * (1 - s_up)
                        haze = 1 - math.exp(-t * 0.0006)
                        lr = lr * (1 - haze) + 1.0 * haze
                        lg = lg * (1 - haze) + 0.62 * haze
                        lb = lb * (1 - haze) + 0.55 * haze
                        a = 1 - math.exp(-d * sigma * st)
                        cr += T * lr * a
                        cg += T * lg * a
                        cb += T * lb * a
                        T *= 1 - a
                    t += st
            if with_sky:
                sr, sg, sb = sky_color(dx, dy, dz)
                cr += T * sr
                cg += T * sg
                cb += T * sb
                img[py, px, 3] = 1.0
            else:
                img[py, px, 3] = 1 - T
            img[py, px, 0], img[py, px, 1], img[py, px, 2] = cr, cg, cb
    return img


def tonemap(rgb, exposure=1.0, sat=1.25, contrast=1.12):
    c = (1 - np.exp(-rgb * exposure)) ** (1 / 2.2)
    grey = c.mean(-1, keepdims=True)
    c = grey + (c - grey) * sat
    c = 0.5 + (c - 0.5) * contrast
    return np.clip(c * 255, 0, 255)


def volume(spheres, lo, hi, vox):
    lo, hi = np.array(lo, np.float64), np.array(hi, np.float64)
    shape = tuple(int(x) for x in np.ceil((hi - lo) / vox) + 1)
    sp = np.array(spheres, np.float64)
    f = bake(sp, lo, vox, shape, 4)
    ts = shadow(f, lo, vox, SUN[0], SUN[1], SUN[2], 0.16, 70)
    tu = shadow(f, lo, vox, 0.0, 1.0, 0.0, 0.08, 40)
    return f, ts, tu, lo, hi


def paint_sky():
    s = []
    s += cumulus(150, -30, 330, 260, 150, levels=4, n=18)  # big tower, right
    s += cumulus(-40, -30, 380, 130, 60, levels=3, n=10)
    s += cumulus(-190, -32, 360, 150, 70, levels=3, n=12)
    s += cumulus(-330, -34, 420, 140, 55, levels=3, n=10)
    for x in np.linspace(-360, 360, 10):  # low line along the horizon
        s += cumulus(x + rng.uniform(-20, 20), -46, 500 + rng.uniform(-30, 30), 100, 34, levels=2, n=7)
    f, ts, tu, lo, hi = volume(s, (-480, -50, 200), (480, 260, 620), 1.7)
    img = render(f, ts, tu, lo, hi, 1.7, W, H, math.tan(FOV_Y / 2), PITCH, SUN, True, 0.22)
    return Image.fromarray(tonemap(img[..., :3]).astype(np.uint8))


def paint_bank():
    s = []
    for x in np.linspace(-190, 190, 13):
        s += cumulus(x + rng.uniform(-10, 10), -55, 150 + rng.uniform(-25, 25), 80,
                     rng.uniform(70, 95), levels=3, n=8)
    f, ts, tu, lo, hi = volume(s, (-260, -60, 80), (260, 100, 240), 1.0)
    img = render(f, ts, tu, lo, hi, 1.0, W, H, math.tan(FOV_Y / 2), PITCH, SUN, False, 0.3)
    a = img[..., 3]
    rgb = img[..., :3] / np.maximum(a, 1e-4)[..., None]
    alpha = np.clip((a - 0.04) / 0.36, 0, 1)  # soft rim, solid body
    out = np.dstack([tonemap(rgb), alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


if __name__ == "__main__":
    paint_sky().save("src/assets/sky.webp", quality=84, method=6)
    paint_bank().save("src/assets/clouds.webp", quality=84, method=6)
    print("painted")
