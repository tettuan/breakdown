/**
 * Unit tests for PromptAdapterImpl
 *
 * Tests the core functionality of PromptAdapterImpl including:
 * - Custom variables integration in generatePrompt()
 * - Path validation behavior
 * - Error handling for file operations
 */

import { assertEquals } from "../../deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptAdapterImpl } from "./prompt_adapter.ts";
import { PromptVariablesFactory } from "../factory/prompt_variables_factory.ts";

const _logger = new BreakdownLogger("prompt-adapter");

// Test factory mock that provides custom variables
class TestPromptVariablesFactory {
  private _customVariables: Record<string, string>;
  public _allParams: unknown;
  private _options: unknown;

  constructor(customVariables: Record<string, string> = {}) {
    this._customVariables = customVariables;
    this._allParams = {
      promptFilePath: "/test/prompt.md",
      inputFilePath: "/test/input.txt",
      outputFilePath: "/test/output.md",
      schemaFilePath: "/test/schema.json",
      customVariables: customVariables,
    };
    this._options = {};
  }

  getAllParams() {
    return this._allParams;
  }

  getOptions() {
    return this._options;
  }

  get customVariables() {
    return this._customVariables;
  }

  hasValidBaseDir() {
    return true;
  }

  getBaseDirError() {
    return undefined;
  }
}

// Create test files in temp directory
async function createTestFile(path: string, content: string): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(path, content);
}

// Clean up test files
async function cleanupTestFiles(...paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await Deno.remove(path);
    } catch {
      // Ignore errors
    }
  }
}

Deno.test({
  name: "PromptAdapterImpl - generatePrompt includes custom variables",
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const promptPath = `${tempDir}/prompt.md`;
    const inputPath = `${tempDir}/input.txt`;

    try {
      // Create test files
      await createTestFile(
        promptPath,
        "Hello {project_name}, version {version}. Input: {input_text}",
      );
      await createTestFile(inputPath, "Test input content");

      // Create factory with custom variables
      const customVariables = {
        project_name: "TestProject",
        version: "1.0.0",
      };

      const _factory = new TestPromptVariablesFactory(customVariables);
      _factory._allParams.promptFilePath = promptPath;
      _factory._allParams.inputFilePath = inputPath;

      // Create adapter and generate prompt
      const _adapter = new PromptAdapterImpl(factory as unknown);
      const _result = await _adapter.generatePrompt();

      _logger.debug("generatePrompt result with custom variables", result);

      // Verify result includes custom variables
      assertEquals(_result.success, true);
      assertEquals(_result.content.includes("Hello TestProject"), true);
      assertEquals(_result.content.includes("version 1.0.0"), true);
      assertEquals(_result.content.includes("Input: Test input content"), true);
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "PromptAdapterImpl - generatePrompt works without custom variables",
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const promptPath = `${tempDir}/prompt.md`;

    try {
      // Create test file without variable placeholders
      await createTestFile(promptPath, "Simple prompt without variables");

      // Create factory without custom variables
      const _factory = new TestPromptVariablesFactory({});
      _factory._allParams.promptFilePath = promptPath;
      _factory._allParams.inputFilePath = "";

      // Create adapter and generate prompt
      const _adapter = new PromptAdapterImpl(factory as unknown);
      const _result = await _adapter.generatePrompt();

      _logger.debug("generatePrompt result without custom variables", result);

      // Verify result
      assertEquals(_result.success, true);
      assertEquals(_result.content, "Simple prompt without variables");
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "PromptAdapterImpl - generatePrompt handles multiple custom variables",
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const promptPath = `${tempDir}/prompt.md`;

    try {
      // Create test file with multiple variable placeholders
      await createTestFile(
        promptPath,
        "Project: {project_name}, Author: {author}, Date: {date}, Custom: {custom_field}",
      );

      // Create factory with multiple custom variables
      const customVariables = {
        project_name: "MyApp",
        author: "John Doe",
        date: "2024-01-01",
        custom_field: "CustomValue",
      };

      const _factory = new TestPromptVariablesFactory(customVariables);
      _factory._allParams.promptFilePath = promptPath;
      _factory._allParams.inputFilePath = "";

      // Create adapter and generate prompt
      const _adapter = new PromptAdapterImpl(factory as unknown);
      const _result = await _adapter.generatePrompt();

      _logger.debug("generatePrompt result with multiple custom variables", result);

      // Verify all variables are replaced
      assertEquals(_result.success, true);
      assertEquals(_result.content.includes("Project: MyApp"), true);
      assertEquals(_result.content.includes("Author: John Doe"), true);
      assertEquals(_result.content.includes("Date: 2024-01-01"), true);
      assertEquals(_result.content.includes("Custom: CustomValue"), true);
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});

Deno.test({
  name: "PromptAdapterImpl - custom variables override default variables",
  async fn() {
    const tempDir = await Deno.makeTempDir();
    const promptPath = `${tempDir}/prompt.md`;
    const inputPath = `${tempDir}/input.txt`;

    try {
      // Create test files
      await createTestFile(
        promptPath,
        "Input file: {input_text_file}, Destination: {destination_path}",
      );
      await createTestFile(inputPath, "Test content");

      // Create factory with custom variables that override defaults
      const customVariables = {
        input_text_file: "custom_input.txt",
        destination_path: "/custom/path",
      };

      const _factory = new TestPromptVariablesFactory(customVariables);
      _factory._allParams.promptFilePath = promptPath;
      _factory._allParams.inputFilePath = inputPath;
      _factory._allParams.outputFilePath = "/default/output.md";

      // Create adapter and generate prompt
      const _adapter = new PromptAdapterImpl(factory as unknown);
      const _result = await _adapter.generatePrompt();

      _logger.debug("generatePrompt result with overriding custom variables", result);

      // Verify custom variables override defaults
      assertEquals(_result.success, true);
      assertEquals(_result.content.includes("Input file: custom_input.txt"), true);
      assertEquals(_result.content.includes("Destination: /custom/path"), true);
    } finally {
      await Deno.remove(tempDir, { recursive: true });
    }
  },
});
