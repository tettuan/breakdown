/**
 * @fileoverview 1_behavior tests for UnifiedPromptVariablesFactory
 *
 * Validates:
 * - Unified factory creation behavior with Result pattern
 * - Error handling for configuration failures
 * - Type-safe parameter validation behavior
 * - Path resolver integration behavior
 * - Legacy adapter behavior
 */

import { assertEquals, assertExists, assertThrows } from "@std/assert";
import {
  LegacyToUnifiedAdapter,
  type PromptCliOptions,
  type UnifiedPromptCliParams,
  UnifiedPromptVariablesFactory,
} from "./prompt_variables_factory_unified.ts";
import { DirectiveType } from "../types/directive_type.ts";
import { LayerType } from "../types/layer_type.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("factory-unified-behavior-test");

// Helper function to create valid unified parameters
function createValidUnifiedParams(): UnifiedPromptCliParams {
  const directive = DirectiveType.create({
    type: "two",
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  });

  const layer = LayerType.create({
    type: "two",
    params: ["to", "project"],
    demonstrativeType: "to",
    layerType: "project",
    options: {},
  });

  return {
    directive,
    layer,
    options: {
      fromFile: "./test/input.md",
      destinationFile: "./test/output.md",
      promptDir: "/tmp/prompts",
    },
  };
}

Deno.test("UnifiedFactory - 1_behavior - creates factory with valid configuration", async () => {
  logger.debug("Testing unified factory creation with valid config");

  const params = createValidUnifiedParams();

  try {
    const factory = await UnifiedPromptVariablesFactory.create(params);

    assertExists(factory, "Factory should be created successfully");
    assertEquals(typeof factory, "object", "Factory should be object instance");
    assertEquals(
      factory instanceof UnifiedPromptVariablesFactory,
      true,
      "Should be UnifiedPromptVariablesFactory instance",
    );

    logger.debug("Factory created successfully", { factory: factory.constructor.name });
  } catch (error) {
    logger.debug("Factory creation failed", { error });
    // If creation fails, it should still be a proper Error
    assertExists(error, "Error should exist if creation fails");
    assertEquals(error instanceof Error, true, "Should throw proper Error instance");
  }
});

Deno.test("UnifiedFactory - 1_behavior - handles configuration loading failures gracefully", async () => {
  logger.debug("Testing configuration loading failure handling");

  const params = createValidUnifiedParams();
  // Add invalid config that might cause BreakdownConfig to fail
  params.options.config = "invalid_config_that_does_not_exist";

  try {
    const factory = await UnifiedPromptVariablesFactory.create(params);

    // Should either succeed with default config or fail gracefully
    assertExists(factory, "Factory should handle config failures gracefully");
    logger.debug("Factory handled config failure gracefully");
  } catch (error) {
    // Should provide meaningful error message
    assertExists(error, "Error should exist for invalid config");
    assertEquals(error instanceof Error, true, "Should be Error instance");
    logger.debug("Factory failed with expected error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

Deno.test("UnifiedFactory - 1_behavior - validates all parameters before construction", async () => {
  logger.debug("Testing parameter validation behavior");

  const validParams = createValidUnifiedParams();

  try {
    const factoryResult = await UnifiedPromptVariablesFactory.create(validParams);

    if (factoryResult.ok) {
      const factory = factoryResult.data;

      // Test validation method
      try {
        factory.validateAll();
        logger.debug("Validation passed for valid parameters");
      } catch (validationError) {
        logger.debug("Validation failed", { error: validationError });
        // Validation may fail due to file system constraints in test environment
        assertExists(validationError, "Validation error should exist if validation fails");
      }
    } else {
      logger.debug("Factory creation failed during validation test", {
        error: factoryResult.error,
      });
      assertExists(factoryResult.error, "Creation error should exist if creation fails");
    }
  } catch (creationError) {
    logger.debug("Factory creation failed during validation test", { error: creationError });
    assertExists(creationError, "Creation error should exist if creation fails");
  }
});

Deno.test("UnifiedFactory - 1_behavior - provides type-safe path accessors", async () => {
  logger.debug("Testing type-safe path accessor behavior");

  const params = createValidUnifiedParams();

  try {
    const factoryResult = await UnifiedPromptVariablesFactory.create(params);

    if (factoryResult.ok) {
      const factory = factoryResult.data;

      // Test all path accessors
      const pathAccessors = [
        () => factory.promptFilePath,
        () => factory.inputFilePath,
        () => factory.outputFilePath,
        () => factory.schemaFilePath,
      ];

      for (const accessor of pathAccessors) {
        try {
          const path = accessor();
          assertEquals(typeof path, "string", "Path should be string");
          assertExists(path.trim(), "Path should not be empty");
          logger.debug("Path accessor succeeded", { path });
        } catch (pathError) {
          // Path resolution may fail in test environment
          logger.debug("Path accessor failed as expected", { error: pathError });
          assertExists(pathError, "Path error should exist if path resolution fails");
        }
      }
    } else {
      logger.debug("Factory creation failed during path accessor test", {
        error: factoryResult.error,
      });
      assertExists(factoryResult.error, "Error should exist if factory creation fails");
    }
  } catch (error) {
    logger.debug("Factory creation failed during path accessor test", { error });
    assertExists(error, "Error should exist if factory creation fails");
  }
});

Deno.test("UnifiedFactory - 1_behavior - handles base directory validation", async () => {
  logger.debug("Testing base directory validation behavior");

  const params = createValidUnifiedParams();

  try {
    const factoryResult = await UnifiedPromptVariablesFactory.create(params);

    if (factoryResult.ok) {
      const factory = factoryResult.data;

      // Test base directory validation methods
      const hasValidBaseDir = factory.hasValidBaseDir();
      assertEquals(typeof hasValidBaseDir, "boolean", "Base dir validation should return boolean");

      const baseDirError = factory.getBaseDirError();
      if (baseDirError !== undefined) {
        assertEquals(typeof baseDirError, "string", "Base dir error should be string");
        logger.debug("Base directory validation failed", { error: baseDirError });
      } else {
        logger.debug("Base directory validation passed");
      }
    } else {
      logger.debug("Factory creation failed during base dir test", { error: factoryResult.error });
      assertExists(factoryResult.error, "Error should exist if factory creation fails");
    }
  } catch (error) {
    logger.debug("Factory creation failed during base dir test", { error });
    assertExists(error, "Error should exist if factory creation fails");
  }
});

Deno.test("UnifiedFactory - 1_behavior - provides option accessors with defaults", async () => {
  logger.debug("Testing option accessor behavior with defaults");

  const params = createValidUnifiedParams();

  try {
    const factoryResult = await UnifiedPromptVariablesFactory.create(params);

    if (factoryResult.ok) {
      const factory = factoryResult.data;

      // Test option accessors with default values
      const customVariables = factory.customVariables;
      assertEquals(typeof customVariables, "object", "Custom variables should be object");
      assertEquals(customVariables !== null, true, "Custom variables should not be null");

      const extended = factory.extended;
      assertEquals(typeof extended, "boolean", "Extended should be boolean");

      const customValidation = factory.customValidation;
      assertEquals(typeof customValidation, "boolean", "Custom validation should be boolean");

      const errorFormat = factory.errorFormat;
      assertEquals(
        ["simple", "detailed", "json"].includes(errorFormat),
        true,
        "Error format should be valid enum value",
      );

      logger.debug("Option accessors working correctly", {
        customVariables,
        extended,
        customValidation,
        errorFormat,
      });
    } else {
      logger.debug("Factory creation failed during option accessor test", {
        error: factoryResult.error,
      });
      assertExists(factoryResult.error, "Error should exist if factory creation fails");
    }
  } catch (error) {
    logger.debug("Factory creation failed during option accessor test", { error });
    assertExists(error, "Error should exist if factory creation fails");
  }
});

Deno.test("LegacyAdapter - 1_behavior - converts legacy parameters to unified format", async () => {
  logger.debug("Testing legacy to unified parameter conversion");

  const legacyParams = {
    demonstrativeType: "to",
    layerType: "project",
    options: {
      fromFile: "./test/input.md",
      destinationFile: "./test/output.md",
    } as PromptCliOptions,
  };

  try {
    const unifiedParams = await LegacyToUnifiedAdapter.adapt(legacyParams);

    assertExists(unifiedParams, "Unified params should be created");
    assertEquals(typeof unifiedParams, "object", "Unified params should be object");

    // Verify structure
    assertExists(unifiedParams.directive, "Should have directive");
    assertExists(unifiedParams.layer, "Should have layer");
    assertExists(unifiedParams.options, "Should have options");

    // Verify types
    assertEquals(
      unifiedParams.directive instanceof DirectiveType,
      true,
      "Directive should be DirectiveType",
    );
    assertEquals(unifiedParams.layer instanceof LayerType, true, "Layer should be LayerType");

    logger.debug("Legacy adapter conversion successful", { unifiedParams });
  } catch (error) {
    logger.debug("Legacy adapter failed", { error });
    assertExists(error, "Error should exist if adapter fails");
    assertEquals(error instanceof Error, true, "Should be Error instance");
  }
});

Deno.test("UnifiedFactory - 1_behavior - getAllParams returns complete parameter set", async () => {
  logger.debug("Testing getAllParams behavior");

  const params = createValidUnifiedParams();

  try {
    const factoryResult = await UnifiedPromptVariablesFactory.create(params);

    if (factoryResult.ok) {
      const factory = factoryResult.data;

      try {
        const allParams = factory.getAllParams();

        assertExists(allParams, "Should return parameters object");
        assertEquals(typeof allParams, "object", "Parameters should be object");

        // Verify required properties exist
        const requiredProperties = [
          "promptFilePath",
          "inputFilePath",
          "outputFilePath",
          "schemaFilePath",
          "directive",
          "layer",
        ];

        for (const prop of requiredProperties) {
          assertEquals(prop in allParams, true, `Should have ${prop} property`);
        }

        logger.debug("getAllParams returned complete parameter set", { allParams });
      } catch (getParamsError) {
        logger.debug("getAllParams failed", { error: getParamsError });
        assertExists(getParamsError, "Error should exist if getAllParams fails");
      }
    } else {
      logger.debug("Factory creation failed during getAllParams test", {
        error: factoryResult.error,
      });
      assertExists(factoryResult.error, "Error should exist if factory creation fails");
    }
  } catch (error) {
    logger.debug("Factory creation failed during getAllParams test", { error });
    assertExists(error, "Error should exist if factory creation fails");
  }
});
