from __future__ import annotations

import torch
import torch.nn as nn


class QNetwork(nn.Module):
  """Small MLP DQN — runs in seconds on MacBook M3 CPU/MPS."""

  def __init__(self, obs_dim: int, n_actions: int, hidden: int = 128):
    super().__init__()
    self.net = nn.Sequential(
      nn.Linear(obs_dim, hidden),
      nn.ReLU(),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.Linear(hidden, n_actions),
    )

  def forward(self, x: torch.Tensor) -> torch.Tensor:
    return self.net(x)
