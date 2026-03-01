#!/usr/bin/env bun
/**
 * Detect.ts — Project detection & Packaging.json generation
 *
 * Scans a project directory to identify language, binary entry points,
 * version source, GitHub remote, and existing build configuration.
 *
 * Usage:
 *   bun Detect.ts --project <path>          # detect and display
 *   bun Detect.ts --project <path> --init   # detect and write Packaging.json
 *   bun Detect.ts --project <path> --json   # machine-readable output
 *   bun Detect.ts --help                    # show usage
 *
 * @author PAI System
 * @version 1.0.0
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
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
  magenta: "\x1b[35m",
};

// ─── Types ──────────────────────────────────────────────────────────────────

type Language = "go" | "bun" | "rust" | "python" | "unknown";

interface Binary {
  name: string;
  main: string;
  description: string;
}

interface Target {
  os: string;
  arch: string;
}

interface GitHubInfo {
  owner: string;
  repo: string;
}

interface BuildConfig {
  ldflags?: string;
  env?: Record<string, string>;
  flags?: string[];
  entry?: string;
}

interface PackagingConfig {
  project_name: string;
  language: Language;
  binaries: Binary[];
  version_source: string;
  version?: string;
  github?: GitHubInfo;
  targets: Target[];
  formula: {
    tap: string;
    type: "binary" | "source";
    dependencies: string[];
    test_command: string;
  };
  build: BuildConfig;
  goreleaser?: boolean;
}

interface CliArgs {
  project: string;
  init: boolean;
  json: boolean;
}

// ─── CLI Parsing ────────────────────────────────────────────────────────────

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { project: "", init: false, json: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--project":
        result.project = args[++i] ?? "";
        break;
      case "--init":
        result.init = true;
        break;
      case "--json":
        result.json = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }

  if (!result.project) {
    console.error(`${c.red}Error: --project <path> is required${c.reset}`);
    printUsage();
    process.exit(1);
  }

  result.project = resolve(result.project);

  if (!existsSync(result.project)) {
    console.error(`${c.red}Error: project directory not found: ${result.project}${c.reset}`);
    process.exit(1);
  }

  return result;
}

function printUsage(): void {
  console.log(`${c.bold}Detect.ts${c.reset} — Project detection & Packaging.json generation

${c.bold}Usage:${c.reset}
  bun Detect.ts --project <path>          ${c.dim}# detect and display${c.reset}
  bun Detect.ts --project <path> --init   ${c.dim}# detect and write Packaging.json${c.reset}
  bun Detect.ts --project <path> --json   ${c.dim}# machine-readable output${c.reset}

${c.bold}Options:${c.reset}
  --project <path>  Path to the project directory (required)
  --init            Write Packaging.json after detection
  --json            Output as JSON (machine-readable)
  --help            Show this help`);
}

// ─── Detection Functions ────────────────────────────────────────────────────

function detectLanguage(projectPath: string): Language {
  if (existsSync(join(projectPath, "go.mod"))) return "go";
  if (existsSync(join(projectPath, "Cargo.toml"))) return "rust";
  if (existsSync(join(projectPath, "package.json"))) return "bun";
  if (existsSync(join(projectPath, "pyproject.toml"))) return "python";
  if (existsSync(join(projectPath, "setup.py"))) return "python";
  return "unknown";
}

function detectGoBinaries(projectPath: string): Binary[] {
  const binaries: Binary[] = [];

  // Check cmd/ directory for Go binaries
  const cmdDir = join(projectPath, "cmd");
  if (existsSync(cmdDir)) {
    const result = spawnSync("ls", ["-1", cmdDir], { encoding: "utf-8" });
    if (result.status === 0) {
      const dirs = result.stdout.trim().split("\n").filter(Boolean);
      for (const dir of dirs) {
        const mainFile = join(cmdDir, dir, "main.go");
        if (existsSync(mainFile)) {
          binaries.push({
            name: dir,
            main: `./cmd/${dir}`,
            description: `${dir} binary`,
          });
        }
      }
    }
  }

  // Check root main.go
  if (binaries.length === 0 && existsSync(join(projectPath, "main.go"))) {
    const name = basename(projectPath);
    binaries.push({
      name,
      main: ".",
      description: `${name} binary`,
    });
  }

  return binaries;
}

function detectBunBinaries(projectPath: string): Binary[] {
  const binaries: Binary[] = [];
  const pkgPath = join(projectPath, "package.json");

  if (!existsSync(pkgPath)) return binaries;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

    // Check bin field
    if (pkg.bin) {
      if (typeof pkg.bin === "string") {
        binaries.push({
          name: pkg.name?.replace(/^@[^/]+\//, "") ?? basename(projectPath),
          main: pkg.bin,
          description: pkg.description ?? "",
        });
      } else if (typeof pkg.bin === "object") {
        for (const [name, entry] of Object.entries(pkg.bin)) {
          binaries.push({
            name,
            main: entry as string,
            description: pkg.description ?? "",
          });
        }
      }
    }

    // Check for bun build --compile in scripts
    if (pkg.scripts) {
      for (const [key, val] of Object.entries(pkg.scripts)) {
        const script = val as string;
        if (script.includes("bun build") && script.includes("--compile")) {
          // Extract entry point from the build command
          const match = script.match(/bun build (\S+)/);
          if (match && binaries.length === 0) {
            binaries.push({
              name: pkg.name?.replace(/^@[^/]+\//, "") ?? basename(projectPath),
              main: match[1],
              description: pkg.description ?? "",
            });
          }
          break;
        }
      }
    }

    // Fallback: check for src/index.ts or src/index.tsx
    if (binaries.length === 0) {
      for (const entry of ["src/index.ts", "src/index.tsx", "index.ts"]) {
        if (existsSync(join(projectPath, entry))) {
          binaries.push({
            name: pkg.name?.replace(/^@[^/]+\//, "") ?? basename(projectPath),
            main: entry,
            description: pkg.description ?? "",
          });
          break;
        }
      }
    }
  } catch {
    // Invalid package.json
  }

  return binaries;
}

function detectRustBinaries(projectPath: string): Binary[] {
  const binaries: Binary[] = [];
  const cargoPath = join(projectPath, "Cargo.toml");

  if (!existsSync(cargoPath)) return binaries;

  try {
    const content = readFileSync(cargoPath, "utf-8");

    // Check for [[bin]] sections
    const binMatches = content.matchAll(/\[\[bin\]\]\s*\n(?:.*\n)*?name\s*=\s*"([^"]+)"/g);
    for (const match of binMatches) {
      binaries.push({
        name: match[1],
        main: `src/bin/${match[1]}.rs`,
        description: "",
      });
    }

    // Check for src/main.rs (default binary)
    if (binaries.length === 0 && existsSync(join(projectPath, "src/main.rs"))) {
      const nameMatch = content.match(/\[package\]\s*\n(?:.*\n)*?name\s*=\s*"([^"]+)"/);
      const name = nameMatch?.[1] ?? basename(projectPath);
      binaries.push({
        name,
        main: "src/main.rs",
        description: "",
      });
    }
  } catch {
    // Invalid Cargo.toml
  }

  return binaries;
}

function detectPythonBinaries(projectPath: string): Binary[] {
  const binaries: Binary[] = [];
  const pyprojectPath = join(projectPath, "pyproject.toml");

  if (!existsSync(pyprojectPath)) return binaries;

  try {
    const content = readFileSync(pyprojectPath, "utf-8");

    // Check [project.scripts]
    const scriptsMatch = content.match(/\[project\.scripts\]\s*\n((?:.*=.*\n)*)/);
    if (scriptsMatch) {
      const lines = scriptsMatch[1].trim().split("\n");
      for (const line of lines) {
        const match = line.match(/^(\S+)\s*=\s*"([^"]+)"/);
        if (match) {
          binaries.push({
            name: match[1],
            main: match[2],
            description: "",
          });
        }
      }
    }

    // Check [tool.poetry.scripts]
    const poetryMatch = content.match(/\[tool\.poetry\.scripts\]\s*\n((?:.*=.*\n)*)/);
    if (poetryMatch && binaries.length === 0) {
      const lines = poetryMatch[1].trim().split("\n");
      for (const line of lines) {
        const match = line.match(/^(\S+)\s*=\s*"([^"]+)"/);
        if (match) {
          binaries.push({
            name: match[1],
            main: match[2],
            description: "",
          });
        }
      }
    }
  } catch {
    // Invalid pyproject.toml
  }

  return binaries;
}

function detectBinaries(projectPath: string, language: Language): Binary[] {
  switch (language) {
    case "go":
      return detectGoBinaries(projectPath);
    case "bun":
      return detectBunBinaries(projectPath);
    case "rust":
      return detectRustBinaries(projectPath);
    case "python":
      return detectPythonBinaries(projectPath);
    default:
      return [];
  }
}

function detectVersionSource(projectPath: string, language: Language): { source: string; version?: string } {
  // Check for git tags first (preferred)
  const gitResult = spawnSync("git", ["describe", "--tags", "--abbrev=0"], {
    cwd: projectPath,
    encoding: "utf-8",
  });

  if (gitResult.status === 0) {
    const tag = gitResult.stdout.trim();
    return { source: "git_tag", version: tag.replace(/^v/, "") };
  }

  // Language-specific version sources
  switch (language) {
    case "bun": {
      const pkgPath = join(projectPath, "package.json");
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
          if (pkg.version) return { source: "package.json", version: pkg.version };
        } catch {}
      }
      break;
    }
    case "rust": {
      const cargoPath = join(projectPath, "Cargo.toml");
      if (existsSync(cargoPath)) {
        const content = readFileSync(cargoPath, "utf-8");
        const match = content.match(/version\s*=\s*"([^"]+)"/);
        if (match) return { source: "Cargo.toml", version: match[1] };
      }
      break;
    }
    case "python": {
      const pyPath = join(projectPath, "pyproject.toml");
      if (existsSync(pyPath)) {
        const content = readFileSync(pyPath, "utf-8");
        const match = content.match(/version\s*=\s*"([^"]+)"/);
        if (match) return { source: "pyproject.toml", version: match[1] };
      }
      break;
    }
  }

  return { source: "git_tag" };
}

function detectGitHub(projectPath: string): GitHubInfo | undefined {
  const result = spawnSync("git", ["remote", "get-url", "origin"], {
    cwd: projectPath,
    encoding: "utf-8",
  });

  if (result.status !== 0) return undefined;

  const url = result.stdout.trim();

  // Parse SSH format: git@github.com:owner/repo.git
  let match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return undefined;
}

function detectGoReleaser(projectPath: string): boolean {
  return (
    existsSync(join(projectPath, ".goreleaser.yaml")) ||
    existsSync(join(projectPath, ".goreleaser.yml"))
  );
}

function getDefaultTargets(language: Language): Target[] {
  const standard: Target[] = [
    { os: "darwin", arch: "arm64" },
    { os: "darwin", arch: "amd64" },
    { os: "linux", arch: "arm64" },
    { os: "linux", arch: "amd64" },
  ];

  // Python with PyInstaller can't cross-compile easily
  if (language === "python") {
    return [{ os: "darwin", arch: "arm64" }];
  }

  return standard;
}

function getDefaultBuildConfig(language: Language): BuildConfig {
  switch (language) {
    case "go":
      return {
        ldflags: "-s -w",
        env: { CGO_ENABLED: "0" },
        flags: ["-trimpath"],
      };
    case "bun":
      return {
        flags: ["--compile", "--minify"],
      };
    case "rust":
      return {
        flags: ["--release"],
      };
    case "python":
      return {
        flags: ["--onefile"],
      };
    default:
      return {};
  }
}

// ─── Main Detection ─────────────────────────────────────────────────────────

function detect(projectPath: string): PackagingConfig {
  const language = detectLanguage(projectPath);
  const binaries = detectBinaries(projectPath, language);
  const versionInfo = detectVersionSource(projectPath, language);
  const github = detectGitHub(projectPath);
  const hasGoReleaser = language === "go" && detectGoReleaser(projectPath);

  const config: PackagingConfig = {
    project_name: basename(projectPath),
    language,
    binaries,
    version_source: versionInfo.source,
    ...(versionInfo.version && { version: versionInfo.version }),
    ...(github && { github }),
    targets: getDefaultTargets(language),
    formula: {
      tap: "<your-github-user>/homebrew-tap",
      type: "binary",
      dependencies: [],
      test_command: "--version",
    },
    build: getDefaultBuildConfig(language),
    ...(hasGoReleaser && { goreleaser: true }),
  };

  return config;
}

// ─── Output ─────────────────────────────────────────────────────────────────

function displayConfig(config: PackagingConfig): void {
  const langColors: Record<string, string> = {
    go: c.cyan,
    bun: c.yellow,
    rust: c.red,
    python: c.blue,
    unknown: c.dim,
  };

  const langColor = langColors[config.language] ?? c.dim;

  console.log(`\n${c.bold}Packaging Detection Results${c.reset}`);
  console.log(`${"─".repeat(50)}`);
  console.log(`${c.bold}Project:${c.reset}  ${config.project_name}`);
  console.log(`${c.bold}Language:${c.reset} ${langColor}${config.language}${c.reset}`);
  console.log(`${c.bold}Version:${c.reset}  ${config.version ?? "(none detected)"} ${c.dim}(source: ${config.version_source})${c.reset}`);

  if (config.github) {
    console.log(`${c.bold}GitHub:${c.reset}   ${c.blue}${config.github.owner}/${config.github.repo}${c.reset}`);
  }

  if (config.goreleaser) {
    console.log(`${c.bold}GoReleaser:${c.reset} ${c.green}detected${c.reset}`);
  }

  console.log(`\n${c.bold}Binaries:${c.reset}`);
  if (config.binaries.length === 0) {
    console.log(`  ${c.yellow}(none detected)${c.reset}`);
  } else {
    for (const bin of config.binaries) {
      console.log(`  ${c.green}${bin.name}${c.reset} → ${c.dim}${bin.main}${c.reset}`);
    }
  }

  console.log(`\n${c.bold}Targets:${c.reset}`);
  for (const target of config.targets) {
    console.log(`  ${target.os}/${target.arch}`);
  }

  console.log(`\n${c.bold}Build Config:${c.reset}`);
  if (config.build.env) {
    for (const [k, v] of Object.entries(config.build.env)) {
      console.log(`  ${c.dim}env:${c.reset} ${k}=${v}`);
    }
  }
  if (config.build.ldflags) {
    console.log(`  ${c.dim}ldflags:${c.reset} ${config.build.ldflags}`);
  }
  if (config.build.flags) {
    console.log(`  ${c.dim}flags:${c.reset} ${config.build.flags.join(" ")}`);
  }

  console.log(`\n${c.bold}Formula:${c.reset}`);
  console.log(`  ${c.dim}tap:${c.reset} ${config.formula.tap}`);
  console.log(`  ${c.dim}type:${c.reset} ${config.formula.type}`);
  console.log(`  ${c.dim}test:${c.reset} ${config.formula.test_command}`);
  console.log();
}

function writePackagingJson(projectPath: string, config: PackagingConfig): void {
  const dir = join(projectPath, ".claude", "skill-data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const outPath = join(dir, "Packaging.json");
  writeFileSync(outPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`${c.green}Wrote${c.reset} ${outPath}`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const config = detect(args.project);

  if (args.json) {
    console.log(JSON.stringify(config, null, 2));
  } else {
    displayConfig(config);
  }

  if (args.init) {
    writePackagingJson(args.project, config);
  }
}

main();
