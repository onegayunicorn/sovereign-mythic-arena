import assert from "node:assert/strict";
import test from "node:test";
import { simulatePendulum, theoreticalPeriod } from "./physics.js";

test("small-angle RK4 period converges to the analytic simple-pendulum period", () => {
  const length = 1.7;
  const gravity = 9.80665;
  const result = simulatePendulum({
    length_m: length,
    mass_kg: 0.8,
    initial_angle_rad: 0.01,
    initial_angular_velocity_rad_s: 0,
    gravity_m_s2: gravity,
    duration_s: 20,
    dt_s: 0.002,
  });

  assert.equal(result.solver, "RK4");
  assert.equal(result.evidence_status, "simulated");
  assert.ok(result.simulated_period_s !== null);
  assert.ok(Math.abs(result.simulated_period_s - theoreticalPeriod(length, gravity)) / theoreticalPeriod(length, gravity) < 1e-5);
});

test("RK4 conserves simple-pendulum energy with bounded drift", () => {
  const result = simulatePendulum({
    length_m: 1.2,
    mass_kg: 2.3,
    initial_angle_rad: 0.8,
    initial_angular_velocity_rad_s: 0.15,
    gravity_m_s2: 9.81,
    duration_s: 60,
    dt_s: 0.01,
  });

  assert.ok(result.trace.length > 2_000);
  assert.ok(result.relative_energy_drift < 1e-6, `relative drift was ${result.relative_energy_drift}`);
  assert.ok(result.trace.every((sample) => Number.isFinite(sample.energy_j)));
});
