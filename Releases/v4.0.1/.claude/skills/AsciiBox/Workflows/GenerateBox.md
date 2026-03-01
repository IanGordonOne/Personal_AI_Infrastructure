# GenerateBox

Generate an ASCII box-drawn mockup with perfectly aligned borders.

---

## Process

### Step 1: Gather Content

Accept content from one of:
- **stdin** — piped text, one line per content row
- **User message** — content described in natural language
- **File reference** — extract content from an existing mockup to reformat

### Step 2: Determine Parameters

| Parameter | Default | Options |
|-----------|---------|---------|
| `--style` | `light` | `light`, `double`, `rounded` |
| `--width` | `55` | Any positive integer; prefer 40, 55, or 70 |
| `--title` | (none) | Title text to embed in top border |
| `--dividers` | (none) | Comma-separated line numbers for section dividers |

### Step 3: Generate

Run the tool:

```bash
echo "line 1\nline 2\nline 3" | bun ~/.claude/tools/AsciiBox.ts generate --style light --width 55 --title "MY TITLE"
```

The tool will:
1. Read lines from stdin
2. Compute display width per line
3. Pad each line to the target width with proper 2-space inner padding
4. Output the complete box to stdout

### Step 4: Nest (if needed)

For nested boxes:
1. Generate the **inner box first** at reduced width (parent content width - 4)
2. Capture the inner box output
3. Use the inner box lines as content for the outer box
4. Generate the outer box

See `NestingRules.md` for width limits and depth constraints.

---

## Examples

**Simple box:**
```bash
echo "FORM\n1/5 name\n\n> _" | bun ~/.claude/tools/AsciiBox.ts generate --style light --width 55 --title "FORM"
```

Output:
```
┌─ FORM ──────────────────────────────────────────────┐
│  1/5 name                                           │
│                                                     │
│  > _                                                │
└─────────────────────────────────────────────────────┘
```

**Box with dividers:**
```bash
echo "Header\nContent line 1\nContent line 2\nFooter" | bun ~/.claude/tools/AsciiBox.ts generate --width 40 --dividers 1,3
```

Output:
```
┌──────────────────────────────────────┐
│  Header                              │
├──────────────────────────────────────┤
│  Content line 1                      │
│  Content line 2                      │
├──────────────────────────────────────┤
│  Footer                              │
└──────────────────────────────────────┘
```
