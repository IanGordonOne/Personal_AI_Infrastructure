#!/usr/bin/env bun
/**
 * KeyLookup — Universal keybinding lookup formatter for DocGen.
 *
 * Usage: bun KeyLookup.ts <context.name> [--data path/to/keybindings.json]
 * Example: bun KeyLookup.ts chart.Fibonacci --data docs/keybindings.json
 * Output: `F` — Fibonacci retracement
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
let ref: string | undefined;
let dataPath = "docs/keybindings.json";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--data" && args[i + 1]) {
    dataPath = args[++i];
  } else if (!args[i].startsWith("--")) {
    ref = args[i];
  }
}

if (!ref) {
  console.error("Usage: KeyLookup.ts <context.name> [--data path/to/keybindings.json]");
  process.exit(1);
}

const dotIdx = ref.indexOf(".");
if (dotIdx < 0) {
  console.log(`<!-- ERROR: invalid key ref: ${ref} -->`);
  process.exit(0);
}

const context = ref.slice(0, dotIdx);
const name = ref.slice(dotIdx + 1);
const nameLower = name.toLowerCase().replace(/\s+/g, "");

let kb: KeybindFile;
try {
  kb = JSON.parse(readFileSync(dataPath, "utf-8"));
} catch (e: any) {
  console.log(`<!-- ERROR: keybindings: ${e.message} -->`);
  process.exit(0);
}

for (const m of kb.maps) {
  if (m.name !== context) continue;

  // Primary: match by help_key.
  for (const b of m.bindings) {
    if (b.help_key === name || b.help_key.toLowerCase().replace(/\s+/g, "") === nameLower) {
      console.log(`\`${b.help_key}\` — ${b.help}`);
      process.exit(0);
    }
  }

  // Fallback: match by help description.
  for (const b of m.bindings) {
    const descNorm = b.help.toLowerCase().replace(/\s+/g, "");
    if (descNorm === nameLower) {
      console.log(`\`${b.help_key}\` — ${b.help}`);
      process.exit(0);
    }
  }
}

console.log(`<!-- ERROR: key not found: ${ref} -->`);
