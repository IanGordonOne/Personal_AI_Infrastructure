# Knowledge Page Schema

Abstract property schema and section templates for knowledge pages. The **format** of properties and sections (inline vs YAML frontmatter, outliner vs flat markdown) is defined by the active backend profile — see `Backends/{backend}.md`.

## Property Block

Every knowledge page begins with a metadata block containing these properties. The serialization format is defined by the active backend's **Property Format** section.

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | enum | Content type: knowledge, architecture, decision, reference, glossary-term. Determines section template. |
| `category` | string | From `CategoryTaxonomy.md`. One category per page. |
| `short` | string | Single sentence summary. Max 150 chars. Used in lists and journal links. |
| `related` | list of links | 2-5 cross-links to related pages. At least 1 required. |
| `tags` | list | 3-5 tags for search/filtering. Format per active backend's **Tag Format**. |
| `source` | enum | How captured: session, research, project-decision, documentation. |
| `created` | date | Date page was first created. Format per active backend's **Date Format**. |
| `last-updated` | date | Date of most recent update. Format per active backend's **Date Format**. |

### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `project` | string | Project context if domain-specific. Omit for general knowledge. |
| `session-log` | string | Date + description linking to the session that created/updated this page. |

### Type Definitions

| Type | When to Use | Sections |
|------|------------|----------|
| `knowledge` | Domain facts, industry knowledge, how-things-work | Overview, Key Concepts, Details, Implications |
| `architecture` | System design, module structure, data flow, patterns | Overview, Structure, Key Components, Design Decisions |
| `decision` | Project decisions with rationale and alternatives | Context, Decision, Rationale, Alternatives, Consequences |
| `reference` | API references, configuration guides, commands | Overview, Usage, Parameters, Examples |
| `glossary-term` | Single concept with clear definition | Definition, Usage, Key Details, Limitations |

## Section Templates

These templates define the **content expectations** for each type. The rendering format (outliner blocks vs flat markdown, indentation style) is determined by the active backend's **Section Format**.

### Type: knowledge

1. **Overview** — 2-4 sentences: what this is and why it matters
2. **Key Concepts** — Bulleted list of the core ideas with cross-links where relevant
3. **Details** — Deeper explanation with subsections as needed
4. **Implications** — What this means in practice — consequences, applications

### Type: architecture

1. **Overview** — 2-4 sentences: what system/module this describes
2. **Structure** — High-level organization — directory layout, module hierarchy
3. **Key Components** — Subsections per component: purpose, interfaces, dependencies
4. **Design Decisions** — Why it's built this way — trade-offs, constraints

### Type: decision

1. **Context** — What situation prompted this decision
2. **Decision** — Clear, specific statement of what was decided
3. **Rationale** — Why this option was chosen
4. **Alternatives Considered** — Subsections per alternative with rejection reason
5. **Consequences** — What follows — commitments, trade-offs

### Type: reference

1. **Overview** — What this reference covers
2. **Usage** — How to use — commands, API calls, configuration
3. **Parameters** — Key parameters, options, settings
4. **Examples** — Concrete usage examples

### Type: glossary-term

1. **Definition** — 2-4 sentences explaining what this is
2. **Usage** — How this is applied in practice
3. **Key Details** — Important specifics — thresholds, parameters, variations
4. **Limitations** — Caveats, failure modes, edge cases

## Cross-Linking Rules

1. Every page MUST have at least 1 cross-link in `related`
2. Use the active backend's **Link Format** when mentioning another topic in body text
3. When writing multiple pages in one integration, cross-link within the batch
4. Before writing, scan the pages directory for existing pages that could be cross-linked
5. Tags enable the graph tool's bi-directional linking — format per active backend's **Tag Format**

## Deduplication Strategy

Before writing any page:

1. **Exact filename match**: Use the active backend's **Existence Check** to find `{PAGES_DIR}/{title}.md`
2. **Fuzzy search**: Search the pages directory for similar names (case-insensitive)
3. **If match found**: Read existing page, determine if it's the same topic
4. **If same topic**: MERGE — preserve existing sections, add new, update `last-updated`
5. **If different topic**: Adjust the new page title to disambiguate

Merge rules:
- Preserve existing sections that are comprehensive
- Add new sections for information not yet captured
- Update `last-updated` to today
- Append new items to `related` and `tags`
- Never remove existing content during merge
