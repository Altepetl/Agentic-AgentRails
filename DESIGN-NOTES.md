# AgentRails — Design Notes (work in progress)

> This file is the session-by-session working log of how the design evolved.
> For the current, consolidated, authoritative spec, see [`PRD.md`](./PRD.md)
> — it captures everything below plus the rationale for each decision, in one
> place.

## 2026-07-27 — Original design (as part of a single combined project)

The mechanism now documented in this repo — a **Rail**: a fixed-core /
judgment-zone context bundle that lets a documented process stay
consistent across runs while a stronger model does a better job within
each step's judgment zone — was originally designed together with an
aspirational idea for comparing/improving a Rail's output across repeated
runs with increasingly capable models, under a single combined project
name, "AgentRefinery."

Under that combined design, a Rail's own generated `process-name` skill
had its re-run behavior ("Phase 4" of its state machine) hard-coded to
never delete prior output, to complement rather than overwrite
deliverables across passes, and to log every pass to a `Changelog.md` —
regardless of whether the person using a given Rail actually wanted that
cross-pass behavior or just wanted a process that runs the same way every
time.

The rest of that session's decisions — the fixed-core/judgment-zone
mechanism (§4 of `PRD.md`), the 5 defining principles of a Rail (§5), the
3-command pipeline (§6–§7), the 5-document context bundle (§8), the
tracking-file schema (§10.1), and the cross-platform Agent Skills delivery
research (§12) — all carried forward unchanged into this repo; only the
re-run/Phase-4 behavior and the naming changed (see below).

## 2026-07-28 — Split into two sibling projects

Recognized that the combined design conflated two independent concerns
into one project and one generated skill: (1) keeping an agent on a
verifiable, unambiguous path regardless of which model executes it, and
(2) comparing a process's output across repeated runs and deciding
whether a new pass improves on a prior one. Neither concern needs the
other to be useful on its own, and forcing every Rail to carry the
cross-pass comparison logic whether or not anyone wanted it was a design
smell.

**Decision**: split back into two sibling repos.

- **AgentRails** (this repo) — the mechanism only. Produces a Rail and
  compiles it into a runnable skill whose re-run behavior (Phase 4) is a
  plain, destructive restart: "run the process again? previous results
  will be deleted" → wipe `output-process-name/` → start over from Step
  1. No cross-pass memory, no `Changelog.md`, no "is this better" judgment
  anywhere in the generated skill.
- **AgentRefinery** (separate repo) — owns the entirely separate concern
  of comparing a Rail's output across repeated runs, possibly with
  increasingly capable models, and keeping the best result. It consumes
  this repo's generated skills and `output-process-name/` results as
  input rather than reimplementing or modifying them.

Renamed every command from `agentrefinery-*` to `agentrails-*`
accordingly (`agentrails-design`, `agentrails-build`,
`agentrails-build-validation`), and rewrote `PRD.md`/`README.md`/
`skills/*/SKILL.md` to only describe this project's own scope. See
`PRD.md` §3 for the full naming decision history and rationale.

## Open items for next session

1. **Nothing built so far has been exercised end-to-end.** The first real
   test should be running `agentrails-design` against a real, concrete
   process description to see whether the generated context bundle
   actually holds up before trusting the rest of the pipeline.
2. Everything else previously open (umbrella noun for the produced
   artifact, README-vs-templates sequencing, the 3 meta-command skills,
   the project split) has been resolved — see `PRD.md` §3 and §6–§9.
