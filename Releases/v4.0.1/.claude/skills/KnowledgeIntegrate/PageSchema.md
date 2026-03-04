# Knowledge Page Schema

Standard property schema and section templates for knowledge pages written by KnowledgeIntegrate.

## Property Block

Every knowledge page begins with LogSeq inline properties:

```
type:: {knowledge | architecture | decision | reference | glossary-term}
category:: {from CategoryTaxonomy.md}
short:: {One sentence summary — max 150 characters}
related:: [[Page One]], [[Page Two]], [[Page Three]]
tags:: [[Tag One]], [[Tag Two]], [[Tag Three]]
source:: {session | research | project-decision | documentation}
project:: {Project name if applicable, omit if general knowledge}
created:: [[YYYY-MM-DD]]
last-updated:: [[YYYY-MM-DD]]
```

### Property Definitions

| Property | Required | Description |
|----------|----------|-------------|
| `type::` | Yes | Content type. Determines which section template to use. |
| `category::` | Yes | From `CategoryTaxonomy.md`. One category per page. |
| `short::` | Yes | Single sentence summary. Max 150 chars. Used in lists and journal links. |
| `related::` | Yes | 2-5 `[[wikilinks]]` to related pages. At least 1 required. |
| `tags::` | Yes | 3-5 tags as `[[wikilinks]]` for search/filtering. |
| `source::` | Yes | How this knowledge was captured. |
| `project::` | No | Project context if domain-specific. Omit for general knowledge. |
| `created::` | Yes | Date page was first created as `[[YYYY-MM-DD]]`. |
| `last-updated::` | Yes | Date of most recent update as `[[YYYY-MM-DD]]`. |

### Type Definitions

| Type | When to Use | Section Template |
|------|------------|------------------|
| `knowledge` | Domain facts, industry knowledge, how-things-work | Overview, Key Concepts, Details, Implications |
| `architecture` | System design, module structure, data flow, patterns | Overview, Structure, Key Components, Design Decisions |
| `decision` | Project decisions with rationale and alternatives | Context, Decision, Rationale, Alternatives, Consequences |
| `reference` | API references, configuration guides, commands | Overview, Usage, Parameters, Examples |
| `glossary-term` | Single concept with clear definition | Definition, Usage, Key Details, Limitations |

## Section Templates

### Type: knowledge
```
- ## Overview
	- {2-4 sentences: what this is and why it matters}
- ## Key Concepts
	- {Bulleted list of the core ideas with [[wikilinks]] where relevant}
- ## Details
	- {Deeper explanation with subsections as needed}
	- ### {Subtopic A}
		- {Details}
	- ### {Subtopic B}
		- {Details}
- ## Implications
	- {What this means in practice — consequences, applications}
```

### Type: architecture
```
- ## Overview
	- {2-4 sentences: what system/module this describes}
- ## Structure
	- {High-level organization — directory layout, module hierarchy}
- ## Key Components
	- ### {Component A}
		- {Purpose, interfaces, dependencies}
	- ### {Component B}
		- {Purpose, interfaces, dependencies}
- ## Design Decisions
	- {Why it's built this way — trade-offs, constraints}
```

### Type: decision
```
- ## Context
	- {What situation prompted this decision}
- ## Decision
	- {What was decided — clear, specific statement}
- ## Rationale
	- {Why this option was chosen}
- ## Alternatives Considered
	- ### {Alternative A}
		- {Why rejected}
- ## Consequences
	- {What follows from this decision — commitments, trade-offs}
```

### Type: reference
```
- ## Overview
	- {What this reference covers}
- ## Usage
	- {How to use — commands, API calls, configuration}
- ## Parameters
	- {Key parameters, options, settings}
- ## Examples
	- {Concrete usage examples}
```

### Type: glossary-term
```
- ## Definition
	- {2-4 sentences explaining what this is}
- ## Usage
	- {How this is applied in practice}
- ## Key Details
	- {Important specifics — thresholds, parameters, variations}
- ## Limitations
	- {Caveats, failure modes, edge cases}
```

## Cross-Linking Rules

1. Every page MUST have at least 1 `[[wikilink]]` in `related::`
2. Use `[[double brackets]]` inline in body text when mentioning another topic that has or should have a page
3. When writing multiple pages in one integration, cross-link within the batch
4. Before writing, scan `$GRAPH_ROOT/pages/` for existing pages that could be cross-linked
5. Tags use `[[wikilinks]]` to enable LogSeq's bi-directional linking

## Filename Convention

LogSeq page filenames map to page titles:
- Spaces remain as spaces in the filename (e.g., `Cloud Architecture.md`)
- Slashes in titles become `___` (triple underscore) per graph's `:file/name-format :triple-lowbar`
- Special characters (`%`, `"`, `?`) use percent-encoding
- Case preserved exactly (LogSeq is case-sensitive)

## Deduplication Strategy

Before writing any page:

1. **Exact filename match**: Check if `pages/{title}.md` exists
2. **Fuzzy search**: `ls pages/ | grep -i "{keyword}"` for similar names
3. **If match found**: Read existing page, determine if it's the same topic
4. **If same topic**: MERGE — preserve existing sections, add new, update `last-updated::`
5. **If different topic**: Adjust the new page title to disambiguate

Merge rules:
- Preserve existing sections that are comprehensive
- Add new sections for information not yet captured
- Update `last-updated::` to today
- Append new items to `related::` and `tags::`
- Never remove existing content during merge
