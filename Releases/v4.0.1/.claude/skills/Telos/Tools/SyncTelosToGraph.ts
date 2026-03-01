#!/usr/bin/env bun
/**
 * SyncTelosToGraph - Export TELOS markdown files into a LogSeq graph
 *
 * One-way sync: TELOS markdown → LogSeq pages with cross-links.
 * TELOS markdown files remain the source of truth.
 *
 * Usage:
 *   bun SyncTelosToGraph.ts [--dry-run] [--verbose]
 *
 * Requires logseq.telosGraphPath in ~/.claude/settings.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { paiPath, getLogseqTelosGraphPath } from '../../../hooks/lib/paths';
import { getPrincipal } from '../../../hooks/lib/identity';

const TELOS_DIR = paiPath('USER', 'TELOS');

// The 18 TELOS files
const TELOS_FILES = [
  'BELIEFS.md', 'BOOKS.md', 'CHALLENGES.md', 'FRAMES.md', 'GOALS.md',
  'LESSONS.md', 'MISSION.md', 'MODELS.md', 'MOVIES.md', 'NARRATIVES.md',
  'PREDICTIONS.md', 'PROBLEMS.md', 'PROJECTS.md', 'STRATEGIES.md',
  'TELOS.md', 'TRAUMAS.md', 'WISDOM.md', 'WRONG.md'
];

// =============================================================================
// LogSeq Page Generation
// =============================================================================

interface TelosGraphPage {
  /** LogSeq page filename (e.g., TELOS___BELIEFS.md) */
  filename: string;
  /** Full page content with properties and cross-links */
  content: string;
  /** Source TELOS file name */
  sourceFile: string;
}

/**
 * Convert a TELOS filename to a LogSeq page name.
 * Uses triple-underscore for namespace separator (LogSeq convention).
 */
function telosPageFilename(telosFile: string): string {
  const name = telosFile.replace('.md', '');
  return `TELOS___${name}.md`;
}

/**
 * Convert a TELOS filename reference to a LogSeq page link.
 */
function telosPageLink(telosFile: string): string {
  const name = telosFile.replace('.md', '');
  return `[[TELOS/${name}]]`;
}

/**
 * Scan content for references to other TELOS files and convert to LogSeq links.
 * Looks for:
 * - Direct file references (e.g., "GOALS.md", "BELIEFS.md")
 * - Capitalized TELOS concepts (e.g., "GOALS", "BELIEFS")
 */
function addCrossLinks(content: string, currentFile: string): string {
  let linked = content;

  for (const file of TELOS_FILES) {
    if (file === currentFile) continue;

    const name = file.replace('.md', '');

    // Replace "FILENAME.md" references with links
    const filePattern = new RegExp(`\\b${name}\\.md\\b`, 'g');
    linked = linked.replace(filePattern, telosPageLink(file));

    // Replace standalone uppercase TELOS concept names (only in prose, not headings)
    // Be conservative: only match when surrounded by whitespace/punctuation
    const conceptPattern = new RegExp(`(?<=\\s|^|\\()${name}(?=\\s|$|[.,;:!?)\\]])`, 'g');
    linked = linked.replace(conceptPattern, telosPageLink(file));
  }

  return linked;
}

/**
 * Build LogSeq page properties block.
 */
function buildProperties(sourceFile: string): string {
  const principal = getPrincipal();
  const timestamp = new Date().toISOString();
  return [
    `type:: telos`,
    `source:: pai`,
    `telos-file:: ${sourceFile}`,
    `last-synced:: ${timestamp}`,
  ].join('\n');
}

/**
 * Transform a TELOS markdown file into a LogSeq page.
 */
function transformTelosFile(telosFile: string, content: string): TelosGraphPage {
  const linkedContent = addCrossLinks(content, telosFile);
  const properties = buildProperties(telosFile);

  const pageContent = `${properties}\n\n${linkedContent}`;

  return {
    filename: telosPageFilename(telosFile),
    content: pageContent,
    sourceFile: telosFile,
  };
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  // 1. Check LogSeq graph path
  const graphPath = getLogseqTelosGraphPath();
  if (!graphPath) {
    console.error('❌ LogSeq graph path not configured.');
    console.error('   Add logseq.telosGraphPath to ~/.claude/settings.json:');
    console.error('   {');
    console.error('     "logseq": {');
    console.error('       "telosGraphPath": "/path/to/your/logseq/graph"');
    console.error('     }');
    console.error('   }');
    process.exit(1);
  }

  const pagesDir = join(graphPath, 'pages');
  if (!existsSync(pagesDir)) {
    if (dryRun) {
      console.log(`📁 Would create: ${pagesDir}`);
    } else {
      mkdirSync(pagesDir, { recursive: true });
    }
  }

  // 2. Check TELOS directory
  if (!existsSync(TELOS_DIR)) {
    console.error(`❌ TELOS directory not found: ${TELOS_DIR}`);
    console.error('   Create your TELOS files at this location first.');
    process.exit(1);
  }

  // 3. Discover TELOS files
  const availableFiles = readdirSync(TELOS_DIR)
    .filter(f => f.endsWith('.md') && TELOS_FILES.includes(f));

  if (availableFiles.length === 0) {
    console.error(`❌ No TELOS files found in ${TELOS_DIR}`);
    process.exit(1);
  }

  if (verbose) {
    console.log(`📂 TELOS directory: ${TELOS_DIR}`);
    console.log(`📂 LogSeq graph: ${graphPath}`);
    console.log(`📄 Found ${availableFiles.length} TELOS files\n`);
  }

  // 4. Transform and write pages
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const telosFile of availableFiles) {
    const filePath = join(TELOS_DIR, telosFile);
    const content = readFileSync(filePath, 'utf-8');
    const page = transformTelosFile(telosFile, content);
    const targetPath = join(pagesDir, page.filename);

    if (dryRun) {
      const exists = existsSync(targetPath);
      console.log(`  ${exists ? '🔄' : '✨'} ${page.filename} (${exists ? 'update' : 'create'})`);
      if (exists) updated++;
      else created++;
      continue;
    }

    // Check if content has changed
    if (existsSync(targetPath)) {
      const existing = readFileSync(targetPath, 'utf-8');
      // Compare without the last-synced timestamp line
      const stripTimestamp = (s: string) => s.replace(/last-synced:: .+/, '');
      if (stripTimestamp(existing) === stripTimestamp(page.content)) {
        skipped++;
        if (verbose) console.log(`  ⏭️  ${page.filename} (unchanged)`);
        continue;
      }
      updated++;
    } else {
      created++;
    }

    writeFileSync(targetPath, page.content, 'utf-8');
    if (verbose) {
      console.log(`  ✅ ${page.filename}`);
    }
  }

  // 5. Summary
  console.log(`\n🎯 TELOS → LogSeq sync ${dryRun ? '(dry run) ' : ''}complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total:   ${availableFiles.length} files`);

  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes.');
  }
}

main();
