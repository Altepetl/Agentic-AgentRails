# CLAUDE.md

Guidance for Claude Code (or any agent) working in this repository. This
file is Claude Code-specific; **`AGENTS.md`** at the repo root is the
vendor-neutral counterpart for agents that don't read `CLAUDE.md` (it
follows the open `AGENTS.md` convention). The two overlap deliberately —
`AGENTS.md` is longer and more structured, this one is shorter — and both
must be updated together for any pipeline-level or terminology change; see
`CONTRIBUTE.md`.

## What this repo is

**AgentRails** is the builder repo, not a Rail itself. It produces
**Rails** — a documented process compiled into a guide that fixes the
mandatory path (verifiable, agent-agnostic) while leaving a judgment zone
where a more capable LLM's judgment improves the result within a single
run, without anyone rewriting the process. Nothing in this repo is
process-specific; `templates/` and `skills/` are the fixed tooling that
generates Rails elsewhere.

**AgentRails' scope stops at the mechanism.** A generated Rail's own
re-run behavior is a plain, destructive restart — "run the process again?
previous results will be deleted." Comparing a Rail's output across
repeated runs and deciding whether a new pass improves on a prior one is
explicitly out of scope here; that's the job of the separate, sibling
**AgentRefinery** project, which consumes this project's generated skills
and output as its own input. Do not add cross-pass memory, "which pass is
better" judgment, or a changelog of improvement passes to anything this
repo produces — see `PRD.md` §3, item 2, for why that split exists.

**Before making any non-trivial change, read `PRD.md` in full.** It is the
canonical, exhaustive spec — every concept, every document's exact
structure, every state machine, and the rationale behind every naming
decision. `README.md` is the pitch and quick reference; `PRD.md` is the
one to trust when they seem to disagree (and if they do disagree, that's
a bug to fix, not a judgment call to make silently).

## Directory map

```
AgentRails/
├── README.md          — pitch, gap thesis, user manual for the 3 commands
├── PRD.md              — full requirements spec (canonical, read first)
├── DESIGN-NOTES.md     — session-by-session working design log
├── Changelog.md        — this project's own release history
├── CONTRIBUTE.md        — contribution conventions
├── LICENSE              — MIT, Altepetl
├── skills/
│   ├── agentrails-design/SKILL.md            — LLM-driven, entry point
│   ├── agentrails-build/SKILL.md              — deterministic
│   └── agentrails-build-validation/SKILL.md   — deterministic
└── templates/           — base patterns for a Rail's 5 context documents
    ├── Design.md
    ├── Backbone.md
    ├── Workflow.md
    ├── Validation.md
    └── Readme.md
```

## Terminology quick reference

(Full glossary: `PRD.md` §16.)

- **Rail** — the product: a `context/` bundle (5 documents) + a matched
  pair of runnable Agent Skills + a matched pair of harness scripts
  (`rail.mjs`, `checks.mjs`), for a given `process-name`.
- **Fixed core** — the invariant, verifiable part of a Workflow step.
- **Judgment zone** — the part of a step left to the executing agent's
  judgment.
- **Verifier kind** — every check is `verifier: script` (verified by
  code, written in the fixed assertion vocabulary, PRD.md §8.7) or
  `verifier: agent` (verified by LLM judgment, always a soft guarantee).
  See PRD.md §4.1.
- **`rail.mjs` / `checks.mjs`** — per-Rail harness scripts at the bundle
  root (plain zero-dependency Node, not Agent Skills): `rail.mjs` owns
  all `ProcessTracking.md` writes; `checks.mjs` is the mechanical checker
  that gates each step and anchors validation's tiered report.
- **`process-name`** — the durable, user-supplied identifier for a
  specific Rail. Never invent one.
- **Backbone.md** — a Rail's single source of truth: objectives (`O#`)
  and hard limits (`L#`).
- **AgentRefinery** — a separate, sibling project (not in this repo) that
  consumes Rails built here and owns the concern of comparing/improving
  their output across repeated runs. Out of scope for anything in this
  repo.

## The 3 commands

| Command | Judgment? | Reads | Produces |
|---|---|---|---|
| `agentrails-design` | Yes — only reasoning step | process description (a PRD works well as-is), optional Rails to merge | `<process-name>/context/*.md` (draft) |
| `agentrails-build` | No — deterministic | `context/{Backbone,Workflow,Readme}.md` | `<process-name>/process-name/SKILL.md` + `<process-name>/rail.mjs` |
| `agentrails-build-validation` | No — deterministic | `context/{Validation,Backbone}.md` | `<process-name>/process-name-validation/SKILL.md` + `<process-name>/checks.mjs` |

`agentrails-build` and `agentrails-build-validation` both have a
**hard prerequisite**: they must scaffold their target `SKILL.md` through
the `skill-creator` skill, never hand-rolled. If `skill-creator` isn't
available, they stop rather than improvise a substitute — don't "fix"
this by adding a fallback packaging path.

Full command specs: `PRD.md` §7. User-facing manual with an example
invocation: `README.md`, "User manual" section.

## Operating principles for changes in this repo

1. **English only, everywhere** — no exceptions for etymology notes or
   terms that started as Spanish shorthand in a discussion. This has been
   corrected twice already in this project's history (`PRD.md` §3); don't
   reintroduce it.
2. **Command/file names are fully hyphen-separated** —
   `agentrails-build-validation`, never `agentrails-buildvalidation`.
3. **Assume nothing; document everything.** This project is read and run
   by AI agents with no memory of prior sessions as often as by humans.
   Every command's inputs, preconditions, exact output paths, and
   error/ambiguity handling must be spelled out explicitly.
4. **A rename or concept change is not done until every file that
   mentions it is updated.** The same concept is deliberately documented
   at multiple levels of detail (`README.md` pitch, `PRD.md` full spec,
   `SKILL.md` runtime instructions) — grep the whole repo before
   considering a terminology change finished:
   ```bash
   grep -rn "<old-term>" --include="*.md" .
   ```
5. **Update `PRD.md` first** for any conceptual or behavioral change, then
   propagate to `README.md` and the relevant `skills/*/SKILL.md` /
   `templates/*.md`. Log naming reversals or newly settled questions in
   `PRD.md` §3 / §17.
6. **Keep the Phase 4 re-run destructive, not accumulating.** A generated
   `process-name` skill's re-run behavior deletes `output-process-name/`
   and starts over — it never complements/merges across passes, never
   logs a changelog of improvement passes, and never compares a new pass
   against a discarded one. That behavior belongs to AgentRefinery, a
   separate project, not to anything built here.

Full contribution conventions, including how to handle template/skill
edits and where to test: `CONTRIBUTE.md`.

## Testing

No automated test suite exists yet. The first real validation is running
`agentrails-design` against a real, concrete process description and
checking the generated `context/` bundle for traceability (every
`Workflow.md` step cites a real `Backbone.md` ID; every objective/hard
limit is covered by at least one `Validation.md` checklist item). Build
any test Rails under `/sandbox/` (gitignored) — never commit a generated
Rail into this repo; a Rail belongs in its own project.
