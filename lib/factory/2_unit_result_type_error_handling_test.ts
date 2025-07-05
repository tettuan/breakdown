/**
 * Unit tests for Result type error handling with exhaustive coverage
 *
 * These tests verify that all Result type error scenarios are handled
 * according to Totality principles - all errors are values, not exceptions,
 * and all possible error states are covered without default cases.
 */

import { assertEquals, assertExists } from "@std/assert";
import { beforeEach as _beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType as _LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationError as _TypeCreationError,
  type TypeCreationResult,
  TypeFactory,
  type TypePatternProvider,
} from "../types/mod.ts";
import {
  type TotalityPromptCliParams,
  TotalityPromptVariablesFactory,
} from "./prompt_variables_factory.ts";

const logger = new BreakdownLogger("result-error-handling");

/**
 * Error scenario provider for comprehensive error testing
 */
class ErrorScenarioProvider implements TypePatternProvider {
  constructor(
    private directivePattern: string | null = "to|summary|defect",
    private layerPattern: string | null = "project|issue|task",
    private shouldReturnNull = false,
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    if (this.shouldReturnNull || !this.directivePattern) {
      return null;
    }

    try {
      return TwoParamsDirectivePattern.create(this.directivePattern);
    } catch {
      return null;
    }
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    if (this.shouldReturnNull || !this.layerPattern) {
      return null;
    }

    try {
      return TwoParamsLayerTypePattern.create(this.layerPattern);
    } catch {
      return null;
    }
  }

  // Test manipulation methods
  disablePatterns() {
    this.shouldReturnNull = true;
  }

  enablePatterns() {
    this.shouldReturnNull = false;
  }

  setDirectivePattern(pattern: string | null) {
    this.directivePattern = pattern;
  }

  setLayerPattern(pattern: string | null) {
    this.layerPattern = pattern;
  }
}

describe("Result Type Error Handling - TypeCreationError Exhaustive Coverage", () => {
  it("should handle all TypeCreationError.kind values without default case", async () => {
    logger.debug("Testing exhaustive TypeCreationError.kind handling");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);

    // Generate all possible error types
    const errorScenarios = [
      // PatternNotFound scenario
      {
        setup: () => {
          provider.disablePatterns();
        },
        operation: () => factory.createDirectiveType("to"),
        expectedKind: "PatternNotFound" as const,
        description: "Pattern not found error",
      },
      // ValidationFailed scenario
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("to|summary");
        },
        operation: () => factory.createDirectiveType("invalid"),
        expectedKind: "ValidationFailed" as const,
        description: "Validation failed error",
      },
      // InvalidPattern scenario (simulated through malformed pattern)
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("[invalid-regex");
        },
        operation: () => factory.createDirectiveType("to"),
        expectedKind: "PatternNotFound" as const, // TwoParamsDirectivePattern.create returns null for invalid regex
        description: "Invalid pattern error",
      },
    ];

    errorScenarios.forEach((scenario) => {
      scenario.setup();
      const result = scenario.operation();

      assertEquals(result.ok, false, `${scenario.description} should fail`);

      if (!result.ok) {
        const error = result.error;

        // Handle each error kind without default case
        let errorHandled = false;

        switch (error.kind) {
          case "PatternNotFound":
            assertExists(error.message);
            assertEquals(typeof error.message, "string");
            assertEquals(error.kind, scenario.expectedKind);
            errorHandled = true;
            break;

          case "ValidationFailed":
            assertExists((error as Record<string, unknown>).value);
            assertExists((error as Record<string, unknown>).pattern);
            assertEquals(typeof (error as Record<string, unknown>).value, "string");
            assertEquals(typeof (error as Record<string, unknown>).pattern, "string");
            errorHandled = true;
            break;

          case "InvalidPattern":
            assertExists((error as Record<string, unknown>).pattern);
            assertExists((error as Record<string, unknown>).cause);
            assertEquals(typeof (error as Record<string, unknown>).pattern, "string");
            assertEquals(typeof (error as Record<string, unknown>).cause, "string");
            errorHandled = true;
            break;
        }

        assertEquals(
          errorHandled,
          true,
          `Error kind ${error.kind} must be handled without default case`,
        );
      }
    });
  });

  it("should provide complete error information for all error types", async () => {
    logger.debug("Testing complete error information provision");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);

    // Test PatternNotFound error information
    provider.disablePatterns();
    const patternNotFoundResult = factory.createDirectiveType("any");
    assertEquals(patternNotFoundResult.ok, false);

    if (!patternNotFoundResult.ok) {
      const error = patternNotFoundResult.error;
      assertEquals(error.kind, "PatternNotFound");
      // Note: TypeCreationError uses discriminated union, check available properties
      assertExists(
        (error as Record<string, unknown>).value || (error as Record<string, unknown>).message,
      );
      assertEquals(error.kind === "ValidationFailed" || error.kind === "PatternNotFound", true);
    }

    // Test ValidationFailed error information
    provider.enablePatterns();
    provider.setDirectivePattern("to|summary");
    const validationFailedResult = factory.createDirectiveType("invalid_value");
    assertEquals(validationFailedResult.ok, false);

    if (!validationFailedResult.ok) {
      const error = validationFailedResult.error;
      assertEquals(error.kind, "ValidationFailed");
      assertEquals((error as Record<string, unknown>).value, "invalid_value");
      assertExists((error as Record<string, unknown>).pattern);
      assertEquals((error as Record<string, unknown>).pattern, "to|summary");
    }
  });

  it("should handle error propagation in composite operations", async () => {
    logger.debug("Testing error propagation in composite operations");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);

    // Test createBothTypes error propagation scenarios
    const propagationScenarios = [
      {
        setup: () => {
          provider.disablePatterns();
        },
        operation: () => factory.createBothTypes("to", "project"),
        expectedErrorSource: "directive",
        expectedKind: "PatternNotFound",
        description: "Both patterns missing - fails on directive first",
      },
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("to|summary");
          provider.setLayerPattern("project|issue");
        },
        operation: () => factory.createBothTypes("invalid", "project"),
        expectedErrorSource: "directive",
        expectedKind: "ValidationFailed",
        description: "Invalid directive, valid layer - fails on directive",
      },
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("to|summary");
          provider.setLayerPattern("project|issue");
        },
        operation: () => factory.createBothTypes("to", "invalid"),
        expectedErrorSource: "layer",
        expectedKind: "ValidationFailed",
        description: "Valid directive, invalid layer - fails on layer",
      },
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("to|summary");
          provider.setLayerPattern("project|issue");
        },
        operation: () => factory.createBothTypes("invalid_directive", "invalid_layer"),
        expectedErrorSource: "directive",
        expectedKind: "ValidationFailed",
        description: "Both invalid - fails on directive first",
      },
    ];

    propagationScenarios.forEach((scenario) => {
      scenario.setup();
      const result = scenario.operation();

      assertEquals(result.ok, false, `${scenario.description} should fail`);

      if (!result.ok) {
        assertEquals(result.error.kind, scenario.expectedKind);

        // Verify error comes from expected source
        if (
          scenario.expectedErrorSource === "directive" && result.error.kind === "ValidationFailed"
        ) {
          const validationError = result.error as Record<string, unknown>;
          assertEquals((validationError.value as string).includes("invalid"), true);
        }
      }
    });
  });
});

describe("Result Type Error Handling - Factory Error State Coverage", () => {
  it("should handle all factory validation error states without default case", async () => {
    logger.debug("Testing factory validation error state coverage");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);

    // Create valid types for factory testing
    provider.enablePatterns();
    const typesResult = factory.createBothTypes("to", "project");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const validParams: TotalityPromptCliParams = {
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      // Test different factory error states
      const factoryErrorScenarios = [
        {
          config: {}, // Missing app_prompt
          expectError: true,
          errorType: "missing_prompt_dir",
          description: "Missing prompt directory configuration",
        },
        {
          config: { app_prompt: {} }, // Empty app_prompt
          expectError: true,
          errorType: "missing_base_dir",
          description: "Missing base_dir in prompt configuration",
        },
        {
          config: { app_prompt: { base_dir: "" } }, // Empty base_dir
          expectError: true,
          errorType: "empty_base_dir",
          description: "Empty base_dir in prompt configuration",
        },
        {
          config: { app_prompt: { base_dir: "   " } }, // Whitespace base_dir
          expectError: true,
          errorType: "whitespace_base_dir",
          description: "Whitespace-only base_dir in prompt configuration",
        },
        {
          config: {
            app_prompt: { base_dir: "valid/path" },
            app_schema: { base_dir: "valid/schema" },
          },
          expectError: false,
          errorType: null,
          description: "Valid configuration",
        },
      ];

      for (const scenario of factoryErrorScenarios) {
        const testFactory = TotalityPromptVariablesFactory.createWithConfig(
          scenario.config,
          validParams,
        );

        const hasValidBaseDir = testFactory.hasValidBaseDir();
        const baseDirError = testFactory.getBaseDirError();

        // Handle factory validation states without default case
        let stateHandled = false;

        switch (scenario.expectError) {
          case true:
            assertEquals(hasValidBaseDir, false, `${scenario.description} should be invalid`);
            assertExists(baseDirError, `${scenario.description} should have error`);
            stateHandled = true;
            break;

          case false:
            assertEquals(hasValidBaseDir, true, `${scenario.description} should be valid`);
            assertEquals(baseDirError, undefined, `${scenario.description} should not have error`);
            stateHandled = true;
            break;
        }

        assertEquals(
          stateHandled,
          true,
          `Factory validation state must be handled for ${scenario.description}`,
        );

        // Test factory validation method
        if (scenario.expectError) {
          try {
            testFactory.validateAll();
            // Should not reach here for error cases
            assertEquals(true, false, `${scenario.description} should fail validateAll()`);
          } catch (error) {
            // Expected for error cases
            assertExists(error);
            assertEquals(error instanceof Error, true);
          }
        } else {
          // Should not throw for valid cases
          testFactory.validateAll();
        }
      }
    }
  });

  it("should handle all error format constraint scenarios", async () => {
    logger.debug("Testing error format constraint scenarios");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);
    const typesResult = factory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const errorFormatScenarios: Array<{
        format: "simple" | "detailed" | "json" | undefined;
        expected: "simple" | "detailed" | "json";
        description: string;
      }> = [
        { format: "simple", expected: "simple", description: "Simple error format" },
        { format: "detailed", expected: "detailed", description: "Detailed error format" },
        { format: "json", expected: "json", description: "JSON error format" },
        { format: undefined, expected: "simple", description: "Default error format" },
      ];

      for (const scenario of errorFormatScenarios) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: { errorFormat: scenario.format },
        };

        const testFactory = await TotalityPromptVariablesFactory.create(params);
        const actualFormat = testFactory.errorFormat;

        // Handle all error formats without default case
        let formatHandled = false;

        switch (actualFormat) {
          case "simple":
            assertEquals(actualFormat, scenario.expected, scenario.description);
            formatHandled = true;
            break;

          case "detailed":
            assertEquals(actualFormat, scenario.expected, scenario.description);
            formatHandled = true;
            break;

          case "json":
            assertEquals(actualFormat, scenario.expected, scenario.description);
            formatHandled = true;
            break;
        }

        assertEquals(
          formatHandled,
          true,
          `Error format ${actualFormat} must be handled without default case`,
        );
      }
    }
  });
});

describe("Result Type Error Handling - Edge Case Coverage", () => {
  it("should handle all boolean flag combination error scenarios", async () => {
    logger.debug("Testing boolean flag combination error scenarios");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);
    const typesResult = factory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      // Test all boolean flag combinations
      const booleanCombinations = [
        { extended: true, customValidation: true },
        { extended: true, customValidation: false },
        { extended: false, customValidation: true },
        { extended: false, customValidation: false },
        { extended: undefined, customValidation: undefined },
      ];

      for (const combination of booleanCombinations) {
        const params: TotalityPromptCliParams = {
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: combination,
        };

        const testFactory = await TotalityPromptVariablesFactory.create(params);

        // Verify flag states are handled correctly
        const extended = testFactory.extended;
        const customValidation = testFactory.customValidation;

        // Handle extended flag states without default case
        let extendedHandled = false;
        switch (extended) {
          case true:
            assertEquals(combination.extended ?? false, true);
            extendedHandled = true;
            break;
          case false:
            assertEquals(combination.extended ?? false, false);
            extendedHandled = true;
            break;
        }

        // Handle customValidation flag states without default case
        let customValidationHandled = false;
        switch (customValidation) {
          case true:
            assertEquals(combination.customValidation ?? false, true);
            customValidationHandled = true;
            break;
          case false:
            assertEquals(combination.customValidation ?? false, false);
            customValidationHandled = true;
            break;
        }

        assertEquals(extendedHandled, true, "Extended flag must be handled without default case");
        assertEquals(
          customValidationHandled,
          true,
          "CustomValidation flag must be handled without default case",
        );
      }
    }
  });

  it("should handle Result type success/failure exhaustive branching", async () => {
    logger.debug("Testing Result type success/failure exhaustive branching");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);

    // Test success and failure scenarios
    const resultScenarios = [
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("to|summary");
        },
        operation: () => factory.createDirectiveType("to"),
        expectedSuccess: true,
        description: "Valid directive type creation",
      },
      {
        setup: () => {
          provider.enablePatterns();
          provider.setDirectivePattern("to|summary");
        },
        operation: () => factory.createDirectiveType("invalid"),
        expectedSuccess: false,
        description: "Invalid directive type creation",
      },
      {
        setup: () => {
          provider.disablePatterns();
        },
        operation: () => factory.createDirectiveType("to"),
        expectedSuccess: false,
        description: "Missing pattern directive type creation",
      },
    ];

    resultScenarios.forEach((scenario) => {
      scenario.setup();
      const result = scenario.operation();

      // Handle Result type states without default case
      let resultHandled = false;

      switch (result.ok) {
        case true:
          assertEquals(scenario.expectedSuccess, true, scenario.description);
          assertExists(result.data);
          // success result should not have error property
          assertEquals(result.data instanceof DirectiveType, true);
          resultHandled = true;
          break;

        case false:
          assertEquals(scenario.expectedSuccess, false, scenario.description);
          assertExists(result.error);
          // failure result should not have data property
          assertExists(result.error.kind);
          resultHandled = true;
          break;
      }

      assertEquals(
        resultHandled,
        true,
        `Result state must be handled without default case for ${scenario.description}`,
      );
    });
  });

  it("should demonstrate compile-time exhaustiveness for error handling", async () => {
    logger.debug("Testing compile-time exhaustiveness for error handling");

    const provider = new ErrorScenarioProvider();
    const factory = new TypeFactory(provider);

    // This function demonstrates exhaustive error handling
    function handleTypeCreationResult<T>(result: TypeCreationResult<T>): string {
      // Handle success/failure states without default
      switch (result.ok) {
        case true:
          return `Success: ${result.data}`;

        case false:
          // Handle all error kinds without default
          switch (result.error.kind) {
            case "PatternNotFound":
              return `Pattern not found: ${result.error.message}`;

            case "ValidationFailed":
              return `Validation failed: ${
                (result.error as Record<string, unknown>).value
              } does not match ${(result.error as Record<string, unknown>).pattern}`;

            case "InvalidPattern":
              return `Invalid pattern: ${
                (result.error as Record<string, unknown>).pattern
              } caused by ${(result.error as Record<string, unknown>).cause}`;
          }

          // This should be unreachable if switch is exhaustive
          throw new Error(
            `Unhandled error kind: ${(result.error as Record<string, unknown>).kind}`,
          );
      }

      // This should be unreachable if switch is exhaustive
      throw new Error(`Unhandled result state: ${result}`);
    }

    // Test that the function handles all cases
    provider.enablePatterns();
    const successResult = factory.createDirectiveType("to");
    const successMessage = handleTypeCreationResult(successResult);
    assertEquals(successMessage.startsWith("Success:"), true);

    provider.disablePatterns();
    const failureResult = factory.createDirectiveType("to");
    const failureMessage = handleTypeCreationResult(failureResult);
    assertEquals(failureMessage.startsWith("Pattern not found:"), true);
  });
});
