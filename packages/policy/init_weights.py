"""Export randomly initialized dueling weights so the web app can build before training."""

from __future__ import annotations

from pathlib import Path

from packages.policy.dqn import DQNAgent, DQNConfig


def main() -> None:
    agent = DQNAgent(DQNConfig(architecture="dueling"))
    ckpt = Path("eval/checkpoints/init_dueling.pt")
    agent.save(ckpt)
    from packages.policy.export_weights import export_weights

    export_weights(ckpt)
    print("Initialized weights.json from random DuelingQNetwork")


if __name__ == "__main__":
    main()
