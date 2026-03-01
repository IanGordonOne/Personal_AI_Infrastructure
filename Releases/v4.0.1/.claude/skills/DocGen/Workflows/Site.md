# Site — Generate a Static Documentation Site

Set up Starlight (Astro) to build an HTML documentation site from DocGen's markdown output.

---

## Process (5 Steps)

### Step 1: Check Prerequisites

Verify the project has:
- A working DocGen config (`.claude/skill-data/DocGen.json`)
- At least one template that produces markdown output
- `bun` or `npm` available

If DocGen isn't set up yet, run the Init workflow first.

### Step 2: Install Starlight

```bash
# From the project root
bun create astro@latest site -- --template starlight --no-install --no-git
cd site && bun install && cd ..
```

This creates a `site/` directory with the Starlight scaffold. Add `site/` to `.gitignore` if generated sites shouldn't be tracked.

### Step 3: Configure Starlight

Edit `site/astro.config.mjs` to read DocGen's output directory:

```js
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Project Name',
      sidebar: [
        { label: 'Overview', link: '/' },
        {
          label: 'Guides',
          autogenerate: { directory: 'guides' },
        },
      ],
    }),
  ],
});
```

Create symlinks or copy steps so DocGen output lands in `site/src/content/docs/`:

```bash
# Option A: Symlink (development)
ln -s ../../docs site/src/content/docs/guides

# Option B: Copy (CI/build)
cp docs/*.md site/src/content/docs/guides/
```

Add a root index page at `site/src/content/docs/index.mdx`:

```mdx
---
title: Project Documentation
description: Generated documentation
template: splash
---

Welcome to the documentation.
```

### Step 4: Add Build Targets

Add to the project's Makefile (or equivalent):

```makefile
.PHONY: site
site: docs ## Build documentation site
	cp docs/*.md site/src/content/docs/guides/
	cd site && bun run build

.PHONY: site-dev
site-dev: docs ## Start documentation site dev server
	cp docs/*.md site/src/content/docs/guides/
	cd site && bun run dev
```

The full pipeline is now:

```bash
# Generate markdown from templates, then build HTML
bun ~/.claude/skills/DocGen/Tools/DocExpand.ts --config .claude/skill-data/DocGen.json
cd site && bun run build
```

### Step 5: Verify

```bash
# Dev server — opens browser, hot-reloads
cd site && bun run dev

# Production build — outputs to site/dist/
cd site && bun run build
```

Check that:
- All DocGen-generated pages appear in the sidebar
- Tables render correctly
- Code blocks from `exec:` placeholders have proper formatting
- Links between pages work

## Customization

### Sidebar from DocGen config

Generate the sidebar structure from `DocGen.json` templates:

```bash
# In astro.config.mjs, build sidebar from template list
const templates = JSON.parse(fs.readFileSync('../.claude/skill-data/DocGen.json')).templates;
const sidebar = templates.map(t => ({
  label: path.basename(t.output, '.md').replace(/-/g, ' '),
  link: '/guides/' + path.basename(t.output, '.md').toLowerCase(),
}));
```

### Deployment

Starlight builds to `site/dist/` — a static directory deployable anywhere:

| Platform | Command |
|----------|---------|
| Cloudflare Pages | `cd site && bun run build` (set build output to `site/dist`) |
| GitHub Pages | Add workflow: build → deploy `site/dist/` |
| Netlify | Set build command and publish directory |
| Local preview | `cd site && bun run preview` |

## Notes

- Starlight expects `.md` or `.mdx` files with YAML frontmatter (`title`, `description`)
- If DocGen templates don't include frontmatter, add it via a `var:` placeholder or post-processing
- The `site/` directory can be gitignored (generated artifact) or tracked (if you customize themes/components)
- Starlight supports Markdown extensions: callouts, tabs, code groups, diagrams via plugins
