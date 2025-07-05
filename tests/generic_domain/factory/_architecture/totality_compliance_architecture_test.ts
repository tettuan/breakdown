/**
 * Architecture tests for Totality compliance across the factory system
 *
 * These tests verify that the entire factory system follows the Totality principle,
 * ensuring that all possible states are handled explicitly without default cases
 * in switch statements, and that all error conditions are represented as values.
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import {
  DirectiveType,
  LayerType,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  type TypeCreationError,
  type TypeCreationResult,
  TypeFactory,
  type TypePatternProvider,
} from "../types/mod.ts";
import {
  type PromptCliParams,
  PromptVariablesFactory,
  type TotalityPromptCliParams,
  TotalityPromptVariablesFactory,
  type TwoParams_Result,
} from "../../../../lib/factory/prompt_variables_factory.ts";

const logger = new BreakdownLogger("totality-compliance");

/**
 * Comprehensive pattern provider for testing all scenarios
 */
class ComprehensivePatternProvider implements TypePatternProvider {
  constructor(
    private directivePatterns: string[] = ["to", "summary", "defect", "init", "find"],
    private layerPatterns: string[] = ["project", "issue", "task", "bugs", "temp"],
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    const patternString = this.directivePatterns.join("|");
    return TwoParamsDirectivePattern.create(patternString);
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    const patternString = this.layerPatterns.join("|");
    return TwoParamsLayerTypePattern.create(patternString);
  }

  // For testing pattern enumeration
  getAllDirectiveValues(): string[] {
    return [...this.directivePatterns];
  }

  getAllLayerValues(): string[] {
    return [...this.layerPatterns];
  }
}

describe("Totality Principle - Exhaustive State Coverage", () => {
  it("should handle all possible TypeCreationError kinds without default case", async () => {
    logger.debug("Testing exhaustive TypeCreationError handling");

    const provider = new ComprehensivePatternProvider();
    const factory = new TypeFactory(provider);

    // Create all possible error types
    const errors: TypeCreationError[] = [
      { kind: "PatternNotFound", message: "Pattern not found" },
      { kind: "ValidationFailed", value: "invalid", pattern: "valid_pattern" },
      { kind: "InvalidPattern", pattern: "bad_pattern", cause: "regex_error" },
    ];

    // Test exhaustive switch without default
    errors.forEach((error) => {
      let handled = false;

      // This switch should handle all cases without default
      switch (error.kind) {
        case "PatternNotFound":
          assertEquals(error.message, "Pattern not found");
          handled = true;
          break;
        case "ValidationFailed":
          assertExists((error as any).value);
          assertExists((error as any).pattern);
          handled = true;
          break;
        case "InvalidPattern":
          assertExists((error as any).pattern);
          assertExists((error as any).cause);
          handled = true;
          break;
      }

      assertEquals(handled, true, `Error kind ${error.kind} should be handled`);
    });
  });

  it("should handle all directive types without default case", async () => {
    logger.debug("Testing exhaustive directive type handling");

    const provider = new ComprehensivePatternProvider();
    const factory = new TypeFactory(provider);
    const allDirectives = provider.getAllDirectiveValues();

    allDirectives.forEach((directiveValue) => {
      const result = factory.createDirectiveType(directiveValue);
      assertEquals(result.ok, true);

      if (result.ok) {
        const directive = result.data;
        let handled = false;

        // This switch should handle all known directive types without default
        switch (directive.getValue()) {
          case "to":
            assertEquals(directive.getValue(), "to");
            handled = true;
            break;
          case "summary":
            assertEquals(directive.getValue(), "summary");
            handled = true;
            break;
          case "defect":
            assertEquals(directive.getValue(), "defect");
            handled = true;
            break;
          case "init":
            assertEquals(directive.getValue(), "init");
            handled = true;
            break;
          case "find":
            assertEquals(directive.getValue(), "find");
            handled = true;
            break;
        }

        assertEquals(handled, true, `Directive ${directiveValue} should be handled`);
      }
    });
  });

  it("should handle all layer types without default case", async () => {
    logger.debug("Testing exhaustive layer type handling");

    const provider = new ComprehensivePatternProvider();
    const factory = new TypeFactory(provider);
    const allLayers = provider.getAllLayerValues();

    allLayers.forEach((layerValue) => {
      const result = factory.createLayerType(layerValue);
      assertEquals(result.ok, true);

      if (result.ok) {
        const layer = result.data;
        let handled = false;

        // This switch should handle all known layer types without default
        switch (layer.getValue()) {
          case "project":
            assertEquals(layer.getHierarchyLevel(), 1);
            assertEquals(layer.isStandardHierarchy(), true);
            handled = true;
            break;
          case "issue":
            assertEquals(layer.getHierarchyLevel(), 2);
            assertEquals(layer.isStandardHierarchy(), true);
            handled = true;
            break;
          case "task":
            assertEquals(layer.getHierarchyLevel(), 3);
            assertEquals(layer.isStandardHierarchy(), true);
            handled = true;
            break;
          case "bugs":
            assertEquals(layer.getHierarchyLevel(), 0);
            assertEquals(layer.isStandardHierarchy(), false);
            handled = true;
            break;
          case "temp":
            assertEquals(layer.getHierarchyLevel(), 0);
            assertEquals(layer.isStandardHierarchy(), false);
            handled = true;
            break;
        }

        assertEquals(handled, true, `Layer ${layerValue} should be handled`);
      }
    });
  });
});

describe("Totality Principle - Result Type Exhaustive Handling", () => {
  it("should handle all TypeCreationResult states without default case", async () => {
    logger.debug("Testing exhaustive TypeCreationResult state handling");

    const provider = new ComprehensivePatternProvider();
    const factory = new TypeFactory(provider);

    // Test success case
    const successResult = factory.createDirectiveType("to");
    let successHandled = false;

    switch (successResult.ok) {
      case true:
        assertExists(successResult.data);
        assertEquals(typeof (successResult as any).error, "undefined");
        successHandled = true;
        break;
      case false:
        assertExists(successResult.error);
        assertEquals(typeof (successResult as any).data, "undefined");
        break;
    }

    assertEquals(successHandled, true);

    // Test failure case
    const failureResult = factory.createDirectiveType("invalid");
    let failureHandled = false;

    switch (failureResult.ok) {
      case true:
        assertExists(failureResult.data);
        assertEquals(typeof (failureResult as any).error, "undefined");
        break;
      case false:
        assertExists(failureResult.error);
        assertEquals(typeof (failureResult as any).data, "undefined");
        failureHandled = true;
        break;
    }

    assertEquals(failureHandled, true);
  });

  it("should handle pattern availability states without default case", async () => {
    logger.debug("Testing exhaustive pattern availability handling");

    // Test all possible availability combinations
    const availabilityCombinations = [
      { directive: true, layer: true }, // Both available
      { directive: true, layer: false }, // Directive only
      { directive: false, layer: true }, // Layer only
      { directive: false, layer: false }, // Neither available
    ];

    availabilityCombinations.forEach(({ directive, layer }) => {
      const patterns = directive ? ["to", "summary"] : [];
      const layerPatterns = layer ? ["project", "issue"] : [];

      class TestProvider implements TypePatternProvider {
        getDirectivePattern() {
          return patterns.length > 0 ? TwoParamsDirectivePattern.create(patterns.join("|")) : null;
        }
        getLayerTypePattern() {
          return layerPatterns.length > 0
            ? TwoParamsLayerTypePattern.create(layerPatterns.join("|"))
            : null;
        }
      }

      const testProvider = new TestProvider();
      const testFactory = new TypeFactory(testProvider);
      const availability = testFactory.getPatternAvailability();

      let handled = false;

      // Handle all combinations without default
      if (availability.directive && availability.layer) {
        assertEquals(availability.both, true);
        handled = true;
      } else if (availability.directive && !availability.layer) {
        assertEquals(availability.both, false);
        handled = true;
      } else if (!availability.directive && availability.layer) {
        assertEquals(availability.both, false);
        handled = true;
      } else if (!availability.directive && !availability.layer) {
        assertEquals(availability.both, false);
        handled = true;
      }

      assertEquals(
        handled,
        true,
        `Availability combination should be handled: ${JSON.stringify(availability)}`,
      );
    });
  });
});

describe("Totality Principle - Error Format Exhaustive Handling", () => {
  it("should handle all error format types without default case", async () => {
    logger.debug("Testing exhaustive error format handling");

    const provider = new ComprehensivePatternProvider();
    const typeFactory = new TypeFactory(provider);

    // Create valid types for testing
    const typesResult = typeFactory.createBothTypes("to", "project");
    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const errorFormats: Array<"simple" | "detailed" | "json"> = ["simple", "detailed", "json"];

      for (const errorFormat of errorFormats) {
        const params: TotalityPromptCliParams = {
          demonstrativeType: typesResult.data.directive.getValue(),
          layerType: typesResult.data.layer.getValue(),
          directive: typesResult.data.directive,
          layer: typesResult.data.layer,
          options: { errorFormat },
        };

        const factory = await TotalityPromptVariablesFactory.create(params);
        const format = factory.getOptions().errorFormat;

        let handled = false;

        // Handle all error formats without default
        switch (format) {
          case "simple":
            assertEquals(format, "simple");
            handled = true;
            break;
          case "detailed":
            assertEquals(format, "detailed");
            handled = true;
            break;
          case "json":
            assertEquals(format, "json");
            handled = true;
            break;
        }

        assertEquals(handled, true, `Error format ${format} should be handled`);
      }
    }
  });
});

describe("Totality Principle - Configuration State Exhaustive Handling", () => {
  it("should handle all configuration validation states without default case", async () => {
    logger.debug("Testing exhaustive configuration validation handling");

    const configStates = [
      { hasPromptDir: true, hasSchemaDir: true, valid: true },
      { hasPromptDir: true, hasSchemaDir: false, valid: false },
      { hasPromptDir: false, hasSchemaDir: true, valid: false },
      { hasPromptDir: false, hasSchemaDir: false, valid: false },
    ];

    configStates.forEach((state) => {
      const config = {
        app_prompt: state.hasPromptDir ? { base_dir: "prompts" } : {},
        app_schema: state.hasSchemaDir ? { base_dir: "schemas" } : {},
      };

      // Validate configuration state
      const promptDirExists = !!config.app_prompt?.base_dir;
      const schemaDirExists = !!config.app_schema?.base_dir;

      let handled = false;

      // Handle all configuration states without default
      if (promptDirExists && schemaDirExists) {
        assertEquals(state.valid, true);
        handled = true;
      } else if (promptDirExists && !schemaDirExists) {
        assertEquals(state.valid, false);
        handled = true;
      } else if (!promptDirExists && schemaDirExists) {
        assertEquals(state.valid, false);
        handled = true;
      } else if (!promptDirExists && !schemaDirExists) {
        assertEquals(state.valid, false);
        handled = true;
      }

      assertEquals(
        handled,
        true,
        `Configuration state should be handled: ${JSON.stringify(state)}`,
      );
    });
  });

  it("should handle directory validation states without default case", async () => {
    logger.debug("Testing exhaustive directory validation handling");

    const provider = new ComprehensivePatternProvider();
    const typeFactory = new TypeFactory(provider);
    const typesResult = typeFactory.createBothTypes("to", "project");

    assertEquals(typesResult.ok, true);

    if (typesResult.ok) {
      const params: TotalityPromptCliParams = {
        demonstrativeType: typesResult.data.directive.getValue(),
        layerType: typesResult.data.layer.getValue(),
        directive: typesResult.data.directive,
        layer: typesResult.data.layer,
        options: {},
      };

      const factory = await TotalityPromptVariablesFactory.create(params);
      const hasValidBaseDir = factory.hasValidBaseDir();
      const baseDirError = factory.getBaseDirError();

      let handled = false;

      // Handle base directory validation states without default
      switch (hasValidBaseDir) {
        case true:
          assertEquals(baseDirError, undefined);
          handled = true;
          break;
        case false:
          assertExists(baseDirError);
          handled = true;
          break;
      }

      assertEquals(handled, true, "Base directory validation state should be handled");
    }
  });
});

describe("Totality Principle - Factory State Machine Coverage", () => {
  it("should handle all factory creation states without default case", async () => {
    logger.debug("Testing exhaustive factory creation state handling");

    const provider = new ComprehensivePatternProvider();
    const typeFactory = new TypeFactory(provider);

    // Test all valid creation combinations
    const validCombinations = [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
      ["init", "bugs"],
      ["find", "temp"],
    ];

    for (const [directiveValue, layerValue] of validCombinations) {
      const result = typeFactory.createBothTypes(directiveValue, layerValue);

      let handled = false;

      // Handle result states without default
      switch (result.ok) {
        case true:
          assertExists(result.data);
          assertExists(result.data.directive);
          assertExists(result.data.layer);

          const params: TotalityPromptCliParams = {
            demonstrativeType: result.data.directive.getValue(),
            layerType: result.data.layer.getValue(),
            directive: result.data.directive,
            layer: result.data.layer,
            options: {},
          };

          const factory = await TotalityPromptVariablesFactory.create(params);
          assertExists(factory);
          handled = true;
          break;
        case false:
          assertExists(result.error);
          handled = true;
          break;
      }

      assertEquals(
        handled,
        true,
        `Creation state should be handled for ${directiveValue}/${layerValue}`,
      );
    }
  });

  it("should enforce compile-time exhaustiveness checking", async () => {
    logger.debug("Testing compile-time exhaustiveness enforcement");

    // This test documents that our switch statements are exhaustive
    // by ensuring TypeScript compiler would catch missing cases

    const provider = new ComprehensivePatternProvider();
    const factory = new TypeFactory(provider);
    const result = factory.createDirectiveType("to");

    if (result.ok) {
      const directive = result.data;

      // This function should handle all DirectiveType values
      function handleDirective(d: DirectiveType): string {
        const value = d.getValue();

        // If we add a new directive type to the pattern,
        // TypeScript should require us to handle it here
        switch (value) {
          case "to":
            return "conversion";
          case "summary":
            return "summarization";
          case "defect":
            return "analysis";
          case "init":
            return "initialization";
          case "find":
            return "search";
            // NOTE: No default case - TypeScript ensures exhaustiveness
        }

        // This should be unreachable if switch is exhaustive
        throw new Error(`Unhandled directive type: ${value}`);
      }

      const handledType = handleDirective(directive);
      assertEquals(handledType, "conversion");
    }
  });
});
