/**
 * @fileoverview Template Value Objects Integration Tests
 * Testing value objects coordination and cross-object interactions
 * 
 * Integration tests verify:
 * - Value object interactions and compositions
 * - Cross-boundary data flow between value objects
 * - Aggregate construction using multiple value objects
 * - Value object immutability and consistency
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  TemplateId,
  SchemaId,
  TemplateVersion,
  TemplateMetadata,
  SchemaContent,
  ValidationResult,
  TemplateRequest,
} from "../../../lib/domain/templates/template_value_objects.ts";
import type { DirectiveType, LayerType } from "../../../lib/types/mod.ts";

const logger = new BreakdownLogger("template-value-objects-integration");

// Mock DirectiveType and LayerType for testing
const createMockDirective = (value: string): DirectiveType => ({
  getValue: () => value,
} as DirectiveType);

const createMockLayer = (value: string): LayerType => ({
  getValue: () => value,
} as LayerType);

Deno.test("Value Objects Integration: TemplateId and SchemaId coordination", () => {
  logger.debug("Testing TemplateId and SchemaId coordination", "integration:id-coordination");
  
  const directive = createMockDirective("to");
  const layer = createMockLayer("project");
  const filename = "base.md";
  
  // Create TemplateId and SchemaId with same components
  const templateId = TemplateId.create(directive, layer, filename);
  const schemaId = SchemaId.create(directive, layer, "base.schema.md");
  
  // Verify both IDs are created from same directive/layer
  assertEquals(templateId.getDirectivePart(), schemaId.getDirectivePart());
  assertEquals(templateId.getLayerPart(), schemaId.getLayerPart());
  
  // Verify different filename extensions
  assertEquals(templateId.getFilenamePart(), "base.md");
  assertEquals(schemaId.getFilenamePart(), "base.schema.md");
  
  // Verify full paths follow same structure
  assertEquals(templateId.getValue(), "to/project/base.md");
  assertEquals(schemaId.getValue(), "to/project/base.schema.md");
});

Deno.test("Value Objects Integration: TemplateMetadata and TemplateVersion composition", () => {
  logger.debug("Testing TemplateMetadata and TemplateVersion composition", "integration:metadata-version");
  
  // Create version value object
  const version = TemplateVersion.create("2.1.0");
  assertEquals(version.getValue(), "2.1.0");
  assertEquals(version.getMajor(), 2);
  assertEquals(version.getMinor(), 1);
  assertEquals(version.getPatch(), 0);
  
  // Create metadata using version
  const metadata = TemplateMetadata.create({
    title: "Project Template",
    description: "Base template for project breakdown",
    version: version.getValue(),
    author: "system",
    tags: ["project", "breakdown"],
  });
  
  // Verify metadata incorporates version correctly
  assertEquals(metadata.getVersion(), version.getValue());
  assertEquals(metadata.getTitle(), "Project Template");
  assertEquals(metadata.getTags().includes("project"), true);
  assertEquals(metadata.getTags().includes("breakdown"), true);
  
  // Verify metadata can extract version information
  const extractedVersion = TemplateVersion.create(metadata.getVersion());
  assertEquals(extractedVersion.getMajor(), version.getMajor());
  assertEquals(extractedVersion.getMinor(), version.getMinor());
  assertEquals(extractedVersion.getPatch(), version.getPatch());
});

Deno.test("Value Objects Integration: SchemaContent and ValidationResult workflow", () => {
  logger.debug("Testing SchemaContent and ValidationResult workflow", "integration:schema-validation");
  
  // Create valid schema content
  const validSchemaData = {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1 },
      description: { type: "string" },
      priority: { type: "string", enum: ["high", "medium", "low"] },
    },
    required: ["title"],
    additionalProperties: false,
  };
  
  const schemaContent = SchemaContent.create(validSchemaData);
  assertEquals(schemaContent.getType(), "object");
  assertEquals(schemaContent.hasProperty("title"), true);
  assertEquals(schemaContent.hasProperty("nonexistent"), false);
  assertEquals(schemaContent.getRequiredProperties().includes("title"), true);
  
  // Create validation result for the schema
  const validationResult = ValidationResult.createSuccess([
    "Schema structure is valid",
    "All required properties are properly defined",
    "Type constraints are consistent",
  ]);
  
  assertEquals(validationResult.isValid(), true);
  assertEquals(validationResult.getMessages().length, 3);
  assertEquals(validationResult.getErrors().length, 0);
  
  // Test invalid schema and validation result
  const invalidSchemaData = {
    // Missing 'type' property
    properties: {
      title: "invalid", // Should be object, not string
    },
    required: ["nonexistent"], // References non-existent property
  };
  
  const invalidSchemaContent = SchemaContent.create(invalidSchemaData);
  assertEquals(invalidSchemaContent.getType(), undefined); // No type specified
  
  const invalidValidationResult = ValidationResult.createFailure([
    "Schema is missing 'type' property",
    "Required property 'nonexistent' is not defined in properties",
    "Property 'title' has invalid type definition",
  ]);
  
  assertEquals(invalidValidationResult.isValid(), false);
  assertEquals(invalidValidationResult.getErrors().length, 3);
  assertEquals(invalidValidationResult.getMessages().length, 0);
});

Deno.test("Value Objects Integration: TemplateRequest composition", () => {
  logger.debug("Testing TemplateRequest composition", "integration:template-request");
  
  // Create components for template request
  const directive = createMockDirective("to");
  const layer = createMockLayer("issue");
  const templateId = TemplateId.create(directive, layer, "conversion.md");
  const schemaId = SchemaId.create(directive, layer, "conversion.schema.md");
  
  // Create template request with all components
  const templateRequest = TemplateRequest.create({
    templateId: templateId.getValue(),
    schemaId: schemaId.getValue(),
    variables: {
      source_type: "project",
      target_type: "issue",
      context: "breakdown conversion",
    },
    options: {
      includeMetadata: true,
      validateVariables: true,
      formatOutput: true,
    },
  });
  
  // Verify template request composition
  assertEquals(templateRequest.getTemplateId(), templateId.getValue());
  assertEquals(templateRequest.getSchemaId(), schemaId.getValue());
  assertEquals(templateRequest.getVariable("source_type"), "project");
  assertEquals(templateRequest.getVariable("target_type"), "issue");
  assertEquals(templateRequest.getVariable("nonexistent"), undefined);
  
  // Verify options
  assertEquals(templateRequest.getOption("includeMetadata"), true);
  assertEquals(templateRequest.getOption("validateVariables"), true);
  assertEquals(templateRequest.getOption("formatOutput"), true);
  assertEquals(templateRequest.getOption("nonexistent"), undefined);
  
  // Verify request can extract ID components
  const extractedTemplateId = TemplateId.fromString(templateRequest.getTemplateId());
  const extractedSchemaId = SchemaId.fromString(templateRequest.getSchemaId());
  
  assertEquals(extractedTemplateId.getDirectivePart(), "to");
  assertEquals(extractedTemplateId.getLayerPart(), "issue");
  assertEquals(extractedSchemaId.getDirectivePart(), "to");
  assertEquals(extractedSchemaId.getLayerPart(), "issue");
});

Deno.test("Value Objects Integration: cross-value-object validation", () => {
  logger.debug("Testing cross-value-object validation", "integration:cross-validation");
  
  const directive = createMockDirective("summary");
  const layer = createMockLayer("task");
  
  // Create related template and schema IDs
  const templateId = TemplateId.create(directive, layer, "task_summary.md");
  const schemaId = SchemaId.create(directive, layer, "task_summary.schema.md");
  
  // Verify IDs are consistent
  assertEquals(templateId.getDirectivePart(), schemaId.getDirectivePart());
  assertEquals(templateId.getLayerPart(), schemaId.getLayerPart());
  
  // Create schema content that matches template expectations
  const schemaContent = SchemaContent.create({
    type: "object",
    properties: {
      task_title: { type: "string" },
      task_description: { type: "string" },
      completion_status: { type: "string", enum: ["pending", "in_progress", "completed"] },
    },
    required: ["task_title", "completion_status"],
  });
  
  // Create metadata that describes the template-schema relationship
  const metadata = TemplateMetadata.create({
    title: "Task Summary Template",
    description: "Generates summary for individual tasks",
    version: "1.2.0",
    author: "template-system",
    tags: ["task", "summary", "status"],
    schemaReference: schemaId.getValue(),
  });
  
  // Verify metadata references the correct schema
  assertEquals(metadata.getSchemaReference(), schemaId.getValue());
  assertEquals(metadata.getTags().includes("task"), true);
  assertEquals(metadata.getTags().includes("summary"), true);
  
  // Create template request that uses both template and schema
  const templateRequest = TemplateRequest.create({
    templateId: templateId.getValue(),
    schemaId: schemaId.getValue(),
    variables: {
      task_title: "Implement feature X",
      task_description: "Add new functionality to handle user requests",
      completion_status: "in_progress",
    },
    options: {
      validateVariables: true,
      includeMetadata: true,
    },
  });
  
  // Verify request consistency
  assertEquals(templateRequest.getTemplateId(), templateId.getValue());
  assertEquals(templateRequest.getSchemaId(), schemaId.getValue());
  assertEquals(templateRequest.hasVariable("task_title"), true);
  assertEquals(templateRequest.hasVariable("completion_status"), true);
  
  // Verify variables match schema requirements
  const requiredProps = schemaContent.getRequiredProperties();
  for (const prop of requiredProps) {
    assertEquals(
      templateRequest.hasVariable(prop),
      true,
      `Required property ${prop} should be present in variables`,
    );
  }
});

Deno.test("Value Objects Integration: immutability and consistency", () => {
  logger.debug("Testing immutability and consistency", "integration:immutability");
  
  const directive = createMockDirective("defect");
  const layer = createMockLayer("project");
  
  // Create value objects
  const originalTemplateId = TemplateId.create(directive, layer, "defect_analysis.md");
  const originalVersion = TemplateVersion.create("1.0.0");
  const originalMetadata = TemplateMetadata.create({
    title: "Defect Analysis",
    description: "Template for analyzing project defects",
    version: originalVersion.getValue(),
    author: "quality-team",
  });
  
  // Verify objects are immutable - should create new instances
  const newVersion = originalVersion.increment("minor");
  assertEquals(originalVersion.getValue(), "1.0.0");
  assertEquals(newVersion.getValue(), "1.1.0");
  
  // Update metadata with new version
  const updatedMetadata = originalMetadata.updateVersion(newVersion.getValue());
  assertEquals(originalMetadata.getVersion(), "1.0.0");
  assertEquals(updatedMetadata.getVersion(), "1.1.0");
  assertEquals(originalMetadata.getTitle(), updatedMetadata.getTitle()); // Other fields preserved
  
  // Verify ID immutability
  const idString = originalTemplateId.getValue();
  const recreatedId = TemplateId.fromString(idString);
  assertEquals(originalTemplateId.equals(recreatedId), true);
  
  // Verify different instances with same values are equal
  const anotherTemplateId = TemplateId.create(directive, layer, "defect_analysis.md");
  assertEquals(originalTemplateId.equals(anotherTemplateId), true);
});

Deno.test("Value Objects Integration: value object chaining and composition", () => {
  logger.debug("Testing value object chaining and composition", "integration:chaining");
  
  // Create a complex workflow using multiple value objects
  const directive = createMockDirective("to");
  const layer = createMockLayer("project");
  
  // Step 1: Create IDs
  const templateId = TemplateId.create(directive, layer, "project_breakdown.md");
  const schemaId = SchemaId.create(directive, layer, "project_breakdown.schema.md");
  
  // Step 2: Create version and metadata
  const version = TemplateVersion.create("2.0.0");
  const metadata = TemplateMetadata.create({
    title: "Project Breakdown Template",
    description: "Comprehensive project breakdown with validation",
    version: version.getValue(),
    author: "breakdown-team",
    tags: ["project", "breakdown", "comprehensive"],
    schemaReference: schemaId.getValue(),
  });
  
  // Step 3: Create schema content
  const schemaContent = SchemaContent.create({
    type: "object",
    properties: {
      project_name: { type: "string", minLength: 1 },
      project_description: { type: "string" },
      objectives: { type: "array", items: { type: "string" } },
      timeline: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      stakeholders: { type: "array", items: { type: "string" } },
    },
    required: ["project_name", "project_description", "objectives"],
  });
  
  // Step 4: Create template request that ties everything together
  const templateRequest = TemplateRequest.create({
    templateId: templateId.getValue(),
    schemaId: schemaId.getValue(),
    variables: {
      project_name: "New Feature Development",
      project_description: "Develop new user-facing features",
      objectives: ["Improve user experience", "Increase engagement", "Add functionality"],
      timeline: "2024-12-31",
      stakeholders: ["product-team", "engineering-team", "design-team"],
    },
    options: {
      includeMetadata: true,
      validateVariables: true,
      formatOutput: true,
      generateSummary: true,
    },
  });
  
  // Verify the complete composition
  assertEquals(templateRequest.getTemplateId(), templateId.getValue());
  assertEquals(templateRequest.getSchemaId(), schemaId.getValue());
  
  // Verify metadata consistency
  assertEquals(metadata.getSchemaReference(), schemaId.getValue());
  assertEquals(metadata.getVersion(), version.getValue());
  
  // Verify schema and variables alignment
  const requiredProps = schemaContent.getRequiredProperties();
  for (const prop of requiredProps) {
    assertEquals(
      templateRequest.hasVariable(prop),
      true,
      `Required property ${prop} should be present`,
    );
  }
  
  // Verify version semantics
  assertEquals(version.getMajor(), 2);
  assertEquals(version.getMinor(), 0);
  assertEquals(version.getPatch(), 0);
  assertEquals(version.isCompatibleWith(TemplateVersion.create("2.1.0")), true);
  assertEquals(version.isCompatibleWith(TemplateVersion.create("3.0.0")), false);
  
  // Create validation result for the complete workflow
  const validationResult = ValidationResult.createSuccess([
    "Template ID is valid and well-formed",
    "Schema ID matches template naming convention",
    "All required variables are provided",
    "Variable types match schema expectations",
    "Metadata is consistent with template and schema",
    "Version is valid semantic version",
  ]);
  
  assertEquals(validationResult.isValid(), true);
  assertEquals(validationResult.getMessages().length, 6);
  assertEquals(validationResult.getSummary().includes("success"), true);
});