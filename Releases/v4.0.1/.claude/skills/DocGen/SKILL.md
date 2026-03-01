---
name: DocGen
description: Language-agnostic documentation pipeline. Template expansion with introspection. USE WHEN generating docs from templates, expanding placeholders, documentation pipeline, make docs, doc validation, template expansion, bootstrap docs, extract keybindings, extract commands, scaffold doc pipeline.
---

# DocGen — Language-Agnostic Documentation Pipeline

Introspect source code, produce catalogs, expand templates, validate. Works with any language, any project.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/DocGen/`

If this directory exists, load and apply:
- `PREFERENCES.md` - User preferences and configuration

These define user-specific preferences. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the DocGen skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **DocGen** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SYSTEM/THENOTIFICATIONSYSTEM.md`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **Init** | "set up docs", "init docgen", "add doc pipeline" | `Workflows/Init.md` |
| **Generate** | "generate docs", "expand templates", "make docs" | `Workflows/Generate.md` |
| **Bootstrap** | "bootstrap docs", "scaffold doc pipeline", "set up full doc pipeline" | `Workflows/Bootstrap.md` |
| **Extract** | "extract keybindings", "extract commands", "generate extractors" | `Workflows/Extract.md` |
| **Validate** | "validate docs", "check templates", "broken placeholders" | `Workflows/Validate.md` |
| **Adopt** | "migrate docs", "adopt docgen", "convert pipeline" | `Workflows/Adopt.md` |
| **Site** | "build doc site", "add starlight", "static site", "documentation website" | `Workflows/Site.md` |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **WorkflowDoc** | Complementary. WorkflowDoc generates walkthrough docs that DocGen can reference via `{{link:}}` placeholders. |
| **AsciiBox** | Complementary. DocGen templates may include ASCII mockups that follow AsciiBox alignment rules. |
| **TourGuide** | Complementary. Tour stops can reference DocGen-generated documentation. |

## Core Tool

```bash
# Generate all docs
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json

# Validate only (no output files written)
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --validate

# Single template
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --template mkdocs/readme_template.md

# Run introspectors only (refresh data catalogs)
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --introspect

# List all templates and their placeholder counts
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --list
```

## Formatter Tools

Standalone tools that render markdown from universal JSON data files. Each accepts `--data` to override the default path.

| Tool | Usage | Output |
|------|-------|--------|
| **KeyLookup** | `bun KeyLookup.ts chart.Zoom --data docs/keybindings.json` | `` `Z` — Zoom `` |
| **KeysTable** | `bun KeysTable.ts global:flat --data docs/keybindings.json` | Markdown table |
| **CommandsTable** | `bun CommandsTable.ts table:top --data docs/command-tree.json` | Markdown table |
| **WalkthroughLink** | `bun WalkthroughLink.ts trading-panel --dir docs/walkthroughs` | Markdown link |

All tools are in `Tools/` with `.help.md` companions. Error output uses `<!-- ERROR: ... -->` format.

## Data Schemas

Universal JSON formats for structured documentation data:

| Schema | File | Description |
|--------|------|-------------|
| **Keybindings** | `KeybindingsSchema.md` | `KeybindFile { app, maps[] }` with `KeybindEntry` bindings |
| **Commands** | `CommandsSchema.md` | Recursive `CommandNode { name, use, short, flags[], children[] }` |

## Placeholder Types

Six built-in types. No custom types in config — convention over configuration.

| Syntax | Purpose |
|--------|---------|
| `{{exec: command args}}` | Run command, indent output |
| `{{data: source.path.to.value}}` | Dot-path lookup in JSON/YAML |
| `{{table: source.path \| col1=field1, col2=field2}}` | Markdown table from data |
| `{{link: path/to/file.md}}` | File existence → link or comment |
| `{{var: name}}` | Named variable substitution |
| `{{script: path args}}` | External script, capture stdout |

Aliases map legacy syntax to built-in types (see `ConfigSchema.md`).

**Vars** accept bare strings or VarDef objects — both forms are valid:
```json
{ "project": "MyApp", "date": { "builtin": "date" }, "sha": { "exec": "git rev-parse --short HEAD" } }
```

## Hybrid README Pattern

DocGen excels at the **hybrid README** — a richly handcrafted template where most prose is static, and only sections backed by structured data use placeholders. This is the sweet spot:

- **Static prose stays human**: Etymology, architecture narratives, detailed per-command examples, and caveats are written by hand where nuance matters. No placeholder can capture the quality of thoughtful documentation.
- **Structured data stays fresh**: Command summary tables, keybinding references, version strings, and timestamps are generated from introspected catalogs. When you add a CLI command, `bun run docs` regenerates the table — no manual editing.
- **The template IS the README**: `mkdocs/readme_template.md` reads like a real README with a few `{{placeholders}}` sprinkled in. Contributors edit the template; CI generates the output.

Start with 2-3 placeholders (a var, a table, a date). Expand coverage only when you have structured data that justifies it.

## Key Resources

- **Config:** `<project>/.claude/skill-data/DocGen.json`
- **Tool:** `Tools/DocExpand.ts`
- **Config reference:** `ConfigSchema.md`
- **Placeholder reference:** `PlaceholderReference.md`
- **Keybindings schema:** `KeybindingsSchema.md`
- **Commands schema:** `CommandsSchema.md`
- **Extraction patterns:** `ExtractionPatterns.md` — per-framework strategies for static analysis when runtime introspection isn't possible

## Examples

**Example 1: Set up a doc pipeline**
```
User: "Set up a doc pipeline for this Python project"
→ Invokes Init workflow
→ Scans project structure, detects Python + pytest + Makefile
→ Generates DocGen.json config with template paths and introspectors
→ Suggests Makefile targets for `make docs` and `make docs-validate`
```

**Example 2: Generate docs from templates**
```
User: "Generate the docs"
→ Invokes Generate workflow
→ Runs introspectors to refresh data catalogs (keybindings, commands)
→ Expands all templates, resolving {{exec:}}, {{data:}}, {{table:}} placeholders
→ Output: Generated markdown files with fresh structured data
```

**Example 3: Validate placeholder resolution**
```
User: "Check if all doc placeholders resolve"
→ Invokes Validate workflow
→ Dry-run expansion of all templates
→ Reports: 2 broken placeholders (missing data path, command exit code 1)
→ Output: Error report with file, line number, and placeholder that failed
```
