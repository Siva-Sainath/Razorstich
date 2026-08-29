from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from packages.policy.model import DuelingQNetwork
from packages.policy.network import QNetwork
from packages.policy.per_buffer import PrioritizedReplayBuffer
from packages.simulator.env import RecoveryEnv
from packages.simulator.state import OBS_DIM, action_mask
from packages.simulator.actions import ACTION_NAMES, NUM_ACTIONS


def get_device() -> torch.device:
    if torch.backends.mps.is_available():
        return torch.device("mps")
    if torch.cuda.is_available():
        return torch.device("cuda")
    return torch.device("cpu")


@dataclass
class DQNConfig:
    architecture: Literal["dueling", "standard"] = "dueling"
    hidden: int = 256
    lr: float = 1e-3
    gamma: float = 0.98
    epsilon_start: float = 1.0
    epsilon_end: float = 0.05
    epsilon_decay_steps: int = 50_000
    buffer_size: int = 100_000
    batch_size: int = 128
    warmup_steps: int = 2000
    target_update: int = 0  # 0 = polyak only
    polyak_tau: float = 0.005
    use_per: bool = True
    per_alpha: float = 0.6
    per_beta_start: float = 0.4
    per_beta_frames: int = 200_000
    train_steps: int = 100_000
    use_cosine_lr: bool = True


def _build_network(cfg: DQNConfig) -> nn.Module:
    if cfg.architecture == "dueling":
        return DuelingQNetwork(OBS_DIM, NUM_ACTIONS, cfg.hidden)
    return QNetwork(OBS_DIM, NUM_ACTIONS, cfg.hidden)


class DQNAgent:
    name = "dqn"

    def __init__(self, cfg: DQNConfig | None = None, device: torch.device | None = None):
        self.cfg = cfg or DQNConfig()
        self.device = device or get_device()
        self.name = "dueling_double_dqn" if self.cfg.architecture == "dueling" else "standard_dqn"
        self.policy = _build_network(self.cfg).to(self.device)
        self.target = _build_network(self.cfg).to(self.device)
        self.target.load_state_dict(self.policy.state_dict())
        self.optim = optim.Adam(self.policy.parameters(), lr=self.cfg.lr)
        self.scheduler = (
            optim.lr_scheduler.CosineAnnealingLR(self.optim, T_max=max(self.cfg.train_steps, 1))
            if self.cfg.use_cosine_lr
            else None
        )
        self.buffer = (
            PrioritizedReplayBuffer(
                self.cfg.buffer_size,
                alpha=self.cfg.per_alpha,
                beta_start=self.cfg.per_beta_start,
                beta_frames=self.cfg.per_beta_frames,
            )
            if self.cfg.use_per
            else _UniformReplayBuffer(self.cfg.buffer_size)
        )
        self.steps = 0
        self._last_loss: float | None = None

    def epsilon(self) -> float:
        t = min(self.steps, self.cfg.epsilon_decay_steps)
        frac = t / max(self.cfg.epsilon_decay_steps, 1)
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

    def _double_dqn_target(
        self, ns_t: torch.Tensor, nmask_t: torch.Tensor, r_t: torch.Tensor, done_t: torch.Tensor
    ) -> torch.Tensor:
        with torch.no_grad():
            online_next_q = self.policy(ns_t).masked_fill(~nmask_t, -torch.inf)
            next_actions = online_next_q.argmax(dim=1, keepdim=True)
            target_next_q = self.target(ns_t).gather(1, next_actions).squeeze(1)
            has_valid = nmask_t.any(dim=1)
            max_next = torch.where(has_valid, target_next_q, torch.zeros_like(target_next_q))
            return r_t + self.cfg.gamma * max_next * (1 - done_t)

    def train_step(self) -> float | None:
        if len(self.buffer) < max(self.cfg.batch_size, self.cfg.warmup_steps):
            return None

        sample = self.buffer.sample(self.cfg.batch_size)
        if self.cfg.use_per:
            s, a, r, ns, done, mask, nmask, idxs, is_weights = sample
            is_w = torch.tensor(is_weights, dtype=torch.float32, device=self.device)
        else:
            s, a, r, ns, done, mask, nmask = sample
            is_w = None
            idxs = None

        s_t = torch.tensor(s, dtype=torch.float32, device=self.device)
        a_t = torch.tensor(a, dtype=torch.int64, device=self.device).unsqueeze(1)
        r_t = torch.tensor(r, dtype=torch.float32, device=self.device)
        ns_t = torch.tensor(ns, dtype=torch.float32, device=self.device)
        done_t = torch.tensor(done, dtype=torch.float32, device=self.device)
        nmask_t = torch.tensor(nmask, dtype=torch.bool, device=self.device)

        q = self.policy(s_t).gather(1, a_t).squeeze()
        target = self._double_dqn_target(ns_t, nmask_t, r_t, done_t)

        td_errors = (q - target).detach()
        if is_w is not None:
            loss = (is_w * nn.functional.smooth_l1_loss(q, target, reduction="none")).mean()
        else:
            loss = nn.functional.smooth_l1_loss(q, target)

        self.optim.zero_grad()
        loss.backward()
        self.optim.step()
        if self.scheduler is not None:
            self.scheduler.step()

        self.steps += 1
        if self.cfg.target_update > 0 and self.steps % self.cfg.target_update == 0:
            self.target.load_state_dict(self.policy.state_dict())
        elif self.cfg.polyak_tau > 0:
            with torch.no_grad():
                for tp, p in zip(self.target.parameters(), self.policy.parameters()):
                    tp.data.mul_(1 - self.cfg.polyak_tau).add_(self.cfg.polyak_tau * p.data)

        if idxs is not None:
            self.buffer.update_priorities(idxs, td_errors.cpu().numpy())

        self._last_loss = float(loss.item())
        return self._last_loss

    def run_episode(self, env, explore: bool = True) -> dict:
        obs, info = env.reset()
        total_r = 0.0
        while True:
            mask = info["action_mask"]
            action = self.select_action(obs, mask, explore=explore)
            next_obs, reward, term, trunc, info = env.step(action)
            if explore:
                nmask = info.get("action_mask", mask) if not (term or trunc) else mask
                self.buffer.push((obs, action, reward, next_obs, term or trunc, mask, nmask))
                self.train_step()
            total_r += reward
            obs = next_obs
            if term or trunc:
                break
        state = env.state
        return {
            "reward": total_r,
            "recovered": getattr(state, "recovered", False),
            "amount_inr": getattr(state, "amount_inr", 0),
            "duplicate": getattr(state, "duplicate_incident", getattr(state, "duplicate", False)),
            "reason": getattr(state, "failure_reason", getattr(state, "reason", "")),
            "hours_to_recovery": getattr(state, "hours_since_failure", getattr(state, "hours", 0))
            if getattr(state, "recovered", False)
            else None,
        }

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        torch.save(
            {
                "policy_state": self.policy.state_dict(),
                "target_state": self.target.state_dict(),
                "cfg": self.cfg.__dict__,
                "steps": self.steps,
                "obs_dim": OBS_DIM,
                "n_actions": NUM_ACTIONS,
                "architecture": self.cfg.architecture,
            },
            path,
        )

    @classmethod
    def load(cls, path: Path, device: torch.device | None = None) -> "DQNAgent":
        ckpt = torch.load(path, map_location=device or get_device(), weights_only=False)
        cfg = DQNConfig(**ckpt["cfg"])
        agent = cls(cfg, device)
        agent.policy.load_state_dict(ckpt["policy_state"])
        if "target_state" in ckpt:
            agent.target.load_state_dict(ckpt["target_state"])
        else:
            agent.target.load_state_dict(ckpt["policy_state"])
        agent.steps = ckpt.get("steps", 0)
        return agent

    def q_values(self, obs: np.ndarray, mask: np.ndarray) -> dict[str, float]:
        with torch.no_grad():
            q = self.policy(torch.tensor(obs, dtype=torch.float32, device=self.device).unsqueeze(0))
            q = q.cpu().numpy().squeeze()
        return {ACTION_NAMES[i]: float(q[i]) if mask[i] else float("nan") for i in range(NUM_ACTIONS)}

    def policy_telemetry(self, obs: np.ndarray, mask: np.ndarray) -> dict:
        with torch.no_grad():
            state = torch.tensor(obs, dtype=torch.float32, device=self.device).unsqueeze(0)
            if isinstance(self.policy, DuelingQNetwork):
                v, a, q = self.policy.get_decomposed_components(state)
                baseline = float(v.cpu().numpy().squeeze())
                advantages = a.cpu().numpy().squeeze()
                qvals = q.cpu().numpy().squeeze()
            else:
                qvals = self.policy(state).cpu().numpy().squeeze()
                baseline = float(np.mean(qvals))
                advantages = qvals - baseline

        q_map = {ACTION_NAMES[i]: float(qvals[i]) for i in range(NUM_ACTIONS)}
        adv_map = {ACTION_NAMES[i]: float(advantages[i]) for i in range(NUM_ACTIONS)}
        best = self.select_action(obs, mask, explore=False)
        return {
            "selected_action": ACTION_NAMES[best],
            "action_index": best,
            "baseline_value": baseline,
            "advantages": adv_map,
            "q_values": q_map,
            "action_mask": mask.tolist(),
        }


class _UniformReplayBuffer:
    def __init__(self, capacity: int):
        from collections import deque

        self.buffer: deque = deque(maxlen=capacity)

    def push(self, transition, td_error: float | None = None) -> None:
        self.buffer.append(transition)

    def sample(self, batch_size: int):
        idx = np.random.choice(len(self.buffer), batch_size, replace=False)
        batch = [self.buffer[i] for i in idx]
        return map(np.array, zip(*batch))

    def update_priorities(self, idxs, td_errors) -> None:
        pass

    def __len__(self) -> int:
        return len(self.buffer)
