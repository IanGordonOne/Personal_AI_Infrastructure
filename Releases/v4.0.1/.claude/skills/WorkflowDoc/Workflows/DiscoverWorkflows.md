# DiscoverWorkflows

List all available workflows that can be documented, with status and complexity info.

---

## Process

### Step 1: Load Registry

Read `<project>/.claude/skill-data/WorkflowRegistry.md`.

### Step 2: Check Existing Docs and YAML

Scan both locations for existing walkthrough artifacts:

1. **YAML source:** `.claude/walkthroughs/*.yaml` — the structured source of truth
2. **Rendered markdown:** `docs/walkthroughs/*.md` — the human-readable output

Match filenames to registry entries using the kebab-case naming convention from `OutputFormat.md`.

**Status detection:**

| YAML | Markdown | Status |
|------|----------|--------|
| Exists | Exists | Fully documented (YAML + rendered) |
| Exists | Missing | YAML extracted, needs rendering |
| Missing | Exists | Legacy markdown, needs YAML extraction |
| Missing | Missing | Not documented |

Also check for a tour definition at `<project-root>/.claude/TOUR.md`. If it exists, parse the stop names and note which workflows have corresponding tour stops. This helps users see the full documentation landscape — both "how do I do this?" (walkthroughs) and "what can this do?" (tours).

### Step 3: Categorize and Present

Present workflows grouped by category with status indicators. The Status column reflects the YAML pipeline state:

```markdown
## Available Workflows

### TUI Tabs
| Workflow | Steps | Difficulty | YAML | Markdown | Status |
|----------|-------|------------|------|----------|--------|
| Dashboard | flat | Basic | — | — | Not documented |
| Settings | flat | Basic | — | — | Not documented |
| Setup Wizard | 11 | Advanced | ✓ | ✓ | Complete |
| Data View | modal (24 keys) | Advanced | ✓ | ✓ | Complete |

### TUI Overlays
| Workflow | Steps | Difficulty | YAML | Markdown | Status |
|----------|-------|------------|------|----------|--------|
| Settings Panel | 6 | Intermediate | ✓ | ✓ | Complete |
| Help Overlay | flat | Basic | — | — | Not documented |

### Standalone
| Workflow | Views | Difficulty | YAML | Markdown | Status |
|----------|-------|------------|------|----------|--------|
| Import Tool | 4 | Intermediate | — | — | Not documented |

### Global Navigation
| Workflow | Keys | Difficulty | YAML | Markdown | Status |
|----------|------|------------|------|----------|--------|
| Tab Switching | 2 | Basic | — | — | Not documented |
| Overlay Activation | 4 | Basic | — | — | Not documented |
| System Controls | 3 | Basic | — | — | Not documented |
```

### Step 4: Cross-Reference with Tours

If `.claude/TOUR.md` exists, show a cross-reference table mapping tour stops to walkthroughs:

```markdown
### Tour ↔ Walkthrough Cross-Reference

| Tour Stop | Walkthrough | Status |
|-----------|-------------|--------|
| Data Visualization (Stop 4) | data-view.md | Both exist |
| Setup & Configuration (Stop 7) | setup-wizard.md | Both exist |
| TUI Live Walkthrough (Stop 10) | settings-panel.md | Both exist |
| Architecture Overview (Stop 2) | — | Tour only |
| Plugin System (Stop 8) | — | Tour only |

> **TourGuide** provides narrative "what can this do?" context. **WorkflowDoc** provides "how do I do this?" step-by-step guides. Both cross-reference each other.
```

### Step 5: Suggest Starting Points

Recommend the best workflows to document first based on:
1. **Highest value** — Most commonly used (settings panel, data view)
2. **Best reference** — Cleanest state machine (settings panel — 6 steps, well-structured)
3. **Most complex** — Would benefit most from documentation (setup wizard, data view)
4. **Tour coverage gaps** — Workflows with tour stops but no walkthrough yet

Output:
```
Suggested starting order:
1. Settings Panel — cleanest state machine, best reference implementation
2. Setup Wizard — most complex, highest documentation value
3. Data View — densest keybinding surface
4. Global Navigation — foundation for all other workflows
```
