/**
 * Architecture tests for PromptFileGenerator
 * 
 * Tests architectural constraints and dependencies:
 * - Class structure and responsibility boundaries
 * - External dependency management
 * - Error handling architecture
 * - Interface segregation
 * 
 * @module commands/prompt_file_generator_architecture_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptFileGenerator, PromptFileErrorType } from "./prompt_file_generator.ts";

const logger = new BreakdownLogger("prompt-generator-architecture");

describe("Architecture: PromptFileGenerator Class Structure", () => {
  it("should export required public interfaces", () => {
    logger.debug("Testing module exports");
    
    // Required class export
    assertExists(PromptFileGenerator, "PromptFileGenerator class must be exported");
    assertEquals(typeof PromptFileGenerator, "function", "PromptFileGenerator must be a class constructor");
    
    // Required enum export
    assertExists(PromptFileErrorType, "PromptFileErrorType enum must be exported");
    assertExists(PromptFileErrorType.InputFileNotFound, "InputFileNotFound error type must exist");
    assertExists(PromptFileErrorType.PromptDirNotFound, "PromptDirNotFound error type must exist");
    assertExists(PromptFileErrorType.PromptFileNotFound, "PromptFileNotFound error type must exist");
    assertExists(PromptFileErrorType.Unknown, "Unknown error type must exist");
    
    logger.debug("Module exports verification completed");
  });

  it("should maintain proper class method boundaries", () => {
    logger.debug("Testing class method boundaries");
    
    const generator = new PromptFileGenerator();
    
    // Public methods
    assertExists(generator.validateInputFile, "validateInputFile method must be public");
    assertExists(generator.generateWithPrompt, "generateWithPrompt method must be public");
    
    // Method types
    assertEquals(typeof generator.validateInputFile, "function", "validateInputFile must be a method");
    assertEquals(typeof generator.generateWithPrompt, "function", "generateWithPrompt must be a method");
    
    // No exposed internal state
    const publicProps = Object.getOwnPropertyNames(generator);
    assertEquals(
      publicProps.length,
      0,
      "Should not expose internal state as public properties"
    );
    
    logger.debug("Class method boundaries verification completed");
  });

  it("should follow single responsibility principle", () => {
    logger.debug("Testing single responsibility principle");
    
    const generator = new PromptFileGenerator();
    
    // Method count check - should have focused responsibilities
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(generator))
      .filter(name => name !== 'constructor' && typeof generator[name as keyof typeof generator] === 'function');
    
    assertEquals(
      methods.length,
      2,
      "Should have exactly 2 public methods (validateInputFile, generateWithPrompt)"
    );
    
    // Validate method signatures align with responsibilities
    assertEquals(generator.validateInputFile.length, 1, "validateInputFile should take 1 parameter");
    assertEquals(generator.generateWithPrompt.length, 3, "generateWithPrompt should take 3 required parameters (plus defaults)");
    
    logger.debug("Single responsibility principle verification completed");
  });

  it("should properly manage external dependencies", () => {
    logger.debug("Testing external dependency management");
    
    // Check class doesn't directly expose dependencies
    const generator = new PromptFileGenerator();
    
    // Should not expose factory or adapter instances
    assertEquals(
      (generator as any).factory,
      undefined,
      "Should not expose factory instance"
    );
    assertEquals(
      (generator as any).adapter,
      undefined,
      "Should not expose adapter instance"
    );
    
    // Verify dependency imports through code inspection
    const classString = PromptFileGenerator.toString();
    const methodString = generator.generateWithPrompt.toString();
    
    // Should use dynamic imports for heavy dependencies
    assertEquals(
      methodString.includes("import("),
      true,
      "Should use dynamic import for PromptAdapterImpl"
    );
    
    // Should create dependencies within method scope
    assertEquals(
      methodString.includes("PromptVariablesFactory.create"),
      true,
      "Should create factory within method"
    );
    assertEquals(
      methodString.includes("new PromptAdapterImpl"),
      true,
      "Should create adapter within method"
    );
    
    logger.debug("External dependency management verification completed");
  });
});

describe("Architecture: Error Handling Design", () => {
  it("should use typed error enum for categorization", () => {
    logger.debug("Testing typed error enum design");
    
    // Verify enum values
    const errorTypes = Object.values(PromptFileErrorType);
    assertEquals(errorTypes.length, 4, "Should have exactly 4 error types");
    
    // Verify enum string values match keys
    assertEquals(PromptFileErrorType.InputFileNotFound, "InputFileNotFound");
    assertEquals(PromptFileErrorType.PromptDirNotFound, "PromptDirNotFound");
    assertEquals(PromptFileErrorType.PromptFileNotFound, "PromptFileNotFound");
    assertEquals(PromptFileErrorType.Unknown, "Unknown");
    
    logger.debug("Typed error enum design verification completed");
  });

  it("should maintain consistent error return structure", () => {
    logger.debug("Testing error return structure consistency");
    
    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();
    
    // Verify consistent error return pattern
    const errorReturns = methodString.match(/success:\s*false/g);
    assertExists(errorReturns, "Should have error return statements");
    assertEquals(
      errorReturns.length >= 4,
      true,
      "Should have at least 4 error return paths"
    );
    
    // Verify error structure includes type and message
    assertEquals(
      methodString.includes("type: PromptFileErrorType"),
      true,
      "Error returns should include typed error"
    );
    assertEquals(
      methodString.includes("message:"),
      true,
      "Error returns should include message"
    );
    
    logger.debug("Error return structure consistency verified");
  });

  it("should handle async operations properly", () => {
    logger.debug("Testing async operation handling");
    
    const generator = new PromptFileGenerator();
    
    // Both public methods should be async
    assertEquals(
      generator.validateInputFile.constructor.name,
      "Function", // Regular function that returns Promise
      "validateInputFile should return a Promise"
    );
    assertEquals(
      generator.generateWithPrompt.constructor.name,
      "AsyncFunction",
      "generateWithPrompt should be async"
    );
    
    // Verify Promise handling
    const validateResult = generator.validateInputFile("");
    assertExists(validateResult.then, "validateInputFile should return a Promise");
    assertExists(validateResult.catch, "validateInputFile should return a catchable Promise");
    
    logger.debug("Async operation handling verification completed");
  });
});

describe("Architecture: Interface Contracts", () => {
  it("should maintain clear parameter contracts", () => {
    logger.debug("Testing parameter contracts");
    
    const generator = new PromptFileGenerator();
    
    // validateInputFile contract
    assertEquals(
      generator.validateInputFile.length,
      1,
      "validateInputFile should accept exactly 1 parameter"
    );
    
    // generateWithPrompt contract (length counts only required params before defaults)
    assertEquals(
      generator.generateWithPrompt.length,
      3,
      "generateWithPrompt should accept exactly 3 required parameters"
    );
    
    // Verify optional parameters handling
    const generateString = generator.generateWithPrompt.toString();
    assertEquals(
      generateString.includes("_force = false"),
      true,
      "Should have default value for force parameter"
    );
    assertEquals(
      generateString.includes("options?") || generateString.includes("options = {}"),
      true,
      "Options parameter should be optional"
    );
    
    logger.debug("Parameter contracts verification completed");
  });

  it("should return consistent CommandResult structure", () => {
    logger.debug("Testing CommandResult structure consistency");
    
    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();
    
    // Verify all return paths follow CommandResult interface
    const successReturns = methodString.match(/success:\s*true/g);
    const failureReturns = methodString.match(/success:\s*false/g);
    
    assertExists(successReturns, "Should have success return paths");
    assertExists(failureReturns, "Should have failure return paths");
    
    // Verify return structure includes all required fields
    assertEquals(
      methodString.includes("output:"),
      true,
      "All returns should include output field"
    );
    assertEquals(
      methodString.includes("error:"),
      true,
      "All returns should include error field"
    );
    
    // Success returns should have null error
    assertEquals(
      methodString.includes("error: null"),
      true,
      "Success returns should have null error"
    );
    
    logger.debug("CommandResult structure consistency verified");
  });
});

describe("Architecture: Separation of Concerns", () => {
  it("should separate validation from generation logic", () => {
    logger.debug("Testing validation/generation separation");
    
    const generator = new PromptFileGenerator();
    
    // validateInputFile focuses only on file validation
    const validateString = generator.validateInputFile.toString();
    assertEquals(
      validateString.includes("Deno.stat"),
      true,
      "validateInputFile should use Deno.stat for validation"
    );
    assertEquals(
      validateString.includes("PromptVariablesFactory"),
      false,
      "validateInputFile should not handle factory logic"
    );
    
    // generateWithPrompt orchestrates the full flow
    const generateString = generator.generateWithPrompt.toString();
    assertEquals(
      generateString.includes("validateInputFile"),
      true,
      "generateWithPrompt should call validateInputFile"
    );
    assertEquals(
      generateString.includes("PromptVariablesFactory"),
      true,
      "generateWithPrompt should handle factory creation"
    );
    
    logger.debug("Validation/generation separation verified");
  });

  it("should delegate template processing to adapter", () => {
    logger.debug("Testing template processing delegation");
    
    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();
    
    // Verify delegation pattern
    assertEquals(
      methodString.includes("new PromptAdapterImpl(factory)"),
      true,
      "Should create adapter with factory"
    );
    assertEquals(
      methodString.includes("adapter.validateAndGenerate()"),
      true,
      "Should delegate to adapter's validateAndGenerate method"
    );
    
    // Should reference template processing but delegate implementation
    assertEquals(
      methodString.includes("template") || methodString.includes("Template"),
      true,
      "Should reference template processing (but delegate actual implementation)"
    );
    
    logger.debug("Template processing delegation verified");
  });

  it("should handle stdin input separately from file input", () => {
    logger.debug("Testing stdin/file input separation");
    
    const generator = new PromptFileGenerator();
    const methodString = generator.generateWithPrompt.toString();
    
    // Verify stdin handling branch
    assertEquals(
      methodString.includes('fromFile === "-"'),
      true,
      "Should check for stdin indicator"
    );
    assertEquals(
      methodString.includes("options?.input_text"),
      true,
      "Should check for input_text in stdin case"
    );
    
    // Verify file handling branch
    assertEquals(
      methodString.includes("validateInputFile(inputFilePath)"),
      true,
      "Should validate file path for non-stdin input"
    );
    
    logger.debug("Stdin/file input separation verified");
  });
});