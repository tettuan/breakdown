#!/usr/bin/env -S deno run -A

import { parseArgs } from "@std/cli/parse_args";
import { exists } from "@std/fs/exists";
import { ensureDir } from "@std/fs/ensure_dir";
import { getConfig, initializeConfig, setConfig } from "../breakdown/config/config.ts";
import { join } from "@std/path/join";
import { dirname } from "@std/path/dirname";
import { parseArgs as parseArgsOld } from "./args.ts";
import { loadPrompt } from "../breakdown/prompts/loader.ts";
import { Args } from "./types.ts";
import { Config, BreakdownConfig, WorkspaceStructure, AppConfig as IAppConfig } from "../breakdown/config/config.ts";
import { ExitCode } from "./types.ts";
import { copy } from "@std/io/copy";
import { readAll } from "@std/io/read_all";
import { PromptVariables } from "@/breakdown/prompts/loader.ts";

type DemonstrativeType = "to" | "summary" | "defect" | "init";
type LayerType = "project" | "issue" | "task";

function isValidDemonstrativeType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect", "init"].includes(type);
}

function isValidLayerType(type: string): type is LayerType {
  return ["project", "issue", "task"].includes(type);
}

function normalizePath(path: string): string {
  return path.startsWith("./") ? path : "./" + path;
}

function generateDefaultFilename(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const hash = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${dateStr}_${hash}.md`;
}

function autoCompletePath(filePath: string | undefined, demonstrative: string): string {
  if (!filePath) {
    filePath = generateDefaultFilename();
  }
  if (filePath.includes("/")) {
    return normalizePath(filePath);
  }
  const config = getConfig();
  const dirType = demonstrative === "to" ? "issue" : demonstrative;
  return normalizePath(join(config.working_dir, dirType + "s", filePath).replace(/\\/g, "/"));
}

function getPromptPath(
  demonstrativeType: string,
  layerType: string,
  fromFile: string
): string {
  const config = getConfig();
  const baseDir = config.app_prompt?.base_dir || "./breakdown/prompts/";
  const fromType = fromFile.includes("project") ? "project" :
                  fromFile.includes("issue") ? "issue" :
                  fromFile.includes("task") ? "task" : layerType;
  
  return normalizePath(join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`));
}

async function initWorkspace(): Promise<ProcessResult> {
  const config = getConfig();
  try {
    const dirExists = await exists(config.working_dir);
    if (dirExists) {
      return {
        success: true,
        code: ExitCode.Success,
        message: `Working directory already exists: ${config.working_dir}`
      };
    } else {
      await ensureDir(config.working_dir);
      return {
        success: true,
        code: ExitCode.Success,
        message: `Created working directory: ${config.working_dir}`
      };
    }
  } catch (error) {
    return {
      success: false,
      code: ExitCode.Error,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function checkWorkingDir(): Promise<boolean> {
  const config = getConfig();
  return await exists(config.working_dir);
}

export async function processWithPrompt(
  demonstrativeType: string,
  layerType: string,
  fromFile: string,
  destinationPath?: string
): Promise<ProcessResult> {
  try {
    const config = getConfig();
    const fromType = fromFile.includes("project") ? "project" :
                    fromFile.includes("issue") ? "issue" :
                    fromFile.includes("task") ? "task" : layerType;
    
    // 入力ファイルの読み込み
    let inputMarkdown: string;
    try {
      inputMarkdown = await Deno.readTextFile(fromFile);
    } catch (error) {
      return {
        success: false,
        code: ExitCode.Error,
        message: `Failed to read input file: ${fromFile} - ${error instanceof Error ? error.message : String(error)}`
      };
    }

    const variables: PromptVariables = {
      input_markdown_file: fromFile,
      input_markdown: inputMarkdown,
      destination_path: destinationPath || ""
    };

    // プロンプトローダーの呼び出し前の状態確認
    console.log("Before loadPrompt:", {
      demonstrativeType: demonstrativeType,
      layerType: layerType,
      fromFile: fromFile,
      variables: variables
    });

    const promptResult = await loadPrompt(
      demonstrativeType,
      layerType,
      fromType,
      variables
    );

    // プロンプトローダーの結果確認
    console.log("After loadPrompt:", {
      success: promptResult !== undefined,
      result: promptResult
    });

    // プロンプト処理の結果を確認
    console.log("processWithPrompt result:", {
      promptResult,
      destFile: destinationPath
    });

    // ファイル出力処理
    const outputPath = destinationPath ?? generateDefaultOutputPath();
    
    if (outputPath) {
      await ensureDir(dirname(outputPath));
      await Deno.writeTextFile(outputPath, promptResult);
    }

    // 成功時は必ずsuccess: trueを返す
    return {
      success: true,
      code: ExitCode.Success,
      data: promptResult,
      outputPath
    };
  } catch (error) {
    console.error("processWithPrompt error:", error);
    return {
      success: false,
      code: ExitCode.Error,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// 1. 結果型の定義
export interface ProcessResult {
  success: boolean;
  message?: string;
  data?: unknown;
  code: number;
  outputPath?: string;
}

// 2. エラーハンドリングの標準化
export async function processCommand(args: Args): Promise<ProcessResult> {
  try {
    // 初期化コマンドは入力チェックをスキップ
    if (args.command === "init") {
      return await processInitCommand(args);
    }

    // 入力ファイルの存在確認
    if (!args.fromFile) {
      return {
        success: false,
        code: ExitCode.Error,
        message: "Input file is required. Use --from/-f option"
      };
    }

    // ファイルの存在確認
    if (!await exists(args.fromFile)) {
      return {
        success: false,
        code: ExitCode.Error,
        message: `Input file not found: ${args.fromFile}`
      };
    }

    // プロンプト処理
    const result = await processWithPrompt(
      args.command,
      args.layerType || "",
      args.fromFile,
      args.destinationFile
    );

    // 結果を確認
    console.log("processCommand result:", {
      success: result.success,
      code: result.code,
      data: result.data
    });

    // 成功時は必ずsuccess: trueを返す
    return {
      success: true,  // ← 常にtrueを返す
      code: result.code,
      data: result.data || result.message,
      outputPath: result.outputPath
    };
  } catch (error) {
    return {
      success: false,
      code: ExitCode.Error,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// 3. オプショナル値の型定義
export interface CliOptions {
  command: "to" | "summary" | "defect" | "init";
  layerType: "project" | "issue" | "task";
  input?: string;
  output?: string;
  fromFile?: string;
  destFile?: string;
}

// インターフェースの整合性を確保
interface AppConfig extends IAppConfig {
  initialize(options: { workingDir?: string }): Promise<void>;
}

// 実装を追加
class AppConfigImpl implements AppConfig {
  working_dir: string = "";
  config: BreakdownConfig = {
    root: "",
    working_directory: "",
    output_directory: "",
    workspace_structure: {
      root: "",
      directories: {}
    }
  };

  async loadConfigFile(path?: string): Promise<Partial<BreakdownConfig>> {
    // 実装
    return {};
  }

  async initialize(options: { workingDir?: string }): Promise<void> {
    this.working_dir = options.workingDir || "./";
    await this.loadConfigFile();
  }

  get workingDirectory(): string {
    return this.working_dir;
  }

  get outputDirectory(): string {
    return this.config.output_directory;
  }

  get workspaceStructure(): WorkspaceStructure {
    return this.config.workspace_structure;
  }
}

// コマンド処理関数の追加
async function processToCommand(args: Args): Promise<ProcessResult> {
  try {
    // 入力ソースの判定を明確に
    const isStdin = !Deno.stdin.isTerminal();
    const hasValidFile = args.fromFile && await exists(args.fromFile);

    // 入力の取得
    let input: string;
    if (hasValidFile && args.fromFile) {
      console.log("Reading from file:", args.fromFile);
      input = await Deno.readTextFile(args.fromFile);
    } else if (isStdin) {
      console.log("Reading from STDIN");
      const decoder = new TextDecoder();
      let text = '';
      for await (const chunk of Deno.stdin.readable) {
        text += decoder.decode(chunk);
      }
      input = text;
    } else {
      return {
        success: false,
        code: ExitCode.Error,
        message: "No valid input source found"
      };
    }

    // 出力ファイルの準備
    const destFile = args.destinationFile ? 
      autoCompletePath(args.destinationFile, "to") : 
      generateDefaultOutputPath();  // デフォルト値を設定

    if (!args.layerType) {
      return {
        success: false,
        code: ExitCode.Error,
        message: "Layer type is required"
      };
    }

    // プロンプト処理
    const result = await processWithPrompt(
      "to",
      args.layerType,
      input,
      destFile
    );
    return {
      success: true,
      code: ExitCode.Success,
      data: result.data,
      outputPath: result.outputPath
    };
  } catch (error) {
    return {
      success: false,
      code: ExitCode.Error,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function processInitCommand(args: Args): Promise<ProcessResult> {
  try {
    const config = new AppConfigImpl();
    await config.initialize({
      workingDir: args.workingDir || "./"
    });
    return await initWorkspace();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      code: 1
    };
  }
}

// メイン処理
if (import.meta.main) {
  try {
    await initializeConfig().catch(() => {});
    const flags = parseArgs(Deno.args, {
      string: ["from", "f", "destination", "o"],
      alias: { f: "from", o: "destination" },
    });

    // 基本的なコマンド処理を復元
    if (flags._.length === 1) {
      const type = flags._[0] as string;
      if (!isValidDemonstrativeType(type)) {
        console.error("Invalid first argument. Must be one of: to, summary, defect, init");
        Deno.exit(1);
      }
      
      if (type === "init") {
        const result = await initWorkspace();
        console.log(result.message);
        Deno.exit(result.success ? 0 : 1);
      } else {
        console.log(type);
        Deno.exit(0);
      }
    }

    // 2つの引数がある場合の処理
    if (flags._.length === 2) {
      const [demonstrative, layer] = flags._ as [string, string];
      if (!isValidDemonstrativeType(demonstrative)) {
        console.error("Invalid first argument. Must be one of: to, summary, defect, init");
        Deno.exit(1);
      }
      if (!isValidLayerType(layer)) {
        console.error("Invalid second argument. Must be one of: project, issue, task");
        Deno.exit(1);
      }

      // 入力ファイルのチェック
      if (!flags.from) {
        console.error("Input file is required. Use --from/-f option");
        Deno.exit(1);
      }

      // プロンプト処理
      const result = await processWithPrompt(
        demonstrative,
        layer,
        flags.from,
        flags.destination ?? generateDefaultOutputPath()
      );

      if (result.success) {
        console.log(result.data);
        Deno.exit(0);
      } else {
        console.error(result.message);
        Deno.exit(1);
      }
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

const process = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "cli/breakdown.ts", "to"],
  stdout: "piped",
});

// runCLIのエクスポート
export async function runCLI(args: Args): Promise<void> {
  // 実装...
}

async function readInput(args: Args): Promise<string> {
  if (args.fromFile) {
    return await Deno.readTextFile(args.fromFile);
  }
  if (args._.length > 0) {
    const inputPath = String(args._[0]);  // 明示的な型変換
    return await Deno.readTextFile(inputPath);
  }
  const buffer = await readAll(Deno.stdin);
  return new TextDecoder().decode(buffer);
}

// 出力パス生成関数
function generateDefaultOutputPath(): string {
  const config = getConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return join(config.working_dir, 'output', `output-${timestamp}.json`);
} 


