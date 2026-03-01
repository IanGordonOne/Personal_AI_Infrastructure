# Validate — Check Template Placeholders

Dry-run all templates without writing output. Report broken placeholders.

---

## Process (3 Steps)

### Step 1: Run Validation

```bash
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --validate
```

### Step 2: Review Errors

The tool runs the same pipeline as Generate but in validate mode:

| Placeholder Type | Validation Check |
|-----------------|-----------------|
| `exec:` | Command exists on PATH (not executed) |
| `data:` | Source file exists, dot-path resolves to a value |
| `table:` | Source file exists, path resolves to array/object |
| `link:` | Target file exists |
| `var:` | Variable defined in config |
| `script:` | Script file exists and is readable |

Errors are reported as:
```
template.md:42: {{data: manifest.tiers.99.name}} → ERROR: path not found
template.md:87: {{exec: bin/missing-tool -h}} → ERROR: command not found
```

### Step 3: Fix and Re-validate

For each error:
1. Check if the data source is stale (re-run introspectors)
2. Check if the placeholder references a renamed/moved resource
3. Check if an alias is missing or incorrect
4. Fix the root cause, then re-validate

## Exit Codes

- **0**: All placeholders valid
- **1**: One or more validation errors

## Notes

- Validate mode runs introspectors first (data must be fresh to validate)
- Commands in `exec:` placeholders are NOT executed — only PATH-checked
- This is safe to run in CI as a pre-merge check
