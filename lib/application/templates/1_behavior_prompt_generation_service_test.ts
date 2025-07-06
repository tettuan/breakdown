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
  PromptGenerationService,
  type PromptGenerationDependencies,
  type PromptGenerationRequest,
  type PromptGenerationResponse
} from "./prompt_generation_service.ts";
import type { TemplateRepository, TemplateManifest } from "../../domain/templates/template_repository.ts";
import { GenerationPolicy, type ValidationResult } from "../../domain/templates/generation_policy.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import { PromptTemplate, TemplatePath, TemplateVariables } from "../../domain/templates/prompt_generation_aggregate.ts";

// Enhanced mock implementations
class MockTemplateRepository implements TemplateRepository {
  private templates = new Map<string, PromptTemplate>();
  
  async loadTemplate(path: TemplatePath): Promise<PromptTemplate> {
    const pathStr = path.getPath();
    const template = this.templates.get(pathStr);
    if (!template) {
      throw new Error(`Template not found: ${pathStr}`);
    }
    return template;
  }
  
  async exists(path: TemplatePath): Promise<boolean> {
    return this.templates.has(path.getPath());
  }
  
  async listAvailable(): Promise<TemplateManifest> {
    return {
      templates: Array.from(this.templates.keys()).map(path => ({
        path,
        directive: path.split('-')[0],
        layer: path.split('-')[1]?.replace('.md', '') || '',
        filename: path,
      })),
      generatedAt: new Date(),
      totalCount: this.templates.size,
    };
  }
  
  async save(): Promise<void> {
    // Mock implementation
  }
  
  async delete(): Promise<void> {
    // Mock implementation
  }
  
  async refresh(): Promise<void> {
    // Simulate refresh
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
    selectTemplate: (directive: DirectiveType, layer: LayerType) => {
      const filename = `${directive.getValue()}-${layer.getValue()}.md`;
      return TemplatePath.create(directive, layer, filename);
    },
  };
  
  const policy = GenerationPolicy.create(config, [], selectionStrategy);
  
  // Override methods if needed for testing
  if (options?.validateVariablesResult) {
    (policy as any).validateVariables = () => options.validateVariablesResult;
  }
  
  return policy;
};

// Test helpers
const createTestDependencies = (): PromptGenerationDependencies & { repository: MockTemplateRepository } => {
  return {
    repository: new MockTemplateRepository(),
    policy: createMockPolicy(),
  };
};

const createTestRequest = (): PromptGenerationRequest => {
  // Create valid TwoParams_Result for DirectiveType
  const directiveResult = {
    type: "two" as const,
    demonstrativeType: "to",
    layerType: "task",
    params: ["test1", "test2"],
    options: {},
  };
  
  const directive = DirectiveType.create(directiveResult);
  
  // Create valid TwoParams_Result for LayerType  
  const layerResult = {
    type: "two" as const,
    demonstrativeType: "to",
    layerType: "task",
    params: ["test1", "test2"],
    options: {},
  };
  
  const layer = LayerType.create(layerResult);
  
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
    generate: (variables: any) => ({
      getContent: () => "Generated content",
      getTemplate: () => mockTemplate,
      getAppliedVariables: () => variables,
      getGeneratedAt: () => new Date(),
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
  const result = {
    type: "two" as const,
    demonstrativeType: "to",
    layerType: "task",
    params: ["test1", "test2"],
    options: {},
  };
  
  const directive = DirectiveType.create(result);
  const layer = LayerType.create(result);
  
  // Template doesn't exist
  const validation1 = await service.validateTemplate(
    directive,
    layer
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
    generate: (variables: any) => ({
      getContent: () => "Generated content",
      getTemplate: () => mockTemplate,
      getAppliedVariables: () => variables,
      getGeneratedAt: () => new Date(),
    }),
  } as any;
  // Template path should match the TemplatePath.create format: directive/layer/filename
  deps.repository.setTemplate("to/task/to-task.md", mockTemplate);
  
  // Template exists
  const validation2 = await service.validateTemplate(
    directive,
    layer
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
  deps.repository.setTemplate("template1.md", {} as any);
  deps.repository.setTemplate("template2.md", {} as any);
  
  const list2 = await service.listAvailableTemplates();
  assertEquals(list2.totalCount, 2);
  assertEquals(list2.templates.length, 2);
  const paths = list2.templates.map(t => t.path);
  assertEquals(paths.includes("template1.md"), true);
  assertEquals(paths.includes("template2.md"), true);
});

Deno.test("PromptGenerationService - Behavior - CommandResult conversion", async () => {
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
    generate: (variables: any) => ({
      getContent: () => "Generated content",
      getTemplate: () => mockTemplate,
      getAppliedVariables: () => variables,
      getGeneratedAt: () => new Date(),
    }),
  } as any;
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