# Commands Schema

Universal `commands.json` format for documenting CLI command trees from any framework.

## Types

### CommandNode (root, recursive)

```json
{
  "name": "string — command name (e.g. 'myapp', 'status')",
  "use": "string — usage string including args (e.g. 'status [flags]')",
  "short": "string — one-line description",
  "long": "string? — detailed description (optional)",
  "flags": "CommandFlag[]? — flags for this command (optional)",
  "children": "CommandNode[]? — subcommands (optional, recursive)"
}
```

### CommandFlag

```json
{
  "name": "string — flag name without dashes (e.g. 'verbose')",
  "type": "string — type: 'string', 'bool', 'int', 'float', 'stringSlice'",
  "default": "string — default value as string (e.g. '', 'false', '0')",
  "usage": "string — help text for this flag"
}
```

## Minimal Example

```json
{
  "name": "myapp",
  "use": "myapp",
  "short": "My CLI application",
  "flags": [
    { "name": "verbose", "type": "bool", "default": "false", "usage": "Enable verbose output" }
  ],
  "children": [
    {
      "name": "status",
      "use": "status",
      "short": "Show current status"
    },
    {
      "name": "config",
      "use": "config",
      "short": "Manage configuration",
      "children": [
        {
          "name": "set",
          "use": "set [key] [value]",
          "short": "Set a config value",
          "flags": [
            { "name": "global", "type": "bool", "default": "false", "usage": "Set globally" }
          ]
        },
        {
          "name": "get",
          "use": "get [key]",
          "short": "Get a config value"
        }
      ]
    }
  ]
}
```

## Framework Extraction Notes

| Framework | Where commands live | Extraction approach |
|-----------|-------------------|---------------------|
| **Cobra** (Go) | `cobra.Command` structs | `tree --json` subcommand (recursive walk of `root.Commands()`) |
| **Click** (Python) | `@click.group()` / `@click.command()` | `python -m app.cli --help-json` or introspect `cli.commands` dict |
| **clap** (Rust) | `#[derive(Parser)]` structs | `cargo run -- help-json` or `clap_mangen` introspection |
| **Commander** (Node) | `.command()` / `.option()` chains | `node -e "const p = require('./cli'); console.log(JSON.stringify(p))"` |
| **yargs** (Node) | `.command()` builder | `node -e "const y = require('./cli'); console.log(JSON.stringify(y.getCommandInstance()))"` |

## Conventions

- The root node's `name` is the binary name (e.g. `hf`, `myapp`)
- `children` with name `completion` or `help` are typically excluded from docs
- `use` may contain argument placeholders: `[arg]` for optional, `<arg>` for required
- Formatters normalize `[brackets]` to `<angle>` for display consistency
