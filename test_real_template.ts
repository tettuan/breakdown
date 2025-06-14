import { PromptManager } from "jsr:@tettuan/breakdownprompt@1.1.2";
import { basename } from "@std/path/basename";

// Read the actual template
const promptFilePath = "prompts/find/bugs/f_bugs.md";
const inputFilePath = "test_input.txt";
const outputFilePath = "output.md";

try {
  console.log("Reading template...");
  const template = await Deno.readTextFile(promptFilePath);
  console.log("Template length:", template.length);

  console.log("Reading input file...");
  const inputText = await Deno.readTextFile(inputFilePath);
  console.log("Input text length:", inputText.length);

  const variables = {
    input_text_file: basename(inputFilePath),
    input_text: inputText,
    destination_path: outputFilePath,
  };

  console.log("Variables:", JSON.stringify(variables, null, 2));

  console.log("Creating PromptManager...");
  const prompt = new PromptManager();

  console.log("Generating prompt...");
  const result = await prompt.generatePrompt(template, variables);
  console.log("Success:", result.success);
  if (result.success === false) {
    console.error("Error:", result.error);
  } else {
    console.log("Generated prompt length:", result.prompt?.length);
  }
} catch (error) {
  console.error("Error:", error);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
}
