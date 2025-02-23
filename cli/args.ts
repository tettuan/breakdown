export interface Args {
  command?: string;
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

export function parseArgs(args: string[]): Args {
  if (args.length === 0) {
    return { error: "No arguments provided" };
  }

  const result: Args = {};

  const demonstrativeType = args[0];
  if (!VALID_DEMONSTRATIVE_TYPES.includes(demonstrativeType)) {
    return { error: "Invalid DemonstrativeType" };
  }
  result.command = demonstrativeType;

  if (args.length > 1 && demonstrativeType !== "init") {
    const layerType = args[1];
    if (!VALID_LAYER_TYPES.includes(layerType)) {
      return { error: "Invalid LayerType" };
    }
    result.layerType = layerType;
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
      return { error: "Invalid input layer type" };
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