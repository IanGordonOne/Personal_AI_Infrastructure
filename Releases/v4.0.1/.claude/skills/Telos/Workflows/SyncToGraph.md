# SyncToGraph Workflow

Sync TELOS markdown files to a LogSeq graph as namespaced pages with cross-links.

## When to Use

- After updating TELOS files (run manually or after the Update workflow)
- When setting up LogSeq graph for the first time
- To refresh cross-links after adding new TELOS content

## Prerequisites

Add `logseq.telosGraphPath` to `~/.claude/settings.json`:

```json
{
  "logseq": {
    "telosGraphPath": "/absolute/path/to/your/logseq/graph"
  }
}
```

## Usage

```bash
# Preview what would be synced
bun ~/.claude/skills/TELOS/Tools/SyncTelosToGraph.ts --dry-run

# Sync with verbose output
bun ~/.claude/skills/TELOS/Tools/SyncTelosToGraph.ts --verbose

# Silent sync
bun ~/.claude/skills/TELOS/Tools/SyncTelosToGraph.ts
```

## What It Does

1. Reads all 18 TELOS markdown files from `~/.claude/USER/TELOS/`
2. Transforms each file into a LogSeq page under the `TELOS/` namespace
3. Adds page properties: `type:: telos`, `source:: pai`, `telos-file::`, `last-synced::`
4. Converts references to other TELOS files into `[[TELOS/X]]` page links
5. Writes pages to `{graphPath}/pages/TELOS___<filename>.md`
6. Skips unchanged pages (compares content excluding timestamps)

## Design Principles

- **One-way sync**: TELOS markdown is the source of truth. Changes flow markdown → LogSeq only.
- **File-based writes**: Writes directly to the `pages/` directory, not via HTTP API (avoids LogSeq API block persistence bugs).
- **Idempotent**: Safe to run repeatedly. Only overwrites pages that have `source:: pai`.
- **Non-breaking**: Returns an error if `logseq.telosGraphPath` is not configured. No other TELOS behavior is affected.

## Graph Architecture

TELOS pages live as a namespace inside a general-purpose LogSeq graph. The graph grows organically through:

- **Cross-links**: `SyncTelosToGraph.ts` converts references between TELOS files into LogSeq page links
- **Backlinks**: LogSeq automatically shows backlinks on TELOS pages from any note that references them
- **User linking**: Users can link their own journal entries, notes, and projects to TELOS pages
- **PeriodicReview entries**: Review completions can write journal entries with TELOS page links (Kyber integration)

## Using TELOS Links in LogSeq

Once TELOS pages exist in the graph, the Kyber plugin provides a **TELOS Linker** for quickly inserting `[[TELOS/X]]` page links without typing the full namespace:

| Method | How |
|--------|-----|
| Slash command | Type `/telos-link` in any block |
| Toolbar button | Click the **T** button in LogSeq's toolbar |
| Keyboard shortcut | `Cmd+Shift+T` (command palette) |

All three open a popup picker with all 18 dimensions grouped by category. Type to filter, click to insert. The link is inserted at the cursor position in the current block.

## Output Example

```
📂 TELOS directory: ~/.claude/USER/TELOS/
📂 LogSeq graph: ~/.config/kyber
📄 Found 18 TELOS files

  ✅ TELOS___BELIEFS.md
  ✅ TELOS___GOALS.md
  ⏭️  TELOS___MISSION.md (unchanged)
  ...

🎯 TELOS → LogSeq sync complete!
   Created: 2
   Updated: 5
   Skipped: 11
   Total:   18 files
```
