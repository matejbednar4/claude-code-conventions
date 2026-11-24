// Generates src/utils/INDEX.md and src/constants/INDEX.md: every util and constant with its exports and one-line
// purpose (the first paragraph of its docblock), so new code can check "does this already exist?" before adding a
// duplicate.
//
//   yarn gen:index      (wire as `"gen:index": "node --experimental-strip-types scripts/genIndex.ts"` or via tsx)
//
// With several backends, each one wires the same script and passes its own src folder as the one argument
// (`... <path to>/scripts/genIndex.ts src`); without an argument it indexes the src folder beside scripts/.
//
// Re-run after adding, removing or renaming a util or constant.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = process.argv[2] ? path.resolve(process.argv[2]) : fileURLToPath(new URL("../src", import.meta.url));
const EXPORT = String.raw`export\s+(?:async\s+)?(?:const|let|function|type|class)\s+`;
const MAX_PURPOSE_LENGTH = 160;

/** Every .ts file under a folder, at any depth. */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

/** The names a file exports. */
function exportsOf(source: string): string[] {
  return [...new Set([...source.matchAll(new RegExp(`${EXPORT}([A-Za-z0-9_]+)`, "g"))].map((match) => match[1]!))];
}

/**
 * A file's purpose: the first paragraph of the docblock right above the export named like the file (the convention),
 * or else of the file's first docblock.
 */
function purposeOf(source: string, name: string): string {
  const own = source.match(new RegExp(String.raw`(\/\*\*(?:(?!\*\/)[\s\S])*\*\/)\s*${EXPORT}${name}\b`));
  const block = own?.[1] ?? source.match(/\/\*\*[\s\S]*?\*\//)?.[0];
  if (!block) return "—";
  const lines = block
    .replace(/^\/\*\*|\*\/$/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*?\s?/, "").trim());
  const paragraph: string[] = [];
  for (const line of lines) {
    if (line.startsWith("@")) break;
    if (line === "") {
      if (paragraph.length > 0) break;
      continue;
    }
    paragraph.push(line);
  }
  const text = paragraph.join(" ").replace(/\|/g, "\\|");
  return text.length > MAX_PURPOSE_LENGTH ? `${text.slice(0, MAX_PURPOSE_LENGTH - 1)}…` : text || "—";
}

/** Writes <folder>/INDEX.md, one table per subfolder, and returns how many files it lists. */
function generate(folder: string, title: string, note: string): number {
  const root = path.join(SRC, folder);
  const files = walk(root).sort();
  const groups = new Map<string, string[]>();
  for (const file of files) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const group = relative.includes("/") ? relative.slice(0, relative.lastIndexOf("/") + 1) : "(root)";
    const source = readFileSync(file, "utf8");
    const row = `| \`${exportsOf(source).join(", ") || "—"}\` | ${relative} | ${purposeOf(source, path.basename(file, ".ts"))} |`;
    groups.set(group, [...(groups.get(group) ?? []), row]);
  }

  let markdown = `# ${title}: index\n\n> ${note}\n> **Generated** by \`yarn gen:index\` (scripts/genIndex.ts). Don't edit by hand; re-run after changes.\n\n`;
  for (const [group, rows] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
    markdown += `## ${group}\n\n| Exports | File | Purpose |\n| --- | --- | --- |\n${rows.join("\n")}\n\n`;
  }
  writeFileSync(path.join(root, "INDEX.md"), markdown);
  return files.length;
}

const utils = generate(
  "utils",
  "utils",
  "Every util, grouped by purpose. Check here before adding one; put new ones in the folder they serve.",
);
const constants = generate(
  "constants",
  "constants",
  "Every constant, grouped by domain. Check here before adding one; never hardcode a config value elsewhere.",
);
console.log(`Wrote utils/INDEX.md (${utils} files) and constants/INDEX.md (${constants} files) under ${SRC}.`);
