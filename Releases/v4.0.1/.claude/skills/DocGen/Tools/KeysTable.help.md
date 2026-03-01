# KeysTable

Render a markdown table of keybindings for a given context, with optional category grouping.

## Usage

```bash
bun ~/.claude/skills/DocGen/Tools/KeysTable.ts <context>[:flat] [--data path] [--categories sys,nav,action]
```

## Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `context` | Yes | Map name from keybindings JSON (e.g. `global`, `chart`) |
| `:flat` | No | Append to context to suppress category grouping |
| `--data` | No | Path to keybindings JSON file (default: `docs/keybindings.json`) |
| `--categories` | No | Comma-separated category order. Auto-discovers from data if omitted |

## Output

Markdown table with `| Key | Action |` columns. When grouped, categories appear as bold header rows.

## Examples

```bash
# Flat table (no category headers)
bun KeysTable.ts global:flat --data docs/keybindings.json

# Grouped with auto-discovered categories
bun KeysTable.ts chart --data docs/keybindings.json

# Grouped with explicit category order
bun KeysTable.ts chart --data docs/keybindings.json --categories system,navigation,overlay,indicator,display,analysis,action
```

## Data Format

See `KeybindingsSchema.md` for the required JSON structure.
