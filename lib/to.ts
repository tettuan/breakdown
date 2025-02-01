// Markdown to JSON conversion
export async function toJSON(
  type: "project" | "issue" | "task",
  input: string,
  output: string,
): Promise<void> {
  switch (type) {
    case "project":
      await convertProjectToJSON(input, output);
      break;
    case "issue":
      await convertIssueToJSON(input, output);
      break;
    case "task":
      await convertTaskToJSON(input, output);
      break;
  }
}

async function convertProjectToJSON(input: string, outputDir: string): Promise<void> {
  // TODO: Implement project markdown to JSON conversion
}

async function convertIssueToJSON(input: string, outputDir: string): Promise<void> {
  // TODO: Implement issue markdown to JSON conversion
}

async function convertTaskToJSON(input: string, outputDir: string): Promise<void> {
  // TODO: Implement task markdown to JSON conversion
} 