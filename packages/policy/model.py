from __future__ import annotations

import torch
import torch.nn as nn


class DuelingQNetwork(nn.Module):
    """Dueling architecture: Q(s,a) = V(s) + A(s,a) - mean(A).

    Trunk is Linear -> ReLU -> Linear -> ReLU (no LayerNorm) so PyTorch
    weights export 1:1 to the zero-dependency TypeScript inference engine.
    """

    def __init__(self, state_dim: int = 31, action_dim: int = 11, hidden_dim: int = 256):
        super().__init__()
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.hidden_dim = hidden_dim

        self.feature_extractor = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
        )
        self.value_stream = nn.Sequential(
            nn.Linear(hidden_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 1),
        )
        self.advantage_stream = nn.Sequential(
            nn.Linear(hidden_dim, 128),
            nn.ReLU(),
            nn.Linear(128, action_dim),
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        features = self.feature_extractor(state)
        values = self.value_stream(features)
        advantages = self.advantage_stream(features)
        return values + (advantages - advantages.mean(dim=-1, keepdim=True))

    def get_decomposed_components(self, state: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
        features = self.feature_extractor(state)
        v = self.value_stream(features)
        a = self.advantage_stream(features)
        q = v + (a - a.mean(dim=-1, keepdim=True))
        return v, a, q
