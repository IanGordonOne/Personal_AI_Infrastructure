# Adopt — Migrate Existing Pipeline

Convert an existing documentation pipeline to DocGen without rewriting templates.

---

## Process (5 Steps)

### Step 1: Audit Existing Pipeline

Scan the project for:
- Existing template files (files containing `{{...}}` placeholders)
- Build targets that generate docs (Makefile, scripts)
- Data files consumed by the pipeline
- Custom placeholder syntax patterns

### Step 2: Map Placeholders to Types

For each unique placeholder pattern found, determine:
- Which built-in type it maps to (exec, data, table, link, var, script)
- Whether an alias is needed (custom syntax → built-in syntax)

Document the mapping:

| Existing Pattern | Built-in Type | Alias Needed |
|-----------------|---------------|-------------|
| `{{mycli status -h}}` | `exec:` | `"mycli ": "exec: bin/mycli "` |
| `{{key:chart.Zoom}}` | `data:` | `"key:": "data: keybindings."` |
| `{{.Version}}` | `var:` | `".Version": "var: version"` |
| `{{.Date}}` | `var:` | `".Date": "var: date"` |

### Step 3: Generate Config with Aliases

Create `DocGen.json` with aliases that map every existing placeholder pattern to a built-in type. This means **zero template changes required**.

### Step 4: Test Side-by-Side

For each template:
1. Generate output with the existing pipeline
2. Generate output with DocExpand
3. Diff the two outputs
4. Fix any mismatches

```bash
# Existing
go run ./mkdocs/ < mkdocs/readme_template.md > /tmp/old-readme.md

# DocExpand
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --template mkdocs/readme_template.md
diff /tmp/old-readme.md README.md
```

### Step 5: Cutover

Once all templates produce identical output:
1. Update Makefile to use DocExpand
2. Keep the old pipeline as a fallback (commented out) for one release
3. Remove old pipeline code when confident

## Notes

- The goal is **zero template changes** on initial adoption
- Aliases handle all custom syntax mapping
- Complex manifest-style expanders (custom Go functions) may need `script:` placeholders that call a formatter script
- After adoption, new templates should use convention-heavy syntax (no aliases needed)
