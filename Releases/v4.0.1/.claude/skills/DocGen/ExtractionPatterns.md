# Extraction Patterns — Framework-Specific Strategies

Per-framework extraction strategies for keybindings and commands. Referenced from `Workflows/Extract.md` Step 2 when bindings are scattered or the CLI uses a custom router.

Each section documents patterns discovered during real project applications.

---

## Keybinding Extraction

### BubbleTea (Go) — Runtime Introspection

**Structure:** Centralized `KeyMap` struct with `key.Binding` fields. Each binding has `.Help` metadata.

**Strategy:** Import the struct, marshal to JSON.

```go
// Direct import and marshal — the happy path
data, _ := json.Marshal(keyMap)
```

**Context mapping:** One model = one context (keybinding map).

*Source: a Go CLI project*

---

### Ink (TypeScript) — Static Analysis

**Structure:** Keybindings are embedded in `useCallback` closures passed to `useInput` hooks. They exist only at render time inside the React tree — **cannot be imported or introspected at runtime**.

**Strategy:** Read source files as text. Regex-match keybinding patterns.

**Detection patterns:**

| Pattern | Regex | Example |
|---------|-------|---------|
| Single char binding | `if\s*\(\s*input\s*===\s*['"](.+?)['"]` | `if (input === 'x')` |
| Special key binding | `if\s*\(\s*(key\.\w+)` | `if (key.escape)` |
| Step-scoped binding | `&&\s*s\.step\s*===\s*['"](.+?)['"]` | `if (input === 'n' && s.step === 'stalled')` |

**Help text extraction** (in priority order):

1. **Preceding comment** — look back 1-3 lines for `// [x] Description` or `// Description`
2. **Dispatch action** — look forward for `dispatch({ type: 'SOME_ACTION' })`, humanize the action name
3. **Handler name** — look forward for `handleSomething()`, strip `handle` prefix and humanize
4. **Fallback** — `key: <keyName>`

**Context mapping:**

- File path determines context: `tui/daily-review/App.tsx` → context `daily-review`
- Step scope creates sub-contexts: `s.step === 'stalled'` → `daily-review.stalled`
- Shared components: `tui/shared/components/TagPicker.tsx` → `shared.TagPicker`

**Deduplication:** Same key + same help + same context = duplicate. Remove within each context.

**Key normalization:**

| Raw | Display |
|-----|---------|
| `key.return` | `Enter` |
| `key.escape` | `Esc` |
| `key.tab` | `Tab` |
| `key.upArrow` | `↑` |
| `key.downArrow` | `↓` |

**Limitations:**
- Bindings without comments produce generic `key: x` help text
- Dynamic bindings (key computed at runtime) are invisible to static analysis
- `gg` chord patterns (ref-based timer) detected as two separate `g` bindings

*Example: an Ink-based TUI project yielded 462 bindings across 25 context maps from 52 source files*

---

### Textual (Python) — Class Introspection

**Structure:** `BINDINGS` class variable on App/Screen subclasses. Each entry is a `Binding(key, action, description)`.

**Strategy:** Import the class, read `BINDINGS` class variable.

```python
bindings = AppClass.BINDINGS  # List[Binding]
```

**Context mapping:** One Screen subclass = one context.

*Not yet applied — patterns are from framework documentation.*

---

### Ratatui (Rust) — Struct Serialization

**Structure:** `KeyCode::Char(...)` match arms in event handler functions. May be centralized in a config struct with serde support.

**Strategy:** If centralized struct exists, serialize via `serde_json`. If scattered in match arms, use static analysis similar to Ink pattern.

*Not yet applied — patterns are from framework documentation.*

---

## Command Extraction

### Cobra (Go) — Runtime Tree Walking

**Structure:** `cobra.Command` tree with `.Commands()` method for recursive traversal. Each command has `.Use`, `.Short`, `.Flags()`.

**Strategy:** Walk `root.Commands()` recursively, build `CommandNode` tree.

```go
for _, cmd := range root.Commands() {
    node := CommandNode{Name: cmd.Name(), Use: cmd.Use, Short: cmd.Short}
    // recurse into cmd.Commands()
}
```

*Source: a Go CLI project*

---

### Custom Router (TypeScript/bun) — Switch/Case Parsing

**Structure:** Hand-rolled `switch(args.command)` with nested `if (args.subcommand === ...)` chains. No framework introspection API.

**Strategy:** Static analysis of the router file.

**Command detection:**
```
Pattern: case\s+['"](\w+)['"]\s*:
Example: case 'task':
```

**Subcommand detection:**
```
Pattern: args\.subcommand\s*===\s*['"](\w[\w-]*?)['"]
Example: if (args.subcommand === 'list')
Scope: within each case block (between consecutive case statements)
```

**Description enrichment:** Parse the help text file for columnar descriptions:
```
Pattern: ^\s{2}(\S+)\s{2,}(.+)$
Example:   task              List, show, add, edit...
Scope: only within HELP_TEXT constant, not COMMAND_HELP sections
```

**Global flags:** Parse only the "Global Options:" section to avoid picking up per-command flags:
```
Pattern: ^\s{2}(-\w),?\s*(--[\w-]+)(?:\s+<(\w+)>)?\s{2,}(.+)$
Scope: between "Global Options:" header and next blank line/section
```

**Limitations:**
- Aliases (e.g., `case 'adv':` alongside `case 'advantage':`) appear as separate commands
- Commands without help text descriptions produce empty `short` fields
- Deeply nested routing (sub-sub-commands) requires recursive block scoping

*Example: a CLI project yielded 29 commands with subcommand trees*

---

### Commander (TypeScript) — Chain Introspection

**Structure:** `.command('name').description('...').option('--flag')` method chains. Command tree object is introspectable at runtime.

**Strategy:** Import the program object, walk `.commands` array recursively.

*Not yet applied — patterns are from framework documentation.*

---

### Click (Python) — Group Walking

**Structure:** `@click.group()` / `@click.command()` decorators. Groups have `.commands` dict.

**Strategy:** Import the group, walk `.commands` recursively.

*Not yet applied — patterns are from framework documentation.*

---

## Adding New Patterns

When applying the Extract workflow to a new project and discovering adaptation patterns:

1. Run the extraction, noting where the default templates don't fit
2. Document the detection patterns, regex, context mapping, and limitations
3. Add a new section to this file under the appropriate heading
4. Include the source project name and key metrics (binding count, file count)
5. Mark sections as "applied" vs "from documentation" to distinguish tested patterns
