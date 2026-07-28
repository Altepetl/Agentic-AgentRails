---
title: Validation — <process-name>
status: draft
version: 0.0.1
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: Checklist that confirms a Workflow.md run was correctly and completely
  executed. Consumed by process-name-validation to check output-process-name/
  against Backbone.md's objectives and hard limits.
derived-from: Backbone.md <version>, Workflow.md <version>
regeneration-rule: Regenerate whenever Backbone.md or Workflow.md changes.
---

<!--
TEMPLATE INSTRUCTIONS (agentrails-design fills this in; remove this block
from the generated Rail's Validation.md):

- One checklist item per Backbone.md objective/limit that Workflow.md touches.
  Every item cites the Workflow.md step(s) it validates and the Backbone.md
  ID(s) it checks — three-way traceability (Backbone <-> Workflow <-> here).
- An item must be a pass/fail check against the actual output in
  output-process-name/, not a restatement of the objective. "O3 was
  addressed" is not checkable; "the deliverable contains a section titled X
  with at least one entry per <thing>" is.
- Hard limits (L#) get checked too — validation must be able to catch a
  violation, not just confirm objectives were met.
- This document only defines what to check. It does not itself track status —
  that's ValidationTracking.md's job at runtime (seeded from this checklist's
  item list, one row per item, per the state machine in Readme.md /
  DESIGN-NOTES.md).
-->

## Checklist

### V1 — <what this item confirms>

- **Backbone refs**: O#/L#
- **Workflow step(s)**: Step #
- **Check**: <concrete, checkable pass/fail condition against
  output-process-name/>

### V2 — <what this item confirms>

- **Backbone refs**: O#/L#
- **Workflow step(s)**: Step #
- **Check**: <concrete, checkable pass/fail condition against
  output-process-name/>

<!-- add one block per checklist item; every Backbone O#/L# touched by
     Workflow.md must be covered by at least one item here -->
