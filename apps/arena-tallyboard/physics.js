const TAU = 2 * Math.PI;

function assertPositive(name, value) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number`);
  }
}

function derivatives(state, lengthM, gravityMPerSecondSquared) {
  return {
    theta: state.omega,
    omega: -(gravityMPerSecondSquared / lengthM) * Math.sin(state.theta),
  };
}

function addScaled(state, slope, scale) {
  return { theta: state.theta + slope.theta * scale, omega: state.omega + slope.omega * scale };
}

/** Analytic small-angle period for a simple pendulum. */
export function theoreticalPeriod(lengthM, gravityMPerSecondSquared = 9.80665) {
  assertPositive("lengthM", lengthM);
  assertPositive("gravityMPerSecondSquared", gravityMPerSecondSquared);
  return TAU * Math.sqrt(lengthM / gravityMPerSecondSquared);
}

/** Integrate an ideal simple pendulum with fixed-step classical RK4. */
export function simulatePendulum({
  length_m: lengthM,
  mass_kg: massKg = 1,
  initial_angle_rad: initialAngleRad = 0.6,
  initial_angular_velocity_rad_s: initialAngularVelocityRadS = 0,
  gravity_m_s2: gravityMPerSecondSquared = 9.80665,
  duration_s: durationS = 12,
  dt_s: dtS = 0.005,
}) {
  assertPositive("length_m", lengthM);
  assertPositive("mass_kg", massKg);
  assertPositive("gravity_m_s2", gravityMPerSecondSquared);
  assertPositive("duration_s", durationS);
  assertPositive("dt_s", dtS);
  if (!Number.isFinite(initialAngleRad) || !Number.isFinite(initialAngularVelocityRadS)) {
    throw new RangeError("Initial angle and angular velocity must be finite numbers");
  }

  const steps = Math.ceil(durationS / dtS);
  if (steps > 500_000) throw new RangeError("Simulation is limited to 500,000 steps");
  const trace = [];
  let state = { theta: initialAngleRad, omega: initialAngularVelocityRadS };
  let time = 0;
  let maxAbsoluteEnergyError = 0;
  const energy = (value) => massKg * gravityMPerSecondSquared * lengthM * (1 - Math.cos(value.theta))
    + 0.5 * massKg * (lengthM * value.omega) ** 2;
  const initialEnergy = energy(state);
  const energyScale = Math.max(
    Math.abs(initialEnergy),
    massKg * gravityMPerSecondSquared * lengthM * 1e-12,
    Number.EPSILON,
  );

  const saveState = () => {
    const currentEnergy = energy(state);
    maxAbsoluteEnergyError = Math.max(maxAbsoluteEnergyError, Math.abs(currentEnergy - initialEnergy));
    trace.push({ time_s: time, angle_rad: state.theta, angular_velocity_rad_s: state.omega, energy_j: currentEnergy });
  };
  saveState();

  for (let index = 0; index < steps; index += 1) {
    const step = Math.min(dtS, durationS - time);
    if (step <= 0) break;
    const k1 = derivatives(state, lengthM, gravityMPerSecondSquared);
    const k2 = derivatives(addScaled(state, k1, step / 2), lengthM, gravityMPerSecondSquared);
    const k3 = derivatives(addScaled(state, k2, step / 2), lengthM, gravityMPerSecondSquared);
    const k4 = derivatives(addScaled(state, k3, step), lengthM, gravityMPerSecondSquared);
    state = {
      theta: state.theta + (step / 6) * (k1.theta + 2 * k2.theta + 2 * k3.theta + k4.theta),
      omega: state.omega + (step / 6) * (k1.omega + 2 * k2.omega + 2 * k3.omega + k4.omega),
    };
    time = Math.min(durationS, time + step);
    saveState();
  }

  return {
    solver: "RK4",
    evidence_status: "simulated",
    theoretical_period_s: theoreticalPeriod(lengthM, gravityMPerSecondSquared),
    simulated_period_s: estimatePeriod(trace),
    relative_energy_drift: maxAbsoluteEnergyError / energyScale,
    trace,
  };
}

function estimatePeriod(trace) {
  const upwardZeroCrossings = [];
  for (let index = 1; index < trace.length; index += 1) {
    const before = trace[index - 1];
    const after = trace[index];
    if (before.angle_rad < 0 && after.angle_rad >= 0 && after.angular_velocity_rad_s > 0) {
      const fraction = -before.angle_rad / (after.angle_rad - before.angle_rad);
      upwardZeroCrossings.push(before.time_s + fraction * (after.time_s - before.time_s));
    }
  }
  if (upwardZeroCrossings.length < 2) return null;
  const periods = upwardZeroCrossings.slice(1).map((crossing, index) => crossing - upwardZeroCrossings[index]);
  return periods.reduce((sum, period) => sum + period, 0) / periods.length;
}

const DEFAULTS = {
  length_m: 1,
  mass_kg: 1,
  initial_angle_rad: 0.610865,
  initial_angular_velocity_rad_s: 0,
  gravity_m_s2: 9.80665,
  duration_s: 12,
  dt_s: 0.005,
};

function formatNumber(value, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function interpolateTrace(trace, time) {
  let low = 0;
  let high = trace.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (trace[middle].time_s < time) low = middle + 1;
    else high = middle;
  }
  const right = trace[low];
  const left = trace[Math.max(0, low - 1)];
  const span = right.time_s - left.time_s;
  const fraction = span > 0 ? (time - left.time_s) / span : 0;
  return left.angle_rad + (right.angle_rad - left.angle_rad) * fraction;
}

/** Connect the standalone browser simulation to the Chronos panel in index.html. */
export function initChronosPanel() {
  const panel = document.getElementById("chronos");
  if (!panel) return;

  const fields = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, panel.querySelector(`[name="${key}"]`)]));
  const rod = panel.querySelector("#pendulumRod");
  const bob = panel.querySelector("#pendulumBob");
  const trail = panel.querySelector("#pendulumTrail");
  const readout = panel.querySelector("#chronosReadout");
  const simulationState = panel.querySelector("#chronosState");
  const verificationState = panel.querySelector("#verificationState");
  const playButton = panel.querySelector("#chronosPlay");
  let result;
  let animationStart = performance.now();
  let pausedAt = null;
  let requestId;

  function readParameters() {
    return Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, Number(input.value)]));
  }

  function redraw() {
    try {
      result = simulatePendulum(readParameters());
      const p = readParameters();
      const theta = p.initial_angle_rad;
      readout.innerHTML = `<div><span>Theoretical period · small angle</span><b>${formatNumber(result.theoretical_period_s, 3)} s</b></div>
        <div><span>Simulated period · RK4 trace</span><b>${result.simulated_period_s === null ? "Not enough cycles" : `${formatNumber(result.simulated_period_s, 3)} s`}</b></div>
        <div><span>Maximum relative energy drift</span><b>${result.relative_energy_drift.toExponential(2)}</b></div>
        <div><span>Evidence label</span><b>Independent simulated evidence</b></div>`;
      simulationState.textContent = `Browser RK4 · ${result.trace.length.toLocaleString()} steps · simulated, not measured`;
      trail.setAttribute("d", result.trace.map((point, index) => {
        const x = 160 + 155 * Math.sin(point.angle_rad);
        const y = 24 + 155 * Math.cos(point.angle_rad);
        return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(" "));
      drawAt(theta);
      animationStart = performance.now();
      if (pausedAt !== null) pausedAt = animationStart;
    } catch (error) {
      simulationState.textContent = `Invalid parameters: ${error.message}`;
      readout.innerHTML = "";
      result = null;
    }
  }

  function drawAt(theta) {
    const bobX = 160 + 155 * Math.sin(theta);
    const bobY = 24 + 155 * Math.cos(theta);
    rod.setAttribute("x2", bobX.toFixed(2));
    rod.setAttribute("y2", bobY.toFixed(2));
    bob.setAttribute("cx", bobX.toFixed(2));
    bob.setAttribute("cy", bobY.toFixed(2));
  }

  function animate(now) {
    if (result && pausedAt === null) {
      const duration = result.trace[result.trace.length - 1].time_s;
      if (duration > 0) {
        const elapsed = ((now - animationStart) / 1000 * 1.35) % duration;
        drawAt(interpolateTrace(result.trace, elapsed));
      }
    }
    requestId = requestAnimationFrame(animate);
  }

  Object.values(fields).forEach((input) => input.addEventListener("input", redraw));
  panel.querySelector("#chronosReset").addEventListener("click", () => {
    Object.entries(DEFAULTS).forEach(([key, value]) => { fields[key].value = String(value); });
    redraw();
    pausedAt = null;
    playButton.textContent = "Pause motion";
  });
  playButton.addEventListener("click", () => {
    if (pausedAt === null) {
      pausedAt = performance.now();
      playButton.textContent = "Resume motion";
    } else {
      animationStart += performance.now() - pausedAt;
      pausedAt = null;
      playButton.textContent = "Pause motion";
    }
  });
  panel.querySelector("#verifyPhysics").addEventListener("click", async () => {
    verificationState.textContent = "Checking optional local API…";
    try {
      const response = await fetch("/api/physics/pendulum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readParameters()),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (
        data.solver !== "RK4"
        || data.evidence_status !== "simulated"
        || !Number.isFinite(data.theoretical_period_s)
        || (data.simulated_period_s !== null && !Number.isFinite(data.simulated_period_s))
        || !Number.isFinite(data.relative_energy_drift)
        || !Array.isArray(data.trace)
      ) {
        throw new Error("response did not match the expected simulation contract");
      }
      verificationState.textContent = `Optional API contract OK · ${data.solver} · simulated evidence · backend period ${data.simulated_period_s === null ? "unavailable" : `${formatNumber(data.simulated_period_s, 3)} s`} · not a measurement or model evaluation`;
    } catch {
      verificationState.textContent = "Verification unavailable (local API offline or static hosting). The browser simulation remains available.";
    }
  });

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    pausedAt = performance.now();
    playButton.textContent = "Resume motion";
  }
  redraw();
  requestId = requestAnimationFrame(animate);
  window.addEventListener("pagehide", () => cancelAnimationFrame(requestId), { once: true });
}
