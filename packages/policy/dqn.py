from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from packages.policy.network import QNetwork
from packages.simulator.env import RecoveryEnv
from packages.simulator.state import OBS_DIM, action_mask
from packages.simulator.actions import NUM_ACTIONS


def get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


@dataclass
class DQNConfig:
    hidden: int = 128
    lr: float = 1e-3
    gamma: float = 0.95
    epsilon_start: float = 1.0
    epsilon_end: float = 0.05
    epsilon_decay_steps: int = 5000
    buffer_size: int = 50_000
    batch_size: int = 64
    target_update: int = 200
    train_steps: int = 8000


class ReplayBuffer:
    def __init__(self, capacity: int):
        self.buffer: deque = deque(maxlen=capacity)

    def push(self, s, a, r, ns, done, mask, nmask):
        self.buffer.append((s, a, r, ns, done, mask, nmask))

    def sample(self, batch_size: int):
        idx = np.random.choice(len(self.buffer), batch_size, replace=False)
        batch = [self.buffer[i] for i in idx]
        return map(np.array, zip(*batch))

    def __len__(self) -> int:
        return len(self.buffer)


class DQNAgent:
    def __init__(self, cfg: DQNConfig | None = None, device: torch.device | None = None):
        self.cfg = cfg or DQNConfig()
        self.device = device or get_device()
        self.policy = QNetwork(OBS_DIM, NUM_ACTIONS, self.cfg.hidden).to(self.device)
        self.target = QNetwork(OBS_DIM, NUM_ACTIONS, self.cfg.hidden).to(self.device)
        self.target.load_state_dict(self.policy.state_dict())
        self.optim = optim.Adam(self.policy.parameters(), lr=self.cfg.lr)
        self.buffer = ReplayBuffer(self.cfg.buffer_size)
        self.steps = 0

    def epsilon(self) -> float:
        t = min(self.steps, self.cfg.epsilon_decay_steps)
        frac = t / self.cfg.epsilon_decay_steps
        return self.cfg.epsilon_start + frac * (self.cfg.epsilon_end - self.cfg.epsilon_start)

    def select_action(self, obs: np.ndarray, mask: np.ndarray, explore: bool = True) -> int:
        valid = np.where(mask)[0]
        if len(valid) == 0:
            return 0
        if explore and np.random.random() < self.epsilon():
            return int(np.random.choice(valid))
        with torch.no_grad():
            q = self.policy(torch.tensor(obs, dtype=torch.float32, device=self.device).unsqueeze(0))
            q = q.cpu().numpy().squeeze()
            q[~mask] = -1e9
            return int(np.argmax(q))

    def train_step(self) -> float | None:
        if len(self.buffer) < self.cfg.batch_size:
            return None
        s, a, r, ns, done, mask, nmask = self.buffer.sample(self.cfg.batch_size)
        s_t = torch.tensor(s, dtype=torch.float32, device=self.device)
        a_t = torch.tensor(a, dtype=torch.int64, device=self.device).unsqueeze(1)
        r_t = torch.tensor(r, dtype=torch.float32, device=self.device)
        ns_t = torch.tensor(ns, dtype=torch.float32, device=self.device)
        done_t = torch.tensor(done, dtype=torch.float32, device=self.device)
        nmask_t = torch.tensor(nmask, dtype=torch.bool, device=self.device)

        q = self.policy(s_t).gather(1, a_t).squeeze()
        with torch.no_grad():
            # Double DQN: choose the next action with the online network,
            # then evaluate that action with the target network.
            online_next_q = self.policy(ns_t).masked_fill(~nmask_t, -torch.inf)
            next_actions = online_next_q.argmax(dim=1, keepdim=True)
            target_next_q = self.target(ns_t).gather(1, next_actions).squeeze(1)
            has_valid_action = nmask_t.any(dim=1)
            max_next_t = torch.where(
                has_valid_action,
                target_next_q,
                torch.zeros_like(target_next_q),
            )
            target = r_t + self.cfg.gamma * max_next_t * (1 - done_t)

        loss = nn.functional.smooth_l1_loss(q, target)
        self.optim.zero_grad()
        loss.backward()
        self.optim.step()
        self.steps += 1
        if self.steps % self.cfg.target_update == 0:
            self.target.load_state_dict(self.policy.state_dict())
        return float(loss.item())

    def run_episode(self, env: RecoveryEnv, explore: bool = True) -> dict:
        obs, info = env.reset()
        total_r = 0.0
        while True:
            mask = info["action_mask"]
            action = self.select_action(obs, mask, explore=explore)
            next_obs, reward, term, trunc, info = env.step(action)
            if explore and env.state is not None:
                nmask = action_mask(env.state) if not (term or trunc) else mask
                self.buffer.push(obs, action, reward, next_obs, term or trunc, mask, nmask)
                self.train_step()
            total_r += reward
            obs = next_obs
            if term or trunc:
                break
        assert env.state is not None
        return {
            "reward": total_r,
            "recovered": env.state.recovered,
            "amount_inr": env.state.amount_inr,
            "duplicate": env.state.duplicate_incident,
            "reason": env.state.failure_reason,
        }

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(
            {
                "policy_state": self.policy.state_dict(),
                "cfg": self.cfg.__dict__,
                "steps": self.steps,
                "obs_dim": OBS_DIM,
                "n_actions": NUM_ACTIONS,
            },
            path,
        )

    @classmethod
    def load(cls, path: Path, device: torch.device | None = None) -> "DQNAgent":
        ckpt = torch.load(path, map_location=device or get_device(), weights_only=False)
        cfg = DQNConfig(**ckpt["cfg"])
        agent = cls(cfg, device)
        agent.policy.load_state_dict(ckpt["policy_state"])
        agent.target.load_state_dict(ckpt["policy_state"])
        agent.steps = ckpt.get("steps", 0)
        return agent

    def q_values(self, obs: np.ndarray, mask: np.ndarray) -> dict[str, float]:
        from packages.simulator.actions import ACTION_NAMES

        with torch.no_grad():
            q = self.policy(torch.tensor(obs, dtype=torch.float32, device=self.device).unsqueeze(0))
            q = q.cpu().numpy().squeeze()
        return {ACTION_NAMES[i]: float(q[i]) if mask[i] else float("nan") for i in range(NUM_ACTIONS)}


# re-export for env
from packages.simulator.state import action_mask  # noqa: E402
