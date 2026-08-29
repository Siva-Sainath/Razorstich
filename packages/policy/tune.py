from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from packages.policy.dqn import DQNAgent, DQNConfig, get_device
from packages.policy.train import train_dqn


def objective(trial) -> float:
    lr = trial.suggest_float("lr", 1e-4, 1e-2, log=True)
    batch_size = trial.suggest_categorical("batch_size", [64, 128, 256])
    polyak_tau = trial.suggest_float("polyak_tau", 0.001, 0.01, log=True)
    use_hard_update = trial.suggest_categorical("use_hard_update", [False, True])
    target_update = trial.suggest_int("target_update", 100, 1000, step=100) if use_hard_update else 0
    hidden = trial.suggest_categorical("hidden", [128, 256])
    per_alpha = trial.suggest_float("per_alpha", 0.4, 0.8)

    cfg = DQNConfig(
        architecture="dueling",
        lr=lr,
        batch_size=batch_size,
        polyak_tau=polyak_tau if not use_hard_update else 0.0,
        target_update=target_update,
        hidden=hidden,
        per_alpha=per_alpha,
        buffer_size=100_000,
        warmup_steps=5000,
        train_steps=6000,
    )
    seed = 42 + trial.number
    agent = train_dqn(
        seed=seed,
        episodes=600,
        cfg=cfg,
        out_dir=Path("eval/checkpoints/optuna"),
        checkpoint_name=f"trial_{trial.number}.pt",
        validate_every=200,
        val_episodes=150,
    )
    from packages.policy.baselines import evaluate_policy

    val = evaluate_policy(agent, "val", 200, seed + 999)
    trial.set_user_attr("val_recovery_rate", val["recovery_rate"])
    trial.set_user_attr("val_duplicates", val["duplicate_incidents"])
    return val["net_recovered_value_inr"]


def run_study(n_trials: int = 50, storage: str | None = None) -> dict:
    import optuna

    study = optuna.create_study(
        direction="maximize",
        study_name="razorstitch_dueling_ddqn",
        storage=storage,
        load_if_exists=bool(storage),
    )
    study.optimize(objective, n_trials=n_trials, show_progress_bar=True)

    best = study.best_trial
    best_cfg = DQNConfig(
        architecture="dueling",
        lr=best.params["lr"],
        batch_size=best.params["batch_size"],
        polyak_tau=best.params["polyak_tau"] if not best.params.get("use_hard_update") else 0.0,
        target_update=best.params.get("target_update", 0) if best.params.get("use_hard_update") else 0,
        hidden=best.params["hidden"],
        per_alpha=best.params["per_alpha"],
        buffer_size=100_000,
        warmup_steps=5000,
    )
    final_agent = train_dqn(
        seed=2025,
        episodes=2000,
        cfg=best_cfg,
        out_dir=Path("eval/checkpoints"),
        checkpoint_name="dueling_best.pt",
    )
    from packages.policy.export_weights import export_weights

    export_weights(Path("eval/checkpoints/dueling_best.pt"))

    out = {
        "best_value": best.value,
        "best_params": best.params,
        "best_trial": best.number,
        "checkpoint": "eval/checkpoints/dueling_best.pt",
    }
    out_path = Path("eval/results/optuna_best.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, indent=2))
    return out


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--trials", type=int, default=50)
    p.add_argument("--quick", action="store_true", help="Run 3 trials for smoke test")
    args = p.parse_args()
    run_study(n_trials=3 if args.quick else args.trials)
