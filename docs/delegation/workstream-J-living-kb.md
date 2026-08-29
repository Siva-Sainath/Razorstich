# Workstream J — Living Research KB scaffold

## Task
Create `packages/knowledge/`:

1. `README.md` — purpose of LRKB, refresh cadence, gated policy updates
2. `schema.json` — JSON schema for a Claim record: id, statement, source_tier, citations[], policy_implication, last_verified, conflict_ids[]
3. `claims_seed.json` — 10 seed claims aligned with `docs/research/` (create minimal claims if research not yet present)
4. `refresh.py` — CLI stub: `python -m packages.knowledge.refresh --dry-run` prints claims due for refresh (no external API calls)

Add `packages/knowledge/__init__.py` if needed.

## Constraints
- No network calls in refresh.py (stub only)
- Bounded policy updates: LRKB informs simulator priors, does not auto-deploy without human gate
- Match monorepo style; keep files small
