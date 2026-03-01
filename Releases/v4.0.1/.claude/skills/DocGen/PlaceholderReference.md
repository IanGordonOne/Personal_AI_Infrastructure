# DocGen Placeholder Reference

Six built-in placeholder types. All use `{{type: content}}` syntax with a colon+space separator.

---

## `{{exec: command args}}`

Run a shell command, capture stdout, indent each line.

**Syntax:** `{{exec: <command> [args...]}}`

**Behavior:**
- Executes command via shell (`/bin/sh -c`)
- Each output line indented by `exec_options.indent` spaces (default 4)
- Sections listed in `exec_options.strip_sections` are removed
- Trailing newlines trimmed before indenting
- On error: `<!-- ERROR: exec: <command>: <error message> -->`

**Validate mode:** Checks command exists on PATH (does not execute). If data source contains a command tree, validates command path exists in tree.

**Examples:**
```
{{exec: bin/mycli status -h}}
{{exec: python manage.py help migrate}}
{{exec: cargo run -- --help}}
```

---

## `{{data: source.path.to.value}}`

Look up a value in a named JSON/YAML data source using dot-path notation.

**Syntax:** `{{data: <sourceName>.<dot.path>}}`

**Behavior:**
- First segment is the data source name (from config `data` section)
- Remaining segments walk the object tree
- Numeric segments index into arrays (0-based)
- String segments access object keys
- Returns the string value at the path
- For objects/arrays, returns JSON-stringified value
- On error: `<!-- ERROR: data: <path>: not found -->`

**Validate mode:** Checks source file exists and path resolves.

**Examples:**
```
{{data: manifest.tiers.1.name}}
{{data: package.version}}
{{data: commands.children.0.short}}
```

---

## `{{table: source.path | Header1=field1, Header2=field2}}`

Generate a markdown table from an array or object in a data source.

**Syntax:** `{{table: <sourceName>.<path> | <ColHeader>=<field>, ...}}`

**Column spec** (after `|`):
- `Header=field` — Column header and field to extract from each item
- `Header=key` — Special: when iterating objects, `key` returns the map key
- `Header=index` — Special: when iterating arrays, `index` returns the 0-based index

**Behavior:**
- Walks to the data path
- If the target is an object, iterates sorted keys (each value is an item)
- If the target is an array, iterates elements
- For each item, extracts fields specified in column spec
- Generates standard markdown table with header and separator rows
- On error: `<!-- ERROR: table: <path>: <reason> -->`

**Validate mode:** Checks source exists, path resolves to array/object.

**Examples:**
```
{{table: manifest.agents | #=key, Area=name, Scope=scope}}
{{table: commands.children | Command=name, Description=short}}
{{table: package.dependencies | Package=key, Version=key}}
```

---

## `{{link: path/to/file.md}}`

Check if a file exists. If yes, generate a markdown link. If no, generate an HTML comment.

**Syntax:** `{{link: <relative-path>}}`

**Behavior:**
- Checks if file exists relative to project root
- Exists: `[Title](path/to/file.md)` — title derived from filename (kebab-case → Title Case, extension stripped)
- Missing: `<!-- link not found: path/to/file.md -->`

**Validate mode:** Reports missing files as errors.

**Examples:**
```
{{link: docs/walkthroughs/trading.md}}
{{link: CHANGELOG.md}}
{{link: docs/API.md}}
```

---

## `{{var: name}}`

Substitute a named variable defined in config.

**Syntax:** `{{var: <varName>}}`

**Behavior:**
- Looks up variable in config `vars` section
- Three types:
  - `value`: Returns literal string
  - `exec`: Runs command, returns trimmed stdout
  - `builtin`: `date` → UTC date (YYYY-MM-DD)
- On error: `<!-- ERROR: var: <name>: not defined -->`

**Validate mode:** Checks variable is defined in config.

**Examples:**
```
{{var: version}}
{{var: date}}
{{var: project}}
```

---

## `{{script: path args}}`

Delegate to an external script, capture stdout.

**Syntax:** `{{script: <script-path> [args...]}}`

**Behavior:**
- Executes script via `bun` (if `.ts`/`.js`) or directly (if executable)
- Captures stdout, returns as-is (no indentation)
- Script receives args as command-line arguments
- On error: `<!-- ERROR: script: <path>: <error message> -->`

**Validate mode:** Checks script file exists and is readable.

**Examples:**
```
{{script: .claude/formatters/agent-detail.ts 3}}
{{script: scripts/generate-badge.sh release}}
{{script: tools/format-table.py data.json agents}}
```

---

## Aliases

Aliases map legacy/custom syntax to built-in types. Defined in config `aliases` section.

**How aliases work:**
1. Placeholder inner text is checked against alias keys (longest prefix first)
2. If a prefix matches, it's replaced with the alias value
3. The result is then processed as a standard built-in type

**Example config:**
```json
{
  "aliases": {
    "mycli ": "exec: bin/mycli ",
    ".Version": "var: version",
    ".Date": "var: date"
  }
}
```

**Expansion:**
- `{{mycli status -h}}` → `{{exec: bin/mycli status -h}}`
- `{{.Version}}` → `{{var: version}}`
- `{{.Date}}` → `{{var: date}}`
