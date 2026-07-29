---
name: agentrails-build-validation
description: Compiles a Rail's context/Validation.md and context/Backbone.md into the runnable process-name-validation skill that checks a completed process-name run against that Rail's checklist, plus the checks.mjs mechanical checker compiled from the checklist's script items. Deterministic — invoke this only after agentrails-design has produced a context/ bundle (and ideally after agentrails-build has produced process-name, though it can run independently). Use whenever the user wants to build the validation skill for a Rail, says the validation checklist is approved and ready to build, or asks to "build the validation for process-name".
---

# agentrails-build-validation

Like `agentrails-build`, all judgment calls for this Rail were already
made during `agentrails-design` — `Validation.md`'s checklist items are
fixed, specific, checkable conditions, not something you interpret or
loosen here. Your job is a mechanical transformation: turn
`context/Validation.md` + `context/Backbone.md` into a runnable
`process-name-validation/SKILL.md`, and compile the checklist's
`verifier: script` items into `checks.mjs`. If a checklist item isn't
concretely checkable, stop and send it back to `agentrails-design` rather
than softening it into something you can pass mechanically.

## Hard prerequisite: skill-creator

Scaffold `process-name-validation/SKILL.md` **through the `skill-creator`
skill** — never hand-roll it. Same reasoning as `agentrails-build`: every
Rail-produced skill should share the same packaging conventions. If
`skill-creator` isn't available, stop and say so rather than improvising.
(Only the `SKILL.md` goes through skill-creator — `checks.mjs` is a plain
script you generate directly, per Step 2.)

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
Likewise, if a `verifier: script` item contains an assertion outside the
fixed vocabulary (`exists`, `not-exists`, `contains`, `not-contains`,
`matches`, `count-at-least`), stop — either the item should be
`verifier: agent`, or the vocabulary itself needs extending (an
AgentRails-level change), neither of which is yours to decide here.

## Step 2 — Generate checks.mjs

Write `<process-name>/checks.mjs`: the mechanical checker, a single
zero-dependency Node.js script (built-in modules only, Node >= 18)
compiled **verbatim** from `Validation.md`'s `verifier: script` items —
one check function per item, each a direct translation of its
`Assertions:` entries, keyed by item ID and by the Workflow step(s) it
cites. Because the assertion vocabulary is fixed, this compilation is
lookup-and-substitute, never code authorship: if you find yourself
interpreting prose to write a check, the item was misclassified — stop
and send it back to `agentrails-design`.

Required behavior of the generated script:

- `node checks.mjs` runs every `script` check; `node checks.mjs --step
  <N>` runs only the checks citing Workflow step N (this is what
  `process-name`'s per-step gate uses).
- Paths in assertions are resolved relative to the Rail bundle root
  (the script's own location), so `output-<process-name>/...` paths work
  as written.
- Exit code 0 = every check that ran passed; non-zero otherwise, with a
  per-check report (item ID, assertion, expected vs. found).
- The report also **lists** the `verifier: agent` items without executing
  them (they are `process-name-validation`'s job, not the script's), so
  no checklist item is ever silently dropped.
- Three built-in consistency checks, always included, independent of the
  checklist: (1) `ProcessTracking.md` and `ValidationTracking.md` (when
  present) parse under the `STATUS | AGENT | STEP | DETAILS | START |
  END` schema; (2) their STEP columns stay aligned; (3) no
  `ProcessTracking.md` row marked `✅` belongs to a step whose `script`
  checks currently fail — such a row is a self-reported claim
  contradicted by mechanical evidence, and is always reported as a
  **divergence**, never silently trusted.

Like `rail.mjs`, this is a plain script, not an Agent Skill — do **not**
route it through `skill-creator`.

## Step 3 — Compose the SKILL.md content to hand to skill-creator

The skill you're producing is named exactly `<process-name>-validation`.
Its purpose: validate a completed (or in-progress) `process-name` run —
i.e., the contents of `output-process-name/` — against `Validation.md`'s
checklist, mechanical evidence first (`checks.mjs`) and LLM judgment only
where the checklist says `verifier: agent`, and report gaps back in a
form `process-name` itself can consume to fix them.

Give `skill-creator` the following as the target skill's required behavior:

### a. The checklist

Transcribe `Validation.md`'s checklist items verbatim (with their Backbone
refs, the Workflow step(s) they validate, their verifier kind, and the
concrete pass/fail condition or assertions each one checks). The generated
skill checks these against the actual deliverables in
`output-process-name/` — it does not invent new criteria beyond what
`Validation.md` specifies.

### b. Mechanical first

The generated skill runs `node checks.mjs` before applying any judgment of
its own, and treats the script's output as objective evidence: a
mechanical pass is a pass, a mechanical failure is a gap, and a flagged
divergence (tracking row vs. mechanical reality) is always surfaced. Its
own LLM judgment applies **only** to `verifier: agent` items — it never
re-litigates or overrides what `checks.mjs` already settled.

### c. ValidationTracking.md

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
  doubles as the error log from the validation pass. Rows confirmed by
  LLM judgment (rather than `checks.mjs`) are marked as such here, e.g.
  DETAILS prefixed `agent-verified (soft guarantee):`.

Generate this file (seeding STEP from `ProcessTracking.md`) before
validation starts, if it doesn't already exist. Write/flush per row, before
moving to the next one.

## Step 3 continued — the state machine the generated skill must implement

This mirrors `process-name`'s own resumability logic, but validating
instead of executing — mechanical pass first, agent-judgment pass second:

```
if ValidationTracking.md doesn't exist:
    seed STEP column from ProcessTracking.md -> write with empty STATUS

# Mechanical pass — no LLM judgment involved:
run node checks.mjs
for each step covered by the run:
    transcribe the mechanical results into the step's row
    (START/END + STATUS + DETAILS from the checks.mjs report)
note any divergences checks.mjs flagged — report them as gaps,
    never silently trust the tracking row

# Agent-judgment pass — verifier: agent items only:
while a row has empty STATUS:
    validate the corresponding step's output in output-process-name/
    against the relevant Validation.md checklist item(s) marked
    verifier: agent (START -> check -> END + STATUS + DETAILS)

while a row has STATUS = error / non-empty DETAILS from a PRIOR validation
pass that hasn't been re-checked yet:
    re-check whether process-name has since fixed it
    (process-name reads this file but never writes to it — only this
    skill writes/clears its own rows, on its own next run, once it
    re-confirms a step is fixed)

# Final report — tiered:
for every step/check, classify as:
    MECHANICALLY VERIFIED   — confirmed by checks.mjs (hard guarantee)
    AGENT-VERIFIED          — confirmed by this skill's judgment
                              (soft guarantee, always labeled as such)
    FAILED                  — gap found, with DETAILS
if every row is confirmed OK:
    report: this Rail's output is fully validated, with the tier
    breakdown (N mechanically verified, M agent-verified)
else:
    report: which steps still have gaps, so the user can re-run
    process-name to consume this feedback (Phase 3 of its own state
    machine) and resolve them
```

Note that `process-name`'s own Phase 4 deletes the entire contents of
`output-process-name/` (including this file) when the user chooses to run
the process again from scratch — so on a fresh pass, this skill simply
re-seeds `ValidationTracking.md` from an empty state, exactly as it would
on a Rail's very first pass. `checks.mjs` lives at the bundle root and
survives the restart untouched. Do not add any cross-pass memory or
comparison logic here; that is out of scope (see AgentRefinery in the
root `README.md`).

### d. Escalation

Carry `Readme.md`'s escalation rule into the generated skill: if the
validation skill itself can't determine whether a checklist item passes
(e.g. the check requires a judgment call `Validation.md` didn't anticipate),
it stops and asks the user rather than guessing pass or fail.

## Step 4 — Invoke skill-creator

Hand skill-creator the composed spec from Step 3, with:
- **name**: `<process-name>-validation`
- **description**: what it validates (drawn from `Validation.md`'s
  checklist) plus when to trigger — e.g. "validates a completed or
  in-progress <process-name> run against its checklist; use when the user
  wants to check, review, or confirm the output of <process-name>."
- **output path**: `<process-name>/process-name-validation/SKILL.md`,
  alongside `context/`, `rail.mjs`, `checks.mjs`, `output-process-name/`,
  and `process-name/` for this Rail.

## Step 5 — Confirm and hand back

Once skill-creator has produced `process-name-validation/SKILL.md` and
`checks.mjs` is in place, tell the user this Rail's execution/validation
cycle is complete: `process-name` runs the process (gated per-step by
`checks.mjs`), `process-name-validation` checks it (mechanical evidence
first, tiered report at the end), and either one can be run again from
scratch — potentially with a more capable model — without anyone touching
this Rail's context documents again. Also point out that
`node checks.mjs` can be run directly, any time, for a model-independent
mechanical verdict on the current output.
