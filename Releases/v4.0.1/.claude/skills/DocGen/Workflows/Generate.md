# Generate — Expand All Templates

Run introspectors and expand all templates to produce documentation.

---

## Process (4 Steps)

### Step 1: Load Config

```bash
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json
```

The tool:
1. Reads `DocGen.json` from the project's `.claude/skill-data/` directory
2. Validates the config schema (required fields, valid paths)
3. Resolves all paths relative to the project root

### Step 2: Run Introspectors

Introspectors execute in order. Each one:
- Runs the `run` command
- Captures stdout
- Writes output to the `output` path
- Reports success/failure

If an introspector fails, the pipeline stops with an error. Data catalogs must be fresh before template expansion.

### Step 3: Expand Templates

For each template in config:
1. Read the template file line by line
2. Scan each line for `{{...}}` placeholders
3. Apply aliases (longest prefix first) to normalize syntax
4. Route to the appropriate expander (exec, data, table, link, var, script)
5. Replace placeholder with expanded content
6. Write expanded output to the output path

### Step 4: Report

Print summary:
- Number of templates expanded
- Number of placeholders resolved
- Any warnings (e.g., slow commands, large outputs)
- Total time elapsed

## Single Template Mode

To expand just one template:

```bash
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --template mkdocs/readme_template.md
```

This still runs introspectors (to ensure data is fresh) but only expands the specified template.

## Introspect Only

To refresh data catalogs without expanding templates:

```bash
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --introspect
```

## Notes

- All paths in config are relative to the working directory (project root)
- Data sources are lazy-loaded on first reference and cached for the run
- The tool exits 0 on success, 1 on any error
