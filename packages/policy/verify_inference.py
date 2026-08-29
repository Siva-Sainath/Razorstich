from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np
import torch

from packages.policy.dqn import DQNAgent
from packages.policy.export_weights import export_dueling_weights, load_dueling_from_json
from packages.simulator.state import OBS_DIM


def ts_forward_from_weights(weights: dict, obs: np.ndarray) -> tuple[float, np.ndarray, np.ndarray]:
    """Mirror of packages/policy/src/inference.ts (v2, no LayerNorm)."""

    def relu(x: np.ndarray) -> np.ndarray:
        return np.maximum(x, 0)

    def matmul(input_vec: np.ndarray, weight: list, bias: list) -> np.ndarray:
        w = np.array(weight, dtype=np.float32)
        b = np.array(bias, dtype=np.float32)
        return (input_vec.astype(np.float32) @ w + b).astype(np.float32)

    obs = obs.astype(np.float32)
    shared = weights["shared"]
    if "ln1" in shared:
        raise ValueError("Legacy LayerNorm weights — retrain with v2 architecture")

    relu1 = relu(matmul(obs, shared["fc1"]["w"], shared["fc1"]["b"]))
    features = relu(matmul(relu1, shared["fc2"]["w"], shared["fc2"]["b"]))

    v_h = relu(matmul(features, weights["value_stream"]["fc1"]["w"], weights["value_stream"]["fc1"]["b"]))
    baseline = matmul(v_h, weights["value_stream"]["fc2"]["w"], weights["value_stream"]["fc2"]["b"])[0]

    a_h = relu(matmul(features, weights["advantage_stream"]["fc1"]["w"], weights["advantage_stream"]["fc1"]["b"]))
    advantages = matmul(a_h, weights["advantage_stream"]["fc2"]["w"], weights["advantage_stream"]["fc2"]["b"])

    mean_adv = advantages.mean()
    qvals = baseline + (advantages - mean_adv)
    return float(baseline), advantages, qvals


def verify_parity(
    checkpoint: Path,
    n_vectors: int = 1000,
    tol: float = 1e-4,
    atol: float = 1e-3,
    weights_path: Path | None = None,
) -> dict:
    agent = DQNAgent.load(checkpoint)
    weights_path = weights_path or Path("/tmp/parity_weights.json")
    weights = export_dueling_weights(agent, weights_path)
    json_model = load_dueling_from_json(weights)
    json_model.eval()
    rng = np.random.default_rng(0)
    max_v_diff = 0.0
    max_a_diff = 0.0
    max_q_diff = 0.0
    failures = 0

    for _ in range(n_vectors):
        obs = rng.random(OBS_DIM).astype(np.float32)
        with torch.no_grad():
            state = torch.tensor(obs, dtype=torch.float32).unsqueeze(0)
            v, a, q = json_model.get_decomposed_components(state)
            pv, pa, pq = (
                float(v.numpy().squeeze()),
                a.numpy().squeeze(),
                q.numpy().squeeze(),
            )
        tv, ta, tq = ts_forward_from_weights(weights, obs)
        v_diff = abs(pv - tv)
        a_diff = float(np.max(np.abs(pa - ta)))
        q_diff = float(np.max(np.abs(pq - tq)))
        rel_q = float(np.max(np.abs(pq - tq) / (np.abs(pq) + 1e-6)))
        max_v_diff = max(max_v_diff, v_diff)
        max_a_diff = max(max_a_diff, a_diff)
        max_q_diff = max(max_q_diff, q_diff)
        if v_diff > atol or a_diff > atol or (q_diff > atol and rel_q > tol):
            failures += 1

    latencies = []
    obs = rng.random(OBS_DIM).astype(np.float32)
    for _ in range(5000):
        t0 = time.perf_counter()
        ts_forward_from_weights(weights, obs)
        latencies.append((time.perf_counter() - t0) * 1000)
    p50_ms = float(np.percentile(latencies, 50))

    node_report: dict | None = None
    node_script = Path("scripts/verify_node_parity.mjs")
    if node_script.exists():
        proc = subprocess.run(
            ["node", str(node_script), str(weights_path), str(n_vectors), str(atol)],
            capture_output=True,
            text=True,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            try:
                node_report = json.loads(proc.stdout.strip())
            except json.JSONDecodeError:
                node_report = {"error": proc.stdout, "stderr": proc.stderr}

    report = {
        "vectors_tested": n_vectors,
        "relative_tolerance": tol,
        "absolute_tolerance": atol,
        "max_v_diff": max_v_diff,
        "max_a_diff": max_a_diff,
        "max_q_diff": max_q_diff,
        "failures": failures,
        "pass": failures == 0,
        "python_mirror_p50_ms": p50_ms,
        "node_parity": node_report,
        "weights_path": str(weights_path),
    }
    if node_report and node_report.get("pass") is False:
        report["pass"] = False

    out = Path("eval/results/inference_parity.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2))
    return report


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--checkpoint", type=Path, default=Path("eval/checkpoints/dueling_best.pt"))
    p.add_argument("--vectors", type=int, default=1000)
    args = p.parse_args()
    report = verify_parity(args.checkpoint, n_vectors=args.vectors)
    print(json.dumps(report, indent=2))
    sys.exit(0 if report["pass"] else 1)
