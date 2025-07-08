/**
 * @fileoverview Template Management Domain Integration Tests
 * Testing cross-component collaboration and complete workflows
 * 
 * Integration tests verify:
 * - End-to-end template management workflows
 * - SchemaRepository, ValueObjects, and PromptGenerationAggregate collaboration
 * - Complex scenario handling with multiple domain components
 * - Error propagation and recovery across component boundaries
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import all template management domain components
import type { SchemaRepository } from "../../../lib/domain/templates/schema_repository.ts";
import {
  PromptGenerationAggregate,
  PromptTemplate,
  TemplatePath,
  TemplateVariables,
} from "../../../lib/domain/templates/prompt_generation_aggregate.ts";
import {
  TemplateId,
  SchemaId,
  TemplateVersion,
  TemplateMetadata,
  TemplateRequest,
} from "../../../lib/domain/templates/template_value_objects.ts";
import type { DirectiveType, LayerType } from "../../../lib/types/mod.ts";

const logger = new BreakdownLogger("template-management-integration");

// Mock implementations and helpers
const createMockDirective = (value: string): DirectiveType => ({
  getValue: () => value,
} as DirectiveType);

const createMockLayer = (value: string): LayerType => ({
  getValue: () => value,
} as LayerType);

// Template Management Service that orchestrates all components
class TemplateManagementService {
  constructor(
    private schemaRepository: SchemaRepository,
  ) {}

  async processTemplateRequest(request: TemplateRequest): Promise<{
    success: boolean;
    generatedPrompt?: string;
    aggregate?: PromptGenerationAggregate;
    errors?: string[];
  }> {
    logger.debug("Processing template request", "service:process", {
      templateId: request.getTemplateId(),
      schemaId: request.getSchemaId(),
    });

    const errors: string[] = [];

    try {
      // Step 1: Validate template and schema IDs
      const templateId = TemplateId.fromString(request.getTemplateId());
      const schemaId = SchemaId.fromString(request.getSchemaId());

      // Step 2: Load template content (mocked)
      const templateContent = await this.loadTemplateContent(templateId);
      
      // Step 3: Load and validate schema
      const schemaPath = this.createSchemaPath(schemaId);
      const schemaExists = await this.schemaRepository.exists(schemaPath);
      
      if (!schemaExists) {
        errors.push(`Schema not found: ${schemaId.getValue()}`);
      }

      // Step 4: Create template
      const directive = createMockDirective(templateId.getDirectivePart());
      const layer = createMockLayer(templateId.getLayerPart());
      const templatePathResult = TemplatePath.create(
        directive,
        layer,
        templateId.getFilenamePart(),
      );

      if (!templatePathResult.ok) {
        errors.push(`Invalid template path: ${templatePathResult.error}`);
        return { success: false, errors };
      }

      const templateResult = PromptTemplate.create(
        templatePathResult.data,
        templateContent,
      );

      if (!templateResult.ok) {
        errors.push(`Invalid template: ${templateResult.error}`);
        return { success: false, errors };
      }

      // Step 5: Create prompt generation aggregate
      const aggregateId = `${templateId.getDirectivePart()}-${templateId.getLayerPart()}-${Date.now()}`;
      const aggregateResult = PromptGenerationAggregate.create(aggregateId, templateResult.data);

      if (!aggregateResult.ok) {
        errors.push(`Failed to create aggregate: ${aggregateResult.error}`);
        return { success: false, errors };
      }

      const aggregate = aggregateResult.data;

      // Step 6: Create template variables from request
      const variables = TemplateVariables.create(request.getVariables());

      // Step 7: Generate prompt
      const promptResult = aggregate.generatePrompt(variables);

      if (!promptResult.ok) {
        errors.push(`Prompt generation failed: ${promptResult.error.message}`);
        return { success: false, errors, aggregate };
      }

      return {
        success: true,
        generatedPrompt: promptResult.data.getContent(),
        aggregate,
      };

    } catch (error) {
      errors.push(`Unexpected error: ${error.message}`);
      return { success: false, errors };
    }
  }

  private async loadTemplateContent(templateId: TemplateId): Promise<string> {
    // Mock template content based on template ID
    const directive = templateId.getDirectivePart();
    const layer = templateId.getLayerPart();

    switch (`${directive}/${layer}`) {
      case "to/project":
        return `# Convert to Project

Project Name: {project_name}
Description: {description}
Objectives: {objectives}
Timeline: {timeline}`;

      case "summary/issue":
        return `# Issue Summary

Issue: {issue_title}
Status: {status}
Priority: {priority}
Description: {description}
Reporter: {reporter}`;

      case "defect/task":
        return `# Task Defect Analysis

Task: {task_name}
Defect Type: {defect_type}
Severity: {severity}
Impact: {impact}
Root Cause: {root_cause}`;

      default:
        return `# {directive} {layer} Template

Content: {content}
Details: {details}`;
    }
  }

  private createSchemaPath(schemaId: SchemaId): any {
    // Mock schema path creation
    return {
      getPath: () => schemaId.getValue(),
      getDirective: () => createMockDirective(schemaId.getDirectivePart()),
      getLayer: () => createMockLayer(schemaId.getLayerPart()),
      getFilename: () => schemaId.getFilenamePart(),
    };
  }
}

// Mock SchemaRepository for integration testing
class MockSchemaRepository implements SchemaRepository {
  private schemas = new Set([
    "to/project/base.schema.md",
    "summary/issue/base.schema.md",
    "defect/task/base.schema.md",
  ]);

  async exists(path: any): Promise<boolean> {
    return this.schemas.has(path.getPath());
  }

  async loadSchema(path: any): Promise<any> {
    if (!await this.exists(path)) {
      throw new Error(`Schema not found: ${path.getPath()}`);
    }
    return { path, content: {}, metadata: {} };
  }

  // Other methods (simplified for testing)
  async loadSchemas() { return new Map(); }
  async listAvailable() { return { schemas: [], generatedAt: new Date(), totalCount: 0 }; }
  async save() {}
  async saveAll() { return { successful: [], failed: [] }; }
  async delete() {}
  async deleteAll() { return { successful: [], failed: [] }; }
  async getDependencies() { return []; }
  async validateSchema() { return { valid: true }; }
  async refresh() {}
}

Deno.test("Template Management Integration: complete project breakdown workflow", async () => {
  logger.debug("Testing complete project breakdown workflow", "integration:project-breakdown");

  const schemaRepository = new MockSchemaRepository();
  const service = new TemplateManagementService(schemaRepository);

  // Create a comprehensive template request
  const templateRequest = TemplateRequest.create({
    templateId: "to/project/breakdown.md",
    schemaId: "to/project/base.schema.md",
    variables: {
      project_name: "Customer Portal Modernization",
      description: "Modernize the existing customer portal with new technologies",
      objectives: "- Improve user experience\n- Reduce maintenance costs\n- Increase security",
      timeline: "Q1 2024 - Q3 2024",
    },
    options: {
      includeMetadata: true,
      validateVariables: true,
      formatOutput: true,
    },
  });

  // Process the request
  const result = await service.processTemplateRequest(templateRequest);

  // Verify successful processing
  assertEquals(result.success, true);
  assertExists(result.generatedPrompt);
  assertExists(result.aggregate);

  // Verify prompt content
  const prompt = result.generatedPrompt!;
  assertEquals(prompt.includes("Customer Portal Modernization"), true);
  assertEquals(prompt.includes("Improve user experience"), true);
  assertEquals(prompt.includes("Q1 2024 - Q3 2024"), true);

  // Verify aggregate state
  const aggregate = result.aggregate!;
  assertEquals(aggregate.getState().status, "completed");
  assertEquals(aggregate.getState().attempts, 1);
  assertEquals(aggregate.getState().errors.length, 0);
});

Deno.test("Template Management Integration: multi-step issue processing", async () => {
  logger.debug("Testing multi-step issue processing", "integration:issue-processing");

  const schemaRepository = new MockSchemaRepository();
  const service = new TemplateManagementService(schemaRepository);

  // Process multiple related template requests
  const requests = [
    TemplateRequest.create({
      templateId: "summary/issue/critical.md",
      schemaId: "summary/issue/base.schema.md",
      variables: {
        issue_title: "Database Connection Timeout",
        status: "open",
        priority: "critical",
        description: "Application cannot connect to database intermittently",
        reporter: "monitoring-system",
      },
      options: { validateVariables: true },
    }),
    TemplateRequest.create({
      templateId: "defect/task/analysis.md",
      schemaId: "defect/task/base.schema.md",
      variables: {
        task_name: "Investigate Database Timeout",
        defect_type: "performance",
        severity: "high",
        impact: "Service disruption for 15% of users",
        root_cause: "Connection pool exhaustion during peak hours",
      },
      options: { includeMetadata: true },
    }),
  ];

  const results = [];
  for (const request of requests) {
    const result = await service.processTemplateRequest(request);
    results.push(result);
  }

  // Verify all requests processed successfully
  for (const result of results) {
    assertEquals(result.success, true);
    assertExists(result.generatedPrompt);
    assertExists(result.aggregate);
  }

  // Verify content of first result (issue summary)
  const issuePrompt = results[0].generatedPrompt!;
  assertEquals(issuePrompt.includes("Database Connection Timeout"), true);
  assertEquals(issuePrompt.includes("critical"), true);
  assertEquals(issuePrompt.includes("monitoring-system"), true);

  // Verify content of second result (defect analysis)
  const defectPrompt = results[1].generatedPrompt!;
  assertEquals(defectPrompt.includes("Investigate Database Timeout"), true);
  assertEquals(defectPrompt.includes("performance"), true);
  assertEquals(defectPrompt.includes("Connection pool exhaustion"), true);
});

Deno.test("Template Management Integration: error handling and recovery", async () => {
  logger.debug("Testing error handling and recovery", "integration:error-recovery");

  const schemaRepository = new MockSchemaRepository();
  const service = new TemplateManagementService(schemaRepository);

  // Test with invalid template ID
  const invalidTemplateRequest = TemplateRequest.create({
    templateId: "invalid/format", // Missing filename
    schemaId: "summary/issue/base.schema.md",
    variables: { content: "test" },
    options: {},
  });

  const invalidResult = await service.processTemplateRequest(invalidTemplateRequest);
  assertEquals(invalidResult.success, false);
  assertExists(invalidResult.errors);
  assertEquals(invalidResult.errors.length > 0, true);

  // Test with missing schema
  const missingSchemaRequest = TemplateRequest.create({
    templateId: "to/project/test.md",
    schemaId: "nonexistent/schema/missing.schema.md",
    variables: { content: "test" },
    options: {},
  });

  const missingSchemaResult = await service.processTemplateRequest(missingSchemaRequest);
  assertEquals(missingSchemaResult.success, false);
  assertExists(missingSchemaResult.errors);
  assertEquals(missingSchemaResult.errors.some(e => e.includes("Schema not found")), true);

  // Test with missing variables
  const missingVarsRequest = TemplateRequest.create({
    templateId: "to/project/complete.md",
    schemaId: "to/project/base.schema.md",
    variables: {
      project_name: "Test Project",
      // Missing: description, objectives, timeline
    },
    options: {},
  });

  const missingVarsResult = await service.processTemplateRequest(missingVarsRequest);
  assertEquals(missingVarsResult.success, false);
  assertExists(missingVarsResult.errors);
  assertExists(missingVarsResult.aggregate); // Aggregate created but generation failed
  assertEquals(missingVarsResult.aggregate!.getState().status, "failed");
});

Deno.test("Template Management Integration: value object composition workflow", async () => {
  logger.debug("Testing value object composition workflow", "integration:value-object-composition");

  const schemaRepository = new MockSchemaRepository();
  const service = new TemplateManagementService(schemaRepository);

  // Create complex composition with version management
  const version = TemplateVersion.create("2.1.0");
  const metadata = TemplateMetadata.create({
    title: "Advanced Project Breakdown",
    description: "Enhanced project breakdown with risk assessment",
    version: version.getValue(),
    author: "template-team",
    tags: ["project", "breakdown", "risk-assessment"],
    schemaReference: "to/project/advanced.schema.md",
  });

  // Create template request using composed value objects
  const templateRequest = TemplateRequest.create({
    templateId: "to/project/advanced.md",
    schemaId: metadata.getSchemaReference()!,
    variables: {
      project_name: "AI-Powered Analytics Platform",
      description: "Develop analytics platform using machine learning",
      objectives: "- Implement ML algorithms\n- Create dashboard\n- Ensure scalability",
      timeline: "6 months",
    },
    options: {
      includeMetadata: true,
      validateVariables: true,
      templateVersion: version.getValue(),
      templateAuthor: metadata.getAuthor(),
    },
  });

  // Verify value object composition
  const templateId = TemplateId.fromString(templateRequest.getTemplateId());
  const schemaId = SchemaId.fromString(templateRequest.getSchemaId());

  assertEquals(templateId.getDirectivePart(), "to");
  assertEquals(templateId.getLayerPart(), "project");
  assertEquals(schemaId.getDirectivePart(), "to");
  assertEquals(schemaId.getLayerPart(), "project");

  // Verify version compatibility
  const newerVersion = TemplateVersion.create("2.2.0");
  const olderVersion = TemplateVersion.create("1.9.0");
  
  assertEquals(version.isCompatibleWith(newerVersion), true);
  assertEquals(version.isCompatibleWith(olderVersion), false);

  // Process request (will fail due to missing schema, but tests composition)
  const result = await service.processTemplateRequest(templateRequest);
  
  // Schema doesn't exist, but we can verify the composition worked
  assertEquals(result.success, false);
  assertEquals(result.errors?.some(e => e.includes("Schema not found")), true);
});

Deno.test("Template Management Integration: complex variable resolution", async () => {
  logger.debug("Testing complex variable resolution", "integration:complex-variables");

  const schemaRepository = new MockSchemaRepository();
  const service = new TemplateManagementService(schemaRepository);

  // Create request with complex nested variables
  const complexRequest = TemplateRequest.create({
    templateId: "summary/issue/detailed.md",
    schemaId: "summary/issue/base.schema.md",
    variables: {
      issue_title: "Performance Degradation",
      status: "investigating",
      priority: "high",
      description: `Multi-line description with details:
- Slow response times observed
- Memory usage increased by 40%
- Database queries taking longer
- User complaints increased`,
      reporter: "ops-team",
    },
    options: {
      includeMetadata: true,
      formatOutput: true,
      processVariables: true,
    },
  });

  // Process the complex request
  const result = await service.processTemplateRequest(complexRequest);

  assertEquals(result.success, true);
  assertExists(result.generatedPrompt);

  const prompt = result.generatedPrompt!;
  
  // Verify complex content processing
  assertEquals(prompt.includes("Performance Degradation"), true);
  assertEquals(prompt.includes("investigating"), true);
  assertEquals(prompt.includes("high"), true);
  assertEquals(prompt.includes("Slow response times"), true);
  assertEquals(prompt.includes("Memory usage increased"), true);
  assertEquals(prompt.includes("ops-team"), true);

  // Verify aggregate handled complex variables correctly
  const aggregate = result.aggregate!;
  assertEquals(aggregate.getState().status, "completed");
  
  const appliedVars = aggregate.getState().lastGenerated?.getAppliedVariables();
  assertExists(appliedVars);
  assertEquals(appliedVars.has("issue_title"), true);
  assertEquals(appliedVars.has("description"), true);
  assertEquals(appliedVars.get("priority"), "high");
});

Deno.test("Template Management Integration: concurrent request processing", async () => {
  logger.debug("Testing concurrent request processing", "integration:concurrent");

  const schemaRepository = new MockSchemaRepository();
  const service = new TemplateManagementService(schemaRepository);

  // Create multiple concurrent requests
  const concurrentRequests = [
    TemplateRequest.create({
      templateId: "to/project/basic.md",
      schemaId: "to/project/base.schema.md",
      variables: {
        project_name: "Project A",
        description: "First project",
        objectives: "Objective A",
        timeline: "Timeline A",
      },
      options: {},
    }),
    TemplateRequest.create({
      templateId: "summary/issue/basic.md",
      schemaId: "summary/issue/base.schema.md",
      variables: {
        issue_title: "Issue B",
        status: "open",
        priority: "medium",
        description: "Second issue",
        reporter: "user-b",
      },
      options: {},
    }),
    TemplateRequest.create({
      templateId: "defect/task/basic.md",
      schemaId: "defect/task/base.schema.md",
      variables: {
        task_name: "Task C",
        defect_type: "bug",
        severity: "low",
        impact: "Minor",
        root_cause: "Third cause",
      },
      options: {},
    }),
  ];

  // Process all requests concurrently
  const startTime = Date.now();
  const results = await Promise.all(
    concurrentRequests.map(request => service.processTemplateRequest(request))
  );
  const endTime = Date.now();

  logger.debug("Concurrent processing completed", "integration:concurrent", {
    duration: endTime - startTime,
    requestCount: concurrentRequests.length,
  });

  // Verify all requests processed successfully
  assertEquals(results.length, 3);
  for (const result of results) {
    assertEquals(result.success, true);
    assertExists(result.generatedPrompt);
    assertExists(result.aggregate);
  }

  // Verify unique content for each result
  assertEquals(results[0].generatedPrompt!.includes("Project A"), true);
  assertEquals(results[1].generatedPrompt!.includes("Issue B"), true);
  assertEquals(results[2].generatedPrompt!.includes("Task C"), true);

  // Verify aggregates are independent
  assertEquals(results[0].aggregate!.getId() !== results[1].aggregate!.getId(), true);
  assertEquals(results[1].aggregate!.getId() !== results[2].aggregate!.getId(), true);
});