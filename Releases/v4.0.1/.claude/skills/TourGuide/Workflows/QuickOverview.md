# Workflow: QuickOverview

Condensed 5-minute overview driven by the project's `TOUR.md` definition.

---

## Pre-flight

1. **Locate TOUR.md:** Read `<project-root>/.claude/TOUR.md`.
   - If not found, inform the user and offer to run the GenerateTour workflow instead. Stop here.
2. **Parse TOUR.md:** Read and parse the YAML front matter. Extract `project`, `overview`, `keystoneFiles`, and `stops`.
3. **Resolve paths:** All file paths are relative to the project root (inferred from `.claude/` parent directory, or `project.rootDir` if specified). Resolve to absolute paths.

---

## Voice Narration Protocol

Same fire-and-forget pattern as GuidedTour:
```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"TEXT_HERE\",\"voice_id\":\"$ELEVENLABS_VOICE_ID\",\"title\":\"$DA_NAME\"}" \
  > /dev/null 2>&1 &
```

---

## Elevator Pitch

**Speak** (via curl):
> "Here's the quick version. [project.name] is a [project.language] [project.framework] project. [project.tagline]."

Present the overview:

> **[project.name]** — *[project.tagline]*
>
> [overview.architectureSummary]
>
> **By the numbers:**
> [for each item in overview.byTheNumbers, render as a bullet]

---

## Keystone Files

If `keystoneFiles` exists in TOUR.md, read each one:

For each keystone file:

1. **Speak** the keystone's `narrative` via curl.
2. **Read** the file at `project.rootDir + keystoneFile.path` using the Read tool.
3. **Explain** using the `label` as heading and `highlights[]` as bullet points.

If no `keystoneFiles` are defined, skip this section and move directly to the stop summaries.

---

## Stop Summaries

Present a condensed summary of each stop from TOUR.md:

For each stop in `stops[]`:
> **[stop.name]** (`[stop.keyFiles[0]]`) — [stop.whyItMatters]

If the stop has a `demoCmd`, append: `Demo: \`[demoCmd]\``

---

## Exercises Available (v1 only)

If the tour is v1 (`project.version == "1"`) and any stops have `exercises[]`, mention them:

> **Hands-on exercises available in the full tour:**
> [for each stop with exercises, list: "- **[stop.name]**: [exercise count] exercises ([difficulty levels])"]

This encourages users to try the full guided tour for the interactive experience.

---

## Glossary (v1 only)

If `overview.glossary` exists, display it as a quick reference:

> **Glossary** ([N] terms)
> - **[term]** — [definition]
> - ...

If the glossary has more than 10 terms, show the first 10 and note: "...and [N] more terms. Run the full tour to see them all."

---

## Offer Deep-Dives

**Speak** (via curl):
> "That's the quick overview. Want to go deeper? I can run the full tour, or dive into any specific area."

Present options:

> "That's the [N]-minute overview. Want to go deeper?
> - **Start the full tour** — [N] interactive stops [with exercises] (v1 addition)
> - **Deep-dive** into a specific area — pick any stop by name or number
> - **Run a demo** — execute a safe CLI command to see the project in action"

If the user picks a specific area, route to the corresponding stop in the GuidedTour workflow.
If the user wants the full tour, switch to the GuidedTour workflow.
