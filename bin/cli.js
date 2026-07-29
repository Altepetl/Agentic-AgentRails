#!/usr/bin/env node
'use strict';

/**
 * agent-rails CLI — installs the AgentRails Agent Skills
 * (agentrails-design, agentrails-build, agentrails-build-validation)
 * into whichever Agent-Skills-compatible tool(s) the user picks.
 *
 * Usage:
 *   npx agent-rails install [--target <name>[,<name>...]] [--global] [--dir <path>] [--yes]
 *   npx agent-rails list
 *   npx agent-rails help
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const PACKAGE_ROOT = path.join(__dirname, '..');
const SKILLS_SOURCE_DIR = path.join(PACKAGE_ROOT, 'skills');
const TEMPLATES_SOURCE_DIR = path.join(PACKAGE_ROOT, 'templates');
const SKILL_NAMES = [
  'agentrails-design',
  'agentrails-build',
  'agentrails-build-validation',
];

// agentrails-design is the only one of the 3 commands that reads templates/
// at runtime (see skills/agentrails-design/SKILL.md, Step 1). templates/
// lives at the AgentRails repo root, outside every skills/<name>/ directory,
// so it is never picked up by the plain per-skill copyDirRecursive() below.
// Without this, an installed agentrails-design has no way to find the base
// templates once it's copied out of a clone of this repo — bundle a copy of
// templates/ inside the installed agentrails-design skill itself, so it's
// self-contained no matter which platform/location it ends up in.
const SKILL_EXTRA_DIRS = {
  'agentrails-design': [{ src: TEMPLATES_SOURCE_DIR, destSubdir: 'templates' }],
};

// Install paths confirmed against each platform's own docs at the time this
// installer was written. Conventions in this space move fast — if a target
// has moved, pass --dir to point the installer at the right place directly.
const PLATFORMS = {
  claude: {
    label: 'Claude Code',
    project: '.claude/skills',
    global: () => path.join(os.homedir(), '.claude', 'skills'),
  },
  antigravity: {
    label: 'Google Antigravity',
    project: '.agent/skills',
    global: () => path.join(os.homedir(), '.gemini', 'antigravity', 'skills'),
  },
  cursor: {
    label: 'Cursor',
    project: '.cursor/skills',
    global: null, // Cursor skills are project-scoped only, no personal directory
  },
  zcode: {
    label: 'ZCode',
    project: '.zcode/skills',
    global: () => path.join(os.homedir(), '.config', 'zcode', 'skills'),
  },
  kimi: {
    label: 'Kimi Code CLI',
    project: '.kimi-code/skills',
    global: () => path.join(os.homedir(), '.kimi-code', 'skills'),
  },
  codex: {
    label: 'OpenAI Codex CLI',
    project: '.codex/skills',
    global: () => path.join(os.homedir(), '.codex', 'skills'),
  },
  agents: {
    label: 'Generic — .agents/skills (shared convention also read by Gemini CLI, VS Code Copilot, and other Agent-Skills-compatible tools)',
    project: '.agents/skills',
    global: () => path.join(os.homedir(), '.agents', 'skills'),
  },
};

const PLATFORM_ORDER = ['claude', 'antigravity', 'cursor', 'zcode', 'kimi', 'codex', 'agents'];

function printHelp() {
  console.log(`
agent-rails — install the AgentRails Agent Skills

Usage:
  npx agent-rails install [options]
  npx agent-rails list
  npx agent-rails help

Options for "install":
  --target <names>   Comma-separated platform keys (see "list"). Skips the
                      interactive prompt.
  --global            Install to the platform's user-level directory instead
                      of the project-level one, for platforms that support it.
  --dir <path>        Project root to install into (default: current directory).
  --yes, -y           Non-interactive: requires --target, fails instead of
                      prompting if a choice is missing.

Examples:
  npx agent-rails install
  npx agent-rails install --target claude,cursor
  npx agent-rails install --target claude --global
  npx agent-rails install --target antigravity --dir ~/Projects/MyApp
`);
}

function printList() {
  console.log('\nSkills installed by this command:');
  for (const name of SKILL_NAMES) {
    console.log(`  - ${name}`);
  }
  console.log('\nAvailable installation targets:');
  for (const key of PLATFORM_ORDER) {
    const p = PLATFORMS[key];
    const globalNote = p.global ? '' : ' (project-scope only)';
    console.log(`  - ${key.padEnd(11)} ${p.label}${globalNote}`);
  }
  console.log('');
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--target') {
      args.target = argv[++i];
    } else if (a === '--dir') {
      args.dir = argv[++i];
    } else if (a === '--global') {
      args.global = true;
    } else if (a === '--yes' || a === '-y') {
      args.yes = true;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function promptLine(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function resolveTargets(args) {
  if (args.target) {
    return args.target.split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (args.yes) {
    console.error('Error: --yes requires --target <names> (see "npx agent-rails list").');
    process.exit(1);
  }
  if (!process.stdin.isTTY) {
    console.error(
      'Error: no TTY available for the interactive prompt. Pass --target <names> ' +
        '(see "npx agent-rails list") to run non-interactively.'
    );
    process.exit(1);
  }
  printList();
  const answer = await promptLine(
    'Install into which target(s)? Comma-separated keys from the list above: '
  );
  return answer.split(',').map((s) => s.trim()).filter(Boolean);
}

async function resolveScope(args, targets) {
  if (args.global) return 'global';
  const anySupportsGlobal = targets.some((t) => PLATFORMS[t] && PLATFORMS[t].global);
  if (!anySupportsGlobal || args.yes || !process.stdin.isTTY) return 'project';
  const answer = await promptLine('Install project-level or user-level (global)? [project/global] (project): ');
  return answer.toLowerCase().startsWith('g') ? 'global' : 'project';
}

async function runInstall(args) {
  const targets = await resolveTargets(args);
  if (targets.length === 0) {
    console.error('Error: no installation target given.');
    process.exit(1);
  }

  const unknown = targets.filter((t) => !PLATFORMS[t]);
  if (unknown.length > 0) {
    console.error(`Error: unknown target(s): ${unknown.join(', ')}`);
    console.error('Run "npx agent-rails list" to see valid target keys.');
    process.exit(1);
  }

  const scope = await resolveScope(args, targets);
  const projectRoot = path.resolve(args.dir || process.cwd());

  console.log('');
  for (const key of targets) {
    const platform = PLATFORMS[key];
    let destRoot;
    if (scope === 'global') {
      if (!platform.global) {
        console.log(`- ${platform.label}: has no user-level directory, installing project-level instead.`);
        destRoot = path.join(projectRoot, platform.project);
      } else {
        destRoot = platform.global();
      }
    } else {
      destRoot = path.join(projectRoot, platform.project);
    }

    for (const skillName of SKILL_NAMES) {
      const src = path.join(SKILLS_SOURCE_DIR, skillName);
      const dest = path.join(destRoot, skillName);
      const existed = fs.existsSync(dest);
      copyDirRecursive(src, dest);
      for (const extra of SKILL_EXTRA_DIRS[skillName] || []) {
        copyDirRecursive(extra.src, path.join(dest, extra.destSubdir));
      }
      console.log(`- ${platform.label}: ${existed ? 'updated' : 'installed'} ${skillName} -> ${dest}`);
    }
  }

  console.log(`
Done. Reminder: agentrails-build and agentrails-build-validation both
require the skill-creator skill (https://claude.com/plugins/skill-creator)
to already be installed and available — install it the same way if you
haven't already.
`);
}

async function main() {
  const [, , command, ...rest] = process.argv;
  const args = parseArgs(rest);

  if (!command || args.help || command === 'help') {
    printHelp();
    return;
  }

  if (command === 'list') {
    printList();
    return;
  }

  if (command === 'install') {
    await runInstall(args);
    return;
  }

  console.error(`Unknown command: ${command}\n`);
  printHelp();
  process.exit(1);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
