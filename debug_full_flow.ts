import { PromptFileGenerator } from "./lib/commands/prompt_file_generator.ts";

const generator = new PromptFileGenerator();

const options = {
  adaptation: undefined,
  promptDir: undefined,
  demonstrativeType: "find",
  input_text: undefined,
};

try {
  console.log("Starting generateWithPrompt...");
  const result = await generator.generateWithPrompt(
    "test_input.txt",
    "output.md",
    "bugs",
    false,
    options,
  );
  console.log("Result:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("Error:", error);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
}
