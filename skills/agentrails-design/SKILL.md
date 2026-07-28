---
name: agentrails-design
description: Turns a documented process (a prompt plus supporting data describing how something should be done) into a draft Rail — the 5-document context bundle (Design.md, Backbone.md, Workflow.md, Validation.md, Readme.md) that fixes a process's mandatory path while leaving room for LLM judgment. This is the only reasoning step in the AgentRails pipeline; agentrails-build and agentrails-build-validation are purely mechanical and depend on this skill's output. Use this whenever the user wants to turn a process, SOP, runbook, or repeatable task description into a Rail, wants to start the AgentRails pipeline, mentions "agentrails-design", or wants to merge/extend an existing Rail's context with a new one via inheritance — even if they just describe the process informally rather than asking for a "Rail" by name.
---

# agentrails-design

You are the entry point of the AgentRails pipeline. Everything downstream
(`agentrails-build`, `agentrails-build-validation`) is a mechanical
transformation that trusts your output completely — they do not re-check for
ambiguity. That means ambiguity you leave unresolved here becomes a defect
baked into the Rail forever, silently, because nothing downstream is looking
for it. Resolve it here, or flag it loudly enough that the user has to look
at it before moving on.

## Inputs

1. **Process description** (required) — a prompt plus whatever supporting
   material the user provides describing the process to turn into a Rail.
   A Product Requirements Document (PRD) is an excellent process
   description on its own: a well-written PRD already states objectives,
   constraints, and scope — most of what `Backbone.md` needs — so feeding
   a PRD in directly, rather than re-summarizing it into a prompt first,
   is expected and encouraged. The resulting Rail, once built and run, is
   what actually constructs whatever the PRD describes.
2. **`process-name`** (required) — the identifier for this Rail. It becomes
   the output directory name and is cited throughout the generated
   documents. If the user hasn't given one, ask — do not invent one, since
   it's a durable identifier other Rails may later inherit from.
3. **Bundles to merge** (optional) — a list of local paths and/or Git
   repository URLs, each pointing to an already-built Rail's `context/`
   directory, to merge via inheritance into this one.
4. **Output location** (if not obvious from context) — where `<process-name>/`
   should be created. Ask rather than assume if it's not clear from the
   conversation.

### Disambiguating filesystem paths given without explicit labels

Invocations may pass multiple bare filesystem paths after the process
description and `process-name`, without saying which is the output
location and which is a bundle to merge (e.g. a slash-command style
invocation with several trailing paths). Resolve each one this way, don't
guess by position alone:

- If the path already contains a `context/` subdirectory with the 5 Rail
  documents (`Design.md`, `Backbone.md`, `Workflow.md`, `Validation.md`,
  `Readme.md`), it's a **bundle to merge** — an existing Rail to inherit
  from.
- If it doesn't, it's the **output location** — where `<process-name>/`
  should be created.

If a path is genuinely ambiguous under this test (e.g. it doesn't exist
yet, so it can't be checked for a `context/` subdirectory), ask the user
which it's meant to be rather than assuming.

### Example invocation

```
/agentrails-design PRD.md standard-builder /home/Projects/Code/ECC/ /home/Projects/Code/ECCStandards/
```

- `PRD.md` — the process description.
- `standard-builder` — the `process-name`.
- `/home/Projects/Code/ECC/` — has no `context/` subdirectory yet, so it's
  the **output location**: `standard-builder/` gets created inside it.
- `/home/Projects/Code/ECCStandards/` — already has a `context/`
  subdirectory (an existing Rail encoding this org's coding standards),
  so it's a **bundle to merge**: `standard-builder` inherits from it.

## Step 1 — Read the base templates

Read all five files in `templates/` at the AgentRails repo root:
`Design.md`, `Backbone.md`, `Workflow.md`, `Validation.md`, `Readme.md`.

These define the required frontmatter fields and section skeleton for each
document type — follow their structure. Each template's own
`TEMPLATE INSTRUCTIONS` comment block explains what belongs in that section;
that guidance is for you, the generator, and must not appear in what you
write out.

## Step 2 — Merge pre-existing Rails, if any were given

If the user supplied bundles to merge, read each one's `context/*.md`.

Compare objectives and hard limits across all bundles. If any two
contradict each other, **stop and report the full list of contradictions —
do not resolve them yourself and do not do a partial merge.** Reconciling
conflicting input contexts is the user's responsibility, not something to
paper over; a silent resolution here would defeat the point of having an
explicit, auditable Backbone.

If the bundles are consistent, merge by union, following the recommended
inheritance pattern: a base/agnostic Rail's context first, this new Rail's
context as a specific application layered on top. The base's objectives and
hard limits carry forward; this Rail's own Backbone.md extends them rather
than restating them.

## Step 3 — Draft the 5 documents, in this order

Each document below depends on the one(s) before it — draft them in order,
not in parallel, since later documents cite IDs defined in earlier ones.

### 3a. Backbone.md

Extract:
- **Objectives** (positive), each assigned a stable ID: O1, O2, ...
- **Hard limits** (negative objectives — what must never happen), each
  assigned a stable ID: L1, L2, ...

Every objective and hard limit must be independently verifiable. If
something from the process description can't be stated as a checkable
condition, that is exactly the ambiguity you need to resolve now (see Step
4) — don't let a vague objective flow downstream and become an
unverifiable step later.

### 3b. Workflow.md

Derive the fixed step sequence from Backbone.md. For each step:
- Cite the Backbone O#/L# IDs it fulfills or guards.
- Split it into **fixed core** (the invariant action, plus a concrete way
  to verify it before moving on — worded so the check gives the same
  answer no matter which model runs it) and **judgment zone** (what's
  explicitly left open to the executing agent's judgment, if anything).

A step whose fixed core can't be phrased as a concrete check is unresolved
ambiguity — send it back to Backbone.md and sharpen the underlying
objective rather than writing a vague verification here.

### 3c. Validation.md

Derive a checklist from Backbone.md and Workflow.md. Each item:
- Cites the Backbone O#/L# ref(s) it checks and the Workflow step(s) it
  validates.
- States a concrete pass/fail condition checkable against the eventual
  output in `output-process-name/` — not a restatement of the objective.
  ("O3 was addressed" is not a check; "the deliverable contains a section
  titled X with at least one entry per Y" is.)

Every O#/L# touched by Workflow.md should be covered by at least one
checklist item — if one isn't, that objective has no way to be confirmed,
which is worth flagging to the user even if you can construct a plausible
check yourself.

### 3d. Design.md

Write the descriptive big-picture overview: what the process is for, how it
flows in plain language, and a Mermaid flowchart summarizing Workflow.md's
steps. This document is read by humans first — write for a newcomer who
hasn't read Backbone.md yet. It is explicitly non-authoritative: never let
it introduce an objective, limit, or step that isn't already in
Backbone.md/Workflow.md, since Design.md always loses if it ever disagrees
with them.

### 3e. Readme.md

Meta-instructions for the bundle:
- The standard precedence order (Backbone > Workflow > Validation >
  Design) — only deviate from this if the process has a genuine reason to,
  and if so, say why inline.
- The escalation rule: the executing agent stops and asks the user when it
  can't comply with a step's fixed core. This is fixed across every Rail,
  not a per-process choice — don't let a process description talk you into
  a different escalation behavior.
- This Rail's explicit scope: when it applies and when it doesn't, so the
  executing agent can recognize being asked to run it on something out of
  scope.

## Step 4 — Handle ambiguity as you go, not at the end

Whenever the source material underspecifies something — an objective that
can't be made checkable, two requirements that pull in different
directions, unclear scope — resolve it before drafting the next document,
using one of two moves:

- **State a reasonable assumption inline** in the relevant document, in
  plain language a reviewer will actually notice (not buried), so the user
  can confirm or correct it during review.
- **Ask the user directly** if the ambiguity is significant enough that
  guessing would produce a Backbone objective or hard limit the user didn't
  actually intend — an incorrect hard limit is a bigger silent risk than a
  fuzzy objective, since Workflow.md's fixed core enforces it exactly as
  written.

What you must not do is silently pick an interpretation and move on without
surfacing it anywhere — the entire point of this pipeline is that
downstream steps trust that ambiguity was actually resolved here, not
guessed at.

## Step 5 — Fill frontmatter

For each of the 5 documents, fill the YAML frontmatter per its template:
`title`, `status: draft`, `version: 0.0.1`, `created`/`updated` (today's
date), `role` (carry over from the template), `derived-from` (the
`templates/<Doc>.md` version, plus any merged base Rail's context version if
Step 2 applied), and `regeneration-rule` (per the template's own guidance
for that document type).

## Step 6 — Write the output

Write the five files to `<process-name>/context/`:
`Design.md`, `Backbone.md`, `Workflow.md`, `Validation.md`, `Readme.md`.

## Step 7 — Hand back to the user

Tell the user the 5 documents are a **draft for review** — recommend they
read `Backbone.md` first, since it's the single source of truth everything
else was derived from, before running `agentrails-build`. Do not
automatically chain into `agentrails-build` yourself; disambiguation
review by the user is the point of stopping here.

## Out of scope

Scaffolding the actual `process-name/SKILL.md` or
`process-name-validation/SKILL.md` packages is not this skill's job — that
belongs to `agentrails-build` and `agentrails-build-validation`, both
of which are deterministic and both of which are required to go through
`skill-creator` to do the actual packaging. This skill only produces the
`context/` documents those two consume.
