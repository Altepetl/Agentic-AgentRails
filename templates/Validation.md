---
title: Validation — <process-name>
status: draft
version: 0.1.0
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: Checklist that confirms a Workflow.md run was correctly and completely
  executed. Consumed by process-name-validation to check output-process-name/
  against Backbone.md's objectives and hard limits.
derived-from: templates/Validation.md v0.1.0
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
- Every item carries a verifier kind:
    - verifier: script — the check is written as Assertions in the fixed
      vocabulary below, so agentrails-build-validation can compile them
      verbatim into checks.mjs (no prose interpretation). Aim for this.
    - verifier: agent — genuinely requires semantic judgment; prose check,
      no Assertions block. Always reported as a soft guarantee.
  Assertion vocabulary (fixed — do not invent new kinds):
    exists: <path>
    not-exists: <path>
    contains: <path> "<literal>"
    not-contains: <path> "<literal>"
    matches: <path> /<regex>/
    count-at-least: <n> <path> "<literal>"
  Paths are relative to the Rail bundle root (output files:
  output-<process-name>/...).
  Matching rules (see PRD.md §8.7): contains/not-contains/count-at-least
  are case-sensitive exact-substring matches, no whitespace
  normalization; matches tests one single line at a time (a pattern
  cannot span multiple lines) as a case-sensitive Node.js RegExp with no
  implicit flags — write /<regex>/i inline if a check needs
  case-insensitivity.
- Hard limits (L#) get checked too — validation must be able to catch a
  violation, not just confirm objectives were met. An L# that is
  mechanically expressible (a forbidden pattern, path, or command — treat
  it as a lint rule, usually with not-contains / not-exists) MUST get a
  verifier: script item.
- Mirroring rule: every Workflow.md step whose fixed-core verification is
  verifier: script must be cited by at least one verifier: script item
  here — otherwise the per-step gate (checks.mjs --step N) has nothing
  mechanical to run for that step.
- This document only defines what to check. It does not itself track status —
  that's ValidationTracking.md's job at runtime (STEP column seeded from
  ProcessTracking.md, one row per process step, not per checklist item, so
  both tracking files stay aligned — per the state machine in PRD.md §10.3).
-->

## Checklist

### V1 — <what this item confirms>

- **Backbone refs**: O#/L#
- **Workflow step(s)**: Step #
- **Verifier**: script
- **Check**: <one-line prose gloss for human readers>
- **Assertions**:
  - exists: output-<process-name>/<deliverable>
  - contains: output-<process-name>/<deliverable> "<literal>"

### V2 — <what this item confirms>

- **Backbone refs**: O#/L#
- **Workflow step(s)**: Step #
- **Verifier**: agent
- **Check**: <concrete, checkable pass/fail condition against
  output-process-name/ — as specific as prose can make it>

<!-- add one block per checklist item; every Backbone O#/L# touched by
     Workflow.md must be covered by at least one item here, and every
     verifier: script step verification must be mirrored by at least one
     verifier: script item -->
