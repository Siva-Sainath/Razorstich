"""RazorStitch LLM stubs: prompts + benchmark scoring."""

from packages.llm.benchmark_stub import score_copy
from packages.llm.prompts import (
    REASON_TONE_MAPPING,
    TEMPLATES,
    get_recovery_prompt,
)

__all__ = [
    "get_recovery_prompt",
    "score_copy",
    "REASON_TONE_MAPPING",
    "TEMPLATES",
]
