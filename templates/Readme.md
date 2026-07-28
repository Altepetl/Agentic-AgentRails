---
title: Readme — Context Guide (<process-name>)
status: draft
version: 0.0.1
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: Meta-instructions for reading this context/ bundle — how the 5 documents
  relate, what wins when they conflict, and what to do when the agent can't
  comply with something in them.
derived-from: templates/Readme.md v0.0.1
regeneration-rule: Regenerate only if the precedence rule or escalation rule
  themselves change — not on every Backbone.md/Workflow.md edit.
---

<!--
TEMPLATE INSTRUCTIONS (agentrails-design fills this in; remove this block
from the generated Rail's Readme.md):

- This document is read first, before Design/Backbone/Workflow/Validation.
  It orients the executing agent on how to use the rest of the bundle — it is
  not itself a source of objectives, steps, or checks.
- The precedence order below is the default. Only change it if this specific
  process has a genuine reason to (rare) — note the reason inline if so.
-->

## How this context is organized

- **Backbone.md** — single source of truth: objectives (O#) and hard limits
  (L#). Everything else derives from it.
- **Workflow.md** — the fixed step sequence derived from Backbone.md. Follow
  it in order; don't invent or skip steps.
- **Validation.md** — the checklist, also derived from Backbone.md, used to
  confirm a Workflow.md run was correctly and completely executed.
- **Design.md** — descriptive big-picture overview and diagrams, for
  orientation only.
- **Readme.md** (this file) — how to read the other four.

## Precedence when documents conflict

If two documents in this bundle disagree, resolve in this order:

1. **Backbone.md** — always wins. It is the single source of truth.
2. **Workflow.md** — wins over Validation.md and Design.md, since it's the
   direct execution derivation of Backbone.md.
3. **Validation.md** — wins over Design.md.
4. **Design.md** — descriptive only; never overrides the other three.

A conflict between Backbone.md and any other document means that other
document is stale and must be regenerated — it is not grounds for the agent
to pick one side and proceed.

## Escalation rule

If the executing agent cannot comply with a step's fixed core as written —
blocked, contradicted by real conditions, missing a precondition, or facing
an ambiguity this bundle doesn't resolve — **it stops and asks the user.** It
does not guess, does not silently skip the step, and does not substitute its
own judgment for what the fixed core requires.

## Scope

<state explicitly when this Rail applies and when it doesn't — the process
description's boundaries, so the agent can recognize when it's been asked to
run this Rail on something out of scope.>
