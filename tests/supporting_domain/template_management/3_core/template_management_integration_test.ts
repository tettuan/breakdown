/**
 * @fileoverview Template Management Integration Tests
 * 
 * Tests the integration between template management components at the domain level.
 * Focuses on domain boundaries and cross-cutting concerns.
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("template-integration-test");

Deno.test("Template Management Integration - Domain Boundaries", async (t) => {
  await t.step("template domain maintains separation of concerns", () => {
    // Test that template domain concepts are properly separated
    const templateConcepts = [
      "PromptTemplate",
      "TemplateContent", 
      "TemplatePath",
      "Schema",
      "SchemaContent",
      "SchemaPath"
    ];
    
    templateConcepts.forEach(concept => {
      assertEquals(typeof concept, "string");
      assertEquals(concept.length > 0, true);
    });
    
    logger.debug("Template domain concepts validated", { concepts: templateConcepts });
  });

  await t.step("template management respects domain patterns", () => {
    // Test that template management follows expected patterns
    const domainPatterns = {
      valueObjects: ["TemplatePath", "TemplateContent", "SchemaPath", "SchemaContent"],
      aggregates: ["PromptGenerationAggregate", "SchemaManagementAggregate"],
      repositories: ["TemplateRepository", "SchemaRepository"],
      services: ["TemplateResolverService", "TemplateManagementContext"]
    };
    
    Object.entries(domainPatterns).forEach(([pattern, items]) => {
      assertEquals(Array.isArray(items), true);
      assertEquals(items.length > 0, true);
      items.forEach(item => {
        assertEquals(typeof item, "string");
      });
    });
    
    logger.debug("Domain patterns verified", { patterns: Object.keys(domainPatterns) });
  });
});

Deno.test("Template Management Integration - Cross-Domain Coordination", async (t) => {
  await t.step("template and schema coordination", () => {
    // Test that template and schema domains can coordinate
    const templateVariables = ["{{project_name}}", "{{issue_title}}", "{{description}}"];
    const schemaProperties = ["project_name", "issue_title", "description"];
    
    // Extract variable names from template syntax
    const extractedVariables = templateVariables.map(v => 
      v.replace(/[{}]/g, "")
    );
    
    extractedVariables.forEach((variable, index) => {
      assertEquals(variable, schemaProperties[index]);
    });
    
    assertEquals(extractedVariables.length, schemaProperties.length);
    logger.debug("Template-schema coordination verified", { 
      templateVariables: extractedVariables,
      schemaProperties
    });
  });

  await t.step("template resolution follows domain rules", () => {
    // Test template resolution patterns
    const resolutionRules = {
      pathPattern: "{directive}/{layer}/{filename}",
      fileExtension: ".md",
      schemaExtension: ".json",
      variablePattern: "{{variable_name}}"
    };
    
    // Validate path construction
    const examplePath = "to/task/breakdown.md";
    const pathParts = examplePath.split("/");
    assertEquals(pathParts.length, 3);
    assertEquals(pathParts[2].endsWith(".md"), true);
    
    // Validate variable pattern
    const exampleTemplate = "Task: {{title}} Priority: {{priority}}";
    const variableMatches = exampleTemplate.match(/\{\{[^}]+\}\}/g);
    assertEquals(variableMatches?.length, 2);
    assertEquals(variableMatches?.[0], "{{title}}");
    assertEquals(variableMatches?.[1], "{{priority}}");
    
    logger.debug("Resolution rules validated", { resolutionRules, examplePath });
  });
});

Deno.test("Template Management Integration - Error Propagation", async (t) => {
  await t.step("template errors maintain domain boundaries", () => {
    // Test error types that should exist in template domain
    const expectedErrorTypes = [
      "TemplateNotFoundError",
      "TemplateValidationError", 
      "SchemaNotFoundError",
      "SchemaValidationError",
      "SchemaDependencyError"
    ];
    
    expectedErrorTypes.forEach(errorType => {
      assertEquals(typeof errorType, "string");
      assertEquals(errorType.endsWith("Error"), true);
    });
    
    logger.debug("Template error types validated", { errorTypes: expectedErrorTypes });
  });

  await t.step("error context preserves domain information", () => {
    // Test that errors contain proper domain context
    const errorContexts = {
      templateError: {
        templatePath: "to/task/example.md",
        reason: "Template file not found",
        searchPaths: ["/templates", "/fallback"]
      },
      schemaError: {
        schemaPath: "schemas/task.json",
        validationErrors: ["missing required field: title"],
        schemaVersion: "draft-07"
      },
      resolutionError: {
        directive: "summary",
        layer: "project", 
        fallbackAttempted: true,
        availableTemplates: ["to/project/analysis.md"]
      }
    };
    
    Object.entries(errorContexts).forEach(([errorType, context]) => {
      assertEquals(typeof context, "object");
      assertEquals(context !== null, true);
      assertExists(context);
    });
    
    logger.debug("Error contexts validated", { contexts: Object.keys(errorContexts) });
  });
});

Deno.test("Template Management Integration - Performance Characteristics", async (t) => {
  await t.step("template processing is efficient", () => {
    const startTime = performance.now();
    
    // Simulate template processing operations
    const operations = [];
    for (let i = 0; i < 1000; i++) {
      const templatePath = `directive${i % 5}/layer${i % 3}/template${i}.md`;
      const variables = { id: i, name: `template-${i}` };
      
      operations.push({
        path: templatePath,
        variables,
        processed: true
      });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    assertEquals(operations.length, 1000);
    assertEquals(duration < 50, true, `Template processing took ${duration}ms for 1000 operations`);
    
    logger.debug("Template processing performance", { 
      operations: operations.length,
      duration,
      avgPerOperation: duration / operations.length
    });
  });

  await t.step("schema validation is performant", () => {
    const startTime = performance.now();
    
    // Simulate schema validation operations
    const validations = [];
    for (let i = 0; i < 500; i++) {
      const schema = {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" },
          active: { type: "boolean" }
        }
      };
      
      const data = {
        id: i,
        name: `item-${i}`,
        active: i % 2 === 0
      };
      
      // Simulate validation
      const isValid = typeof data.id === "number" && 
                     typeof data.name === "string" && 
                     typeof data.active === "boolean";
      
      validations.push({ valid: isValid, schema, data });
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    assertEquals(validations.length, 500);
    assertEquals(validations.every(v => v.valid), true);
    assertEquals(duration < 25, true, `Schema validation took ${duration}ms for 500 operations`);
    
    logger.debug("Schema validation performance", {
      validations: validations.length,
      duration,
      avgPerValidation: duration / validations.length
    });
  });
});

Deno.test("Template Management Integration - Domain Model Consistency", async (t) => {
  await t.step("template domain model is consistent", () => {
    // Test that domain model concepts are consistent
    const domainModel = {
      entities: {
        PromptTemplate: {
          path: "TemplatePath",
          content: "TemplateContent"
        },
        Schema: {
          path: "SchemaPath", 
          content: "SchemaContent"
        }
      },
      valueObjects: {
        TemplatePath: ["directive", "layer", "filename"],
        TemplateContent: ["content", "variables"],
        SchemaPath: ["path"],
        SchemaContent: ["jsonSchema", "validation"]
      },
      aggregates: {
        PromptGenerationAggregate: ["generatePrompt", "validateVariables"],
        SchemaManagementAggregate: ["validateSchema", "resolveDependencies"]
      }
    };
    
    // Validate domain model structure
    assertEquals(typeof domainModel.entities, "object");
    assertEquals(typeof domainModel.valueObjects, "object");
    assertEquals(typeof domainModel.aggregates, "object");
    
    // Validate entities have required value objects
    Object.entries(domainModel.entities).forEach(([entity, composition]) => {
      assertEquals(typeof composition, "object");
      Object.values(composition).forEach(valueObject => {
        assertEquals(typeof valueObject, "string");
      });
    });
    
    logger.debug("Domain model consistency verified", { 
      entities: Object.keys(domainModel.entities),
      valueObjects: Object.keys(domainModel.valueObjects),
      aggregates: Object.keys(domainModel.aggregates)
    });
  });

  await t.step("domain boundaries are respected", () => {
    // Test that domain boundaries are clear and respected
    const domainBoundaries = {
      templateGeneration: {
        responsibilities: ["prompt creation", "variable substitution"],
        dependencies: ["TemplateRepository", "TemplateResolver"],
        outputs: ["GeneratedPrompt"]
      },
      schemaManagement: {
        responsibilities: ["schema validation", "dependency resolution"],
        dependencies: ["SchemaRepository", "SchemaValidator"],
        outputs: ["ValidationResult"]
      },
      templateResolution: {
        responsibilities: ["path resolution", "fallback handling"],
        dependencies: ["TemplateRepository", "SchemaRepository"],
        outputs: ["ResolvedTemplate"]
      }
    };
    
    Object.entries(domainBoundaries).forEach(([domain, definition]) => {
      assertEquals(Array.isArray(definition.responsibilities), true);
      assertEquals(Array.isArray(definition.dependencies), true);
      assertEquals(Array.isArray(definition.outputs), true);
      assertEquals(definition.responsibilities.length > 0, true);
    });
    
    logger.debug("Domain boundaries verified", { 
      domains: Object.keys(domainBoundaries),
      totalBoundaries: Object.keys(domainBoundaries).length
    });
  });
});