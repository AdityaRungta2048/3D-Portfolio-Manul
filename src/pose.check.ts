// Run with `npm run check`.
import assert from "node:assert/strict";
import { N, dealOrder, pose, wrap } from "./pose.ts";

assert.equal(wrap(190), -170);
assert.equal(wrap(-190), 170);

// Deal spreads out symmetrically from the top card.
assert.equal(dealOrder(0), 0);
assert.equal(dealOrder(N / 2), 1);
for (let i = 1; i < N; i++) assert.equal(dealOrder(i), dealOrder(N - i));

// Nothing is out before the deal, and the far side of the wheel never shows.
for (let i = 0; i < N; i++) assert.equal(pose(i, 0, 0, 0).visible, false);
assert.equal(pose(N / 2, 1, 1, 0).visible, false);

// Mid-flight the top card is still right of home and face down-ish.
const mid = pose(0, 0.1, 0, 0);
assert.ok(mid.angle > 0 && mid.angle < 70);

// Dealt: top card home, face up, full radius.
const dealt = pose(0, 1, 0, 0);
assert.equal(dealt.angle, 0);
assert.ok(dealt.transform.includes("translate3d(0,-580px,0) rotateY(0deg) scale(1)"));

// Lifted: wheel turned 28deg left, bigger, and the drift turns the same way.
const lifted = pose(0, 1, 1, 0);
assert.equal(lifted.angle, -28);
assert.ok(lifted.transform.startsWith("translate3d(0,814px,"));
assert.ok(lifted.transform.includes("translate3d(0,-1010px,0) rotateY(0deg) scale(1.35)"));
assert.ok(pose(0, 1, 1, 5).angle < lifted.angle);

console.log("pose ok");
