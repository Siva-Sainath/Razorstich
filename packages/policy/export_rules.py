from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from packages.policy.dqn import DQNAgent
from packages.simulator.env import RecoveryEnv
from packages.simulator.state import action_mask
HOURS_BUCKETS = {
    "0_6": 0.0,
    "6_24": 12.0,
    "24_72": 48.0,
}
CONTACT_BUCKETS = range(4)


def hours_bucket(hours: float) -> str:
    if hours < 6:
        return "0_6"
    if hours < 24:
        return "6_24"
    return "24_72"


def export_reason_preferences(agent: DQNAgent, out_path: Path) -> dict:
    """Export state-conditioned DQN preferences for Node.js inference."""
    env = RecoveryEnv("test", seed=0)
    reasons = [
        "insufficient_funds",
        "payment_cancelled",
        "authentication_failed",
        "gateway_error",
        "upi_timeout",
        "bank_outage",
    ]
    prefs: dict = {
        "policy_version": f"dqn-export-{agent.steps}",
        "hours_buckets": list(HOURS_BUCKETS),
        "contact_buckets": list(CONTACT_BUCKETS),
        "reasons": {},
    }

    for reason in reasons:
        prefs["reasons"][reason] = {}
        for bucket, hours in HOURS_BUCKETS.items():
            prefs["reasons"][reason][bucket] = {}
            for contacts in CONTACT_BUCKETS:
                env.reset()
                assert env.state is not None
                env.state.failure_reason = reason
                env.state.hours_since_failure = hours
                env.state.contacts_used = contacts
                obs = env.state.to_obs()
                mask = action_mask(env.state)
                q = agent.q_values(obs, mask)
                ranked = sorted(
                    [(k, v) for k, v in q.items() if not np.isnan(v)],
                    key=lambda x: -x[1],
                )
                prefs["reasons"][reason][bucket][str(contacts)] = {
                    "selected_action": ranked[0][0] if ranked else "wait",
                    "q_values": {
                        k: round(v, 4) for k, v in q.items() if not np.isnan(v)
                    },
                    "ranked": [
                        {"action": action, "q": round(value, 4)}
                        for action, value in ranked[:5]
                    ],
                }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(prefs, indent=2))
    return prefs


if __name__ == "__main__":
    import sys

    ckpt = Path(sys.argv[1] if len(sys.argv) > 1 else "eval/checkpoints/dqn_train_seed42.pt")
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "eval/checkpoints/policy_rules.json")
    agent = DQNAgent.load(ckpt)
    export_reason_preferences(agent, out)
    print(f"Exported to {out}")
