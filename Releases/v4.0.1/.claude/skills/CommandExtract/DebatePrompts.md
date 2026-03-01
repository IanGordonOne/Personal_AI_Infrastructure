# Debate Prompts

Prompt templates for the 3-round council-style debate in Phase 3 of ExtractCommands. All `{{placeholders}}` are filled from Phase 1 (introspection) and Phase 2 (domain research) outputs.

## Preamble (shared context for all prompts)

```
You are analyzing a software project to determine the optimal set of slash commands for a Claude Code development environment.

Slash commands are single .md files that represent repeatable developer actions — things you type 10x/day. They are NOT skills (which are intent-activated domain expertise). Commands are explicitly invoked via /command-name.

## Command Format
- File: .claude/commands/{kebab-case-name}.md
- Frontmatter: description (< 60 chars, starts with verb), argument-hint, allowed-tools, model
- Body: instructions for Claude with !`inline bash` for live context and $ARGUMENTS for user input
- Naming: kebab-case, verb-noun pattern (e.g. run-tests, deploy-staging)

## Project Context
- **Name**: {{project.name}}
- **Language**: {{project.language}}
- **Framework**: {{project.framework}}
- **Domain**: {{project.domain}}

## Makefile / Task Targets
{{#each introspection.makefile_targets}}
- `make {{name}}`: {{recipe}}
{{/each}}

## CLI Subcommands
{{#each introspection.cli_subcommands}}
- `{{command}}`: {{description}}
{{/each}}

## Scripts
{{#each introspection.scripts}}
- `{{path}}`: {{purpose}}
{{/each}}

## CI Steps
{{#each introspection.ci_steps}}
- {{name}}: `{{command}}`
{{/each}}

## Common Developer Actions
{{#each introspection.common_actions}}
- {{action}} → currently: `{{current_invocation}}`
{{/each}}

## Existing Commands
{{#if existing_commands}}
These commands ALREADY exist for this project. Do not propose commands that duplicate them unless the existing command is broken, missing key functionality, or has wrong boundaries. Reference existing commands by name when they cover actions you would otherwise propose.
{{#each existing_commands}}
- **/{{name}}** ({{model}}): {{description}}
  Allowed tools: `{{allowed_tools}}`
  Actions covered: {{#each actions_covered}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}
{{else}}
No existing commands found for this project.
{{/if}}

## Domain Workflows (from research)
{{#each domain_workflows}}
- {{workflow}}: {{description}}
{{/each}}

## Constraints
- Command names must be kebab-case
- Descriptions under 60 characters, starting with a verb
- Each command should do ONE thing
- Use the most restrictive allowed-tools possible
- Use haiku for simple tasks, sonnet for moderate, opus rarely
- Commands with > 3 arguments should be split or use $ARGUMENTS
- If an action requires multiple phases, approval gates, or state → it's a skill, not a command
```

---

## Round 1: Initial Proposals

### Consolidator (Architect subagent)

```
{{PREAMBLE}}

## Your Role: Consolidator

You argue for FEWER, MORE GENERAL commands. Your goal is 5-8 commands that use $ARGUMENTS and flags to handle multiple related actions. General commands are easier to remember, reduce /help clutter, and leverage argument flexibility.

## Instructions

1. Propose 5-8 commands for this project
2. For each command, provide:
   - **name**: kebab-case
   - **description**: Under 60 chars, starts with verb
   - **argument_hint**: What arguments it accepts
   - **model**: haiku | sonnet | opus
   - **body_summary**: 2-3 sentences on what it does
   - **actions_covered**: Which developer actions this handles
   - **rationale**: Why these actions belong in one command (2-3 sentences)
3. Argue for your grouping — explain why splitting further creates /help noise

## Output Format

Return YAML:
```yaml
proposal:
  count: N
  commands:
    - name: ...
      description: ...
      argument_hint: ...
      model: ...
      body_summary: ...
      actions_covered: [...]
      rationale: ...
arguments:
  - point: "Why general command X is better than splitting into Y and Z"
    evidence: "Shared tooling, same underlying binary, flag-based differentiation..."
```
```

### Splitter (Engineer subagent)

```
{{PREAMBLE}}

## Your Role: Splitter

You argue for MORE, FOCUSED commands. Your goal is 15-25 commands that each do exactly one thing with zero ambiguity. Focused commands have predictable behavior, simpler prompts, and tighter allowed-tools.

## Instructions

1. Propose 15-25 commands for this project
2. For each command, provide:
   - **name**: kebab-case
   - **description**: Under 60 chars, starts with verb
   - **argument_hint**: What arguments it accepts (prefer none or minimal)
   - **model**: haiku | sonnet | opus
   - **body_summary**: 2-3 sentences on what it does
   - **actions_covered**: Which developer action this handles (usually 1)
   - **rationale**: Why this deserves its own command (2-3 sentences)
3. Argue for your splitting — explain why merging creates ambiguous commands

## Output Format

Return YAML:
```yaml
proposal:
  count: N
  commands:
    - name: ...
      description: ...
      argument_hint: ...
      model: ...
      body_summary: ...
      actions_covered: [...]
      rationale: ...
arguments:
  - point: "Why focused command X is better than merging into general Y"
    evidence: "Different tools needed, different model requirements, distinct user intent..."
```
```

---

## Round 2: Challenge

### Consolidator challenges Splitter

```
{{PREAMBLE}}

## Splitter's Round 1 Proposal

{{splitter_r1_output}}

## Your Role: Consolidator (Challenge Round)

Review the Splitter's proposal and challenge it. Focus on:

1. **Flag-differentiated commands**: Which proposed commands are the same tool with different flags? These should merge. (e.g. `test-unit` and `test-integration` → `test [--integration]`)
2. **Low-frequency commands**: Which commands would be invoked < 1x/week? These don't justify a slash command — use a Makefile target or documentation instead.
3. **Namespace bloat**: Would 20+ commands overwhelm /help? Group into subdirectories or merge.
4. **Argument-capable simplification**: Could $ARGUMENTS elegantly replace 3 separate commands?

For each challenge:
- Name the specific command(s)
- Reference evidence (same binary, same tool permissions, flag-only difference)
- Propose what to merge and why

Concede where the Splitter made a strong case for separation.

## Output Format

```yaml
challenges:
  - target_commands: ["cmd-a", "cmd-b"]
    issue: "flag-differentiated | low-frequency | namespace-bloat | argument-capable"
    evidence: "..."
    proposed_merge: "Merge into cmd-c [--flag] because..."
concessions:
  - command: "cmd-x"
    reason: "This split is justified because..."
revised_proposal:
  count: N
  commands: [...]
```
```

### Splitter challenges Consolidator

```
{{PREAMBLE}}

## Consolidator's Round 1 Proposal

{{consolidator_r1_output}}

## Your Role: Splitter (Challenge Round)

Review the Consolidator's proposal and challenge it. Focus on:

1. **Ambiguous invocation**: Which commands require the user to remember argument syntax? Simple `/deploy-staging` beats `/deploy staging`.
2. **Mixed tool requirements**: Which commands need different `allowed-tools` depending on the argument? This signals a bad merge.
3. **Model mismatch**: Does one argument path need `haiku` while another needs `sonnet`? Split them.
4. **Cognitive load**: Would the user need to read the command's help to know what arguments to pass? Focused commands are self-documenting.

For each challenge:
- Name the specific command
- Reference evidence (different tools, different models, argument confusion)
- Propose where to split and why

Concede where the Consolidator made a strong case for merging.

## Output Format

```yaml
challenges:
  - target_command: "cmd-a"
    issue: "ambiguous-invocation | mixed-tools | model-mismatch | cognitive-load"
    evidence: "..."
    proposed_split: "Split into cmd-b and cmd-c because..."
concessions:
  - command: "cmd-x"
    reason: "This merge is justified because..."
revised_proposal:
  count: N
  commands: [...]
```
```

---

## Round 3: Revision

### Consolidator revision

```
{{PREAMBLE}}

## Debate History

### Your Round 1 Proposal
{{consolidator_r1_output}}

### Splitter's Round 1 Proposal
{{splitter_r1_output}}

### Splitter's Challenge of Your Proposal
{{splitter_r2_output}}

### Your Challenge of Splitter's Proposal
{{consolidator_r2_output}}

## Your Role: Consolidator (Final Revision)

Produce your FINAL command map proposal. You must:

1. Incorporate valid critiques from the Splitter
2. Maintain your core principle (fewer, general commands) where justified
3. For each command, provide full schema: name, description, argument_hint, allowed_tools, model, body_summary, actions_covered, rationale, category
4. Ensure every common developer action is covered
5. Flag any actions too complex for a command (promote to skill)
6. Flag remaining disagreements

## Output Format

```yaml
final_proposal:
  count: N
  commands:
    - name: ...
      description: ...
      argument_hint: ...
      allowed_tools: ...
      model: ...
      body_summary: ...
      actions_covered: [...]
      rationale: ...
      category: ...
  promotions:
    - action: "..."
      reason: "..."
remaining_disagreements:
  - topic: "..."
    my_position: "..."
    splitter_position: "..."
```
```

### Splitter revision

```
{{PREAMBLE}}

## Debate History

### Your Round 1 Proposal
{{splitter_r1_output}}

### Consolidator's Round 1 Proposal
{{consolidator_r1_output}}

### Consolidator's Challenge of Your Proposal
{{consolidator_r2_output}}

### Your Challenge of Consolidator's Proposal
{{splitter_r2_output}}

## Your Role: Splitter (Final Revision)

Produce your FINAL command map proposal. You must:

1. Incorporate valid critiques from the Consolidator
2. Maintain your core principle (focused, single-purpose commands) where justified
3. For each command, provide full schema: name, description, argument_hint, allowed_tools, model, body_summary, actions_covered, rationale, category
4. Ensure every common developer action is covered
5. Remove low-frequency commands that don't justify a slash command
6. Flag remaining disagreements

## Output Format

```yaml
final_proposal:
  count: N
  commands:
    - name: ...
      description: ...
      argument_hint: ...
      allowed_tools: ...
      model: ...
      body_summary: ...
      actions_covered: [...]
      rationale: ...
      category: ...
  promotions:
    - action: "..."
      reason: "..."
remaining_disagreements:
  - topic: "..."
    my_position: "..."
    consolidator_position: "..."
```
```

---

## Synthesis Heuristics

After Round 3, the orchestrator (not a separate agent) applies these heuristics to produce the final command map:

### 1. Single Responsibility
- Each command does exactly one thing. If the body has branching logic based on arguments ("if $1 == 'unit' then... elif $1 == 'integration' then..."), it's two commands.
- Exception: flag-modified behavior of the same underlying tool is fine (e.g. `test [--verbose]`).

### 2. Frequency Gate
- Commands invoked < 1x/week don't justify a slash command. Demote to Makefile targets, shell aliases, or documentation.
- High-frequency actions (build, test, lint, commit) are always commands.

### 3. Convergence Signal
- Where both Consolidator and Splitter converged to the same command by R3, keep it.
- Where they still disagree, apply the remaining heuristics.

### 4. Tool Homogeneity
- All code paths in a command should need the same `allowed-tools`. If different arguments require different tool permissions, split.
- Model should be consistent — if one path needs `opus` and another needs `haiku`, split.

### 5. Action Coverage
- Every common developer action must map to at least one command.
- Uncovered actions = gaps. Flag for user.

### 6. Namespace Hygiene
- Total command count should be manageable in `/help` output (aim for 8-15 per project).
- Use subdirectory namespaces (`commands/git/`, `commands/test/`) if count exceeds 15.
- Avoid generic names that conflict with built-in commands or common shell aliases.

### 7. Skill Promotion
- If a proposed command requires: multiple sequential phases, agent spawning, state persistence, approval gates, or > 100 lines of prompt body — it should be a skill, not a command.
- Flag these as promotions in the command map.

### 8. Existing Command Deduplication
- Do not propose commands that duplicate existing commands unless the existing command is broken, missing key functionality, or has wrong boundaries
- If an existing command partially covers a proposed command's actions, note the overlap and only propose the uncovered portion
- If the existing command could handle the action with a minor argument addition, recommend that instead of a new command

### Application Order

Apply heuristics in this order: Skill Promotion (hard constraint) -> Existing Command Deduplication (avoid waste) -> Convergence Signal (strong evidence) -> Single Responsibility (structural) -> Tool Homogeneity (security) -> Frequency Gate (utility) -> Action Coverage (completeness) -> Namespace Hygiene (ergonomics).
