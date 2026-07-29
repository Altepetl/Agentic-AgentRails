# AgentRails — Agent Guidance

This file is written for AI coding agents that need to work in the AgentRails repository. Read it first, then `PRD.md`, then the files relevant to your task.

## Project overview

**AgentRails** is a builder toolchain that turns a documented process into a **Rail**: a reusable, version-tracked guide that fixes the mandatory path of a process while leaving a **judgment zone** where the executing LLM's own judgment decides how to carry out each step. A weaker model stays on the path because the fixed core anchors it; a stronger model produces a better result on the exact same path because the judgment zone is where its extra capability shows up.

This repository is the **builder repo**, not a Rail itself. It ships:

- Three installable **Agent Skills** (`skills/agentrails-design`, `skills/agentrails-build`, `skills/agentrails-build-validation`) that form a small pipeline.
- Five **document templates** (`templates/Design.md`, `Backbone.md`, `Workflow.md`, `Validation.md`, `Readme.md`) that define the structure of every generated Rail's `context/` bundle.
- A small Node.js CLI (`bin/cli.js`) that installs the three AgentRails skills into Agent-Skills-compatible tools (Claude Code, Google Antigravity, Cursor, ZCode, Kimi Code CLI, OpenAI Codex CLI, and the generic `.agents/skills/` convention).

Nothing in this repo is process-specific. `templates/` and `skills/` are fixed tooling; every `<process-name>/` Rail bundle is generated outside this repository, wherever the user directs `agentrails-design` to write it.

## What this repo is not

- It is **not** a Rail. Do not treat the repo as an example Rail or add process-specific logic to it.
- It does **not** compare a Rail's output across repeated runs, keep a history of improvement passes, or decide one pass is better than another. That is the separate, sibling **AgentRefinery** project, which consumes the Rails this repo produces. Do not add cross-pass memory, "which pass is better" judgment, or accumulation logic to anything this repo produces.
- A bare Rail's re-run is a **clean, destructive restart**: when the user chooses to run again, `output-process-name/` is deleted and the process starts over from Step 1. Do not soften this into "complement the prior result" or keep a changelog of improvement passes.

## Technology stack

- **Runtime**: Node.js >=18 (declared in `package.json` `engines`).
- **Language**: JavaScript (ES2015+), no transpilation step.
- **Dependencies**: none at runtime. The CLI uses only Node.js built-in modules (`fs`, `path`, `os`, `readline`).
- **Package manager**: npm (the package is published as `agent-rails` on npm).
- **Distribution**: the npm package exposes the `agent-rails` binary via `bin/cli.js`.
- **Target platforms**: any tool that supports the open Agent Skills format — a directory containing a `SKILL.md` file plus optional supporting files.

## Repository structure

```
AgentRails/
├── README.md                              ← pitch + quick user manual
├── PRD.md                                 ← canonical, exhaustive spec (read before non-trivial changes)
├── DESIGN-NOTES.md                        ← session-by-session working design log (append only)
├── Changelog.md                           ← this repo's own release history
├── CONTRIBUTE.md                          ← contribution conventions
├── CLAUDE.md                              ← guidance for agents working in this repo
├── AGENTS.md                              ← this file
├── LICENSE                                ← MIT, Altepetl
├── package.json                           ← npm metadata for the installer
├── bin/cli.js                             ← `npx agent-rails install/list/help`
├── skills/                                ← the 3 AgentRails meta-commands
│   ├── agentrails-design/SKILL.md
│   ├── agentrails-build/SKILL.md
│   └── agentrails-build-validation/SKILL.md
└── templates/                             ← base patterns for the 5 Rail context documents
    ├── Design.md
    ├── Backbone.md
    ├── Workflow.md
    ├── Validation.md
    └── Readme.md
```

## The 3 commands

| Command | Judgment? | Reads | Produces |
|---|---|---|---|
| `agentrails-design` | Yes — the only reasoning step | Process description (a PRD works well as-is), optional Rails to merge | `<process-name>/context/*.md` (draft bundle) |
| `agentrails-build` | No — deterministic | `context/{Backbone,Workflow,Readme}.md` | `<process-name>/process-name/SKILL.md` + `<process-name>/rail.mjs` |
| `agentrails-build-validation` | No — deterministic | `context/{Validation,Backbone}.md` | `<process-name>/process-name-validation/SKILL.md` + `<process-name>/checks.mjs` |

`agentrails-build` and `agentrails-build-validation` have a **hard prerequisite**: the `skill-creator` skill must be installed and available. They must scaffold their target `SKILL.md` packages **through `skill-creator`**, never hand-roll packaging themselves.

## Build and run commands

There is no compilation or bundling step. The CLI runs directly from source.

Run the CLI from the repo root:

```bash
node bin/cli.js help
node bin/cli.js list
node bin/cli.js install --target claude
# or, using the package's own bin entry:
npx . install --target claude
```

Available `install` targets (see `bin/cli.js` for the current mapping):

- `claude` — `.claude/skills/` (project) or `~/.claude/skills/` (global)
- `antigravity` — `.agent/skills/` (project) or `~/.gemini/antigravity/skills/` (global)
- `cursor` — `.cursor/skills/` (project-scope only)
- `zcode` — `.zcode/skills/` (project) or `~/.config/zcode/skills/` (global)
- `kimi` — `.kimi-code/skills/` (project) or `~/.kimi-code/skills/` (global)
- `codex` — `.codex/skills/` (project) or `~/.codex/skills/` (global)
- `agents` — `.agents/skills/` (generic shared convention)

`package.json` `files` array controls what gets published to npm: `bin/`, `skills/`, `templates/`, `README.md`, `PRD.md`, `LICENSE`.

## Development workflow and how to test changes

1. **Read `PRD.md` in full before any non-trivial change.** It is the canonical spec. If `README.md`, `CLAUDE.md`, `CONTRIBUTE.md`, or any `SKILL.md` disagrees with `PRD.md`, treat that as a bug to fix.
2. **Propagate terminology and behavior changes everywhere.** The same concept is deliberately documented at multiple levels. Before considering a rename done, grep the whole repo for the old term:
   ```bash
   grep -rn "<old-term>" --include="*.md" .
   ```
3. **Update `PRD.md` first** for conceptual or behavioral changes, then update `README.md` and the affected `skills/*/SKILL.md` / `templates/*.md` files.
4. **Log design history correctly:**
   - `PRD.md` §3 — naming decisions and reversals.
   - `PRD.md` §17 — open items and roadmap.
   - `DESIGN-NOTES.md` — append new session entries; do not rewrite its history.
   - `Changelog.md` — factual "what shipped" entries under `[Unreleased]` until a version is actually tagged/published.
5. **Build test Rails under `/sandbox/`** (already gitignored). Never commit a generated Rail into this repo. A Rail belongs in its own project.

## Testing strategy

There is **no automated test suite yet** (`PRD.md` §17, open item 1). The first real validation is running `agentrails-design` end-to-end against a real, concrete process description and checking the generated `context/` bundle:

- Does every `Workflow.md` step cite a real `Backbone.md` ID (`O#` or `L#`)?
- Is every `Backbone.md` objective/hard limit covered by at least one `Validation.md` checklist item?
- Is every checklist item a concrete pass/fail condition against `output-process-name/`, not a restatement of the objective?
- Is every `verifier: script` step verification mirrored by at least one `verifier: script` checklist item (PRD.md §8.4's mirroring rule), and does every `script` item use only the §8.7 assertion vocabulary?

Use `/sandbox/` for these test runs. Because the two build commands depend on the external `skill-creator` skill, exercise them in an environment where that skill is installed.

## Code style and project conventions

1. **English only, everywhere.** No exceptions for etymology notes, parenthetical asides, or terms that started as Spanish shorthand. This has been corrected twice already in this project's history (`PRD.md` §3).
2. **Command and file names are fully hyphen-separated.** Use `agentrails-build-validation`, never `agentrails-buildvalidation`.
3. **Assume nothing; document everything.** Every command's required inputs, preconditions, exact output paths, and error/ambiguity handling must be explicit. When something is ambiguous, stop and ask rather than guessing.
4. **Preserve bold/italic emphasis through edits.** Formatting is independent of wording; do not drop or add emphasis while translating a term.
5. **A rename or concept change is not done until every file that mentions it is updated.** Files that typically need touching together: `README.md`, `PRD.md`, `DESIGN-NOTES.md`, and all three `skills/*/SKILL.md` files.
6. **Keep `TEMPLATE INSTRUCTIONS` as HTML comments.** Guidance for `agentrails-design` goes inside `<!-- -->` blocks in `templates/*.md` and must never appear in a generated Rail's output.
7. **Match existing structure.** The three `SKILL.md` files use YAML frontmatter (`name`, `description`) followed by Markdown instructions. Keep that shape when editing.

## Security considerations

- The CLI copies files from `skills/` to platform-specific directories. It uses `fs.copyFileSync` and `fs.mkdirSync(..., { recursive: true })`. It does not execute arbitrary code from the target directories, but it does overwrite existing skill directories of the same name. Treat the source `skills/` as trusted input.
- The installer never asks for credentials, network access, or elevated permissions. It only reads the local `skills/` tree and writes to the chosen target path.
- Generated Rails live outside this repo. Do not commit user-generated process descriptions, Backbone objectives, or Rail output into the AgentRails repo.
- `.env` files, SSH keys, and other secrets are gitignored by `.gitignore`. Do not relax that guard.

## Key architectural decisions to keep in mind

- **Only `agentrails-design` does LLM reasoning.** The two build commands are mechanical transformations. If you find a build command needing to interpret input, that ambiguity should have been caught by `agentrails-design` instead. This is also why `verifier: script` checks use a fixed assertion vocabulary (PRD.md §8.7): compiling assertions into `checks.mjs` is lookup-and-substitute, never prose interpretation.
- **The verification layer is mechanical wherever possible.** Every check is classified `verifier: script` or `verifier: agent` (PRD.md §4.1). `rail.mjs` (generated by `agentrails-build`) owns all writes to `ProcessTracking.md`; `checks.mjs` (generated by `agentrails-build-validation`) gates each step during execution and anchors validation's tiered report (mechanically verified / agent-verified / failed). Neither script goes through `skill-creator` — they are plain zero-dependency Node files, not Agent Skills.
- **`Backbone.md` is the single source of truth.** `Workflow.md` and `Validation.md` derive from it. Precedence on conflict: Backbone > Workflow > Validation > Design.
- **`process-name` is user-supplied and durable.** Never invent one. Other Rails may inherit from it by name.
- **The generated `process-name` skill's Phase 4 is destructive.** It deletes `output-process-name/` and restarts from Step 1. Do not add cross-pass memory.
- **Inheritance merges by union and stops on contradiction.** `agentrails-design` reports conflicting objectives/hard limits and terminates; it does not auto-resolve.

## Common pitfalls

- **Confusing AgentRails' product with a Rail's product.** AgentRails produces `context/` + the two `SKILL.md` packages + the two harness scripts (`rail.mjs`, `checks.mjs`). `output-process-name/` is produced later by running the Rail, not by AgentRails.
- **Adding fallback packaging in the build commands.** `skill-creator` is a hard prerequisite, not a convenience. Do not hand-roll `SKILL.md` scaffolding.
- **Silent ambiguity resolution.** Every command stops and asks when inputs are missing or unclear. Do not let a command infer a `process-name` or file location.
- **Forgetting to grep after a rename.** Because the same concepts appear in `README.md`, `PRD.md`, `DESIGN-NOTES.md`, and all three `SKILL.md` files, a partial rename is worse than no rename.

## Where to find authoritative information

- **`PRD.md`** — full requirements spec: every concept, document structure, state machine, naming decision, and rationale. Read this before any non-trivial change.
- **`README.md`** — pitch and concise user manual for the 3 commands.
- **`CONTRIBUTE.md`** — detailed contribution conventions, including how to modify templates and skills.
- **`CLAUDE.md`** — guidance specifically for agents working in this repo (overlaps with this file but shorter and Claude-oriented).
- **`DESIGN-NOTES.md`** — historical working log; useful for understanding why a decision was made, not for current procedure.
- **`bin/cli.js`** — source of truth for installer behavior and supported platform paths.
- **`skills/*/SKILL.md`** — source of truth for what each command actually does at runtime.
- **`templates/*.md`** — source of truth for the required frontmatter and section skeleton of every Rail context document.
