import { performance } from "node:perf_hooks";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const wedge = process.argv[2] || "checkout_failed";
const weights = JSON.parse(
  readFileSync(join(root, `apps/web/src/data/weights/${wedge}.json`), "utf8")
);

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
  return rawAdvantages.map((adv) => baseline + (adv - meanAdvantage));
}

const state = Array.from({ length: 31 }, (_, i) => (i + 1) / 31);
const samples = [];
for (let i = 0; i < 10000; i++) {
  const t0 = performance.now();
  predict(state, weights);
  samples.push(performance.now() - t0);
}
samples.sort((a, b) => a - b);
const p50 = samples[Math.floor(samples.length * 0.5)];
const p95 = samples[Math.floor(samples.length * 0.95)];
console.log(JSON.stringify({ wedge, p50_ms: p50, p95_ms: p95, pass: p50 < 1.5 }, null, 2));
