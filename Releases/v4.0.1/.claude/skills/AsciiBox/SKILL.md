---
name: AsciiBox
description: Generate and validate ASCII box-drawn UI mockups with consistent alignment. USE WHEN user says "draw a box", "ASCII art", "box alignment", "validate boxes", "fix jagged borders", "wireframe", or when generating TUI mockups for documentation.
---

# AsciiBox — ASCII Box Drawing & Validation

Generates and validates ASCII box-drawn UI mockups with perfectly aligned borders. Provides the authoritative character reference, alignment rules, and nesting spec for all box-drawn content across PAI skills.

**Language-agnostic** — works with any documentation, any project, any platform that needs box-drawn mockups. Does NOT compose with `frontend-design` (web-only).

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/AsciiBox/`

If this directory exists, load and apply:
- `PREFERENCES.md` - User preferences and configuration

These define user-specific preferences. If the directory does not exist, proceed with skill defaults.

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the AsciiBox skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **AsciiBox** skill...
   ```

**Full documentation:** `~/.claude/skills/CORE/SYSTEM/THENOTIFICATIONSYSTEM.md`

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **GenerateBox** | "draw a box", "generate ASCII box", "wireframe this" | `Workflows/GenerateBox.md` |
| **ValidateBoxes** | "validate boxes", "fix jagged borders", "check alignment" | `Workflows/ValidateBoxes.md` |

## Quick Reference

### Character Sets

| Style | Characters | Use Case |
|-------|-----------|----------|
| **Light** | `┌─┐│└┘├┤┬┴┼` | Standard TUI mockups |
| **Double** | `╔═╗║╚╝╠╣╦╩╬` | Emphasis, outer frames |
| **Rounded** | `╭─╮│╰╯` | Soft UI, friendly aesthetic |

### Standard Widths

| Name | Total | Content | Use Case |
|------|-------|---------|----------|
| **Narrow** | 40 | 34 | Side panels, compact views |
| **Standard** | 55 | 49 | Default for most mockups |
| **Full** | 70 | 64 | Wide layouts, dashboards |

### Tool Usage

```bash
# Generate a box from content
echo "FORM\n1/5 name\n\n> _" | bun ~/.claude/tools/AsciiBox.ts generate --style light --width 55 --title "FORM"

# Validate boxes in a file or directory
bun ~/.claude/tools/AsciiBox.ts validate docs/walkthroughs/
bun ~/.claude/tools/AsciiBox.ts validate path/to/file.md
```

---

## Key Resources

| File | Purpose |
|------|---------|
| `CharacterReference.md` | Authoritative spec: character sets, UI symbols, alignment rules |
| `NestingRules.md` | Nested box composition rules and depth limits |
| `Workflows/GenerateBox.md` | Box generation workflow using the CLI tool |
| `Workflows/ValidateBoxes.md` | Box validation workflow for files and directories |

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **WorkflowDoc** | Consumer. Generates walkthrough docs containing ASCII box mockups. References AsciiBox alignment rules. |
| **DocGen** | Complementary. DocGen templates may include ASCII mockups that follow AsciiBox alignment rules. |
| **frontend-design** | Unrelated. Web-only skill for HTML/CSS/JS interfaces. |

## Examples

**Example 1: Generate a TUI wireframe mockup**
```
User: "Draw a box wireframe for a data entry form with name, email, and a submit prompt"
-> Invokes GenerateBox workflow
-> Gathers content lines, selects light style at standard width (55), runs AsciiBox.ts generate
-> Returns a perfectly aligned ASCII box with labeled sections and consistent borders
```

**Example 2: Fix jagged borders in walkthrough docs**
```
User: "Validate the boxes in docs/walkthroughs/ — some borders look off"
-> Invokes ValidateBoxes workflow
-> Runs: bun ~/.claude/tools/AsciiBox.ts validate docs/walkthroughs/
-> Reports each misaligned line with file, line number, expected vs actual width, and the offending character
```

**Example 3: Generate a nested box layout**
```
User: "Wireframe a dashboard with an outer frame and an inner status panel"
-> Invokes GenerateBox workflow twice (inner box first at reduced width, then outer box)
-> Applies NestingRules.md depth limits and width constraints
-> Returns a two-level nested ASCII layout with consistent double/light border styles
```
