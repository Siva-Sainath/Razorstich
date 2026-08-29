# Delegation Orchestration — RazorStitch

## Repo root
`/Users/siva/Documents/Recovery_agent`

## Conventions
- Read `contracts/*.schema.json` before writing API-facing docs
- Do not modify `apps/web/src/app/api/*` (Cursor owns webhooks)
- Simulator and DQN already exist — do not rewrite `packages/simulator/` or `packages/policy/dqn.py`

## Active agy workstreams (this session)
| WS | File | Model | Output |
|---|---|---|---|
| A | workstream-A-razorpay-matrix.md | gemini-3.1-pro-low | docs/research/razorpay-capability-matrix.md |
| B | workstream-B-research.md | gemini-3.1-pro-low | docs/research/* |
| I | workstream-I-eval-pitch.md | gemini-3.1-pro-low | docs/pitch/* |
| J | workstream-J-living-kb.md | gemini-3.1-pro-low | packages/knowledge/* |
| G | workstream-G-llm-stubs.md | gemini-3.5-flash-medium | packages/llm/* |
| X | workstream-X-rl-experiments.md | claude-sonnet-4-6 | docs/experiments/* + scripts if needed |
