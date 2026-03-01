# ExtractCommands Workflow

## Purpose

Analyze a software project and generate a complete set of slash commands through introspection, domain research, council-style debate, and file generation.

## Trigger

"extract commands", "generate commands", "onboard commands", "command map"

## Process (4 Phases)

### Phase 1: Introspect (~30s)

Launch an Explore agent (sonnet model) to catalog repeatable developer actions:

```
Task({
  subagent_type: "Explore",
  model: "sonnet",
  prompt: "Catalog all repeatable developer actions in this project:
    1. Makefile / justfile / taskfile — list all targets with their recipes
    2. CLI subcommands — if the project has its own CLI, list all commands
    3. Scripts — find all files in scripts/, bin/, tools/ and package.json scripts
    4. CI steps — extract steps from .github/workflows/, .gitlab-ci.yml, Makefile CI targets
    5. README / CONTRIBUTING — extract 'how to build/test/deploy' instructions
    6. Common actions — list everything a developer does repeatedly as verb phrases
    7. Existing commands — check .claude/commands/ and ~/.claude/commands/ for existing commands.
       For each .md file found, extract: name (from filename), description, argument-hint,
       model, allowed-tools, and actions_covered (from body content).
    Return structured YAML matching the introspection section of CommandSchema.md
    (including the existing_commands array)"
})
```

**Gate checks:**
- < 3 common actions detected → skip debate, generate commands directly from Makefile/scripts
- No Makefile and no scripts and no CLI → AskUserQuestion for common developer workflows
- Existing `.claude/commands/` found → Load as baseline; debate focuses on uncovered actions only

### Phase 2: Research (~15s)

Launch 2-4 parallel WebSearch calls for domain-specific developer workflows:

```
WebSearch("{language} project common developer commands shortcuts")
WebSearch("{framework} development workflow automation")
WebSearch("slash commands developer productivity {domain}")
```

Extract workflow patterns and map to Phase 1 actions. Identify any standard commands the project is missing (e.g., every Go project should have lint, test, build).

**Skip condition:** If the project uses a very common stack (Go + Makefile, Node + package.json) with obvious commands, skip research and use established patterns.

### Phase 3: Debate (~90s)

Three-round council-style debate. Use prompt templates from `DebatePrompts.md`, filling `{{placeholders}}` with Phase 1-2 outputs.

**Round 1 — Initial Proposals** (parallel):
```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Consolidator R1 — fewer general commands",
  prompt: "<filled Consolidator R1 prompt>"
})
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Splitter R1 — more focused commands",
  prompt: "<filled Splitter R1 prompt>"
})
```

**Round 2 — Challenges** (parallel, after R1 completes):
```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Consolidator challenges Splitter",
  prompt: "<filled Consolidator R2 prompt, includes splitter_r1_output>"
})
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Splitter challenges Consolidator",
  prompt: "<filled Splitter R2 prompt, includes consolidator_r1_output>"
})
```

**Round 3 — Revisions** (parallel, after R2 completes):
```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Consolidator final revision",
  prompt: "<filled Consolidator R3 prompt, includes full debate history>"
})
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Splitter final revision",
  prompt: "<filled Splitter R3 prompt, includes full debate history>"
})
```

**Orchestrator Synthesis** (main agent, not a subagent):

Apply heuristics from DebatePrompts.md in order:
1. **Skill Promotion** — multi-phase actions become skills, not commands
2. **Existing Command Deduplication** — don't duplicate existing commands; recommend extending them instead
3. **Convergence Signal** — boundaries both agents agree on are kept
4. **Single Responsibility** — each command does one thing
5. **Tool Homogeneity** — all code paths need the same allowed-tools
6. **Frequency Gate** — commands used < 1x/week are demoted
7. **Action Coverage** — every common action maps to a command
8. **Namespace Hygiene** — aim for 8-15 commands, use subdirs if > 15

Produce the final command map YAML per `CommandSchema.md`.

**User Approval Gate:**

Present the command map as a summary table:

```
| # | Command | Category | Description | Model | Actions Covered |
|---|---------|----------|-------------|-------|-----------------|
| 1 | /test | test | Run tests with coverage | haiku | run unit tests, check coverage |
| 2 | /lint | build | Run linters and formatters | haiku | lint code, format code |
| ... | ... | ... | ... | ... | ... |
```

Include the debate summary and any promotions (actions too complex for commands).

Wait for user approval via AskUserQuestion before proceeding to Phase 4. User can request changes.

**Scope Decision:**

Ask the user where to generate commands:
- `.claude/commands/` — project-scoped (default, recommended)
- `~/.claude/commands/` — global (for commands useful across all projects)
- Both — some project-specific, some global

### Phase 4: Generate (~5-15s per command)

For each command in the approved map, generate the `.md` file:

```markdown
---
description: {description}
argument-hint: {argument_hint}       # omit if null
allowed-tools: {allowed_tools}       # omit if null (inherit defaults)
model: {model}                       # omit if null (inherit default)
---

{Generated prompt body with:
  - !`inline bash` for live context injection
  - $ARGUMENTS / $1 / $2 for user input
  - Clear step-by-step instructions for Claude
  - Specific success/failure criteria}
```

**Body generation guidelines:**
- Start with context injection (`!`git status``, `!`make test 2>&1 | tail -20``)
- Use imperative instructions ("Run the tests", not "You should run the tests")
- Include success criteria ("Report pass/fail count and any failures")
- Keep bodies under 80 lines (commands should be focused)
- Reference project conventions from CLAUDE.md where relevant

After all commands are generated, save the command map:
```
<project>/.claude/skill-data/CommandMap.yaml
```

## Error Handling

| Error | Recovery |
|-------|----------|
| Phase 1 finds no repeatable actions | Abort: "No Makefile, scripts, or CLI found. Create a Makefile first." |
| Phase 2 WebSearch fails | Proceed with Phase 1 data only |
| Phase 3 agent returns malformed YAML | Retry once; if still malformed, use the other agent's proposal |
| Phase 3 agents fully converge | Skip synthesis, use converged proposal |
| Command file already exists | AskUserQuestion: overwrite, skip, or rename |
| > 20 commands proposed | Suggest subdirectory namespaces before generating |
| User rejects command map | Return to synthesis with feedback |

## Related

- **AuditCommands** (`Workflows/AuditCommands.md`) — Post-generation audit of command coverage
- **SkillExtract** skill — Sibling skill for intent-activated skill generation
- **Council** skill — Source of the multi-round debate pattern
