/**
 * Example usage of PromptVariables following Totality Principle
 * 
 * This example demonstrates how to use the type-safe prompt variables
 * to integrate with @tettuan/breakdownprompt package.
 * 
 * @example
 */

import {
  StandardVariable,
  FilePathVariable,
  StdinVariable,
  UserVariable,
  type PromptVariables,
  createPromptParams
} from "$lib/types/mod.ts";

/**
 * Example: Creating typed prompt variables
 */
function createExampleVariables(): PromptVariables {
  const variables: PromptVariables = [];

  // Standard variables - only accepts predefined names
  const inputFile = StandardVariable.create("input_text_file", "/path/to/input.txt");
  if (inputFile) {
    variables.push(inputFile);
  }

  const destinationPath = StandardVariable.create("destination_path", "/output/path");
  if (destinationPath) {
    variables.push(destinationPath);
  }

  // File path variables - for schema files
  const schemaFile = FilePathVariable.create("schema_file", "/schemas/task.json");
  if (schemaFile) {
    variables.push(schemaFile);
  }

  // Stdin variables - for direct input content
  const inputText = StdinVariable.create("input_text", "Hello, this is input content");
  if (inputText) {
    variables.push(inputText);
  }

  // User variables - for custom configuration (e.g., --uv-*)
  const customOption = UserVariable.create("debug_mode", "true");
  if (customOption) {
    variables.push(customOption);
  }

  return variables;
}

/**
 * Example: Creating PromptParams for @tettuan/breakdownprompt
 */
function createExamplePromptParams() {
  const variables = createExampleVariables();
  
  // Create PromptParams compatible with @tettuan/breakdownprompt
  const promptParams = createPromptParams(
    "/templates/task-breakdown.md",
    variables
  );

  console.log("Created PromptParams:", promptParams);
  
  // The resulting promptParams will have this structure:
  // {
  //   template_file: "/templates/task-breakdown.md",
  //   variables: {
  //     "input_text_file": "/path/to/input.txt",
  //     "destination_path": "/output/path",
  //     "schema_file": "/schemas/task.json",
  //     "input_text": "Hello, this is input content",
  //     "debug_mode": "true"
  //   }
  // }

  return promptParams;
}

/**
 * Example: Type safety demonstration
 */
function demonstrateTypeSafety() {
  // ✅ Valid: predefined standard variable names
  const validStandard = StandardVariable.create("input_text_file", "value");
  console.log("Valid standard variable:", validStandard?.toRecord());

  // ❌ Invalid: undefined standard variable name returns null
  const invalidStandard = StandardVariable.create("invalid_name", "value");
  console.log("Invalid standard variable:", invalidStandard); // null

  // ✅ Valid: predefined file path variable names
  const validFilePath = FilePathVariable.create("schema_file", "/path/to/schema");
  console.log("Valid file path variable:", validFilePath?.toRecord());

  // ❌ Invalid: undefined file path variable name returns null
  const invalidFilePath = FilePathVariable.create("invalid_file", "/path");
  console.log("Invalid file path variable:", invalidFilePath); // null

  // ✅ Valid: predefined stdin variable names
  const validStdin = StdinVariable.create("input_text", "content");
  console.log("Valid stdin variable:", validStdin?.toRecord());

  // ❌ Invalid: undefined stdin variable name returns null
  const invalidStdin = StdinVariable.create("invalid_input", "content");
  console.log("Invalid stdin variable:", invalidStdin); // null

  // ✅ Valid: any user variable with non-empty name and value
  const validUser = UserVariable.create("custom_key", "custom_value");
  console.log("Valid user variable:", validUser?.toRecord());

  // ❌ Invalid: empty name or value returns null
  const invalidUser = UserVariable.create("", "value");
  console.log("Invalid user variable:", invalidUser); // null
}

// Run examples if this file is executed directly
if (import.meta.main) {
  console.log("=== PromptVariables Example ===\n");
  
  console.log("1. Creating example variables:");
  const variables = createExampleVariables();
  console.log(`Created ${variables.length} variables\n`);
  
  console.log("2. Creating PromptParams:");
  createExamplePromptParams();
  console.log();
  
  console.log("3. Type safety demonstration:");
  demonstrateTypeSafety();
}
