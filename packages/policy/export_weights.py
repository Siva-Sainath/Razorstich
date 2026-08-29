from __future__ import annotations

import json
from pathlib import Path

import torch
import torch.nn as nn

from packages.policy.dqn import DQNAgent
from packages.policy.model import DuelingQNetwork


def _linear_to_lists(layer: torch.nn.Linear) -> dict:
    w = layer.weight.detach().cpu().numpy().T.tolist()
    b = layer.bias.detach().cpu().numpy().tolist()
    return {"w": w, "b": b}


def export_dueling_weights(agent: DQNAgent, out_path: Path) -> dict:
    if not isinstance(agent.policy, DuelingQNetwork):
        raise TypeError("export_dueling_weights requires a DuelingQNetwork policy")

    net = agent.policy
    payload = {
        "policy_version": f"dueling-ddqn-v2-{agent.steps}",
        "state_dim": net.state_dim,
        "action_dim": net.action_dim,
        "hidden_dim": net.hidden_dim,
        "architecture": "dueling_double_dqn_v2",
        "shared": {
            "fc1": _linear_to_lists(net.feature_extractor[0]),
            "fc2": _linear_to_lists(net.feature_extractor[2]),
        },
        "value_stream": {
            "fc1": _linear_to_lists(net.value_stream[0]),
            "fc2": _linear_to_lists(net.value_stream[2]),
        },
        "advantage_stream": {
            "fc1": _linear_to_lists(net.advantage_stream[0]),
            "fc2": _linear_to_lists(net.advantage_stream[2]),
        },
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, separators=(",", ":")))
    return payload


def export_standard_weights(agent: DQNAgent, out_path: Path) -> dict:
    from packages.policy.network import QNetwork

    if not isinstance(agent.policy, QNetwork):
        raise TypeError("export_standard_weights requires a QNetwork policy")

    layers = []
    for module in agent.policy.net:
        if isinstance(module, torch.nn.Linear):
            layers.append(_linear_to_lists(module))
    payload = {
        "policy_version": f"standard-dqn-{agent.steps}",
        "architecture": "standard_dqn",
        "layers": layers,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, separators=(",", ":")))
    return payload


def load_dueling_from_json(weights: dict) -> DuelingQNetwork:
    net = DuelingQNetwork(
        weights["state_dim"],
        weights["action_dim"],
        weights["hidden_dim"],
    )

    def set_linear(seq: nn.Sequential, seq_idx: int, key: str, block_data: dict) -> None:
        layer = seq[seq_idx]
        assert isinstance(layer, nn.Linear)
        w = torch.tensor(block_data[key]["w"], dtype=torch.float32).T
        b = torch.tensor(block_data[key]["b"], dtype=torch.float32)
        layer.weight.data = w
        layer.bias.data = b

    shared = weights["shared"]
    # v2 format: fc1 -> ReLU -> fc2 -> ReLU
    if "ln1" in shared:
        raise ValueError(
            "Legacy LayerNorm weights are incompatible with v2 inference. Retrain and re-export."
        )
    set_linear(net.feature_extractor, 0, "fc1", shared)
    set_linear(net.feature_extractor, 2, "fc2", shared)

    value = weights["value_stream"]
    set_linear(net.value_stream, 0, "fc1", value)
    set_linear(net.value_stream, 2, "fc2", value)

    adv = weights["advantage_stream"]
    set_linear(net.advantage_stream, 0, "fc1", adv)
    set_linear(net.advantage_stream, 2, "fc2", adv)
    return net


def export_weights(checkpoint: Path, out_path: Path | None = None, wedge: str | None = None) -> dict:
    agent = DQNAgent.load(checkpoint)
    wedge = wedge or "checkout_failed"
    out_path = out_path or Path(f"packages/policy/weights/{wedge}.json")
    if agent.cfg.architecture == "dueling":
        payload = export_dueling_weights(agent, out_path)
        payload["wedge"] = wedge
    else:
        payload = export_standard_weights(agent, out_path)

    web_path = Path(f"apps/web/src/data/weights/{wedge}.json")
    web_path.parent.mkdir(parents=True, exist_ok=True)
    web_path.write_text(json.dumps(payload, separators=(",", ":")))

    if wedge == "checkout_failed":
        legacy = Path("apps/web/src/data/weights.json")
        legacy.write_text(json.dumps(payload, separators=(",", ":")))
        Path("packages/policy/src/weights.json").write_text(json.dumps(payload, separators=(",", ":")))
    return payload


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--checkpoint", type=Path, default=Path("eval/checkpoints/dqn_best.pt"))
    p.add_argument("--out", type=Path, default=None)
    p.add_argument("--wedge", type=str, default="checkout_failed")
    args = p.parse_args()
    out = args.out or Path(f"packages/policy/weights/{args.wedge}.json")
    export_weights(args.checkpoint, out, wedge=args.wedge)
    print(f"Exported weights to {out} and apps/web/src/data/weights/{args.wedge}.json")
