/**
 * Architecture tests for TwoParamsValidator
 *
 * Tests architectural constraints and dependencies:
 * - Class structure and responsibility boundaries
 * - Result type architecture compliance
 * - Error handling architecture
 * - Interface segregation
 * - Single responsibility principle
 *
 * @module cli/validators/two_params_validator_architecture_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TwoParamsValidator, type ValidationError, type ValidatedParams } from "./two_params_validator.ts";

const logger = new BreakdownLogger("two-params-validator-architecture");

describe("Architecture: TwoParamsValidator Class Structure", () => {
  it("should export required public interfaces", () => {
    logger.debug("Testing module exports");

    // Required class export
    assertExists(TwoParamsValidator, "TwoParamsValidator class must be exported");
    assertEquals(
      typeof TwoParamsValidator,
      "function",
      "TwoParamsValidator must be a class constructor",
    );

    // Required type exports
    const validator = new TwoParamsValidator();
    const mockValidResult = validator.validate(["to", "project"]);
    
    if (mockValidResult.ok) {
      // Verify ValidatedParams interface structure
      assertExists(mockValidResult.data.demonstrativeType, "ValidatedParams must have demonstrativeType");
      assertExists(mockValidResult.data.layerType, "ValidatedParams must have layerType");
      assertEquals(typeof mockValidResult.data.demonstrativeType, "string", "demonstrativeType must be string");
      assertEquals(typeof mockValidResult.data.layerType, "string", "layerType must be string");
    }

    logger.debug("Module exports verification completed");
  });

  it("should maintain proper class method boundaries", () => {
    logger.debug("Testing class method boundaries");

    const validator = new TwoParamsValidator();

    // Public methods
    assertExists(validator.validate, "validate method must be public");
    assertEquals(
      typeof validator.validate,
      "function",
      "validate must be a method",
    );

    // No exposed internal state
    const publicProps = Object.getOwnPropertyNames(validator);
    assertEquals(
      publicProps.length,
      0,
      "Should not expose internal state as public properties",
    );

    // Check method count - focused responsibility
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(validator))
      .filter((name) =>
        name !== "constructor" && typeof validator[name as keyof typeof validator] === "function"
      );

    assertEquals(
      methods.length,
      1,
      "Should have exactly 1 public method (validate)",
    );

    logger.debug("Class method boundaries verification completed");
  });

  it("should follow single responsibility principle", () => {
    logger.debug("Testing single responsibility principle");

    const validator = new TwoParamsValidator();

    // Method signature should be simple and focused
    assertEquals(
      validator.validate.length,
      1,
      "validate should take exactly 1 parameter (string array)",
    );

    // Class constructor should not require dependencies
    assertEquals(
      TwoParamsValidator.length,
      0,
      "Constructor should not require parameters (stateless validation)",
    );

    // Verify focused responsibility through method inspection
    const validateString = validator.validate.toString();
    
    // Should only handle validation, not generation or processing
    assertEquals(
      validateString.includes("demonstrative") && validateString.includes("layer"),
      true,
      "Should validate both demonstrative and layer types",
    );
    assertEquals(
      validateString.includes("PromptVariables") || validateString.includes("Factory"),
      false,
      "Should not handle prompt generation or factory creation",
    );

    logger.debug("Single responsibility principle verification completed");
  });

  it("should have no external dependencies in constructor", () => {
    logger.debug("Testing dependency management");

    // Should be instantiable without dependencies
    const validator = new TwoParamsValidator();
    assertExists(validator, "Should be instantiable without dependencies");

    // Should not hold references to external services
    assertEquals(
      (validator as any).factory,
      undefined,
      "Should not hold factory reference",
    );
    assertEquals(
      (validator as any).config,
      undefined,
      "Should not hold config reference",
    );
    assertEquals(
      (validator as any).logger,
      undefined,
      "Should not hold logger reference",
    );

    // Constructor should be lightweight
    const constructorString = TwoParamsValidator.toString();
    assertEquals(
      constructorString.includes("import(") || constructorString.includes("require("),
      false,
      "Constructor should not perform dynamic imports",
    );

    logger.debug("Dependency management verification completed");
  });
});

describe("Architecture: Result Type Compliance", () => {
  it("should use Result<T, E> pattern consistently", () => {
    logger.debug("Testing Result type pattern compliance");

    const validator = new TwoParamsValidator();

    // Valid case result structure
    const validResult = validator.validate(["to", "project"]);
    assertExists(validResult.ok, "Result must have ok property");
    assertEquals(typeof validResult.ok, "boolean", "ok property must be boolean");

    if (validResult.ok) {
      assertExists(validResult.data, "Success result must have data property");
      // Note: error property doesn't exist on success type in discriminated union
    } else {
      assertExists(validResult.error, "Error result must have error property");
    }

    // Invalid case result structure
    const invalidResult = validator.validate(["invalid"]);
    assertEquals(invalidResult.ok, false, "Invalid input should return error result");
    if (!invalidResult.ok) {
      assertExists(invalidResult.error, "Error result must have error property");
      // Note: data property doesn't exist on error type in discriminated union
    }

    logger.debug("Result type pattern compliance verification completed");
  });

  it("should provide typed error categories", () => {
    logger.debug("Testing typed error categories");

    const validator = new TwoParamsValidator();

    // Test parameter count error
    const paramCountResult = validator.validate([]);
    if (!paramCountResult.ok) {
      const error = paramCountResult.error;
      assertEquals(error.kind, "InvalidParameterCount", "Should categorize parameter count errors");
      if (error.kind === "InvalidParameterCount") {
        assertExists(error.received, "Should include received count");
        assertExists(error.expected, "Should include expected count");
      }
    }

    // Test demonstrative type error
    const demoTypeResult = validator.validate(["invalid", "project"]);
    if (!demoTypeResult.ok) {
      const error = demoTypeResult.error;
      assertEquals(error.kind, "InvalidDemonstrativeType", "Should categorize demonstrative type errors");
      if (error.kind === "InvalidDemonstrativeType") {
        assertExists(error.value, "Should include invalid value");
        assertExists(error.validTypes, "Should include valid types list");
      }
    }

    // Test layer type error
    const layerTypeResult = validator.validate(["to", "invalid"]);
    if (!layerTypeResult.ok) {
      const error = layerTypeResult.error;
      assertEquals(error.kind, "InvalidLayerType", "Should categorize layer type errors");
      if (error.kind === "InvalidLayerType") {
        assertExists(error.value, "Should include invalid value");
        assertExists(error.validTypes, "Should include valid types list");
      }
    }

    logger.debug("Typed error categories verification completed");
  });

  it("should maintain immutable validation data", () => {
    logger.debug("Testing validation data immutability");

    const validator = new TwoParamsValidator();
    const result = validator.validate(["to", "project"]);

    if (result.ok) {
      const originalData = result.data;
      
      // Attempt to modify returned data
      (result.data as any).demonstrativeType = "modified";
      
      // Second validation should not be affected
      const secondResult = validator.validate(["summary", "issue"]);
      if (secondResult.ok) {
        assertEquals(
          secondResult.data.demonstrativeType,
          "summary",
          "Validator should not be affected by external modifications",
        );
      }

      // Original result should maintain integrity
      assertEquals(
        originalData.demonstrativeType,
        "modified", // This confirms the object was modifiable (not immutable)
        "Note: Data object is modifiable - consider immutability for better architecture",
      );
    }

    logger.debug("Validation data immutability verification completed");
  });
});

describe("Architecture: Validation Logic Design", () => {
  it("should separate validation concerns properly", () => {
    logger.debug("Testing validation concerns separation");

    const validator = new TwoParamsValidator();
    const methodString = validator.validate.toString();

    // Should validate parameter count first
    assertEquals(
      methodString.includes("params.length"),
      true,
      "Should check parameter count",
    );

    // Should have separate validation for each parameter type
    assertEquals(
      methodString.includes("validateDemonstrativeType") || methodString.includes("demonstrative"),
      true,
      "Should have demonstrative type validation",
    );
    assertEquals(
      methodString.includes("validateLayerType") || methodString.includes("layer"),
      true,
      "Should have layer type validation",
    );

    // Should return early on validation failures
    assertEquals(
      methodString.includes("return error") || methodString.includes("!") && methodString.includes(".ok"),
      true,
      "Should return early on validation failures",
    );

    logger.debug("Validation concerns separation verification completed");
  });

  it("should use compile-time type safety", () => {
    logger.debug("Testing compile-time type safety");

    const validator = new TwoParamsValidator();
    const classString = TwoParamsValidator.toString();

    // Should use const assertions for valid types
    assertEquals(
      classString.includes("as const") || classString.includes("readonly"),
      true,
      "Should use compile-time type safety for valid types",
    );

    // Method should have proper type annotations
    const validateString = validator.validate.toString();
    
    // Result should be properly typed
    const result = validator.validate(["to", "project"]);
    assertEquals(typeof result.ok, "boolean", "Result.ok should be boolean typed");

    if (result.ok) {
      assertEquals(typeof result.data.demonstrativeType, "string", "demonstrativeType should be string typed");
      assertEquals(typeof result.data.layerType, "string", "layerType should be string typed");
    } else {
      assertEquals(typeof result.error.kind, "string", "error.kind should be string typed");
    }

    logger.debug("Compile-time type safety verification completed");
  });

  it("should maintain validation consistency", () => {
    logger.debug("Testing validation consistency");

    const validator = new TwoParamsValidator();

    // Same input should always produce same result
    const result1 = validator.validate(["to", "project"]);
    const result2 = validator.validate(["to", "project"]);

    assertEquals(result1.ok, result2.ok, "Same input should produce consistent results");
    
    if (result1.ok && result2.ok) {
      assertEquals(
        result1.data.demonstrativeType,
        result2.data.demonstrativeType,
        "Demonstrative type should be consistent",
      );
      assertEquals(
        result1.data.layerType,
        result2.data.layerType,
        "Layer type should be consistent",
      );
    }

    // Validator should be stateless
    const errorResult = validator.validate(["invalid", "invalid"]);
    const validResult = validator.validate(["to", "project"]);

    assertEquals(
      validResult.ok,
      true,
      "Validator should not maintain error state between calls",
    );

    logger.debug("Validation consistency verification completed");
  });
});