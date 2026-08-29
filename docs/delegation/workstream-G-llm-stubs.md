# Workstream G — LLM notify copy stubs (not runtime policy)

## Task
Create `packages/llm/` for **empathetic recovery message drafting** (benchmark/ablation only — DQN chooses action, LLM drafts copy):

1. `README.md` — scope: copy generation only, never overrides policy action
2. `prompts.py` — templates for `notify_customer` and `resend_link` by failure_reason (insufficient_funds = patient, gateway_error = technical)
3. `fixtures.json` — 6 example inputs/outputs for demo UI ghost text
4. `benchmark_stub.py` — function `score_copy(tone: str, failure_reason: str) -> float` placeholder 0–1 (no API key required)

## Constraints
- No OpenAI/Anthropic API calls — stubs only
- Do not import into `apps/web` API routes yet
