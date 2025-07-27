/**
 * @fileoverview Enhanced validation tests for PromptTemplatePathResolverTotality
 *
 * Tests focus on new validation logic including:
 * - Type safety validation for configurations and CLI options
 * - Enhanced error handling with PathResolutionError
 * - Absolute path validation and rejection
 * - Configuration normalization with proper defaults
 * - Smart Constructor pattern validation
 */

import { assertEquals, assertExists } from "../deps.ts";
import { join } from "jsr:@std/path@^1.0.9";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  formatPathResolutionError,
  PromptTemplatePathResolverTotality,
} from "./prompt_template_path_resolver_totality.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";
import type { TwoParams_Result } from "../deps.ts";

const validationLogger = new BreakdownLogger("validation-test");

// Helper function to create test CLI parameters
function createTestCliParams(overrides: Partial<TwoParams_Result> = {}): TwoParams_Result {
  const baseParams: TwoParams_Result = {
    type: "two",
    params: ["to", "issue"],
    directiveType: "to",
    layerType: "issue",
    options: {
      useSchema: false,
      adaptation: "",
      fromLayerType: "",
      fromFile: "",
    },
  };

  return { ...baseParams, ...overrides };
}

// Helper function to create test environment
async function createValidationTestEnvironment(baseName: string): Promise<{
  testDir: string;
  promptsDir: string;
  schemasDir: string;
  workingDir: string;
}> {
  const testDir = join(Deno.cwd(), "tmp", `validation-test-${baseName}`);
  const promptsDir = join(testDir, "prompts");
  const schemasDir = join(testDir, "schemas");
  const workingDir = join(testDir, "workspace");

  await Deno.mkdir(promptsDir, { recursive: true });
  await Deno.mkdir(schemasDir, { recursive: true });
  await Deno.mkdir(workingDir, { recursive: true });

  return { testDir, promptsDir, schemasDir, workingDir };
}

// Cleanup helper
async function cleanupValidationTestEnvironment(testDir: string): Promise<void> {
  try {
    await Deno.remove(testDir, { recursive: true });
  } catch {
    // Ignore cleanup errors
  }
}

Deno.test("Enhanced Validation - Configuration object validation", () => {
  const cliParams = createTestCliParams();

  validationLogger.debug("Testing configuration object validation", {
    testCase: "configuration_object_validation",
  });

  // Valid configuration should pass
  const validConfig = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" },
    working_dir: "./workspace",
  };
  const validResult = PromptTemplatePathResolverTotality.create(validConfig, cliParams);
  assertEquals(validResult.ok, true);

  // Null configuration should fail
  const nullResult = PromptTemplatePathResolverTotality.create(
    null as unknown as Record<string, unknown>,
    cliParams,
  );
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "InvalidConfiguration");
  }

  // Array configuration should fail
  const arrayResult = PromptTemplatePathResolverTotality.create(
    [] as unknown as Record<string, unknown>,
    cliParams,
  );
  assertEquals(arrayResult.ok, false);
  if (!arrayResult.ok) {
    assertEquals(arrayResult.error.kind, "InvalidConfiguration");
  }

  // Undefined configuration should fail
  const undefinedResult = PromptTemplatePathResolverTotality.create(
    undefined as unknown as Record<string, unknown>,
    cliParams,
  );
  assertEquals(undefinedResult.ok, false);
  if (!undefinedResult.ok) {
    assertEquals(undefinedResult.error.kind, "InvalidConfiguration");
  }
});

Deno.test("Enhanced Validation - Absolute path validation and rejection", () => {
  const cliParams = createTestCliParams();

  validationLogger.debug("Testing absolute path validation", {
    testCase: "absolute_path_rejection",
  });

  // Configuration with absolute path in app_prompt should fail
  const absolutePromptConfig = {
    app_prompt: { base_dir: "/absolute/path/to/prompts" },
    working_dir: "./workspace",
  };
  const absolutePromptResult = PromptTemplatePathResolverTotality.create(
    absolutePromptConfig,
    cliParams,
  );
  assertEquals(absolutePromptResult.ok, false);
  if (!absolutePromptResult.ok) {
    // Based on implementation: absolute paths trigger AbsolutePathNotAllowed
    assertEquals(absolutePromptResult.error.kind, "AbsolutePathNotAllowed");
  }

  // Configuration with absolute path in app_schema should fail
  const absoluteSchemaConfig = {
    app_schema: { base_dir: "/absolute/path/to/schemas" },
    working_dir: "./workspace",
  };
  const absoluteSchemaResult = PromptTemplatePathResolverTotality.create(
    absoluteSchemaConfig,
    cliParams,
  );
  assertEquals(absoluteSchemaResult.ok, false);
  if (!absoluteSchemaResult.ok) {
    // Based on implementation: absolute paths trigger AbsolutePathNotAllowed
    assertEquals(absoluteSchemaResult.error.kind, "AbsolutePathNotAllowed");
  }

  // Configuration with relative paths should pass
  const relativeConfig = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" },
    working_dir: "./workspace",
  };
  const relativeResult = PromptTemplatePathResolverTotality.create(relativeConfig, cliParams);
  assertEquals(relativeResult.ok, true);
});

Deno.test("Enhanced Validation - CLI parameters validation", () => {
  const validConfig = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./workspace",
  };

  validationLogger.debug("Testing CLI parameters validation", {
    testCase: "cli_parameters_validation",
  });

  // Null CLI parameters should fail
  const nullParamsResult = PromptTemplatePathResolverTotality.create(
    validConfig,
    null as unknown as TwoParams_Result,
  );
  assertEquals(nullParamsResult.ok, false);
  if (!nullParamsResult.ok) {
    assertEquals(nullParamsResult.error.kind, "InvalidConfiguration");
  }

  // Array CLI parameters should fail
  const arrayParamsResult = PromptTemplatePathResolverTotality.create(
    validConfig,
    [] as unknown as TwoParams_Result,
  );
  assertEquals(arrayParamsResult.ok, false);
  if (!arrayParamsResult.ok) {
    assertEquals(arrayParamsResult.error.kind, "InvalidConfiguration");
  }

  // Empty directiveType should fail
  const emptyDirectiveParams = createTestCliParams({
    directiveType: "",
    params: ["", "issue"],
  });
  const emptyDirectiveResult = PromptTemplatePathResolverTotality.create(
    validConfig,
    emptyDirectiveParams,
  );
  assertEquals(emptyDirectiveResult.ok, false);
  if (!emptyDirectiveResult.ok) {
    assertEquals(emptyDirectiveResult.error.kind, "InvalidParameterCombination");
  }

  // Empty layerType should fail
  const emptyLayerParams = createTestCliParams({
    layerType: "",
    params: ["to", ""],
  });
  const emptyLayerResult = PromptTemplatePathResolverTotality.create(validConfig, emptyLayerParams);
  assertEquals(emptyLayerResult.ok, false);
  if (!emptyLayerResult.ok) {
    assertEquals(emptyLayerResult.error.kind, "InvalidParameterCombination");
  }

  // Valid CLI parameters should pass
  const validParams = createTestCliParams();
  const validResult = PromptTemplatePathResolverTotality.create(validConfig, validParams);
  assertEquals(validResult.ok, true);
});

Deno.test("Enhanced Validation - Configuration normalization with defaults", () => {
  const cliParams = createTestCliParams();

  validationLogger.debug("Testing configuration normalization", {
    testCase: "configuration_normalization",
  });

  // Empty configuration should normalize with defaults
  const emptyConfig = {};
  const emptyResult = PromptTemplatePathResolverTotality.create(emptyConfig, cliParams);
  assertEquals(emptyResult.ok, true);

  // Partial configuration should normalize with defaults
  const partialConfig = {
    app_prompt: { base_dir: "custom-prompts" },
  };
  const partialResult = PromptTemplatePathResolverTotality.create(partialConfig, cliParams);
  assertEquals(partialResult.ok, true);

  // Configuration with only schema should normalize
  const schemaOnlyConfig = {
    app_schema: { base_dir: "custom-schemas" },
  };
  const schemaOnlyResult = PromptTemplatePathResolverTotality.create(schemaOnlyConfig, cliParams);
  assertEquals(schemaOnlyResult.ok, true);

  // Configuration with working_dir should be preserved
  const workingDirConfig = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./custom-workspace",
  };
  const workingDirResult = PromptTemplatePathResolverTotality.create(workingDirConfig, cliParams);
  assertEquals(workingDirResult.ok, true);
});

Deno.test("Enhanced Validation - CLI options type safety", () => {
  const validConfig = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./workspace",
  };

  validationLogger.debug("Testing CLI options type safety", {
    testCase: "cli_options_type_safety",
  });

  // Test with undefined options (should use defaults)
  const undefinedOptionsParams = createTestCliParams({
    options: undefined as unknown as TwoParams_Result["options"],
  });
  const undefinedResult = PromptTemplatePathResolverTotality.create(
    validConfig,
    undefinedOptionsParams,
  );
  assertEquals(undefinedResult.ok, true);

  // Test with partial options (should use defaults for missing)
  const partialOptionsParams = createTestCliParams({
    options: {
      useSchema: true,
      // adaptation, fromLayerType, fromFile missing
    } as unknown as TwoParams_Result["options"],
  });
  const partialResult = PromptTemplatePathResolverTotality.create(
    validConfig,
    partialOptionsParams,
  );
  assertEquals(partialResult.ok, true);

  // Test with all options specified
  const fullOptionsParams = createTestCliParams({
    options: {
      useSchema: true,
      adaptation: "custom",
      fromLayerType: "task",
      fromFile: "task_spec.md",
    },
  });
  const fullResult = PromptTemplatePathResolverTotality.create(validConfig, fullOptionsParams);
  assertEquals(fullResult.ok, true);

  // Test with wrong types in options (should be handled gracefully)
  const wrongTypesParams = createTestCliParams({
    options: {
      useSchema: "true" as unknown as boolean, // string instead of boolean
      adaptation: 123 as unknown as string, // number instead of string
      fromLayerType: true as unknown as string, // boolean instead of string
      fromFile: {} as unknown as string, // object instead of string
    },
  });
  const wrongTypesResult = PromptTemplatePathResolverTotality.create(validConfig, wrongTypesParams);
  assertEquals(wrongTypesResult.ok, true); // Should handle type coercion
});

Deno.test("Enhanced Validation - Smart Constructor pattern validation", () => {
  const validConfig = {
    app_prompt: { base_dir: "prompts" },
    working_dir: "./workspace",
  };
  const cliParams = createTestCliParams();

  validationLogger.debug("Testing Smart Constructor pattern", {
    testCase: "smart_constructor_validation",
  });

  // Valid creation should return Ok result
  const validResult = PromptTemplatePathResolverTotality.create(validConfig, cliParams);
  assertEquals(validResult.ok, true);
  if (validResult.ok) {
    assertExists(validResult.data);
  }

  // Invalid creation should return Error result with specific error type
  const invalidConfig = {
    app_prompt: { base_dir: "/absolute/path" },
  };
  const invalidResult = PromptTemplatePathResolverTotality.create(invalidConfig, cliParams);
  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertExists(invalidResult.error);
    // Based on implementation: absolute paths trigger AbsolutePathNotAllowed
    assertEquals(invalidResult.error.kind, "AbsolutePathNotAllowed");
  }
});

Deno.test("Enhanced Validation - Error message formatting for new error types", () => {
  validationLogger.debug("Testing error message formatting", {
    testCase: "error_message_formatting",
  });

  // Test AbsolutePathNotAllowedError formatting
  const absolutePathError: PathResolutionError = {
    kind: "AbsolutePathNotAllowed",
    path: "/absolute/path/to/prompts",
    configKey: "app_prompt.base_dir",
    message:
      "Absolute path not allowed in app_prompt.base_dir: /absolute/path/to/prompts. Use relative paths only.",
    context: { field: "app_prompt.base_dir", value: "/absolute/path/to/prompts" },
  };

  const formattedMessage = formatPathResolutionError(absolutePathError);
  assertEquals(formattedMessage.includes("Configuration Error"), true);
  assertEquals(formattedMessage.includes("app_prompt.base_dir"), true);
  assertEquals(formattedMessage.includes("/absolute/path/to/prompts"), true);
  assertEquals(formattedMessage.includes("Use relative paths only"), true);

  // Test that other error types still work
  const invalidConfigError: PathResolutionError = {
    kind: "InvalidConfiguration",
    details: "Test configuration error",
  };
  const invalidConfigMessage = formatPathResolutionError(invalidConfigError);
  assertEquals(invalidConfigMessage.includes("Configuration Error"), true);
  assertEquals(invalidConfigMessage.includes("Test configuration error"), true);
});

Deno.test("Enhanced Validation - Integration with real file system", async () => {
  const { testDir, workingDir } = await createValidationTestEnvironment("integration");

  try {
    validationLogger.debug("Testing integration with file system", {
      testCase: "file_system_integration",
      testDir,
      workingDir,
    });

    // Create test files
    const promptFile = join(testDir, "prompts", "to", "issue", "f_task.md");
    await Deno.mkdir(join(testDir, "prompts", "to", "issue"), { recursive: true });
    await Deno.writeTextFile(promptFile, "# Test prompt");

    // Test with working directory and relative paths
    const config = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testDir,
    };
    const cliParams = createTestCliParams({
      options: { fromLayerType: "task" },
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        assertEquals(pathResult.data.value, promptFile);
        assertEquals(pathResult.data.status, "Found");
        assertEquals(pathResult.data.metadata.fromLayerType, "task");
      }
    }
  } finally {
    await cleanupValidationTestEnvironment(testDir);
  }
});

Deno.test("Enhanced Validation - Complex validation scenarios", async () => {
  const { testDir } = await createValidationTestEnvironment("complex");

  try {
    validationLogger.debug("Testing complex validation scenarios", {
      testCase: "complex_validation_scenarios",
    });

    // Scenario 1: Multiple validation failures (should fail at first validation)
    const multiFailConfig = {
      app_prompt: { base_dir: "/absolute/path" }, // Should fail here
      app_schema: { base_dir: "/another/absolute" }, // Won't reach this validation
    };
    const emptyDirectiveParams = createTestCliParams({
      directiveType: "", // Would also fail
      layerType: "", // Would also fail
    });

    const multiFailResult = PromptTemplatePathResolverTotality.create(
      multiFailConfig,
      emptyDirectiveParams,
    );
    assertEquals(multiFailResult.ok, false);
    if (!multiFailResult.ok) {
      // Based on implementation: triggers AbsolutePathNotAllowed for absolute paths
      assertEquals(multiFailResult.error.kind, "AbsolutePathNotAllowed");
    }

    // Scenario 2: Edge case with empty base_dir (should use defaults)
    const emptyBaseDirConfig = {
      app_prompt: { base_dir: "" },
      working_dir: testDir,
    };
    const validParams = createTestCliParams();

    const emptyBaseDirResult = PromptTemplatePathResolverTotality.create(
      emptyBaseDirConfig,
      validParams,
    );
    assertEquals(emptyBaseDirResult.ok, true); // Should normalize to default

    // Scenario 3: Configuration with unexpected additional properties (should be ignored)
    const extraPropsConfig = {
      app_prompt: { base_dir: "prompts" },
      working_dir: testDir,
      unexpected_property: "should be ignored",
      another_extra: { nested: "object" },
    };

    const extraPropsResult = PromptTemplatePathResolverTotality.create(
      extraPropsConfig,
      validParams,
    );
    assertEquals(extraPropsResult.ok, true); // Should handle gracefully
  } finally {
    await cleanupValidationTestEnvironment(testDir);
  }
});
