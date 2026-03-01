# DocGen Config Schema

Config file: `<project>/.claude/skill-data/DocGen.json`

## Full Schema

```json
{
  "introspectors": [
    {
      "name": "string — identifier for this introspector",
      "run": "string — shell command to execute",
      "output": "string — file path to write stdout to"
    }
  ],
  "data": {
    "sourceName": "string — path to JSON or YAML data file"
  },
  "vars": {
    "varName": {
      "value": "string — literal value (mutually exclusive with exec/builtin)",
      "exec": "string — command to run, stdout = value (mutually exclusive)",
      "builtin": "string — built-in: 'date' (UTC YYYY-MM-DD) (mutually exclusive)"
    }
  },
  "templates": [
    {
      "input": "string — path to template file",
      "output": "string — path to write expanded output"
    }
  ],
  "aliases": {
    "prefix": "string — maps to built-in placeholder syntax"
  },
  "exec_options": {
    "indent": "number — spaces to indent exec output (default: 4)",
    "strip_sections": ["string — section headers to remove from exec output"]
  }
}
```

## Field Details

### introspectors

Run before template expansion. Execute in order. Each writes stdout to `output` path.

```json
{
  "introspectors": [
    { "name": "commands", "run": "bin/mycli tree --json", "output": "docs/command-tree.json" },
    { "name": "keybindings", "run": "go run ./mkdocs/export-keys", "output": "docs/keybindings.json" }
  ]
}
```

### data

Named data sources. Paths relative to project root. JSON and YAML supported. Loaded lazily on first reference.

```json
{
  "data": {
    "commands": "docs/command-tree.json",
    "manifest": "docs/tier-and-track-manifest.yaml",
    "package": "package.json"
  }
}
```

### vars

Named variables for `{{var: name}}` placeholders. Three types, plus bare-string shorthand:

| Type | Field | Description |
|------|-------|-------------|
| Literal | `value` | Static string |
| Command | `exec` | Run command, stdout trimmed = value |
| Built-in | `builtin` | `date` → UTC YYYY-MM-DD |
| **Shorthand** | bare string | Auto-coerced to `{ "value": "..." }` |

```json
{
  "vars": {
    "project": "MyApp",
    "version": { "exec": "bin/mycli version" },
    "date": { "builtin": "date" }
  }
}
```

### templates

Template → output mapping. Paths relative to project root.

```json
{
  "templates": [
    { "input": "mkdocs/readme_template.md", "output": "README.md" },
    { "input": "docs/templates/api.md", "output": "docs/API.md" }
  ]
}
```

### aliases

Map legacy/custom placeholder prefixes to built-in syntax. The alias key is matched as a prefix of the placeholder inner text. The matched prefix is replaced with the alias value.

```json
{
  "aliases": {
    "mycli ": "exec: bin/mycli ",
    "key:": "data: keybindings.",
    "keys:table:": "table: keybindings.",
    ".Version": "var: version",
    ".Date": "var: date"
  }
}
```

**Example:** `{{mycli status -h}}` → alias replaces `mycli ` with `exec: bin/mycli ` → becomes `{{exec: bin/mycli status -h}}`.

Aliases are checked longest-prefix-first to avoid ambiguity.

### exec_options

Global options for `{{exec: ...}}` placeholders.

| Field | Default | Description |
|-------|---------|-------------|
| `indent` | `4` | Number of spaces to prepend to each output line |
| `strip_sections` | `[]` | Section headers to remove (e.g., `["Global Flags:"]`) |

## Language Examples

### Go (Cobra CLI)

```json
{
  "introspectors": [
    { "name": "commands", "run": "go build -o bin/app ./cmd/cli && bin/app tree --json", "output": "docs/commands.json" }
  ],
  "data": { "commands": "docs/commands.json" },
  "vars": { "version": { "exec": "bin/app version" }, "date": { "builtin": "date" } },
  "templates": [
    { "input": "docs/templates/README.md", "output": "README.md" }
  ],
  "exec_options": { "indent": 4, "strip_sections": ["Global Flags:"] }
}
```

### Python (Click CLI)

```json
{
  "introspectors": [
    { "name": "commands", "run": "python -m myapp.cli --help-json", "output": "docs/commands.json" }
  ],
  "data": { "commands": "docs/commands.json" },
  "vars": { "version": { "exec": "python -m myapp --version" }, "date": { "builtin": "date" } },
  "templates": [
    { "input": "docs/templates/usage.md", "output": "docs/USAGE.md" }
  ]
}
```

### TypeScript (npm package)

```json
{
  "data": { "package": "package.json", "tsconfig": "tsconfig.json" },
  "vars": {
    "version": { "exec": "node -p \"require('./package.json').version\"" },
    "date": { "builtin": "date" }
  },
  "templates": [
    { "input": "docs/templates/README.md", "output": "README.md" }
  ]
}
```

### Rust (clap CLI)

```json
{
  "introspectors": [
    { "name": "commands", "run": "cargo build --release && target/release/myapp help-json", "output": "docs/commands.json" }
  ],
  "data": { "commands": "docs/commands.json", "cargo": "Cargo.toml" },
  "vars": { "version": { "exec": "target/release/myapp --version" }, "date": { "builtin": "date" } },
  "templates": [
    { "input": "docs/templates/README.md", "output": "README.md" }
  ]
}
```
