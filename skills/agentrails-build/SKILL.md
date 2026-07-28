---
name: agentrails-build
description: Compiles a Rail's context/ bundle (Backbone.md, Workflow.md, Readme.md — already disambiguated by agentrails-design) into the runnable process-name skill that executes the process, progressively and resumably. Deterministic — invoke this only after agentrails-design has produced a context/ bundle for the process-name in question, never on a raw process description. Use whenever the user wants to turn a finished Rail context bundle into an actual runnable skill, says the design/context docs are approved and ready to build, or asks to "build the Rail" / "package process-name".
---

# agentrails-build

By the time you run, all ambiguity in this Rail was already resolved by
`agentrails-design`. Your job is a mechanical transformation: turn
`context/Backbone.md` + `context/Workflow.md` + `context/Readme.md` into a
runnable `process-name/SKILL.md`. Do not re-interpret or second-guess the
context documents — if something in them looks ambiguous or wrong, stop and
tell the user to fix it via `agentrails-design` rather than resolving it
yourself here. Silently patching ambiguity at this stage would defeat the
reason design and build are separate steps.

## Hard prerequisite: skill-creator

You must scaffold `process-name/SKILL.md` **through the `skill-creator`
skill** — never hand-roll the `SKILL.md` file or its packaging yourself.
This keeps every Rail-produced skill consistent with the same packaging
conventions as every other Agent Skill, instead of drifting into a
bespoke format. If `skill-creator` isn't available in this environment,
stop and tell the user it's a hard requirement rather than improvising a
workaround.

## Inputs

- `<process-name>/context/Backbone.md`
- `<process-name>/context/Workflow.md`
- `<process-name>/context/Readme.md`
- (`Design.md` and `Validation.md` are not needed here — Design.md is for
  human orientation only, and Validation.md belongs to
  `agentrails-build-validation`.)

If any of the three required files is missing, stop — this Rail's context
bundle isn't complete enough to build from.

## Step 1 — Read the context

Read `Backbone.md`, `Workflow.md`, and `Readme.md`. Confirm every step in
`Workflow.md` cites Backbone O#/L# IDs that actually exist — if you find a
step that doesn't trace back to Backbone.md, that's a defect from the design
phase; stop and report it rather than silently dropping or fixing the step.

## Step 2 — Compose the SKILL.md content to hand to skill-creator

The skill you're producing is named exactly `<process-name>`. Its purpose:
execute the process defined by `Workflow.md`, progressively and resumably,
writing live progress to a tracking file, with a clean way to run the whole
process again from scratch once a pass is fully complete.

Give `skill-creator` the following as the skill's required behavior — it
must end up in the generated `process-name/SKILL.md` body, adapted to
`skill-creator`'s own conventions but not stripped of substance:

### a. The fixed step sequence

Transcribe `Workflow.md`'s steps verbatim (in order, with their fixed core /
judgment zone split and Backbone refs). The executing agent
follows this sequence exactly — it does not invent, skip, or reorder steps,
per `Readme.md`'s precedence rules and escalation rule (which must also be
carried into the generated skill: stop and ask the user when a step's
fixed core can't be satisfied).

### b. ProcessTracking.md

Lives in `output-process-name/`, schema: `STATUS | AGENT | STEP | DETAILS |
START | END`.

- STATUS: `✅` done, `❌` error/blocked, empty = pending.
- AGENT: which model/agent executed that step — useful for debugging a
  run and for comparing, after the fact, how different models handled the
  same fixed path.
- STEP: short step name, matching a Workflow.md step.
- DETAILS: problems found / notes, empty if none.
- START/END: timestamps.

Generate this file (one row per Workflow.md step, empty STATUS) before
execution starts, if it doesn't already exist. Write/flush per step, before
moving to the next one — never hold it open for the whole run, so progress
is visible live.

### c. The state machine the generated skill must implement

```
if ProcessTracking.md doesn't exist:
    generate task list from Workflow.md -> write with empty STATUS

# Phase 1 — advance pending steps
while a row has empty STATUS:
    execute it (START -> do -> END + STATUS + DETAILS)

# Phase 2 — resolve own flagged errors
while a row has STATUS = error or non-empty DETAILS:
    retry that step, update STATUS/DETAILS/END

# Phase 3 — consume feedback from a prior validation run
if ValidationTracking.md exists:
    for each row with non-empty DETAILS (gap/error reported by validation):
        re-execute the corresponding process step to resolve it
        # this skill never writes to ValidationTracking.md — read-only.
        # Only process-name-validation writes/clears its own file.

# Phase 4 — everything resolved on both sides -> offer to run again, from scratch
if ProcessTracking.md fully OK and (ValidationTracking.md doesn't exist or fully OK):
    ask user: "The process is complete. Run it again? Previous results in
               output-process-name/ will be deleted."
    if yes:
        delete the entire contents of output-process-name/
        (ProcessTracking.md, ValidationTracking.md, and every deliverable)
        re-run the whole process from Phase 1, as if for the first time
    if no:
        stop
```

Do not soften this into "complement the prior result" or keep a log of
prior passes — a bare Rail's re-run is a clean, destructive restart. A
tool that wants to compare passes and keep the best one is a separate
concern (see AgentRefinery in the root `README.md`) and is out of scope
for this generated skill.

### d. Escalation

Carry `Readme.md`'s escalation rule into the generated skill's own text,
explicitly: if a step's fixed core cannot be satisfied as written, the
agent stops and asks the user. It does not guess, skip, or substitute its
own judgment for what the fixed core requires.

## Step 3 — Invoke skill-creator

Hand skill-creator the composed spec from Step 2 as the target skill's
required behavior, with:
- **name**: `<process-name>`
- **description**: what the process does (drawn from `Backbone.md`'s
  objectives) plus when to trigger — e.g. "runs the <process-name>
  process end to end, progressively and resumably; use when the user wants
  to execute, continue, or restart the <process-name> process."
- **output path**: `<process-name>/SKILL.md`, alongside the `context/` and
  `output-process-name/` directories for this Rail.

Let skill-creator handle the actual `SKILL.md` scaffolding and packaging
conventions — your job was composing the correct, complete content, not
formatting it.

## Step 4 — Confirm and hand back

Once skill-creator has produced `process-name/SKILL.md`, tell the user it's
ready to run, and remind them that `agentrails-build-validation` still
needs to run against `context/Validation.md` + `context/Backbone.md` to
produce `process-name-validation` before this Rail's execution/validation
cycle is complete.
