# Workflow: GenerateTour

Interactive workflow to analyze a codebase and generate a `.claude/TOUR.md` tour definition. A guided interview with auto-populated defaults — the auto-analysis does 80% of the work; the user's input makes the tour tell the project's story.

---

## Overview

| Phase | Interactive? | What happens |
|-------|-------------|--------------|
| 1. Auto-Analyze | No | Gather raw signals from codebase (11 analysis passes) |
| 2. Confirm Identity | Yes | User confirms/edits project name, tagline, audience, **depth** |
| 3. Propose Stops | Yes | User confirms/edits discovered tour stops |
| 4. Propose Keystones | Yes | User confirms/edits keystone files for QuickOverview |
| 5. Deep-Read Analysis | No | Read key files, identify concepts/demos/exercises/warnings (depth ≥ Teaching) |
| 6. Draft Content | No | Generate teachingNarrative, concepts, exercises, glossary (depth ≥ Teaching) |
| 7. Compose & Write | No | Generate and write TOUR.md with quality self-check |

Phases 5-6 are **only executed** when the user selects "Teaching tour" or "Deep dive" depth in Phase 2. "Quick reference" depth skips directly from Phase 4 to Phase 7 (legacy v0 output).

---

## Phase 1: Auto-Analyze (no user input)

Gather raw signals silently. Run these in parallel where possible:

### 1a. Project Identity
- Read `README.md` / `README` if it exists
- Read `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, or equivalent manifest
- Extract: project name, language, framework, description

### 1b. Directory Structure
- Run `tree -L 2 -d` on the project root (exclude node_modules, .git, dist, build, vendor)
- Identify major subsystems from top-level directories

### 1c. Git Hotspots
- Run `git log --format='' --name-only --since='6 months ago' | sort | uniq -c | sort -rn | head -20`
- Identify the most-changed files — these are likely architecturally significant

### 1d. Project Memory
- Read `.claude/projects/.../memory/MEMORY.md` if it exists
- Extract: known patterns, pitfalls, architecture notes, key decisions

### 1e. Entry Points
- Look for: `main.*`, `index.*`, `App.*`, `cmd/`, `src/main`, `bin/`
- Identify the primary entry point and any secondary ones (CLI, TUI, API server)

### 1f. Metrics
- Count files by extension: `find . -name '*.go' -o -name '*.ts' -o -name '*.py' | wc -l` (etc.)
- Count directories, tests, configuration files

### 1g. README Deep-Read
- If README.md exists, extract:
  - Tutorial/getting-started content (→ potential `setupSteps`)
  - Architecture descriptions (→ `architectureSummary` drafts)
  - Known gotchas or warnings (→ `warnings[]` candidates)
  - Setup instructions (→ `prerequisites[]`)

### 1h. Test Pattern Scan
- Scan test files for exercisable behaviors:
  - `*_test.go`, `*.test.ts`, `*.spec.js`, `test_*.py`
  - Extract test function names → exercise candidates
  - Identify which packages/modules have good test coverage

### 1i. Config/Env Scan
- Look for: `.env.example`, `Makefile`, `docker-compose.yml`, `Dockerfile`
- Extract environment variable names (→ `setupSteps`, `prerequisites`)
- Identify build commands (→ `buildCmd`, `testCmd`)
- Identify config file patterns (→ potential tour stops)

### 1j. Error Pattern Scan
- Scan for sentinel errors, error types, validation patterns:
  - Go: `var Err... = errors.New(...)`, `type ...Error struct`
  - TS: `class ...Error extends Error`
  - Python: `class ...Error(Exception)`
- These inform `warnings[]` content

### 1k. CLI/API Discovery
- Look for command/route registration patterns:
  - Go/Cobra: `AddCommand()`, `&cobra.Command{}`
  - Express: `app.get()`, `router.post()`
  - Python/Click: `@click.command`, `@app.route`
- Identify safe read-only commands for `demoCmd` candidates
- Identify API endpoints for interaction stops

Store all gathered data internally for use in subsequent phases.

---

## Phase 2: Confirm Project Identity (interactive)

Present auto-detected metadata and ask user to confirm or edit.

**Voice** (via curl):
> "I've analyzed the codebase. Let me confirm a few things about the project."

### 2a. Project Name & Tagline

Present the auto-detected name and a drafted tagline:

> "I see this is **[detected name]** — a [language]/[framework] [type]. Here's my draft tagline:
> *'[drafted tagline from README/manifest]'*
> Does this capture it, or how would you describe the project in one sentence?"

Use `AskUserQuestion` with options:
- "Use this tagline" (pre-filled draft)
- "Edit tagline" (let user provide custom text via Other)

### 2b. Tour Audience

> "Who is this tour for?"

Use `AskUserQuestion` with options:
- **New contributor** — detailed explanations, assume no familiarity
- **Yourself in 6 months** — focus on architecture decisions and "why", skip basics
- **Stakeholder/demo** — focus on capabilities and what it does, less implementation detail

This affects narrative tone and v1 content depth.

### 2c. Tour Depth

> "How deep should this tour go?"

Use `AskUserQuestion` with options:
- **Quick reference** (3-5 stops) — Index-style, file paths + brief descriptions. Fast to generate. Produces v0 output.
- **Teaching tour** (5-10 stops) — Rich explanations, exercises, inline concepts. Produces v1 output. (Recommended)
- **Deep dive** (8-14 stops) — Full OPERATE-level: multi-paragraph narratives, exercises, warnings, ASCII mockups. Produces v1 output.

**Depth routing:**
| Depth | Phases executed | Output version |
|-------|----------------|----------------|
| Quick reference | 1 → 2 → 3 → 4 → 7 | v0 |
| Teaching tour | 1 → 2 → 3 → 4 → 5 → 6 → 7 | v1 |
| Deep dive | 1 → 2 → 3 → 4 → 5 → 6 → 7 | v1 |

---

## Phase 3: Propose & Refine Stops (interactive)

Based on analysis, propose 3-14 tour stops (count depends on depth selection) as a numbered list with rationale.

**Voice** (via curl):
> "Based on the codebase, I'd suggest [N] tour stops. Let me walk you through them."

Present the stops:

> "Based on the codebase, I'd suggest these [N] tour stops:
> 1. **[Stop Name]** — [one-line rationale] ([evidence: N commits, entry point, etc.])
> 2. **[Stop Name]** — [one-line rationale]
> ...
>
> Want to add, remove, reorder, or rename any?"

**Stop discovery heuristics:**
- Entry points → "Architecture Overview" stop
- Most-changed directories → dedicated stops
- Safety/auth/security directories → dedicated stop
- Test directories with significant coverage → "Testing" stop
- CLI/API/TUI directories → "Interface" stops
- Config/infrastructure → "Configuration" or "Deployment" stop
- From 1k: CLI command groups → interaction stops
- From 1h: Well-tested modules → exercise-rich stops

Use `AskUserQuestion` with options:
- "Looks good, use these stops"
- "I want to modify the list" (user provides edits via Other)

If the user modifies, re-present the updated list for final confirmation.

For each confirmed stop, optionally ask:
> "Any specific file or pattern you want highlighted in **[Stop Name]**?"
(User can skip by saying "no" or pressing enter.)

---

## Phase 4: Propose Keystones (interactive)

Propose 1-3 keystone files for the QuickOverview.

**Voice** (via curl):
> "For the quick overview, I'd highlight these keystone files."

> "For the quick overview, I'd highlight these keystone files:
> 1. `[path]` — [why this file represents the project's core]
> 2. `[path]` — [why this file is architecturally significant]
>
> Are these the right files to represent the project's core?"

**Keystone selection heuristics:**
- Files with the most imports/dependents
- Interface/contract files (interfaces.go, types.ts)
- Main entry points
- Configuration schemas
- Files the user mentioned in their project memory

Use `AskUserQuestion` with options:
- "Use these keystones"
- "Different files" (user provides alternatives via Other)

---

## Phase 5: Deep-Read Analysis (no user input)

**Only executed for Teaching tour and Deep dive depths.**

For each confirmed stop, perform targeted analysis:

### 5a. Read Key Files
- For each stop's `keyFiles`, read the most significant files (up to 200 lines each)
- Prioritize: interfaces, exported types, public API surfaces, entry points
- Skip: test files, generated code, vendor directories

### 5b. Identify Concept Candidates
- From types, interfaces, and struct definitions → `concepts[]` candidates
- From comments and docstrings → definition text
- From domain-specific terminology → glossary candidates
- Deduplicate across stops

### 5c. Identify Demo Candidates
- From Phase 1k CLI/API discovery → safe read-only commands
- From test fixtures → example inputs that demonstrate behavior
- Verify each candidate is genuinely read-only (no mutations)

### 5d. Identify Exercise Candidates
- From Phase 1h test patterns → exercisable behaviors
- From CLI commands → step-by-step activities
- From configuration → setup/verify exercises
- Rate difficulty: beginner (read/observe), intermediate (run/modify), advanced (extend/build)

### 5e. Identify Warning Candidates
- From Phase 1j error patterns → potential gotchas
- From safety/auth code → critical warnings
- From environment variables → configuration pitfalls
- From README gotchas → known issues

Store all candidates organized by stop for Phase 6.

---

## Phase 6: Draft Content (no user input)

**Only executed for Teaching tour and Deep dive depths.**

For each stop, generate rich content using Phase 5 candidates:

### 6a. Teaching Narratives
- Write `teachingNarrative` in second person ("you"), conversational tone
- 3-5 paragraphs for Teaching tour, 5-8 paragraphs for Deep dive
- Define terms inline on first use
- Reference specific code patterns discovered in Phase 5

### 6b. Concepts
- Select 2-4 concept definitions per stop from Phase 5b candidates
- Each must have both `term` and `definition`
- Avoid duplicating concepts across stops (use the first occurrence)

### 6c. Exercises
- Generate 1-2 exercises per interaction/observation stop
- Each exercise: title, 3-6 steps, difficulty rating
- Include `verifyCmd` and `expectedResult` where possible
- Teaching tour: beginner difficulty preferred
- Deep dive: mix of beginner and intermediate

### 6d. Expected Output
- For every stop with a `demoCmd`, draft `expectedOutput`
- Use realistic but representative output (not actual live data)
- Format as the user would see it (JSON for CLI, text for shell commands)

### 6e. Tips and Warnings
- Select 1-3 tips per stop from contextual insights
- Select warnings from Phase 5e candidates (only for stops with safety implications)
- Tips are helpful hints; warnings are things that can go wrong

### 6f. ASCII Mockups
- Generate for UI stops (TUI, web interfaces) and architecture overview stops
- Use box-drawing characters for clean rendering
- Keep to 40-80 columns wide for terminal compatibility

### 6g. Glossary Assembly
- Collect all `concepts[]` entries across all stops
- Deduplicate by term (keep the most complete definition)
- Add any project-wide terms not covered by individual stops
- Sort alphabetically
- Place in `overview.glossary`

### Audience Adaptation

Content varies by `project.audience`:

| Field | new-contributor | returning-dev | stakeholder |
|-------|----------------|---------------|-------------|
| `teachingNarrative` | Full prose, define all terms, explain patterns | Concise, skip basics, focus on "why" | Capability-focused, business value |
| `concepts` | All terms defined | Project-specific only | Business terms only |
| `exercises` | Beginner difficulty | Intermediate difficulty | None (omit) |
| `tips` | Setup and getting-started focused | Advanced workflow tips | Usage/demo tips |
| `warnings` | All safety warnings | Only non-obvious warnings | None |

---

## Phase 7: Compose & Write

Generate the full TOUR.md incorporating all user input and (for v1) all drafted content.

### 7a. Quality Self-Check

Before writing, verify:

1. **Every `demoCmd` stop has `expectedOutput`?** (v1 only) — If missing, draft one from types/test assertions.
2. **Every `concepts[]` entry has both fields?** — Remove any with missing `term` or `definition`.
3. **Every `teachingNarrative` ≥ 3 sentences?** (v1 only) — Expand any that are too brief.
4. **All file paths verified on disk?** — Use Glob to confirm every `keyFiles` entry and `showCode.path` exists. Remove or flag any missing paths.
5. **All `connectsTo` references valid?** — Every referenced stop name must match an actual `stops[].name`.
6. **Stop names unique?** — No duplicates in the `stops[]` array.
7. **`demoCmd` commands are safe?** — No write operations, no mutations, no side effects.

### 7b. Compose Content

For v0 (Quick reference):
- Generate basic `narrative`, `whyItMatters`, `keyFiles`, `showCode`, `demoCmd`, `connectsTo`
- Generate `byTheNumbers`, `architectureSummary`
- Optionally generate `tourMap` ASCII art if 5+ stops

For v1 (Teaching tour / Deep dive):
- Include all v0 fields plus Phase 6 content
- Set `version: "1"` in project metadata
- Set `audience` from Phase 2b selection
- Set `estimatedMinutes` (estimate: 3-5 min per stop)
- Include `prerequisites` from Phase 1i
- Include `glossary` from Phase 6g
- Include all stop-level v1 fields from Phase 6

For keystones, generate:
- `narrative` — voice script for QuickOverview
- `highlights` — 2-3 bullet points

Generate `tourMap` ASCII art if 5+ stops.

### 7c. Write File

Write the composed TOUR.md to `<project-root>/.claude/TOUR.md`. Create the `.claude/` directory if it doesn't exist.

### 7d. Present Summary

**Voice** (via curl):
> "Tour definition generated with [N] stops. Say 'give me a tour' to try it."

Present:
> **Tour generated:** `.claude/TOUR.md`
> - **Version:** [v0 Quick Reference | v1 Teaching Tour | v1 Deep Dive]
> - **[N] stops** covering [list of stop names]
> - **[N] keystone files** for quick overview
> - **[N] exercises** across [N] stops (v1 only)
> - **[N] glossary terms** (v1 only)
> - **Estimated tour duration:** ~[estimatedMinutes] minutes (guided) / ~5 minutes (quick overview)
>
> Say **"give me a tour"** to try the guided tour, or **"quick overview"** for the elevator pitch.

---

## Upgrade Mode

When triggered by "upgrade tour" or "enrich tour" and a TOUR.md already exists:

1. Read existing TOUR.md
2. Skip Phase 1a-1f (reuse existing project metadata and stops)
3. Run Phase 1g-1k (new analysis passes)
4. Skip Phase 2a (keep existing name/tagline)
5. Present Phase 2b-2c (confirm audience and depth)
6. Skip Phase 3-4 (keep existing stops and keystones)
7. Run Phase 5-6 (generate rich content for existing stops)
8. Run Phase 7 (compose with quality check, preserving existing structure)

This upgrades a v0 tour to v1 without losing any existing content.

---

## Error Handling

- **No README or manifest found:** Ask the user to describe the project in 1-2 sentences. Use their description as the tagline and basis for analysis.
- **Very small project (<10 files):** Generate a minimal 3-stop tour (Quick reference). Note that a quick overview may be sufficient.
- **Very large project (>500 files):** Cap at 7 stops for Teaching, 14 for Deep dive. Focus on the most architecturally significant subsystems. Mention that the user can regenerate with different focus areas.
- **User cancels mid-workflow:** Save nothing. Inform the user they can restart with "generate tour".
- **Existing TOUR.md found:** Ask whether to overwrite, upgrade (add v1 fields), or cancel.
