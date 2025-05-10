/**
 * Markdown directory to TypeScript file converter script (English .md only)
 * Usage: deno run -A scripts/convert-md-to-ts.ts <inputDir> <output.ts>
 */
import { walk } from "jsr:@std/fs@0.224.0";
import { basename, relative } from "jsr:@std/path@0.224.0";

if (Deno.args.length < 2) {
  console.error("Usage: deno run -A scripts/convert-md-to-ts.ts <inputDir> <output.ts>");
  Deno.exit(1);
}

const [inputDir, outputPath] = Deno.args;

const templates: Record<string, string> = {};

for await (const entry of walk(inputDir, { includeDirs: false, exts: [".md"] })) {
  // Exclude Japanese markdown files (*.ja.md)
  if (entry.path.endsWith(".ja.md")) continue;
  const content = await Deno.readTextFile(entry.path);
  // Path is relative to inputDir
  const relPath = relative(inputDir, entry.path).replaceAll("\\", "/");
  // Escape
  const escaped = content
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
  templates[relPath] = escaped;
}

const varName = basename(outputPath).replace(/\.ts$/, "").replace(/[^a-zA-Z0-9_]/g, "_");

const tsContent = `// This file is auto-generated. Do not edit directly.
/**
 * Source: Markdown templates under ${inputDir} (English only)
 */
export const ${varName} = ${JSON.stringify(templates, null, 2)} as const;
`;

await Deno.writeTextFile(outputPath, tsContent);

console.log(`✅ Converted (English .md only) ${inputDir} -> ${outputPath}`);
