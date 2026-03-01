#!/usr/bin/env bun
/**
 * CommandsTable — Universal command tree table formatter for DocGen.
 *
 * Usage: bun CommandsTable.ts table:top|table:full [--data path] [--root-cmd myapp]
 * Examples:
 *   bun CommandsTable.ts table:top --data docs/command-tree.json
 *   bun CommandsTable.ts table:full --data docs/command-tree.json --root-cmd hf
 */

import { readFileSync } from "fs";

interface CommandFlag {
  name: string;
  type: string;
  default?: string;
  usage: string;
}

interface CommandNode {
  name: string;
  use: string;
  short: string;
  long?: string;
  flags?: CommandFlag[];
  children?: CommandNode[];
}

// ─── Parse args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let modeArg: string | undefined;
let dataPath = "docs/command-tree.json";
let rootCmd: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--data" && args[i + 1]) {
    dataPath = args[++i];
  } else if (args[i] === "--root-cmd" && args[i + 1]) {
    rootCmd = args[++i];
  } else if (!args[i].startsWith("--")) {
    modeArg = args[i];
  }
}

if (!modeArg) {
  console.error("Usage: CommandsTable.ts table:top|table:full [--data path] [--root-cmd myapp]");
  process.exit(1);
}

const modeParts = modeArg.split(":");
const mode = modeParts.length >= 2 ? modeParts[1] : "top";

let tree: CommandNode;
try {
  tree = JSON.parse(readFileSync(dataPath, "utf-8"));
} catch (e: any) {
  console.log(`<!-- ERROR: command-tree: ${e.message} -->`);
  process.exit(0);
}

// Use --root-cmd if provided, otherwise derive from tree.name
const cmdName = rootCmd ?? tree.name;

function formatCommandUse(node: CommandNode): string {
  return `\`${node.use}\``;
}

function formatCommandUseFull(fullCmd: string, node: CommandNode): string {
  const parts = node.use.split(/\s+/);
  const cmdArgs = parts.slice(1).map((p) =>
    p.replace(/\[/g, "<").replace(/\]/g, ">")
  );
  if (cmdArgs.length > 0) return `\`${fullCmd} ${cmdArgs.join(" ")}\``;
  return `\`${fullCmd}\``;
}

function formatTopFlags(flags: CommandFlag[] | undefined): string {
  if (!flags?.length) return "";
  const limit = Math.min(flags.length, 5);
  const parts = flags.slice(0, limit).map((f) => `\`--${f.name}\``);
  let result = parts.join(", ");
  if (flags.length > 5) result += ", ...";
  return result;
}

const lines: string[] = [];

if (mode === "top") {
  lines.push("| Command | Description |");
  lines.push("|---------|-------------|");
  for (const child of tree.children || []) {
    if (child.name === "completion" || child.name === "help") continue;
    lines.push(`| ${formatCommandUse(child)} | ${child.short} |`);
  }
} else if (mode === "full") {
  lines.push("| Command | Key Flags | Description |");
  lines.push("|---------|-----------|-------------|");

  function collectLeaves(prefix: string, node: CommandNode): void {
    const fullCmd = `${prefix} ${node.name}`;
    if (!node.children?.length) {
      const cmd = formatCommandUseFull(fullCmd, node);
      const flags = formatTopFlags(node.flags);
      lines.push(`| ${cmd} | ${flags} | ${node.short} |`);
      return;
    }
    for (const child of node.children) {
      if (child.name === "completion" || child.name === "help") continue;
      collectLeaves(fullCmd, child);
    }
  }

  for (const child of tree.children || []) {
    if (child.name === "completion" || child.name === "help") continue;
    collectLeaves(cmdName, child);
  }
}

console.log(lines.join("\n"));
