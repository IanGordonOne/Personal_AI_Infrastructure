# Keybindings Schema

Universal `keybindings.json` format for documenting keyboard shortcuts from any TUI/GUI framework.

## Types

### KeybindFile (root)

```json
{
  "app": "string — application name",
  "maps": "KeybindMap[] — keybinding contexts"
}
```

### KeybindMap

```json
{
  "name": "string — context name (e.g. 'global', 'chart', 'editor')",
  "bindings": "KeybindEntry[] — bindings in this context"
}
```

### KeybindEntry

```json
{
  "keys": "string[] — raw key sequences (e.g. ['ctrl+c'])",
  "help": "string — human-readable description",
  "help_key": "string — display key label (e.g. 'ctrl+c', 'F')",
  "context": "string — context name (matches parent map)",
  "category": "string — grouping category (e.g. 'system', 'navigation', 'action')",
  "read_only": "boolean — true if binding only reads state (no mutations)"
}
```

## Minimal Example

```json
{
  "app": "myapp",
  "maps": [
    {
      "name": "global",
      "bindings": [
        {
          "keys": ["ctrl+c"],
          "help": "Quit",
          "help_key": "ctrl+c",
          "context": "global",
          "category": "system",
          "read_only": false
        },
        {
          "keys": ["j"],
          "help": "Move down",
          "help_key": "j",
          "context": "global",
          "category": "navigation",
          "read_only": true
        }
      ]
    }
  ]
}
```

## Framework Extraction Notes

| Framework | Where bindings live | Extraction approach |
|-----------|-------------------|---------------------|
| **BubbleTea** (Go) | `Update()` switch on `tea.KeyMsg` | Typed struct with JSON tags, `go run ./export-keys` |
| **Ink** (React) | `useInput()` callbacks | Parse source AST or maintain a keybindings map, `bun extract-keys.ts` |
| **Textual** (Python) | `BINDINGS` class variable | `python -c "from app import App; import json; print(json.dumps(App.BINDINGS))"` |
| **Ratatui** (Rust) | `KeyCode` match arms | Typed struct with `serde`, `cargo run --bin export-keys` |
| **SwiftUI** | `.keyboardShortcut()` modifiers | Manual maintenance or Swift script extraction |
