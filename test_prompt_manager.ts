import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.1.2";

const template =
  "# Test Template\n\nInput: {input_text_file}\nContent: {input_text}\nOutput: {destination_path}";
const variables = {
  input_text_file: "test_input.txt",
  input_text: "function test() { console.log('hello'); }",
  destination_path: "output.md",
};

try {
  console.log("Testing PromptManager...");
  console.log("Template:", template);
  console.log("Variables:", variables);

  const prompt = new PromptManager();
  const result = await prompt.generatePrompt(template, variables);
  console.log("Result:", result);
} catch (error) {
  console.error("Error:", error);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
}
