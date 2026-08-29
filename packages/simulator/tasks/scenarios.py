from __future__ import annotations

import json
from pathlib import Path

import numpy as np

VAL_SCENARIOS_PATH = Path(__file__).resolve().parent / "val_scenarios.json"


def load_val_scenarios(wedge: str | None = None) -> dict[str, list[dict]] | list[dict]:
    data = json.loads(VAL_SCENARIOS_PATH.read_text())
    if wedge:
        return data.get(wedge, [])
    return data
