---
title: AgentRails — Product Requirements Document
status: active
version: 0.1.0
created: 2026-07-27
updated: 2026-07-29
role: Single, self-contained reference for the entire AgentRails project —
  problem, concept, architecture, every command, every document, every
  state machine, and the rationale behind every naming decision. Written so
  a reader (human or AI agent) with no memory of how this project came to
  be can pick it up and continue work correctly, without re-deriving
  anything from a prior conversation.
---

# AgentRails — Product Requirements Document

## 0. How to use this document

This is the authoritative, exhaustive specification of AgentRails. It
exists so the project can survive losing all conversational context — every
concept, decision, and rationale that shaped the project should be
recoverable from this file alone, cross-referenced against the actual
files in the repo (which remain the source of truth for exact current
wording of `README.md`, `DESIGN-NOTES.md`, `templates/*.md`, and
`skills/*/SKILL.md`).

- **`README.md`** is the pitch + quick reference: what AgentRails is, why
  the Rail matters, and a concise user manual for the 3 commands.
- **This document (`PRD.md`)** is the full requirements spec: every
  concept, every document's exact structure, every state machine, and
  every decision made and why.
- **`DESIGN-NOTES.md`** is the working scratchpad where decisions were
  first drafted — largely superseded by this document now that the project
  has stabilized, but kept as a session-by-session log of how the design
  evolved.
- **`templates/*.md`** and **`skills/*/SKILL.md`** are the actual
  implementation artifacts. If this PRD and the implementation ever
  disagree, treat that as a bug to reconcile, not a signal that either one
  is automatically right — check which one is stale.

If you are an AI agent picking up this project cold: read this document in
full before touching any code or generating any Rail. Do not assume
anything not written down here or in the files it references — that
"assume nothing, document everything" rule is itself a project requirement
(see §14).

**A sibling project, AgentRefinery, builds on top of AgentRails.**
AgentRails' only job is producing a Rail and running it consistently,
end to end, once per invocation — it does not know or care whether its
output is ever compared across runs, improved, or accumulated. Iterative,
cross-model improvement of a Rail's output over repeated runs is a
separate concern, owned entirely by the AgentRefinery project, which
consumes AgentRails' generated skills and output directories as its input
rather than reimplementing or modifying them. See §3, item 5, for the
history of how these ended up as two projects instead of one.

---

## 1. Problem statement — the gap this project fills

Today there are two ways to get an AI agent to execute a process
repeatedly:

- **Automate it fully** (script / workflow / RPA). This freezes quality at
  the day the automation was written. A more capable LLM underneath
  doesn't improve anything, because the logic no longer runs through the
  model — it's been compiled away into fixed code.
- **Re-prompt it each time** (a raw prompt, re-run from scratch every
  time). This scales with model capability — a better model does a better
  job — but sacrifices consistency. Every run can drift, skip critical
  steps, or interpret the same instructions differently, because nothing
  fixes the mandatory path.

Neither option lets you have both: a process that stays consistent every
time it runs, *and* whose quality still benefits from whatever model
capability is available at the time.

**AgentRails' answer**: compile a documented process into a guide that
fixes the mandatory path (what must always happen, and how it's verified)
while leaving open the zone where model judgment adds quality. The same
guide, run by an older or a newer LLM, follows the exact same path — the
result within that path can vary with model capability, but the path
itself never does, and nobody has to rewrite anything to keep it that way.

A candid caveat, built into the mechanism itself (§4.1): a path written in
prose is only ever *enforced* by another model's obedience to that prose.
So every check in a Rail is classified by **verifier kind** — what code
can verify, code verifies (`verifier: script`, compiled into an executable
checker, §8.7); what genuinely requires semantic judgment is verified by
the executing/validating agent and explicitly labeled a soft guarantee
(`verifier: agent`). The precise promise is therefore not "the same path
is guaranteed by the instructions" but: **the same verifiable milestones,
with the largest possible surface verified mechanically, regardless of
which model runs it.**

That guide is called a **Rail**. Producing Rails, and running them
consistently, is the entire point of AgentRails.

---

## 2. The core concept: the Rail

### 2.1 Definition

A **Rail** is the product AgentRails generates for a given process. It is
not a single file — it's a bundle: 5 context documents, a matched pair
of runnable Agent Skills, and a matched pair of harness scripts
(`rail.mjs`, `checks.mjs` — the mechanical verification layer, §4.1).
See §9, "Anatomy of a Rail," for the exact file layout.

### 2.2 The metaphor and why the name matters

A physical rail fixes the path a train follows; it does not drive the
train. The engine supplies the power, the speed, and the judgment calls
within the boundaries the rail sets. Put a more capable engine on the same
rail and it runs faster and smoother — no new track required.

That is exactly the mechanism AgentRails implements: a Rail fixes the
mandatory path of a process (the **fixed core**, §4) while leaving a
**judgment zone** where the executing LLM's own judgment decides *how* to
carry out each step. A weaker model still completes every mandatory step
correctly, because the fixed core anchors it. A stronger model produces a
better result on the exact same path, because the judgment zone is where
its extra capability shows up.

### 2.3 The Rail is the product — not a byproduct

**The Rail itself — the reusable, inheritable, version-tracked context
bundle — is what AgentRails exists to generate.** The deliverables
produced by *running* a Rail matter, but they are not the product; they're
the output of using the product. The product is the guide that can be
handed to a better model next month and get a better result on the exact
same path, without anyone touching its definition.

### 2.4 Two different products, two different producers — do not conflate them

The word "process" gets used for two different things in this project, and
confusing them is the single most common misreading of this spec:

1. **A Rail** — `<process-name>/context/` (5 documents) +
   `<process-name>/process-name/SKILL.md` +
   `<process-name>/process-name-validation/SKILL.md` +
   `<process-name>/rail.mjs` + `<process-name>/checks.mjs` (the mechanical
   verification layer, §4.1). This is **AgentRails'
   product** (§2.3). It is produced by AgentRails' 3 commands (§6, §7), and
   it does not change afterward except by deliberately re-running
   `agentrails-design`, `agentrails-build`, or `agentrails-build-validation`.
2. **`output-process-name/`** — `ProcessTracking.md`, `ValidationTracking.md`,
   and whatever deliverables the process actually produces (a codebase, a
   document set, anything). This is **a Rail's product**, not AgentRails'
   product. It only comes into existence after a separate act: a human or
   agent invoking the Rail's already-built `process-name` skill (§7.4) and
   letting it run. AgentRails itself never writes to `output-process-name/`
   and has no knowledge of its contents — that directory doesn't even exist
   until `process-name` creates it, at a point where AgentRails is no
   longer involved at all.

Put differently: AgentRails builds the guide (#1); running the guide is
what builds the deliverables (#2), and that running happens entirely
outside of AgentRails, at a later time, by a separately invoked skill,
possibly with a different model, possibly run more than once (§2.5). §9's
directory layout shows both together, for reference, in one tree — but
they are produced by two different actors at two different times. Do not
read that one diagram as "the directory structure AgentRails outputs" —
only the `context/` subtree, the two `SKILL.md` packages, and the two
harness scripts (`rail.mjs`, `checks.mjs`) are that;
`output-process-name/` is not.

### 2.5 Running a Rail is incremental, not one-shot

Running `process-name` (the skill a Rail's `context/` compiles down to) is
not all-or-nothing. Execution is incremental and resumable by design — so
a run can survive interruptions (e.g. running out of tokens mid-run)
without losing progress. See §10 for the full mechanics (`ProcessTracking.md`,
the state machine).

Once a run finishes completely, AgentRails treats that as a closed cycle:
if the user wants to run the process again — with the same model or a
different one — the clean, deliberate way to do that is a **fresh pass**:
prior output is discarded and the process starts over from Step 1 down the
same fixed path (§10.2, Phase 4). AgentRails does not compare the new pass
against the discarded one, does not keep a history of prior passes, and
does not merge results across runs — a Rail by itself has no memory of its
own past executions. That is by design: a bare Rail's only job is
guaranteeing the same path is followed every time, not deciding whether
one pass's result is better than another's. A tool that wants to keep
prior output around and decide whether a new pass improves on it (across
one or many re-runs, potentially with increasingly capable models) has to
do that itself, outside of what a Rail's own generated skill does — see
the note in §0 about AgentRefinery.

---

## 3. Naming decisions — history and rationale

This section exists specifically to prevent re-litigating settled
decisions, and to preserve *why* they were made, not just what was
decided.

1. **The project was first called "AgentRails," then briefly folded into a
   single project named "AgentRefinery."** Early on, the fixed-path
   mechanism (a Rail) and the idea of improving a Rail's output over
   repeated runs with increasingly capable models (informally, "the
   Refinery") were designed together, under one name, on the reasoning
   that "Rails" named only the mechanism while the real point was the
   repeated improvement. In practice this conflated two independent
   concerns into one project and one generated skill's state machine: a
   Rail's own re-run behavior ended up hard-coded to never delete prior
   output and to log improvement passes to a `Changelog.md`, whether or
   not anyone using a given Rail actually wanted that behavior.
2. **Split back into two sibling projects: AgentRails (this repo) and
   AgentRefinery (separate repo).** AgentRails owns the mechanism only —
   producing a Rail and running it consistently, with a plain, destructive
   re-run (§2.5, §10.2 Phase 4): no cross-run memory, no changelog, no
   "is this better" judgment baked into the generated skill. AgentRefinery
   is a separate project that consumes AgentRails' generated skills and
   output as input, and owns the entirely separate concern of comparing
   results across repeated runs and keeping the best one. This mirrors the
   original naming intuition (mechanism vs. purpose) without forcing one
   project to serve both purposes at once.
3. **Whether "Rail" (English) / "Riel" (Spanish) survives as a branded
   term went through three stages, in order:**
   - First draft: "Rails/Rieles" was to be explained once in the README
     as a conceptual origin, then retired from ongoing project vocabulary
     — no umbrella noun for "the produced artifact" was settled, defaulting
     to plain language like "the generated process."
   - **Reversed**: "Riel" (then "Rail") was confirmed as the *active,
     permanent operational term* for the produced artifact — not retired
     branding. The reasoning: the produced artifact needed a name, and
     "Rail" is literally more precise than plain language, since the
     rail/track metaphor *is* the mechanism (fixed core = the track,
     judgment zone = the engine's freedom). This resolved the earlier open
     item of "no umbrella noun for the produced artifact."
   - **Corrected to English-only**: the term was initially written in
     Spanish ("Riel"/"Rieles") in some drafts. Since all project documents
     are English-only (see §14), the term was corrected to its English
     form: **Rail** (singular), **Rails** (plural). This is now final and
     consistent across every file in the repo.
4. **`agentrails-buildvalidation` → `agentrails-build-validation`.** The
   original command name concatenated "build" and "validation" without a
   separator. Corrected so every word in a command name is
   hyphen-separated, matching the convention already used everywhere else
   (`agentrails-design`, `agentrails-build`, `process-name`,
   `process-name-validation`). This was a pure naming-consistency fix, not
   a behavior change — the skill's directory and all cross-references
   were renamed together in the same pass.
5. **"Núcleo fijo" / "zona de criterio" → "fixed core" / "judgment
   zone."** These Spanish-language concept terms were used in early
   drafts to describe the per-step split that is the actual mechanism
   behind a Rail (§4). They were translated to English for the same
   reason as item 3 — no exceptions to the English-only rule, even for
   terms that started as Spanish shorthand during design discussions.
   Bold emphasis on the terms was preserved through the translation.
6. **The mechanical verification layer: `verifier: script` / `verifier:
   agent`, `rail.mjs`, `checks.mjs`.** Added after a design review
   surfaced that the "same path regardless of model" promise rested
   entirely on natural-language obedience — the executor followed prose
   instructions, and the validator was another LLM reading more prose, so
   neither the path nor its checking was guaranteed by any mechanism.
   The fix classifies every check by **verifier kind**: `script` (code
   verifies it — compiled into `checks.mjs`) or `agent` (an LLM verifies
   it — explicitly a soft guarantee). The two generated harness scripts
   were named for what they do, in plain English, as single files at the
   Rail bundle root: `rail.mjs` (runtime harness; owns all writes to
   `ProcessTracking.md`, generated by `agentrails-build`) and
   `checks.mjs` (the mechanical checker compiled from `Validation.md`'s
   `script` items, generated by `agentrails-build-validation`). Plain
   `.mjs` files rather than skills, because they are invoked by the two
   generated skills as subprocesses — they are not themselves Agent
   Skills and never go through `skill-creator`. Zero runtime
   dependencies, Node.js built-ins only — the same constraint as
   `bin/cli.js`, so a generated Rail runs anywhere Node >= 18 runs.

---

## 4. The core mechanism: fixed core vs. judgment zone

This is the single mechanism that makes a Rail different from both a
rigid workflow and a raw prompt. Per step in a Rail's `Workflow.md`, split
the step into two parts:

- **Fixed core** — the invariant action, plus a concrete, checkable way to
  verify it before moving on. Worded so the verification gives the same
  answer no matter which model runs it. This guarantees the same path is
  followed regardless of model capability.
- **Judgment zone** — where the executing LLM's judgment operates. A more
  capable model produces better quality *here*, without deviating from
  the path, because the fixed core still anchors it. May be empty for a
  fully mechanical step, but most steps should have one.

This is exactly what a rigid workflow lacks (no judgment zone —
everything is fixed, so a more capable model can't improve anything) and
what a raw prompt lacks (no fixed core — everything is open, so
consistency isn't guaranteed).

### 4.1 The verification layer: `script` vs. `agent` checks

A fixed core whose verification is prose read by an LLM is only as fixed
as that LLM's obedience — and a validation pass that is itself an LLM
reading a checklist is the same kind of thing it is checking. Left like
that, "the same path regardless of model" is a hope, not a property of
the system. The verification layer is how a Rail turns as much of that
hope as possible into mechanism:

- **Every check is classified by verifier kind**, at design time
  (`agentrails-design`, §7.1), both in `Workflow.md`'s per-step
  verification and in `Validation.md`'s checklist:
  - **`verifier: script`** — the check is expressed in the assertion
    vocabulary (§8.7), a small fixed set of mechanically evaluable
    assertions (file exists, literal present/absent, regex match,
    minimum count). `agentrails-build-validation` compiles these
    verbatim into `checks.mjs` (§7.3) — because the vocabulary is fixed,
    compilation is a mechanical transformation, not code interpretation.
  - **`verifier: agent`** — the check genuinely requires semantic
    judgment. It stays prose, is verified by the executing/validating
    agent, and is **always labeled a soft guarantee** in validation
    output (§10.3). `agent` is the last resort, not the default.
- **`rail.mjs` owns the tracking file.** `ProcessTracking.md` is written
  only through `rail.mjs` (`init` / `start` / `finish`, §10.2), never
  hand-edited by the executing agent — timestamps are real, and a step
  can only be marked done through an explicit, logged harness call.
  Combined with `checks.mjs`, a tracking row that claims ✅ while its
  step's `script` checks fail is a *detectable contradiction*, not a
  diary entry everyone has to trust.
- **Per-step gating.** Before `process-name` advances past a step, the
  step's `script` checks are run via `checks.mjs --step N` (§10.2).
  Validation stops being only a post-mortem audit and becomes a gate
  *during* execution.
- **Independently re-runnable evidence.** `node checks.mjs` can be run
  by the user at any time, outside both skills. The mechanical layer's
  results don't depend on any model's say-so — that is precisely what
  makes them the hard tier of the conformance report (§10.3).

**The honest ceiling.** This layer makes deviations *detectable with
objective evidence* and makes the honest path the easiest path; it does
not make deviation *impossible* — an executing agent can still ignore
the instruction to call the harness, because a SKILL.md is still prose.
True prevention (blocking tool calls before they happen) requires
host-level hooks, which are platform-specific and out of scope for the
portable Agent Skills format — tracked as an open item in §17. And the
judgment zone, by definition, is never mechanically verifiable: the goal
is to maximize the mechanically verified surface and label the rest,
never to pretend the whole path is steel.

---

## 5. The 5 defining principles of a Rail

Every Rail, regardless of the process it encodes, satisfies these five
properties. They are the acceptance criteria for "is this actually a
Rail" as opposed to a workflow or a prompt:

1. **Guides, doesn't dictate the exact "how"** — mandatory steps and hard
   limits are fixed, but the agent decides execution details within each
   step (the judgment zone).
2. **Verifiable, not just descriptive** — each step has a concrete way to
   confirm it was satisfied before moving on (the fixed core's
   verification), and every such check is classified by verifier kind
   (§4.1): mechanically verified by code wherever possible, explicitly
   labeled as agent-judged where not.
3. **Resolves ambiguity explicitly** — when instructions conflict, the
   Rail's `Readme.md` states what wins (see §8.6, precedence order).
4. **Has a declared escape point** — when the executing agent can't
   comply with a step, it stops and asks the user. It never guesses and
   moves on. This is a fixed, non-negotiable rule across every Rail (see
   §8.6, escalation rule) — it is not something a specific process's
   design can override.
5. **Explicit scope** — the Rail states when it applies and when it
   doesn't, so the executing agent can recognize being asked to run it on
   something out of scope.

---

## 6. System architecture — the 3-command pipeline

AgentRails is not a single tool that produces one artifact once — it's
a small pipeline of 3 meta-commands, each delivered as an Agent Skill,
that together turn a process description into a Rail:

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
 — everything           as specific input, not a generic validation)
 already disambiguated)
   │                     │
   ▼                     ▼
process-name        process-name-validation
(runs the Rail)      (validates a completed run against the Rail)
```

**Key architectural decision**: only `agentrails-design` requires model
judgment. `agentrails-build` and `agentrails-build-validation` are
mechanical transformations, because by the time they run, all ambiguity
has already been resolved by `agentrails-design`. This is why they can be
"fixed workflows" without contradicting the "a Rail is not a rigid
workflow" philosophy from §4 — the rigidity applies to *this
transformation step* (building the Rail's runnable skills), not to how
the end agent executes the process once built. The process execution
itself (`process-name`) still has a judgment zone per step; the *build
tooling* does not, because building is not the process — it's mechanical
packaging of an already-disambiguated spec. The same reasoning covers the
two harness scripts the build commands now emit (`rail.mjs`, `checks.mjs`,
§4.1): because every `verifier: script` check is written in the fixed
assertion vocabulary (§8.7), compiling it into executable code is a
lookup-and-substitute transformation, not code authorship — no judgment
enters at build time.

---

## 7. Command specifications

The concise version of this section lives in `README.md`'s "User manual."
This section is the fuller reference; the actual runtime instructions
live in each command's `SKILL.md` (`skills/<name>/SKILL.md`) — if this
section and a `SKILL.md` ever disagree, the `SKILL.md` is what actually
executes and should be treated as current; update this PRD to match.

### 7.1 `agentrails-design`

**File**: `skills/agentrails-design/SKILL.md`. **Judgment**: yes — the
only command in the pipeline that requires LLM reasoning.

**Purpose**: turn a process description into a draft Rail context bundle
(5 documents), resolving all ambiguity up front so the two build commands
downstream can be purely mechanical.

**Inputs**:
1. Process description (prompt + supporting data) — required. **A PRD is
   an excellent process description on its own.** A well-written Product
   Requirements Document already states objectives, constraints, and
   scope — most of what `Backbone.md` needs — so it can be handed to
   `agentrails-design` directly, rather than rewritten into a prompt
   first. The Rail produced from it, once built (§7.2, §7.3) and run
   (§10), is what actually constructs whatever the PRD describes.
2. `process-name` — required identifier; if not given, ask the user, never
   invent one (it's a durable identifier other Rails may inherit from
   later).
3. Bundles to merge (optional) — local paths and/or Git URLs pointing to
   already-built Rails' `context/` directories, for inheritance.
4. Output location — ask if not obvious from context.

**Disambiguating unlabeled filesystem paths**: an invocation may pass
several bare paths after the process description and `process-name`
without saying which is the output location and which is a bundle to
merge. Resolve each one by inspection, not by position: a path that
already contains a `context/` subdirectory with the 5 Rail documents is a
**bundle to merge**; a path that doesn't is the **output location**. If a
path can't be checked this way (e.g. it doesn't exist yet), ask the user
rather than assume.

**Example invocation**:
```
/agentrails-design PRD.md standard-builder /home/Projects/Code/ECC/ /home/Projects/Code/ECCStandards/
```
- `PRD.md` — process description.
- `standard-builder` — `process-name`.
- `/home/Projects/Code/ECC/` — no `context/` bundle inside it yet → output
  location; `standard-builder/` gets created here.
- `/home/Projects/Code/ECCStandards/` — already has a `context/` bundle
  (an existing Rail encoding this org's coding standards) → bundle to
  merge; `standard-builder` inherits from it.

**Behavior, in order**:
1. Read all 5 base template files (`Design.md`, `Backbone.md`,
   `Workflow.md`, `Validation.md`, `Readme.md`) — these define the required
   frontmatter and section skeleton for each document type. Each
   template's own `TEMPLATE INSTRUCTIONS` comment block is guidance for
   the generator and must never leak into the generated output. Their
   location depends on how `agentrails-design` reached the agent running
   it — check in order, use the first that has all 5 files, and stop if
   neither does:
   - `templates/` next to this skill's own `SKILL.md` — where the
     installer (`bin/cli.js`, §12) bundles a copy specifically so an
     installed `agentrails-design` is self-contained and never depends on
     the AgentRails repo still being present on disk. This is the path for
     every real (installed) invocation.
   - `templates/` at the AgentRails repo root — only when running this
     skill directly from a cloned AgentRails repo, without having gone
     through the installer (e.g. local development/testing, `CONTRIBUTE.md`).
2. If bundles to merge were given: read each one's `context/*.md`. If any
   two contradict each other (conflicting objectives, hard limits, etc.),
   **stop and report the full list of contradictions** — no automatic
   resolution, no partial merge; reconciling input contexts is the user's
   responsibility. If consistent, merge by union following the
   inheritance pattern (base Rail's context first, this Rail's context as
   a specific application layered on top).
3. Draft the 5 documents **in this order**, since each depends on IDs
   defined in the one(s) before it:
   - **Backbone.md** — extract positive objectives (IDs `O1, O2, ...`) and
     hard limits as negative objectives (IDs `L1, L2, ...`). Every
     objective/limit must be independently verifiable; if something can't
     be made checkable, that is the ambiguity to resolve now (step 4
     below), not later.
   - **Workflow.md** — derive the fixed step sequence from Backbone.md.
     Each step cites the Backbone ID(s) it fulfills/guards, and is split
     into fixed core + judgment zone (§4). The fixed core's verification
     is classified by verifier kind (§4.1): phrase it in the assertion
     vocabulary (§8.7) and mark it `verifier: script` whenever it can be
     mechanically checked; mark it `verifier: agent` only when it
     genuinely requires semantic judgment. A step whose fixed core can't
     be phrased as a concrete check is unresolved ambiguity — sharpen the
     underlying Backbone objective rather than writing a vague check.
   - **Validation.md** — derive a checklist from Backbone.md +
     Workflow.md. Each item cites Backbone refs and the Workflow step(s)
     it validates, is classified by verifier kind (§4.1), and states a
     concrete pass/fail condition checkable against the eventual output —
     not a restatement of the objective. `verifier: script` items are
     written as assertion-vocabulary entries (§8.7), never as prose a
     compiler would have to interpret. Hard limits (L#) get `script`
     checks whenever they are mechanically expressible (they usually are —
     think of them as lint rules). Every Backbone ID touched by
     Workflow.md should be covered by at least one checklist item, and
     every Workflow step with a `script` verification must be covered by
     at least one `script` checklist item citing that step (the mirroring
     rule, §8.4) so the per-step gate (§10.2) has something mechanical to
     run.
   - **Design.md** — descriptive big-picture overview + a Mermaid
     flowchart summarizing Workflow.md's steps. Written for a human
     reader who hasn't read Backbone.md yet. Explicitly
     non-authoritative — never introduces an objective, limit, or step
     not already in Backbone.md/Workflow.md.
   - **Readme.md** — meta-instructions: the standard precedence order
     (Backbone > Workflow > Validation > Design), the fixed escalation
     rule (stop and ask the user — not a per-process choice), and this
     Rail's explicit scope.
4. **Ambiguity handling** (applies throughout step 3, not just at the
   end): whenever source material is ambiguous or underspecified, resolve
   it before drafting the next document — either state a reasonable
   assumption inline, visibly (not buried, so a reviewer will notice), or
   ask the user directly if guessing risks producing an incorrect
   Backbone objective or hard limit. Never silently pick an interpretation
   and move on without surfacing it.
5. Fill every document's YAML frontmatter (see §8.1 for the shared
   schema).
6. Write the 5 files to `<process-name>/context/`.
7. Tell the user the bundle is a **draft for review** — recommend reading
   `Backbone.md` first (the source of truth) before running
   `agentrails-build`. Do **not** auto-chain into `agentrails-build` —
   the point of stopping here is for the user to review disambiguation
   decisions.

**Out of scope**: scaffolding `process-name/SKILL.md` or
`process-name-validation/SKILL.md` — that belongs to the two build
commands.

### 7.2 `agentrails-build`

**File**: `skills/agentrails-build/SKILL.md`. **Judgment**: no —
deterministic, mechanical transformation only.

**Purpose**: compile an already-disambiguated Rail context bundle into
the runnable `process-name` skill that executes the process.

**Hard prerequisite**: the `skill-creator` skill
(https://claude.com/plugins/skill-creator) must be available.
`agentrails-build` must **always** scaffold `process-name/SKILL.md`
through `skill-creator` — it never hand-rolls `SKILL.md` packaging
itself. If `skill-creator` is unavailable, it stops and says so rather
than improvising a substitute. This keeps every Rail-produced skill
consistent with the same packaging conventions as every other Agent
Skill.

**Required inputs**:
- `<process-name>/context/Backbone.md`
- `<process-name>/context/Workflow.md`
- `<process-name>/context/Readme.md`
(`Design.md` and `Validation.md` are not needed — Design.md is for human
orientation only, Validation.md belongs to `agentrails-build-validation`.)

**Preconditions**: all 3 required files exist; every step in
`Workflow.md` cites Backbone IDs that actually exist. If a step doesn't
trace back to Backbone.md, that's a defect from the design phase — stop
and report it, don't silently drop or fix it here.

**Behavior**:
1. Read `Backbone.md`, `Workflow.md`, `Readme.md`; verify traceability.
2. Generate `<process-name>/rail.mjs` — the runtime harness (§4.1,
   §10.2), a single zero-dependency Node.js script with the Workflow.md
   step list baked in, implementing exactly three subcommands: `init`
   (seed `ProcessTracking.md` with one empty-STATUS row per Workflow.md
   step), `start <step>` (stamp START for that row), and `finish <step>
   --ok|--error [--details "..."] [--agent "<model>"]` (stamp END, STATUS,
   DETAILS, AGENT). This file is generated directly — it is a plain
   script, not an Agent Skill, so it does **not** go through
   `skill-creator`.
3. Compose the content to hand to `skill-creator` as the target skill's
   required behavior:
   - **The fixed step sequence** — `Workflow.md`'s steps transcribed
     verbatim (order, fixed core / judgment zone split, Backbone refs,
     each fixed core's verifier kind). The executing agent follows this
     sequence exactly; it never invents, skips, or reorders steps.
     `Readme.md`'s escalation rule is carried into the generated skill's
     text.
   - **Harness-driven tracking** — all writes to `ProcessTracking.md` go
     through `node rail.mjs init/start/finish` (§10.2); the executing
     agent never edits that file by hand.
   - **Per-step gating** — before marking a step done, if
     `<process-name>/checks.mjs` exists and covers that step, run
     `node checks.mjs --step <N>` and require exit code 0; see §10.2 for
     the full state machine the generated skill must implement, including
     the fallback when `checks.mjs` doesn't exist yet.
4. Invoke `skill-creator` with: name = `<process-name>`; description =
   what the process does (from Backbone's objectives) plus a trigger
   phrase (e.g. "runs the `<process-name>` process end to end,
   progressively and resumably; use when the user wants to
   execute/continue/restart the `<process-name>` process"); output path =
   `<process-name>/process-name/SKILL.md`.
5. Confirm to the user that the skill is ready to run, and remind them
   `agentrails-build-validation` still needs to run to complete this
   Rail's execution/validation cycle — until it does, `checks.mjs` won't
   exist and the per-step gate runs in its weaker, agent-judged fallback
   mode (§10.2).

### 7.3 `agentrails-build-validation`

**File**: `skills/agentrails-build-validation/SKILL.md`.
**Judgment**: no — deterministic, mechanical transformation only. (See
§3, item 4, for why this command's name is fully hyphen-separated.)

**Purpose**: compile a Rail's checklist into the runnable
`process-name-validation` skill that checks a completed (or in-progress)
`process-name` run against that checklist.

**Hard prerequisite**: same as `agentrails-build` — must scaffold
through `skill-creator`; stop and say so if unavailable.

**Required inputs**:
- `<process-name>/context/Validation.md`
- `<process-name>/context/Backbone.md`
(`Design.md`, `Workflow.md`, `Readme.md` are not needed directly —
`Validation.md` was already derived from `Workflow.md` during design.
`Readme.md`'s escalation rule still gets carried into the generated
skill's text.)

**Preconditions**: both required files exist; every checklist item in
`Validation.md` cites Backbone IDs that actually exist. Does not depend
on `agentrails-build` having already run — the two build commands can
run in either order — though *using* the resulting
`process-name-validation` skill obviously requires `process-name` to have
produced output first.

**Behavior**:
1. Read `Validation.md`, `Backbone.md`; verify traceability. If a
   checklist item isn't concretely checkable, stop and send it back to
   `agentrails-design` rather than softening it into something that
   passes mechanically. Likewise, if a `verifier: script` item contains
   an assertion outside the §8.7 vocabulary, stop — that's a design-phase
   defect (either the item should be `verifier: agent`, or the vocabulary
   itself needs extending, which is an AgentRails-level change, not
   something to improvise per-Rail).
2. Generate `<process-name>/checks.mjs` — the mechanical checker (§4.1),
   a single zero-dependency Node.js script compiled verbatim from
   `Validation.md`'s `verifier: script` items: one check function per
   item, each a direct translation of its assertion-vocabulary entries
   (§8.7), keyed by item ID and by the Workflow step(s) it cites.
   Invocation: `node checks.mjs` runs every `script` check;
   `node checks.mjs --step <N>` runs only the checks citing step N
   (this is what the per-step gate in §10.2 uses). Exit code 0 = all run
   checks passed; non-zero with a per-check report otherwise. The report
   also lists the `verifier: agent` items (without executing them — they
   are the validation skill's job) so nothing on the checklist is
   silently dropped. In addition to the compiled items, every
   `checks.mjs` includes three built-in consistency checks: both tracking
   files parse under the §10.1 schema; their STEP columns stay aligned;
   and no `ProcessTracking.md` row marked ✅ belongs to a step whose
   `script` checks currently fail (a self-reported claim contradicting
   mechanical evidence — always reported as a divergence, never silently
   trusted). Like `rail.mjs`, this file is generated directly — a plain
   script, not an Agent Skill, so it does **not** go through
   `skill-creator`.
3. Compose the content to hand to `skill-creator`:
   - **The checklist** — `Validation.md`'s items transcribed verbatim
     (Backbone refs, Workflow step(s) validated, verifier kind, concrete
     pass/fail condition or assertions). Checked against actual
     deliverables in `output-process-name/` — never invents criteria
     beyond what `Validation.md` specifies.
   - **Mechanical first** — the generated skill runs `node checks.mjs`
     and treats its output as objective evidence (§10.3); its own
     LLM judgment applies only to `verifier: agent` items.
   - **`ValidationTracking.md` generation** — see §10.1 for schema
     (STEP column seeded from `ProcessTracking.md`) and §10.3 for the
     full state machine the generated skill must implement.
   - **Tiered report** — the final report classifies every step/check as
     *mechanically verified* (hard guarantee), *agent-verified* (soft
     guarantee, labeled as such), or *failed*; see §10.3.
   - **Escalation** — if the validation skill itself can't determine
     whether an item passes (a judgment call `Validation.md` didn't
     anticipate), it stops and asks the user rather than guessing
     pass/fail.
4. Invoke `skill-creator` with: name = `<process-name>-validation`;
   description = what it validates plus a trigger phrase; output path =
   `<process-name>/process-name-validation/SKILL.md`.
5. Confirm to the user that this Rail's execution/validation cycle is
   complete: `process-name` runs the process, `process-name-validation`
   checks it, and either one can be run again from scratch (§10.2 Phase
   4) — potentially with a more capable model — without anyone touching
   this Rail's context documents again.

### 7.4 What comes after both build commands

`<process-name>/process-name/SKILL.md` and
`<process-name>/process-name-validation/SKILL.md` are themselves Agent
Skills — install them into whichever platform's skills directory applies
(§12) and invoke them directly to run and validate the process. Neither
is part of the AgentRails pipeline itself; they are what the pipeline
produces, and they persist independently of AgentRails after that.

---

## 8. The Rail context bundle — the 5 documents

Every Rail's `context/` directory contains exactly 5 documents, always
generated in dependency order (Backbone → Workflow → Validation → Design
→ Readme, per §7.1). Each document type has a base pattern in
`templates/<Doc>.md` at the AgentRails repo root, which
`agentrails-design` fills in per-process.

### 8.1 Shared frontmatter schema

All 5 documents (in both the `templates/` base pattern and any generated
Rail's `context/`) start with this YAML frontmatter:

```yaml
---
title: <Doc type> — <one-line title> (<process-name>)
status: draft | active | deprecated
version: <semver-ish, e.g. 0.0.1>
created: <yyyy-mm-dd>
updated: <yyyy-mm-dd>
role: <one-line purpose of this specific document>
derived-from: <parent template version, and/or parent Rail's document + version if built via inheritance>
regeneration-rule: <when/how this doc must be regenerated if its source changes>
---
```

- `status` is an enum: `draft` (not yet reviewed/approved) → `active`
  (in use) → `deprecated`.
- `derived-from` does double duty: it points to the base template
  pattern, and/or to a parent Rail's document when built via inheritance
  (§11) — potentially both at once. Every one of the 5 base templates in
  `templates/` therefore sets `derived-from: templates/<Doc>.md
  v<own-version>` — pointing at itself, at its own current version —
  since that is the only lineage that exists before any Rail is generated
  from it; a generated Rail's own documents add the parent-Rail reference
  on top of that when built via inheritance. Do
  **not** use `derived-from` to record a document's *logical* dependency
  on another document within the same bundle (e.g. Workflow.md depending
  on Backbone.md) — that traceability is already carried by each
  document's own `role` line, its `regeneration-rule`, and the explicit
  Backbone-ID citations required in §8.3/§8.4.

### 8.2 `Backbone.md` — single source of truth

**Role**: the objectives the process must achieve (positive) and the hard
limits it must never violate (negative objectives). Everything else in
the bundle derives from this document, and if any other document ever
conflicts with it, Backbone.md wins (§8.6).

**Structure**:
- **Objectives** — numbered `O1, O2, ...`. Each must be independently
  verifiable; an objective that can't be made checkable either gets
  sharpened until it can be, or gets moved to Design.md as background
  context instead of being treated as a real objective.
- **Hard limits (negative objectives)** — numbered `L1, L2, ...`. What
  the process must never do, regardless of how a step's judgment zone is
  exercised. Hard limits always win over objectives if the two ever
  conflict.
- **Traceability** — every row in Workflow.md and every checklist item in
  Validation.md must cite at least one Backbone ID. An ID never
  referenced downstream signals a redundant objective or a dropped
  reference — worth investigating either way.

**Regeneration rule**: regenerate whenever the process description or
scope changes. Workflow.md and Validation.md must then be regenerated
afterward, in that order, since both derive from Backbone.md.

### 8.3 `Workflow.md` — the fixed step sequence

**Role**: the fixed order of steps the executing agent must follow.
Steps are derived from Backbone.md; the agent must not invent, skip, or
reorder them.

**Structure, per step**:
- **Backbone refs** — the `O#`/`L#` ID(s) this step fulfills or guards. A
  step with no citation signals a skipped objective or an unauthorized
  invented step.
- **Fixed core** — the invariant action, plus a concrete, checkable
  verification. Must produce the same outcome regardless of which model
  runs it — phrased as a concrete condition, not "make sure it's good."
  The verification carries a **verifier kind** (§4.1): `verifier: script`
  when it's expressible in the assertion vocabulary (§8.7) — written as
  vocabulary entries, not prose — or `verifier: agent` when it genuinely
  requires semantic judgment.
- **Judgment zone** — what's explicitly left to the executing agent's
  judgment within this step; may be empty for a fully mechanical step,
  but most steps should have one.

A step whose fixed core can't be stated as verifiable is unresolved
ambiguity — it gets sent back to Backbone.md rather than guessed at
here.

**Escalation** (also restated in Readme.md, §8.6): if a step's fixed core
cannot be satisfied as written, the agent stops and asks the user. It
does not silently skip the step or substitute its own judgment for the
fixed core.

**Regeneration rule**: regenerate whenever Backbone.md changes.
Validation.md must be regenerated afterward, since its checklist is keyed
to Workflow.md's steps.

### 8.4 `Validation.md` — the checklist

**Role**: confirms a Workflow.md run was correctly and completely
executed. Consumed by `process-name-validation` (built by
`agentrails-build-validation`) to check `output-process-name/` against
Backbone.md's objectives and hard limits.

**Structure, per checklist item**:
- **Backbone refs** — the `O#`/`L#` ID(s) checked.
- **Workflow step(s)** — which step(s) this item validates. (Three-way
  traceability: Backbone ↔ Workflow ↔ Validation.)
- **Verifier** — `script` or `agent` (§4.1). `script` is the default to
  aim for; `agent` is the last resort and is always reported as a soft
  guarantee (§10.3).
- **Check** — a concrete, checkable pass/fail condition against the
  actual output in `output-process-name/`. "O3 was addressed" is not
  checkable; "the deliverable contains a section titled X with at least
  one entry per Y" is. For `verifier: script` items, the check is written
  as **assertions** in the §8.7 vocabulary (one per line), so
  `agentrails-build-validation` can compile them verbatim into
  `checks.mjs` without interpreting prose; a short prose gloss may
  accompany them for human readers. For `verifier: agent` items, the
  check is prose — as concrete as possible.
- Hard limits get checked too — validation must be able to catch a
  violation, not just confirm objectives were met. An L# that is
  mechanically expressible (a forbidden pattern, path, or command — think
  of it as a lint rule) must get a `verifier: script` item.

**The mirroring rule**: every Workflow.md step whose fixed-core
verification is `verifier: script` must be cited by at least one
`verifier: script` checklist item — otherwise the per-step gate
(`checks.mjs --step N`, §10.2) has nothing mechanical to run for that
step and silently degrades to agent judgment.

This document only defines *what* to check — it does not track status
itself. Runtime status tracking is `ValidationTracking.md`'s job (§10.1),
seeded from this checklist's item list.

**Regeneration rule**: regenerate whenever Backbone.md or Workflow.md
changes.

### 8.5 `Design.md` — descriptive overview (non-authoritative)

**Role**: big-picture overview and diagrams, for human/agent orientation.
Descriptive only — if it ever conflicts with Backbone.md, Backbone.md
wins (§8.6).

**Structure**:
- **What this process is for** — 1–3 paragraphs: purpose, audience, why
  it exists as a Rail rather than a one-off script or a raw prompt.
- **How it flows** — plain-language walkthrough referencing Workflow.md's
  steps by name/number, without duplicating their fixed core / judgment
  zone detail. Includes a Mermaid flowchart (plain text, so the whole
  context bundle stays diffable and git-friendly — no binary/image
  assets).
- **Context and constraints** — background a reader needs to make sense
  of Backbone.md's objectives and hard limits: prior decisions, why a
  limit exists, what was tried and rejected. Explanatory, not normative.

This is the only one of the 5 documents meant to be read by a human
first, an agent second — write it so a newcomer understands the process
without needing to read Backbone.md first.

**Regeneration rule**: regenerate whenever the process's scope or shape
changes enough that the overview/diagrams would mislead a new reader.

### 8.6 `Readme.md` — meta-instructions

**Role**: how to read the rest of the bundle — what wins when documents
conflict, and what to do when the agent can't comply with something in
them. Read first, before the other four. Not itself a source of
objectives, steps, or checks.

**Precedence order when documents conflict** (the default; only deviate
if a specific process has a genuine reason to, stated inline):
1. **Backbone.md** — always wins. Single source of truth.
2. **Workflow.md** — wins over Validation.md and Design.md (direct
   execution derivation of Backbone.md).
3. **Validation.md** — wins over Design.md.
4. **Design.md** — descriptive only; never overrides the other three.

A conflict between Backbone.md and any other document means that other
document is stale and must be regenerated — it is not grounds for the
agent to pick a side and proceed.

**Escalation rule** (fixed across every Rail, not a per-process choice):
if the executing agent cannot comply with a step's fixed core — blocked,
contradicted by real conditions, missing a precondition, or facing
unresolved ambiguity — **it stops and asks the user.** It does not guess,
does not silently skip the step, and does not substitute its own judgment
for what the fixed core requires.

**Scope**: states explicitly when this Rail applies and when it doesn't,
so the executing agent can recognize being asked to run it on something
out of scope.

**Regeneration rule**: regenerate only if the precedence rule or
escalation rule themselves change — not on every Backbone.md/Workflow.md
edit.

### 8.7 The assertion vocabulary (for `verifier: script` checks)

Every `verifier: script` check — whether a Workflow.md fixed-core
verification or a Validation.md checklist item — is expressed exclusively
in this fixed vocabulary. This is what keeps `agentrails-build`
and `agentrails-build-validation` deterministic: compiling assertions
into `checks.mjs` is a lookup-and-substitute transformation, never prose
interpretation. If a check can't be expressed here, it is either
`verifier: agent`, or unresolved ambiguity to sharpen at design time —
it is never grounds for improvising a new assertion kind inside a single
Rail. Extending the vocabulary itself is an AgentRails-level change:
update this section, `templates/Workflow.md`, `templates/Validation.md`,
and both build `SKILL.md` files together.

Paths are relative to the Rail bundle root (`<process-name>/`), so output
files are addressed as `output-<process-name>/...`. `checks.mjs` resolves
them from its own location.

- `exists: <path>` — the file exists.
- `not-exists: <path>` — the file does not exist.
- `contains: <path> "<literal>"` — the file's contents include the
  literal string.
- `not-contains: <path> "<literal>"` — the file's contents do not include
  the literal string (the workhorse for hard-limit linting).
- `matches: <path> /<regex>/` — some line of the file matches the regex.
- `count-at-least: <n> <path> "<literal>"` — the literal occurs at least
  `<n>` times in the file.

---

## 9. Anatomy of a Rail — full directory layout

This tree shows the Rail bundle and, for reference, where a completed run's
output lands — but these come from two different producers at two different
times (§2.4): AgentRails produces `context/`, `process-name/SKILL.md`,
`process-name-validation/SKILL.md`, `rail.mjs`, and `checks.mjs`; running
the already-built `process-name` skill produces `output-process-name/`,
afterward, on its own.

```
<process-name>/
├── context/                        ← shared by both build commands
│   ├── Design.md       — big-picture overview + diagrams
│   ├── Backbone.md     — objectives (positive) AND hard limits ("negative
│   │                     objectives") — single source of truth
│   ├── Workflow.md     — fixed step sequence derived from Backbone.md
│   ├── Validation.md   — checklist derived from Backbone.md to confirm the
│   │                     workflow was correctly and completely executed
│   └── Readme.md       — meta-instructions: ambiguity-resolution precedence,
│                          escalation rule (stop and ask the user)
├── rail.mjs                        ← runtime harness; owns all writes to
│   │                                 ProcessTracking.md (init/start/finish)
│   │                                 — generated by agentrails-build
├── checks.mjs                      ← mechanical checker compiled from
│   │                                 Validation.md's script items
│   │                                 — generated by agentrails-build-validation
├── output-process-name/            ← runtime output of running the Rail
│   ├── ProcessTracking.md          — per-step status, incl. which agent ran it
│   ├── ValidationTracking.md       — validation pass status, same schema
│   └── (actual process deliverables)
├── process-name/SKILL.md              (runs the process)
└── process-name-validation/SKILL.md   (validates a completed run)
```

Note the `process-name/` subdirectory shares its name with the outer
`<process-name>/` bundle directory — this is intentional, not a naming
bug: the outer directory is the whole Rail bundle, while the inner
`process-name/` directory is the actual Agent Skill package, structured
so it can be copied as-is into a platform's skills directory (e.g.
`.claude/skills/process-name/`) without renaming.

`output-process-name/` is treated as fully disposable between passes
(§10.2, Phase 4) — nothing outside this directory (`context/`, the two
`SKILL.md` packages, `rail.mjs`, `checks.mjs`) is ever touched by running
the process.

---

## 10. Progressive execution

Running `process-name` is **not all-or-nothing** within a single pass.
It's incremental and resumable by design — to survive interruptions (e.g.
running out of tokens). `process-name-validation` mirrors this same
resumability logic against its own tracking file. Once a pass is fully
complete on both sides, running the process again starts a clean, new
pass rather than continuing to accumulate state (§10.2, Phase 4) — a
Rail's generated skill has no notion of "better" or "worse" across passes;
it only knows whether the current pass is done.

### 10.1 Tracking file schema

Both `ProcessTracking.md` and `ValidationTracking.md` (in
`output-process-name/`) share the same table schema:

`STATUS | AGENT | STEP | DETAILS | START | END`

- **STATUS**: `✅` done, `❌` error/blocked, *(empty)* pending.
- **AGENT**: which model/agent executed that step — useful for debugging
  a run and for comparing, after the fact, how different models handled
  the same fixed path.
- **STEP**: short step name.
- **DETAILS**: problems found / notes; empty if none.
- **START / END**: timestamps.

**Operational rule for both files**: generate the file *before* starting;
if it already exists, resume at the first row with empty STATUS. Never
hold the file open for the whole run — write/flush per step, before
moving to the next one, so progress is visible live, not only at the
end.

- **`ProcessTracking.md`** (owned by `process-name`, written **only
  through `rail.mjs`**, §4.1) — task list generated from `Workflow.md`,
  seeded by `node rail.mjs init` with empty STATUS before execution
  starts; every subsequent write is a `node rail.mjs start <step>` /
  `node rail.mjs finish <step>` call. The executing agent never edits
  this file by hand — its rows are harness-stamped claims, and a row
  claiming ✅ while that step's `script` checks fail is flagged as a
  divergence by `checks.mjs` (§7.3), not trusted at face value.
- **`ValidationTracking.md`** (owned by `process-name-validation`) — STEP
  column seeded by copying it from `ProcessTracking.md` (one row per
  process step, not per checklist item, so both files stay aligned); the
  rest of the columns are filled in during validation. Doubles as an
  error log from the validation pass. Its mechanical rows are not
  self-reported guesswork either: they transcribe `checks.mjs` output,
  which the user can re-run independently at any time (§4.1).

### 10.2 State machine for `process-name`

All writes to `ProcessTracking.md` go through `rail.mjs` (§4.1, §7.2) —
the executing agent calls the harness; it never edits the file directly.

```
if ProcessTracking.md doesn't exist:
    node rail.mjs init        # seeds one empty-STATUS row per Workflow.md step

# Phase 1 — advance pending steps
while a row has empty STATUS:
    node rail.mjs start <step>
    execute the step's fixed core + judgment zone
    # Per-step gate — mechanical verification before advancing:
    if checks.mjs exists and covers this step:
        run node checks.mjs --step <N>
        exit 0 required to pass the gate; on failure, fix and re-run,
        or treat as an error row (Phase 2)
    else:
        # fallback: checks.mjs not built yet (agentrails-build-validation
        # hasn't run) — the agent self-checks the step's written
        # verification and notes "agent-verified only, no mechanical
        # gate" in DETAILS. This is the weak mode; say so, don't hide it.
    node rail.mjs finish <step> --ok|--error [--details "..."] [--agent "<model>"]

# Phase 2 — resolve own flagged errors
while a row has STATUS = error or non-empty DETAILS:
    retry that step (start -> execute -> gate -> finish), updating the row

# Phase 3 — consume feedback from a prior validation run
if ValidationTracking.md exists:
    for each row with non-empty DETAILS (gap/error reported by validation):
        re-execute the corresponding process step (with its gate) to resolve it
        # process-name never writes to ValidationTracking.md. It only reads it.
        # Only process-name-validation writes/clears its own file, on its own
        # next run, once it re-confirms the step is fixed.

# Phase 4 — everything resolved on both sides -> offer to run again, from scratch
if ProcessTracking.md fully OK and (ValidationTracking.md doesn't exist or fully OK):
    ask user: "The process is complete. Run it again? Previous results in
               output-process-name/ will be deleted."
    if yes:
        delete the entire contents of output-process-name/
        (ProcessTracking.md, ValidationTracking.md, and every deliverable)
        # rail.mjs and checks.mjs live at the bundle root, outside
        # output-process-name/ — they survive a restart untouched.
        re-run the whole process from Phase 1, as if for the first time
    if no:
        stop
```

### 10.3 State machine for `process-name-validation`

Mirrors `process-name`'s resumability logic, but validating instead of
executing — using `ProcessTracking.md`'s step list and `Validation.md`'s
criteria as its guide, and `output-process-name/` contents as what gets
validated. Mechanical evidence comes first: `checks.mjs` (§4.1, §7.3)
runs before any LLM judgment, its output is treated as objective, and the
skill's own judgment is reserved for `verifier: agent` items.

```
if ValidationTracking.md doesn't exist:
    seed STEP column from ProcessTracking.md -> write with empty STATUS

# Mechanical pass — no LLM judgment involved:
run node checks.mjs
for each step covered by the run:
    transcribe the mechanical results into the step's row
    (START/END + STATUS + DETAILS from the checks.mjs report)
note any divergences checks.mjs flagged (a ProcessTracking.md row
    claiming done while its step's script checks fail) — these are
    reported as gaps, never silently trusted

# Agent-judgment pass — verifier: agent items only:
while a row has empty STATUS:
    validate the corresponding step's output in output-process-name/
    against the relevant Validation.md checklist item(s) marked
    verifier: agent (START -> check -> END + STATUS + DETAILS,
    DETAILS prefixed "agent-verified (soft guarantee):" on a pass)

while a row has STATUS = error / non-empty DETAILS from a PRIOR validation
pass that hasn't been re-checked yet:
    re-check whether process-name has since fixed it
    (process-name reads this file but never writes to it — only this
    skill writes/clears its own rows, on its own next run, once it
    re-confirms a step is fixed)

# Final report — tiered, so the user can see exactly how much of the
# Rail is steel and how much is painted line:
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

Since Phase 4 of `process-name`'s own state machine deletes the entire
contents of `output-process-name/` (including `ValidationTracking.md`)
when the user chooses to run again, a fresh pass always starts with
`ValidationTracking.md` absent too — `process-name-validation` re-seeds
it from scratch the next time it runs, exactly as it would on a Rail's
very first pass.

---

## 11. Merging / inheriting pre-existing Rails

There is no separate command for this — it's an additional parameter set
accepted by `agentrails-design` itself (§7.1, input 3): a list of local
paths and/or Git repository URLs, each pointing to an already-built
Rail's `context/` bundle.

- **On contradiction**: if the N input bundles contain conflicting
  objectives, hard limits, etc., `agentrails-design` **reports the
  full list of contradictions and terminates.** No automatic conflict
  resolution, no partial merge. Providing coherent input contexts is
  explicitly the user's responsibility.
- **Recommended pattern — inheritance**: build an agnostic/base Rail's
  context first, then a child Rail whose context is a specific
  application of it. Merging a base Rail's Backbone/Validation with a
  child's is the natural, low-contradiction case, since a child extends
  rather than restates the base.
- **Implementation note**: supporting Git URLs means `agentrails-design`
  needs to be able to clone/read remote repositories at runtime.

---

## 12. Cross-platform delivery

Confirmed via research at design time: Claude Code, Google Antigravity,
Cursor, ZCode, Kimi Code CLI, and OpenAI Codex CLI all converged on the
same open **Agent Skills** format — a directory with a `SKILL.md`
(frontmatter metadata + instructions) plus optional supporting files,
loaded on demand. No per-platform adapter logic is needed; only the
install path differs:

- **Claude Code**: `.claude/skills/` (project) or `~/.claude/skills/`
  (global)
- **Google Antigravity**: `.agent/skills/` (workspace) or
  `~/.gemini/antigravity/skills/` (global)
- **Cursor**: `.cursor/skills/` — project-scoped only, no personal/global
  directory
- **ZCode**: `.zcode/skills/` (project) or `~/.config/zcode/skills/`
  (global)
- **Kimi Code CLI**: `.kimi-code/skills/` (project) or
  `~/.kimi-code/skills/` (global) — one of several layered skill roots it
  scans
- **OpenAI Codex CLI**: `.codex/skills/` (project) or `~/.codex/skills/`
  (global)
- **Generic fallback**: `.agents/skills/` — a shared convention also read
  by Gemini CLI, VS Code Copilot, and other Agent-Skills-compatible tools

Because every generated `process-name/SKILL.md` and
`process-name-validation/SKILL.md` is a standard Agent Skill package (via
the `skill-creator` hard prerequisite, §13), a Rail built once is
installable on any of these platforms without modification.

**Installer**: the AgentRails commands themselves (not the Rails they
produce) are installable into any of the targets above via
`npx agent-rails install` (`bin/cli.js`, package root `package.json`).
It copies `skills/agentrails-design`, `skills/agentrails-build`, and
`skills/agentrails-build-validation` into the chosen target's install
path from the table above. For `agentrails-design` specifically, it also
copies the repo's `templates/` directory into that installed skill's own
`templates/` subdirectory (see §7.1, Step 1), since `agentrails-design`
needs the 5 base templates at runtime and `templates/` otherwise has no
other way of reaching the install destination — it lives outside every
`skills/<name>/` directory in this repo. This installer is scoped to
AgentRails' own 3 commands — it has no role in installing a generated Rail's
`process-name`/`process-name-validation` skills, which are installed the
same manual way as any other Agent Skill package.

---

## 13. Minimum requirements / hard prerequisites

- **[skill-creator](https://claude.com/plugins/skill-creator)** —
  `agentrails-build` and `agentrails-build-validation` must always
  scaffold their target `SKILL.md` packages through `skill-creator`
  rather than hand-rolling them. This is a hard prerequisite for both
  commands; if it's unavailable, they stop rather than improvise.
- **Node.js >= 18 at Rail runtime** — the generated `rail.mjs` and
  `checks.mjs` (§4.1) run as plain Node scripts with zero dependencies
  (built-ins only), invoked by the generated skills as subprocesses.
  Every Agent-Skills-compatible host already runs on or alongside Node,
  so this adds no install burden, but a generated Rail's mechanical
  layer does require `node` on the executing machine's PATH.
- **A target platform that supports Agent Skills** — see §12 for the
  list and install paths.

---

## 14. Documentation & language standards (operating principles)

These are standing rules for the project as a whole, not specific to any
one document — restated here explicitly because they were established
through direct correction during the project's design conversations and
are easy to silently regress on without a written rule to check against.

1. **English only, everywhere.** Every generated document — README, this
   PRD, `DESIGN-NOTES.md`, the 5 context-document types, every
   `SKILL.md`, and everything user-facing — is written in English, for
   open-scope reach. This applies even to terms that started as
   Spanish-language shorthand during design discussions (see §3, items 3
   and 5, for two concrete corrections made under this rule). There are
   no exceptions carved out for etymology notes, parenthetical asides, or
   internal design terms.
2. **Command names are fully hyphen-separated.** Every word in a
   command/skill name is separated by a hyphen — no concatenated compound
   words (`agentrails-build-validation`, not
   `agentrails-buildvalidation`). See §3, item 4.
3. **Assume nothing; document everything.** This project is built to be
   read and executed by AI agents, not only humans, and often by an agent
   with no memory of how a given Rail or command came to exist. Every
   command's required inputs, preconditions, exact output paths, and
   error-handling behavior must be spelled out explicitly — never left as
   something "an agent will obviously figure out." When something is
   ambiguous or missing, every command in this project stops and asks
   rather than guessing (this is also principle 3 and 4 of §5, applied
   reflexively to AgentRails' own tooling, not just to the Rails it
   produces).
4. **Bold emphasis is a formatting choice, independent of translation.**
   When correcting terminology (language or naming), preserve whatever
   bold/italic emphasis the term already had — the correction is to the
   words, not the formatting around them.

---

## 15. Repository structure of AgentRails itself

```
AgentRails/
├── README.md                              ← pitch + user manual + PRD pointer
├── PRD.md                                 ← this file — full requirements spec
├── DESIGN-NOTES.md                        ← working design log (session history)
├── skills/
│   ├── agentrails-design/SKILL.md
│   ├── agentrails-build/SKILL.md
│   └── agentrails-build-validation/SKILL.md
├── templates/                             ← base templates for the 5 context docs
│   ├── Design.md
│   ├── Backbone.md
│   ├── Workflow.md
│   ├── Validation.md
│   └── Readme.md
├── package.json                           ← npm package metadata for the installer (§12)
└── bin/cli.js                             ← `npx agent-rails install` entry point
```

This is the **builder repo** — it is not itself a Rail. It produces
Rails. Nothing in this repo is process-specific; `templates/` and
`skills/` are the fixed tooling, and every `<process-name>/` bundle it
generates lives outside this structure (wherever the user directs
`agentrails-design` to write it).

---

## 16. Glossary

- **Rail** (plural **Rails**) — the product: a context bundle (5
  documents), a matched pair of runnable Agent Skills, and a matched pair
  of harness scripts (`rail.mjs`, `checks.mjs`), for a given
  `process-name`. See §2.
- **Fixed core** — the invariant, verifiable part of a Workflow step. See
  §4.
- **Judgment zone** — the part of a Workflow step left to the executing
  agent's judgment. See §4.
- **Verifier kind** — the classification of every check in a Rail:
  `verifier: script` (mechanically checked by code, compiled into
  `checks.mjs`) or `verifier: agent` (checked by LLM judgment, always
  reported as a soft guarantee). See §4.1.
- **Assertion vocabulary** — the small fixed set of mechanically
  evaluable assertions (`exists`, `not-exists`, `contains`,
  `not-contains`, `matches`, `count-at-least`) in which every
  `verifier: script` check is written. See §8.7.
- **`rail.mjs`** — the generated runtime harness at the Rail bundle root;
  owns all writes to `ProcessTracking.md` (`init`/`start`/`finish`).
  Generated by `agentrails-build`. See §4.1, §7.2, §10.2.
- **`checks.mjs`** — the generated mechanical checker at the Rail bundle
  root, compiled verbatim from `Validation.md`'s `verifier: script`
  items; supports `--step N` for the per-step gate and prints the tiered
  conformance evidence. Generated by `agentrails-build-validation`. See
  §4.1, §7.3, §10.3.
- **`process-name`** — the user-supplied, durable identifier for a
  specific Rail. Never invented by any command; always supplied or asked
  for.
- **`agentrails-design`** — the LLM-driven meta-command that produces
  a Rail's draft `context/` bundle. See §7.1.
- **`agentrails-build`** — the deterministic meta-command that
  compiles `context/` into the runnable `process-name` skill. See §7.2.
- **`agentrails-build-validation`** — the deterministic meta-command
  that compiles `context/` into the runnable `process-name-validation`
  skill. See §7.3.
- **Backbone.md** — a Rail's single source of truth: objectives and hard
  limits. See §8.2.
- **Workflow.md** — a Rail's fixed step sequence, derived from
  Backbone.md. See §8.3.
- **Validation.md** — a Rail's checklist, derived from Backbone.md +
  Workflow.md. See §8.4.
- **Design.md** — a Rail's descriptive, non-authoritative overview. See
  §8.5.
- **Readme.md** (inside a Rail's `context/`) — a Rail's meta-instructions:
  precedence order + escalation rule. Not to be confused with this
  repo's own root `README.md`. See §8.6.
- **`ProcessTracking.md`** — runtime, per-step status log owned by
  `process-name`. See §10.1–10.2.
- **`ValidationTracking.md`** — runtime, per-step status log owned by
  `process-name-validation`. See §10.1, §10.3.
- **Escalation rule** — the fixed, non-negotiable rule that an executing
  agent stops and asks the user rather than guessing when it can't comply
  with a step. See §5 (principle 4) and §8.6.
- **skill-creator** — the external skill
  (https://claude.com/plugins/skill-creator) that both build commands
  must use to scaffold their target `SKILL.md` packages. Hard
  prerequisite. See §13.
- **AgentRefinery** — a separate, sibling project that consumes this
  project's generated Rails and their `output-process-name/` results as
  input, and owns the concern (out of scope here) of comparing results
  across repeated runs and keeping the best one. See §0, §3 item 2.

---

## 17. Open items / roadmap

1. **Nothing built so far has been exercised end-to-end.** The first real
   test should be running `agentrails-design` against a real, concrete
   process description, to see whether the generated `context/` bundle
   actually holds up (produces a coherent Backbone, a Workflow that
   traces cleanly to it, a Validation checklist that's genuinely
   checkable) before trusting the rest of the pipeline (`agentrails-build`,
   `agentrails-build-validation`, and the two generated skills they'd
   produce) with real use.
2. **True prevention via host-level hooks.** The verification layer
   (§4.1) makes deviations detectable with objective evidence and makes
   the honest path the easiest path, but a generated skill is still prose
   — an executing agent could ignore the instruction to call `rail.mjs` /
   `checks.mjs`. Hard prevention (blocking a tool call before it happens,
   e.g. PreToolUse-style hooks in Claude Code or hooks in Kimi Code CLI)
   is platform-specific and doesn't fit the portable Agent Skills format,
   but a future version could emit optional per-platform hook configs
   alongside `rail.mjs` for hosts that support them.
3. **The assertion vocabulary (§8.7) may need extension** once real Rails
   exercise it — e.g. directory-glob assertions or JSON-path checks. Any
   extension is an AgentRails-level change touching this PRD,
   `templates/Workflow.md`, `templates/Validation.md`, and both build
   `SKILL.md` files together, never a per-Rail improvisation.
4. Everything else previously tracked as open (umbrella noun for the
   produced artifact, README-vs-templates sequencing, the 3 meta-command
   skills) has been resolved — see §3 for the naming decisions and §6–§9
   for the resulting architecture, all now implemented in `skills/` and
   `templates/`.
