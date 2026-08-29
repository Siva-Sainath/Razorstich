# RazorStitch — LLM Empathetic Recovery Message Drafting

This package handles the dynamic generation of recovery communication copy for payment failures.

## Scope & Architecture Constraint
- **Copy Generation Only**: The LLM's role is strictly limited to drafting context-appropriate, empathetic message copy once an action is selected.
- **No Runtime Policy Decision**: The LLM *never* overrides or participates in selecting the recovery action (e.g. wait, retry, notify, resend link). Action selection is determined entirely by the DQN policy or rule-based heuristics.
- **Ablation & Benchmarking Focus**: This package is currently implemented as a stub/fixture setup for evaluation, UI demonstrations, and offline copy tone scoring. No external LLM provider calls (OpenAI, Anthropic, etc.) are executed.

## Core Modules

1. **`prompts.py`**: Defines message templates mapped by recovery action and transaction failure reason:
   - `insufficient_funds` failures map to **patient** (empathetic) templates.
   - `gateway_error` and bank outages map to **technical** (transparent/factual) templates.
   - Fallbacks handle custom or unrecognized failure reasons gracefully.

2. **`benchmark_stub.py`**: Contains a mock evaluation function `score_copy(tone: str, failure_reason: str) -> float` yielding alignment scores (0.0 to 1.0) without requiring LLM provider APIs.

3. **`fixtures.json`**: Includes 6 standard payment recovery copy scenarios to populate UI ghost text/placeholders in demo environments.

## Integration Lifecycle
At runtime:
1. DQN/Heuristic policy selects the recovery action (e.g., `NOTIFY_CUSTOMER` or `RESEND_LINK`).
2. The agent queries `packages.llm.prompts.get_recovery_prompt(...)` to draft the message body.
3. The generated copy is handed to the notification service (e.g., SMS/Email/WhatsApp adapter).
