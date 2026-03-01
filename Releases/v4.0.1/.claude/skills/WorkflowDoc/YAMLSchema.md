# YAML Walkthrough Schema — v1

The structured intermediate representation for walkthrough documents. Source code analysis produces YAML; markdown is a deterministic rendering of YAML.

```
Source Code → Structured YAML → Human Markdown
```

**Location:** `.claude/walkthroughs/*.yaml` (machine-local, gitignored, agent-consumable)
**Rendered to:** `docs/walkthroughs/*.md` (version-controlled, human-readable)

---

## Top-Level Structure

Every YAML file has a single root key `walkthrough` containing all metadata and content.

```yaml
walkthrough:
  # === Required metadata ===
  version: 1                     # Schema version (always 1 for now)
  id: "setup-wizard"             # kebab-case, matches filename
  title: "Setup Wizard"          # Human-readable title
  type: "linear"                 # "linear" | "modal"
  application: "TUI"             # Application name or binary
  platform: "TUI"                # TUI | Web | Desktop | Mobile | CLI
  location: "Overlay"            # Where in the app this workflow lives
  entry: "`t` from any tab"      # How to start the workflow
  difficulty: "Intermediate"     # Basic | Intermediate | Advanced
  prerequisites: "None"          # What must be true before starting
  description: "One-sentence summary of what this workflow does."
  sources:                       # Source files involved
    - "cmd/tui/wizard.go"
  generated_by: "WorkflowDoc"    # Generator identity
  last_updated: "2026-02-23"     # ISO date

  # === Type-specific content (exactly one) ===
  steps: [...]                   # Present when type: "linear"
  sections: [...]                # Present when type: "modal"

  # === Counts (required) ===
  step_count: 9                  # Number of steps (linear) or sections (modal)
  total_interactions: 16         # Total unique interactions across all steps/sections

  # === Footer tables (all optional, at least one recommended) ===
  all_keys: [...]                # Linear workflows: flat key reference
  all_keys_by_context: [...]     # Modal workflows: context-grouped key reference
  escape_paths: [...]            # How to go backward or exit
  conditional_behavior: [...]    # Steps that may be skipped
  async_operations: [...]        # Deferred/background computations
  related_workflows: [...]       # Links to other walkthroughs
  related_tours: [...]           # Links to tour stops
```

---

## Type Discriminator

| Type | Content Key | Use For |
|------|-------------|---------|
| `linear` | `steps` | Sequential wizards, trading panels, checkout flows |
| `modal` | `sections` | Charts, dashboards, editors with concurrent key surfaces |

---

## Linear Steps

Each step represents one screen/state in a sequential flow.

```yaml
steps:
  - id: 0                        # int or string ("2a", "2b") for sub-steps
    name: "Enter Name"            # Title-cased step name
    primary_trigger: "`s`"        # The key/action that activates this step
    description: "1-2 sentences describing what happens at this step."
    source:                       # Code location (structured for agent navigation)
      file: "cmd/tui/wizard.go"  # Primary source file
      lines: "70-90"             # Line range (string)
      handlers:                  # Function names that handle input
        - "handleNameStep"
      views:                     # Function names that render UI
        - "viewNameStep"
      refs:                      # Optional: multi-file references (use INSTEAD of single file/lines)
        - file: "cmd/tui/wizard.go"
          lines: "70-90"
          functions: ["handleNameStep"]
        - file: "cmd/tui/wizard.go"
          lines: "401-404"
          functions: ["viewNameStep"]
    mockup: |                    # Singular: one mockup (fenced code block content)
      ┌──────────────────────┐
      │  SETUP               │
      │  > _                 │
      └──────────────────────┘
    interactions:                # Available user interactions at this step
      - trigger: "(letters)"
        action: "Type symbol"
      - trigger: "`enter`"
        action: "Advance to Step 1"
```

### Optional Step Fields

```yaml
    # Multiple mockup variants (use INSTEAD of singular mockup)
    mockups:
      - label: "Limit order"
        content: |
          ┌──────────────────────┐
          │  Limit: $_           │
          └──────────────────────┘
      - label: "Stop Limit order"
        content: |
          ┌──────────────────────┐
          │  Limit: $_           │
          │  Stop:  $_           │
          └──────────────────────┘

    # Conditional — present only when step can be skipped
    conditional:
      note: "Skipped when order type is market"

    # Async — present only for steps with background operations
    async:
      note: "Calendar check with spinner and 5-second timeout"

    # Validation — input constraints
    validation: "enter ignored if empty"

    # Sub-workflow — embedded sub-mode (search, picker, etc.)
    sub_workflow:
      name: "Search Sub-Mode"
      description: "Brief description of the sub-workflow."  # Optional
      entry: "`/`"
      source:
        file: "cmd/tui/wizard.go"
        lines: "570-606"
        handlers: ["handleSearchMode"]
        views: ["renderSearchOverlay"]
      mockup: |
        ┌──────────────────────┐
        │  / AAPL_             │
        │  ▸ AAPL   Apple Inc. │
        └──────────────────────┘
      interactions:
        - trigger: "(letters)"
          action: "Type search query"
        - trigger: "`esc`"
          action: "Exit search, return to tree"

    # Notes — edge cases, tips, additional context
    # Notes can be plain strings OR structured objects:
    notes:
      - "Plain string note — rendered as a paragraph."
      - type: "table"                # Structured note: rendered as a markdown table
        title: "Timeframes"         # Optional heading above the table
        headers: ["Idx", "Name", "Bars"]
        rows:
          - ["0", "1m", "500"]
          - ["1", "5m", "500"]
      - type: "list"                 # Structured note: rendered as a numbered list
        title: "Mode Cycle"         # Optional heading
        items:
          - "Mode 0: Candlestick"
          - "Mode 1: Heatmap"
```

### Field Exclusivity

- `mockup` (singular) and `mockups` (plural) are **mutually exclusive**. Use `mockup` for steps with one visual state; use `mockups` for steps with variants (e.g., limit vs stop-limit, success vs error).
- `steps` and `sections` are **mutually exclusive** at the top level — determined by `type`.

---

## Modal Sections

Each section represents a functional area of a non-linear interface.

```yaml
sections:
  - id: 1                        # Sequential integer
    name: "Default State"         # Section name
    description: "1-2 sentences."
    source:                       # Same structure as step source
      file: "cmd/tui/chart_view.go"
      lines: "40-47"
      handlers: []
      views: ["viewEmpty"]
    mockup: |
      ┌───────────────────────┐
      │  no symbol selected   │
      └───────────────────────┘
    interactions:                 # Context column is optional
      - trigger: "`s`"
        action: "Open symbol picker"
        context: "Main chart"    # When present, renderer adds Context column

    # Optional: rich intro text rendered as-is markdown before source
    preamble: "When you first arrive at the Chart tab..."

    # Optional: grouped key surfaces for dense key areas
    key_groups:
      - group: "On-Chart Overlays"
        trigger: "`a`/`e`/`b`/`w`"  # Optional: keys that activate this group (rendered in heading)
        description: "Draw lines or bands directly on the candlestick chart."
        mockup: |
          ┌───────────────────────┐
          │  ●SMA ●EMA ●BB ○RSI  │
          └───────────────────────┘
        keys:
          - key: "`a`"
            indicator: "SMA"
            type: "On-chart"
            color: "Cyan"
            description: "Simple Moving Average"

    # Optional: notes
    notes:
      - "Sub-panels reduce main chart height"
```

### Key Group Table Columns

The `keys` array in `key_groups` supports flexible columns. The renderer builds a table from all keys present in the array:

- **Always present:** `key`, `description`
- **Optional (auto-detected):** `indicator`, `type`, `color`, `height`, `context`, `action`

---

## Footer Tables

All footer tables are top-level (flat YAML paths) for agent queryability.

### `all_keys` — Linear Workflows

```yaml
all_keys:
  - key: "`t`"
    step: "Global"
    action: "Open setup wizard"
  - key: "(letters)"
    step: "0: Symbol"
    action: "Type symbol characters"
```

### `all_keys_by_context` — Modal Workflows

```yaml
all_keys_by_context:
  - context: "Main Chart"
    keys:
      - key: "`s`"
        action: "Open symbol picker (tree browse)"
      - key: "`/`"
        action: "Open symbol picker (search)"
  - context: "Drawing Mode"
    keys:
      - key: "`up`"
        action: "Move cursor up"
```

### `escape_paths`

```yaml
escape_paths:
  - from: "Step 0 (Symbol)"
    key: "`esc`"
    goes_to: "Close panel"
  - from: "Step 1 (Side)"
    key: "`esc`"
    goes_to: "Step 0 (Symbol)"
```

### `conditional_behavior`

```yaml
conditional_behavior:
  - condition: "Order type = market"
    effect: "Step 4 (Price) skipped entirely"
  - condition: "Symbol pre-filled"
    effect: "Step 0 skipped, start at Step 1"
```

### `async_operations`

```yaml
async_operations:
  - trigger: "Step 4 → Step 5"
    computation: "fetchRiskParityWeights"
    result: "Correlation-aware ERC weights"
```

### `related_workflows`

```yaml
related_workflows:
  - title: "User Onboarding"
    path: "user-onboarding.md"
    note: "Onboard new users, then configure"
```

### `related_tours`

```yaml
related_tours:
  - name: "All Interfaces"
    tour_file: ".claude/TOUR.md"
    stop: 14
    note: "Live TUI walkthrough including wizard demo"
```

---

## Constraints

| Constraint | Rule |
|-----------|------|
| `id` uniqueness | Step/section `id` values must be unique within the file |
| `mockup` XOR `mockups` | Never both on the same step |
| `steps` XOR `sections` | Determined by `type` field |
| `source.file` | Must be a real path relative to project root. When `source.refs` is used, `file`+`lines` describe the primary location |
| `interactions` | At least one per step/section |
| `step_count` | Must match actual length of `steps` or `sections` |
| `total_interactions` | Must match sum of unique interactions |
| `version` | Must be `1` |
| Filename | Must match `id` field: `{id}.yaml` |

---

## Difficulty Tiers

| Tier | Criteria |
|------|----------|
| **Basic** | Linear flow, < 8 interactions, no conditional branches |
| **Intermediate** | Multi-step with choices, 8-15 interactions, some branches |
| **Advanced** | Complex state machine, 15+ interactions, sub-components, async ops |

---

## Example: Minimal Linear

```yaml
walkthrough:
  version: 1
  id: "simple-wizard"
  title: "Simple Wizard"
  type: "linear"
  application: "TUI"
  platform: "TUI"
  location: "Tab 1"
  entry: "`enter`"
  difficulty: "Basic"
  prerequisites: "None"
  description: "A two-step wizard."
  step_count: 2
  total_interactions: 4
  sources: ["cmd/tui/simple.go"]
  generated_by: "WorkflowDoc"
  last_updated: "2026-02-23"

  steps:
    - id: 0
      name: "Enter Name"
      primary_trigger: "`enter`"
      description: "Type a name."
      source:
        file: "cmd/tui/simple.go"
        lines: "10-20"
        handlers: ["handleName"]
        views: ["viewName"]
      mockup: |
        ┌──────────────┐
        │  Name: _     │
        └──────────────┘
      interactions:
        - trigger: "(letters)"
          action: "Type name"
        - trigger: "`enter`"
          action: "Confirm, advance to Step 1"

    - id: 1
      name: "Confirm"
      primary_trigger: "`enter`"
      description: "Review and confirm."
      source:
        file: "cmd/tui/simple.go"
        lines: "22-30"
        handlers: ["handleConfirm"]
        views: ["viewConfirm"]
      mockup: |
        ┌──────────────┐
        │  Save? y/n   │
        └──────────────┘
      interactions:
        - trigger: "`y`"
          action: "Save"
        - trigger: "`n`"
          action: "Cancel"

  all_keys:
    - key: "(letters)"
      step: "0: Name"
      action: "Type name"
    - key: "`enter`"
      step: "0-1"
      action: "Confirm / advance"
    - key: "`y`"
      step: "1: Confirm"
      action: "Save"
    - key: "`n`"
      step: "1: Confirm"
      action: "Cancel"

  escape_paths:
    - from: "Step 0 (Name)"
      key: "`esc`"
      goes_to: "Close wizard"

  related_workflows: []
  related_tours: []
```
