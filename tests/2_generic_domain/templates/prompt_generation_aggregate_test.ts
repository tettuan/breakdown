/**
 * @fileoverview Prompt Generation Aggregate Integration Tests
 * Testing aggregate collaboration and domain coordination
 *
 * Integration tests verify:
 * - Prompt generation aggregate orchestration
 * - Template and schema collaboration
 * - Variable resolution and validation workflows
 * - Error propagation and recovery scenarios
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  GeneratedPrompt as _GeneratedPrompt,
  PromptGenerationAggregate,
  PromptGenerationError,
  PromptTemplate,
  TemplateContent as _TemplateContent,
  TemplatePath,
  TemplateVariables,
} from "../../../lib/domain/templates/prompt_generation_aggregate.ts";
import type { DirectiveType, LayerType } from "../../../lib/types/mod.ts";

const logger = new BreakdownLogger("prompt-generation-aggregate-integration");

// Interface for aggregate state (imported from domain for better type safety)
interface GenerationState {
  status: "initialized" | "generating" | "completed" | "failed";
  attempts: number;
  errors: (Error | PromptGenerationError)[];
  lastGenerated?: _GeneratedPrompt;
}

// Enhanced state interface for test tracking
interface TestState extends GenerationState {
  operation: string;
}

// Mock DirectiveType and LayerType for testing
const createMockDirective = (value: string): DirectiveType => ({
  getValue: () => value,
} as DirectiveType);

const createMockLayer = (value: string): LayerType => ({
  getValue: () => value,
} as LayerType);

// Helper function to create test template
function createTestTemplate(
  directive: string,
  layer: string,
  filename: string,
  content: string,
): Promise<PromptTemplate> {
  const dir = createMockDirective(directive);
  const lay = createMockLayer(layer);

  const pathResult = TemplatePath.create(dir, lay, filename);
  if (!pathResult.ok) {
    throw new Error(`Failed to create path: ${pathResult.error}`);
  }

  const templateResult = PromptTemplate.create(pathResult.data, content);
  if (!templateResult.ok) {
    throw new Error(`Failed to create template: ${templateResult.error}`);
  }

  return Promise.resolve(templateResult.data);
}

Deno.test("Prompt Generation Aggregate Integration: complete workflow", async () => {
  logger.debug("Testing complete prompt generation workflow", "integration:complete-workflow");

  // Create template with variables
  const template = await createTestTemplate(
    "to",
    "project",
    "breakdown.md",
    `# Project Breakdown: {project_name}

## Overview
Project: {project_name}
Description: {project_description}
Priority: {priority}

## Objectives
{objectives}

## Timeline
Start Date: {start_date}
End Date: {end_date}

## Resources
- Team: {team_members}
- Budget: {budget}

## Next Steps
{next_steps}`,
  );

  // Create prompt generation aggregate
  const aggregateResult = PromptGenerationAggregate.create("breakdown-001", template);
  assertEquals(aggregateResult.ok, true);

  if (!aggregateResult.ok) return;
  const aggregate = aggregateResult.data;

  // Verify initial state
  assertEquals(aggregate.getId(), "breakdown-001");
  assertEquals(aggregate.getTemplate(), template);
  assertEquals(aggregate.getState().status, "initialized");
  assertEquals(aggregate.getState().attempts, 0);

  // Create variables for the template
  const variables = TemplateVariables.create({
    project_name: "User Dashboard Redesign",
    project_description: "Modernize the user dashboard with improved UX",
    priority: "high",
    objectives: "- Improve user experience\n- Reduce load times\n- Add personalization",
    start_date: "2024-01-15",
    end_date: "2024-03-30",
    team_members: "Alice (Lead), Bob (Designer), Carol (Developer)",
    budget: "$50,000",
    next_steps: "1. Requirements gathering\n2. Design mockups\n3. Development",
  });

  // Generate prompt
  const promptResult = aggregate.generatePrompt(variables);
  assertEquals(promptResult.ok, true);

  if (!promptResult.ok) return;
  const generatedPrompt = promptResult.data;

  // Verify generated prompt
  assertExists(generatedPrompt);
  assertEquals(generatedPrompt.getTemplate(), template);
  assertEquals(generatedPrompt.getAppliedVariables(), variables);

  const content = generatedPrompt.getContent();
  assertEquals(content.includes("User Dashboard Redesign"), true);
  assertEquals(content.includes("high"), true);
  assertEquals(content.includes("Alice (Lead)"), true);
  assertEquals(content.includes("$50,000"), true);

  // Verify aggregate state after successful generation
  const finalState = aggregate.getState();
  assertEquals(finalState.status, "completed");
  assertEquals(finalState.attempts, 1);
  assertEquals(finalState.lastGenerated, generatedPrompt);
  assertEquals(finalState.errors.length, 0);
});

Deno.test("Prompt Generation Aggregate Integration: missing variables handling", async () => {
  logger.debug("Testing missing variables error handling", "integration:missing-variables");

  // Create template with required variables
  const template = await createTestTemplate(
    "summary",
    "issue",
    "issue_summary.md",
    `# Issue Summary

Title: {issue_title}
Description: {issue_description}
Severity: {severity}
Reporter: {reporter}
Assigned To: {assignee}

## Details
Created: {created_date}
Updated: {updated_date}
Status: {status}`,
  );

  // Create aggregate
  const aggregateResult = PromptGenerationAggregate.create("issue-summary-001", template);
  assertEquals(aggregateResult.ok, true);

  if (!aggregateResult.ok) return;
  const aggregate = aggregateResult.data;

  // Create incomplete variables (missing some required ones)
  const incompleteVariables = TemplateVariables.create({
    issue_title: "Login page not working",
    description: "Users cannot log in", // Wrong key - should be 'issue_description'
    severity: "high",
    // Missing: reporter, assignee, created_date, updated_date, status
  });

  // Attempt to generate prompt with missing variables
  const promptResult = aggregate.generatePrompt(incompleteVariables);
  assertEquals(promptResult.ok, false);

  if (promptResult.ok) return;
  const error = promptResult.error;

  // Verify error details
  assertExists(error);
  assertEquals(error instanceof PromptGenerationError, true);
  assertEquals(error.templatePath, template.getPath());
  assertExists(error.missingVariables);
  assertEquals(error.missingVariables.length > 0, true);

  // Verify missing variables include expected ones
  const missingVars = error.missingVariables;
  assertEquals(missingVars.includes("issue_description"), true);
  assertEquals(missingVars.includes("reporter"), true);
  assertEquals(missingVars.includes("assignee"), true);

  // Verify aggregate state after failed generation
  const failedState = aggregate.getState();
  assertEquals(failedState.status, "failed");
  assertEquals(failedState.attempts, 1);
  assertEquals(failedState.errors.length, 1);
  assertEquals(failedState.lastGenerated, undefined);
});

Deno.test("Prompt Generation Aggregate Integration: retry mechanism", async () => {
  logger.debug("Testing retry mechanism", "integration:retry");

  // Create simple template
  const template = await createTestTemplate(
    "defect",
    "task",
    "defect_report.md",
    `# Defect Report

Title: {title}
Description: {description}
Priority: {priority}`,
  );

  // Create aggregate
  const aggregateResult = PromptGenerationAggregate.create("defect-001", template);
  assertEquals(aggregateResult.ok, true);

  if (!aggregateResult.ok) return;
  const aggregate = aggregateResult.data;

  // First attempt with missing variables
  const incompleteVars = TemplateVariables.create({
    title: "Bug in calculation",
    // Missing: description, priority
  });

  const firstResult = aggregate.generatePrompt(incompleteVars);
  assertEquals(firstResult.ok, false);
  assertEquals(aggregate.getState().status, "failed");
  assertEquals(aggregate.getState().attempts, 1);
  assertEquals(aggregate.canRetry(), true);

  // Second attempt with missing variables
  const stillIncompleteVars = TemplateVariables.create({
    title: "Bug in calculation",
    description: "Mathematical calculation returns wrong result",
    // Missing: priority
  });

  const secondResult = aggregate.generatePrompt(stillIncompleteVars);
  assertEquals(secondResult.ok, false);
  assertEquals(aggregate.getState().status, "failed");
  assertEquals(aggregate.getState().attempts, 2);
  assertEquals(aggregate.canRetry(), true);

  // Third attempt with complete variables
  const completeVars = TemplateVariables.create({
    title: "Bug in calculation",
    description: "Mathematical calculation returns wrong result",
    priority: "medium",
  });

  const thirdResult = aggregate.generatePrompt(completeVars);
  assertEquals(thirdResult.ok, true);
  assertEquals(aggregate.getState().status, "completed");
  assertEquals(aggregate.getState().attempts, 3);
  assertEquals(aggregate.canRetry(), false); // No longer needs retry

  // Verify final prompt content
  if (thirdResult.ok) {
    const content = thirdResult.data.getContent();
    assertEquals(content.includes("Bug in calculation"), true);
    assertEquals(content.includes("Mathematical calculation"), true);
    assertEquals(content.includes("medium"), true);
  }
});

Deno.test("Prompt Generation Aggregate Integration: max retry limit", async () => {
  logger.debug("Testing max retry limit", "integration:max-retry");

  // Create template
  const template = await createTestTemplate(
    "to",
    "task",
    "task_conversion.md",
    `# Task: {task_name}
Type: {task_type}
Complexity: {complexity}`,
  );

  // Create aggregate
  const aggregateResult = PromptGenerationAggregate.create("task-001", template);
  assertEquals(aggregateResult.ok, true);

  if (!aggregateResult.ok) return;
  const aggregate = aggregateResult.data;

  // Attempt 1: Missing variables
  const attempt1 = aggregate.generatePrompt(TemplateVariables.create({ task_name: "Test" }));
  assertEquals(attempt1.ok, false);
  assertEquals(aggregate.canRetry(), true);

  // Attempt 2: Still missing variables
  const attempt2 = aggregate.generatePrompt(TemplateVariables.create({ task_name: "Test" }));
  assertEquals(attempt2.ok, false);
  assertEquals(aggregate.canRetry(), true);

  // Attempt 3: Still missing variables (max attempts reached)
  const attempt3 = aggregate.generatePrompt(TemplateVariables.create({ task_name: "Test" }));
  assertEquals(attempt3.ok, false);
  assertEquals(aggregate.canRetry(), false); // No more retries allowed

  assertEquals(aggregate.getState().attempts, 3);
  assertEquals(aggregate.getState().status, "failed");
  assertEquals(aggregate.getState().errors.length, 3);
});

Deno.test("Prompt Generation Aggregate Integration: template content variation", async () => {
  logger.debug("Testing template content variations", "integration:content-variation");

  // Test with complex template containing nested variables
  const complexTemplate = await createTestTemplate(
    "summary",
    "project",
    "project_status.md",
    `# Project Status Report

## Project Information
**Name**: {project.name}
**Code**: {project.code}
**Manager**: {project.manager}

## Current Phase
**Phase**: {current_phase.name}
**Progress**: {current_phase.progress}%
**Status**: {current_phase.status}

## Milestones
{milestones.completed}

{milestones.upcoming}

## Issues & Risks
{issues.count} issues found:
{issues.details}

Risk Level: {risk.level}
Risk Factors: {risk.factors}

## Next Actions
{next_actions}`,
  );

  // Create aggregate
  const aggregateResult = PromptGenerationAggregate.create("status-001", complexTemplate);
  assertEquals(aggregateResult.ok, true);

  if (!aggregateResult.ok) return;
  const aggregate = aggregateResult.data;

  // Create variables with dot notation (will be flattened for template)
  const complexVariables = TemplateVariables.create({
    "project.name": "E-commerce Platform",
    "project.code": "ECOM-2024",
    "project.manager": "Sarah Johnson",
    "current_phase.name": "Development",
    "current_phase.progress": "75",
    "current_phase.status": "On Track",
    "milestones.completed": "✓ Requirements Analysis\n✓ System Design\n✓ Database Setup",
    "milestones.upcoming": "- Frontend Development (Due: Feb 15)\n- API Integration (Due: Mar 1)",
    "issues.count": "3",
    "issues.details":
      "1. Performance bottleneck in search\n2. UI responsive issues\n3. Authentication timeout",
    "risk.level": "Medium",
    "risk.factors": "Timeline pressure, Resource availability",
    "next_actions":
      "1. Address performance issues\n2. Complete frontend sprint\n3. Schedule integration testing",
  });

  // Generate prompt
  const promptResult = aggregate.generatePrompt(complexVariables);
  assertEquals(promptResult.ok, true);

  if (!promptResult.ok) return;
  const generatedPrompt = promptResult.data;

  // Verify complex content substitution
  const content = generatedPrompt.getContent();
  assertEquals(content.includes("E-commerce Platform"), true);
  assertEquals(content.includes("ECOM-2024"), true);
  assertEquals(content.includes("Sarah Johnson"), true);
  assertEquals(content.includes("75%"), true);
  assertEquals(content.includes("3 issues found"), true);
  assertEquals(content.includes("Performance bottleneck"), true);
  assertEquals(content.includes("Medium"), true);

  // Verify all variables were substituted (no remaining {variable} patterns)
  const remainingVariables = content.match(/\{[^}]+\}/g);
  assertEquals(remainingVariables, null);
});

Deno.test("Prompt Generation Aggregate Integration: state management across operations", async () => {
  logger.debug("Testing state management across operations", "integration:state-management");

  // Create template
  const template = await createTestTemplate(
    "find",
    "bugs",
    "bug_analysis.md",
    `# Bug Analysis

Bug ID: {bug_id}
Component: {component}
Severity: {severity}
Description: {description}`,
  );

  // Create aggregate
  const aggregateResult = PromptGenerationAggregate.create("bug-analysis-001", template);
  assertEquals(aggregateResult.ok, true);

  if (!aggregateResult.ok) return;
  const aggregate = aggregateResult.data;

  // Track state changes through multiple operations
  const states: TestState[] = [];

  // Initial state
  states.push({ ...aggregate.getState(), operation: "initial" });

  // First generation attempt (will fail)
  const firstAttempt = aggregate.generatePrompt(TemplateVariables.create({
    bug_id: "BUG-001",
    // Missing: component, severity, description
  }));
  states.push({ ...aggregate.getState(), operation: "first_attempt" });

  // Second generation attempt (will succeed)
  const secondAttempt = aggregate.generatePrompt(TemplateVariables.create({
    bug_id: "BUG-001",
    component: "user-authentication",
    severity: "high",
    description: "Users cannot log in with correct credentials",
  }));
  states.push({ ...aggregate.getState(), operation: "second_attempt" });

  // Verify state progression
  assertEquals(states[0].status, "initialized");
  assertEquals(states[0].attempts, 0);
  assertEquals(states[0].errors.length, 0);

  assertEquals(states[1].status, "failed");
  assertEquals(states[1].attempts, 1);
  assertEquals(states[1].errors.length, 1);
  assertEquals(states[1].lastGenerated, undefined);

  assertEquals(states[2].status, "completed");
  assertEquals(states[2].attempts, 2);
  assertEquals(states[2].errors.length, 1); // Previous errors are preserved
  assertExists(states[2].lastGenerated);

  // Verify final results
  assertEquals(firstAttempt.ok, false);
  assertEquals(secondAttempt.ok, true);

  if (secondAttempt.ok) {
    const finalContent = secondAttempt.data.getContent();
    assertEquals(finalContent.includes("BUG-001"), true);
    assertEquals(finalContent.includes("user-authentication"), true);
    assertEquals(finalContent.includes("high"), true);
    assertEquals(finalContent.includes("cannot log in"), true);
  }
});
