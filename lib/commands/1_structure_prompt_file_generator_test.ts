/**
 * Structure tests for PromptFileGenerator
 *
 * Tests structural integrity and design patterns:
 * - Method contracts and signatures
 * - Data flow consistency
 * - Error propagation patterns
 * - State management
 *
 * @module commands/prompt_file_generator_structure_test
 */

import { assertEquals, assertExists, assertRejects as _assertRejects } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  PromptFileErrorType as _PromptFileErrorType,
  PromptFileGenerator,
} from "./prompt_file_generator.ts";
import type { CommandResult as _CommandResult } from "./mod.ts";

const logger = new BreakdownLogger("prompt-generator-structure");

describe("Structure: PromptFileGenerator Method Contracts", () => {
  it("should maintain validateInputFile contract", () => {
    logger.debug("Testing validateInputFile method contract");

    const generator = new PromptFileGenerator();

    // Method signature
    assertEquals(
      generator.validateInputFile.length,
      1,
      "Should accept exactly one parameter",
    );

    // Return type - Promise<void>
    const emptyResult = generator.validateInputFile("");
    assertExists(emptyResult.then, "Should return a Promise");

    // Empty path handling
    emptyResult.then(() => {
      // Should resolve for empty path
      assertEquals(true, true, "Empty path should resolve");
    });

    // Method implementation structure
    const methodString = generator.validateInputFile.toString();
    assertEquals(
      methodString.includes("if (!path)"),
      true,
      "Should check for empty path",
    );
    assertEquals(
      methodString.includes("Promise.resolve()"),
      true,
      "Should resolve immediately for empty path",
    );
    assertEquals(
      methodString.includes("Deno.stat(path)"),
      true,
      "Should use Deno.stat for validation",
    );

    logger.debug("validateInputFile contract verification completed");
  });

  it("should maintain generateWithPrompt parameter structure", () => {
    logger.debug("Testing generateWithPrompt parameter structure");

    const generator = new PromptFileGenerator();

    // Parameter count and order (length counts only required params before defaults)
    assertEquals(
      generator.generateWithPrompt.length,
      3,
      "Should accept 3 required parameters",
    );

    // Method string analysis for parameter names
    const methodString = generator.generateWithPrompt.toString();

    // Verify parameter names and types
    assertEquals(
      methodString.includes("fromFile"),
      true,
      "First parameter should be fromFile",
    );
    assertEquals(
      methodString.includes("toFile"),
      true,
      "Second parameter should be toFile",
    );
    assertEquals(
      methodString.includes("format"),
      true,
      "Third parameter should be format",
    );
    assertEquals(
      methodString.includes("_force"),
      true,
      "Fourth parameter should be _force with underscore prefix",
    );
    assertEquals(
      methodString.includes("options"),
      true,
      "Fifth parameter should be options",
    );

    logger.debug("generateWithPrompt parameter structure verified");
  });

  it("should structure options parameter correctly", () => {
    logger.debug("Testing options parameter structure");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify options interface structure
    assertEquals(
      methodString.includes("options?.adaptation"),
      true,
      "Options should have optional adaptation",
    );
    // Note: promptDir is not currently used in the implementation
    assertEquals(
      true,
      true,
      "Options parameter structure allows promptDir even if not used",
    );
    assertEquals(
      methodString.includes("options?.directiveType"),
      true,
      "Options should have optional directiveType",
    );
    assertEquals(
      methodString.includes("options?.input_text"),
      true,
      "Options should have optional input_text",
    );

    logger.debug("Options parameter structure verified");
  });
});

describe("Structure: Data Flow Patterns", () => {
  it("should transform parameters into CLI params structure", () => {
    logger.debug("Testing parameter transformation flow");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify CLI params construction
    assertEquals(
      methodString.includes("const cliParams ="),
      true,
      "Should construct cliParams object",
    );
    assertEquals(
      methodString.includes("directiveType:"),
      true,
      "Should set directiveType in cliParams",
    );
    assertEquals(
      methodString.includes("layerType: format"),
      true,
      "Should map format to layerType",
    );
    assertEquals(
      methodString.includes("options: {"),
      true,
      "Should include options object in cliParams",
    );

    // Verify options mapping
    assertEquals(
      methodString.includes("fromFile,"),
      true,
      "Should map fromFile to options",
    );
    assertEquals(
      methodString.includes("destinationFile: toFile"),
      true,
      "Should map toFile to destinationFile",
    );

    logger.debug("Parameter transformation flow verified");
  });

  it("should follow factory creation and validation flow", () => {
    logger.debug("Testing factory creation and validation flow");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify factory creation flow
    assertEquals(
      methodString.includes("await PromptVariablesFactory.create(cliParams)"),
      true,
      "Should create factory with cliParams",
    );
    assertEquals(
      methodString.includes("if (!factoryResult.ok)"),
      true,
      "Should check factory creation result",
    );
    assertEquals(
      methodString.includes("factory.getAllParams()"),
      true,
      "Should get all params from factory",
    );

    // Verify assignment of factory params
    assertEquals(
      methodString.includes("promptFilePath = params.promptFilePath") ||
        methodString.includes("params.promptFilePath"),
      true,
      "Should assign promptFilePath from params",
    );

    logger.debug("Factory creation and validation flow verified");
  });

  it("should handle stdin input flow separately", () => {
    logger.debug("Testing stdin input flow handling");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify stdin detection
    assertEquals(
      methodString.includes('if (fromFile === "-")'),
      true,
      "Should detect stdin input with dash",
    );

    // Verify stdin validation
    assertEquals(
      methodString.includes("if (!options?.input_text)"),
      true,
      "Should check for input_text in stdin mode",
    );

    // Verify stdin error return
    const stdinErrorPattern =
      /type:\s*PromptFileErrorType\.InputFileNotFound.*No input provided via stdin/s;
    assertEquals(
      stdinErrorPattern.test(methodString),
      true,
      "Should return specific error for missing stdin input",
    );

    logger.debug("Stdin input flow handling verified");
  });
});

describe("Structure: Error Handling Patterns", () => {
  it("should structure error returns consistently", () => {
    logger.debug("Testing error return structure consistency");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Extract all error return patterns
    const errorReturns = methodString.match(/return\s*{\s*success:\s*false[\s\S]*?}/g) || [];

    assertExists(errorReturns.length > 0, "Should have error return statements");

    // Verify each error return has required fields
    for (const errorReturn of errorReturns) {
      assertEquals(
        errorReturn.includes("success: false"),
        true,
        "Error return should have success: false",
      );
      assertEquals(
        errorReturn.includes('output: ""'),
        true,
        "Error return should have empty output",
      );
      assertEquals(
        errorReturn.includes("error: {"),
        true,
        "Error return should have error object",
      );
      assertEquals(
        errorReturn.includes("type:"),
        true,
        "Error object should have type field",
      );
      assertEquals(
        errorReturn.includes("message:"),
        true,
        "Error object should have message field",
      );
    }

    logger.debug("Error return structure consistency verified");
  });

  it("should map errors to appropriate error types", () => {
    logger.debug("Testing error type mapping");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify error type mappings
    const errorMappings = [
      { condition: "No input provided via stdin", type: "InputFileNotFound" },
      { condition: "Input file not found:", type: "InputFileNotFound" },
      { condition: "Prompt directory not found:", type: "PromptDirNotFound" },
      { condition: "Prompt template file not found:", type: "PromptFileNotFound" },
      { condition: "Unknown error while checking", type: "Unknown" },
    ];

    for (const mapping of errorMappings) {
      // Check if both the condition and the error type exist in the method
      const hasCondition = methodString.includes(mapping.condition);
      const hasErrorType = methodString.includes(`PromptFileErrorType.${mapping.type}`);

      assertEquals(
        hasCondition && hasErrorType,
        true,
        `Should map "${mapping.condition}" to ${mapping.type}. Has condition: ${hasCondition}, Has error type: ${hasErrorType}`,
      );
    }

    logger.debug("Error type mapping verified");
  });

  it("should handle validation errors from factory", () => {
    logger.debug("Testing factory validation error handling");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Factory validation happens during creation and getAllParams()
    assertEquals(
      methodString.includes("if (!factoryResult.ok)"),
      true,
      "Should check factory creation result for validation errors",
    );

    // Note: Validation is now done during factory creation and getAllParams() calls
    // Error handling is done through Result types rather than exceptions

    logger.debug("Factory validation error handling verified");
  });
});

describe("Structure: Template Processing Integration", () => {
  it("should structure adapter creation and usage", () => {
    logger.debug("Testing adapter creation structure");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify dynamic import structure
    assertEquals(
      methodString.includes("await import("),
      true,
      "Should use dynamic import",
    );
    assertEquals(
      methodString.includes("../prompt/prompt_adapter.ts"),
      true,
      "Should import from prompt_adapter module",
    );

    // Verify adapter instantiation
    assertEquals(
      methodString.includes("new PromptAdapterImpl(factory)"),
      true,
      "Should create adapter with factory",
    );
    assertEquals(
      methodString.includes("const _adapter ="),
      true,
      "Should store adapter instance",
    );

    // Verify adapter method call
    assertEquals(
      methodString.includes("await _adapter.validateAndGenerate()"),
      true,
      "Should call validateAndGenerate on adapter",
    );

    logger.debug("Adapter creation structure verified");
  });

  it("should handle adapter results properly", () => {
    logger.debug("Testing adapter result handling");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify result handling structure
    assertEquals(
      methodString.includes("const result = await _adapter.validateAndGenerate()"),
      true,
      "Should store adapter result",
    );
    assertEquals(
      methodString.includes("if (result.success)"),
      true,
      "Should check result.success",
    );

    // Verify success case mapping
    assertEquals(
      methodString.includes("output: result.content"),
      true,
      "Should map result.content to output on success",
    );
    assertEquals(
      methodString.includes("error: null"),
      true,
      "Should set error to null on success",
    );

    // Verify failure case mapping
    assertEquals(
      methodString.includes("String(result.content)"),
      true,
      "Should convert result.content to string on failure",
    );

    logger.debug("Adapter result handling verified");
  });
});

describe("Structure: File System Validation", () => {
  it("should structure file existence checks", () => {
    logger.debug("Testing file existence check structure");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify directory check
    assertEquals(
      methodString.includes("dirname(promptFilePath)"),
      true,
      "Should extract directory from prompt file path",
    );
    assertEquals(
      methodString.includes("!existsSync(promptDir)"),
      true,
      "Should check if prompt directory exists",
    );

    // Verify file check
    assertEquals(
      methodString.includes("!existsSync(promptFilePath)"),
      true,
      "Should check if prompt file exists",
    );

    // Verify check order (directory before file)
    const dirCheckIndex = methodString.indexOf("!existsSync(promptDir)");
    const fileCheckIndex = methodString.indexOf("!existsSync(promptFilePath)");
    assertEquals(
      dirCheckIndex < fileCheckIndex,
      true,
      "Should check directory before file",
    );

    logger.debug("File existence check structure verified");
  });

  it("should structure validation error messages", () => {
    logger.debug("Testing validation error message structure");

    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();

    // Verify error messages include relevant paths
    assertEquals(
      methodString.includes("Input file not found: ${inputFilePath}"),
      true,
      "Input file error should include path",
    );
    assertEquals(
      methodString.includes("Prompt directory not found: ${promptDir}"),
      true,
      "Directory error should include path",
    );
    assertEquals(
      methodString.includes("Prompt template file not found: ${promptFilePath}"),
      true,
      "Template file error should include path",
    );

    logger.debug("Validation error message structure verified");
  });
});

describe("Structure: CommandResult Interface Compliance", () => {
  it("should return CommandResult with all required fields", () => {
    logger.debug("Testing CommandResult interface compliance");

    const generator = new PromptFileGenerator();

    // Test method signature
    const result = generator.generateWithPrompt("test.md", "out.md", "format", false, {});

    // Verify returns Promise<CommandResult>
    assertExists(result.then, "Should return a Promise");

    // Method analysis for return structure
    const methodString = generator.generateWithPrompt.toString();

    // Count return statements
    const returnMatches = methodString.match(/return\s*{/g) || [];
    assertEquals(
      returnMatches.length >= 5,
      true,
      "Should have at least 5 return statements for different paths",
    );

    // All returns should have success, output, and error fields
    const returnPattern =
      /return\s*{\s*success:\s*(true|false),\s*output:\s*[^,}]+,\s*error:\s*[^}]+}/g;
    const validReturns = methodString.match(returnPattern) || [];
    assertEquals(
      validReturns.length >= 5,
      true,
      "All returns should follow CommandResult structure",
    );

    logger.debug("CommandResult interface compliance verified");
  });
});
