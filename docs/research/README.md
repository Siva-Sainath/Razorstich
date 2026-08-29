# Recovery Research Pack

This directory contains the foundational research, evidence-backed claims, and rule sets that inform the adaptive payment recovery policies for RazorStitch. Our Double DQN simulator relies on these assumptions to model realistic customer behavior, constraint masking (e.g., UPI cooldowns), and trust budgets.

## Artifacts

- [Claims (`claims.md`)](./claims.md): 15-20 evidence-backed claims regarding payment recovery dynamics, tagged by source quality.
- [Conflicts (`conflicts.md`)](./conflicts.md): Documented conflicts between industry practices, academic research, and anecdotal evidence, along with our simulator's resolution rules.
- [Recovery Playbook (`recovery-playbook.md`)](./recovery-playbook.md): Default timing and actions per `failure_reason`, serving as a baseline for the judge narrative and policy benchmarking.

## Core Simulator Context
- **Objective**: Optimize for net value recovery. Our DQN agent outperforms static rules on net recovery (+36k INR/seed in eval), though naive "always blast payment links" may temporarily yield higher gross recovery at the cost of the trust budget and messaging expenses.
- **Constraints**: Honest labeling (simulator performance $\neq$ live merchant uplift).
- **Tone**: We strictly avoid shame or commission-based framing for customers (Hallsworth gov-debt tactics do not transfer to e-commerce and retail).
