# AgentRails

AgentRails turns a documented process into a **Rail**: a guide an LLM agent can
run, end to end, that fixes the mandatory path (what must always happen, and
how it's verified — by code wherever code can verify it) while leaving a zone
where the executing model's own judgment decides *how* to carry out each step
— without anyone rewriting the process.

> For the full requirements spec — every concept, every document's exact
> structure, every state machine, and the rationale behind every naming
> decision — see [`PRD.md`](./PRD.md). This README is the pitch and the
> quick reference; `PRD.md` is the exhaustive one.

## The gap this project fills

Today there are two ways to get an AI agent to execute a process repeatedly:

- **Automate it fully** (script / workflow / RPA) — freezes quality at the day it
  was written. A more capable LLM underneath doesn't improve anything, because the
  logic no longer runs through the model.
- **Re-prompt it each time** — scales with model capability, but sacrifices
  consistency. Every run can drift, skip critical steps, or be interpreted
  differently.

AgentRails compiles a documented process into a guide that fixes the mandatory
path while leaving open the zone where model judgment adds quality. The same
guide, run by an older or newer LLM, follows the exact same path — the result
within that path can vary with model capability, but the path itself never
does, and nobody has to rewrite anything to keep it that way.

And the path isn't fixed by prose alone: every check in a Rail is classified
by **verifier kind**. What code can verify, code verifies (`verifier: script`
— compiled into a runnable `checks.mjs` that gates each step and that you can
re-run yourself, model-independent). What genuinely requires semantic judgment
is checked by an agent and always labeled a soft guarantee (`verifier:
agent`). The precise promise: **the same verifiable milestones, with the
largest possible surface verified mechanically, regardless of which model
runs it.**

That guide is the Rail.

**Comparing or improving a Rail's output across repeated runs is not this
project's job.** A bare Rail's own re-run is a clean, from-scratch restart
(see "Progressive execution" below) — it doesn't remember or judge prior
passes. That's the job of the separate, sibling **AgentRefinery** project,
which builds on top of the Rails this project produces.

## Installing the AgentRails skills

AgentRails ships its 3 commands as installable Agent Skills
(`skills/agentrails-design`, `skills/agentrails-build`,
`skills/agentrails-build-validation`). Once this package is published,
installing all of them into a target tool is one command:

```bash
npx agent-rails install
```

This prompts for which target(s) to install into and copies the 3 skills
into that tool's skills directory. For `agentrails-design` specifically, it
also bundles a copy of this repo's `templates/` directory into that
installed skill's own `templates/` subdirectory, since `agentrails-design`
reads the 5 base templates at runtime and needs them to be self-contained
wherever it ends up installed, without depending on this repo still being
on disk. (These base templates are AgentRails' own build tooling — not to
be confused with a Rail's generated `context/` bundle, which is what
`agentrails-design` *produces* from them, per-process.) To skip the
prompt:

```bash
npx agent-rails install --target claude,cursor
```

**Testing against a local clone** (before the package is published, e.g. to
try a change to a `SKILL.md`): run it from inside the cloned repo instead —
`npx .` runs the current directory as the package, `bin/cli.js`'s bin entry
is picked up the same way `agent-rails` would be once published:

```bash
git clone <this-repo-url>
cd AgentRails
npx . install --target claude
# or, equivalently:
node bin/cli.js install --target claude
```

Supported targets (`npx agent-rails list` prints this same table with
each installed skill):

| Target key    | Platform          | Install path                                                        |
|---------------|--------------------|----------------------------------------------------------------------|
| `claude`      | Claude Code        | `.claude/skills/` (project) or `~/.claude/skills/` (`--global`)     |
| `antigravity` | Google Antigravity | `.agent/skills/` (project) or `~/.gemini/antigravity/skills/` (`--global`) |
| `cursor`      | Cursor             | `.cursor/skills/` (project-scoped only, no personal directory)       |
| `zcode`       | ZCode              | `.zcode/skills/` (project) or `~/.config/zcode/skills/` (`--global`) |
| `kimi`        | Kimi Code CLI      | `.kimi-code/skills/` (project) or `~/.kimi-code/skills/` (`--global`) |
| `codex`       | OpenAI Codex CLI   | `.codex/skills/` (project) or `~/.codex/skills/` (`--global`)        |
| `agents`      | Generic            | `.agents/skills/` — the shared convention also read by Gemini CLI, VS Code Copilot, and other Agent-Skills-compatible tools |

Pass `--dir <path>` to install into a project other than the current
directory, and `--global` to install to a platform's user-level directory
instead of the project-level one (ignored for platforms, like Cursor, that
only support project scope). Run `npx agent-rails help` for the full
option list.

`agentrails-build` and `agentrails-build-validation` both have a hard
prerequisite on the separate [skill-creator](https://claude.com/plugins/skill-creator)
skill — install it the same way into whichever tool you're using before
running either command; see "Minimum requirements" below.

## Why "Rail" — and why it's the actual product

A rail fixes the path a train follows; it doesn't drive the train. The
engine supplies the power, the speed, the judgment calls within the boundaries the
rail sets. Put a more capable engine on the same rail and it runs faster and
smoother — no new track required.

That's exactly the mechanism here. A Rail is a bundle of context documents that
fixes the mandatory path of a process (the **fixed core**) while leaving a
**judgment zone** — a zone where the LLM's own judgment decides *how* to execute
each step. A weaker model still completes every mandatory step correctly, because
the fixed core anchors it. A stronger model produces a better result on the exact
same path, because the judgment zone is where its extra capability shows up.

The Rail is not a byproduct or an intermediate file — **it is the product.** What
AgentRails ships, for any given process, is a Rail: a reusable, inheritable,
version-tracked artifact that outlives any single run.

## Two products, two different producers — don't confuse them

"The process" gets used for two different things here, and mixing them up
is the most common way to misread this project:

1. **A Rail** (`context/` + `process-name/SKILL.md` +
   `process-name-validation/SKILL.md` + `rail.mjs` + `checks.mjs`) — what
   **AgentRails** builds. AgentRails' own job ends here; see "Anatomy of a
   Rail" below.
2. **`output-process-name/`** (tracking files + whatever the process
   actually produces) — what running a Rail's *own* `process-name` skill
   builds, **afterward**, as a separate act, possibly much later and by a
   different model. AgentRails never writes to this directory and doesn't
   know it exists until `process-name` creates it.

The "Anatomy of a Rail" diagram below shows both together in one tree, for
reference — but only #1 is AgentRails' own output.

## Progressive execution: what happens when you run a Rail

Running a Rail is not a one-shot pass. Its execution is incremental and resumable
by design — to survive interruptions (e.g. running out of tokens mid-run), writing
progress live to a tracking file so a partial run can pick up where it left off.
All tracking writes go through the generated `rail.mjs` harness (never hand-edited
by the agent), and each step is gated by `checks.mjs` before the run advances —
so progress claims are cross-checkable against mechanical evidence, not taken on
the executing model's word.

Once a pass finishes completely, running the process again is a **clean restart**:
the user is asked "run it again? previous results will be deleted," and if they
say yes, `output-process-name/` is wiped and the process runs from Step 1 down the
exact same fixed path — possibly with a different or more capable model this time.
A bare Rail keeps no memory of prior passes and does not compare a new pass against
a discarded one; it only guarantees the same path is followed every time.

## The 5 defining principles of a Rail

1. **Guides, doesn't dictate the exact "how"** — mandatory steps + hard limits, but
   the agent decides execution details within each step.
2. **Verifiable, not just descriptive** — each step has a way to confirm it was
   satisfied before moving on, classified by verifier kind: mechanically
   verified by code wherever possible, explicitly labeled agent-judged where
   not.
3. **Resolves ambiguity explicitly** — when instructions conflict, the guide says
   what wins.
4. **Has a declared escape point** — when the agent can't comply, it stops and
   asks the user. It does not guess and move on.
5. **Explicit scope** — the guide states when it applies and when it doesn't.

## Pipeline

```
User: prompt + supporting data describing the process
        │
        ▼
agentrails-design         ← the ONLY step needing LLM/agent reasoning.
(LLM-driven)                 Detects ambiguity, classifies fixed core vs.
                              judgment zone, resolves ambiguity up front.
        │
        ▼
   Standardized context documents (draft)
        │
   ┌────┴────┐
   ▼         ▼
agentrails-build      agentrails-build-validation
(deterministic         (deterministic — consumes Validation.md + Backbone.md
 workflow — everything  as specific input, not a generic validation)
 already disambiguated)
   │                     │
   ▼                     ▼
process-name        process-name-validation
(runs the Rail)      (validates a completed run against the Rail)
```

Only `agentrails-design` requires model judgment. `agentrails-build` and
`agentrails-build-validation` are mechanical transformations — by the time they
run, all ambiguity has already been resolved.

## User manual

This section documents each of the 3 commands precisely enough that an agent
with no other context — no memory of this conversation, no assumptions about
what "should" happen — can invoke them correctly. If any input listed as
required is missing or unclear, the command stops and asks rather than
guessing; none of the three ever infers a `process-name` or a file location
on its own.

### 1. `agentrails-design`

The pipeline's entry point. Delivered as the Agent Skill at
`skills/agentrails-design/SKILL.md`.

- **Invoke when**: there is a process description (a prompt plus whatever
  supporting material describes how the process should work) and no Rail
  exists for it yet, or an existing Rail's `context/` bundle needs to be
  extended/merged with another one.
- **Required inputs**:
  - The process description itself (prompt + supporting data). A Product
    Requirements Document (PRD) works well as-is for this: a real PRD
    already states objectives, constraints, and scope — most of what
    `Backbone.md` needs — so it can be handed in directly rather than
    rewritten into a prompt first. The Rail that comes out of it, once
    built and run, is what actually constructs whatever the PRD describes.
  - `process-name` — a stable identifier for this Rail. If not given, ask
    the user for it; never invent one, since other Rails may later inherit
    from it by name.
- **Optional inputs**:
  - A list of local paths and/or Git repository URLs, each pointing to an
    already-built Rail's `context/` bundle, to merge into this one via
    inheritance.
  - The output location for `<process-name>/`, if not obvious from context.
- **Example invocation**:
  ```
  /agentrails-design PRD.md standard-builder /home/Projects/Code/ECC/ /home/Projects/Code/ECCStandards/
  ```
  - `PRD.md` — the process description.
  - `standard-builder` — the `process-name`.
  - `/home/Projects/Code/ECC/` — no `context/` bundle inside it yet, so
    it's the output location: `standard-builder/` gets created here.
  - `/home/Projects/Code/ECCStandards/` — already has a `context/` bundle
    (an existing Rail encoding this org's coding standards), so it's
    treated as a bundle to merge: `standard-builder` inherits from it.
- **Preconditions**: `Design.md`, `Backbone.md`, `Workflow.md`,
  `Validation.md`, and `Readme.md` must exist in a `templates/` directory
  this command can reach — normally `templates/` bundled right next to
  this skill's own `SKILL.md` (the installer copies it there automatically,
  see "Installing the AgentRails skills" above), or `templates/` at the
  AgentRails repo root if running directly from a clone without having
  installed. This command reads them as the base pattern for every
  document it produces, and stops if neither location has all 5 files.
- **Produces**: `<process-name>/context/Design.md`,
  `<process-name>/context/Backbone.md`, `<process-name>/context/Workflow.md`,
  `<process-name>/context/Validation.md`,
  `<process-name>/context/Readme.md` — a **draft** Rail context bundle. It
  does not scaffold `SKILL.md` packages, and it does not auto-chain into
  `agentrails-build`.
- **On ambiguity**: resolves it before moving to the next document — either
  states a flagged assumption inline (visible to a reviewer, not buried) or
  asks the user directly. Never silently picks an interpretation.
- **On a bundle merge conflict**: stops and reports the full list of
  contradicting objectives/hard limits across the input bundles. No
  automatic resolution, no partial merge — resolving conflicting input
  contexts is the user's responsibility.

### 2. `agentrails-build`

Deterministic. Delivered as the Agent Skill at
`skills/agentrails-build/SKILL.md`.

- **Invoke when**: a Rail's `context/` bundle exists and has been reviewed
  (`Backbone.md` especially, since it's the source of truth). Never invoke
  this directly on a raw process description — that's what
  `agentrails-design` is for.
- **Required inputs**:
  - `<process-name>/context/Backbone.md`
  - `<process-name>/context/Workflow.md`
  - `<process-name>/context/Readme.md`
- **Hard prerequisite**: the `skill-creator` skill must be installed and
  available. This command refuses to hand-roll `SKILL.md` packaging itself
  — if `skill-creator` is missing, it stops and says so instead of
  improvising a substitute.
- **Preconditions**: all 3 required files exist, and every step in
  `Workflow.md` cites Backbone objective/hard-limit IDs that actually exist
  in `Backbone.md`.
- **Produces**: `<process-name>/process-name/SKILL.md` (the literal folder
  name matches `process-name`, so it can be installed as-is into a
  platform's skills directory) — a runnable skill implementing
  `Workflow.md`'s fixed step sequence and the 4-phase
  progressive-execution state machine (§10.2 of `PRD.md`), whose Phase 4
  is a clean, destructive restart, not an accumulating one — plus
  `<process-name>/rail.mjs`, the zero-dependency runtime harness that owns
  every write to `ProcessTracking.md` (`init`/`start`/`finish`), so the
  executing agent never hand-edits its own progress log.
- **On an inconsistency** (e.g. a `Workflow.md` step with no traceable
  Backbone citation): stops and reports it rather than silently dropping or
  inventing a fix — that's a defect from the design phase to send back, not
  something to patch here.

### 3. `agentrails-build-validation`

Deterministic. Delivered as the Agent Skill at
`skills/agentrails-build-validation/SKILL.md`.

- **Invoke when**: a Rail's `context/Validation.md` and `context/Backbone.md`
  exist and have been reviewed. It does not depend on `agentrails-build`
  having already run — the two build commands can run in either order —
  though *using* the resulting `process-name-validation` skill obviously
  requires `process-name` to have produced output first.
- **Required inputs**:
  - `<process-name>/context/Validation.md`
  - `<process-name>/context/Backbone.md`
- **Hard prerequisite**: the `skill-creator` skill must be installed and
  available, same as `agentrails-build`.
- **Preconditions**: both required files exist, and every checklist item in
  `Validation.md` cites Backbone objective/hard-limit IDs that actually
  exist in `Backbone.md`.
- **Produces**: `<process-name>/process-name-validation/SKILL.md` — a
  runnable skill implementing `Validation.md`'s checklist as checks against
  `output-process-name/` (mechanical evidence first, LLM judgment only for
  `verifier: agent` items, and a tiered final report: mechanically
  verified / agent-verified / failed), `ValidationTracking.md` generation
  (STEP column seeded from `ProcessTracking.md`), and a state machine
  mirroring `process-name`'s own resumability logic — plus
  `<process-name>/checks.mjs`, the zero-dependency mechanical checker
  compiled verbatim from the checklist's `verifier: script` items. Run it
  directly any time (`node checks.mjs`, or `--step N` for a single step)
  for a model-independent verdict.
- **On a checklist item that isn't concretely checkable** (or a
  `verifier: script` item written outside the fixed assertion vocabulary):
  stops and reports it — sends the user back to `agentrails-design` to
  sharpen it, rather than softening the check to make it pass
  mechanically.

### After both build commands have run

`<process-name>/process-name/SKILL.md` and
`<process-name>/process-name-validation/SKILL.md` are themselves Agent
Skills — install them into whichever platform's skills directory applies
(see "Minimum requirements" below) and invoke them directly to run and
validate the process. Neither is part of the AgentRails pipeline itself;
they are what the pipeline produces.

## Anatomy of a Rail

(See "Two products, two different producers" above — only `context/`, the
two `SKILL.md` files, and the two harness scripts are AgentRails' own
output; `output-process-name/` is produced later, by running the Rail, not
by AgentRails.)

```
<process-name>/
├── context/                        ← shared by BOTH commands
│   ├── Design.md       — big-picture overview + diagrams
│   ├── Backbone.md     — objectives (positive) AND hard limits ("negative
│   │                     objectives") — single source of truth
│   ├── Workflow.md     — fixed step sequence derived from Backbone.md
│   ├── Validation.md   — checklist derived from Backbone.md to confirm the
│   │                     workflow was correctly and completely executed
│   └── Readme.md       — meta-instructions: ambiguity-resolution precedence,
│                          escalation rule (stop and ask the user)
├── rail.mjs                        ← runtime harness; owns all writes to
│                                     ProcessTracking.md (init/start/finish)
├── checks.mjs                      ← mechanical checker compiled from
│                                     Validation.md's script items
├── output-process-name/            ← runtime output of running the Rail
│   ├── ProcessTracking.md          — per-step status, incl. which agent ran it
│   ├── ValidationTracking.md       — validation pass status, same schema
│   └── (actual process deliverables)
├── process-name/SKILL.md              (runs the process)
└── process-name-validation/SKILL.md   (validates a completed run)
```

## Minimum requirements

- [skill-creator](https://claude.com/plugins/skill-creator) — `agentrails-build`
  always scaffolds `SKILL.md` packages through skill-creator rather than
  hand-rolling them. This is a hard prerequisite.
- **Node.js >= 18 on the machine that runs a Rail** — the generated
  `rail.mjs` and `checks.mjs` are plain, zero-dependency Node scripts
  invoked by the generated skills (and runnable directly by you).
- A target platform that supports Agent Skills — see "Installing the
  AgentRails skills" above for the full list of supported targets and
  install paths (Claude Code, Google Antigravity, Cursor, ZCode, Kimi Code
  CLI, OpenAI Codex CLI, and any other tool reading the generic
  `.agents/skills/` convention).

## Merging pre-existing Rails

`agentrails-design` accepts a list of local paths and/or Git repository URLs,
each pointing to an already-built Rail's context bundle. If contradictions are
found across bundles (conflicting objectives, hard limits, etc.), the tool reports
them and stops — no automatic conflict resolution, no partial merge. Providing
coherent input contexts is the user's responsibility.

The recommended pattern is **inheritance**: build an agnostic/base Rail's context
first, then a child Rail whose context is a specific application of it. Merging a
base Rail's Backbone/Validation with a child's is the natural, low-contradiction
case.

## Relationship to AgentRefinery

AgentRails owns the mechanism only: producing a Rail, and running it
consistently down the same fixed path regardless of which model executes it.
It has no notion of comparing results across repeated runs or deciding one
pass is "better" than another — a bare Rail's re-run is a clean, destructive
restart (see "Progressive execution" above).

**AgentRefinery** is a separate, sibling project that consumes the Rails and
`output-process-name/` results this project produces, and owns the entirely
separate concern of comparing a Rail's output across repeated runs — possibly
with increasingly capable models — and keeping the best result. If you want
that behavior, use AgentRefinery on top of a Rail built here; this repo does
not implement it.
