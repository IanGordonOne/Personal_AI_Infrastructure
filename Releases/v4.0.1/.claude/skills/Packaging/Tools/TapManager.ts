#!/usr/bin/env bun
/**
 * TapManager.ts — Homebrew tap repository management
 *
 * Manages the personal Homebrew tap: initialization, formula publishing,
 * syncing with remote, and auditing formula quality.
 *
 * Usage:
 *   bun TapManager.ts init                     # initialize tap state
 *   bun TapManager.ts list                     # list formulas in tap
 *   bun TapManager.ts publish --formula <f>    # push formula to tap repo
 *   bun TapManager.ts sync                     # sync local tap with remote
 *   bun TapManager.ts audit                    # brew audit all formulas
 *   bun TapManager.ts --help                   # show usage
 *
 * @author PAI System
 * @version 1.0.0
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, copyFileSync } from "fs";
import { join, basename, resolve } from "path";
import { spawnSync } from "child_process";

// ─── ANSI Colors ────────────────────────────────────────────────────────────

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

// ─── Constants ──────────────────────────────────────────────────────────────

const TAP_OWNER = "<your-github-user>";
const TAP_REPO = "homebrew-tap";
const TAP_NAME = `${TAP_OWNER}/tap`;
const TAP_STATE_DIR = join(
  process.env.HOME ?? "~",
  ".claude",
  "skills",
  "Packaging",
  "Tools"
);
const TAP_STATE_FILE = join(TAP_STATE_DIR, "tap.json");

// ─── Types ──────────────────────────────────────────────────────────────────

interface TapState {
  owner: string;
  repo: string;
  tap_name: string;
  created_at: string;
  formulas: Record<
    string,
    {
      published_at: string;
      version: string;
      source: string;
    }
  >;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function run(
  cmd: string,
  args: string[],
  opts?: { cwd?: string }
): { ok: boolean; stdout: string; stderr: string } {
  const result = spawnSync(cmd, args, {
    encoding: "utf-8",
    cwd: opts?.cwd,
    timeout: 60_000,
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? "",
    stderr: result.stderr?.trim() ?? "",
  };
}

function loadState(): TapState | null {
  if (!existsSync(TAP_STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TAP_STATE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function saveState(state: TapState): void {
  writeFileSync(TAP_STATE_FILE, JSON.stringify(state, null, 2) + "\n");
}

function getTapPath(): string | null {
  const result = run("brew", ["--repo", TAP_NAME]);
  if (result.ok && existsSync(result.stdout)) {
    return result.stdout;
  }
  return null;
}

// ─── Commands ───────────────────────────────────────────────────────────────

function cmdInit(): void {
  console.log(`${c.bold}Initializing tap state...${c.reset}`);

  // Check if tap repo exists on GitHub
  const repoCheck = run("gh", ["repo", "view", `${TAP_OWNER}/${TAP_REPO}`, "--json", "name"]);

  if (!repoCheck.ok) {
    console.log(`${c.yellow}Tap repo ${TAP_OWNER}/${TAP_REPO} not found on GitHub.${c.reset}`);
    console.log(`${c.dim}Run the TapSetup workflow to create it.${c.reset}`);
  } else {
    console.log(`${c.green}Tap repo exists on GitHub: ${TAP_OWNER}/${TAP_REPO}${c.reset}`);
  }

  // Check if tap is added locally
  const tapPath = getTapPath();
  if (tapPath) {
    console.log(`${c.green}Tap installed locally at: ${tapPath}${c.reset}`);
  } else {
    console.log(`${c.yellow}Tap not installed locally. Run: brew tap ${TAP_NAME}${c.reset}`);
  }

  // Create or update state file
  const existingState = loadState();
  const state: TapState = existingState ?? {
    owner: TAP_OWNER,
    repo: TAP_REPO,
    tap_name: TAP_NAME,
    created_at: new Date().toISOString(),
    formulas: {},
  };

  // Scan existing formulas if tap is installed
  if (tapPath) {
    const formulaDir = join(tapPath, "Formula");
    if (existsSync(formulaDir)) {
      const files = readdirSync(formulaDir).filter((f) => f.endsWith(".rb"));
      for (const file of files) {
        const name = file.replace(/\.rb$/, "");
        if (!state.formulas[name]) {
          state.formulas[name] = {
            published_at: new Date().toISOString(),
            version: "unknown",
            source: "discovered",
          };
        }
      }
    }
  }

  saveState(state);
  console.log(`${c.green}State saved to ${TAP_STATE_FILE}${c.reset}`);
}

function cmdList(): void {
  const state = loadState();

  if (!state) {
    console.log(`${c.yellow}No tap state found. Run 'init' first.${c.reset}`);
    return;
  }

  console.log(`${c.bold}Tap: ${state.tap_name}${c.reset}`);
  console.log(`${c.dim}Repo: ${state.owner}/${state.repo}${c.reset}\n`);

  const formulas = Object.entries(state.formulas);

  if (formulas.length === 0) {
    console.log(`${c.dim}No formulas published yet.${c.reset}`);
    return;
  }

  console.log(`${c.bold}Formulas:${c.reset}`);
  for (const [name, info] of formulas) {
    console.log(
      `  ${c.green}${name}${c.reset} ${c.dim}v${info.version} (${info.published_at.split("T")[0]})${c.reset}`
    );
  }

  // Also check installed tap for live formulas
  const tapPath = getTapPath();
  if (tapPath) {
    const formulaDir = join(tapPath, "Formula");
    if (existsSync(formulaDir)) {
      const files = readdirSync(formulaDir).filter((f) => f.endsWith(".rb"));
      const stateNames = new Set(Object.keys(state.formulas));
      const untracked = files
        .map((f) => f.replace(/\.rb$/, ""))
        .filter((n) => !stateNames.has(n));

      if (untracked.length > 0) {
        console.log(`\n${c.yellow}Untracked formulas in tap:${c.reset}`);
        for (const name of untracked) {
          console.log(`  ${c.yellow}${name}${c.reset}`);
        }
      }
    }
  }
}

function cmdPublish(formulaPath: string): void {
  if (!formulaPath) {
    console.error(`${c.red}Error: --formula <path> is required${c.reset}`);
    process.exit(1);
  }

  const resolved = resolve(formulaPath);
  if (!existsSync(resolved)) {
    console.error(`${c.red}Error: formula not found: ${resolved}${c.reset}`);
    process.exit(1);
  }

  const tapPath = getTapPath();
  if (!tapPath) {
    console.error(`${c.red}Error: tap not installed. Run: brew tap ${TAP_NAME}${c.reset}`);
    process.exit(1);
  }

  const formulaDir = join(tapPath, "Formula");
  const fileName = basename(resolved);
  const destPath = join(formulaDir, fileName);

  // Copy formula to tap
  copyFileSync(resolved, destPath);
  console.log(`${c.green}Copied ${fileName} → ${destPath}${c.reset}`);

  // Git add, commit, push
  const name = fileName.replace(/\.rb$/, "");

  const addResult = run("git", ["add", `Formula/${fileName}`], { cwd: tapPath });
  if (!addResult.ok) {
    console.error(`${c.red}Git add failed: ${addResult.stderr}${c.reset}`);
    process.exit(1);
  }

  // Extract version from formula
  const formulaContent = readFileSync(resolved, "utf-8");
  const versionMatch = formulaContent.match(/version\s+"([^"]+)"/);
  const version = versionMatch?.[1] ?? "unknown";

  const commitResult = run("git", ["commit", "-m", `Update ${name} to v${version}`], {
    cwd: tapPath,
  });
  if (!commitResult.ok && !commitResult.stderr.includes("nothing to commit")) {
    console.error(`${c.red}Git commit failed: ${commitResult.stderr}${c.reset}`);
    process.exit(1);
  }

  const pushResult = run("git", ["push"], { cwd: tapPath });
  if (!pushResult.ok) {
    console.error(`${c.red}Git push failed: ${pushResult.stderr}${c.reset}`);
    process.exit(1);
  }

  console.log(`${c.green}Published ${name} v${version} to ${TAP_NAME}${c.reset}`);

  // Update state
  const state = loadState() ?? {
    owner: TAP_OWNER,
    repo: TAP_REPO,
    tap_name: TAP_NAME,
    created_at: new Date().toISOString(),
    formulas: {},
  };

  state.formulas[name] = {
    published_at: new Date().toISOString(),
    version,
    source: resolved,
  };

  saveState(state);
}

function cmdSync(): void {
  const tapPath = getTapPath();

  if (!tapPath) {
    console.log(`${c.yellow}Tap not installed locally. Running: brew tap ${TAP_NAME}${c.reset}`);
    const tapResult = run("brew", ["tap", TAP_NAME]);
    if (!tapResult.ok) {
      console.error(`${c.red}Failed to tap: ${tapResult.stderr}${c.reset}`);
      process.exit(1);
    }
    console.log(`${c.green}Tap installed successfully${c.reset}`);
    return;
  }

  console.log(`${c.bold}Syncing tap at ${tapPath}...${c.reset}`);

  const pullResult = run("git", ["pull", "--rebase"], { cwd: tapPath });
  if (pullResult.ok) {
    console.log(`${c.green}Tap synced with remote${c.reset}`);
  } else {
    console.error(`${c.yellow}Sync issue: ${pullResult.stderr}${c.reset}`);
  }
}

function cmdAudit(): void {
  const tapPath = getTapPath();

  if (!tapPath) {
    console.error(`${c.red}Error: tap not installed. Run: brew tap ${TAP_NAME}${c.reset}`);
    process.exit(1);
  }

  const formulaDir = join(tapPath, "Formula");
  if (!existsSync(formulaDir)) {
    console.log(`${c.yellow}No Formula/ directory in tap${c.reset}`);
    return;
  }

  const files = readdirSync(formulaDir).filter((f) => f.endsWith(".rb"));

  if (files.length === 0) {
    console.log(`${c.dim}No formulas to audit.${c.reset}`);
    return;
  }

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const formulaPath = join(formulaDir, file);
    const name = file.replace(/\.rb$/, "");

    console.log(`${c.bold}Auditing ${name}...${c.reset}`);
    const result = run("brew", ["audit", "--strict", formulaPath]);

    if (result.ok) {
      console.log(`  ${c.green}PASS${c.reset}`);
      passed++;
    } else {
      console.log(`  ${c.red}FAIL${c.reset}`);
      if (result.stderr) {
        for (const line of result.stderr.split("\n")) {
          console.log(`  ${c.yellow}${line}${c.reset}`);
        }
      }
      failed++;
    }
  }

  console.log(
    `\n${c.bold}Results:${c.reset} ${c.green}${passed} passed${c.reset}, ${failed > 0 ? c.red : c.dim}${failed} failed${c.reset}`
  );

  if (failed > 0) process.exit(1);
}

// ─── CLI Router ─────────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`${c.bold}TapManager.ts${c.reset} — Homebrew tap management

${c.bold}Usage:${c.reset}
  bun TapManager.ts <command> [options]

${c.bold}Commands:${c.reset}
  init                     ${c.dim}Initialize tap state${c.reset}
  list                     ${c.dim}List formulas in tap${c.reset}
  publish --formula <f>    ${c.dim}Push formula to tap repo${c.reset}
  sync                     ${c.dim}Sync local tap with remote${c.reset}
  audit                    ${c.dim}brew audit all formulas${c.reset}

${c.bold}Options:${c.reset}
  --formula <path>  Path to .rb formula file (for publish)
  --help            Show this help`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    printHelp();
    process.exit(0);
  }

  const command = args[0];

  // Parse remaining flags
  let formulaPath = "";
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--formula") {
      formulaPath = args[++i] ?? "";
    }
  }

  switch (command) {
    case "init":
      cmdInit();
      break;
    case "list":
      cmdList();
      break;
    case "publish":
      cmdPublish(formulaPath);
      break;
    case "sync":
      cmdSync();
      break;
    case "audit":
      cmdAudit();
      break;
    default:
      console.error(`${c.red}Unknown command: ${command}${c.reset}`);
      printHelp();
      process.exit(1);
  }
}

main();
