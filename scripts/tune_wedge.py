#!/usr/bin/env python3
"""Per-wedge hyperparameter mini-runs for Dueling DDQN wedge trainer."""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime, timezone
from pathlib import Path

from packages.policy.train.run import build_config_from_dict, config_to_dict, train_wedge
from packages.simulator.wedges import WEDGE_NAMES

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "eval" / "results"
HPO_DIR = RESULTS / "hpo_trials"

SEARCH_SPACE = {
    "lr": [5e-4, 1e-3, 2e-3],
    "batch_size": [64, 128, 256],
    "gamma": [0.96, 0.98, 0.99],
    "warmup_steps": [2000, 4000],
    "per_alpha": [0.5, 0.6, 0.7],
}


def sample_trials(n_trials: int, seed: int) -> list[dict]:
    rng = random.Random(seed)
    trials: list[dict] = []
    seen: set[tuple] = set()
    while len(trials) < n_trials:
        params = {key: rng.choice(values) for key, values in SEARCH_SPACE.items()}
        key = tuple(sorted(params.items()))
        if key in seen:
            continue
        seen.add(key)
        trials.append(params)
    return trials


def score_trial(curve: list[dict]) -> dict:
    if not curve:
        return {
            "peak_val_net_inr": float("-inf"),
            "final_val_net_inr": float("-inf"),
            "final_rollout_net_inr": float("-inf"),
            "overfit_penalty": 0.0,
            "score": float("-inf"),
        }

    peak_point = max(curve, key=lambda row: row["val_net_inr"])
    peak_val = float(peak_point["val_net_inr"])
    final_val = float(curve[-1]["val_net_inr"])
    final_rollout = float(curve[-1]["rollout_net_inr"])

    overfit_penalty = 0.0
    if len(curve) >= 2:
        prev_val = float(curve[-2]["val_net_inr"])
        if peak_val > 0 and final_val < peak_val * 0.9 and prev_val < peak_val * 0.9:
            overfit_penalty = peak_val - final_val

    score = peak_val - overfit_penalty
    return {
        "peak_val_net_inr": peak_val,
        "peak_episode": int(peak_point["episode"]),
        "final_val_net_inr": final_val,
        "final_rollout_net_inr": final_rollout,
        "overfit_penalty": overfit_penalty,
        "score": score,
    }


def run_trial(
    wedge: str,
    trial_id: int,
    params: dict,
    episodes: int,
    seed: int,
    validate_every: int,
) -> dict:
    base_cfg = {
        "architecture": "dueling",
        "hidden": 256,
        "polyak_tau": 0.005,
        "buffer_size": 100_000,
        "epsilon_decay_steps": 50_000,
        "train_steps": 100_000,
        "per_beta_frames": 200_000,
        **params,
    }
    cfg = build_config_from_dict(base_cfg, episodes=episodes)
    trial_dir = HPO_DIR / wedge / f"trial_{trial_id}"
    trial_dir.mkdir(parents=True, exist_ok=True)

    agent = train_wedge(
        wedge,
        episodes=episodes,
        seed=seed + trial_id,
        validate_every=validate_every,
        val_rollout_episodes=50,
        out_dir=trial_dir,
        cfg=cfg,
        save_milestones=None,
        export_weights=False,
    )

    curve_path = RESULTS / f"training_curve_{wedge}.json"
    curve = json.loads(curve_path.read_text()) if curve_path.exists() else []
    metrics = score_trial(curve)

    checkpoint = trial_dir / f"dueling_{wedge}_best.pt"
    return {
        "trial_id": trial_id,
        "params": params,
        "config": config_to_dict(cfg),
        "metrics": metrics,
        "curve": curve,
        "checkpoint": str(checkpoint) if checkpoint.exists() else None,
        "gradient_steps": getattr(agent, "steps", None),
    }


def select_best(trials: list[dict]) -> dict:
    return max(
        trials,
        key=lambda row: (
            row["metrics"]["score"],
            row["metrics"]["final_rollout_net_inr"],
            -row["metrics"]["overfit_penalty"],
        ),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Per-wedge HPO mini-runs")
    parser.add_argument("--wedge", choices=WEDGE_NAMES, required=True)
    parser.add_argument("--trials", type=int, default=6)
    parser.add_argument("--episodes", type=int, default=1500)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--validate-every", type=int, default=300)
    args = parser.parse_args()

    trial_params = sample_trials(args.trials, args.seed)
    completed: list[dict] = []

    print(f"[hpo] wedge={args.wedge} trials={args.trials} episodes={args.episodes}")
    for trial_id, params in enumerate(trial_params):
        print(f"[hpo] starting trial {trial_id + 1}/{args.trials}: {params}")
        try:
            result = run_trial(
                args.wedge,
                trial_id,
                params,
                episodes=args.episodes,
                seed=args.seed,
                validate_every=args.validate_every,
            )
        except RuntimeError as exc:
            if "out of memory" in str(exc).lower() and params.get("batch_size", 128) > 64:
                print(f"[hpo] OOM on trial {trial_id}, retrying with batch_size=64")
                params = {**params, "batch_size": 64}
                result = run_trial(
                    args.wedge,
                    trial_id,
                    params,
                    episodes=args.episodes,
                    seed=args.seed,
                    validate_every=args.validate_every,
                )
            else:
                raise
        completed.append(result)
        print(
            f"[hpo] trial {trial_id} score={result['metrics']['score']:.0f} "
            f"peak_val={result['metrics']['peak_val_net_inr']:.0f}"
        )

    best = select_best(completed)
    payload = {
        "wedge": args.wedge,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "episodes_per_trial": args.episodes,
        "validate_every": args.validate_every,
        "seed": args.seed,
        "search_space": SEARCH_SPACE,
        "trials": completed,
        "best_trial_id": best["trial_id"],
        "best_config": best["config"],
        "best_metrics": best["metrics"],
    }

    RESULTS.mkdir(parents=True, exist_ok=True)
    out_path = RESULTS / f"hpo_{args.wedge}.json"
    best_path = RESULTS / f"hpo_{args.wedge}_best.json"
    out_path.write_text(json.dumps(payload, indent=2))
    best_path.write_text(json.dumps(best["config"], indent=2))
    print(f"[hpo] wrote {out_path}")
    print(f"[hpo] best trial={best['trial_id']} score={best['metrics']['score']:.0f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
