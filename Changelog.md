# Changelog

All notable changes to the **AgentRails project itself** are documented in
this file — its own tooling, documents, and conventions.

The format follows [Keep a Changelog](https://keepachangelog.com/), and this
project uses `MAJOR.MINOR.PATCH`-style versioning once a first release is
tagged. Nothing has been released yet — everything so far is under
`[Unreleased]`.

## [Unreleased]

### Added

- Core project concept: a **Rail** — a fixed-core / judgment-zone context
  bundle that lets a documented process stay consistent across runs
  regardless of which model executes it.
- `README.md` — project pitch, the gap thesis, the 5 defining principles of
  a Rail, the pipeline diagram, a full user manual for the 3 commands
  (including an example invocation and the PRD-as-input pattern), the
  anatomy of a Rail, minimum requirements, and the inheritance/merging
  pattern.
- `PRD.md` — full, consolidated requirements specification: every concept,
  every document's exact structure, both progressive-execution state
  machines, the naming decision history and its rationale, and the
  project's documentation/language operating standards.
- `DESIGN-NOTES.md` — session-by-session working design log, kept as the
  historical record of how the design evolved (superseded as the
  day-to-day reference by `PRD.md`).
- `templates/` — the 5 base document templates a Rail's `context/` bundle
  is generated from: `Design.md`, `Backbone.md`, `Workflow.md`,
  `Validation.md`, `Readme.md`.
- `skills/agentrails-design/SKILL.md` — the pipeline's only
  LLM-reasoning step: turns a process description (a PRD works well as
  one) into a draft Rail context bundle.
- `skills/agentrails-build/SKILL.md` — deterministic: compiles a Rail's
  context into the runnable `process-name` skill, via the `skill-creator`
  hard prerequisite.
- `skills/agentrails-build-validation/SKILL.md` — deterministic:
  compiles a Rail's checklist into the runnable `process-name-validation`
  skill, via the same `skill-creator` hard prerequisite.
- `.gitignore`, `LICENSE` (MIT, Altepetl), `CONTRIBUTE.md`, `CLAUDE.md`.

### Changed

- Split out of a previously combined project (named AgentRefinery at the
  time) that mixed this project's mechanism with a separate, aspirational
  cross-model refinement concern. Renamed every command from
  `agentrefinery-*` to `agentrails-*`, and simplified the generated
  `process-name` skill's re-run behavior (Phase 4) to a plain, destructive
  restart — no cross-pass memory, no changelog of improvement passes. See
  `PRD.md` §3 and `DESIGN-NOTES.md` for the full rationale. The cross-model
  refinement concern now lives entirely in the separate, sibling
  AgentRefinery repo.
