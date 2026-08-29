# RazorStitch contracts

Source of truth for cross-workstream interfaces. TypeScript types in `apps/web/lib/types.ts` mirror these schemas.

| Schema | Purpose |
|---|---|
| `CaseState.schema.json` | Recovery case observable state |
| `PolicyDecision.schema.json` | Policy output per decision step |
| `RecoveryEvent.schema.json` | Normalized webhook/simulator events |
| `AuditEntry.schema.json` | Hash-chained audit log row |
