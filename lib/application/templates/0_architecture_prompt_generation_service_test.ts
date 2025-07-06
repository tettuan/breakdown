/**
 * @fileoverview Architecture tests for PromptGenerationService
 * 
 * Tests focused on:
 * - Domain boundaries adherence
 * - Dependency injection patterns
 * - Service initialization via Smart Constructor
 * - Interface contracts enforcement
 * 
 * @module application/templates/0_architecture_prompt_generation_service_test
 */

import { assertEquals } from "@std/assert";
import { 
  PromptGenerationService,
  type PromptGenerationDependencies 
} from "./prompt_generation_service.ts";
import type { TemplateRepository, TemplateManifest } from "../../domain/templates/template_repository.ts";
import { GenerationPolicy } from "../../domain/templates/generation_policy.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Test fixtures
const createMockRepository = (): TemplateRepository => ({
  loadTemplate: () => Promise.resolve({} as any),
  exists: () => Promise.resolve(true),
  listAvailable: () => Promise.resolve({
    templates: [],
    generatedAt: new Date(),
    totalCount: 0,
  } as TemplateManifest),
  save: () => Promise.resolve(),
  delete: () => Promise.resolve(),
  refresh: () => Promise.resolve(),
});

const createMockPolicy = (): GenerationPolicy => {
  const config = {
    requiredVariables: [],
    optionalVariables: [],
    variableValidation: {},
    maxRetries: 3,
    timeoutMs: 30000,
    fallbackStrategies: [],
  };
  
  const selectionStrategy = {
    selectTemplate: () => ({} as any),
  };
  
  return GenerationPolicy.create(config, [], selectionStrategy);
};

Deno.test("PromptGenerationService - Architecture - Smart Constructor pattern enforcement", () => {
  const deps: PromptGenerationDependencies = {
    repository: createMockRepository(),
    policy: createMockPolicy(),
  };

  const result = PromptGenerationService.create(deps);
  
  // Verify Result type usage (Totality principle)
  assertEquals(result.ok, true);
  if (result.ok) {
    // Verify service instance created successfully
    assertEquals(typeof result.data, "object");
    assertEquals(result.data !== null, true);
  }
});

Deno.test("PromptGenerationService - Architecture - Dependency injection validation", () => {
  // Test null dependencies
  const nullResult = PromptGenerationService.create(null as any);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "ServiceConfigurationError");
  }

  // Test missing repository
  const noRepoResult = PromptGenerationService.create({
    policy: createMockPolicy(),
  } as any);
  assertEquals(noRepoResult.ok, false);
  if (!noRepoResult.ok) {
    assertEquals(noRepoResult.error.kind, "ServiceConfigurationError");
    assertEquals(noRepoResult.error.message.includes("Template repository is required"), true);
  }

  // Test missing policy
  const noPolicyResult = PromptGenerationService.create({
    repository: createMockRepository(),
  } as any);
  assertEquals(noPolicyResult.ok, false);
  if (!noPolicyResult.ok) {
    assertEquals(noPolicyResult.error.kind, "ServiceConfigurationError");
    assertEquals(noPolicyResult.error.message.includes("Generation policy is required"), true);
  }
});

Deno.test("PromptGenerationService - Architecture - Optional logger injection", () => {
  const logger = new BreakdownLogger("test");
  const deps: PromptGenerationDependencies = {
    repository: createMockRepository(),
    policy: createMockPolicy(),
    logger,
  };

  const result = PromptGenerationService.create(deps);
  assertEquals(result.ok, true);
});

Deno.test("PromptGenerationService - Architecture - Interface segregation", () => {
  const deps: PromptGenerationDependencies = {
    repository: createMockRepository(),
    policy: createMockPolicy(),
  };

  const result = PromptGenerationService.create(deps);
  if (result.ok) {
    const service = result.data;
    
    // Verify public interface
    assertEquals(typeof service.generatePrompt, "function");
    assertEquals(typeof service.validateTemplate, "function");
    assertEquals(typeof service.listAvailableTemplates, "function");
    assertEquals(typeof service.refreshTemplates, "function");
    assertEquals(typeof service.toCommandResult, "function");
    
    // Verify that attempting to access private members through the type system
    // would result in TypeScript errors (runtime access is still possible in JS)
    // This test verifies the architectural intent rather than runtime behavior
    
    // These would cause TypeScript errors if uncommented:
    // service.deps
    // service.logger
    // service.aggregates
    
    // Instead, verify that the service instance is properly encapsulated
    assertEquals(typeof service, "object");
    assertEquals(service !== null, true);
  }
});

Deno.test("PromptGenerationService - Architecture - Domain boundary respect", () => {
  const deps: PromptGenerationDependencies = {
    repository: createMockRepository(),
    policy: createMockPolicy(),
  };

  const result = PromptGenerationService.create(deps);
  assertEquals(result.ok, true);
  
  // Service should not expose domain internals
  if (result.ok) {
    const service = result.data;
    
    // Verify internal domain methods are not part of the public API
    // These methods should only be accessible internally
    
    // These would cause TypeScript errors if uncommented:
    // service.selectTemplate
    // service.prepareVariables
    // service.getOrCreateAggregate
    // service.handleGenerationResult
    
    // Verify the service follows domain boundary principles
    assertEquals(typeof service.generatePrompt, "function");
    assertEquals(typeof service.validateTemplate, "function");
  }
});

Deno.test("PromptGenerationService - Architecture - No exception throwing in create", () => {
  // Various invalid inputs should return Result.error, not throw
  const testCases = [
    undefined,
    null,
    {},
    { repository: null },
    { policy: null },
    [],
    "invalid",
    123,
  ];

  for (const testCase of testCases) {
    const result = PromptGenerationService.create(testCase as any);
    assertEquals(result.ok, false);
    // Should not throw any exceptions
  }
});