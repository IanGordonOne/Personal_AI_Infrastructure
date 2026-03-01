# ExtractSkills Workflow

## Purpose

Analyze a software project and generate a complete skill set through introspection, domain research, council-style debate, and code generation.

## Trigger

"extract skills", "onboard project", "wrap project with skills", "generate skill map"

## Process (4 Phases)

### Phase 1: Introspect (~30s)

Launch an Explore agent (sonnet model) to catalog the project:

```
Task({
  subagent_type: "Explore",
  model: "sonnet",
  prompt: "Catalog this project comprehensively:
    1. README — extract name, language, framework, domain, summary
    2. Entry points — find all cmd/*, main.go, main.py, index.ts, routes/, etc.
    3. Package structure — list major packages/modules with purpose and approximate LOC
    4. Config files — .env, Makefile, Dockerfile, package.json, go.mod, etc.
    5. CLI commands or routes — list all commands, subcommands, or API routes
    6. Capabilities — list everything the project CAN DO as verb phrases
    7. Existing skills — scan ~/.claude/skills/*/SKILL.md for skills that reference this project
       (look for project name/path in triggers, workflows, tools, or related skills).
       For each, extract: name, USE WHEN clause, workflow count, capabilities covered.
    Return structured YAML matching the introspection section of SkillMapSchema.md"
})
```

**Gate checks:**
- < 3 capabilities detected → Skip debate (Phase 3), create a single skill covering everything
- No entry points found → AskUserQuestion to identify the main entry point(s)
- No README → AskUserQuestion for project name and domain
- Existing skills found → Load as baseline; debate focuses on uncovered capabilities only

### Phase 2: Research (~15s)

Launch 3-5 parallel WebSearch calls for domain vocabulary:

```
# Example for a web analytics project:
WebSearch("web analytics practitioner roles workflows")
WebSearch("web analytics domain vocabulary glossary")
WebSearch("{framework} project common skill areas")
```

Extract domain terms and map them to capability clusters from Phase 1. Merge into the `domain_vocabulary` section of the debate context.

**Skip condition:** If the project domain is purely technical (CLI tool, library, framework) with no specialized domain vocabulary, skip Phase 2 and proceed with Phase 1 output only.

### Phase 3: Debate (~90s)

Three-round council-style debate. Use prompt templates from `DebatePrompts.md`, filling `{{placeholders}}` with Phase 1-2 outputs.

**Round 1 — Initial Proposals** (parallel):
```
# Launch both in parallel
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Consolidator R1 proposal",
  prompt: "<filled Consolidator R1 prompt from DebatePrompts.md>"
})
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Splitter R1 proposal",
  prompt: "<filled Splitter R1 prompt from DebatePrompts.md>"
})
```

**Round 2 — Challenges** (parallel, after R1 completes):
```
# Each reads the other's R1 output and challenges it
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
# Each revises their proposal incorporating valid critiques
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
1. **Safety Separation** — safety-critical capabilities get dedicated skills
2. **Existing Skill Deduplication** — don't duplicate existing skills; recommend extending them instead
3. **Convergence Signal** — boundaries both agents agree on are kept
4. **Workflow Count Gate** — merge skills with < 2 workflows, split those with > 7
5. **Entry Point Coverage** — every entry point in exactly one skill
6. **Trigger Overlap Check** — resolve any duplicate triggers
7. **Domain Coherence** — skills should map to recognizable practitioner roles

Produce the final skill map YAML per `SkillMapSchema.md`.

**User Approval Gate:**

Present the skill map to the user as a summary table:

```
| # | Skill | Workflows | Capabilities | Rationale |
|---|-------|-----------|-------------|-----------|
| 1 | DataPipeline | 3 | import data, validate schema | Import lifecycle with validation gates |
| 2 | ... | ... | ... | ... |
```

Include the debate summary (consolidator count, splitter count, final count, key merges/splits).

Wait for user approval via AskUserQuestion before proceeding to Phase 4. User can request changes (merge skills, split skills, rename, add/remove workflows).

### Phase 4: Generate (~30-60s per skill)

For each skill in the approved map, **sequentially**:

1. Create the skill directory: `~/.claude/skills/{SkillName}/`
2. Create subdirectories: `Workflows/`, `Tools/`
3. Generate `SKILL.md` with:
   - Frontmatter: `name`, `description` with `USE WHEN` from the map's `use_when` field
   - Voice notification block
   - Workflow routing table from the map's workflows
   - Related Skills table from the map's `related_skills` (referencing previously generated skills)
   - Examples section (3 examples derived from project capabilities)
4. Generate each `Workflows/{WorkflowName}.md` with:
   - Purpose, Trigger, Steps (derived from `steps_summary`), Related section
5. Validate against CreateSkill's checklist:
   - TitleCase naming for directory, workflows, tools
   - USE WHEN present in description
   - 2-7 workflows per skill
   - Routing table entries match actual workflow files
   - Examples section present

After all skills are generated, save the skill map:
```
<project>/.claude/skill-data/SkillMap.yaml
```

## Error Handling

| Error | Recovery |
|-------|----------|
| Phase 1 finds no code (empty project) | Abort with message: "No source code found. Ensure you're in a project directory." |
| Phase 2 WebSearch fails | Proceed without domain vocabulary; note reduced quality |
| Phase 3 agent returns malformed YAML | Retry once with explicit format reminder; if still malformed, use the other agent's proposal |
| Phase 3 agents converge to identical proposals | Skip synthesis, use the converged proposal directly |
| Phase 4 skill directory already exists | AskUserQuestion: overwrite, skip, or rename |
| User rejects skill map | Return to synthesis with user's feedback, re-apply heuristics |

## Related

- **AuditCoverage** (`Workflows/AuditCoverage.md`) — Post-generation audit of skill coverage
- **Council** skill — Source of the multi-round debate pattern
- **CreateSkill** skill — Validation checklist for generated skills
