/**
 * @fileoverview Prompt Generation Aggregate Tests
 */

import { assertEquals } from "../../lib/deps.ts";
import {
  PromptGenerationAggregate,
  PromptTemplate,
  TemplatePath,
  TemplateContent,
  TemplateVariables,
  GeneratedPrompt,
  PromptGenerationError,
} from "../../../../lib/domain/templates/prompt_generation_aggregate.ts";
import { DirectiveType, LayerType } from "../../lib/deps.ts";

// Helper to create test types
function createTestTypes() {
  const directive = { getValue: () => "to" } as DirectiveType;
  const layer = { getValue: () => "task" } as LayerType;
  return { directive, layer };
}

Deno.test("TemplatePath - creates valid path", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  
  assertEquals(pathResult.ok, true);
  if (pathResult.ok) {
    const path = pathResult.data;
    assertEquals(path.getPath(), "to/task/f_task.md");
    assertEquals(path.getDirective(), directive);
    assertEquals(path.getLayer(), layer);
    assertEquals(path.getFilename(), "f_task.md");
  }
});

Deno.test("TemplatePath - validates filename extension", () => {
  const { directive, layer } = createTestTypes();
  
  const pathResult = TemplatePath.create(directive, layer, "invalid.txt");
  assertEquals(pathResult.ok, false);
  if (!pathResult.ok) {
    assertEquals(pathResult.error.includes("Invalid template filename"), true);
  }
});

Deno.test("TemplateContent - extracts variables correctly", () => {
  const content = TemplateContent.create(
    "Hello {name}, your task is {task} at {location}.",
  );
  
  const variables = content.getRequiredVariables();
  assertEquals(variables.length, 3);
  assertEquals(variables.includes("name"), true);
  assertEquals(variables.includes("task"), true);
  assertEquals(variables.includes("location"), true);
});

Deno.test("TemplateContent - handles no variables", () => {
  const content = TemplateContent.create("No variables here.");
  const variables = content.getRequiredVariables();
  assertEquals(variables.length, 0);
});

Deno.test("TemplateVariables - creates and accesses variables", () => {
  const vars = TemplateVariables.create({
    name: "John",
    task: "implement feature",
  });
  
  assertEquals(vars.get("name"), "John");
  assertEquals(vars.get("task"), "implement feature");
  assertEquals(vars.get("nonexistent"), undefined);
  assertEquals(vars.has("name"), true);
  assertEquals(vars.has("nonexistent"), false);
});

Deno.test("TemplateVariables - merges variables", () => {
  const vars1 = TemplateVariables.create({ a: "1", b: "2" });
  const vars2 = TemplateVariables.create({ b: "3", c: "4" });
  const merged = vars1.merge(vars2);
  
  assertEquals(merged.get("a"), "1");
  assertEquals(merged.get("b"), "3"); // vars2 overwrites vars1
  assertEquals(merged.get("c"), "4");
});

Deno.test("PromptTemplate - generates prompt with all variables", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;
  
  const templateResult = PromptTemplate.create(
    pathResult.data,
    "Task: {title}\nDescription: {description}",
  );
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;
  
  const variables = TemplateVariables.create({
    title: "Fix bug",
    description: "Fix the login issue",
  });
  
  const generatedResult = templateResult.data.generate(variables);
  assertEquals(generatedResult.ok, true);
  if (generatedResult.ok) {
    assertEquals(
      generatedResult.data.getContent(),
      "Task: Fix bug\nDescription: Fix the login issue",
    );
  }
});

Deno.test("PromptTemplate - throws on missing variables", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;
  
  const templateResult = PromptTemplate.create(
    pathResult.data,
    "Task: {title}\nAssigned to: {assignee}",
  );
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;
  
  const variables = TemplateVariables.create({
    title: "Fix bug",
    // missing 'assignee'
  });
  
  const generatedResult = templateResult.data.generate(variables);
  assertEquals(generatedResult.ok, false);
  if (!generatedResult.ok) {
    assertEquals(generatedResult.error instanceof PromptGenerationError, true);
    assertEquals(generatedResult.error.message.includes("Missing required variables: assignee"), true);
  }
});

Deno.test("PromptGenerationAggregate - successful generation", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;
  
  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;
  
  const aggregateResult = PromptGenerationAggregate.create("test-1", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;
  
  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({ name: "World" });
  const result = aggregate.generatePrompt(variables);
  
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.getContent(), "Hello World!");
  }
  
  const state = aggregate.getState();
  assertEquals(state.status, "completed");
  assertEquals(state.attempts, 1);
});

Deno.test("PromptGenerationAggregate - handles generation failure", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;
  
  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;
  
  const aggregateResult = PromptGenerationAggregate.create("test-2", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;
  
  const aggregate = aggregateResult.data;
  const variables = TemplateVariables.create({}); // missing 'name'
  const result = aggregate.generatePrompt(variables);
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error instanceof PromptGenerationError, true);
  }
  
  const state = aggregate.getState();
  assertEquals(state.status, "failed");
  assertEquals(state.attempts, 1);
  assertEquals(aggregate.canRetry(), true);
});

Deno.test("PromptGenerationAggregate - retry limit", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;
  
  const templateResult = PromptTemplate.create(pathResult.data, "Hello {name}!");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;
  
  const aggregateResult = PromptGenerationAggregate.create("test-3", templateResult.data);
  assertEquals(aggregateResult.ok, true);
  if (!aggregateResult.ok) return;
  
  const aggregate = aggregateResult.data;
  const emptyVars = TemplateVariables.create({});
  
  // First attempt
  aggregate.generatePrompt(emptyVars);
  assertEquals(aggregate.canRetry(), true);
  
  // Second attempt
  aggregate.generatePrompt(emptyVars);
  assertEquals(aggregate.canRetry(), true);
  
  // Third attempt
  aggregate.generatePrompt(emptyVars);
  assertEquals(aggregate.canRetry(), false); // Reached retry limit
});

Deno.test("GeneratedPrompt - stores metadata correctly", () => {
  const { directive, layer } = createTestTypes();
  const pathResult = TemplatePath.create(directive, layer, "f_task.md");
  assertEquals(pathResult.ok, true);
  if (!pathResult.ok) return;
  
  const templateResult = PromptTemplate.create(pathResult.data, "Task: {title}");
  assertEquals(templateResult.ok, true);
  if (!templateResult.ok) return;
  
  const template = templateResult.data;
  const variables = TemplateVariables.create({ title: "Test" });
  
  const generatedResult = template.generate(variables);
  assertEquals(generatedResult.ok, true);
  if (!generatedResult.ok) return;
  
  const generated = generatedResult.data;
  assertEquals(generated.getContent(), "Task: Test");
  assertEquals(generated.getTemplate(), template);
  assertEquals(generated.getAppliedVariables().get("title"), "Test");
  assertEquals(generated.getGeneratedAt() instanceof Date, true);
});