import type { ConversionResult } from "../mod.ts";

// Convert free text to structured Markdown
// Takes a type (project/issue/task) and converts the input text into a formatted Markdown document
export async function toMarkdown(
  type: "project" | "issue" | "task",
  input: string,
  output: string
): Promise<ConversionResult> {
  // Validate command type first
  if (type !== "project" && type !== "issue" && type !== "task") {
    throw new Error("Invalid subcommand");
  }

  try {
    let data;
    switch (type) {
      case "project":
        data = await convertToProjectMarkdown(input, output);
        break;
      case "issue":
        data = await convertToIssueMarkdown(input, output);
        break;
      case "task":
        data = await convertToTaskMarkdown(input, output);
        break;
    }
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Helper functions to convert specific types of text to Markdown format
async function convertToProjectMarkdown(input: string, _output: string): Promise<string> {
  const data = JSON.parse(input);
  return `# ${data.title}\n\n${data.overview || ""}`;
}

async function convertToIssueMarkdown(input: string, _output: string): Promise<string> {
  const data = JSON.parse(input);
  return `# ${data.title}\n\n${data.description || ""}`;
}

async function convertToTaskMarkdown(input: string, _output: string): Promise<string> {
  const data = JSON.parse(input);
  return `# ${data.title}\n\n${data.steps?.join("\n") || ""}`;
} 