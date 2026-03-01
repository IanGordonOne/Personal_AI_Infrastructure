# DocExpand

Universal template expander for documentation pipelines. Reads a DocGen.json config, runs introspectors, and expands `{{placeholder}}` syntax in template files.

## Usage

```bash
# Generate all docs
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json

# Validate only (no output files written)
bun DocExpand.ts --config .claude/skill-data/DocGen.json --validate

# Single template
bun DocExpand.ts --config .claude/skill-data/DocGen.json --template mkdocs/readme_template.md

# Run introspectors only (refresh data catalogs)
bun DocExpand.ts --config .claude/skill-data/DocGen.json --introspect

# List all templates and their placeholder counts
bun DocExpand.ts --config .claude/skill-data/DocGen.json --list
```

## Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `--config` | Yes | Path to DocGen.json config file |
| `--validate` | No | Dry-run mode: expand but don't write output files |
| `--template` | No | Expand only this specific template |
| `--introspect` | No | Run introspectors only, skip template expansion |
| `--list` | No | List all templates with placeholder counts |

## Placeholder Types

| Syntax | Purpose |
|--------|---------|
| `{{exec: command args}}` | Run shell command, indent output |
| `{{data: source.path.to.value}}` | Dot-path lookup in JSON/YAML data |
| `{{table: source.path \| col1=field1, col2=field2}}` | Markdown table from data array |
| `{{link: path/to/file.md}}` | File existence check, output link or comment |
| `{{var: name}}` | Named variable substitution |
| `{{script: path args}}` | External script, capture stdout |

## Error Format

All errors are emitted as HTML comments inline: `<!-- ERROR: description -->`. This preserves valid markdown while making failures visible.

## Config

See `ConfigSchema.md` for the full DocGen.json schema.

## See Also

- `PlaceholderReference.md` — detailed syntax for each placeholder type
- `ConfigSchema.md` — config file schema and language examples
