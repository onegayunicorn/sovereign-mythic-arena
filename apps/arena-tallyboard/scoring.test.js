import assert from "node:assert/strict";
import test from "node:test";
import { AXIS_WEIGHTS, weightedTotal } from "./scoring.js";

test("demo axis weights sum to 100 percent", () => {
  assert.equal(Object.values(AXIS_WEIGHTS).reduce((sum, weight) => sum + weight, 0), 100);
});

test("weightedTotal computes the demo weighted arithmetic mean", () => {
  assert.equal(
    weightedTotal({ mythic: 100, math: 80, physics: 60, repro: 40, craft: 20 }),
    64,
  );
  assert.equal(
    weightedTotal({ mythic: 100, math: 100, physics: 100, repro: 100, craft: 100 }),
    100,
  );
});
