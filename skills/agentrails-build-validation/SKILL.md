---
name: agentrails-build-validation
description: Compiles a Rail's context/Validation.md and context/Backbone.md into the runnable process-name-validation skill that checks a completed process-name run against that Rail's checklist. Deterministic — invoke this only after agentrails-design has produced a context/ bundle (and ideally after agentrails-build has produced process-name, though it can run independently). Use whenever the user wants to build the validation skill for a Rail, says the validation checklist is approved and ready to build, or asks to "build the validation for process-name".
---

# agentrails-build-validation

Like `agentrails-build`, all judgment calls for this Rail were already
made during `agentrails-design` — `Validation.md`'s checklist items are
fixed, specific, checkable conditions, not something you interpret or
loosen here. Your job is a mechanical transformation: turn
`context/Validation.md` + `context/Backbone.md` into a runnable
`process-name-validation/SKILL.md`. If a checklist item isn't concretely
checkable, stop and send it back to `agentrails-design` rather than
softening it into something you can pass mechanically.

## Hard prerequisite: skill-creator

Scaffold `process-name-validation/SKILL.md` **through the `skill-creator`
skill** — never hand-roll it. Same reasoning as `agentrails-build`: every
Rail-produced skill should share the same packaging conventions. If
`skill-creator` isn't available, stop and say so rather than improvising.

## Inputs

- `<process-name>/context/Validation.md`
- `<process-name>/context/Backbone.md`
- (`Design.md`, `Workflow.md`, and `Readme.md` are not needed directly here
  — `Validation.md` was already derived from `Workflow.md` by
  `agentrails-design`, and this skill doesn't re-derive it. `Readme.md`'s
  escalation rule still applies and should be carried into the generated
  skill's text.)

If either required file is missing, stop.

## Step 1 — Read the context

Read `Validation.md` and `Backbone.md`. Confirm every checklist item cites
Backbone O#/L# IDs that actually exist — if one doesn't, that's a defect
from the design phase; report it rather than silently dropping the item.

## Step 2 — Compose the SKILL.md content to hand to skill-creator

The skill you're producing is named exactly `<process-name>-validation`.
Its purpose: validate a completed (or in-progress) `process-name` run —
i.e., the contents of `output-process-name/` — against `Validation.md`'s
checklist, and report gaps back in a form `process-name` itself can consume
to fix them.

Give `skill-creator` the following as the target skill's required behavior:

### a. The checklist

Transcribe `Validation.md`'s checklist items verbatim (with their Backbone
refs, the Workflow step(s) they validate, and the concrete pass/fail
condition each one checks). The generated skill checks these against the
actual deliverables in `output-process-name/` — it does not invent new
criteria beyond what `Validation.md` specifies.

### b. ValidationTracking.md

Lives in `output-process-name/`, same schema as `ProcessTracking.md`:
`STATUS | AGENT | STEP | DETAILS | START | END`.

- **STEP column is seeded by copying it from `ProcessTracking.md`** — one
  row per process step, not per checklist item — so both tracking files
  stay aligned on the same step list. The rest of the columns are filled in
  during validation.
- STATUS: `✅` confirmed correct/complete, `❌` gap or error found, empty =
  not yet validated.
- AGENT: which model/agent performed that validation pass.
- DETAILS: the gap/error found for that step, empty if none — this file
  doubles as the error log from the validation pass.
- START/END: timestamps.

Generate this file (seeding STEP from `ProcessTracking.md`) before
validation starts, if it doesn't already exist. Write/flush per row, before
moving to the next one.

## Step 2 continued — the state machine the generated skill must implement

This mirrors `process-name`'s own resumability logic, but validating
instead of executing:

```
if ValidationTracking.md doesn't exist:
    seed STEP column from ProcessTracking.md -> write with empty STATUS

while a row has empty STATUS:
    validate the corresponding step's output in output-process-name/
    against the relevant Validation.md checklist item(s)
    (START -> check -> END + STATUS + DETAILS)

while a row has STATUS = error / non-empty DETAILS from a PRIOR validation
pass that hasn't been re-checked yet:
    re-check whether process-name has since fixed it
    (process-name reads this file but never writes to it — only this
    skill writes/clears its own rows, on its own next run, once it
    re-confirms a step is fixed)

if every row is confirmed OK:
    report: this Rail's output is fully validated
else:
    report: which steps still have gaps, so the user can re-run
    process-name to consume this feedback (Phase 3 of its own state
    machine) and resolve them
```

Note that `process-name`'s own Phase 4 deletes the entire contents of
`output-process-name/` (including this file) when the user chooses to run
the process again from scratch — so on a fresh pass, this skill simply
re-seeds `ValidationTracking.md` from an empty state, exactly as it would
on a Rail's very first pass. Do not add any cross-pass memory or comparison
logic here; that is out of scope (see AgentRefinery in the root `README.md`).

### d. Escalation

Carry `Readme.md`'s escalation rule into the generated skill: if the
validation skill itself can't determine whether a checklist item passes
(e.g. the check requires a judgment call `Validation.md` didn't anticipate),
it stops and asks the user rather than guessing pass or fail.

## Step 3 — Invoke skill-creator

Hand skill-creator the composed spec from Step 2, with:
- **name**: `<process-name>-validation`
- **description**: what it validates (drawn from `Validation.md`'s
  checklist) plus when to trigger — e.g. "validates a completed or
  in-progress <process-name> run against its checklist; use when the user
  wants to check, review, or confirm the output of <process-name>."
- **output path**: `<process-name>-validation/SKILL.md`, alongside
  `context/`, `output-process-name/`, and `process-name/` for this Rail.

## Step 4 — Confirm and hand back

Once skill-creator has produced `process-name-validation/SKILL.md`, tell
the user this Rail's execution/validation cycle is complete: `process-name`
runs the process, `process-name-validation` checks it, and either one can
be run again from scratch — potentially with a more capable model —
without anyone touching this Rail's context documents again.
