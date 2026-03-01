# CommandsTable

Render a markdown table of CLI commands from a command tree JSON file.

## Usage

```bash
bun ~/.claude/skills/DocGen/Tools/CommandsTable.ts table:top|table:full [--data path] [--root-cmd myapp]
```

## Arguments

| Arg | Required | Description |
|-----|----------|-------------|
| `table:top` or `table:full` | Yes | Mode — `top` shows top-level commands, `full` shows all leaf commands |
| `--data` | No | Path to command tree JSON file (default: `docs/command-tree.json`) |
| `--root-cmd` | No | Root command name for display (default: `tree.name` from JSON) |

## Output

### `table:top`
Two-column table: `| Command | Description |`. Lists direct children of root, skipping `completion` and `help`.

### `table:full`
Three-column table: `| Command | Key Flags | Description |`. Recursively collects all leaf commands (no children). Shows up to 5 key flags per command.

## Examples

```bash
# Top-level commands
bun CommandsTable.ts table:top --data docs/command-tree.json

# Full leaf commands with custom root name
bun CommandsTable.ts table:full --data docs/command-tree.json --root-cmd myapp
```

## Data Format

See `CommandsSchema.md` for the required JSON structure.
