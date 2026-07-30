---
title: Workflow — <process-name>
status: draft
version: 0.1.0
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: Fixed step sequence the executing agent must follow. Steps are derived
  from Backbone.md — the agent must not invent, skip, or reorder steps.
derived-from: templates/Workflow.md v0.1.0
regeneration-rule: Regenerate whenever Backbone.md changes. Validation.md must
  be regenerated afterward, since its checklist is keyed to these steps.
---

<!--
TEMPLATE INSTRUCTIONS (agentrails-design fills this in; remove this block
from the generated Rail's Workflow.md):

- One step = one row below. Steps run in the order listed; the executing
  agent does not reorder them.
- Every step cites the Backbone.md ID(s) (O#/L#) it fulfills or guards. A step
  with no citation is a sign an objective was skipped or an extra,
  unauthorized step was invented — remove it or trace it back to Backbone.md.
- Split each step into:
    - Fixed core — the invariant action plus how it's verified before moving
      on. This must produce the same outcome regardless of which model runs
      it. State the verification as a concrete, checkable condition, not
      "make sure it's good."
    - Judgment zone — what's explicitly left to the executing agent's
      judgment within this step (may be empty for a fully mechanical step,
      but most steps should have one).
- Every fixed-core verification carries a verifier kind:
    - verifier: script — the check is expressible in the assertion
      vocabulary below, so code (checks.mjs) can verify it. Write the check
      AS vocabulary assertions, one per line — not as prose a compiler
      would have to interpret. This is the default to aim for.
    - verifier: agent — the check genuinely requires semantic judgment.
      Prose, as concrete as possible. Last resort: it will always be
      reported as a soft guarantee by process-name-validation.
  Assertion vocabulary (fixed — do not invent new kinds; if a check can't
  be expressed here, it's verifier: agent or unresolved ambiguity):
    exists: <path>
    not-exists: <path>
    contains: <path> "<literal>"
    not-contains: <path> "<literal>"
    matches: <path> /<regex>/
    count-at-least: <n> <path> "<literal>"
  Paths are relative to the Rail bundle root, so output files are
  addressed as output-<process-name>/...
  Matching rules (see PRD.md §8.7): contains/not-contains/count-at-least
  are case-sensitive exact-substring matches, no whitespace
  normalization; matches tests one single line at a time (a pattern
  cannot span multiple lines) as a case-sensitive Node.js RegExp with no
  implicit flags — write /<regex>/i inline if a check needs
  case-insensitivity.
- If a step's fixed core can't be stated as verifiable, that's unresolved
  ambiguity — send it back to Backbone.md, don't guess an answer here.
-->

## Steps

### Step 1 — <short step name>

- **Backbone refs**: O#, L#
- **Fixed core**: <invariant action> — verified by: <concrete check>
  (verifier: script | agent; if script, write the assertions here, one per
  line)
- **Judgment zone**: <what's left to the agent's judgment, if anything>

### Step 2 — <short step name>

- **Backbone refs**: O#, L#
- **Fixed core**: <invariant action> — verified by: <concrete check>
  (verifier: script | agent; if script, write the assertions here, one per
  line)
- **Judgment zone**: <what's left to the agent's judgment, if anything>

<!-- add one block per step -->

## Escalation

If a step's fixed core cannot be satisfied as written (blocked, contradicted
by real conditions, missing a precondition), the agent stops and asks the
user — per the escalation rule in Readme.md. It does not silently skip the
step or substitute its own judgment for the fixed core.
