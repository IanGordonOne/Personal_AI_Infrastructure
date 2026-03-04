# Knowledge Category Taxonomy

Domain-agnostic categories for classifying knowledge pages.

## Categories

### Industry & Domain Knowledge
Facts, economics, regulations, and concepts specific to a business domain.
**Examples:** cloud provider pricing models, HIPAA compliance requirements, supply chain logistics

### Technical Architecture
System design, module structure, data models, and implementation patterns.
**Examples:** microservice boundaries, event-driven architecture, REST API design patterns

### Process & Workflow Knowledge
How things work — business processes, development workflows, operational procedures.
**Examples:** open source contribution process, CI/CD pipeline design, code review workflow

### Tool & Technology Knowledge
Specific tools, frameworks, libraries — their capabilities, configuration, and usage.
**Examples:** Docker Compose, GitHub Actions, LogSeq query syntax, Terraform modules

### Project Decisions & Rationale
Architectural decisions, technology choices, trade-offs made with reasoning.
**Examples:** choosing PostgreSQL over MySQL, monorepo vs polyrepo, REST vs gRPC

### Regulatory & Compliance
Legal requirements, standards, certifications, compliance frameworks.
**Examples:** GDPR data handling, SOC 2 controls, PCI DSS requirements

### Economics & Business Model
Market dynamics, pricing models, competitive landscape, unit economics.
**Examples:** SaaS pricing tiers, customer acquisition costs, marketplace dynamics

### Integration & API Knowledge
How systems connect — APIs, data exchange formats, integration patterns.
**Examples:** OAuth 2.0 flows, webhook patterns, GraphQL federation, message queue protocols

## Assignment Rules

1. **One category per page** — choose the most specific match
2. **Technical Architecture** requires structural/design content, not just "uses technology X"
3. **Project Decisions** must include rationale/alternatives — otherwise it's a fact (Industry & Domain)
4. **Tool & Technology** is about the tool itself — how a tool is used in a project is Process & Workflow
5. When ambiguous, prefer the category that best helps future discovery
