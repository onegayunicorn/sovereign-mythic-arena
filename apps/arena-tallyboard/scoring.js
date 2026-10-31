export const AXIS_WEIGHTS = Object.freeze({
  mythic: 20,
  math: 25,
  physics: 25,
  repro: 15,
  craft: 15,
});

export function weightedTotal(scores) {
  const total = Object.entries(AXIS_WEIGHTS).reduce(
    (sum, [axis, weight]) => sum + (scores[axis] * weight) / 100,
    0,
  );
  return Math.round(total * 10) / 10;
}
