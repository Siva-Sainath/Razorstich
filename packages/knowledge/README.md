# Living Research Knowledge Base (LRKB)

## Purpose
The Living Research Knowledge Base (LRKB) maintains a structured, up-to-date repository of research claims, facts, and priors that inform the simulator. It ensures that the system's foundational assumptions are explicitly tracked, verifiable, and tied to their original sources.

## Refresh Cadence
Claims within the LRKB are assigned a refresh schedule based on their volatility and source tier. The system periodically checks claims against authoritative sources to detect drift or invalidation.

## Gated Policy Updates
The LRKB informs simulator priors and system policies but **does not** auto-deploy changes. All policy implications derived from updated claims require human review and approval (gated policy updates) before they are enacted in production or simulation environments.
