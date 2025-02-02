export interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export * from "./types/mod.ts";
export * from "./lib/to.ts";
export * from "./lib/summary.ts"; 