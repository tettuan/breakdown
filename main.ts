/// <reference lib="deno.ns" />
import { parseArgs } from "@std/cli/parse_args";
import { Command } from "@cliffy/command/mod.ts";
import { readAll } from "@std/io/read_all";

// プロジェクト内モジュールのインポート
import { parseArgs as projectParseArgs } from "@/cli/args.ts";
import { MarkdownParser } from "@/markdown/parser.ts";
import { version } from "@/version.ts";
import { Args, ProcessResult, ExitCode, ParseResult } from "@/cli/types.ts";
import { Logger } from "@/utils/logger.ts";

async function processInput(args: Args, input: string): Promise<ProcessResult> {
  const parser = new MarkdownParser();
  const result = parser.parse(input);

  switch (args.command) {
    case "to":
      return {
        success: true,
        code: ExitCode.Success,
        data: result
      };
    case "summary":
      return {
        success: true,
        code: ExitCode.Success,
        data: {
          title: result.title,
          summary: result.content
        }
      };
    case "defect":
      return {
        success: true,
        code: ExitCode.Success,
        data: {
          error: result.content,
          analysis: result.metadata
        }
      };
    default:
      return {
        success: false,
        code: ExitCode.Error,
        message: `Unknown command: ${args.command}`
      };
  }
}

function createCommand(): Command {
  return new Command()
    .name("breakdown")
    .version(version)
    .description("Markdown to JSON converter for AI development");
}

async function parseCommandArgs(command: Command): Promise<Args> {
  // 一旦unknownとして受け取り、型を確認
  const rawResult = await command.parse(Deno.args);
  const result = rawResult as unknown as ParseResult;
  
  if (result.options?.help) {
    command.showHelp();
    Deno.exit(0);
  }

  if (result.options?.version) {  // helpではなくversionに修正
    command.showVersion();
    Deno.exit(0);
  }

  return projectParseArgs(result.args);
}

async function readInput(args: Args): Promise<string> {
  if (args.fromFile) {
    return await Deno.readTextFile(args.fromFile);
  }
  if (args._.length > 0) {
    const inputPath = String(args._[0]);  // 明示的に文字列に変換
    return await Deno.readTextFile(inputPath);
  }
  const buffer = await readAll(Deno.stdin);
  return new TextDecoder().decode(buffer);
}

async function writeOutput(args: Args, result: ProcessResult): Promise<void> {
  const output = JSON.stringify(result, null, 2);
  if (args.output) {
    await Deno.writeTextFile(args.output, output);
  } else {
    console.log(output);
  }
}

// エラーハンドリングの型安全化
function handleError(error: unknown): void {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("An unknown error occurred");
  }
}

async function main() {
  Logger.init();
  try {
    const command = createCommand();
    const args = await parseCommandArgs(command);
    Logger.debug("Parsed args:", args);  // デバッグ出力
    const input = await readInput(args);
    const result = await processInput(args, input);
    await writeOutput(args, result);
    Deno.exit(0);
  } catch (error) {
    handleError(error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}

// メインのエクスポートファイル
// 型定義とクラスの実装を外部ファイルから一元的にエクスポート
export { MarkdownParser } from './src/markdown/parser.ts';
export type { MarkdownNode, NodeType } from './src/markdown/types.ts'; 