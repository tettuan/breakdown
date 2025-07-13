/**
 * @fileoverview Behavior tests for PromptGenerationService
 *
 * Tests focused on:
 * - Normal operation flows
 * - Error handling behaviors
 * - State transitions
 * - Business logic validation
 *
 * @module application/templates/1_behavior_prompt_generation_service_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  type PromptGenerationDependencies,
  type PromptGenerationRequest,
  type PromptGenerationResponse,
  PromptGenerationService,
} from "./prompt_generation_service.ts";
import type {
  TemplateManifest,
  TemplateRepository,
} from "../../domain/templates/template_repository.ts";
import {
  GenerationPolicy,
  type SelectionContext,
  type ValidationResult,
} from "../../domain/templates/generation_policy.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import {
  PromptTemplate,
  TemplatePath,
} from "../../domain/templates/prompt_generation_aggregate.ts";

// Enhanced mock implementations
class MockTemplateRepository implements TemplateRepository {
  private templates = new Map<string, PromptTemplate>();

  loadTemplate(path: TemplatePath): Promise<PromptTemplate> {
    const pathStr = path.getPath();
    const template = this.templates.get(pathStr);
    if (!template) {
      throw new Error(`Template not found: ${pathStr}`);
    }
    return Promise.resolve(template);
  }

  exists(path: TemplatePath): Promise<boolean> {
    return Promise.resolve(this.templates.has(path.getPath()));
  }

  listAvailable(): Promise<TemplateManifest> {
    return Promise.resolve({
      templates: Array.from(this.templates.keys()).map((path) => ({
        path,
        directive: path.split("-")[0],
        layer: path.split("-")[1]?.replace(".md", "") || "",
        filename: path,
      })),
      generatedAt: new Date(),
      totalCount: this.templates.size,
    });
  }

  save(): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }

  delete(): Promise<void> {
    // Mock implementation
    return Promise.resolve();
  }

  refresh(): Promise<void> {
    // Simulate refresh
    return Promise.resolve();
  }

  setTemplate(path: string, template: PromptTemplate): void {
    this.templates.set(path, template);
  }
}

const createMockPolicy = (options?: {
  validateVariablesResult?: ValidationResult;
}): GenerationPolicy => {
  const config = {
    requiredVariables: [],
    optionalVariables: [],
    variableValidation: {},
    maxRetries: 3,
    timeoutMs: 30000,
    fallbackStrategies: [],
  };

  const selectionStrategy = {
    selectTemplate: (directive: DirectiveType, layer: LayerType, _context?: SelectionContext) => {
      const filename = `${directive.value}-${layer.value}.md`;
      return TemplatePath.create(directive, layer, filename);
    },
  };

  const policyResult = GenerationPolicy.create(config, [], selectionStrategy);
  if (!policyResult.ok) {
    throw new Error(`Failed to create mock policy: ${policyResult.error.message}`);
  }

  const policy = policyResult.data;

  // Override methods if needed for testing
  if (options?.validateVariablesResult) {
    (policy as unknown as { validateVariables: () => ValidationResult }).validateVariables = () =>
      options.validateVariablesResult!;
  }

  return policy;
};

// Test helpers
const createTestDependencies = (): PromptGenerationDependencies & {
  repository: MockTemplateRepository;
} => {
  return {
    repository: new MockTemplateRepository(),
    policy: createMockPolicy(),
  };
};

const createTestRequest = (): PromptGenerationRequest => {
  // Create DirectiveType with string value
  const directiveCreateResult = DirectiveType.create("to");
  if (!directiveCreateResult.ok) {
    throw new Error(`Failed to create DirectiveType: ${directiveCreateResult.error.message}`);
  }
  const directive = directiveCreateResult.data;

  // Create LayerType with string value
  const layerTypeResult = LayerType.create("task");
  if (!layerTypeResult.ok) {
    throw new Error(`Failed to create LayerType: ${layerTypeResult.error.message}`);
  }
  const layer = layerTypeResult.data;

  return {
    directive,
    layer,
    variables: {
      project_name: "test-project",
      user_name: "test-user",
    },
    options: {
      inputText: "Test input",
    },
  };
};

Deno.test("PromptGenerationService - Behavior - Successful prompt generation", async () => {
  const deps = createTestDependencies();
  const serviceResult = PromptGenerationService.create(deps);

  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;

  // Setup mock template
  const mockContent = {
    getContent: () => "Hello {{project_name}} by {{user_name}}",
    getRequiredVariables: () => ["project_name", "user_name"],
  };
  const mockTemplate = {
    getId: () => "test-template",
    getContent: () => mockContent,
    getPath: () => ({
      getPath: () => "to/task/to-task.md",
      getDirective: () => ({ getValue: () => "to" }),
      getLayer: () => ({ getValue: () => "task" }),
      getFilename: () => "to-task.md",
    }),
    getMetadata: () => ({
      version: "1.0.0",
      description: "Test template",
      author: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    generate: (variables: Record<string, unknown>) => ({
      ok: true,
      data: {
        getContent: () => "Generated content",
        getTemplate: () => mockTemplate,
        getAppliedVariables: () => variables,
        getGeneratedAt: () => new Date(),
      },
    }),
  } as unknown as PromptTemplate;

  // Template path should match the TemplatePath.create format: directive/layer/filename
  deps.repository.setTemplate("to/task/to-task.md", mockTemplate);

  const request = createTestRequest();
  const response = await service.generatePrompt(request);

  assertEquals(response.success, true);
  assertExists(response.content);
  assertEquals(response.templatePath, "to/task/to-task.md");
  assertExists(response.appliedVariables);
});

Deno.test("PromptGenerationService - Behavior - Template not found error", async () => {
  const deps = createTestDependencies();
  const serviceResult = PromptGenerationService.create(deps);

  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;
  const request = createTestRequest();

  // No template set, so it should fail
  const response = await service.generatePrompt(request);

  assertEquals(response.success, false);
  assertExists(response.error);
  assertEquals(response.error.message.includes("Template not found"), true);
});

Deno.test("PromptGenerationService - Behavior - Template validation", async () => {
  const deps = createTestDependencies();
  const serviceResult = PromptGenerationService.create(deps);

  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;

  const directiveCreateResult = DirectiveType.create("to");
  if (!directiveCreateResult.ok) {
    throw new Error(`Failed to create DirectiveType: ${directiveCreateResult.error.message}`);
  }
  const directive = directiveCreateResult.data;
  const layerCreateResult = LayerType.create("task");
  if (!layerCreateResult.ok) {
    throw new Error(`Failed to create LayerType: ${layerCreateResult.error.message}`);
  }
  const layer = layerCreateResult.data;

  // Template doesn't exist
  const validation1 = await service.validateTemplate(
    directive,
    layer,
  );

  assertEquals(validation1.valid, false);
  assertExists(validation1.errors);
  assertEquals(validation1.errors.length > 0, true);

  // Add template
  const mockTemplate = {
    getId: () => "test-template",
    getContent: () => ({ getRequiredVariables: () => [] }),
    getPath: () => ({
      getPath: () => "to/task/to-task.md",
      getDirective: () => ({ getValue: () => "to" }),
      getLayer: () => ({ getValue: () => "task" }),
      getFilename: () => "to-task.md",
    }),
    getMetadata: () => ({
      version: "1.0.0",
      description: "Test template",
      author: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    generate: (variables: Record<string, unknown>) => ({
      ok: true,
      data: {
        getContent: () => "Generated content",
        getTemplate: () => mockTemplate,
        getAppliedVariables: () => variables,
        getGeneratedAt: () => new Date(),
      },
    }),
  } as unknown as PromptTemplate;
  // Template path should match the TemplatePath.create format: directive/layer/filename
  deps.repository.setTemplate("to/task/to-task.md", mockTemplate);

  // Template exists
  const validation2 = await service.validateTemplate(
    directive,
    layer,
  );

  assertEquals(validation2.valid, true);
  assertEquals(validation2.errors, undefined);
});

Deno.test("PromptGenerationService - Behavior - List available templates", async () => {
  const deps = createTestDependencies();
  const serviceResult = PromptGenerationService.create(deps);

  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;

  // Initially empty
  const list1 = await service.listAvailableTemplates();
  assertEquals(list1.totalCount, 0);
  assertEquals(list1.templates.length, 0);

  // Add some templates
  deps.repository.setTemplate("template1.md", {} as PromptTemplate);
  deps.repository.setTemplate("template2.md", {} as PromptTemplate);

  const list2 = await service.listAvailableTemplates();
  assertEquals(list2.totalCount, 2);
  assertEquals(list2.templates.length, 2);
  const paths = list2.templates.map((t) => t.path);
  assertEquals(paths.includes("template1.md"), true);
  assertEquals(paths.includes("template2.md"), true);
});

Deno.test("PromptGenerationService - Behavior - CommandResult conversion", () => {
  const deps = createTestDependencies();
  const serviceResult = PromptGenerationService.create(deps);

  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;

  // Success response
  const successResponse: PromptGenerationResponse = {
    success: true,
    content: "Generated content",
    templatePath: "test.md",
  };

  const successResult = service.toCommandResult(successResponse);
  assertEquals(successResult.success, true);
  assertEquals(successResult.output, "Generated content");
  assertEquals(successResult.error, null);

  // Error response
  const errorResponse: PromptGenerationResponse = {
    success: false,
    error: {
      kind: "TestError",
      type: "TestError", // Legacy support
      message: "Test error message",
    },
  };

  const errorResult = service.toCommandResult(errorResponse);
  assertEquals(errorResult.success, false);
  assertEquals(errorResult.output, "");
  // Type-safe access to error properties based on CommandResult type
  if (errorResult.error && typeof errorResult.error === "object" && "type" in errorResult.error) {
    // CommandResult.error has structure: { kind?: string; type: string; message: string; }
    assertEquals(errorResult.error.type, "TestError");
    assertEquals(errorResult.error.message, "Test error message");

    // Optional kind property check
    if ("kind" in errorResult.error && errorResult.error.kind) {
      assertEquals(errorResult.error.kind, "TestError");
    }
  } else {
    throw new Error("Expected error object with type and message properties");
  }
});

Deno.test("PromptGenerationService - Behavior - Refresh templates clears aggregate cache", async () => {
  const deps = createTestDependencies();
  const serviceResult = PromptGenerationService.create(deps);

  if (!serviceResult.ok) {
    throw new Error("Service creation failed");
  }

  const service = serviceResult.data;

  // Setup and generate once to populate cache
  const mockTemplate = {
    getId: () => "test-template",
    getContent: () => ({
      getContent: () => "Test content",
      getRequiredVariables: () => [],
    }),
    getPath: () => ({
      getPath: () => "to/task/to-task.md",
      getDirective: () => ({ getValue: () => "to" }),
      getLayer: () => ({ getValue: () => "task" }),
      getFilename: () => "to-task.md",
    }),
    getMetadata: () => ({
      version: "1.0.0",
      description: "Test template",
      author: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    generate: (variables: Record<string, unknown>) => ({
      ok: true,
      data: {
        getContent: () => "Generated content",
        getTemplate: () => mockTemplate,
        getAppliedVariables: () => variables,
        getGeneratedAt: () => new Date(),
      },
    }),
  } as unknown as PromptTemplate;
  // Template path should match the TemplatePath.create format: directive/layer/filename
  deps.repository.setTemplate("to/task/to-task.md", mockTemplate);

  const request = createTestRequest();
  await service.generatePrompt(request);

  // Refresh should clear the aggregate cache
  await service.refreshTemplates();

  // Should still work after refresh
  const response = await service.generatePrompt(request);
  assertEquals(response.success, true);
});
