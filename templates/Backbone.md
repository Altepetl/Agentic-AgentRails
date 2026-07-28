---
title: Backbone — <process-name>
status: draft
version: 0.0.1
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: Single source of truth for what the process must achieve (objectives) and
  must never do (hard limits). Workflow.md and Validation.md are both derived
  from this document — they must never introduce an objective or limit that
  isn't traceable back to an ID defined here.
derived-from: templates/Backbone.md v0.0.1
regeneration-rule: Regenerate whenever the process description or scope changes.
  Workflow.md and Validation.md must be regenerated afterward, in that order,
  since both derive from this file.
---

<!--
TEMPLATE INSTRUCTIONS (agentrails-design fills this in; remove this block
from the generated Rail's Backbone.md):

- Every objective and hard limit gets a stable ID (O1, O2… / L1, L2…). Workflow
  and Validation steps reference these IDs — never restate them in prose only.
- An objective belongs here only if its fulfillment is checkable. If it can't
  be verified, either sharpen it until it can, or move it to Design.md as
  background/context instead of treating it as a real objective.
- A hard limit is a negative objective: something the process must NOT do,
  regardless of how a step's judgment zone is executed. Hard limits always
  win over objectives if the two ever conflict — see Readme.md's precedence
  rule.
- Ambiguity found while drafting this document must be resolved HERE, before
  Workflow.md or Validation.md are generated. Do not defer ambiguity downstream.
-->

## Objectives

What the process must achieve. Each one must be independently verifiable.

- **O1** — <objective statement>
- **O2** — <objective statement>

## Hard limits (negative objectives)

What the process must never do, no matter which model executes it or how it
exercises judgment within a step's judgment zone.

- **L1** — <hard limit statement>
- **L2** — <hard limit statement>

## Traceability

Every row in Workflow.md and every checklist item in Validation.md must cite
at least one ID from this section. If an ID here is never referenced by
either downstream document, that's a signal the objective/limit is either
redundant or was dropped by mistake during generation.
