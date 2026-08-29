import { performance } from "node:perf_hooks";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function relu(v) {
  return v.map((x) => (x > 0 ? x : 0));
}

function matmul(input, weight, bias) {
  const out = new Array(bias.length);
  for (let i = 0; i < bias.length; i++) {
    let sum = bias[i];
    for (let j = 0; j < input.length; j++) sum += input[j] * weight[j][i];
    out[i] = sum;
  }
  return out;
}

function predict(stateVector, w) {
  const relu1 = relu(matmul(stateVector, w.shared.fc1.w, w.shared.fc1.b));
  const features = relu(matmul(relu1, w.shared.fc2.w, w.shared.fc2.b));
  const vH1 = relu(matmul(features, w.value_stream.fc1.w, w.value_stream.fc1.b));
  const baseline = matmul(vH1, w.value_stream.fc2.w, w.value_stream.fc2.b)[0];
  const aH1 = relu(matmul(features, w.advantage_stream.fc1.w, w.advantage_stream.fc1.b));
  const rawAdvantages = matmul(aH1, w.advantage_stream.fc2.w, w.advantage_stream.fc2.b);
  const meanAdvantage = rawAdvantages.reduce((a, b) => a + b, 0) / rawAdvantages.length;
  return {
    baseline,
    advantages: rawAdvantages,
    qValues: rawAdvantages.map((adv) => baseline + (adv - meanAdvantage)),
  };
}

const weightsPath = process.argv[2] || join(root, "apps/web/src/data/weights/checkout_failed.json");
const nVectors = parseInt(process.argv[3] || "1000", 10);
const atol = parseFloat(process.argv[4] || "0.001");

const weights = JSON.parse(readFileSync(weightsPath, "utf8"));
if (weights.shared?.ln1) {
  console.log(JSON.stringify({ pass: false, error: "Legacy LayerNorm weights — retrain with v2" }));
  process.exit(1);
}

const pyScript = `
import json, sys, numpy as np
from pathlib import Path
root = Path("${root}")
sys.path.insert(0, str(root))
from packages.policy.verify_inference import ts_forward_from_weights
from packages.simulator.state import OBS_DIM
weights = json.loads(Path("${weightsPath}").read_text())
rng = np.random.default_rng(0)
obs_list = [rng.random(OBS_DIM).astype(np.float32).tolist() for _ in range(${nVectors})]
out = []
for obs in obs_list:
    b, a, q = ts_forward_from_weights(weights, np.array(obs, dtype=np.float32))
    out.append({"baseline": b, "advantages": a.tolist(), "qValues": q.tolist()})
print(json.dumps({"obs": obs_list, "py": out}))
`;

const venvPython = join(root, ".venv/bin/python");
const pyBin = existsSync(venvPython) ? venvPython : "python3";
const proc = spawnSync(pyBin, ["-c", pyScript], { encoding: "utf8", cwd: root });
if (proc.status !== 0) {
  console.log(JSON.stringify({ pass: false, error: proc.stderr || proc.stdout }));
  process.exit(1);
}

const { obs, py } = JSON.parse(proc.stdout);
let maxVDiff = 0;
let maxQDiff = 0;
let failures = 0;

for (let i = 0; i < obs.length; i++) {
  const ts = predict(obs[i], weights);
  const pv = py[i];
  const vDiff = Math.abs(ts.baseline - pv.baseline);
  const qDiff = Math.max(...ts.qValues.map((q, j) => Math.abs(q - pv.qValues[j])));
  maxVDiff = Math.max(maxVDiff, vDiff);
  maxQDiff = Math.max(maxQDiff, qDiff);
  if (vDiff > atol || qDiff > atol) failures += 1;
}

const state = obs[0];
const samples = [];
for (let i = 0; i < 5000; i++) {
  const t0 = performance.now();
  predict(state, weights);
  samples.push(performance.now() - t0);
}
samples.sort((a, b) => a - b);

const report = {
  pass: failures === 0,
  vectors_tested: obs.length,
  absolute_tolerance: atol,
  max_v_diff: maxVDiff,
  max_q_diff: maxQDiff,
  failures,
  node_p50_ms: samples[Math.floor(samples.length * 0.5)],
  weights_path: weightsPath,
};
console.log(JSON.stringify(report, null, 2));
process.exit(report.pass ? 0 : 1);
