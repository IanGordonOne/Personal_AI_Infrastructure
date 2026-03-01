# Bootstrap — Full Documentation Pipeline Scaffold

Set up a complete documentation pipeline for any project in 7 steps. Produces extraction scripts, templates, Makefile targets, and a verified end-to-end run.

**Idempotency:** Safe to run multiple times. Existing files are never overwritten — each step checks for prior work and skips or merges as needed. Use `--force` semantics only when the user explicitly requests regeneration.

---

## Process (7 Steps)

### Step 1: Run Init

If `DocGen.json` does not exist, run the Init workflow first:

```bash
# Check for existing config
ls .claude/skill-data/DocGen.json 2>/dev/null || echo "No config — run Init first"
```

If Init has not been run, follow `Workflows/Init.md` to generate the base config, then return here.
If `DocGen.json` already exists, **skip Init** and proceed to Step 2.

### Step 2: Detect Doc Needs

Survey the project to determine which documentation features apply:

| Feature | Detection Signal |
|---------|-----------------|
| **Keybindings** | TUI framework present (BubbleTea, Ink, Textual, Ratatui), `useInput`, `tea.KeyMsg`, `BINDINGS` |
| **Commands** | CLI framework present (Cobra, Click, clap, Commander, yargs) |
| **Walkthroughs** | `docs/walkthroughs/` directory exists or user requests it |
| **API docs** | HTTP handlers, OpenAPI spec, or REST endpoints |
| **README** | Always — every project gets a README template |

Record which features are needed. Skip features that don't apply.

### Step 3: Scaffold Extraction Scripts

**Idempotency guard:** Before generating any extraction script, check if it already exists. If it does, **skip it** and report:
```
⏭ Skipping keybindings extractor — scripts/extract-keys.ts already exists
⏭ Skipping commands extractor — scripts/extract-commands.ts already exists
```
Only generate scripts for features that don't already have extractors.

For each detected feature, generate a language-appropriate extraction script:

**Keybindings extractor** — must output `KeybindingsSchema.md` format:
- **Go (BubbleTea):** Go binary or script that marshals keybinding structs to JSON
- **TypeScript (Ink):** Script that imports keybinding map and writes JSON
- **Python (Textual):** Script that introspects `BINDINGS` class variable
- **Rust (Ratatui):** Binary that serializes keybinding structs via serde

**Commands extractor** — must output `CommandsSchema.md` format:
- **Go (Cobra):** `tree --json` subcommand walking `root.Commands()`
- **TypeScript (Commander/yargs):** Script introspecting command tree
- **Python (Click):** Script introspecting group/command hierarchy
- **Rust (clap):** Binary using `clap` introspection

Place extraction scripts in a project-appropriate location (e.g., `scripts/`, `tools/`, `cmd/export-docs/`).

### Step 4: Create Template Stubs

**Idempotency guard:** Before creating any template file, check if it already exists. If it does, **skip it**:
```
⏭ Skipping template — docs/templates/README.md already exists
```

Generate template files with `{{placeholder}}` markers:

```markdown
# {{var: project}}

{{exec: scripts/extract-description}}

## Installation

{{exec: scripts/install-instructions}}

## Commands

{{script: bun ~/.claude/skills/DocGen/Tools/CommandsTable.ts table:top --data docs/command-tree.json}}

## Keybindings

{{script: bun ~/.claude/skills/DocGen/Tools/KeysTable.ts global --data docs/keybindings.json}}

## Walkthroughs

{{script: bun ~/.claude/skills/DocGen/Tools/WalkthroughLink.ts getting-started --dir docs/walkthroughs}}
```

Place templates alongside the config (e.g., `docs/templates/README.md`).

### Step 5: Update DocGen.json

**Idempotency guard:** Read the existing config first. **Merge** new entries rather than overwriting:
- `introspectors[]` — only add entries whose `name` doesn't already exist
- `data{}` — only add keys that don't already exist
- `templates[]` — only add entries whose `input` path doesn't already exist
- `aliases{}` — only add keys that don't already exist

Report what was merged vs skipped:
```
✅ Added introspector: keybindings
⏭ Skipping introspector: commands (already registered)
✅ Added alias: keys:
⏭ Skipping alias: cmds:table: (already registered)
```

Add the new introspectors, data sources, templates, and aliases to the config:

```json
{
  "introspectors": [
    { "name": "keybindings", "run": "bun scripts/extract-keys.ts", "output": "docs/keybindings.json" },
    { "name": "commands", "run": "bun scripts/extract-commands.ts", "output": "docs/command-tree.json" }
  ],
  "data": {
    "keybindings": "docs/keybindings.json",
    "commands": "docs/command-tree.json"
  },
  "templates": [
    { "input": "docs/templates/README.md", "output": "README.md" }
  ],
  "aliases": {
    "keys:": "script: bun ~/.claude/skills/DocGen/Tools/KeyLookup.ts ",
    "keys:table:": "script: bun ~/.claude/skills/DocGen/Tools/KeysTable.ts ",
    "cmds:table:": "script: bun ~/.claude/skills/DocGen/Tools/CommandsTable.ts ",
    "walk:": "script: bun ~/.claude/skills/DocGen/Tools/WalkthroughLink.ts "
  }
}
```

### Step 6: Add Makefile Targets

**Idempotency guard:** Before adding targets, check if they already exist in the Makefile:
```bash
grep -q '^docs:' Makefile 2>/dev/null && echo "⏭ Makefile 'docs' target already exists" || echo "✅ Adding 'docs' target"
```
Only add targets that don't already exist. If the Makefile doesn't exist at all, create it.

Add or update Makefile with documentation targets:

```makefile
.PHONY: docs docs-validate docs-extract

docs: docs-extract ## Generate all docs from templates
	bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json

docs-validate: ## Validate all template placeholders
	bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --validate

docs-extract: ## Run extraction scripts to refresh data catalogs
	bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --introspect
```

### Step 7: Verify End-to-End

Run the complete pipeline and confirm:

```bash
# 1. Run extractors
make docs-extract

# 2. Validate templates
make docs-validate

# 3. Generate docs
make docs

# 4. Confirm output files exist and are non-empty
```

Report any errors and iterate until the pipeline produces clean output.

---

## Notes

- Adapt script language to match the project (don't generate a Go script for a TypeScript project)
- Extraction scripts should be idempotent — safe to run repeatedly
- Templates should degrade gracefully if a data file is missing (DocExpand emits `<!-- ERROR: ... -->`)
- For projects without a CLI or TUI, skip keybindings/commands and focus on README + API docs
- See `KeybindingsSchema.md` and `CommandsSchema.md` for the required JSON output formats
