export * from "./to.ts";
export * from "./summary.ts";

export interface ConversionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function toJSON(
  type: "project" | "issue" | "task",
  input: string,
  output: string
): Promise<ConversionResult> {
  // 実装
  return { success: true, data: {} };
}

export async function toMarkdown(
  type: "project" | "issue" | "task",
  input: string,
  output: string
): Promise<ConversionResult> {
  // 実装
  return { success: true, data: "" };
} 