#!/usr/bin/env bun
/**
 * DocExpand — Universal template expander for documentation pipelines.
 *
 * Reads a DocGen.json config, runs introspectors to produce data catalogs,
 * then expands {{placeholder}} syntax in template files to generate docs.
 *
 * Usage:
 *   bun DocExpand.ts --config .claude/skill-data/DocGen.json
 *   bun DocExpand.ts --config .claude/skill-data/DocGen.json --validate
 *   bun DocExpand.ts --config .claude/skill-data/DocGen.json --template mkdocs/readme.md
 *   bun DocExpand.ts --config .claude/skill-data/DocGen.json --introspect
 *   bun DocExpand.ts --config .claude/skill-data/DocGen.json --list
 *
 * Six built-in placeholder types:
 *   {{exec: command args}}         — Run command, indent output
 *   {{data: source.path.to.value}} — Dot-path lookup in JSON/YAML
 *   {{table: source.path | H=f}}   — Markdown table from data
 *   {{link: path/to/file.md}}      — File existence check → link
 *   {{var: name}}                  — Named variable substitution
 *   {{script: path args}}          — External script delegation
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname, basename, extname } from "path";
import { spawnSync } from "child_process";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Introspector {
  name: string;
  run: string;
  output: string;
}

interface TemplateMapping {
  input: string;
  output: string;
}

interface VarDef {
  value?: string;
  exec?: string;
  builtin?: string;
}

interface ExecOptions {
  indent?: number;
  strip_sections?: string[];
}

interface DocGenConfig {
  introspectors?: Introspector[];
  data?: Record<string, string>;
  vars?: Record<string, VarDef>;
  templates?: TemplateMapping[];
  aliases?: Record<string, string>;
  exec_options?: ExecOptions;
}

interface CliArgs {
  config: string;
  validate: boolean;
  template: string | null;
  introspect: boolean;
  list: boolean;
}

// ─── Globals ─────────────────────────────────────────────────────────────────

let config: DocGenConfig;
let cliArgs: CliArgs;
const dataCache = new Map<string, any>();
const varCache = new Map<string, string>();
const validationErrors: string[] = [];
let sortedAliasKeys: string[] = [];

// ─── CLI Parsing ─────────────────────────────────────────────────────────────

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    config: "",
    validate: false,
    template: null,
    introspect: false,
    list: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--config":
        result.config = args[++i] ?? "";
        break;
      case "--validate":
        result.validate = true;
        break;
      case "--template":
        result.template = args[++i] ?? null;
        break;
      case "--introspect":
        result.introspect = true;
        break;
      case "--list":
        result.list = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
    }
  }

  if (!result.config) {
    console.error("Error: --config is required");
    printUsage();
    process.exit(1);
  }

  return result;
}

function printUsage(): void {
  console.log(`DocExpand — Universal template expander

Usage:
  bun DocExpand.ts --config <path> [options]

Options:
  --config <path>     Path to DocGen.json config (required)
  --validate          Dry-run: report broken placeholders, exit 1 on failure
  --template <path>   Expand only this template (still runs introspectors)
  --introspect        Run introspectors only (no template expansion)
  --list              List all templates with placeholder counts
  --help              Show this help`);
}

// ─── Config Loading ──────────────────────────────────────────────────────────

function loadConfig(path: string): DocGenConfig {
  if (!existsSync(path)) {
    console.error(`Error: config not found: ${path}`);
    process.exit(1);
  }

  try {
    const raw = readFileSync(path, "utf-8");
    const cfg = JSON.parse(raw) as DocGenConfig;

    // Coerce bare-string vars to VarDef objects: "project": "MyApp" → { "value": "MyApp" }
    if (cfg.vars) {
      for (const [key, val] of Object.entries(cfg.vars)) {
        if (typeof val === "string") {
          (cfg.vars as Record<string, any>)[key] = { value: val };
        }
      }
    }

    // Pre-sort alias keys by length (longest first) for correct matching.
    if (cfg.aliases) {
      sortedAliasKeys = Object.keys(cfg.aliases).sort(
        (a, b) => b.length - a.length
      );
    }

    return cfg;
  } catch (e: any) {
    console.error(`Error: invalid config: ${e.message}`);
    process.exit(1);
  }
}

// ─── Introspector Runner ─────────────────────────────────────────────────────

function runIntrospectors(): boolean {
  if (!config.introspectors?.length) return true;

  let ok = true;
  for (const intr of config.introspectors) {
    const result = spawnSync("sh", ["-c", intr.run], {
      encoding: "utf-8",
      timeout: 60_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    if (result.status !== 0) {
      console.error(
        `Introspector "${intr.name}" failed (exit ${result.status}): ${result.stderr?.trim()}`
      );
      ok = false;
      continue;
    }

    // Ensure output directory exists.
    const outDir = dirname(intr.output);
    if (outDir && outDir !== "." && !existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    writeFileSync(intr.output, result.stdout);
    console.error(`  [introspect] ${intr.name} → ${intr.output}`);
  }

  return ok;
}

// ─── Data Source Loader ──────────────────────────────────────────────────────

function loadDataSource(name: string): any {
  if (dataCache.has(name)) return dataCache.get(name);

  const path = config.data?.[name];
  if (!path) {
    dataCache.set(name, undefined);
    return undefined;
  }

  if (!existsSync(path)) {
    dataCache.set(name, undefined);
    return undefined;
  }

  try {
    const raw = readFileSync(path, "utf-8");
    const ext = extname(path).toLowerCase();

    let parsed: any;
    if (ext === ".json") {
      parsed = JSON.parse(raw);
    } else if (ext === ".yaml" || ext === ".yml") {
      parsed = parseYaml(raw);
    } else {
      // Try JSON first, then YAML.
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = parseYaml(raw);
      }
    }

    dataCache.set(name, parsed);
    return parsed;
  } catch (e: any) {
    console.error(`Warning: failed to load data source "${name}": ${e.message}`);
    dataCache.set(name, undefined);
    return undefined;
  }
}

// ─── Minimal YAML Parser ─────────────────────────────────────────────────────
// Handles: block mappings, block sequences, scalars, quoted strings, multi-line strings.
// Does NOT handle: anchors/aliases, tags, flow style, merge keys.

function parseYaml(text: string): any {
  const lines = text.split("\n");
  let pos = 0;

  function peekIndent(): number {
    while (pos < lines.length) {
      const line = lines[pos];
      // Skip empty lines and comments.
      if (line.trim() === "" || line.trim().startsWith("#")) {
        pos++;
        continue;
      }
      return line.length - line.trimStart().length;
    }
    return -1;
  }

  function parseValue(indent: number): any {
    if (pos >= lines.length) return null;

    const nextIndent = peekIndent();
    if (nextIndent < 0) return null;

    const line = lines[pos].trimStart();

    // Check if this is a sequence.
    if (line.startsWith("- ")) {
      return parseSequence(nextIndent);
    }

    // Check if this is a mapping.
    if (line.includes(":")) {
      return parseMapping(nextIndent);
    }

    // Scalar.
    pos++;
    return parseScalar(line);
  }

  function parseMapping(baseIndent: number): Record<string, any> {
    const result: Record<string, any> = {};

    while (pos < lines.length) {
      const currentIndent = peekIndent();
      if (currentIndent < 0 || currentIndent < baseIndent) break;
      if (currentIndent > baseIndent) break;

      const line = lines[pos].trimStart();
      const colonIdx = findMappingColon(line);
      if (colonIdx < 0) break;

      let key = line.slice(0, colonIdx).trim();
      // Strip surrounding quotes from keys.
      if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
      }
      const valueStr = line.slice(colonIdx + 1).trim();
      pos++;

      if (valueStr === "" || valueStr === "|" || valueStr === ">") {
        // Block value — check next line's indent.
        if (valueStr === "|" || valueStr === ">") {
          result[key] = parseBlockScalar(baseIndent, valueStr === ">");
        } else {
          const childIndent = peekIndent();
          if (childIndent > baseIndent) {
            result[key] = parseValue(childIndent);
          } else {
            result[key] = null;
          }
        }
      } else if (valueStr.startsWith("[")) {
        // Inline flow sequence.
        result[key] = parseFlowSequence(valueStr);
      } else if (valueStr.startsWith("{")) {
        result[key] = parseFlowMapping(valueStr);
      } else {
        result[key] = parseScalar(valueStr);
      }
    }

    return result;
  }

  function parseSequence(baseIndent: number): any[] {
    const result: any[] = [];

    while (pos < lines.length) {
      const currentIndent = peekIndent();
      if (currentIndent < 0 || currentIndent < baseIndent) break;
      if (currentIndent > baseIndent) break;

      const line = lines[pos].trimStart();
      if (!line.startsWith("- ")) break;

      const valueStr = line.slice(2).trim();
      pos++;

      if (valueStr === "") {
        // Nested value.
        const childIndent = peekIndent();
        if (childIndent > baseIndent) {
          result.push(parseValue(childIndent));
        } else {
          result.push(null);
        }
      } else if (valueStr.startsWith("{")) {
        // Flow mapping in sequence item: - { key: val, ... }
        result.push(parseFlowMapping(valueStr));
      } else if (findMappingColon(valueStr) >= 0) {
        // Inline mapping start in sequence item.
        // Back up: parse this as a mapping item.
        pos--;
        const item = parseSequenceMapping(baseIndent);
        result.push(item);
      } else if (valueStr.startsWith("[")) {
        result.push(parseFlowSequence(valueStr));
      } else {
        result.push(parseScalar(valueStr));
      }
    }

    return result;
  }

  function parseSequenceMapping(seqIndent: number): Record<string, any> {
    // A sequence item that starts with "- key: value" — the first k:v is on the dash line.
    const result: Record<string, any> = {};
    const line = lines[pos].trimStart();
    const content = line.slice(2).trim(); // Remove "- "

    const colonIdx = findMappingColon(content);
    if (colonIdx >= 0) {
      const key = content.slice(0, colonIdx).trim();
      const valueStr = content.slice(colonIdx + 1).trim();
      pos++;
      if (valueStr === "") {
        const childIndent = peekIndent();
        if (childIndent > seqIndent) {
          result[key] = parseValue(childIndent);
        } else {
          result[key] = null;
        }
      } else if (valueStr.startsWith("[")) {
        result[key] = parseFlowSequence(valueStr);
      } else {
        result[key] = parseScalar(valueStr);
      }
    } else {
      pos++;
    }

    // Continue reading mapping entries at indent > seqIndent.
    const childIndent = peekIndent();
    if (childIndent > seqIndent) {
      const more = parseMapping(childIndent);
      Object.assign(result, more);
    }

    return result;
  }

  function parseBlockScalar(parentIndent: number, fold: boolean): string {
    const blockLines: string[] = [];
    let blockIndent = -1;

    while (pos < lines.length) {
      const line = lines[pos];
      if (line.trim() === "") {
        blockLines.push("");
        pos++;
        continue;
      }
      const indent = line.length - line.trimStart().length;
      if (indent <= parentIndent) break;
      if (blockIndent < 0) blockIndent = indent;
      blockLines.push(line.slice(blockIndent));
      pos++;
    }

    // Trim trailing empty lines.
    while (blockLines.length > 0 && blockLines[blockLines.length - 1] === "") {
      blockLines.pop();
    }

    if (fold) {
      return blockLines.join(" ").replace(/  +/g, " ").trim();
    }
    return blockLines.join("\n");
  }

  function splitFlowItems(s: string): string[] {
    // Split on commas, respecting quoted strings.
    const items: string[] = [];
    let current = "";
    let inSingle = false;
    let inDouble = false;
    let depth = 0; // track nested [] and {}
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (ch === "[" || ch === "{") depth++;
        else if (ch === "]" || ch === "}") depth--;
      }
      if (ch === "," && !inSingle && !inDouble && depth === 0) {
        items.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    if (current.trim()) items.push(current.trim());
    return items;
  }

  function parseFlowSequence(s: string): any[] {
    const inner = s.slice(1, s.lastIndexOf("]")).trim();
    if (inner === "") return [];
    return splitFlowItems(inner).map((v) => parseScalar(v.trim()));
  }

  function parseFlowMapping(s: string): Record<string, any> {
    const inner = s.slice(1, s.lastIndexOf("}")).trim();
    if (inner === "") return {};
    const result: Record<string, any> = {};
    for (const pair of splitFlowItems(inner)) {
      const ci = pair.indexOf(":");
      if (ci >= 0) {
        let k = pair.slice(0, ci).trim();
        if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
          k = k.slice(1, -1);
        }
        const v = pair.slice(ci + 1).trim();
        if (v.startsWith("[")) {
          result[k] = parseFlowSequence(v);
        } else if (v.startsWith("{")) {
          result[k] = parseFlowMapping(v);
        } else {
          result[k] = parseScalar(v);
        }
      }
    }
    return result;
  }

  function findMappingColon(line: string): number {
    // Find the first colon that's followed by space, end of string, or is at the end.
    // Skip colons inside quotes.
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      if (ch === '"' && !inSingle) inDouble = !inDouble;
      if (ch === ":" && !inSingle && !inDouble) {
        if (i === line.length - 1 || line[i + 1] === " ") {
          return i;
        }
      }
    }
    return -1;
  }

  function parseScalar(s: string): string | number | boolean | null {
    if (s === "null" || s === "~") return null;
    if (s === "true") return true;
    if (s === "false") return false;

    // Quoted strings.
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      return s.slice(1, -1);
    }

    // Numbers.
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);

    return s;
  }

  return parseValue(0);
}

// ─── Dot-Path Access ─────────────────────────────────────────────────────────

function walkPath(obj: any, path: string[]): any {
  let current = obj;
  for (const segment of path) {
    if (current == null) return undefined;
    if (Array.isArray(current)) {
      const idx = parseInt(segment, 10);
      if (isNaN(idx)) return undefined;
      current = current[idx];
    } else if (typeof current === "object") {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

// ─── Alias Resolution ────────────────────────────────────────────────────────

function applyAlias(inner: string): string {
  if (!config.aliases) return inner;

  for (const prefix of sortedAliasKeys) {
    if (inner === prefix || inner.startsWith(prefix)) {
      return config.aliases[prefix] + inner.slice(prefix.length);
      break;
    }
  }

  return inner;
}

// ─── Placeholder Expanders ───────────────────────────────────────────────────

function expandPlaceholder(
  inner: string,
  templatePath: string,
  lineNum: number
): string {
  // Apply aliases first.
  const resolved = applyAlias(inner);

  // Route by prefix.
  if (resolved.startsWith("exec: ")) return execExpand(resolved.slice(6));
  if (resolved.startsWith("data: ")) return dataExpand(resolved.slice(6));
  if (resolved.startsWith("table: ")) return tableExpand(resolved.slice(7));
  if (resolved.startsWith("link: ")) return linkExpand(resolved.slice(6));
  if (resolved.startsWith("var: ")) return varExpand(resolved.slice(5));
  if (resolved.startsWith("script: ")) return scriptExpand(resolved.slice(8));

  // Unrecognized — return as-is (might be intentional markup).
  return `{{${inner}}}`;
}

// ── exec ──

function execExpand(command: string): string {
  if (cliArgs.validate) {
    return validateExec(command);
  }

  const result = spawnSync("sh", ["-c", command], {
    encoding: "utf-8",
    timeout: 30_000,
    maxBuffer: 5 * 1024 * 1024,
  });

  if (result.status !== 0) {
    return `<!-- ERROR: exec: ${command}: exit ${result.status}: ${result.stderr?.trim()} -->`;
  }

  let output = result.stdout;

  // Strip sections.
  const stripSections = config.exec_options?.strip_sections ?? [];
  for (const section of stripSections) {
    output = stripSection(output, section);
  }

  // Indent.
  const indent = config.exec_options?.indent ?? 4;
  const prefix = " ".repeat(indent);
  const lines = output.trimEnd().split("\n");
  return lines.map((l) => prefix + l).join("\n");
}

function validateExec(command: string): string {
  // Extract the binary name.
  const binary = command.split(/\s+/)[0];
  if (!binary) return `<!-- ERROR: exec: empty command -->`;

  // Check if binary exists as a file or on PATH.
  if (existsSync(binary)) {
    return `    [validated: ${command}]`;
  }

  const which = spawnSync("which", [binary], { encoding: "utf-8" });
  if (which.status === 0) {
    return `    [validated: ${command}]`;
  }

  return `<!-- ERROR: exec: command not found: ${binary} -->`;
}

function stripSection(text: string, sectionHeader: string): string {
  const idx = text.indexOf(sectionHeader);
  if (idx < 0) return text;

  const before = text.slice(0, idx);
  const after = text.slice(idx);
  const lines = after.split("\n");
  let pastHeader = false;
  const kept: string[] = [];

  for (const l of lines) {
    if (!pastHeader) {
      if (l.includes(sectionHeader)) {
        pastHeader = true;
        continue;
      }
    } else {
      if (l.trim() === "") continue;
      if (l.startsWith("  ") || l.startsWith("\t")) continue;
      // Non-indented, non-empty line = next section.
      kept.push(l);
      pastHeader = false;
    }
  }

  let result = before.trimEnd();
  if (kept.length > 0) {
    result += "\n" + kept.join("\n");
  }
  return result + "\n";
}

// ── data ──

function dataExpand(path: string): string {
  const segments = path.split(".");
  if (segments.length < 2) {
    return `<!-- ERROR: data: ${path}: need at least source.field -->`;
  }

  const sourceName = segments[0];
  const data = loadDataSource(sourceName);
  if (data === undefined) {
    if (cliArgs.validate) {
      return `<!-- ERROR: data: ${path}: source "${sourceName}" not found -->`;
    }
    return `<!-- ERROR: data: ${path}: source "${sourceName}" not found -->`;
  }

  const fieldPath = segments.slice(1);
  const value = walkPath(data, fieldPath);
  if (value === undefined) {
    return `<!-- ERROR: data: ${path}: not found -->`;
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}

// ── table ──

function tableExpand(spec: string): string {
  // Parse: "source.path | Header1=field1, Header2=field2"
  const pipeIdx = spec.indexOf("|");
  if (pipeIdx < 0) {
    return `<!-- ERROR: table: missing column spec (need | separator): ${spec} -->`;
  }

  const dataPath = spec.slice(0, pipeIdx).trim();
  const colSpec = spec.slice(pipeIdx + 1).trim();

  // Parse column spec.
  const columns = colSpec.split(",").map((col) => {
    const eqIdx = col.indexOf("=");
    if (eqIdx < 0) {
      return { header: col.trim(), field: col.trim() };
    }
    return {
      header: col.slice(0, eqIdx).trim(),
      field: col.slice(eqIdx + 1).trim(),
    };
  });

  // Load data.
  const segments = dataPath.split(".");
  const sourceName = segments[0];
  const data = loadDataSource(sourceName);
  if (data === undefined) {
    return `<!-- ERROR: table: source "${sourceName}" not found -->`;
  }

  const fieldPath = segments.slice(1);
  const target = fieldPath.length > 0 ? walkPath(data, fieldPath) : data;
  if (target === undefined || target === null) {
    return `<!-- ERROR: table: ${dataPath}: not found -->`;
  }

  if (cliArgs.validate) {
    if (typeof target !== "object") {
      return `<!-- ERROR: table: ${dataPath}: not an array or object -->`;
    }
    return `[validated: table ${dataPath}]`;
  }

  // Iterate items.
  let items: Array<{ key: string; index: number; value: any }>;

  if (Array.isArray(target)) {
    items = target.map((v, i) => ({ key: String(i), index: i, value: v }));
  } else if (typeof target === "object") {
    const keys = Object.keys(target).sort((a, b) => {
      // Sort numerically if possible, otherwise lexically.
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    items = keys.map((k, i) => ({ key: k, index: i, value: target[k] }));
  } else {
    return `<!-- ERROR: table: ${dataPath}: not iterable -->`;
  }

  // Build table.
  const headerRow =
    "| " + columns.map((c) => c.header).join(" | ") + " |";
  const sepRow =
    "|" + columns.map(() => "---").join("|") + "|";

  const rows = items.map((item) => {
    const cells = columns.map((col) => {
      if (col.field === "key") return item.key;
      if (col.field === "index") return String(item.index);
      if (typeof item.value === "object" && item.value !== null) {
        const val = walkPath(item.value, col.field.split("."));
        if (val === undefined) return "";
        if (Array.isArray(val)) return val.join(", ");
        return String(val);
      }
      return String(item.value);
    });
    return "| " + cells.join(" | ") + " |";
  });

  return [headerRow, sepRow, ...rows].join("\n");
}

// ── link ──

function linkExpand(filePath: string): string {
  if (existsSync(filePath)) {
    // Derive title from filename.
    const name = basename(filePath, extname(filePath));
    const title = name
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `[${title}](${filePath})`;
  }

  if (cliArgs.validate) {
    return `<!-- ERROR: link: file not found: ${filePath} -->`;
  }
  return `<!-- link not found: ${filePath} -->`;
}

// ── var ──

function varExpand(name: string): string {
  if (varCache.has(name)) return varCache.get(name)!;

  const def = config.vars?.[name];
  if (!def) {
    return `<!-- ERROR: var: ${name}: not defined -->`;
  }

  let value: string;

  if (def.value !== undefined) {
    value = def.value;
  } else if (def.builtin) {
    switch (def.builtin) {
      case "date":
        value = new Date().toISOString().split("T")[0];
        break;
      default:
        return `<!-- ERROR: var: ${name}: unknown builtin "${def.builtin}" -->`;
    }
  } else if (def.exec) {
    if (cliArgs.validate) {
      // In validate mode, just check the command exists.
      const binary = def.exec.split(/\s+/)[0];
      if (existsSync(binary) || spawnSync("which", [binary], { encoding: "utf-8" }).status === 0) {
        varCache.set(name, `[validated: var ${name}]`);
        return varCache.get(name)!;
      }
      return `<!-- ERROR: var: ${name}: command not found: ${binary} -->`;
    }

    const result = spawnSync("sh", ["-c", def.exec], {
      encoding: "utf-8",
      timeout: 10_000,
    });
    if (result.status !== 0) {
      return `<!-- ERROR: var: ${name}: ${def.exec} failed -->`;
    }
    value = result.stdout.trim();
  } else {
    return `<!-- ERROR: var: ${name}: no value, exec, or builtin defined -->`;
  }

  varCache.set(name, value);
  return value;
}

// ── script ──

function scriptExpand(cmdLine: string): string {
  const parts = cmdLine.split(/\s+/);
  const runtimes = new Set(["bun", "node", "deno", "npx", "tsx", "ts-node"]);
  let scriptPath: string;

  // If the first token is a known runtime, the script is the second token.
  if (runtimes.has(parts[0]) && parts.length > 1) {
    scriptPath = parts[1];
  } else {
    scriptPath = parts[0];
  }

  if (!existsSync(scriptPath)) {
    // Also check PATH for the first token (covers runtime binaries).
    const which = spawnSync("which", [parts[0]], { encoding: "utf-8" });
    if (which.status !== 0) {
      return `<!-- ERROR: script: file not found: ${scriptPath} -->`;
    }
  }

  if (cliArgs.validate) {
    return `[validated: script ${scriptPath}]`;
  }

  const ext = extname(scriptPath).toLowerCase();
  let cmd: string;
  if (runtimes.has(parts[0])) {
    // Runtime already specified in cmdLine.
    cmd = cmdLine;
  } else if (ext === ".ts" || ext === ".js") {
    cmd = `bun ${cmdLine}`;
  } else {
    cmd = cmdLine;
  }

  const result = spawnSync("sh", ["-c", cmd], {
    encoding: "utf-8",
    timeout: 30_000,
    maxBuffer: 5 * 1024 * 1024,
  });

  if (result.status !== 0) {
    return `<!-- ERROR: script: ${scriptPath}: exit ${result.status}: ${result.stderr?.trim()} -->`;
  }

  return result.stdout.trimEnd();
}

// ─── Template Processing ─────────────────────────────────────────────────────

const placeholderRe = /\{\{(.+?)\}\}/g;

function processTemplate(templatePath: string, outputPath: string): number {
  if (!existsSync(templatePath)) {
    console.error(`Error: template not found: ${templatePath}`);
    return 0;
  }

  const content = readFileSync(templatePath, "utf-8");
  const lines = content.split("\n");
  const expandedLines: string[] = [];
  let placeholderCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    const expanded = line.replace(placeholderRe, (match, inner) => {
      placeholderCount++;
      const result = expandPlaceholder(inner.trim(), templatePath, lineNum);

      if (
        cliArgs.validate &&
        result.startsWith("<!-- ERROR:")
      ) {
        validationErrors.push(`${templatePath}:${lineNum}: {{${inner}}} → ${result}`);
      }

      return result;
    });

    if (!cliArgs.validate) {
      expandedLines.push(expanded);
    }
  }

  if (!cliArgs.validate) {
    // Ensure output directory exists.
    const outDir = dirname(outputPath);
    if (outDir && outDir !== "." && !existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }
    writeFileSync(outputPath, expandedLines.join("\n"));
    console.error(`  [expand] ${templatePath} → ${outputPath} (${placeholderCount} placeholders)`);
  }

  return placeholderCount;
}

// ─── List Mode ───────────────────────────────────────────────────────────────

function listTemplates(): void {
  if (!config.templates?.length) {
    console.log("No templates configured.");
    return;
  }

  console.log("Templates:");
  for (const tmpl of config.templates) {
    if (!existsSync(tmpl.input)) {
      console.log(`  ${tmpl.input} → ${tmpl.output}  [MISSING]`);
      continue;
    }

    const content = readFileSync(tmpl.input, "utf-8");
    const matches = content.match(placeholderRe);
    const count = matches ? matches.length : 0;
    console.log(`  ${tmpl.input} → ${tmpl.output}  (${count} placeholders)`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  cliArgs = parseArgs();
  config = loadConfig(cliArgs.config);

  // List mode — just show templates and exit.
  if (cliArgs.list) {
    listTemplates();
    process.exit(0);
  }

  const startTime = Date.now();

  // Run introspectors.
  console.error("Running introspectors...");
  const intrOk = runIntrospectors();
  if (!intrOk) {
    console.error("Error: one or more introspectors failed");
    process.exit(1);
  }

  // Introspect-only mode.
  if (cliArgs.introspect) {
    console.error("Introspectors complete.");
    process.exit(0);
  }

  // Determine which templates to process.
  let templates = config.templates ?? [];
  if (cliArgs.template) {
    const match = templates.find((t) => t.input === cliArgs.template);
    if (match) {
      templates = [match];
    } else {
      // Not found in config — use template path as both input and infer output.
      console.error(`Warning: template "${cliArgs.template}" not in config, outputting to stdout`);
      if (!existsSync(cliArgs.template)) {
        console.error(`Error: template not found: ${cliArgs.template}`);
        process.exit(1);
      }
      // Process to stdout.
      const content = readFileSync(cliArgs.template, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const expanded = lines[i].replace(placeholderRe, (match, inner) => {
          return expandPlaceholder(inner.trim(), cliArgs.template!, lineNum);
        });
        console.log(expanded);
      }
      process.exit(0);
    }
  }

  if (templates.length === 0) {
    console.error("No templates configured.");
    process.exit(0);
  }

  // Process templates.
  let totalPlaceholders = 0;
  for (const tmpl of templates) {
    totalPlaceholders += processTemplate(tmpl.input, tmpl.output);
  }

  const elapsed = Date.now() - startTime;

  if (cliArgs.validate) {
    if (validationErrors.length === 0) {
      console.error(
        `All placeholders valid (${templates.length} templates, ${totalPlaceholders} placeholders, ${elapsed}ms)`
      );
      process.exit(0);
    }
    console.error(
      `${validationErrors.length} placeholder error(s):`
    );
    for (const err of validationErrors) {
      console.error(`  ${err}`);
    }
    process.exit(1);
  }

  console.error(
    `Done: ${templates.length} templates, ${totalPlaceholders} placeholders expanded (${elapsed}ms)`
  );
}

main().catch((e) => {
  console.error(`Fatal: ${e.message}`);
  process.exit(1);
});
