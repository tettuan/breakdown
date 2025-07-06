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

import { assertEquals, assertThrows, assertInstanceOf } from "@std/assert";
import { 
  PromptGenerationAggregate,
  PromptTemplate, 
  TemplatePath,
  TemplateContent,
  TemplateVariables,
  GeneratedPrompt,
  PromptGenerationError,
  type GenerationResult
} from "./prompt_generation_aggregate.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";

// Mock DirectiveType and LayerType for testing
class MockDirectiveType {
  constructor(private value: string) {}
  getValue(): string { return this.value; }
}

class MockLayerType {
  constructor(private value: string) {}
  getValue(): string { return this.value; }
}

// =============================================================================
// 0_architecture Tests - Aggregate Root and DDD Principles
// =============================================================================

Deno.test("0_architecture - PromptGenerationAggregate follows Aggregate Root pattern", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "test.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  
  // Act
  const aggregate = PromptGenerationAggregate.create("test-id", template);
  
  // Assert - Aggregate maintains identity and encapsulation
  assertEquals(aggregate.getId(), "test-id");
  assertEquals(aggregate.getTemplate(), template);
  assertEquals(aggregate.getState().status, "initialized");
  assertEquals(aggregate.getState().attempts, 0);
  assertEquals(aggregate.getState().errors.length, 0);
});

Deno.test("0_architecture - PromptGenerationAggregate encapsulates state mutation", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "test.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  const aggregate = PromptGenerationAggregate.create("test-id", template);
  const variables = TemplateVariables.create({ name: "World" });
  
  // Act
  const result1 = aggregate.generatePrompt(variables);
  const state1 = aggregate.getState();
  const result2 = aggregate.generatePrompt(variables);
  const state2 = aggregate.getState();
  
  // Assert - State changes are controlled by aggregate
  assertEquals(result1.success, true);
  assertEquals(state1.attempts, 1);
  assertEquals(state1.status, "completed");
  assertEquals(result2.success, true);
  assertEquals(state2.attempts, 2);
  assertEquals(state2.status, "completed");
});

Deno.test("0_architecture - Domain invariants are maintained across operations", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "test.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  const aggregate = PromptGenerationAggregate.create("test-id", template);
  const invalidVariables = TemplateVariables.create({ wrong: "value" });
  
  // Act
  const result = aggregate.generatePrompt(invalidVariables);
  const state = aggregate.getState();
  
  // Assert - Invariants preserved even on failure
  assertEquals(result.success, false);
  assertEquals(state.status, "failed");
  assertEquals(state.attempts, 1);
  assertEquals(state.errors.length, 1);
  assertInstanceOf(state.errors[0], PromptGenerationError);
});

Deno.test("0_architecture - Aggregate enforces retry policy", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "test.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  const aggregate = PromptGenerationAggregate.create("test-id", template);
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
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "greeting.md");
  const template = PromptTemplate.create(path, "Hello {name}, welcome to {project}!");
  const aggregate = PromptGenerationAggregate.create("greeting-001", template);
  const variables = TemplateVariables.create({ 
    name: "Alice", 
    project: "Breakdown" 
  });
  
  // Act
  const result = aggregate.generatePrompt(variables);
  
  // Assert
  assertEquals(result.success, true);
  assertEquals(result.attempts, 1);
  assertEquals(result.prompt?.getContent(), "Hello Alice, welcome to Breakdown!");
  assertEquals(aggregate.getState().status, "completed");
});

Deno.test("1_behavior - Prompt generation fails with missing variables", () => {
  // Arrange
  const directive = new MockDirectiveType("summary") as unknown as DirectiveType;
  const layer = new MockLayerType("issue") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "summary.md");
  const template = PromptTemplate.create(path, "Summarize {title} from {source}");
  const aggregate = PromptGenerationAggregate.create("summary-001", template);
  const variables = TemplateVariables.create({ title: "Test Issue" }); // Missing 'source'
  
  // Act
  const result = aggregate.generatePrompt(variables);
  
  // Assert
  assertEquals(result.success, false);
  assertEquals(result.attempts, 1);
  assertInstanceOf(result.error, PromptGenerationError);
  assertEquals(result.error?.message, "Missing required variables: source");
  assertEquals(aggregate.getState().status, "failed");
});

Deno.test("1_behavior - Multiple variable substitution with complex template", () => {
  // Arrange
  const directive = new MockDirectiveType("defect") as unknown as DirectiveType;
  const layer = new MockLayerType("task") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "defect_analysis.md");
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
  const template = PromptTemplate.create(path, complexTemplate);
  const aggregate = PromptGenerationAggregate.create("defect-001", template);
  const variables = TemplateVariables.create({
    component: "AuthService",
    description: "Login timeout after 30 seconds",
    severity: "HIGH",
    reporter: "john.doe@example.com",
    impact_area: "user authentication"
  });
  
  // Act
  const result = aggregate.generatePrompt(variables);
  
  // Assert
  assertEquals(result.success, true);
  const content = result.prompt?.getContent() || "";
  assertEquals(content.includes("AuthService"), true);
  assertEquals(content.includes("Login timeout after 30 seconds"), true);
  assertEquals(content.includes("HIGH"), true);
  assertEquals(content.includes("john.doe@example.com"), true);
  assertEquals(content.includes("user authentication"), true);
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
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  
  // Act & Assert - Valid filename
  const validPath = TemplatePath.create(directive, layer, "template.md");
  assertEquals(validPath.getFilename(), "template.md");
  assertEquals(validPath.getPath(), "to/project/template.md");
  
  // Act & Assert - Invalid filename throws
  assertThrows(
    () => TemplatePath.create(directive, layer, "template.txt"),
    Error,
    "Invalid template filename: template.txt. Must end with .md"
  );
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
  const directive = new MockDirectiveType("summary") as unknown as DirectiveType;
  const layer = new MockLayerType("issue") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "issue_summary.md");
  const content = "Summarize {issue_title} with priority {priority}";
  const metadata = {
    version: "2.1.0",
    description: "Issue summary template",
    author: "team@example.com"
  };
  
  // Act
  const template = PromptTemplate.create(path, content, metadata);
  
  // Assert
  assertEquals(template.getPath(), path);
  assertEquals(template.getContent().getContent(), content);
  const templateMetadata = template.getMetadata();
  assertEquals(templateMetadata.version, "2.1.0");
  assertEquals(templateMetadata.description, "Issue summary template");
  assertEquals(templateMetadata.author, "team@example.com");
  assertInstanceOf(templateMetadata.createdAt, Date);
  assertInstanceOf(templateMetadata.updatedAt, Date);
});

Deno.test("2_structure - GeneratedPrompt maintains relationships", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("task") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "task.md");
  const template = PromptTemplate.create(path, "Complete {task} by {deadline}");
  const variables = TemplateVariables.create({ 
    task: "Code review", 
    deadline: "2024-01-15" 
  });
  
  // Act
  const generated = template.generate(variables);
  
  // Assert
  assertEquals(generated.getContent(), "Complete Code review by 2024-01-15");
  assertEquals(generated.getTemplate(), template);
  assertEquals(generated.getAppliedVariables().toObject(), {
    task: "Code review",
    deadline: "2024-01-15"
  });
  assertInstanceOf(generated.getGeneratedAt(), Date);
});

Deno.test("2_structure - PromptGenerationError contains domain context", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "test.md");
  const missingVars = ["var1", "var2"];
  
  // Act
  const error = new PromptGenerationError(
    "Test error message",
    path,
    missingVars
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
  const directive = new MockDirectiveType("defect") as unknown as DirectiveType;
  const layer = new MockLayerType("issue") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "defect.md");
  const template = PromptTemplate.create(path, "Analyze {issue}");
  const aggregate = PromptGenerationAggregate.create("defect-123", template);
  const variables = TemplateVariables.create({ issue: "Memory leak" });
  
  // Act
  const result = aggregate.generatePrompt(variables);
  const state = aggregate.getState();
  
  // Assert - Entity relationships preserved
  assertEquals(aggregate.getId(), "defect-123");
  assertEquals(aggregate.getTemplate().getPath().getFilename(), "defect.md");
  assertEquals(result.prompt?.getTemplate(), template);
  assertEquals(state.lastGenerated?.getContent(), "Analyze Memory leak");
  assertEquals(state.lastGenerated?.getAppliedVariables().get("issue"), "Memory leak");
});

Deno.test("2_structure - Value object immutability is preserved", () => {
  // Arrange
  const directive = new MockDirectiveType("to") as unknown as DirectiveType;
  const layer = new MockLayerType("project") as unknown as LayerType;
  const path = TemplatePath.create(directive, layer, "immutable.md");
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