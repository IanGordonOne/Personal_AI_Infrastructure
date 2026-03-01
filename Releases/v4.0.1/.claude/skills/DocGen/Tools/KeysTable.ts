#!/usr/bin/env bun
/**
 * KeysTable — Universal keybinding table formatter for DocGen.
 *
 * Usage: bun KeysTable.ts <context>[:flat] [--data path] [--categories sys,nav,action]
 * Examples:
 *   bun KeysTable.ts global:flat --data docs/keybindings.json
 *   bun KeysTable.ts chart --data docs/keybindings.json --categories system,navigation,overlay,indicator,display,analysis,action
 */

import { readFileSync } from "fs";

interface KeybindEntry {
  keys: string[];
  help: string;
  help_key: string;
  context: string;
  category: string;
  read_only: boolean;
}

interface KeybindMap {
  name: string;
  bindings: KeybindEntry[];
}

interface KeybindFile {
  app: string;
  maps: KeybindMap[];
}

// ─── Parse args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let contextArg: string | undefined;
let dataPath = "docs/keybindings.json";
let categoriesArg: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--data" && args[i + 1]) {
    dataPath = args[++i];
  } else if (args[i] === "--categories" && args[i + 1]) {
    categoriesArg = args[++i];
  } else if (!args[i].startsWith("--")) {
    contextArg = args[i];
  }
}

if (!contextArg) {
  console.error("Usage: KeysTable.ts <context>[:flat] [--data path] [--categories sys,nav,action]");
  process.exit(1);
}

const parts = contextArg.split(":");
const context = parts[0];
const flat = parts.length >= 2 && parts[1] === "flat";

let kb: KeybindFile;
try {
  kb = JSON.parse(readFileSync(dataPath, "utf-8"));
} catch (e: any) {
  console.log(`<!-- ERROR: keybindings: ${e.message} -->`);
  process.exit(0);
}

let bindings: KeybindEntry[] | undefined;
for (const m of kb.maps) {
  if (m.name === context) {
    bindings = m.bindings;
    break;
  }
}

if (!bindings) {
  console.log(`<!-- ERROR: keybinding context not found: ${context} -->`);
  process.exit(0);
}

const lines: string[] = [];
lines.push("| Key | Action |");
lines.push("|-----|--------|");

if (flat) {
  for (const b of bindings) {
    lines.push(`| \`${b.help_key}\` | ${b.help} |`);
  }
} else {
  // Determine category order: explicit --categories flag, or auto-discover from data
  let categoryOrder: string[];
  if (categoriesArg) {
    categoryOrder = categoriesArg.split(",").map((c) => c.trim());
  } else {
    // Auto-discover: preserve insertion order from the data
    const seen = new Set<string>();
    categoryOrder = [];
    for (const b of bindings) {
      if (!seen.has(b.category)) {
        seen.add(b.category);
        categoryOrder.push(b.category);
      }
    }
  }

  const groups = new Map<string, KeybindEntry[]>();
  for (const b of bindings) {
    if (!groups.has(b.category)) groups.set(b.category, []);
    groups.get(b.category)!.push(b);
  }

  for (const cat of categoryOrder) {
    const entries = groups.get(cat);
    if (!entries?.length) continue;
    const displayCat = cat.charAt(0).toUpperCase() + cat.slice(1);
    lines.push(`| **${displayCat}** | |`);
    for (const b of entries) {
      lines.push(`| \`${b.help_key}\` | ${b.help} |`);
    }
  }
}

console.log(lines.join("\n"));
