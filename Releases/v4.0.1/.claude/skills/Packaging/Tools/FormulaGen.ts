#!/usr/bin/env bun
/**
 * FormulaGen.ts — Homebrew formula .rb generator
 *
 * Generates complete Homebrew formula files from Packaging.json config.
 * Supports binary formulas (pre-built downloads) and source formulas.
 *
 * Usage:
 *   bun FormulaGen.ts --config Packaging.json              # generate formula
 *   bun FormulaGen.ts --config Packaging.json --update-shas # update SHA256s from dist/
 *   bun FormulaGen.ts --config Packaging.json --validate    # syntax check
 *   bun FormulaGen.ts --config Packaging.json --output <f>  # write to specific file
 *   bun FormulaGen.ts --help                                # show usage
 *
 * @author PAI System
 * @version 1.0.0
 */

import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname, resolve } from "path";
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface Target {
  os: string;
  arch: string;
}

interface Binary {
  name: string;
  main: string;
  description: string;
}

interface PackagingConfig {
  project_name: string;
  language: string;
  binaries: Binary[];
  version_source: string;
  version?: string;
  github?: { owner: string; repo: string };
  targets: Target[];
  formula: {
    tap: string;
    type: "binary" | "source";
    dependencies: string[];
    test_command: string;
  };
  build: Record<string, any>;
  goreleaser?: boolean;
}

interface ArchiveSha {
  os: string;
  arch: string;
  url: string;
  sha256: string;
}

interface CliArgs {
  config: string;
  updateShas: boolean;
  validate: boolean;
  output: string | null;
}

// ─── CLI Parsing ────────────────────────────────────────────────────────────

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    config: "",
    updateShas: false,
    validate: false,
    output: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--config":
        result.config = args[++i] ?? "";
        break;
      case "--update-shas":
        result.updateShas = true;
        break;
      case "--validate":
        result.validate = true;
        break;
      case "--output":
        result.output = args[++i] ?? null;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }

  if (!result.config) {
    console.error(`${c.red}Error: --config <path> is required${c.reset}`);
    printUsage();
    process.exit(1);
  }

  return result;
}

function printUsage(): void {
  console.log(`${c.bold}FormulaGen.ts${c.reset} — Homebrew formula generator

${c.bold}Usage:${c.reset}
  bun FormulaGen.ts --config <path>              ${c.dim}# generate formula${c.reset}
  bun FormulaGen.ts --config <path> --update-shas ${c.dim}# update SHA256s from dist/${c.reset}
  bun FormulaGen.ts --config <path> --validate    ${c.dim}# syntax check${c.reset}
  bun FormulaGen.ts --config <path> --output <f>  ${c.dim}# write to file${c.reset}

${c.bold}Options:${c.reset}
  --config <path>    Path to Packaging.json (required)
  --update-shas      Compute SHA256 from dist/ archives
  --validate         Check formula structure
  --output <path>    Write formula to file (default: stdout)
  --help             Show this help`);
}

// ─── Config Loading ─────────────────────────────────────────────────────────

function loadConfig(path: string): PackagingConfig {
  const resolved = resolve(path);
  if (!existsSync(resolved)) {
    console.error(`${c.red}Error: config not found: ${resolved}${c.reset}`);
    process.exit(1);
  }

  try {
    return JSON.parse(readFileSync(resolved, "utf-8")) as PackagingConfig;
  } catch (e: any) {
    console.error(`${c.red}Error: invalid config: ${e.message}${c.reset}`);
    process.exit(1);
  }
}

// ─── Naming Helpers ─────────────────────────────────────────────────────────

function toClassName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function brewArch(arch: string): "arm" | "intel" {
  return arch === "arm64" || arch === "aarch64" ? "arm" : "intel";
}

// ─── SHA256 Computation ─────────────────────────────────────────────────────

function computeSha256(filePath: string): string {
  const result = spawnSync("shasum", ["-a", "256", filePath], {
    encoding: "utf-8",
  });

  if (result.status !== 0) {
    console.error(`${c.red}Error computing SHA256 for ${filePath}${c.reset}`);
    return "FIXME_SHA256";
  }

  return result.stdout.trim().split(/\s+/)[0];
}

function findArchives(configPath: string, config: PackagingConfig): ArchiveSha[] {
  const projectDir = dirname(dirname(dirname(resolve(configPath))));
  const distDir = join(projectDir, "dist");

  if (!existsSync(distDir)) {
    console.error(`${c.yellow}Warning: dist/ directory not found at ${distDir}${c.reset}`);
    return [];
  }

  const files = readdirSync(distDir);
  const archives: ArchiveSha[] = [];

  for (const target of config.targets) {
    const pattern = `${config.project_name}-${config.version ?? "0.0.0"}-${target.os}-${target.arch}.tar.gz`;
    const found = files.find((f) => f === pattern);

    if (found) {
      const filePath = join(distDir, found);
      const sha = computeSha256(filePath);

      let url: string;
      if (config.github) {
        url = `https://github.com/${config.github.owner}/${config.github.repo}/releases/download/v${config.version}/${found}`;
      } else {
        url = `FIXME_URL/${found}`;
      }

      archives.push({
        os: target.os,
        arch: target.arch,
        url,
        sha256: sha,
      });
    }
  }

  return archives;
}

// ─── Formula Generation ─────────────────────────────────────────────────────

function generateBinaryFormula(config: PackagingConfig, archives: ArchiveSha[]): string {
  const className = toClassName(config.project_name);
  const version = config.version ?? "0.0.0";
  const binaryName = config.binaries[0]?.name ?? config.project_name;
  const homepage = config.github
    ? `https://github.com/${config.github.owner}/${config.github.repo}`
    : "FIXME_HOMEPAGE";
  const desc = config.binaries[0]?.description ?? `${config.project_name} CLI`;

  // Group archives by os
  const darwinArchives = archives.filter((a) => a.os === "darwin");
  const linuxArchives = archives.filter((a) => a.os === "linux");

  function archiveBlock(archivesForOs: ArchiveSha[], indent: string): string {
    const lines: string[] = [];
    for (const archive of archivesForOs) {
      const archType = brewArch(archive.arch);
      lines.push(`${indent}on_${archType} do`);
      lines.push(`${indent}  url "${archive.url}"`);
      lines.push(`${indent}  sha256 "${archive.sha256}"`);
      lines.push(`${indent}end`);
    }
    return lines.join("\n");
  }

  function placeholderBlock(os: string, targets: Target[], indent: string): string {
    const lines: string[] = [];
    const osTargets = targets.filter((t) => t.os === os);
    for (const target of osTargets) {
      const archType = brewArch(target.arch);
      lines.push(`${indent}on_${archType} do`);
      lines.push(
        `${indent}  url "https://github.com/${config.github?.owner ?? "OWNER"}/${config.github?.repo ?? "REPO"}/releases/download/v${version}/${config.project_name}-${version}-${os}-${target.arch}.tar.gz"`
      );
      lines.push(`${indent}  sha256 "FIXME_SHA256"`);
      lines.push(`${indent}end`);
    }
    return lines.join("\n");
  }

  const depLines = config.formula.dependencies
    .map((d) => `  depends_on "${d}"`)
    .join("\n");

  const darwinBlock =
    darwinArchives.length > 0
      ? archiveBlock(darwinArchives, "    ")
      : placeholderBlock("darwin", config.targets, "    ");

  const linuxBlock =
    linuxArchives.length > 0
      ? archiveBlock(linuxArchives, "    ")
      : placeholderBlock("linux", config.targets, "    ");

  const testCmd = config.formula.test_command;
  const testLine = testCmd.startsWith("--")
    ? `assert_match version.to_s, shell_output("\#{bin}/${binaryName} ${testCmd}")`
    : `system bin/"${binaryName}", "${testCmd}"`;

  return `class ${className} < Formula
  desc "${desc}"
  homepage "${homepage}"
  version "${version}"
  license "MIT"

  on_macos do
${darwinBlock}
  end

  on_linux do
${linuxBlock}
  end

${depLines ? depLines + "\n\n" : ""}  def install
    bin.install "${binaryName}"
  end

  test do
    ${testLine}
  end
end
`;
}

function generateSourceFormula(config: PackagingConfig): string {
  const className = toClassName(config.project_name);
  const version = config.version ?? "0.0.0";
  const binaryName = config.binaries[0]?.name ?? config.project_name;
  const homepage = config.github
    ? `https://github.com/${config.github.owner}/${config.github.repo}`
    : "FIXME_HOMEPAGE";
  const desc = config.binaries[0]?.description ?? `${config.project_name} CLI`;

  const sourceUrl = config.github
    ? `https://github.com/${config.github.owner}/${config.github.repo}/archive/refs/tags/v${version}.tar.gz`
    : "FIXME_SOURCE_URL";

  let buildInstructions: string;

  switch (config.language) {
    case "go":
      buildInstructions = `  depends_on "go" => :build

  def install
    ldflags = %W[
      -s -w
      -X main.version=\#{version}
    ]
    system "go", "build", *std_go_args(ldflags:), "${config.binaries[0]?.main ?? "."}"
  end`;
      break;

    case "rust":
      buildInstructions = `  depends_on "rust" => :build

  def install
    system "cargo", "install", *std_cargo_args
  end`;
      break;

    default:
      buildInstructions = `  def install
    bin.install "${binaryName}"
  end`;
  }

  const testCmd = config.formula.test_command;
  const testLine = testCmd.startsWith("--")
    ? `assert_match version.to_s, shell_output("\#{bin}/${binaryName} ${testCmd}")`
    : `system bin/"${binaryName}", "${testCmd}"`;

  return `class ${className} < Formula
  desc "${desc}"
  homepage "${homepage}"
  url "${sourceUrl}"
  sha256 "FIXME_SHA256"
  version "${version}"
  license "MIT"

${buildInstructions}

  test do
    ${testLine}
  end
end
`;
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateFormula(formula: string): string[] {
  const errors: string[] = [];

  if (!formula.includes("class ")) errors.push("Missing class definition");
  if (!formula.includes("< Formula")) errors.push("Not extending Formula");
  if (!formula.includes("desc ")) errors.push("Missing desc");
  if (!formula.includes("homepage ")) errors.push("Missing homepage");
  if (!formula.includes("def install")) errors.push("Missing install block");
  if (!formula.includes("test do")) errors.push("Missing test block");
  if (formula.includes("FIXME")) errors.push("Contains FIXME placeholders");

  return errors;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();
  const config = loadConfig(args.config);

  let archives: ArchiveSha[] = [];

  if (args.updateShas) {
    archives = findArchives(args.config, config);
    if (archives.length === 0) {
      console.error(`${c.yellow}No archives found in dist/. Formula will have FIXME placeholders.${c.reset}`);
    } else {
      console.error(`${c.green}Found ${archives.length} archives with SHA256 checksums${c.reset}`);
    }
  }

  let formula: string;

  if (config.formula.type === "source") {
    formula = generateSourceFormula(config);
  } else {
    formula = generateBinaryFormula(config, archives);
  }

  if (args.validate) {
    const errors = validateFormula(formula);
    if (errors.length === 0) {
      console.log(`${c.green}Formula structure is valid${c.reset}`);
    } else {
      console.error(`${c.red}Validation errors:${c.reset}`);
      for (const err of errors) {
        console.error(`  ${c.yellow}- ${err}${c.reset}`);
      }
      process.exit(1);
    }
    return;
  }

  if (args.output) {
    writeFileSync(args.output, formula);
    console.error(`${c.green}Wrote formula to ${args.output}${c.reset}`);
  } else {
    console.log(formula);
  }
}

main();
