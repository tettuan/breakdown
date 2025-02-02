import { parse } from "std/flags/mod.ts";
import { MarkdownParser } from './src/mod.ts';

async function main() {
  const args = parse(Deno.args, {
    boolean: ["help", "version"],
    string: ["input", "output"],
    alias: {
      h: "help",
      v: "version",
      i: "input",
      o: "output",
    },
  });

  if (args.help) {
    console.log(`
breakdown - Markdown to JSON converter for AI development

Usage:
  breakdown [options] [file]

Options:
  -h, --help            Show this help message
  -v, --version         Show version number
  -i, --input <file>    Input markdown file (default: STDIN)
  -o, --output <file>   Output JSON file (default: STDOUT)

Examples:
  breakdown input.md
  breakdown -i input.md -o output.json
  cat input.md | breakdown > output.json
`);
    Deno.exit(0);
  }

  if (args.version) {
    console.log("breakdown v0.1.0");
    Deno.exit(0);
  }

  try {
    let markdown: string;
    
    // 入力ファイルの処理
    if (args.input) {
      markdown = await Deno.readTextFile(args.input);
    } else if (args._[0]) {
      markdown = await Deno.readTextFile(args._[0] as string);
    } else {
      // STDINからの読み込み
      const buffer = await Deno.readAll(Deno.stdin);
      markdown = new TextDecoder().decode(buffer);
    }

    const parser = new MarkdownParser();
    const result = parser.parse(markdown);
    const output = JSON.stringify(result, null, 2);

    // 出力の処理
    if (args.output) {
      await Deno.writeTextFile(args.output, output);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error("Error:", error.message);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
} 