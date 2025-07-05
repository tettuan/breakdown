/**
 * @fileoverview Prompt Generation Aggregate Tests
 */

import { assertEquals, assertThrows } from "../../../lib/deps.ts";
import {
  PromptGenerationAggregate,
  PromptTemplate,
  TemplatePath,
  TemplateContent,
  TemplateVariables,
  GeneratedPrompt,
  PromptGenerationError,
} from "../../../../lib/domain/templates/prompt_generation_aggregate.ts";
import { DirectiveType, LayerType } from "../../../lib/deps.ts";

// Helper to create test types
function createTestTypes() {
  const directive = { getValue: () => "to" } as DirectiveType;
  const layer = { getValue: () => "task" } as LayerType;
  return { directive, layer };
}

Deno.test("TemplatePath - creates valid path", () => {
  const { directive, layer } = createTestTypes();
  const path = TemplatePath.create(directive, layer, "f_task.md");
  
  assertEquals(path.getPath(), "to/task/f_task.md");
  assertEquals(path.getDirective(), directive);
  assertEquals(path.getLayer(), layer);
  assertEquals(path.getFilename(), "f_task.md");
});

Deno.test("TemplatePath - validates filename extension", () => {
  const { directive, layer } = createTestTypes();
  
  assertThrows(
    () => TemplatePath.create(directive, layer, "invalid.txt"),
    Error,
    "Invalid template filename",
  );
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
  const path = TemplatePath.create(directive, layer, "f_task.md");
  const template = PromptTemplate.create(
    path,
    "Task: {title}\nDescription: {description}",
  );
  
  const variables = TemplateVariables.create({
    title: "Fix bug",
    description: "Fix the login issue",
  });
  
  const generated = template.generate(variables);
  assertEquals(
    generated.getContent(),
    "Task: Fix bug\nDescription: Fix the login issue",
  );
});

Deno.test("PromptTemplate - throws on missing variables", () => {
  const { directive, layer } = createTestTypes();
  const path = TemplatePath.create(directive, layer, "f_task.md");
  const template = PromptTemplate.create(
    path,
    "Task: {title}\nAssigned to: {assignee}",
  );
  
  const variables = TemplateVariables.create({
    title: "Fix bug",
    // missing 'assignee'
  });
  
  assertThrows(
    () => template.generate(variables),
    PromptGenerationError,
    "Missing required variables: assignee",
  );
});

Deno.test("PromptGenerationAggregate - successful generation", () => {
  const { directive, layer } = createTestTypes();
  const path = TemplatePath.create(directive, layer, "f_task.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  const aggregate = PromptGenerationAggregate.create("test-1", template);
  
  const variables = TemplateVariables.create({ name: "World" });
  const result = aggregate.generatePrompt(variables);
  
  assertEquals(result.success, true);
  assertEquals(result.prompt?.getContent(), "Hello World!");
  assertEquals(result.attempts, 1);
  
  const state = aggregate.getState();
  assertEquals(state.status, "completed");
});

Deno.test("PromptGenerationAggregate - handles generation failure", () => {
  const { directive, layer } = createTestTypes();
  const path = TemplatePath.create(directive, layer, "f_task.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  const aggregate = PromptGenerationAggregate.create("test-2", template);
  
  const variables = TemplateVariables.create({}); // missing 'name'
  const result = aggregate.generatePrompt(variables);
  
  assertEquals(result.success, false);
  assertEquals(result.error instanceof PromptGenerationError, true);
  assertEquals(result.attempts, 1);
  
  const state = aggregate.getState();
  assertEquals(state.status, "failed");
  assertEquals(aggregate.canRetry(), true);
});

Deno.test("PromptGenerationAggregate - retry limit", () => {
  const { directive, layer } = createTestTypes();
  const path = TemplatePath.create(directive, layer, "f_task.md");
  const template = PromptTemplate.create(path, "Hello {name}!");
  const aggregate = PromptGenerationAggregate.create("test-3", template);
  
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
  const path = TemplatePath.create(directive, layer, "f_task.md");
  const template = PromptTemplate.create(path, "Task: {title}");
  const variables = TemplateVariables.create({ title: "Test" });
  
  const generated = template.generate(variables);
  
  assertEquals(generated.getContent(), "Task: Test");
  assertEquals(generated.getTemplate(), template);
  assertEquals(generated.getAppliedVariables().get("title"), "Test");
  assertEquals(generated.getGeneratedAt() instanceof Date, true);
});