---
name: WorkflowDoc
description: Generate step-by-step walkthrough docs for any interactive UI workflow — TUI, web, desktop, mobile, CLI. USE WHEN documenting a workflow, creating a keybinding guide, walkthrough, explaining multi-step navigation, or listing available workflows to document.
---

# WorkflowDoc

Generates step-by-step walkthrough documents for interactive UI workflows in any language, framework, and platform. Reads source code to extract state machines, interaction handlers, and render/view functions, then produces markdown docs with visual mockups showing exactly what the user sees at each step.

**Platform-agnostic** — supports terminal UIs (BubbleTea, Textual, Ratatui, Ink), web apps (React, Vue, Svelte, Angular), desktop apps (Electron, Qt, SwiftUI), mobile (React Native, Flutter), and CLI wizards (Inquirer, Enquirer). The extraction step auto-detects the framework from source files and applies appropriate patterns.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/WorkflowDoc/`

If this directory exists, load and apply:
- `PREFERENCES.md` - User preferences and configuration

These define user-specific preferences. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the WorkflowDoc skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **WorkflowDoc** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SYSTEM/THENOTIFICATIONSYSTEM.md`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **GenerateWalkthrough** | "Generate walkthrough for [workflow]", "Document the settings wizard", "Create keybinding guide for wizard" | `Workflows/GenerateWalkthrough.md` |
| **RenderWalkthrough** | "Render the settings wizard walkthrough", "Re-render YAML to markdown", "Update markdown from YAML" | `Workflows/RenderWalkthrough.md` |
| **DiscoverWorkflows** | "List workflows", "What workflows can I document?", "Show available walkthroughs" | `Workflows/DiscoverWorkflows.md` |
| **UpdateWalkthrough** | "Update settings walkthrough", "Refresh walkthrough after code changes", "Re-generate wizard docs" | `Workflows/UpdateWalkthrough.md` |

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **TourGuide** | Complementary. TourGuide answers "what can this do?" with narrative codebase tours. WorkflowDoc answers "how do I do this?" with step-by-step interaction guides. Walkthroughs cross-reference tour stops and vice versa. |
| **AsciiBox** | Dependency. Defines character reference, alignment rules, and validation for ASCII box mockups. |

## Key Resources

| File | Purpose |
|------|---------|
| `WorkflowRegistry.md` | All documentable workflows with source file mappings. **Project-specific** — lives at `<project>/.claude/skill-data/WorkflowRegistry.md`. |
| `OutputFormat.md` | Template spec for generated walkthrough documents |
| `YAMLSchema.md` | Structured YAML schema for walkthrough data (v1) |

## Examples

**Example 1: Generate a walkthrough (TUI)**
```
User: "Generate a walkthrough for the settings wizard"
-> Invokes GenerateWalkthrough workflow
-> Reads WorkflowRegistry.md to find: cmd/tui/wizard.go
-> Extracts 6-step state machine from handleKey + view functions
-> Generates docs/walkthroughs/settings-wizard.md with ASCII mockups per step
-> Output: Complete walkthrough with keybinding tables and escape paths
```

**Example 2: Generate a walkthrough (Web)**
```
User: "Document the checkout flow"
-> Invokes GenerateWalkthrough workflow
-> Detects React + react-router from source
-> Extracts route guards, form handlers, onClick/onSubmit, useState transitions
-> Generates docs/walkthroughs/checkout-flow.md with HTML wireframe mockups
-> Output: Complete walkthrough with interaction tables and navigation paths
```

**Example 3: Discover available workflows**
```
User: "What workflows can I document?"
-> Invokes DiscoverWorkflows workflow
-> Reads WorkflowRegistry.md
-> Checks docs/walkthroughs/ for existing docs
-> Output: Categorized list with step counts, complexity, and doc status
```

**Example 4: Update after code changes**
```
User: "Update the wizard walkthrough"
-> Invokes UpdateWalkthrough workflow
-> Reads existing docs/walkthroughs/setup-wizard.md
-> Diffs against current cmd/tui/setup.go + setup_steps.go
-> Re-generates via GenerateWalkthrough, preserving <!-- manual --> sections
-> Output: Updated walkthrough with change summary
```
