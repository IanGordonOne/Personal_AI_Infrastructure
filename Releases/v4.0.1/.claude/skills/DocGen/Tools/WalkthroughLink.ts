#!/usr/bin/env bun
/**
 * WalkthroughLink — Universal walkthrough link formatter for DocGen.
 *
 * Usage: bun WalkthroughLink.ts <id> [--dir docs/walkthroughs]
 * Example: bun WalkthroughLink.ts trading-panel --dir docs/walkthroughs
 * Output: [Trading Panel](walkthroughs/trading-panel.md)
 */

import { existsSync } from "fs";
import { join, basename } from "path";

const args = process.argv.slice(2);
let id: string | undefined;
let dir = "docs/walkthroughs";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--dir" && args[i + 1]) {
    dir = args[++i];
  } else if (!args[i].startsWith("--")) {
    id = args[i];
  }
}

if (!id) {
  console.error("Usage: WalkthroughLink.ts <id> [--dir docs/walkthroughs]");
  process.exit(1);
}

const mdPath = join(dir, `${id}.md`);

if (existsSync(mdPath)) {
  const title = id
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  // Output relative link from the walkthroughs parent directory
  const relDir = basename(dir);
  console.log(`[${title}](${relDir}/${id}.md)`);
} else {
  console.log(`<!-- walkthrough not found: ${id} -->`);
}
