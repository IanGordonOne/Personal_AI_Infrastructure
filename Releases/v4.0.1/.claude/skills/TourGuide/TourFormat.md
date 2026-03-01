# TOUR.md Format Specification

The `TOUR.md` file defines a guided tour for any project. It is read by the TourGuide skill at runtime.

## File Location

The tour definition lives at `<project-root>/.claude/TOUR.md`. This is the only supported location.

The file is **not tracked in version control** — `.claude/` is typically gitignored. This is intentional: TOUR.md contains machine-local content (absolute paths, tool-specific YAML) and is regenerable via `generate tour`. It's a local asset, not a source-of-truth artifact.

---

## Format

YAML front matter between `---` fences. Three required sections in the YAML: `project`, `overview`, `stops`. Two optional sections: `keystoneFiles`, `tourMap`.

---

## Schema

### Version Awareness

The `version` field in `project` signals which schema features are available:

| Version | Name | Description |
|---------|------|-------------|
| absent or `"0"` | **Legacy** | Original fields only. All tours created before the v1 schema. |
| `"1"` | **Teaching** | Full rich schema: teachingNarrative, concepts, exercises, glossary, etc. |

All v1 fields are **optional** — a v0 tour works unchanged with the v1 skill. Version detection is purely additive.

### Full Schema

```yaml
---
project:
  name: "Project Name"                    # REQUIRED — display name
  tagline: "One-sentence pitch"           # REQUIRED — elevator pitch
  language: "Go"                          # REQUIRED — primary language
  framework: "BubbleTea"                  # optional — primary framework
  rootDir: "/absolute/path/to/project"    # optional — absolute path (defaults to project root, inferred from .claude/ location)
  buildCmd: "go build ./..."              # optional — build command
  testCmd: "go test ./..."                # optional — test command
  version: "1"                            # optional — schema version ("0" or "1", absent = "0")
  audience: "new-contributor"             # optional — "new-contributor" | "returning-dev" | "stakeholder"
  estimatedMinutes: 60                    # optional — total tour duration estimate
  prerequisites:                          # optional — setup requirements
    - "Go 1.25+ installed"
    - "PostgreSQL running locally"
  prerequisiteTours:                      # optional — tour file paths for multi-tour projects
    - "docs/walkthroughs/OPERATE-1-OBSERVER.md"

overview:
  byTheNumbers:                           # REQUIRED — 3-6 metrics for QuickOverview
    - "220 Go files"
    - "15 signal strategies"
    - "7 portfolio algorithms"
  architectureSummary: |                  # REQUIRED — free-form markdown
    Brief description of the overall architecture,
    major subsystems, and design philosophy.
  glossary:                               # optional — displayed at tour end
    - term: "Adapter"
      definition: "Code that translates between the platform's generic interface and a specific data source's API."
    - term: "Pipeline"
      definition: "A configured sequence of extract, transform, and load steps."

keystoneFiles:                            # optional — 1-3 files for QuickOverview deep-read
  - path: "relative/to/rootDir.go"        # REQUIRED per entry — relative to rootDir
    label: "Short Label"                  # REQUIRED per entry — display name
    narrative: "Voice script (1-2 sentences)"  # REQUIRED per entry — spoken aloud
    highlights:                           # optional — bullet points to call out
      - "Composed interface pattern"
      - "Optional capabilities via type assertion"

stops:                                    # REQUIRED — 3-14 tour stops
  - name: "Stop Name"                     # REQUIRED — display name
    narrative: "Voice script"             # REQUIRED — spoken aloud at stop arrival (1-2 sentences for TTS)
    whyItMatters: "Why this matters"      # REQUIRED — architectural significance
    keyFiles:                             # REQUIRED — files/dirs to explore
      - "dir/"
      - "file.go"
    showCode:                             # optional — specific code to display
      - path: "file.go"                   # relative to rootDir
        lines: "1-40"                     # optional — line range
        highlight: "What to point out"    # optional — narration for this snippet
    demoCmd: "safe read-only command"     # optional — CLI demo (must be safe/read-only)
    demoDescription: "What this shows"    # optional — explains demo output
    connectsTo:                           # optional — names of related stops
      - "Other Stop Name"
    liveWalkthrough:                      # optional — for TUI/GUI interactive stops
      buildCmd: "go build -o binary ./cmd/tui"
      launchCmd: "./binary"
      preflightChecks:
        - "APCA_API_KEY_ID"
      tabs:                               # ordered list of tabs/screens to walk through
        - name: "Tab Name"
          narrative: "Voice script for this tab"
          tryKeys: ["j/k", "enter"]
          pointOut: ["Feature A", "Feature B"]

    # === v1 fields (all optional, require version: "1") ===

    estimatedMinutes: 5                   # optional — time estimate for this stop
    teachingNarrative: |                  # optional — rich multi-paragraph teaching prose
      This is the detailed written content displayed during the tour.
      It supplements the short `narrative` voice script with full explanations,
      inline definitions, and architectural context.

      Use second-person ("you") and conversational tone. Define terms inline
      on first use. 3-8 paragraphs typical.
    concepts:                             # optional — inline concept definitions
      - term: "Composed Interface"
        definition: "A Go pattern where a large interface is built by embedding smaller, focused interfaces."
      - term: "Type Assertion"
        definition: "A runtime check that tests whether a value implements a specific interface."
    expectedOutput: |                     # optional — what demoCmd output looks like
      {
        "source": "postgresql",
        "connected": true,
        "capabilities": ["read", "write", "schema"]
      }
    tips:                                 # optional — contextual tips as callout blocks
      - "Run `hub status` first to verify your source connection before trying other commands."
      - "All file paths in the codebase are relative to the project root."
    warnings:                             # optional — safety/gotcha callouts
      - "Never disable schema validation in production pipelines."
      - "The circuit breaker persists across restarts — check `hub status` after reboot."
    asciiMockup: |                        # optional — visual representation of UI/output
      ┌─────────────────────────────────────────┐
      │  SOURCES │ PIPELINES │ MONITOR │ LOGS   │
      ├─────────────────────────────────────────┤
      │  pg_main   12 tables  OK   ▲ 99.8%     │
      │  s3_logs    8 files   OK   ▲ 100%      │
      └─────────────────────────────────────────┘
    exercises:                            # optional — interactive exercises
      - title: "Check Your Connection"
        steps:
          - "Run `hub status` and verify the source field shows 'postgresql'"
          - "Run `hub sources list` and note the available data sources"
          - "Run `hub pipelines list` to see configured pipelines (may be empty)"
        difficulty: "beginner"            # "beginner" | "intermediate" | "advanced"
        verifyCmd: "hub status"           # optional — command to verify completion
        expectedResult: "source: postgresql"  # optional — what success looks like
    setupSteps:                           # optional — prerequisite actions for this stop
      - cmd: "export DATABASE_URL=postgres://localhost:5432/datahub"
        explanation: "The pipeline commands require a PostgreSQL connection"
      - cmd: "go build -o hub ./cmd/cli"
        explanation: "Build the CLI binary for demo commands"

tourMap: |                                # optional — ASCII art overview
  PROJECT TOUR — N STOPS

  LAYER A              LAYER B
  ────────             ────────
  1. Stop One          4. Stop Four
  2. Stop Two          5. Stop Five
  3. Stop Three
---
```

---

## Field Reference

### `project`

| Field | Required | v1 | Description |
|-------|----------|-----|-------------|
| `name` | Yes | | Project display name |
| `tagline` | Yes | | One-sentence description |
| `language` | Yes | | Primary programming language |
| `framework` | No | | Primary framework (Ink, BubbleTea, Next.js, etc.) |
| `rootDir` | No | | Absolute path to project root. Defaults to the project root inferred from `.claude/` location. |
| `buildCmd` | No | | Build command (for live walkthrough stops) |
| `testCmd` | No | | Test command |
| `version` | No | Yes | Schema version — `"0"` (legacy) or `"1"` (teaching). Absent = `"0"`. |
| `audience` | No | Yes | Target audience — `"new-contributor"`, `"returning-dev"`, or `"stakeholder"` |
| `estimatedMinutes` | No | Yes | Total tour duration estimate in minutes |
| `prerequisites` | No | Yes | Setup requirements as a string array |
| `prerequisiteTours` | No | Yes | File paths to prerequisite tour files for multi-tour projects |

### `overview`

| Field | Required | v1 | Description |
|-------|----------|-----|-------------|
| `byTheNumbers` | Yes | | 3-11 bullet metrics for the QuickOverview elevator pitch |
| `architectureSummary` | Yes | | Free-form markdown describing the architecture |
| `glossary` | No | Yes | Array of `{term, definition}` pairs, displayed at tour end |

### `keystoneFiles`

1-3 files that best represent the project's core design. Read in full during QuickOverview.

| Field | Required | Description |
|-------|----------|-------------|
| `path` | Yes | Relative to `rootDir` |
| `label` | Yes | Short display name |
| `narrative` | Yes | Voice script (1-2 sentences, spoken aloud) |
| `highlights` | No | Bullet points to call out after reading |

### `stops`

3-14 tour stops, ordered for a logical walkthrough. Each stop follows the standard execution pattern: narrate → introduce → (setup) → show code → (teach) → offer demo → (exercises) → connect → navigate.

#### Core Fields (v0 + v1)

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Stop display name (used in navigation and `connectsTo` references) |
| `narrative` | Yes | Voice script spoken at stop arrival (1-2 sentences, TTS-friendly) |
| `whyItMatters` | Yes | One sentence on architectural significance |
| `keyFiles` | Yes | Files/directories to explore (relative to `rootDir`) |
| `showCode` | No | Specific code snippets to display |
| `demoCmd` | No | Safe, read-only CLI command to demonstrate |
| `demoDescription` | No | What the demo output shows |
| `connectsTo` | No | Names of related stops (builds mental model) |
| `liveWalkthrough` | No | Interactive walkthrough config (for TUI/GUI stops) |

#### Rich Fields (v1 only — all optional)

| Field | Type | Description |
|-------|------|-------------|
| `estimatedMinutes` | number | Time estimate for this stop |
| `teachingNarrative` | string (multiline) | Rich multi-paragraph teaching prose. Separate from `narrative` (TTS). Displayed as written content during the tour. Falls back to `narrative` if absent. |
| `concepts` | array of `{term, definition}` | Inline concept definitions for this stop |
| `expectedOutput` | string (multiline) | What `demoCmd` output looks like (shown before/after running) |
| `tips` | array of strings | Contextual tips displayed as callout blocks |
| `warnings` | array of strings | Safety/gotcha callouts displayed prominently |
| `asciiMockup` | string (multiline) | Visual representation of UI, output, or architecture |
| `exercises` | array of exercise objects | Interactive exercises (see below) |
| `setupSteps` | array of `{cmd, explanation}` | Prerequisite actions before this stop's demos |

#### Exercise Object

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Exercise name |
| `steps` | Yes | Array of step instructions (strings) |
| `difficulty` | No | `"beginner"`, `"intermediate"`, or `"advanced"` |
| `verifyCmd` | No | Command to verify completion |
| `expectedResult` | No | What success looks like |

### `tourMap`

Optional ASCII art providing a visual overview of all stops. Displayed at tour opening.

---

## Minimal Example (v0 — 3 stops)

```yaml
---
project:
  name: "MyAPI"
  tagline: "A REST API for widget management"
  language: "TypeScript"
  framework: "Express"
overview:
  byTheNumbers:
    - "12 endpoints"
    - "3 middleware layers"
    - "PostgreSQL + Redis"
  architectureSummary: |
    Three-layer Express API: routes → controllers → services.
    PostgreSQL for persistence, Redis for caching and sessions.

keystoneFiles:
  - path: "src/routes/index.ts"
    label: "Route Registry"
    narrative: "This is where all endpoints are registered. The hub of the API."
    highlights:
      - "RESTful resource naming"
      - "Middleware chain per route group"

stops:
  - name: "API Routes"
    narrative: "Starting with the route layer. Every request enters here."
    whyItMatters: "The public contract — changing routes is a breaking change."
    keyFiles:
      - "src/routes/"
    showCode:
      - path: "src/routes/index.ts"
        lines: "1-30"
        highlight: "Route registration pattern"
    connectsTo:
      - "Middleware"

  - name: "Middleware"
    narrative: "Three middleware layers — auth, validation, and error handling."
    whyItMatters: "Cross-cutting concerns live here, not in controllers."
    keyFiles:
      - "src/middleware/"
    showCode:
      - path: "src/middleware/auth.ts"
        highlight: "JWT verification flow"
    connectsTo:
      - "API Routes"
      - "Data Layer"

  - name: "Data Layer"
    narrative: "PostgreSQL with Knex migrations and Redis caching."
    whyItMatters: "All persistence logic is isolated here — controllers never touch the database directly."
    keyFiles:
      - "src/services/"
      - "src/models/"
    demoCmd: "npx knex migrate:status"
    demoDescription: "Shows which migrations have been applied"
    connectsTo:
      - "Middleware"
---
```

---

## Rich Example (v1 — Teaching Tour, 1 stop shown)

```yaml
---
project:
  name: "DataHub"
  tagline: "A Go data pipeline platform with plugin adapters, scheduled jobs, and a monitoring dashboard"
  language: "Go"
  framework: "BubbleTea"
  buildCmd: "go build ./..."
  testCmd: "make test"
  version: "1"
  audience: "new-contributor"
  estimatedMinutes: 45
  prerequisites:
    - "Go 1.25+ installed"
    - "PostgreSQL running locally"
  prerequisiteTours:
    - "docs/walkthroughs/GETTING-STARTED.md"

overview:
  byTheNumbers:
    - "180+ Go files across 14 packages"
    - "5 source adapters (PostgreSQL, MySQL, S3, HTTP, CSV)"
    - "8 binaries (TUI, CLI, scheduler, 3 workers, monitor, admin)"
    - "3 output formats (JSON, Parquet, SQLite)"
    - "12 transform functions across 4 categories"
    - "5 scheduling strategies"
  architectureSummary: |
    Three-layer architecture: Interfaces (cmd/) → Business Logic (internal/) →
    Adapter Layer (internal/adapter/). Five source adapters normalize REST,
    SQL, and file protocols behind composed Go interfaces.
  glossary:
    - term: "Adapter"
      definition: "Code that translates between the platform's generic interface and a specific data source's API."
    - term: "Pipeline"
      definition: "A configured sequence of extract, transform, and load steps."
    - term: "Circuit Breaker"
      definition: "A safety mechanism that halts pipeline execution when error rates exceed thresholds."

keystoneFiles:
  - path: "pkg/source/interfaces.go"
    label: "Source Interface"
    narrative: "This is the architectural keystone — the source adapter interface."
    highlights:
      - "Composed Source = Connector + Reader + SchemaProvider"
      - "Optional capabilities via type assertion"

stops:
  - name: "Validation & Safety"
    narrative: "The validation framework. Two layers of protection prevent bad data from reaching your outputs."
    whyItMatters: "Every record passes through these validators. Understanding them is essential before running production pipelines."
    estimatedMinutes: 5
    keyFiles:
      - "internal/validation/"
      - "internal/pipeline/state.go"
    showCode:
      - path: "internal/validation/rules.go"
        lines: "1-50"
        highlight: "Rule function type and the 4 validation gates"
    teachingNarrative: |
      The validation framework is the most important subsystem in the platform. It sits between
      every data operation and the output, enforcing rules that prevent corrupt data from propagating.

      There are two layers of protection. The first is **dry-run mode** — every write command
      (loading data, updating schemas, truncating tables) defaults to dry-run. You must pass
      `--execute` explicitly. This means you can't accidentally corrupt production data.

      The second layer is the **gate system**. Four validation gates run in sequence on every
      batch: the circuit breaker gate (has the pipeline been halted?), the schema validation gate
      (does the data match the expected schema?), the row count gate (is the batch size within
      limits?), and the duplicate detection gate (are there unexpected duplicates?).

      The **circuit breaker** deserves special attention. When triggered, it creates a file at
      `~/.config/datahub/circuit.lock`. As long as that file exists, every pipeline operation
      is blocked — regardless of flags. In the TUI, press `Ctrl+K` to toggle it.
    concepts:
      - term: "Dry-Run"
        definition: "A mode where commands simulate execution without writing data. Default for all write operations."
      - term: "Gate"
        definition: "A function that evaluates a data batch against a validation rule and returns an error if the rule is violated."
      - term: "Circuit Breaker"
        definition: "A safety mechanism that blocks all pipeline operations by creating a lock file on disk."
    expectedOutput: |
      {
        "circuit_breaker": "closed",
        "dry_run": true,
        "gates": {
          "max_batch_size": 100000,
          "max_error_rate": "5%",
          "schema_strict": true
        }
      }
    tips:
      - "Always check `hub status` before running a production pipeline."
      - "The circuit breaker persists across process restarts — it's a file on disk, not in-memory state."
    warnings:
      - "Never disable schema validation in production. Use `--skip-validation` only for development data."
      - "The `--force` flag bypasses ALL gates — use it only when you understand exactly what you're loading."
    exercises:
      - title: "Explore the Pipeline Status"
        steps:
          - "Run `hub status` and identify the two protection layers"
          - "Check whether the circuit breaker is open or closed"
          - "Note the gate thresholds — what's the max batch size?"
        difficulty: "beginner"
        verifyCmd: "hub status"
        expectedResult: "circuit_breaker: closed"
      - title: "Test the Circuit Breaker"
        steps:
          - "Run `hub circuit open --reason 'testing tour'` to trigger the circuit breaker"
          - "Run `hub status` again — confirm it shows 'open'"
          - "Run `hub circuit close` to reset"
          - "Verify with `hub status` that it's closed again"
        difficulty: "beginner"
        verifyCmd: "hub status"
        expectedResult: "circuit_breaker: closed"
    demoCmd: "hub status"
    demoDescription: "Shows circuit breaker state, protection layers, and gate thresholds"
    connectsTo:
      - "Source Interface & Registry"
      - "Scheduler"
---
```

---

## Conventions

1. **TOUR.md lives at `<project-root>/.claude/TOUR.md`** — not tracked in version control. Regenerable via `generate tour`.
2. **All file paths in stops are relative to the project root** — the skill resolves them at runtime.
4. **Voice scripts should be natural speech** — they're read aloud via TTS. Avoid abbreviations, code syntax, and special characters.
5. **Demo commands must be safe and read-only** — no mutations, no writes, no side effects.
6. **Stop names must be unique** — they're used as identifiers in `connectsTo` references.
7. **Order stops for a logical narrative** — foundation first, then build up to interfaces.
8. **`teachingNarrative` is separate from `narrative`** — `narrative` is the short TTS voice script (1-2 sentences). `teachingNarrative` is the rich written content displayed during the tour. Falls back to `narrative` if absent.
9. **All v1 fields are optional** — a legacy v0 tour works unchanged with the v1 skill. Never require v1 fields.
10. **Audience adapts content, not structure** — the same YAML schema works for all audiences. Content tone and depth vary by `audience` setting.
