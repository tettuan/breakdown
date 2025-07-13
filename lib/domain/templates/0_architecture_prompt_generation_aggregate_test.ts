/**
 * @fileoverview Tests for PromptGenerationAggregate - DDD Domain Model
 *
 * This test suite validates the Prompt Generation Aggregate following DDD principles:
 * - 0_architecture: Aggregate root pattern, domain model integrity
 * - 1_behavior: Core business logic and prompt generation
 * - 2_structure: Entity relationships and value object composition
 *
 * @module domain/templates/prompt_generation_aggregate_test
 */

import { assertEquals, assertInstanceOf, assertThrows as _assertThrows } from "@std/assert";
import {
  GeneratedPrompt as _GeneratedPrompt,
  PromptGenerationAggregate,
  PromptGenerationError,
  PromptTemplate,
  TemplateContent,
  TemplatePath,
  TemplateVariables,
} from "./prompt_generation_aggregate.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import { error as _error, isOk, ok as _ok, type Result as _Result } from "../../types/result.ts";
import type { TwoParams_Result } from "../../deps.ts";

// Helper functions for creating test instances
function createMockDirectiveType(value: string): DirectiveType {
  const mockResult: TwoParams_Result = {
    type: "two",
    directiveType: value,
    layerType: "project",
    demonstrativeType: value,
    options: {},
    params: [value, "project"],
  };
  return DirectiveType.create(mockResult);
}

function createMockLayerType(value: string): LayerType {
  const mockResult: TwoParams_Result = {
    type: "two",
    directiveType: "to",
    layerType: value,
    demonstrativeType: "to",
    options: {},
    params: ["to", value],
  };
  const layerResult = LayerType.create(mockResult);
  if (!layerResult.ok) {
    throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
  }
  return layerResult.data;
}

// =============================================================================
// 0_architecture Tests - Aggregate Root and DDD Principles
// =============================================================================

Deno.test("0_architecture - PromptGenerationAggregate follows Aggregate Root pattern", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "test.md");
  assertEquals(isOk(pathResult), true);
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(isOk(templateResult), true);
  if (!isOk(templateResult)) return;

  // Act
  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  assertEquals(isOk(aggregateResult), true);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;

  // Assert - Aggregate maintains identity and encapsulation
  assertEquals(aggregate.getId(), "test-id");
  assertEquals(aggregate.getTemplate(), templateResult.data);
  assertEquals(aggregate.getState().status, "initialized");
  assertEquals(aggregate.getState().attempts, 0);
  assertEquals(aggregate.getState().errors.length, 0);
});

Deno.test("0_architecture - PromptGenerationAggregate encapsulates state mutation", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "test.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({ name: "World" });

  // Act
  const result1 = aggregate.generatePrompt(variables);
  const state1 = aggregate.getState();
  const result2 = aggregate.generatePrompt(variables);
  const state2 = aggregate.getState();

  // Assert - State changes are controlled by aggregate
  assertEquals(isOk(result1), true);
  assertEquals(state1.attempts, 1);
  assertEquals(state1.status, "completed");
  assertEquals(isOk(result2), true);
  assertEquals(state2.attempts, 2);
  assertEquals(state2.status, "completed");
});

Deno.test("0_architecture - Domain invariants are maintained across operations", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "test.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const invalidVariables = TemplateVariables.create({ wrong: "value" });

  // Act
  const result = aggregate.generatePrompt(invalidVariables);
  const state = aggregate.getState();

  // Assert - Invariants preserved even on failure
  assertEquals(isOk(result), false);
  assertEquals(state.status, "failed");
  assertEquals(state.attempts, 1);
  assertEquals(state.errors.length, 1);
  assertInstanceOf(state.errors[0], PromptGenerationError);
});

Deno.test("0_architecture - Aggregate enforces retry policy", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "test.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("test-id", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const invalidVariables = TemplateVariables.create({ wrong: "value" });

  // Act & Assert - Retry policy enforced
  assertEquals(aggregate.canRetry(), false); // Initially false

  aggregate.generatePrompt(invalidVariables); // First failure
  assertEquals(aggregate.canRetry(), true);

  aggregate.generatePrompt(invalidVariables); // Second failure
  assertEquals(aggregate.canRetry(), true);

  aggregate.generatePrompt(invalidVariables); // Third failure
  assertEquals(aggregate.canRetry(), false); // No more retries
});

// =============================================================================
// 1_behavior Tests - Core Business Logic and Prompt Generation
// =============================================================================

Deno.test("1_behavior - Successful prompt generation with valid variables", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "greeting.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(
    pathResult.data,
    "Hello {name}, welcome to {project}!",
  );
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("greeting-001", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({
    name: "Alice",
    project: "Breakdown",
  });

  // Act
  const result = aggregate.generatePrompt(variables);

  // Assert
  assertEquals(isOk(result), true);
  if (isOk(result)) {
    assertEquals(result.data.getContent(), "Hello Alice, welcome to Breakdown!");
  }
  assertEquals(aggregate.getState().status, "completed");
});

Deno.test("1_behavior - Prompt generation fails with missing variables", () => {
  // Arrange
  const directive = createMockDirectiveType("summary");
  const layer = createMockLayerType("issue");
  const pathResult = TemplatePath.create(directive, layer, "summary.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Summarize {title} from {source}");
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("summary-001", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({ title: "Test Issue" }); // Missing 'source'

  // Act
  const result = aggregate.generatePrompt(variables);

  // Assert
  assertEquals(isOk(result), false);
  if (!isOk(result)) {
    assertInstanceOf(result.error, PromptGenerationError);
    assertEquals(result.error.message, "Missing required variables: source");
  }
  assertEquals(aggregate.getState().status, "failed");
});

Deno.test("1_behavior - Multiple variable substitution with complex template", () => {
  // Arrange
  const directive = createMockDirectiveType("defect");
  const layer = createMockLayerType("task");
  const pathResult = TemplatePath.create(directive, layer, "defect_analysis.md");
  if (!isOk(pathResult)) return;

  const complexTemplate = `
# Defect Analysis for {component}

## Issue Description
{description}

## Affected Areas
- Component: {component}
- Severity: {severity}
- Reporter: {reporter}

## Analysis
The issue in {component} affects {impact_area} with {severity} severity.
Contact {reporter} for more details.
`;
  const templateResult = PromptTemplate.create(pathResult.data, complexTemplate);
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("defect-001", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({
    component: "AuthService",
    description: "Login timeout after 30 seconds",
    severity: "HIGH",
    reporter: "john.doe@example.com",
    impact_area: "user authentication",
  });

  // Act
  const result = aggregate.generatePrompt(variables);

  // Assert
  assertEquals(isOk(result), true);
  if (isOk(result)) {
    const content = result.data.getContent();
    assertEquals(content.includes("AuthService"), true);
    assertEquals(content.includes("Login timeout after 30 seconds"), true);
    assertEquals(content.includes("HIGH"), true);
    assertEquals(content.includes("john.doe@example.com"), true);
    assertEquals(content.includes("user authentication"), true);
  }
});

Deno.test("1_behavior - Template variable extraction works correctly", () => {
  // Arrange
  const content = "Process {input} with {method} and output to {destination}";
  const templateContent = TemplateContent.create(content);

  // Act
  const variables = templateContent.getRequiredVariables();

  // Assert
  assertEquals(variables.sort(), ["destination", "input", "method"]);
  assertEquals(templateContent.hasVariable("input"), true);
  assertEquals(templateContent.hasVariable("nonexistent"), false);
});

Deno.test("1_behavior - Template variables can be merged and accessed", () => {
  // Arrange
  const base = TemplateVariables.create({ name: "Alice", type: "user" });
  const additional = TemplateVariables.create({ role: "admin", type: "manager" });

  // Act
  const merged = base.merge(additional);

  // Assert
  assertEquals(merged.get("name"), "Alice");
  assertEquals(merged.get("role"), "admin");
  assertEquals(merged.get("type"), "manager"); // Should be overridden
  assertEquals(merged.has("name"), true);
  assertEquals(merged.has("nonexistent"), false);
});

// =============================================================================
// 2_structure Tests - Entity Relationships and Value Object Composition
// =============================================================================

Deno.test("2_structure - TemplatePath value object enforces invariants", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");

  // Act & Assert - Valid filename
  const validPathResult = TemplatePath.create(directive, layer, "template.md");
  assertEquals(isOk(validPathResult), true);
  if (isOk(validPathResult)) {
    assertEquals(validPathResult.data.getFilename(), "template.md");
    assertEquals(validPathResult.data.getPath(), "to/project/template.md");
  }

  // Act & Assert - Invalid filename returns error
  const invalidPathResult = TemplatePath.create(directive, layer, "template.txt");
  assertEquals(isOk(invalidPathResult), false);
  if (!isOk(invalidPathResult)) {
    assertEquals(
      invalidPathResult.error,
      "Invalid template filename: template.txt. Must end with .md",
    );
  }
});

Deno.test("2_structure - TemplateContent extracts variables correctly", () => {
  // Arrange
  const content = `
# Template with {title}
Content includes {variable1} and {variable2}.
Same variable can appear multiple times: {variable1}.
  `;

  // Act
  const templateContent = TemplateContent.create(content);
  const variables = templateContent.getRequiredVariables();

  // Assert
  assertEquals(variables.sort(), ["title", "variable1", "variable2"]);
  assertEquals(templateContent.getContent(), content);
});

Deno.test("2_structure - PromptTemplate composition with metadata", () => {
  // Arrange
  const directive = createMockDirectiveType("summary");
  const layer = createMockLayerType("issue");
  const pathResult = TemplatePath.create(directive, layer, "issue_summary.md");
  if (!isOk(pathResult)) return;

  const content = "Summarize {issue_title} with priority {priority}";
  const metadata = {
    version: "2.1.0",
    description: "Issue summary template",
    author: "team@example.com",
  };

  // Act
  const templateResult = PromptTemplate.create(pathResult.data, content, metadata);

  // Assert
  assertEquals(isOk(templateResult), true);
  if (isOk(templateResult)) {
    const template = templateResult.data;
    assertEquals(template.getPath(), pathResult.data);
    assertEquals(template.getContent().getContent(), content);
    const templateMetadata = template.getMetadata();
    assertEquals(templateMetadata.version, "2.1.0");
    assertEquals(templateMetadata.description, "Issue summary template");
    assertEquals(templateMetadata.author, "team@example.com");
    assertInstanceOf(templateMetadata.createdAt, Date);
    assertInstanceOf(templateMetadata.updatedAt, Date);
  }
});

Deno.test("2_structure - GeneratedPrompt maintains relationships", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("task");
  const pathResult = TemplatePath.create(directive, layer, "task.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Complete {task} by {deadline}");
  if (!isOk(templateResult)) return;

  const template = templateResult.data;
  const variables = TemplateVariables.create({
    task: "Code review",
    deadline: "2024-01-15",
  });

  // Act
  const generatedResult = template.generate(variables);

  // Assert
  assertEquals(isOk(generatedResult), true);
  if (isOk(generatedResult)) {
    const generated = generatedResult.data;
    assertEquals(generated.getContent(), "Complete Code review by 2024-01-15");
    assertEquals(generated.getTemplate(), template);
    assertEquals(generated.getAppliedVariables().toObject(), {
      task: "Code review",
      deadline: "2024-01-15",
    });
    assertInstanceOf(generated.getGeneratedAt(), Date);
  }
});

Deno.test("2_structure - PromptGenerationError contains domain context", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "test.md");
  if (!isOk(pathResult)) return;

  const path = pathResult.data;
  const missingVars = ["var1", "var2"];

  // Act
  const error = new PromptGenerationError(
    "Test error message",
    path,
    missingVars,
  );

  // Assert
  assertEquals(error.message, "Test error message");
  assertEquals(error.name, "PromptGenerationError");
  assertEquals(error.templatePath, path);
  assertEquals(error.missingVariables, missingVars);
  assertInstanceOf(error, Error);
});

Deno.test("2_structure - Aggregate maintains entity relationships", () => {
  // Arrange
  const directive = createMockDirectiveType("defect");
  const layer = createMockLayerType("issue");
  const pathResult = TemplatePath.create(directive, layer, "defect.md");
  if (!isOk(pathResult)) return;

  const templateResult = PromptTemplate.create(pathResult.data, "Analyze {issue}");
  if (!isOk(templateResult)) return;

  const aggregateResult = PromptGenerationAggregate.create("defect-123", templateResult.data);
  if (!isOk(aggregateResult)) return;

  const aggregate = aggregateResult.data;
  const template = templateResult.data;
  const variables = TemplateVariables.create({ issue: "Memory leak" });

  // Act
  const result = aggregate.generatePrompt(variables);
  const state = aggregate.getState();

  // Assert - Entity relationships preserved
  assertEquals(aggregate.getId(), "defect-123");
  assertEquals(aggregate.getTemplate().getPath().getFilename(), "defect.md");
  assertEquals(isOk(result), true);
  if (isOk(result)) {
    assertEquals(result.data.getTemplate(), template);
  }
  assertEquals(state.lastGenerated?.getContent(), "Analyze Memory leak");
  assertEquals(state.lastGenerated?.getAppliedVariables().get("issue"), "Memory leak");
});

Deno.test("2_structure - Value object immutability is preserved", () => {
  // Arrange
  const directive = createMockDirectiveType("to");
  const layer = createMockLayerType("project");
  const pathResult = TemplatePath.create(directive, layer, "immutable.md");
  if (!isOk(pathResult)) return;

  const path = pathResult.data;
  const variables1 = TemplateVariables.create({ key: "value1" });
  const variables2 = TemplateVariables.create({ key: "value2" });

  // Act
  const merged = variables1.merge(variables2);

  // Assert - Original objects remain unchanged
  assertEquals(variables1.get("key"), "value1");
  assertEquals(variables2.get("key"), "value2");
  assertEquals(merged.get("key"), "value2");

  // Verify path immutability
  assertEquals(path.getDirective(), directive);
  assertEquals(path.getLayer(), layer);
  assertEquals(path.getFilename(), "immutable.md");
});
