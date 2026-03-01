# AuditCoverage Workflow

## Purpose

Audit the skill coverage of an existing project — find gaps (uncovered capabilities), overlaps (multiple skills covering the same thing), and orphans (stale skill references).

## Trigger

"audit skill coverage", "skill gaps", "coverage matrix"

## Process (4 Steps)

### Step 1: Introspect Project

Reuse Phase 1 from ExtractSkills — launch an Explore agent to catalog the project's entry points, packages, and capabilities.

If a `SkillMap.yaml` exists at `<project>/.claude/skill-data/SkillMap.yaml`, load it as the baseline and only re-introspect to detect new capabilities added since the map was generated.

### Step 2: Scan Existing Skills

Scan all skills that reference this project:

```
# Find skills with references to this project
Grep({
  pattern: "<project-name>|<project-path>",
  path: "~/.claude/skills/",
  glob: "**/SKILL.md"
})
```

For each matching skill, extract:
- Skill name
- Workflow count and names
- USE WHEN triggers
- Capabilities covered (from routing table descriptions and workflow purposes)

### Step 3: Build Coverage Matrix

Cross-reference project capabilities (Step 1) with skill coverage (Step 2):

```
| Capability | Skill(s) | Status |
|-----------|----------|--------|
| import data sources | DataPipeline | Covered |
| run analytics | (none) | GAP |
| generate reports | Reporting, Analytics | OVERLAP |
| old deprecated feature | LegacySkill | ORPHAN |
```

Status definitions:
- **Covered** — exactly one skill covers this capability
- **Gap** — no skill covers this capability
- **Overlap** — multiple skills cover the same capability (may be intentional)
- **Orphan** — a skill references a capability that no longer exists in the project

### Step 4: Report & Remediate

Present the coverage matrix to the user with summary statistics:

```
## Coverage Report

- Total capabilities: 47
- Covered: 41 (87%)
- Gaps: 3
- Overlaps: 2
- Orphans: 1
```

For each issue, offer remediation options via AskUserQuestion:

**Gaps:**
- Add workflows to an existing skill (suggest the most related skill)
- Generate a new skill to cover the gap
- Mark as intentionally uncovered (document why)

**Overlaps:**
- Designate one skill as primary owner
- Split the capability into distinct sub-capabilities
- Mark as intentional (e.g., safety + analytics both need position data)

**Orphans:**
- Remove the stale reference from the skill
- Update the skill to reflect the current project state
- Delete the skill entirely if all its capabilities are orphaned

If remediation involves generating new skills or workflows, invoke Phase 4 of ExtractSkills for the new content.

Update `SkillMap.yaml` with the remediated state.

## Error Handling

| Error | Recovery |
|-------|----------|
| No SkillMap.yaml exists | Run full introspection (no baseline comparison) |
| No skills reference this project | Report "No skills found" and offer to run ExtractSkills |
| Project has changed significantly | Flag high delta and suggest re-running ExtractSkills |

## Related

- **ExtractSkills** (`Workflows/ExtractSkills.md`) — Initial skill generation; Phase 1 is shared
- **System** skill — SystemIntegrity workflow checks for broken skill references
- **CreateSkill** skill — ValidateSkill workflow for post-remediation checks
