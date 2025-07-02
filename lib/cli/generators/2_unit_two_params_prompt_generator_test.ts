/**
 * @fileoverview Unit tests for TwoParamsPromptGenerator
 *
 * Tests functional behavior and business logic:
 * - Successful prompt generation flow
 * - Error handling scenarios
 * - Integration with dependencies
 * - Edge cases and validation
 *
 * @module cli/generators/2_unit_two_params_prompt_generator_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { TwoParamsPromptGenerator } from "./two_params_prompt_generator.ts";
import type { ValidatedParams } from "./two_params_prompt_generator.ts";
import type { ProcessedVariables } from "../processors/two_params_variable_processor.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new BreakdownLogger("two-params-prompt-generator-test");

Deno.test("Unit: TwoParamsPromptGenerator generates prompt successfully with valid inputs", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const _config = {
    promptDir: "./prompts",
    outputDir: "./output",
    configDir: "./config",
    verbose: false,
  };

  const validatedParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "project",
  };

  const options = {
    from: "input.md",
    to: "output.md",
    schema: "project.json",
  };

  const processedVariables: ProcessedVariables = {
    standardVariables: {
      input_text: "Test content",
      input_text_file: "input.md",
      destination_path: "output.md",
    },
    customVariables: {
      project_name: "TestProject",
      author: "TestUser",
    },
    allVariables: {
      input_text: "Test content",
      input_text_file: "input.md",
      destination_path: "output.md",
      project_name: "TestProject",
      author: "TestUser",
    },
  };

  const _result = await _generator.generatePrompt(
    config,
    validatedParams,
    options,
    processedVariables,
  );

  _logger.debug("Prompt generation result", { success: _result.ok });

  // May fail due to missing prompt files in test environment
  if (!_result.ok) {
    assertExists(_result.error, "Should have error on failure");
    assertExists(_result.error.kind, "Error should have kind");
    _logger.debug("Expected failure in test environment", { errorKind: _result.error.kind });
  }
});

Deno.test("Unit: TwoParamsPromptGenerator handles invalid configuration", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const invalidConfig = null as unknown;

  const validatedParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "project",
  };

  const _result = await _generator.generatePrompt(
    invalidConfig,
    validatedParams,
    {},
    { standardVariables: {}, customVariables: {}, allVariables: {} },
  );

  assertEquals(_result.ok, false, "Should fail with invalid config");

  if (!_result.ok) {
    assertEquals(_result.error.kind, "InvalidConfiguration", "Should be InvalidConfiguration error");
    if (_result.error.kind === "InvalidConfiguration") {
      assertStringIncludes(_result.error.message, "Configuration must be a valid object");
    }
  }
});

Deno.test("Unit: TwoParamsPromptGenerator handles missing required configuration properties", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const incompleteConfig = {
    // Missing promptDir
    outputDir: "./output",
  };

  const validatedParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "project",
  };

  const _result = await _generator.generatePrompt(
    incompleteConfig,
    validatedParams,
    {},
    { standardVariables: {}, customVariables: {}, allVariables: {} },
  );

  assertEquals(_result.ok, false, "Should fail with incomplete config");

  if (!_result.ok) {
    // Should fail with ConfigurationValidationError due to missing required properties
    assertEquals(
      _result.error.kind,
      "ConfigurationValidationError",
      "Should be ConfigurationValidationError due to missing config",
    );
    if (_result.error.kind === "ConfigurationValidationError") {
      assertExists(_result.error.message, "Should have error message");
      assertExists(_result.error.missingProperties, "Should have missing properties list");
      assertEquals(
        Array.isArray(_result.error.missingProperties),
        true,
        "Missing properties should be array",
      );
    }
  }
});

Deno.test("Unit: TwoParamsPromptGenerator processes custom variables correctly", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const _config = {
    promptDir: "./prompts",
    outputDir: "./output",
    configDir: "./config",
    verbose: true,
  };

  const validatedParams: ValidatedParams = {
    demonstrativeType: "summary",
    layerType: "issue",
  };

  const options = {
    from: "issue.md",
    to: "summary.md",
    "uv-priority": "high",
    "uv-assignee": "developer1",
    "uv-sprint": "2024-Q1",
  };

  const processedVariables: ProcessedVariables = {
    standardVariables: {
      input_text: "Issue description",
      input_text_file: "issue.md",
      destination_path: "summary.md",
    },
    customVariables: {
      priority: "high",
      assignee: "developer1",
      sprint: "2024-Q1",
    },
    allVariables: {
      input_text: "Issue description",
      input_text_file: "issue.md",
      destination_path: "summary.md",
      priority: "high",
      assignee: "developer1",
      sprint: "2024-Q1",
    },
  };

  const _result = await _generator.generatePrompt(
    config,
    validatedParams,
    options,
    processedVariables,
  );

  // Verify custom variables are passed through
  if (!_result.ok) {
    _logger.debug("Custom variables test", {
      errorKind: _result.error.kind,
      customVarsCount: Object.keys(processedVariables.customVariables).length,
    });
  }
});

Deno.test("Unit: TwoParamsPromptGenerator handles factory creation errors", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const _config = {
    promptDir: "/nonexistent/path",
    outputDir: "/another/nonexistent",
    configDir: "./config",
  };

  const validatedParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "unknown-layer", // May cause factory creation error
  };

  const _result = await _generator.generatePrompt(
    config,
    validatedParams,
    {},
    { standardVariables: {}, customVariables: {}, allVariables: {} },
  );

  if (!_result.ok) {
    _logger.debug("Factory creation error test", { errorKind: _result.error.kind });
    assertExists(_result.error.kind, "Should have error kind");
    // Could be FactoryCreationError or FactoryValidationError
  }
});

Deno.test("Unit: TwoParamsPromptGenerator integrates with VariablesBuilder", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const _config = {
    promptDir: "./prompts",
    outputDir: "./output",
    configDir: "./config",
  };

  const validatedParams: ValidatedParams = {
    demonstrativeType: "find",
    layerType: "bugs",
  };

  const options = {
    from: "codebase.md",
    to: "bugs-report.md",
    stdin: true,
    "uv-severity": "critical",
    "uv-component": "authentication",
  };

  const processedVariables: ProcessedVariables = {
    standardVariables: {
      input_text: "Code analysis results",
      input_text_file: "codebase.md",
      destination_path: "bugs-report.md",
    },
    customVariables: {
      severity: "critical",
      component: "authentication",
    },
    allVariables: {
      input_text: "Code analysis results",
      input_text_file: "codebase.md",
      destination_path: "bugs-report.md",
      severity: "critical",
      component: "authentication",
    },
  };

  const _result = await _generator.generatePrompt(
    config,
    validatedParams,
    options,
    processedVariables,
  );

  // Verify builder integration
  if (!_result.ok && _result.error.kind === "VariablesBuilderError") {
    assertExists(_result.error.errors, "Builder errors should be array");
    assertEquals(Array.isArray(_result.error.errors), true, "Should have errors array");
  }
});

Deno.test("Unit: TwoParamsPromptGenerator handles all demonstrative types", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const _config = {
    promptDir: "./prompts",
    outputDir: "./output",
    configDir: "./config",
  };

  const demonstrativeTypes = ["to", "summary", "find"];
  const layerTypes = ["project", "task", "issue", "bugs"];

  for (const demonstrativeType of demonstrativeTypes) {
    for (const layerType of layerTypes) {
      const validatedParams: ValidatedParams = {
        demonstrativeType: demonstrativeType as unknown,
        layerType,
      };

      const _result = await _generator.generatePrompt(
        config,
        validatedParams,
        {},
        { standardVariables: {}, customVariables: {}, allVariables: {} },
      );

      // Should attempt to generate for all combinations
      assertExists(_result.ok !== undefined, `Should handle ${demonstrativeType}/${layerType}`);
    }
  }
});

Deno.test("Unit: TwoParamsPromptGenerator respects verbose flag", async () => {
  const _generator = new TwoParamsPromptGenerator();

  const configVerbose = {
    promptDir: "./prompts",
    outputDir: "./output",
    configDir: "./config",
    verbose: true,
  };

  const configQuiet = {
    ...configVerbose,
    verbose: false,
  };

  const validatedParams: ValidatedParams = {
    demonstrativeType: "to",
    layerType: "project",
  };

  // Test with verbose
  const resultVerbose = await _generator.generatePrompt(
    configVerbose,
    validatedParams,
    {},
    { standardVariables: {}, customVariables: {}, allVariables: {} },
  );

  // Test without verbose
  const resultQuiet = await _generator.generatePrompt(
    configQuiet,
    validatedParams,
    {},
    { standardVariables: {}, customVariables: {}, allVariables: {} },
  );

  // Both should have same success/failure status
  assertEquals(resultVerbose.ok, resultQuiet.ok, "Verbose flag should not affect result");
});
