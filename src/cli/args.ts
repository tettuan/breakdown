import { Args, CommandOptions, CommandRecord } from "./types.ts";
import { ERROR_MESSAGES } from "./constants.ts";
import { Command } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
import { version } from "@/version.ts";
import { ParseResult } from "./types.ts";

const VALID_DEMONSTRATIVE_TYPES = ["to", "summary", "defect", "init"];
const VALID_LAYER_TYPES = ["project", "issue", "task"];

const VALID_INPUT_LAYER_TYPES = {
  project: ["project", "pj", "prj"],
  issue: ["issue", "story"],
  task: ["task", "todo", "chore", "style", "fix", "error", "bug"]
};

function validateInputLayerType(input: string): string | undefined {
  const lowercaseInput = input.toLowerCase();
  for (const [type, aliases] of Object.entries(VALID_INPUT_LAYER_TYPES)) {
    if (aliases.includes(lowercaseInput)) {
      return type;
    }
  }
  return undefined;
}

function inferLayerTypeFromPath(path: string): string | undefined {
  const lowercasePath = path.toLowerCase();
  for (const [type, aliases] of Object.entries(VALID_INPUT_LAYER_TYPES)) {
    if (aliases.some(alias => lowercasePath.includes(alias))) {
      return type;
    }
  }
  return undefined;
}

function generateDestinationFile(empty: boolean): string | undefined {
  if (!empty) return undefined;
  
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hash = Math.random().toString(16).slice(2, 8);
  return `${date}_${hash}.md`;
}

function validateInitCommand(args: string[]): Args {
  return {
    command: "init",
    _: args
  };
}

function validateUseCaseCommand(args: string[]): Args {
  const result: Args = {
    command: args[0],
    _: args
  };

  // コマンドのバリデーション
  if (!VALID_DEMONSTRATIVE_TYPES.includes(result.command)) {
    return { 
      command: result.command, 
      error: ERROR_MESSAGES.INVALID_DEMONSTRATIVE,
      _: args 
    };
  }

  // LayerType は必須
  if (args.length <= 1) {
    return { 
      command: result.command, 
      error: ERROR_MESSAGES.LAYER_REQUIRED,
      _: args 
    };
  }

  // LayerType の検証
  const layerType = args[1];
  if (!VALID_LAYER_TYPES.includes(layerType)) {
    return { 
      command: result.command, 
      error: ERROR_MESSAGES.INVALID_LAYER,
      _: args 
    };
  }
  result.layerType = layerType;

  // オプション処理
  const options = parseCommandOptions(args);
  return { ...result, ...options };
}

// 1. コマンドオプションの解析
function parseCommandOptions(args: string[]): Partial<Args> {
  const result: Partial<Args> = {};

  // Handle destination file option
  const destIndex = args.indexOf("--destination");
  const destAliasIndex = args.indexOf("-o");
  const destArgIndex = destIndex !== -1 ? destIndex : destAliasIndex;
  
  if (destArgIndex !== -1) {
    const hasValue = args.length > destArgIndex + 1 && !args[destArgIndex + 1].startsWith("-");
    result.destinationFile = hasValue ? args[destArgIndex + 1] : generateDestinationFile(true);
  }

  // Handle from file option
  const fromIndex = args.indexOf("--from");
  const fromAliasIndex = args.indexOf("-f");
  const fromArgIndex = fromIndex !== -1 ? fromIndex : fromAliasIndex;
  
  if (fromArgIndex !== -1 && args.length > fromArgIndex + 1) {
    result.fromFile = args[fromArgIndex + 1];
  }

  // 入力レイヤータイプの推論
  if (result.fromFile) {
    result.inputLayerType = inferLayerTypeFromPath(result.fromFile);
  }

  // 明示的な入力レイヤータイプ
  const inputIndex = args.indexOf("-i");
  if (inputIndex !== -1 && args.length > inputIndex + 1) {
    const inputType = validateInputLayerType(args[inputIndex + 1]);
    if (inputType) {
      result.inputLayerType = inputType;
    }
  }

  return result;
}

// 2. フォーマットオプションの解析
function parseFormatOptions(args: string[]): CommandOptions {
  const options: CommandOptions = {
    _: []  // 初期値を設定
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("-")) {
      const key = arg.replace(/^-+/, "");
      const value = args[i + 1];
      
      if (key === "format" && isValidFormat(value)) {
        options.format = value;
      } else {
        // 型安全な変換
        const record = options as unknown as CommandRecord;
        record[key] = value;
      }
      i++;
    } else {
      options._.push(arg);
    }
  }
  
  return options;
}

function isValidFormat(value: string): value is "json" | "md" {
  return ["json", "md"].includes(value);
}

// 1. 型ガード関数
function isDemonstrativeType(type: string): boolean {
  return ["to", "summary", "defect", "init"].includes(type);
}

function isLayerType(type: string): boolean {
  return ["project", "issue", "task"].includes(type);
}

// 2. パーサー関数の型安全化
export function parseArgs(args: string[]): Args {
  const result: Args = {
    command: args[0] || "",
    _: args,
  };

  if (args.length === 0) {
    result.error = ERROR_MESSAGES.NO_ARGS;
    return result;
  }

  // initコマンドの特別処理
  if (result.command === "init") {
    return result;
  }

  // コマンドの検証
  if (!isDemonstrativeType(result.command)) {
    result.error = ERROR_MESSAGES.INVALID_DEMONSTRATIVE;
    return result;
  }

  // レイヤータイプが必須
  if (args.length === 1) {
    result.error = ERROR_MESSAGES.LAYER_REQUIRED;
    return result;
  }

  // レイヤータイプの検証
  const layerType = args[1];
  if (!isLayerType(layerType)) {
    result.error = ERROR_MESSAGES.INVALID_LAYER;
    return result;
  }
  result.layerType = layerType;

  // オプション処理
  const options = parseCommandOptions(args);
  return { ...result, ...options };
}

// 3. オプション解析の型安全化
function parseOptions(args: string[]): CommandOptions {
  const options: CommandOptions = {
    _: []  // 必須プロパティを初期化
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") || arg.startsWith("-")) {
      const key = arg.replace(/^-+/, "");
      const value = args[i + 1];
      if (value && !value.startsWith("-")) {
        if (key === "format" && isValidFormat(value)) {
          options.format = value;
        } else {
          // 型安全な変換
          const record = options as unknown as CommandRecord;
          record[key] = value;
        }
        i++;
      }
    } else {
      options._.push(arg);  // 非オプション引数を配列に追加
    }
  }

  return options;
}

export function createCommand(): Command {
  const command = new Command()
    .name("breakdown")
    .version(version)
    .description("Markdown to JSON converter for AI development");

  command
    .option("-i, --input <type:string>", "Input type")
    .option("-o, --output <path:string>", "Output path")
    .option("-f, --from <path:string>", "Input file path");

  return command;
} 