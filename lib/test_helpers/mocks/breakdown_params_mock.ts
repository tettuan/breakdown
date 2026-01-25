/**
 * BreakdownParams Mock
 * Mock implementation of breakdownParams for testing
 */

import type { ParamsCustomConfig } from "$lib/config/params_custom_config.ts";

export interface TwoParams {
  directive: string;
  layer: string;
  profile: string;
}

export interface ParamsError {
  message: string;
  directive?: string;
  layer?: string;
}

export interface BreakdownParamsResult {
  type: "two" | "error";
  params?: TwoParams;
  error?: ParamsError;
}

export function breakdownParams(
  args: string[],
  customConfig?: ParamsCustomConfig,
): BreakdownParamsResult {
  // Simple validation implementation
  if (args.length < 2) {
    return { type: "error", error: { message: "Not enough arguments" } };
  }

  const [directive, layer] = args;

  // Get patterns from custom config
  const directivePattern = customConfig?.directivePattern || "^(to|summary|defect)$";
  const layerPattern = customConfig?.layerPattern || "^(project|issue|task|bugs)$";

  // Pattern check (simple version)
  const directiveValid = new RegExp(directivePattern).test(directive);
  const layerValid = new RegExp(layerPattern).test(layer);

  if (!directiveValid || !layerValid) {
    return {
      type: "error",
      error: {
        message: `Invalid ${!directiveValid ? "directive" : "layer"}`,
        directive: !directiveValid ? directive : undefined,
        layer: !layerValid ? layer : undefined,
      },
    };
  }

  return {
    type: "two",
    params: {
      directive,
      layer,
      profile: "default",
    },
  };
}
