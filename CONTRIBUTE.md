# Contributing to AgentRails

AgentRails is the **builder repo**: it produces Rails, it isn't one
itself. Nothing here is process-specific — `templates/` and `skills/` are
fixed tooling. Read `README.md` and `PRD.md` before changing anything;
`PRD.md` is the canonical, exhaustive spec, and every change described
below should keep it — not just the README — accurate.

AgentRails' scope is the mechanism only: producing a Rail and running it
consistently down the same fixed path. Comparing or improving a Rail's
output across repeated runs is explicitly out of scope here — that's the
separate, sibling **AgentRefinery** project's job. If a change you're
considering would add cross-pass memory, a "which pass is better" judgment,
or anything resembling a changelog of improvement passes to a generated
`process-name` skill, it belongs in AgentRefinery, not here.

## Before you start

1. Read `README.md` (the pitch + quick reference).
2. Read `PRD.md` in full, especially §3 (naming decision history) and §14
   (documentation & language standards) — most contribution mistakes are
   violations of a rule already settled and written down there, not new
   judgment calls.
3. If you're an AI agent doing the contributing, also read whichever of
   `CLAUDE.md` / `AGENTS.md` matches your tooling (see "Two agent-guidance
   files" below) — they're not part of the product, but they're where
   repo-specific operating rules live.
4. If you're changing a concept, a command's behavior, or terminology,
   treat `PRD.md` as the file you update first — everything else
   (`README.md`, `skills/*/SKILL.md`, `templates/*.md`) must match it, not
   the other way around.

## Two agent-guidance files: `CLAUDE.md` and `AGENTS.md`

Neither is part of what AgentRails produces — they don't ship in a Rail,
aren't installed by `bin/cli.js`, and carry no product logic. They exist
purely to tell an AI agent how to work *in this repository*, the same
role `CONTRIBUTE.md` plays for a human contributor:

- **`CLAUDE.md`** — guidance specifically for Claude Code.
- **`AGENTS.md`** — the vendor-neutral counterpart, for agents that don't
  read `CLAUDE.md`, following the open `AGENTS.md` convention used across
  other AI coding tools.

They deliberately overlap (same rules, different length/structure) rather
than one deferring to the other, so either can be read standalone. That
means **both must be updated together** whenever a pipeline-level change,
naming change, or new architectural decision needs to be reflected in
agent-facing guidance — treat them as a pair, the same way the three
`skills/*/SKILL.md` files are treated as a pair/trio elsewhere in this
document.

## Standing rules (see `PRD.md` §14 for the full rationale)

These have already been decided and corrected once each during this
project's history — don't reopen them without a strong reason, and if you
do, update `PRD.md` §3's decision log to explain why:

- **English only, everywhere.** No exceptions for etymology notes,
  parenthetical asides, or terms that started as shorthand in a design
  discussion.
- **Command and file names are fully hyphen-separated** — no concatenated
  compound words (`agentrails-build-validation`, never
  `agentrails-buildvalidation`).
- **Assume nothing; document everything.** This project is read and run by
  AI agents as much as by humans, often with no memory of why something
  is the way it is. Every command's required inputs, preconditions, exact
  output paths, and error-handling behavior must be spelled out — not
  left as "an agent will figure it out." When something is ambiguous,
  every command stops and asks rather than guessing; hold your own
  contributions to the same standard.
- **Preserve bold/italic emphasis through edits** — formatting is
  independent of wording; don't drop emphasis while fixing text, or add
  it while translating a term.
- **A bare Rail's re-run is a clean, destructive restart, never an
  accumulating one.** Don't reintroduce complement-not-overwrite logic,
  cross-pass changelogs, or "is this better" comparisons into a generated
  `process-name` skill — that scope boundary with AgentRefinery is
  deliberate (`PRD.md` §3, item 2), not an oversight.

## Keeping cross-references in sync

The same concept is deliberately documented in multiple places at
different levels of detail (a short pitch in `README.md`, the full spec
in `PRD.md`, the runtime instructions in the relevant `SKILL.md`). This is
intentional, not duplication to clean up — but it means a rename or a
behavior change has to be propagated everywhere it's mentioned, not just
in the file you were originally editing.

Before considering a naming or terminology change done, grep the whole
repo for the old term and confirm nothing is left:

```bash
grep -rn "<old-term>" --include="*.md" .
```

Files that typically need touching together for any pipeline-level change:
`README.md`, `PRD.md`, `DESIGN-NOTES.md` (only append a new note; don't
rewrite its history), `CLAUDE.md` and `AGENTS.md` (see above — updated as
a pair), and all three `skills/*/SKILL.md` files (they cross-reference
each other by name).

## Modifying `templates/*.md`

Each template defines the frontmatter schema and section skeleton that
`agentrails-design` fills in per-process (see `PRD.md` §8.1 for the
shared frontmatter fields). If you change a template's structure:

- Update the matching section of `PRD.md` §8 (the per-document spec) to
  match.
- Update `skills/agentrails-design/SKILL.md`'s Step 3 instructions if
  the change affects what that document must contain.
- Keep the `TEMPLATE INSTRUCTIONS` HTML-comment convention: guidance for
  the generator goes inside the comment block and must never appear in a
  Rail's actual generated output.

## Modifying `skills/*/SKILL.md`

- `agentrails-build` and `agentrails-build-validation` must continue
  to scaffold their target `SKILL.md` packages through the `skill-creator`
  skill — this is a hard prerequisite (`PRD.md` §13), not a convenience.
  Don't add a hand-rolled packaging path, even as a fallback.
- `agentrails-build` also generates `rail.mjs` (the runtime harness) and
  `agentrails-build-validation` also generates `checks.mjs` (the
  mechanical checker) — see `PRD.md` §4.1/§7.2/§7.3. Both are plain,
  zero-dependency Node scripts, generated directly by the skill, not Agent
  Skills themselves — they must **not** go through `skill-creator`. Don't
  conflate "hard prerequisite for `SKILL.md` packaging" with "everything
  this skill produces."
- Keep the division of labor intact: `agentrails-design` is the only
  step that does LLM reasoning / resolves ambiguity; the two build
  commands are mechanical transformations that trust their inputs
  completely. If you find a build command needing to interpret or
  second-guess its input, that's a sign the ambiguity should have been
  caught by `agentrails-design` instead — fix it there, don't add
  judgment to a build command.
- The three commands' `description` frontmatter fields are their primary
  triggering mechanism. If you change what a command does, update its
  description to match — a stale description that still triggers on the
  old behavior is worse than an accurate one that undertriggers slightly.

## Testing changes

There is no automated test suite yet (see `PRD.md` §17, open item 1) — the
first real validation is running `agentrails-design` against a real,
concrete process description end-to-end and checking whether the
generated `context/` bundle actually holds up:

- Does every `Workflow.md` step cite a real `Backbone.md` ID?
- Is every `Backbone.md` objective/hard-limit covered by at least one
  `Validation.md` checklist item?
- Is every checklist item a concrete pass/fail condition, not a
  restatement of the objective?
- Is every `verifier: script` step verification mirrored by at least one
  `verifier: script` checklist item citing that step (`PRD.md` §8.4's
  mirroring rule), so `checks.mjs --step N` has something mechanical to
  run for every step?
- Does every `verifier: script` item use only the fixed assertion
  vocabulary (`PRD.md` §8.7: `exists`, `not-exists`, `contains`,
  `not-contains`, `matches`, `count-at-least`), never prose a compiler
  would have to interpret?

Build any test Rails under `/sandbox/` at the repo root (already
gitignored) — never commit a generated Rail into this repo. A Rail is a
separate artifact meant to live in its own project, not inside the
builder repo that produced it.

## Recording decisions

- **`PRD.md`** is the canonical spec — update it whenever a concept,
  command behavior, or convention changes, and add an entry to §3 (naming
  decisions) or §17 (open items) if the change is a reversal, correction,
  or newly settled question.
- **`DESIGN-NOTES.md`** is the working log — append new entries as you go,
  but don't rewrite its history; it's meant to show how the design
  actually evolved, including dead ends.
- **`Changelog.md`** (this repo's own, not a Rail's) records what shipped,
  not why — keep entries short and factual, and let `PRD.md` carry the
  rationale.
