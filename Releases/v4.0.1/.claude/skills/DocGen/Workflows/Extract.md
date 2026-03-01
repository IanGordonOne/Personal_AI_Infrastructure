# Extract — Generate Language-Specific Extraction Adapters

Detect frameworks, locate definitions, and generate scripts that produce universal JSON data files conforming to `KeybindingsSchema.md` and `CommandsSchema.md`.

**Idempotency:** Safe to run multiple times. Existing extraction scripts are never overwritten. Existing introspector registrations in DocGen.json are preserved. Each step checks for prior work and skips or merges as needed.

---

## Process (5 Steps)

### Step 1: Detect Frameworks

Scan the project for TUI/CLI framework indicators:

| Category | Framework | Detection Signal |
|----------|-----------|-----------------|
| **TUI** | BubbleTea | `go.mod` contains `charmbracelet/bubbletea`, `tea.KeyMsg` in source |
| **TUI** | Ink | `package.json` contains `ink`, `useInput` in source |
| **TUI** | Textual | `pyproject.toml`/`requirements.txt` contains `textual`, `BINDINGS` in source |
| **TUI** | Ratatui | `Cargo.toml` contains `ratatui`, `KeyCode` match arms |
| **CLI** | Cobra | `go.mod` contains `spf13/cobra`, `cobra.Command` in source |
| **CLI** | Click | `pyproject.toml`/`requirements.txt` contains `click`, `@click.command` in source |
| **CLI** | clap | `Cargo.toml` contains `clap`, `#[derive(Parser)]` in source |
| **CLI** | Commander | `package.json` contains `commander`, `.command()` chains |
| **CLI** | yargs | `package.json` contains `yargs`, `.command()` builder |

Report detected frameworks to the user before proceeding.

### Step 2: Locate Keybinding Definitions

Search the source for keybinding registration patterns:

| Framework | Pattern | Typical Location |
|-----------|---------|-----------------|
| BubbleTea | `case tea.KeyMsg:` switch arms | `model.go`, `update.go`, `keys.go` |
| Ink | `useInput((input, key) => { ... })` | Component files |
| Textual | `BINDINGS = [Binding(...)]` | App class definition |
| Ratatui | `KeyCode::Char(...)` match arms | `event.rs`, `handler.rs` |

If keybindings are already in a typed struct/map (ideal), note the location. If scattered across handlers, flag this and consult `ExtractionPatterns.md` for framework-specific static analysis strategies — the default "import and marshal" approach won't work.

### Step 3: Generate Keybinding Extractor

**Idempotency guard:** Before generating, check if a keybinding extraction script already exists at the expected path. If it does, **skip generation** and report:
```
⏭ Skipping keybinding extractor — scripts/extract-keys.ts already exists
```
If the user explicitly requests regeneration, back up the existing file first (`*.bak`).

Create a script that outputs JSON conforming to `KeybindingsSchema.md`. Consult `ExtractionPatterns.md` for framework-specific strategies — some frameworks require static analysis instead of runtime introspection.

**Go (BubbleTea) — `scripts/extract-keys.go`:**
```go
// Import the keybinding struct, marshal to JSON, write to stdout
// Output: { "app": "myapp", "maps": [...] }
```

**TypeScript (Ink) — `scripts/extract-keys.ts`:**
```typescript
// If centralized map exists: import and transform
// If scattered useInput handlers: use static analysis (see ExtractionPatterns.md)
// Output: { "app": "myapp", "maps": [...] }
```

**Python (Textual) — `scripts/extract_keys.py`:**
```python
# Introspect BINDINGS class variable, transform to schema format
# Output: { "app": "myapp", "maps": [...] }
```

**Rust (Ratatui) — `src/bin/extract_keys.rs`:**
```rust
// Serialize keybinding structs via serde_json
// Output: { "app": "myapp", "maps": [...] }
```

The script must:
- Output valid JSON to stdout
- Include all fields: `keys`, `help`, `help_key`, `context`, `category`, `read_only`
- Group bindings into maps by context

### Step 4: Generate Command Extractor

**Idempotency guard:** Same as Step 3 — check for existing command extractor script before generating. Skip if it exists.

Create a script that outputs JSON conforming to `CommandsSchema.md`:

**Go (Cobra):**
- Add a `tree` subcommand with `--json` flag
- Recursively walk `root.Commands()` building `CommandNode` tree
- Output to stdout

**TypeScript (Commander/yargs):**
- Script that introspects the command tree object
- Walks children recursively
- Extracts flags/options

**TypeScript (Custom router):**
- If using a hand-rolled switch/case router instead of a framework, see `ExtractionPatterns.md` for static analysis strategies
- Parse case statements for commands, nested if/else for subcommands
- Enrich with descriptions from help text constants

**Python (Click):**
- Script that walks `group.commands` dict recursively
- Extracts params as flags

**Rust (clap):**
- Binary or script using `Command::get_subcommands()`
- Recursive traversal

The script must:
- Output valid JSON to stdout
- Include all fields: `name`, `use`, `short`, and optionally `flags`, `children`
- Skip internal commands (`completion`, `help`) or mark them for filtering

### Step 5: Register as Introspectors

**Idempotency guard:** Read the existing `DocGen.json` before modifying. Only add `introspectors[]` entries whose `name` doesn't already exist, and only add `data{}` keys that aren't already present. Report:
```
✅ Registered introspector: keybindings
⏭ Skipping introspector: commands (already registered)
✅ Added data source: keybindings → docs/keybindings.json
```

Add the new extraction scripts to `DocGen.json`:

```json
{
  "introspectors": [
    {
      "name": "keybindings",
      "run": "<language-appropriate command>",
      "output": "docs/keybindings.json"
    },
    {
      "name": "commands",
      "run": "<language-appropriate command>",
      "output": "docs/command-tree.json"
    }
  ],
  "data": {
    "keybindings": "docs/keybindings.json",
    "commands": "docs/command-tree.json"
  }
}
```

Run the introspectors once to verify output:

```bash
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json --introspect
```

Validate the JSON output matches the schema:
- Check `keybindings.json` has `app` and `maps[]` with `name` and `bindings[]`
- Check `command-tree.json` has `name`, `use`, `short`, and `children[]`

---

## Notes

- If keybindings are scattered (no central struct), consult `ExtractionPatterns.md` for static analysis strategies before recommending centralization — static extraction may be sufficient
- Extraction scripts should be idempotent and fast (< 5s)
- For hybrid projects (e.g., Go CLI + TypeScript TUI), generate separate extractors for each
- The universal formatter tools (`KeyLookup.ts`, `KeysTable.ts`, `CommandsTable.ts`) work with any JSON conforming to the schemas, regardless of which language produced it
