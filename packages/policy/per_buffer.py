from __future__ import annotations

import numpy as np


class SumTree:
    """Binary sum tree for proportional PER sampling."""

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.tree = np.zeros(2 * capacity - 1, dtype=np.float64)
        self.data: list | None = [None] * capacity
        self.write = 0
        self.n_entries = 0

    def _propagate(self, idx: int, change: float) -> None:
        parent = (idx - 1) // 2
        self.tree[parent] += change
        if parent != 0:
            self._propagate(parent, change)

    def _retrieve(self, idx: int, s: float) -> int:
        left = 2 * idx + 1
        right = left + 1
        if left >= len(self.tree):
            return idx
        if s <= self.tree[left]:
            return self._retrieve(left, s)
        return self._retrieve(right, s - self.tree[left])

    def total(self) -> float:
        return float(self.tree[0])

    def add(self, priority: float, data) -> None:
        idx = self.write + self.capacity - 1
        self.data[self.write] = data
        self.update(idx, priority)
        self.write = (self.write + 1) % self.capacity
        self.n_entries = min(self.n_entries + 1, self.capacity)

    def update(self, idx: int, priority: float) -> None:
        change = priority - self.tree[idx]
        self.tree[idx] = priority
        self._propagate(idx, change)

    def get(self, s: float):
        idx = self._retrieve(0, s)
        data_idx = idx - self.capacity + 1
        return idx, self.data[data_idx]


class PrioritizedReplayBuffer:
    def __init__(
        self,
        capacity: int,
        alpha: float = 0.6,
        beta_start: float = 0.4,
        beta_frames: int = 100_000,
        eps: float = 1e-6,
    ):
        self.tree = SumTree(capacity)
        self.alpha = alpha
        self.beta_start = beta_start
        self.beta_frames = beta_frames
        self.eps = eps
        self.max_priority = 1.0
        self.frame = 0

    def beta(self) -> float:
        frac = min(1.0, self.frame / max(self.beta_frames, 1))
        return self.beta_start + frac * (1.0 - self.beta_start)

    def push(self, transition, td_error: float | None = None) -> None:
        priority = (abs(td_error) + self.eps) ** self.alpha if td_error is not None else self.max_priority
        self.tree.add(priority, transition)
        self.max_priority = max(self.max_priority, priority)

    def sample(self, batch_size: int):
        self.frame += 1
        batch = []
        idxs = []
        priorities = []
        segment = self.tree.total() / batch_size
        for i in range(batch_size):
            s = np.random.uniform(segment * i, segment * (i + 1))
            idx, data = self.tree.get(s)
            while data is None:
                s = np.random.uniform(0, self.tree.total())
                idx, data = self.tree.get(s)
            batch.append(data)
            idxs.append(idx)
            priorities.append(self.tree.tree[idx])
        sampling_probs = np.array(priorities) / max(self.tree.total(), 1e-8)
        weights = (self.tree.n_entries * sampling_probs) ** (-self.beta())
        weights /= weights.max() if weights.max() > 0 else 1.0
        s, a, r, ns, done, mask, nmask = zip(*batch)
        return (
            np.array(s),
            np.array(a),
            np.array(r),
            np.array(ns),
            np.array(done),
            np.array(mask),
            np.array(nmask),
            np.array(idxs),
            np.array(weights, dtype=np.float32),
        )

    def update_priorities(self, idxs: np.ndarray, td_errors: np.ndarray) -> None:
        for idx, err in zip(idxs, td_errors):
            priority = (abs(float(err)) + self.eps) ** self.alpha
            self.tree.update(int(idx), priority)
            self.max_priority = max(self.max_priority, priority)

    def __len__(self) -> int:
        return self.tree.n_entries
