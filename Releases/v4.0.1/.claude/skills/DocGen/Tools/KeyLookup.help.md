# KeyLookup

Look up a single keybinding by context and name, returning a formatted inline reference.

## Usage

```bash
bun ~/.claude/skills/DocGen/Tools/KeyLookup.ts <context.name> [--data path/to/keybindings.json]
```

## Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `context.name` | Yes | Dot-separated reference: `<map-name>.<help_key or help description>` |
| `--data` | No | Path to keybindings JSON file (default: `docs/keybindings.json`) |

## Output

- **Found:** `` `key` -- description ``
- **Not found:** `<!-- ERROR: key not found: ref -->`
- **Invalid ref:** `<!-- ERROR: invalid key ref: ref -->`

## Matching

1. Primary: exact match on `help_key` (case-insensitive, whitespace-normalized)
2. Fallback: match on `help` description (case-insensitive, whitespace-normalized)

## Examples

```bash
# Look up Fibonacci key in chart context
bun KeyLookup.ts chart.Fibonacci --data docs/keybindings.json
# Output: `F` -- Fibonacci retracement

# Look up quit in global context
bun KeyLookup.ts global.Quit --data docs/keybindings.json
# Output: `ctrl+c` -- Quit
```

## Data Format

See `KeybindingsSchema.md` for the required JSON structure.
