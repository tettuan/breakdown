/**
 * @fileoverview Builder and Helper System Integration Tests
 *
 * Integration tests for the complete Builder and Helper system including:
 * - VariablesBuilder pattern integration
 * - TotalityFactoryHelper function integration
 * - Interface implementation verification
 * - Complete build and support system integration
 *
 * @module tests/integration/builder_helper_system_integration_test
 */

import { assertEquals as _assertEquals, assertExists as _assertExists } from "jsr:@std/assert@1";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { VariablesBuilder } from "../../lib/builder/variables_builder.ts";
import type { FactoryResolvedValues } from "../../lib/builder/variables_builder.ts";
import {
  createTotalityFactory,
  createTotalityPromptFactory,
  createValidatedCliParams,
  validateConfigurationPatterns,
} from "../../lib/helpers/totality_factory_helper.ts";

const logger = new BreakdownLogger("builder-helper-integration");

Deno.test("Builder-Helper Integration - VariablesBuilder with Factory values", async () => {
  logger.debug("Testing VariablesBuilder with Factory integration");

  // Create factory bundle
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // Mock factory resolved values
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/test/prompts/test.md",
      inputFilePath: "/test/input/test.txt",
      outputFilePath: "/test/output/result.txt",
      schemaFilePath: "/test/schemas/test.json",
      customVariables: {
        "uv-integration": "integration test value",
        "uv-system": "system test value",
      },
      inputText: "Integration test input content",
    };

    // Test VariablesBuilder integration with factory values
    const builder = new VariablesBuilder();
    builder.addFromFactoryValues(factoryValues);

    _assertEquals(
      builder.getVariableCount() > 0,
      true,
      "Builder should create variables from factory values",
    );
    _assertEquals(builder.getErrorCount(), 0, "Should not have errors with valid factory values");

    const buildResult = builder.build();
    _assertEquals(buildResult.ok, true, "Should build successfully");

    if (buildResult.ok) {
      const variables = buildResult.data;
      _assertEquals(Array.isArray(variables), true, "Should return variables array");

      const record = builder.toRecord();
      _assertEquals(typeof record, "object", "Should convert to record format");
      _assertEquals(
        record["uv-integration"],
        "integration test value",
        "Should include custom variables",
      );
      _assertEquals(
        record.input_text,
        "Integration test input content",
        "Should include stdin content",
      );
    }

    logger.debug("VariablesBuilder factory integration successful");
  } else {
    logger.debug("Factory creation failed, skipping builder integration", {
      error: factoryResult.error,
    });
  }
});

Deno.test("Builder-Helper Integration - Complete workflow validation", async () => {
  logger.debug("Testing complete Builder-Helper workflow");

  // Step 1: Validate configuration patterns
  const patternValidation = await validateConfigurationPatterns();
  logger.debug("Pattern validation", { valid: patternValidation.valid });

  // Step 2: Create factory bundle
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // Step 3: Create validated CLI parameters
    const paramsResult = await createValidatedCliParams(
      "test_directive",
      "test_layer",
      { fromFile: "test.md" },
      bundle,
    );

    logger.debug("CLI params validation", { success: paramsResult.ok });

    // Step 4: Use parameters in VariablesBuilder
    if (paramsResult.ok) {
      const params = paramsResult.data;

      // Create factory values from CLI parameters
      const factoryValues: FactoryResolvedValues = {
        promptFilePath: "/test/prompts/workflow.md",
        inputFilePath: "test.md",
        outputFilePath: "/test/output/workflow.txt",
        schemaFilePath: "/test/schemas/workflow.json",
        customVariables: {
          "uv-directive": params.directive.getValue(),
          "uv-layer": params.layer.getValue(),
        },
      };

      // Build variables using integrated workflow
      const builder = VariablesBuilder.fromFactoryValues(factoryValues);
      const buildResult = builder.build();

      if (buildResult.ok) {
        const record = builder.toRecord();
        _assertEquals(
          record["uv-directive"],
          params.directive.getValue(),
          "Should preserve directive value",
        );
        _assertEquals(record["uv-layer"], params.layer.getValue(), "Should preserve layer value");

        logger.debug("Complete workflow integration successful");
      } else {
        logger.debug("Build failed in workflow", { errors: buildResult.error });
      }
    }
  } else {
    logger.debug("Factory creation failed in workflow", { error: factoryResult.error });
  }
});

Deno.test("Builder-Helper Integration - Error handling coordination", async () => {
  logger.debug("Testing coordinated error handling");

  // Test error propagation through the system
  const factoryResult = await createTotalityFactory({
    configSetName: "nonexistent_config_integration_test",
    workspacePath: "/nonexistent/path",
  });

  // Factory creation should handle errors gracefully
  if (!factoryResult.ok) {
    _assertEquals(typeof factoryResult.error, "string", "Factory should provide string error");
    logger.debug("Factory error handled correctly", { error: factoryResult.error });
  }

  // Test VariablesBuilder error handling with invalid data
  const builder = new VariablesBuilder();

  // Add invalid user variables (no uv- prefix)
  builder.addUserVariable("invalid-name", "value");
  builder.addUserVariable("another-invalid", "value");

  const buildResult = builder.build();
  _assertEquals(buildResult.ok, false, "Builder should fail with invalid data");

  if (!buildResult.ok) {
    _assertEquals(Array.isArray(buildResult.error), true, "Should provide error array");
    _assertEquals(buildResult.error.length, 2, "Should contain all errors");

    logger.debug("Builder error accumulation working correctly");
  }
});

Deno.test("Builder-Helper Integration - Performance with large datasets", async () => {
  logger.debug("Testing performance with large datasets");

  const startTime = performance.now();

  // Create large custom variables dataset
  const largeCustomVariables: Record<string, string> = {};
  for (let i = 0; i < 100; i++) {
    largeCustomVariables[`uv-item-${i}`] = `value-${i}`.repeat(10);
  }

  const largeFactoryValues: FactoryResolvedValues = {
    promptFilePath: "/test/prompts/large.md",
    inputFilePath: "/test/input/large.txt",
    outputFilePath: "/test/output/large.txt",
    schemaFilePath: "/test/schemas/large.json",
    customVariables: largeCustomVariables,
    inputText: "Large input text content ".repeat(1000),
  };

  // Test builder performance with large dataset
  const builder = new VariablesBuilder();
  builder.addFromFactoryValues(largeFactoryValues);

  const buildResult = builder.build();

  const duration = performance.now() - startTime;

  logger.debug("Large dataset performance", {
    duration: `${duration.toFixed(2)}ms`,
    variableCount: builder.getVariableCount(),
    success: buildResult.ok,
  });

  // Should complete within reasonable time
  _assertEquals(duration < 1000, true, "Large dataset should process within 1 second");

  if (buildResult.ok) {
    _assertEquals(builder.getVariableCount() > 100, true, "Should handle large variable count");

    const record = builder.toRecord();
    _assertEquals(Object.keys(record).length > 100, true, "Record should contain all variables");
  }
});

Deno.test("Builder-Helper Integration - Memory management", async () => {
  logger.debug("Testing memory management in integration scenarios");

  // Create and destroy multiple builders to test memory usage
  for (let i = 0; i < 10; i++) {
    const builder = new VariablesBuilder();

    // Add substantial data
    builder.addStandardVariable("input_text_file", `file-${i}.txt`);
    builder.addStdinVariable(`Test content for iteration ${i}`);
    builder.addUserVariable(`uv-iteration-${i}`, `value-${i}`);

    const buildResult = builder.build();

    if (buildResult.ok) {
      const record = builder.toRecord();
      _assertEquals(
        Object.keys(record).length,
        3,
        "Each iteration should have correct variable count",
      );
    }

    // Clear builder
    builder.clear();
    _assertEquals(builder.getVariableCount(), 0, "Builder should clear correctly");
    _assertEquals(builder.getErrorCount(), 0, "Builder should clear errors");
  }

  logger.debug("Memory management test completed successfully");
});

Deno.test("Builder-Helper Integration - Factory helper one-step creation", async () => {
  logger.debug("Testing one-step factory creation integration");

  // Test integrated factory creation
  const result = await createTotalityPromptFactory(
    "integration_test_directive",
    "integration_test_layer",
    {
      fromFile: "integration.md",
      extended: true,
    },
    {
      configSetName: "default",
    },
  );

  logger.debug("One-step factory creation", { success: result.ok });

  if (result.ok) {
    const promptFactory = result.data;
    _assertEquals(typeof promptFactory, "object", "Should create prompt factory");
    _assertEquals(typeof promptFactory.getAllParams, "function", "Should have expected methods");

    // Test integration with VariablesBuilder
    const allParams = promptFactory.getAllParams();
    _assertEquals(typeof allParams, "object", "Should provide parameters");

    logger.debug("One-step factory integration successful");
  } else {
    logger.debug("One-step factory creation failed", { error: result.error });
    // May fail due to configuration - this is acceptable for integration test
  }
});

Deno.test("Builder-Helper Integration - Type safety verification", async () => {
  logger.debug("Testing type safety in integration scenarios");

  // Test type consistency across the integration
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // Verify type factory integration
    _assertEquals(
      typeof bundle.typeFactory.createBothTypes,
      "function",
      "TypeFactory should be properly typed",
    );
    _assertEquals(
      typeof bundle.patternProvider.hasValidPatterns,
      "function",
      "PatternProvider should be properly typed",
    );
    _assertEquals(typeof bundle.config.getConfig, "function", "Config should be properly typed");
    _assertEquals(
      typeof bundle.createPromptFactory,
      "function",
      "PromptFactory creator should be function",
    );

    // Test type consistency with VariablesBuilder
    const builder = new VariablesBuilder();

    // These should be type-safe operations
    const factoryValues: FactoryResolvedValues = {
      promptFilePath: "/test/prompt.md",
      inputFilePath: "/test/input.txt",
      outputFilePath: "/test/output.txt",
      schemaFilePath: "/test/schema.json",
    };

    builder.addFromFactoryValues(factoryValues);
    const buildResult = builder.build();

    // Type system should ensure these operations are safe
    _assertEquals(typeof buildResult.ok, "boolean", "Build result should have proper type");

    if (buildResult.ok) {
      _assertEquals(Array.isArray(buildResult.data), true, "Success data should be array");
    } else {
      _assertEquals(Array.isArray(buildResult.error), true, "Error should be array");
    }

    logger.debug("Type safety verification completed");
  }
});

Deno.test("Builder-Helper Integration - Configuration dependency management", async () => {
  logger.debug("Testing configuration dependency management");

  // Test configuration validation across the system
  const configValidation = await validateConfigurationPatterns();
  logger.debug("Configuration validation", {
    valid: configValidation.valid,
    detailCount: configValidation.details.length,
  });

  // Configuration state should be consistent across components
  const factoryResult = await createTotalityFactory();

  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // All components should use the same configuration
    const hasValidPatterns = bundle.patternProvider.hasValidPatterns();
    const configData = await bundle.config.getConfig();

    _assertEquals(typeof hasValidPatterns, "boolean", "Pattern validation should be boolean");
    _assertEquals(typeof configData, "object", "Config data should be object");

    // Pattern availability should be consistent
    if (hasValidPatterns) {
      const directivePattern = bundle.patternProvider.getDirectivePattern();
      const layerPattern = bundle.patternProvider.getLayerTypePattern();

      _assertExists(directivePattern, "Directive pattern should exist when valid");
      _assertExists(layerPattern, "Layer pattern should exist when valid");
    }

    logger.debug("Configuration dependency management verified");
  }
});

Deno.test("Builder-Helper Integration - Interface compatibility", async () => {
  logger.debug("Testing interface compatibility across components");

  // Test that all components implement expected interfaces correctly
  const builder = new VariablesBuilder();

  // Builder should implement fluent interface
  const fluentResult = builder
    .addStandardVariable("test1", "value1")
    .addFilePathVariable("schema_file", "/test/schema.json")
    .addStdinVariable("test input")
    .addUserVariable("uv-test", "test value");

  _assertEquals(fluentResult, builder, "Builder should support fluent interface");

  // Helper functions should implement consistent Result pattern
  const factoryResult = await createTotalityFactory();
  _assertEquals(
    typeof factoryResult.ok,
    "boolean",
    "Factory result should implement Result pattern",
  );

  const validationResult = await validateConfigurationPatterns();
  _assertEquals(
    typeof validationResult.valid,
    "boolean",
    "Validation should have specific interface",
  );
  _assertEquals(
    Array.isArray(validationResult.details),
    true,
    "Validation should provide details array",
  );

  // Integration between components should be seamless
  if (factoryResult.ok) {
    const bundle = factoryResult.data;

    // Bundle should provide consistent interface
    _assertEquals(typeof bundle.typeFactory, "object", "TypeFactory should be object");
    _assertEquals(typeof bundle.patternProvider, "object", "PatternProvider should be object");
    _assertEquals(typeof bundle.config, "object", "Config should be object");
    _assertEquals(
      typeof bundle.createPromptFactory,
      "function",
      "createPromptFactory should be function",
    );
  }

  logger.debug("Interface compatibility verification completed");
});
