import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.1.2";

const template = "# Simple Template\n\nInput: {input_text}\nOutput: {destination_path}";
const variables = {
  input_text: "test content",
  destination_path: "output.md",
};

try {
  console.log("Testing simple template...");
  const prompt = new PromptManager();
  const result = await prompt.generatePrompt(template, variables);
  console.log("Success:", result.success);
  if (result.success === false) {
    console.error("Error:", result.error);
  }
} catch (error) {
  console.error("Error:", error);
}
