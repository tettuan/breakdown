type Args = {
  demonstrativeType?: string;
  layerType?: string;
  fromFile?: string;
  destinationFile?: string;
  error?: string;
};

const VALID_DEMONSTRATIVE_TYPES = ["to", "summary", "defect", "init"];
const VALID_LAYER_TYPES = ["project", "issue", "task"];

export function parseArgs(args: string[]): Args {
  if (args.length === 0) {
    return { error: "No arguments provided" };
  }

  const demonstrativeType = args[0];
  if (!VALID_DEMONSTRATIVE_TYPES.includes(demonstrativeType)) {
    return { error: "Invalid DemonstrativeType" };
  }

  const result: Args = { demonstrativeType };

  if (args.length > 1 && demonstrativeType !== "init") {
    const layerType = args[1];
    if (!VALID_LAYER_TYPES.includes(layerType)) {
      return { error: "Invalid LayerType" };
    }
    result.layerType = layerType;
  }

  return result;
} 