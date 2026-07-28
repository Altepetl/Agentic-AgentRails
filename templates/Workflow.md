---
title: Workflow — <process-name>
status: draft
version: 0.0.1
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: Fixed step sequence the executing agent must follow. Steps are derived
  from Backbone.md — the agent must not invent, skip, or reorder steps.
derived-from: Backbone.md <version>
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
- If a step's fixed core can't be stated as verifiable, that's unresolved
  ambiguity — send it back to Backbone.md, don't guess an answer here.
-->

## Steps

### Step 1 — <short step name>

- **Backbone refs**: O#, L#
- **Fixed core**: <invariant action> — verified by: <concrete check>
- **Judgment zone**: <what's left to the agent's judgment, if anything>

### Step 2 — <short step name>

- **Backbone refs**: O#, L#
- **Fixed core**: <invariant action> — verified by: <concrete check>
- **Judgment zone**: <what's left to the agent's judgment, if anything>

<!-- add one block per step -->

## Escalation

If a step's fixed core cannot be satisfied as written (blocked, contradicted
by real conditions, missing a precondition), the agent stops and asks the
user — per the escalation rule in Readme.md. It does not silently skip the
step or substitute its own judgment for the fixed core.
