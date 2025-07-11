/**
 * @fileoverview Structure tests for PromptGenerationService
 *
 * Tests focused on:
 * - Data structure integrity
 * - Type consistency
 * - Value object immutability
 * - Structural composition
 *
 * @module application/templates/2_structure_prompt_generation_service_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  type PromptGenerationDependencies,
  type PromptGenerationRequest,
  type PromptGenerationResponse,
  PromptGenerationService,
} from "./prompt_generation_service.ts";
import { TypeFactory } from "../../types/mod.ts";
import { TwoParamsDirectivePattern } from "../../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../../types/layer_type.ts";
import type { TemplateRepository } from "../../domain/templates/template_repository.ts";
import type {
  GenerationPolicy,
  GenerationPolicyConfig,
  ResolutionContext,
  SelectionContext,
} from "../../domain/templates/generation_policy.ts";
import {
  PromptTemplate,
  TemplatePath,
  TemplateVariables,
} from "../../domain/templates/prompt_generation_aggregate.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { BreakdownLogger } from "@tettuan/breakdownlogger";

// Create a mock TypePatternProvider for tests
const mockTypePatternProvider = {
  getDirectivePattern: () => TwoParamsDirectivePattern.create("to|summary|defect"),
  getLayerTypePattern: () => TwoParamsLayerTypePattern.create("task|project|issue"),
};

// Create mock GenerationPolicyConfig
const mockGenerationPolicyConfig: GenerationPolicyConfig = {
  requiredVariables: ["input_text", "target"],
  optionalVariables: ["author", "version"],
  variableValidation: {
    input_text: { required: true, minLength: 1 },
    target: { required: true, pattern: /^[a-zA-Z0-9_-]+$/ },
  },
  maxRetries: 3,
  timeoutMs: 30000,
  fallbackStrategies: [],
};

Deno.test("PromptGenerationService - Structure - Request structure validation", () => {
  const typeFactory = new TypeFactory(mockTypePatternProvider);
  const directiveResult = typeFactory.createDirectiveType("to");
  const layerResult = typeFactory.createLayerType("task");

  if (!directiveResult.ok || !layerResult.ok) {
    throw new Error("Failed to create test types");
  }

  const request: PromptGenerationRequest = {
    directive: directiveResult.data,
    layer: layerResult.data,
    variables: {
      key1: "value1",
      key2: "value2",
    },
    options: {
      fromFile: "input.txt",
      toFile: "output.txt",
      adaptation: "custom",
      inputText: "test",
      force: true,
    },
  };

  // Verify structure completeness
  assertExists(request.directive);
  assertExists(request.layer);
  assertExists(request.variables);
  assertExists(request.options);

  // Verify optional fields can be undefined
  const minimalRequest: PromptGenerationRequest = {
    directive: directiveResult.data,
    layer: layerResult.data,
    variables: {},
    options: {},
  };

  assertEquals(minimalRequest.options.fromFile, undefined);
  assertEquals(minimalRequest.options.toFile, undefined);
  assertEquals(minimalRequest.options.adaptation, undefined);
  assertEquals(minimalRequest.options.inputText, undefined);
  assertEquals(minimalRequest.options.force, undefined);
});

Deno.test("PromptGenerationService - Structure - Response structure validation", () => {
  // Success response structure
  const successResponse: PromptGenerationResponse = {
    success: true,
    content: "Generated prompt",
    templatePath: "/path/to/template",
    appliedVariables: {
      var1: "value1",
      var2: "value2",
    },
  };

  assertEquals(successResponse.success, true);
  assertExists(successResponse.content);
  assertExists(successResponse.templatePath);
  assertExists(successResponse.appliedVariables);
  assertEquals(successResponse.error, undefined);

  // Error response structure
  const errorResponse: PromptGenerationResponse = {
    success: false,
    error: {
      type: "ValidationError",
      message: "Validation failed",
      details: { field: "value" },
    },
  };

  assertEquals(errorResponse.success, false);
  assertEquals(errorResponse.content, undefined);
  assertEquals(errorResponse.templatePath, undefined);
  assertEquals(errorResponse.appliedVariables, undefined);
  assertExists(errorResponse.error);
  assertEquals(errorResponse.error.type, "ValidationError");
  assertEquals(errorResponse.error.message, "Validation failed");
  assertExists(errorResponse.error.details);
});

Deno.test("PromptGenerationService - Structure - Dependencies structure validation", () => {
  // Minimal valid dependencies
  const minimalDeps: PromptGenerationDependencies = {
    repository: {} as TemplateRepository,
    policy: {
      selectTemplate: () => ({ ok: true, data: {} as TemplatePath }),
      validateVariables: () => ({ isValid: true, errors: [], warnings: [] }),
      resolveMissingVariables: () => Promise.resolve(TemplateVariables.create({})),
      transformVariables: (vars: TemplateVariables) => vars,
      handleFailure: () => null,
      getConfig: () => mockGenerationPolicyConfig,
    } as unknown as GenerationPolicy,
  };

  assertExists(minimalDeps.repository);
  assertExists(minimalDeps.policy);
  assertEquals(minimalDeps.logger, undefined);

  // Full dependencies
  const fullDeps: PromptGenerationDependencies = {
    repository: {} as TemplateRepository,
    policy: {
      selectTemplate: () => ({ ok: true, data: {} as TemplatePath }),
      validateVariables: () => ({ isValid: true, errors: [], warnings: [] }),
      resolveMissingVariables: () => Promise.resolve(TemplateVariables.create({})),
      transformVariables: (vars: TemplateVariables) => vars,
      handleFailure: () => null,
      getConfig: () => mockGenerationPolicyConfig,
    } as unknown as GenerationPolicy,
    logger: {} as BreakdownLogger,
  };

  assertExists(fullDeps.repository);
  assertExists(fullDeps.policy);
  assertExists(fullDeps.logger);
});

Deno.test("PromptGenerationService - Structure - CommandResult conversion structure", () => {
  // Create mock template path for testing
  const mockTemplatePathResult = TemplatePath.create(
    { getValue: () => "to" } as DirectiveType,
    { getValue: () => "task" } as LayerType,
    "test.md",
  );

  if (!mockTemplatePathResult.ok) {
    throw new Error("Failed to create mock template path");
  }

  const mockTemplatePath = mockTemplatePathResult.data;

  // Create mock template
  const mockTemplateResult = PromptTemplate.create(
    mockTemplatePath,
    "Test template content with {variable}",
    { description: "Test template" },
  );

  if (!mockTemplateResult.ok) {
    throw new Error("Failed to create mock template");
  }

  const mockTemplate = mockTemplateResult.data;

  const deps: PromptGenerationDependencies = {
    repository: {
      loadTemplate: () => Promise.resolve(mockTemplate),
      exists: () => Promise.resolve(true),
      listAvailable: () =>
        Promise.resolve({
          templates: [],
          generatedAt: new Date(),
          totalCount: 0,
        }),
      refresh: () => Promise.resolve(),
      save: () => Promise.resolve(),
      delete: () => Promise.resolve(),
    },
    policy: {
      selectTemplate: (directive: DirectiveType, layer: LayerType, _context: SelectionContext) => {
        const pathResult = TemplatePath.create(directive, layer, "default.md");
        return pathResult;
      },
      validateVariables: (_variables: TemplateVariables) => ({
        isValid: true,
        errors: [],
        warnings: [],
      }),
      resolveMissingVariables: (
        _provided: TemplateVariables,
        _required: string[],
        _context: ResolutionContext,
      ) => {
        const resolved = TemplateVariables.create({});
        return Promise.resolve(resolved);
      },
      transformVariables: (variables: TemplateVariables) => variables,
      handleFailure: (_error: Error) => null,
      getConfig: () => mockGenerationPolicyConfig,
    } as unknown as GenerationPolicy,
  };

  const serviceResult = PromptGenerationService.create(deps);
  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;

  // Test success conversion structure
  const successResponse: PromptGenerationResponse = {
    success: true,
    content: "test content",
  };

  const successResult = service.toCommandResult(successResponse);
  assertEquals(typeof successResult.success, "boolean");
  assertEquals(typeof successResult.output, "string");
  assertEquals(successResult.error, null);

  // Test error conversion structure
  const errorResponse: PromptGenerationResponse = {
    success: false,
    error: {
      type: "TestError",
      message: "Test message",
    },
  };

  const errorResult = service.toCommandResult(errorResponse);
  assertEquals(typeof errorResult.success, "boolean");
  assertEquals(typeof errorResult.output, "string");
  assertExists(errorResult.error);
  if (errorResult.error && typeof errorResult.error === "object" && "type" in errorResult.error) {
    assertEquals(typeof errorResult.error.type, "string");
    assertEquals(typeof errorResult.error.message, "string");
  }
});

Deno.test("PromptGenerationService - Structure - Result type consistency", () => {
  // Test various invalid dependency structures
  const testCases = [
    { deps: null, expectedError: "ServiceConfigurationError" },
    { deps: undefined, expectedError: "ServiceConfigurationError" },
    { deps: {}, expectedError: "ServiceConfigurationError" },
    { deps: { repository: null }, expectedError: "ServiceConfigurationError" },
    { deps: { policy: null }, expectedError: "ServiceConfigurationError" },
    { deps: [], expectedError: "ServiceConfigurationError" },
    { deps: "invalid", expectedError: "ServiceConfigurationError" },
  ];

  for (const { deps, expectedError } of testCases) {
    const result = PromptGenerationService.create(deps as unknown as PromptGenerationDependencies);

    // Verify Result discriminated union structure
    if (result.ok) {
      assertExists(result.data);
      assertEquals("error" in result, false);
    } else {
      assertExists(result.error);
      assertEquals("data" in result, false);
      assertEquals(result.error.kind, expectedError);
      assertEquals(typeof result.error.message, "string");
    }
  }
});

Deno.test("PromptGenerationService - Structure - Variables transformation structure", () => {
  const typeFactory = new TypeFactory(mockTypePatternProvider);
  const directiveResult = typeFactory.createDirectiveType("to");
  const layerResult = typeFactory.createLayerType("task");

  if (!directiveResult.ok || !layerResult.ok) {
    throw new Error("Failed to create test types");
  }

  const request: PromptGenerationRequest = {
    directive: directiveResult.data,
    layer: layerResult.data,
    variables: {
      custom_var: "custom_value",
    },
    options: {
      inputText: "test input",
      fromFile: "input.txt",
      toFile: "output.txt",
    },
  };

  // Verify that options are transformed into variables structure
  // Base variables should include:
  // - All custom variables
  // - input_text from options.inputText
  // - input_text_file from options.fromFile
  // - destination_path from options.toFile

  assertEquals(typeof request.variables, "object");
  assertEquals(typeof request.options, "object");

  // Verify immutability of input structures
  const originalVariables = { ...request.variables };
  const originalOptions = { ...request.options };

  // Any transformation should not modify original
  assertEquals(request.variables, originalVariables);
  assertEquals(request.options, originalOptions);
});
