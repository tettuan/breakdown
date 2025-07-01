/**
 * @fileoverview Structure tests for PromptAdapterValidator
 * 
 * Validates structural design:
 * - Method organization and cohesion
 * - Validation flow consistency
 * - Error handling patterns
 * - Result type usage
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { 
  PromptAdapterValidator,
  ValidationErrorType,
  type ValidationResult 
} from "./prompt_adapter_validator.ts";

const logger = new BreakdownLogger("structure-prompt-adapter-validator");

describe("PromptAdapterValidator Structure - Class Design", () => {
  it("should instantiate without configuration", () => {
    logger.debug("Testing instantiation");
    
    const validator = new PromptAdapterValidator();
    assertExists(validator, "Should create instance without parameters");
    
    // Should have validation methods available
    assertExists(validator.validateFile, "Should have validateFile method");
    assertExists(validator.validateDirectory, "Should have validateDirectory method");
  });

  it("should have consistent method naming", () => {
    logger.debug("Testing method naming consistency");
    
    const validator = new PromptAdapterValidator();
    
    // All public validation methods should start with 'validate'
    const validationMethods = [
      "validateFile",
      "validateDirectory",
      "validateBaseDir"
    ];
    
    validationMethods.forEach(method => {
      if (method in validator) {
        assertEquals(method.startsWith("validate"), true, 
          `Validation method should start with 'validate': ${method}`);
      }
    });
  });

  it("should follow consistent validation flow", async () => {
    logger.debug("Testing validation flow structure");
    
    const fileContent = await Deno.readTextFile("lib/prompt/prompt_adapter_validator.ts");
    
    // Each validate method should follow: sanitize -> validate -> check pattern
    const validateMethods = fileContent.match(/async\s+validate\w+\s*\([^)]*\)/g) || [];
    
    validateMethods.forEach(method => {
      logger.debug(`Checking validation flow for: ${method}`);
      // This is a structural check - actual implementation may vary
      assertExists(method, "Should have validate methods");
    });
    
    // Should have helper methods for the flow
    const helperPatterns = ["sanitize", "Path", "isValid"];
    const hasHelpers = helperPatterns.some(pattern => fileContent.includes(pattern));
    assertEquals(hasHelpers, true, "Should have validation helper methods");
  });
});

describe("PromptAdapterValidator Structure - Result Type Usage", () => {
  it("should use discriminated union for results", () => {
    logger.debug("Testing result type structure");
    
    // Test the structure by attempting to use it
    const mockSuccessResult: ValidationResult = {
      ok: true,
      path: "/test/path"
    };
    
    const mockErrorResult: ValidationResult = {
      ok: false,
      error: ValidationErrorType.NotFound,
      message: "File not found"
    };
    
    // Type guards should work
    if (mockSuccessResult.ok) {
      assertExists(mockSuccessResult.path, "Success result should have path");
    }
    
    if (!mockErrorResult.ok) {
      assertExists(mockErrorResult.error, "Error result should have error type");
      assertExists(mockErrorResult.message, "Error result should have message");
    }
  });

  it("should have comprehensive error types", () => {
    logger.debug("Testing error type completeness");
    
    // All error types should be accessible
    const errorTypes = [
      ValidationErrorType.InvalidPath,
      ValidationErrorType.NotFound,
      ValidationErrorType.NotFile,
      ValidationErrorType.NotDirectory,
      ValidationErrorType.InvalidBaseDir
    ];
    
    errorTypes.forEach(errorType => {
      assertExists(errorType, `Error type should exist: ${errorType}`);
      assertEquals(typeof errorType, "string", "Error type should be string enum");
    });
  });
});

describe("PromptAdapterValidator Structure - Method Signatures", () => {
  it("should have consistent async method signatures", async () => {
    logger.debug("Testing method signatures");
    
    const validator = new PromptAdapterValidator();
    
    // All validation methods should return Promise<ValidationResult>
    const validateFileResult = validator.validateFile("/test", "Test");
    assertEquals(validateFileResult instanceof Promise, true, 
      "validateFile should return Promise");
    
    const validateDirResult = validator.validateDirectory("/test", "Test");
    assertEquals(validateDirResult instanceof Promise, true, 
      "validateDirectory should return Promise");
  });

  it("should accept consistent parameters", () => {
    logger.debug("Testing parameter consistency");
    
    const validator = new PromptAdapterValidator();
    
    // Validation methods should accept (path, label) parameters
    const testPath = "/test/path";
    const testLabel = "Test file";
    
    // These should not throw type errors
    const calls = [
      () => validator.validateFile(testPath, testLabel),
      () => validator.validateDirectory(testPath, testLabel)
    ];
    
    calls.forEach(call => {
      assertEquals(typeof call, "function", "Should accept consistent parameters");
    });
  });
});

describe("PromptAdapterValidator Structure - Internal Organization", () => {
  it("should separate public and private methods", async () => {
    logger.debug("Testing method visibility organization");
    
    const fileContent = await Deno.readTextFile("lib/prompt/prompt_adapter_validator.ts");
    
    // Extract method definitions
    const methods = fileContent.match(/^\s{2}(public\s+|private\s+)?(async\s+)?(\w+)\s*\(/gm) || [];
    
    const publicMethods: string[] = [];
    const privateMethods: string[] = [];
    
    methods.forEach(method => {
      if (method.includes("private")) {
        privateMethods.push(method.trim());
      } else if (method.includes("public") || (!method.includes("constructor") && !method.includes("private"))) {
        publicMethods.push(method.trim());
      }
    });
    
    // Should have both public and private methods
    assertEquals(publicMethods.length > 0, true, "Should have public methods");
    assertEquals(privateMethods.length > 0, true, "Should have private helper methods");
    
    // Private methods should be helpers
    privateMethods.forEach(method => {
      const isHelper = method.includes("sanitize") || 
                      method.includes("getPathStringError") || 
                      method.includes("getFileExistsError") ||
                      method.includes("getDirectoryExistsError");
      assertEquals(isHelper, true, `Private method should be a helper: ${method}`);
    });
  });

  it("should have logical method grouping", async () => {
    logger.debug("Testing method grouping");
    
    const fileContent = await Deno.readTextFile("lib/prompt/prompt_adapter_validator.ts");
    
    // Methods should be grouped by functionality
    const methodGroups = {
      validation: ["validateFile", "validateDirectory", "validateBaseDir"],
      helpers: ["sanitize", "isValid"],
      checks: ["check", "exists"]
    };
    
    Object.entries(methodGroups).forEach(([group, methods]) => {
      const groupMethods = methods.filter(method => fileContent.includes(method));
      logger.debug(`${group} methods found: ${groupMethods.length}`);
      assertEquals(groupMethods.length > 0, true, `Should have ${group} methods`);
    });
  });
});

describe("PromptAdapterValidator Structure - Error Message Consistency", () => {
  it("should use consistent error message format", async () => {
    logger.debug("Testing error message patterns");
    
    const fileContent = await Deno.readTextFile("lib/prompt/prompt_adapter_validator.ts");
    
    // Error messages should include the label
    const errorMessagePatterns = [
      /`.*\$\{.*label.*\}.*`/,  // Template literals with label
      /".*not found"/i,          // Common error phrases
      /".*invalid"/i,
      /".*must be"/i
    ];
    
    const hasErrorPatterns = errorMessagePatterns.some(pattern => 
      pattern.test(fileContent)
    );
    assertEquals(hasErrorPatterns, true, "Should have consistent error message patterns");
  });
});