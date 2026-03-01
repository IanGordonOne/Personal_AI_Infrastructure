# Init — Set Up Documentation Pipeline

Scan a project, generate a DocGen config, and suggest Makefile/taskfile targets.

---

## Process (5 Steps)

### Step 1: Scan Project

Identify the project's language, build system, and existing documentation:

- Look for `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`, `setup.py`
- Check for existing doc templates (files with `{{` placeholders)
- Check for CLI binaries or help commands
- Check for data files (JSON/YAML) that docs might reference
- Check for existing Makefile, taskfile, or scripts

### Step 2: Identify Introspectors

Based on the project type, suggest commands that generate machine-readable catalogs:

| Language | Typical Introspectors |
|----------|----------------------|
| Go (Cobra) | `go build -o bin/app ./cmd/cli && bin/app tree --json` |
| Python (Click) | `python -m app.cli --help-json` |
| TypeScript | `node -e "..."` to extract from source |
| Rust (clap) | `cargo build && target/debug/app help-json` |
| Any | Static data files that already exist (no introspector needed) |

### Step 3: Generate Config

Create `<project>/.claude/skill-data/DocGen.json` with:

- `introspectors`: Commands identified in Step 2
- `data`: All JSON/YAML files referenced by templates
- `vars`: Version, date, project name
- `templates`: All template → output mappings found
- `aliases`: If existing templates use non-standard syntax
- `exec_options`: Indent size, sections to strip

Present the config to the user for review before writing.

### Step 4: Suggest Build Targets

Generate Makefile targets (or equivalent):

```makefile
.PHONY: docs
docs: ## Generate all docs from templates
	bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json

.PHONY: docs-validate
docs-validate: ## Validate all template placeholders
	bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --validate
```

### Step 5: Verify

Run the pipeline once to confirm everything works:

```bash
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --validate
```

Report any errors and iterate.

## Next Steps

After Init completes, consider these follow-up workflows:

- **Bootstrap** (`Workflows/Bootstrap.md`) — Full pipeline scaffold: extraction scripts, templates, Makefile targets, and end-to-end verification. Use when starting from scratch on a project with a TUI or CLI.
- **Extract** (`Workflows/Extract.md`) — Generate language-specific extraction adapters that produce universal JSON conforming to `KeybindingsSchema.md` and `CommandsSchema.md`. Use when the project has keybindings or commands to document.
- **Adopt** (`Workflows/Adopt.md`) — Migrate an existing documentation pipeline to DocGen without rewriting templates.

## Notes

- Config is always JSON (zero-dependency, no YAML parser needed for config itself)
- Data files referenced in config can be JSON or YAML
- Aliases enable adoption without rewriting existing templates
- The `--introspect` flag can be used to refresh data catalogs without expanding templates
