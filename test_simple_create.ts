import { PromptVariablesFactory } from "./lib/factory/prompt_variables_factory.ts";

const cliParams = {
  demonstrativeType: "find" as const,
  layerType: "bugs" as const,
  options: {
    fromFile: "test_input.txt",
    destinationFile: "output.md",
  },
};

try {
  console.log("Creating PromptVariablesFactory...");
  const factory = await PromptVariablesFactory.create(cliParams);
  console.log("Success\! Validating...");
  factory.validateAll();
  console.log("Validation successful. Getting params...");
  const { promptFilePath, inputFilePath } = factory.getAllParams();
  console.log("Prompt file path:", promptFilePath);
  console.log("Input file path:", inputFilePath);
} catch (error) {
  console.error("Error:", error);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
}
