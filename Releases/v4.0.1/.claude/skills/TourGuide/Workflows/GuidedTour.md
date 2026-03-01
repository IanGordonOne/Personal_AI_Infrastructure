# Workflow: GuidedTour

Interactive stop-by-stop tour driven by the project's `TOUR.md` definition.

---

## Pre-flight

1. **Locate TOUR.md:** Read `<project-root>/.claude/TOUR.md`.
   - If not found, inform the user and offer to run the GenerateTour workflow instead. Stop here.
2. **Parse TOUR.md:** Read and parse the YAML front matter. Extract `project`, `overview`, `stops`, `keystoneFiles`, and `tourMap`.
3. **Detect version:** Check `project.version`. If `"1"`, enable rich field rendering. If absent or `"0"`, use legacy behavior (skip all v1 steps).
4. **Resolve paths:** All file paths are relative to the project root (inferred from `.claude/` parent directory, or `project.rootDir` if specified). Resolve to absolute paths for Read tool calls.

---

## Voice Narration Protocol

The tour guide **speaks aloud** at every opportunity using the PAI voice server. All voice calls are fire-and-forget — they never block tour flow and degrade gracefully if the voice server is down.

**Voice command pattern** (use Bash tool, fire-and-forget):
```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"TEXT_HERE\",\"voice_id\":\"$ELEVENLABS_VOICE_ID\",\"title\":\"$DA_NAME\"}" \
  > /dev/null 2>&1 &
```

**When to speak:**

| Moment | What to say |
|--------|-------------|
| **Tour opening** | Welcome message (see Opening section) |
| **Each stop arrival** | The stop's `narrative` from TOUR.md |
| **Stop transitions** | "Moving on to stop N — [name]." |
| **After CLI demos** | 1-sentence summary of what the output shows |
| **Deep-dive requests** | "Let's go deeper into [area]. I'll show you the internals." |
| **Live walkthrough tabs** | Tab-specific `narrative` from `liveWalkthrough.tabs[]` |
| **Tour closing** | Farewell message (see Closing section) |

**Important:** The `🗣️` response line fires only once per response. For a multi-turn tour, **direct curl is the primary voice mechanism** — it provides real-time narration at each stop. Always include both: curl for immediate voice AND the `🗣️` response line.

---

## Opening

**Speak** (via curl):
> "Welcome to the [project.name] codebase tour. I'll guide you through [N] stops covering the key architecture. Let's go."

If `project.estimatedMinutes` exists (v1), mention it:
> "Welcome to the [project.name] codebase tour. [N] stops, about [estimatedMinutes] minutes. Let's go."

If `project.prerequisites` exists (v1), check them:
> "Before we start — this tour assumes: [list prerequisites]. Ready?"

If `tourMap` exists in TOUR.md, display it. Otherwise, present a numbered list of all stops:

```
[PROJECT NAME] CODEBASE TOUR — [N] STOPS

[tourMap content, or generated numbered list]
```

Ask the user: "Where would you like to start? Pick a number (1-[N]), a name, or just say 'start' for the beginning."

If the user mentioned a specific topic in their trigger (e.g., "walk me through the safety framework"), search `stops[].name` for a match and jump directly to that stop.

---

## Stop Execution Pattern

For each stop, read the stop data from the parsed TOUR.md and follow this sequence. Steps marked **[v1]** are only executed when `project.version == "1"` AND the relevant field exists on the stop. If a v1 field is absent, skip that step silently.

### 0. Speak the Narrative
- **Before anything else**, speak the stop's `narrative` via curl.
- This gives the user an audio preview of what they're about to see.

### 1. Introduce
- State the stop number, name, and `whyItMatters`.
- If `connectsTo` references earlier stops, briefly recall the connection.
- If `estimatedMinutes` exists (v1), mention: "This stop takes about [N] minutes."

### 1.5. Setup Check [v1]
- **Condition:** Only if `setupSteps[]` exists on this stop.
- For each setup step, present the command and explanation:
  > **Setup required:** `[cmd]` — [explanation]
- Ask if the user has completed the setup or wants help.
- If all setup is confirmed, proceed. Otherwise, offer to help or skip.

### 2. Show Code
- If `showCode` exists for this stop:
  - For each entry, use the **Read** tool on `project.rootDir + showCode[].path`.
  - If `lines` is specified, read only that range.
  - After reading, explain the `highlight` text.
- If no `showCode` but `keyFiles` exist:
  - Read the most significant file (first in the list, or the one that's a file not a directory).
  - Keep excerpts focused — 20-40 lines max.

### 2.5. Teach [v1]
- **Condition:** Only if `teachingNarrative` exists on this stop.
- Display the `teachingNarrative` as rich prose content.
- If `concepts[]` exists, render each as an inline definition block:
  > **[term]** — [definition]
- If `asciiMockup` exists, display it in a fenced code block.

### 3. Offer CLI Demo (enhanced)
- If `demoCmd` exists for this stop:
  - If `expectedOutput` exists (v1), show it first:
    > "Here's what the output typically looks like:"
    > ```[expectedOutput]```
  - If `warnings[]` exists (v1), display them before running:
    > ⚠️ **Warning:** [warning text]
  - Present: "[demoDescription]. Want me to run `[demoCmd]`? (It's read-only and safe.)"
  - Only run if user approves.
  - **After demo output**, speak a 1-sentence summary via curl.
  - If `tips[]` exists (v1), display them after the demo:
    > 💡 **Tip:** [tip text]

### 3.5. Exercises [v1]
- **Condition:** Only if `exercises[]` exists on this stop.
- Present exercises as an optional activity:
  > **Exercises** (optional — [N] available)
  > 1. **[title]** ([difficulty]) — [first step preview]
  > ...
- If the user chooses an exercise:
  - Display all steps numbered
  - If `verifyCmd` exists, offer to run it after the user attempts the exercise
  - If `expectedResult` exists, compare against output
- Exercises are always skippable — never block tour progression.

### 4. Connect
- If `connectsTo` exists, explain how this stop relates to the named stops.
- This builds the mental model of the architecture.

### 5. Navigate (enhanced)

Present navigation options:

```
What next?
  [n] Next stop → Stop N+1: <name>
  [d] Deep-dive — explore more files in this area
  [e] Exercises — try the hands-on exercises (if exercises exist)
  [s] Skip ahead — jump to any stop (1-N)
  [r] Run demo — execute the CLI demo command
  [q] Done — end the tour with a summary
```

The `[e]` option only appears if the stop has `exercises[]` and the user hasn't completed them yet.

Wait for user input before proceeding.

### Transition Voice
When the user chooses **next** or **skip**, speak a transition:
> "Moving on to stop [N] — [name]."

### Deep-Dive Voice
When the user requests a **deep-dive**, speak:
> "Let's go deeper into [area]. I'll show you the internals."

Then explore additional files from `keyFiles` that weren't shown in the initial code display.

---

## Live Walkthrough Stops

If a stop has a `liveWalkthrough` section, follow this special pattern instead of the standard code-reading flow:

### Build Phase
1. Run `liveWalkthrough.buildCmd` if specified.
2. If build fails, diagnose and fix compiler errors before continuing.

### Pre-flight Check
3. For each env var in `liveWalkthrough.preflightChecks`:
   ```bash
   echo "[VAR]=${[VAR]:+SET}"
   ```
4. If any are not set, warn the user.

### Launch
5. Tell the user:
   > "Open a new terminal and run `[liveWalkthrough.launchCmd]` from the [project.name] directory. Let me know when it's up — I'll guide you through each tab."

### Tab-by-Tab Walkthrough
Wait for the user to confirm the app is running, then for each tab in `liveWalkthrough.tabs[]`:

1. **Speak** the tab's `narrative` via curl.
2. **Point out** each item in `pointOut[]`.
3. **Suggest trying** each key/action in `tryKeys[]`.
4. Wait for user acknowledgment before moving to the next tab.

### After Walkthrough
Present a compact keybinding cheat sheet derived from all `tryKeys` entries across tabs.

**v1 enhancement:** If the stop has `teachingNarrative`, display it before the live walkthrough begins (contextual introduction). If `exercises[]` exist, offer them after the walkthrough completes.

---

## Closing (enhanced)

After the user signals they're done (reaching the last stop or saying "done"):

**Speak** (via curl):
> "That wraps up the tour. You've seen the core of [project.name]. Happy building."

1. **Summarize** what was covered — list the stops visited.
2. **Key file bookmarks** — remind them of the keystone files from TOUR.md (if they exist).

### v1 Closing Additions

3. **Glossary** — If `overview.glossary` exists, display all terms:
   > **Glossary**
   > - **[term]** — [definition]
   > - ...

4. **Skipped exercises** — If any stops had `exercises[]` that weren't attempted:
   > **Exercises you can try later:**
   > - Stop [N] "[name]": [exercise titles]
   > - ...

5. **Prerequisite tours** — If `project.prerequisiteTours` exists:
   > **Related:**
   > - [tour file path] — run this for [description]

### Standard Closing (all versions)

6. **Offer next steps:**
   - "Want to deep-dive into any area?"
   - "Ready to try the QuickOverview instead?"
   - "Want to start building something?"
