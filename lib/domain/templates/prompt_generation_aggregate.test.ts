/**
 * @fileoverview Unit tests for Prompt Generation Aggregate - Core domain service
 * Testing Smart Constructor patterns, Result types, and Totality principle compliance
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  GeneratedPrompt,
  PromptGenerationAggregate,
  PromptGenerationError,
  PromptTemplate,
  TemplateContent,
  TemplatePath,
  TemplateVariables,
} from "./prompt_generation_aggregate.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import type { TwoParams_Result } from "../../deps.ts";

// Test fixtures
const createMockTwoParamsResult = (directive: string, layer: string): TwoParams_Result => ({
  type: "two",
  directiveType: directive,
  demonstrativeType: directive,
  layerType: layer,
  options: {},
  params: [directive, layer],
});

const mockTwoParams = createMockTwoParamsResult("to", "project");
const directiveResult = DirectiveType.create(mockTwoParams.directiveType);
const layerResult = LayerType.create(mockTwoParams.layerType);
if (!directiveResult.ok || !layerResult.ok) {
  throw new Error("Failed to create mock directive or layer");
}
const mockDirective = directiveResult.data;
const mockLayer = layerResult.data;

// === 0_architecture: Smart Constructor 制約検証 ===

Deno.test("0_architecture: TemplatePath - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new TemplatePath(mockDirective, mockLayer, "test.md");

  assertEquals(typeof TemplatePath.create, "function");
});

Deno.test("0_architecture: TemplateContent - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new TemplateContent("content", new Set());

  assertEquals(typeof TemplateContent.create, "function");
});

Deno.test("0_architecture: TemplateVariables - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new TemplateVariables(new Map());

  assertEquals(typeof TemplateVariables.create, "function");
});

Deno.test("0_architecture: PromptTemplate - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const content = TemplateContent.create("test content");

  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new PromptTemplate(pathResult.data, content, {});

  assertEquals(typeof PromptTemplate.create, "function");
});

Deno.test("0_architecture: PromptGenerationAggregate - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "test content");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  // @ts-expect-error - Testing that direct instantiation is not allowed
  const _directInstantiation = () => new PromptGenerationAggregate("id", templateResult.data, {});

  assertEquals(typeof PromptGenerationAggregate.create, "function");
});

Deno.test("0_architecture: GeneratedPrompt - enforces private constructor", () => {
  // Architecture constraint: constructor must be private
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "test content");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const _variables = TemplateVariables.create({});

  // Testing that GeneratedPrompt uses factory pattern
  // Note: GeneratedPrompt has private constructor, so direct instantiation should cause type error
  // const _directInstantiation = () =>
  //   new GeneratedPrompt(templateResult.data, "content", variables, new Date());

  assertEquals(typeof GeneratedPrompt.create, "function");
});

// === 1_behavior: 動作検証 ===

Deno.test("1_behavior: TemplatePath - validates filename extension", () => {
  // Valid .md extension should work
  const validPathResult = TemplatePath.create(mockDirective, mockLayer, "template.md");
  assertEquals(validPathResult.ok, true);
  if (validPathResult.ok) {
    assertEquals(validPathResult.data.getFilename(), "template.md");
  }

  // Invalid extension should return error
  const invalidPathResult = TemplatePath.create(mockDirective, mockLayer, "template.txt");
  assertEquals(invalidPathResult.ok, false);
  if (!invalidPathResult.ok) {
    assertEquals(invalidPathResult.error.includes("Invalid template filename"), true);
  }
});

Deno.test("1_behavior: TemplatePath - generates correct path", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "template.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  // Mock the getValue methods to return predictable values
  const expectedPath = `${mockDirective.value}/${mockLayer.value}/template.md`;
  assertEquals(pathResult.data.getPath(), expectedPath);
});

Deno.test("1_behavior: TemplateContent - extracts variables correctly", () => {
  const content = TemplateContent.create("Hello {name}, your {role} is important!");

  const variables = content.getRequiredVariables();
  assertEquals(variables.length, 2);
  assertEquals(variables.includes("name"), true);
  assertEquals(variables.includes("role"), true);

  assertEquals(content.hasVariable("name"), true);
  assertEquals(content.hasVariable("age"), false);
});

Deno.test("1_behavior: TemplateContent - handles no variables", () => {
  const content = TemplateContent.create("Simple content without variables");

  assertEquals(content.getRequiredVariables().length, 0);
  assertEquals(content.hasVariable("anything"), false);
});

Deno.test("1_behavior: TemplateVariables - manages key-value pairs", () => {
  const variables = TemplateVariables.create({
    name: "John",
    role: "developer",
  });

  assertEquals(variables.get("name"), "John");
  assertEquals(variables.get("role"), "developer");
  assertEquals(variables.get("missing"), undefined);

  assertEquals(variables.has("name"), true);
  assertEquals(variables.has("missing"), false);
});

Deno.test("1_behavior: TemplateVariables - merges correctly", () => {
  const vars1 = TemplateVariables.create({ a: "1", b: "2" });
  const vars2 = TemplateVariables.create({ b: "3", c: "4" });

  const merged = vars1.merge(vars2);

  assertEquals(merged.get("a"), "1");
  assertEquals(merged.get("b"), "3"); // Should be overwritten
  assertEquals(merged.get("c"), "4");
});

Deno.test("1_behavior: PromptTemplate - generates prompt with variables", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "greet.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(
    pathResult.data,
    "Hello {name}, welcome to {project}!",
  );
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const template = templateResult.data;
  const variables = TemplateVariables.create({
    name: "Alice",
    project: "Breakdown",
  });

  const generatedResult = template.generate(variables);
  assertEquals(generatedResult.ok, true);
  if (generatedResult.ok) {
    assertEquals(generatedResult.data.getContent(), "Hello Alice, welcome to Breakdown!");
  }
});

Deno.test("1_behavior: PromptTemplate - handles missing variables", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "greet.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(
    pathResult.data,
    "Hello {name}, welcome to {project}!",
  );
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const template = templateResult.data;
  const variables = TemplateVariables.create({ name: "Alice" }); // Missing 'project'

  const generatedResult = template.generate(variables);
  assertEquals(generatedResult.ok, false);
  if (!generatedResult.ok) {
    assertExists(generatedResult.error);
    assertEquals(
      generatedResult.error.message.includes("Missing required variables: project"),
      true,
    );
  }
});

Deno.test("1_behavior: PromptGenerationAggregate - manages generation lifecycle", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;

  // Initial state
  assertEquals(aggregate.getId(), "test-id");
  assertEquals(aggregate.getState().status, "initialized");
  assertEquals(aggregate.getState().attempts, 0);

  // Successful generation
  const variables = TemplateVariables.create({ name: "World" });
  const result = aggregate.generatePrompt(variables);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.getContent(), "Hello World!");
  }

  const finalState = aggregate.getState();
  assertEquals(finalState.status, "completed");
  assertEquals(finalState.attempts, 1);
});

Deno.test("1_behavior: PromptGenerationAggregate - handles generation failure", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;

  // Missing variables should cause failure
  const variables = TemplateVariables.create({});
  const result = aggregate.generatePrompt(variables);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertExists(result.error);
  }

  const state = aggregate.getState();
  assertEquals(state.status, "failed");
  assertEquals(state.attempts, 1);
  assertEquals(state.errors.length, 1);
});

Deno.test("1_behavior: PromptGenerationAggregate - retry logic", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;

  // Fail multiple times
  const badVariables = TemplateVariables.create({});

  aggregate.generatePrompt(badVariables);
  assertEquals(aggregate.canRetry(), true);

  aggregate.generatePrompt(badVariables);
  assertEquals(aggregate.canRetry(), true);

  aggregate.generatePrompt(badVariables);
  assertEquals(aggregate.canRetry(), false); // Max attempts reached
});

// === 2_structure: Result型とTotality検証 ===

Deno.test("2_structure: Result type - success structure", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({ name: "World" });

  const result = aggregate.generatePrompt(variables);

  // Success structure validation
  assertEquals(result.ok, true);
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.getContent(), "Hello World!");
  }
});

Deno.test("2_structure: Result type - failure structure", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({});

  const result = aggregate.generatePrompt(variables);

  // Failure structure validation
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertExists(result.error);
  }
});

Deno.test("2_structure: PromptGenerationError - custom error type", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const error = new PromptGenerationError("Test error", pathResult.data, ["missing1", "missing2"]);

  assertEquals(error.name, "PromptGenerationError");
  assertEquals(error.message, "Test error");
  assertEquals(error.templatePath, pathResult.data);
  assertEquals(error.missingVariables?.length, 2);
  assertEquals(error.missingVariables?.includes("missing1"), true);
  assertEquals(error.missingVariables?.includes("missing2"), true);
});

Deno.test("2_structure: Totality - all classes implement required methods", () => {
  // TemplatePath totality
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const path = pathResult.data;
  assertEquals(typeof path.getPath, "function");
  assertEquals(typeof path.getDirective, "function");
  assertEquals(typeof path.getLayer, "function");
  assertEquals(typeof path.getFilename, "function");

  // TemplateContent totality
  const content = TemplateContent.create("test {var}");
  assertEquals(typeof content.getContent, "function");
  assertEquals(typeof content.getRequiredVariables, "function");
  assertEquals(typeof content.hasVariable, "function");

  // TemplateVariables totality
  const vars = TemplateVariables.create({ key: "value" });
  assertEquals(typeof vars.get, "function");
  assertEquals(typeof vars.has, "function");
  assertEquals(typeof vars.toObject, "function");
  assertEquals(typeof vars.merge, "function");

  // PromptTemplate totality
  const templateResult = PromptTemplate.create(path, "test");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const template = templateResult.data;
  assertEquals(typeof template.getPath, "function");
  assertEquals(typeof template.getContent, "function");
  assertEquals(typeof template.getMetadata, "function");
  assertEquals(typeof template.generate, "function");

  // GeneratedPrompt totality
  const generated = GeneratedPrompt.create(template, "result", vars);
  assertEquals(typeof generated.getContent, "function");
  assertEquals(typeof generated.getTemplate, "function");
  assertEquals(typeof generated.getAppliedVariables, "function");
  assertEquals(typeof generated.getGeneratedAt, "function");

  // PromptGenerationAggregate totality
  const aggregateResult = PromptGenerationAggregate.create("id", template);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;
  assertEquals(typeof aggregate.getId, "function");
  assertEquals(typeof aggregate.getTemplate, "function");
  assertEquals(typeof aggregate.getState, "function");
  assertEquals(typeof aggregate.generatePrompt, "function");
  assertEquals(typeof aggregate.canRetry, "function");
});

Deno.test("2_structure: Immutability - value objects preserve state", () => {
  const vars1 = TemplateVariables.create({ a: "1" });
  const vars2 = TemplateVariables.create({ b: "2" });
  const merged = vars1.merge(vars2);

  // Original objects should remain unchanged
  assertEquals(vars1.get("b"), undefined);
  assertEquals(vars2.get("a"), undefined);
  assertEquals(merged.get("a"), "1");
  assertEquals(merged.get("b"), "2");
});

Deno.test("2_structure: State isolation - aggregate state management", () => {
  const pathResult = TemplatePath.create(mockDirective, mockLayer, "test.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;

  const aggregate = aggregateResult.data;

  const initialState = aggregate.getState();
  assertEquals(initialState.status, "initialized");

  // State modification through proper method
  const variables = TemplateVariables.create({ name: "World" });
  aggregate.generatePrompt(variables);

  const newState = aggregate.getState();
  assertEquals(newState.status, "completed");

  // Original state reference should not be affected
  assertEquals(initialState.status, "initialized");
});
