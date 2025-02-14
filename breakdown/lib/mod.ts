import { Config } from "../config/config.ts";
import { WorkspaceStructure } from "../config/types.ts";

export async function toJSON(type: "project" | "issue" | "task", input: string, output: string) {
  if (!isValidLayerType(type)) {
    throw new Error("Invalid layer type");
  }
  // Implementation
  return { success: true };
}

export async function toMarkdown(type: "project" | "issue" | "task", input: string, output: string) {
  if (!isValidLayerType(type)) {
    throw new Error("Invalid layer type");
  }
  // Implementation
  return { success: true };
}

export function isValidLayerType(type: string): type is "project" | "issue" | "task" {
  return ["project", "issue", "task"].includes(type);
} 