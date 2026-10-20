export const N = 34;
const STEP = 360 / N;

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const easeOutCubic = (t: number) => 1 - (1 - clamp01(t)) ** 3;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Wrap any angle into [-180, 180). */
export const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** 0 for the top card, 1 for the one straight down; mirror cards share a value. */
export const dealOrder = (i: number) => Math.min(i, N - i) / Math.floor(N / 2);

export type Pose = { angle: number; visible: boolean; transform: string };

/**
 * Where card i sits for a given deal (0..1), lift (0..1, already eased) and
 * wheel rotation in degrees (positive turns the deck to the left).
 */
export function pose(i: number, deal: number, lift: number, rot: number): Pose {
  const p = easeOutCubic((deal - dealOrder(i) * 0.6) / 0.4);
  const radius = 580 + 430 * lift;
  const pivotY = 500 + 314 * lift;
  const angle = wrap(i * STEP - 28 * lift - rot);
  const dist = -140 + (radius + 140) * p;
  const flip = 180 * (1 - p);
  const s = (0.7 + 0.3 * p) * (1 + 0.35 * lift);
  const z = -Math.abs(angle) * 0.6;
  return {
    angle,
    visible: p > 0 && Math.abs(angle) < 100,
    transform:
      `translate3d(0,${r2(pivotY)}px,${r2(z)}px) rotateZ(${r2(angle)}deg) ` +
      `translate3d(0,${r2(-dist)}px,0) rotateY(${r2(flip)}deg) scale(${r2(s)})`,
  };
}
