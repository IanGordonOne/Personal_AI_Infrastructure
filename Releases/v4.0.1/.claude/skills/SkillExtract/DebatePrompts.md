# Debate Prompts

Prompt templates for the 3-round council-style debate in Phase 3 of ExtractSkills. All `{{placeholders}}` are filled from Phase 1 (introspection) and Phase 2 (domain research) outputs.

## Preamble (shared context for all prompts)

```
You are analyzing a software project to determine optimal skill boundaries for a Personal AI Infrastructure (PAI) system.

## Project Context
- **Name**: {{project.name}}
- **Language**: {{project.language}}
- **Framework**: {{project.framework}}
- **Domain**: {{project.domain}}
- **README Summary**: {{introspection.readme_summary}}

## Entry Points
{{#each introspection.entry_points}}
- `{{path}}` ({{type}}): {{description}}
{{/each}}

## Packages
{{#each introspection.packages}}
- `{{path}}` (~{{loc}} LOC): {{purpose}}
{{/each}}

## Capabilities
{{#each introspection.capabilities}}
- {{this}}
{{/each}}

## Domain Vocabulary
{{#each domain_vocabulary.terms}}
- **{{term}}**: {{definition}}
{{/each}}

## Existing Skills
{{#if existing_skills}}
These skills ALREADY exist for this project. Do not propose skills that duplicate them unless you can justify why the existing skill is inadequate (wrong boundaries, missing critical capabilities, or fundamentally broken). Reference existing skills by name when they cover capabilities you would otherwise propose.
{{#each existing_skills}}
- **{{name}}** ({{workflows_count}} workflows): USE WHEN {{use_when}}
  Capabilities covered: {{#each capabilities_covered}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/each}}
{{else}}
No existing skills found for this project.
{{/if}}

## Skill System Constraints
- Each skill must have 2-7 workflows
- Skill names are TitleCase (e.g. TradeExecution, not trade-execution)
- Every entry point must be covered by exactly one skill
- Every capability must be covered by at least one skill
- No two skills should have overlapping trigger phrases
- Skills should align with practitioner roles or domain boundaries
- Each skill needs a clear USE WHEN clause with natural-language triggers
```

---

## Round 1: Initial Proposals

### Consolidator (Architect subagent)

```
{{PREAMBLE}}

## Your Role: Consolidator

You argue for FEWER, BROADER skills. Your goal is 4-6 skills that each represent a major domain boundary. Broad skills reduce context-switching, simplify routing, and avoid over-fragmentation.

## Instructions

1. Propose 4-6 skills for this project
2. For each skill, provide:
   - **name**: TitleCase
   - **purpose**: 1 sentence
   - **workflows**: List of 2-7 workflow names with 1-line descriptions
   - **entry_points_covered**: Which entry points this skill owns
   - **capabilities_covered**: Which capabilities this skill covers
   - **rationale**: Why these concerns belong together (2-3 sentences)
3. Argue for your grouping — explain why splitting further would create fragmentation

## Output Format

Return YAML with this structure:
```yaml
proposal:
  count: N
  skills:
    - name: ...
      purpose: ...
      workflows: [...]
      entry_points_covered: [...]
      capabilities_covered: [...]
      rationale: ...
arguments:
  - point: "Why broad skill X is better than splitting into Y and Z"
    evidence: "Specific reference to shared entry points, common data flow, etc."
```
```

### Splitter (Engineer subagent)

```
{{PREAMBLE}}

## Your Role: Splitter

You argue for MORE, FOCUSED skills. Your goal is 12-18 skills that each represent a single concern. Focused skills have clearer triggers, simpler workflows, and are easier to maintain and test.

## Instructions

1. Propose 12-18 skills for this project
2. For each skill, provide:
   - **name**: TitleCase
   - **purpose**: 1 sentence
   - **workflows**: List of 2-7 workflow names with 1-line descriptions
   - **entry_points_covered**: Which entry points this skill owns
   - **capabilities_covered**: Which capabilities this skill covers
   - **rationale**: Why this concern deserves its own skill (2-3 sentences)
3. Argue for your splitting — explain why merging would create bloated skills

## Output Format

Return YAML with this structure:
```yaml
proposal:
  count: N
  skills:
    - name: ...
      purpose: ...
      workflows: [...]
      entry_points_covered: [...]
      capabilities_covered: [...]
      rationale: ...
arguments:
  - point: "Why focused skill X is better than merging into broader Y"
    evidence: "Specific reference to distinct data sources, different user intents, etc."
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

1. **Under-populated skills**: Which proposed skills have fewer than 2 meaningful workflows? These should be merged into a neighbor.
2. **Artificial splits**: Which skills share the same entry points, data sources, or user intent? Splitting these creates routing confusion.
3. **Trigger overlap**: Where would a user's request ambiguously match multiple skills?
4. **Maintenance burden**: More skills = more files to keep in sync. Where does the split not justify the cost?

## Instructions

For each challenge:
- Name the specific skill(s) you're challenging
- Reference concrete evidence (shared entry points, data flow, user intent patterns)
- Propose what you would merge and why

Also: acknowledge any splits that ARE well-justified. Concede where the Splitter made a strong case.

## Output Format

```yaml
challenges:
  - target_skills: ["SkillA", "SkillB"]
    issue: "under-populated | artificial-split | trigger-overlap | maintenance-burden"
    evidence: "Specific reference..."
    proposed_merge: "Merge into SkillC because..."
concessions:
  - skill: "SkillX"
    reason: "This split is justified because..."
revised_proposal:
  count: N
  skills: [...]  # Your updated proposal incorporating valid splits
```
```

### Splitter challenges Consolidator

```
{{PREAMBLE}}

## Consolidator's Round 1 Proposal

{{consolidator_r1_output}}

## Your Role: Splitter (Challenge Round)

Review the Consolidator's proposal and challenge it. Focus on:

1. **Over-stuffed skills**: Which proposed skills have more than 7 potential workflows? These should be split.
2. **Mixed concerns**: Which skills combine unrelated capabilities that serve different user intents?
3. **Vague triggers**: Where is the USE WHEN clause so broad it matches everything? This signals a skill that's too coarse.
4. **Different practitioner roles**: Do the grouped capabilities map to different professional roles or expertise domains?

## Instructions

For each challenge:
- Name the specific skill you're challenging
- Reference concrete evidence (distinct data sources, different user roles, separate entry points)
- Propose where you would split and why

Also: acknowledge any merges that ARE well-justified. Concede where the Consolidator made a strong case.

## Output Format

```yaml
challenges:
  - target_skill: "SkillA"
    issue: "over-stuffed | mixed-concerns | vague-triggers | different-roles"
    evidence: "Specific reference..."
    proposed_split: "Split into SkillB and SkillC because..."
concessions:
  - skill: "SkillX"
    reason: "This merge is justified because..."
revised_proposal:
  count: N
  skills: [...]  # Your updated proposal incorporating valid merges
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

Produce your FINAL skill map proposal. You must:

1. Incorporate valid critiques from the Splitter's challenge
2. Maintain your core principle (fewer, broader skills) where justified
3. For each skill, provide the full schema: name, purpose, use_when, workflows (2-7), entry_points_covered, capabilities_covered, rationale
4. Ensure every entry point and capability is covered exactly once
5. Flag any remaining disagreements with the Splitter

## Output Format

```yaml
final_proposal:
  count: N
  skills:
    - name: ...
      purpose: ...
      use_when: ...
      workflows:
        - name: ...
          trigger: ...
          purpose: ...
      entry_points_covered: [...]
      capabilities_covered: [...]
      rationale: ...
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

Produce your FINAL skill map proposal. You must:

1. Incorporate valid critiques from the Consolidator's challenge
2. Maintain your core principle (more, focused skills) where justified
3. For each skill, provide the full schema: name, purpose, use_when, workflows (2-7), entry_points_covered, capabilities_covered, rationale
4. Ensure every entry point and capability is covered exactly once
5. Flag any remaining disagreements with the Consolidator

## Output Format

```yaml
final_proposal:
  count: N
  skills:
    - name: ...
      purpose: ...
      use_when: ...
      workflows:
        - name: ...
          trigger: ...
          purpose: ...
      entry_points_covered: [...]
      capabilities_covered: [...]
      rationale: ...
remaining_disagreements:
  - topic: "..."
    my_position: "..."
    consolidator_position: "..."
```
```

---

## Synthesis Heuristics

After Round 3, the orchestrator (not a separate agent) applies these heuristics to produce the final skill map:

### 1. Workflow Count Gate
- Skills with < 2 workflows: merge into the most related neighbor
- Skills with > 7 workflows: split along the strongest internal boundary (different data source, different user intent, or different entry point)

### 2. Trigger Overlap Check
- If both proposals assign the same trigger phrase to different skills, the more specific skill wins
- "Specificity" = fewer total capabilities covered (narrower scope)

### 3. Entry Point Coverage
- Every entry point must appear in exactly one skill
- If both proposals agree on ownership, keep it
- If they disagree, assign to the skill whose other capabilities are most related

### 4. Convergence Signal
- Where both Consolidator and Splitter converged to the same skill boundary by R3, that boundary is strong — keep it
- Where they still disagree, apply the remaining heuristics

### 5. Domain Coherence
- Skills should map to recognizable practitioner roles or domain boundaries
- "Would a domain expert recognize this as a coherent area of work?" — if not, it's an artificial grouping

### 6. Safety Separation
- Safety-critical capabilities (order execution, destructive operations, deployment) must live in dedicated skills, never bundled with read-only analytics
- This heuristic can override workflow count if needed (a 2-workflow safety skill is fine)

### 7. Existing Skill Deduplication
- Do not propose skills that duplicate existing skills unless the existing skill has wrong boundaries, missing critical capabilities, or is fundamentally broken
- If an existing skill partially covers a proposed skill's capabilities, note the overlap and only propose the uncovered portion
- If extending an existing skill (adding workflows) would be better than creating a new one, recommend that instead

### Application Order

Apply heuristics in this order: Safety Separation (hard constraint) -> Existing Skill Deduplication (avoid waste) -> Convergence Signal (strong evidence) -> Workflow Count Gate (structural) -> Entry Point Coverage (completeness) -> Trigger Overlap Check (routing) -> Domain Coherence (qualitative).
