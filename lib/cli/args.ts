import { parse } from "../../deps.ts";

export interface Args {
  command: string;
  layerType?: string;
  fromFile?: string;
  destinationFile?: string;
  inputLayerType?: string;
  error?: string;
}

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

// Error messages
export const ERROR_MESSAGES = {
  NO_ARGS: "No arguments provided",
  INVALID_DEMONSTRATIVE: "Invalid DemonstrativeType",
  INVALID_LAYER: "Invalid LayerType",
  LAYER_REQUIRED: "LayerType is required",
  INVALID_INPUT: "Invalid input layer type"
} as const;

function generateDestinationFile(empty: boolean): string | undefined {
  if (!empty) return undefined;
  
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const hash = Math.random().toString(16).slice(2, 8);
  return `${date}_${hash}.md`;
}

function validateInitCommand(args: string[]): Args {
  return {
    command: "init"
  };
}

function validateUseCaseCommand(args: string[]): Args {
  const result: Args = {
    command: args[0]
  };

  // コマンドのバリデーション
  if (!VALID_DEMONSTRATIVE_TYPES.includes(result.command)) {
    return { command: result.command, error: ERROR_MESSAGES.INVALID_DEMONSTRATIVE };
  }

  // LayerType は必須
  if (args.length <= 1) {
    return { command: result.command, error: ERROR_MESSAGES.LAYER_REQUIRED };
  }

  // LayerType の検証
  const layerType = args[1];
  if (!VALID_LAYER_TYPES.includes(layerType)) {
    return { command: result.command, error: ERROR_MESSAGES.INVALID_LAYER };
  }
  result.layerType = layerType;

  // オプション処理
  const options = parseOptions(args);
  if (options.error) {
    return { command: result.command, error: options.error };
  }

  return { ...result, ...options };
}

function parseOptions(args: string[]): Partial<Args> {
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

  // Handle input layer type
  const inputIndex = args.indexOf("--input");
  const aliasIndex = args.indexOf("-i");
  const inputArgIndex = inputIndex !== -1 ? inputIndex : aliasIndex;
  
  if (inputArgIndex !== -1 && args.length > inputArgIndex + 1) {
    const inputType = validateInputLayerType(args[inputArgIndex + 1]);
    if (!inputType) {
      return { error: ERROR_MESSAGES.INVALID_INPUT };
    }
    result.inputLayerType = inputType;
  } else if (result.fromFile) {
    // Infer layer type from file path when --input is not provided
    const inferredType = inferLayerTypeFromPath(result.fromFile);
    if (inferredType) {
      result.inputLayerType = inferredType;
    }
  }

  return result;
}

export function parseArgs(args: string[]): Args {
  if (args.length === 0) {
    return { command: "", error: ERROR_MESSAGES.NO_ARGS };
  }

  // init コマンドの場合は別処理
  if (args[0] === "init") {
    return validateInitCommand(args);
  }

  // その他のユースケース
  return validateUseCaseCommand(args);
} 