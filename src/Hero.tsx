import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { person, roles, works, type Work } from "./data";
import { N, pose } from "./pose";

// Wide banners crop badly to 9:16, so the wheel deals the portrait artwork.
const reel: Work[] = [
  ...works.filter((w) => !w.wide),
  { title: `About ${person.name}`, category: "Portrait", client: person.title, year: "", cover: person.portrait, href: "#about" },
];
const cards = Array.from({ length: N }, (_, i) => reel[i % reel.length]);
const covers = reel.map((w) => w.cover);
const LIFT_EASE = [0.5, 0, 0.15, 1] as const;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Last value written for every per-card style, so unchanged frames write nothing. */
type Slot = {
  el: HTMLAnchorElement | null;
  video: HTMLVideoElement | null;
  t: string;
  v: string;
  playing: boolean;
};

export default function Hero() {
  const deal = useMotionValue(0);
  const lift = useMotionValue(0);
  const [entering, setEntering] = useState(true);
  const [copy, setCopy] = useState<false | "fade" | "instant">(false);

  const frame = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const slots = useRef<Slot[]>(
    cards.map(() => ({ el: null, video: null, t: "", v: "", playing: false })),
  );
  const fit = useRef(1);
  const loaded = useRef(0);
  const done = useRef(false);
  const anims = useRef<AnimationPlaybackControls[]>([]);
  const copyTimer = useRef(0);
  const g = useRef({
    target: 0, rot: 0, vel: 0,
    down: false, dragging: false, suppress: false,
    startX: 0, lastX: 0, lastT: 0,
  });

  const skyOpacity = useTransform(lift, [0, 0.45], [0, 1]);
  const cloudY = useTransform(lift, [0, 1], ["105%", "0%"]);
  const loaderOpacity = useTransform(lift, [0, 0.2], [1, 0]);

  // Ends the entrance instantly: Escape, Tab, the skip button, reduced motion.
  const finish = () => {
    if (done.current) return;
    done.current = true;
    anims.current.forEach((a) => a.stop());
    clearTimeout(copyTimer.current);
    deal.set(1);
    lift.set(1);
    setEntering(false);
    setCopy("instant");
  };

  // Entrance: decode every cover, deal, then lift once dealt and ready.
  useEffect(() => {
    if (reduced) return finish();
    let cancelled = false;
    let n = 0;
    Promise.all(
      covers.map((src) => {
        const img = new Image();
        img.src = src;
        return img
          .decode()
          .catch(() => {})
          .then(() => void (loaded.current = ++n / covers.length));
      }),
    ).then(() => {
      if (cancelled || done.current) return;
      // ponytail: "ready" is the covers only; add video previews here if cards get clips.
      anims.current.push(
        animate(deal, 1, {
          duration: 2.6,
          ease: "linear",
          onComplete: () => {
            if (cancelled || done.current) return;
            copyTimer.current = window.setTimeout(() => setCopy("fade"), 1000);
            anims.current.push(
              animate(lift, 1, {
                duration: 1.9,
                ease: LIFT_EASE,
                onComplete: () => {
                  done.current = true;
                  setEntering(false);
                },
              }),
            );
          },
        }),
      );
    });
    return () => {
      cancelled = true;
      anims.current.forEach((a) => a.stop());
      clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!entering) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Tab") finish();
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [entering]);

  // Scene is sized to the hero frame, not the window.
  useEffect(() => {
    const el = frame.current!;
    const ro = new ResizeObserver(() => {
      fit.current = Math.min(el.clientHeight / 1180, el.clientWidth / 560);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The one animation loop: wheel physics, scene, every card, video, counter.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let sceneT = "";
    let count = "";
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const D = deal.get();
      const L = lift.get();
      const s = g.current;

      if (!s.dragging) {
        if (!reduced) s.target += 7 * L * dt;
        s.target += s.vel * dt;
        s.vel *= Math.exp(-dt * 3.2);
      }
      s.rot = reduced ? s.target : s.rot + (s.target - s.rot) * (1 - Math.exp(-dt * 9));

      const t = `scale(${(fit.current * (1 + 0.14 * L)).toFixed(4)}) rotateX(${(12 * L).toFixed(2)}deg)`;
      if (t !== sceneT) scene.current!.style.transform = sceneT = t;

      const c = String(Math.round(loaded.current * 100)).padStart(3, "0");
      if (c !== count && counter.current) counter.current.textContent = count = c;

      const live = L > 0.6 && !reduced;
      for (let i = 0; i < N; i++) {
        const slot = slots.current[i];
        if (!slot.el) continue;
        const p = pose(i, D, L, s.rot);
        if (p.visible && p.transform !== slot.t) slot.el.style.transform = slot.t = p.transform;
        const v = p.visible ? "visible" : "hidden";
        if (v !== slot.v) slot.el.style.visibility = slot.v = v;
        if (slot.video) {
          const play = live && p.visible && Math.abs(p.angle) < 40;
          if (play !== slot.playing) {
            slot.playing = play;
            if (play) slot.video.play().catch(() => {});
            else slot.video.pause();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Wheel needs a non-passive listener to stop horizontal swipes navigating back.
  useEffect(() => {
    const el = frame.current!;
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (horizontal) e.preventDefault();
      g.current.target += (horizontal ? e.deltaX : e.deltaY) * 0.04;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Degrees per pixel, so the card under the finger follows it.
  const degPerPx = () => {
    const L = lift.get();
    return 57.3 / ((580 + 430 * L) * (1 + 0.14 * L) * fit.current);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    Object.assign(g.current, {
      down: true, vel: 0, startX: e.clientX, lastX: e.clientX, lastT: e.timeStamp,
    });
  };

  const onPointerMove = (e: PointerEvent) => {
    const s = g.current;
    if (!s.down) return;
    if (!s.dragging) {
      if (Math.abs(e.clientX - s.startX) < 6) return;
      // Capture only once it is a drag, so a plain click still reaches its link.
      s.dragging = true;
      frame.current!.setPointerCapture(e.pointerId);
    }
    const dt = Math.max((e.timeStamp - s.lastT) / 1000, 0.001);
    const d = -(e.clientX - s.lastX) * degPerPx();
    s.target += d;
    s.vel = Math.max(-400, Math.min(400, 0.7 * (d / dt) + 0.3 * s.vel));
    s.lastX = e.clientX;
    s.lastT = e.timeStamp;
  };

  const onPointerUp = (e: PointerEvent) => {
    const s = g.current;
    if (s.dragging) {
      if (e.type === "pointercancel" || e.timeStamp - s.lastT > 80) s.vel = 0;
      s.suppress = true;
      setTimeout(() => (s.suppress = false), 0);
    }
    s.down = s.dragging = false;
  };

  const show = copy ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 };

  return (
    <section
      ref={frame}
      className="hero"
      aria-label="Introduction"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        if (g.current.suppress) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      <motion.div className="sky" style={{ opacity: skyOpacity }} aria-hidden />

      <div className="scene" ref={scene} role="list" aria-label="Selected work">
        {cards.map((w, i) => (
          <a
            key={i}
            role="listitem"
            ref={(el) => void (slots.current[i].el = el)}
            className="card"
            href={w.href}
            target={w.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            draggable={false}
            style={{ visibility: "hidden" }}
          >
            <span className="face front">
              <img src={w.cover} alt="" draggable={false} />
              {w.video && (
                <video
                  ref={(el) => void (slots.current[i].video = el)}
                  src={w.video}
                  muted
                  loop
                  playsInline
                  preload="none"
                  onPlaying={(e) => e.currentTarget.classList.add("on")}
                />
              )}
              <span className="cap" aria-hidden>{w.title}</span>
            </span>
            <span className="face back" aria-hidden>
              <span>{person.monogram}</span>
            </span>
            <span className="sr">
              {w.href.startsWith("http")
                ? `${w.title}, ${w.category} for ${w.client}, ${w.year} (opens in a new tab)`
                : w.title}
            </span>
          </a>
        ))}
      </div>

      <motion.div className="clouds" style={{ y: cloudY }} aria-hidden>
        <Clouds />
      </motion.div>

      <motion.header
        className="bar"
        initial={false}
        animate={show}
        transition={copy === "instant" ? { duration: 0 } : { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <a href="#top" className="mark">{person.monogram}</a>
        <nav>
          <a href="#work">Work</a>
          <a href="#about">About</a>
          <a href="#experience">Experience</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="pill" href="resume.pdf" target="_blank" rel="noreferrer">Resume</a>
      </motion.header>

      <motion.div
        className="headline"
        initial={false}
        animate={show}
        transition={copy === "instant" ? { duration: 0 } : { duration: 1, delay: 0.15, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <p className="eyebrow">{person.title}</p>
        <h1>{person.name}</h1>
        <p className="lede">
          Editing {roles.slice(0, -1).join(", ")} and {roles.at(-1)}. Drag the reel to look around.
        </p>
      </motion.div>

      {entering && (
        <motion.div className="loader" style={{ opacity: loaderOpacity }}>
          <span className="count" aria-live="off">
            <span ref={counter}>000</span>
          </span>
          <button type="button" className="skip" onClick={finish}>
            Skip intro
          </button>
        </motion.div>
      )}
    </section>
  );
}

/** Opaque cloud bank: three rows of lumps, each filled solid down to the bottom. */
function Clouds() {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const row = (base: number, rMin: number, rMax: number) => {
    const out: [number, number, number][] = [];
    for (let x = -120; x < 1720; ) {
      const r = rMin + rnd() * (rMax - rMin);
      out.push([x, base - r * 0.35 + rnd() * 24, r]);
      x += r * 1.05;
    }
    return out;
  };
  const layers = [
    { base: 210, r: [60, 120], fill: "#d9a99a" },
    { base: 300, r: [70, 130], fill: "#e8c7b5" },
    { base: 400, r: [80, 150], fill: "#f3ece2" },
  ];
  return (
    <svg viewBox="0 0 1600 700" preserveAspectRatio="xMidYMin slice">
      {layers.map((l) => (
        <g key={l.base} fill={l.fill}>
          {row(l.base, l.r[0], l.r[1]).map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} />
          ))}
          <rect x={-200} y={l.base} width={2000} height={700 - l.base} />
        </g>
      ))}
    </svg>
  );
}
