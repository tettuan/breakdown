/**
 * @fileoverview TwoParams Domain Aggregate Tests
 *
 * Comprehensive test suite for the TwoParams aggregate root that integrates
 * DirectiveType and LayerType value objects. Tests cover Smart Constructor
 * validation, business rule enforcement, and domain operations.
 *
 * @module domain/core/two_params_aggregate.test
 */

import { assertEquals } from "@std/assert";
import { TwoParams, type TwoParamsError } from "./two_params_aggregate.ts";
import { DirectiveType } from "./value_objects/directive_type.ts";
import { LayerType } from "./value_objects/layer_type.ts";
import { ConfigProfileName } from "../../types/config_profile_name.ts";

Deno.test("TwoParams - Smart Constructor Tests", async (t) => {
  await t.step("should create valid TwoParams with compatible directive and layer", () => {
    const result = TwoParams.create("to", "project");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "to");
      assertEquals(result.data.layer.value, "project");
    }
  });

  await t.step("should reject invalid directive value", () => {
    const result = TwoParams.create("INVALID_DIRECTIVE", "project");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "DirectiveCreationFailed");
      if (result.error.kind === "DirectiveCreationFailed") {
        assertEquals(result.error.directiveValue, "INVALID_DIRECTIVE");
      }
    }
  });

  await t.step("should reject invalid layer value", () => {
    const result = TwoParams.create("to", "INVALID_LAYER");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "LayerCreationFailed");
      if (result.error.kind === "LayerCreationFailed") {
        assertEquals(result.error.layerValue, "INVALID_LAYER");
      }
    }
  });

  await t.step("should reject empty directive", () => {
    const result = TwoParams.create("", "project");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "DirectiveCreationFailed");
    }
  });

  await t.step("should reject empty layer", () => {
    const result = TwoParams.create("to", "");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "LayerCreationFailed");
    }
  });

  await t.step("should validate compatible combinations", () => {
    const validCombinations = [
      ["to", "project"],
      ["to", "issue"],
      ["to", "task"],
      ["summary", "project"],
      ["summary", "issue"],
    ];

    for (const [directive, layer] of validCombinations) {
      const result = TwoParams.create(directive, layer);
      assertEquals(result.ok, true, `Combination ${directive}/${layer} should be valid`);
    }
  });
});

Deno.test("TwoParams - fromValueObjects Constructor", async (t) => {
  await t.step("should create TwoParams from existing value objects", () => {
    const defaultProfile = ConfigProfileName.createDefault();
    const directiveResult = DirectiveType.create("summary", defaultProfile);
    const layerResult = LayerType.create("issue");
    
    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test value objects");
    }

    const result = TwoParams.fromValueObjects(
      directiveResult.data,
      layerResult.data,
    );
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "summary");
      assertEquals(result.data.layer.value, "issue");
    }
  });

  await t.step("should validate combination rules with value objects", () => {
    const defaultProfile = ConfigProfileName.createDefault();
    const directiveResult = DirectiveType.create("to", defaultProfile);
    const layerResult = LayerType.create("project");
    
    if (!directiveResult.ok || !layerResult.ok) {
      throw new Error("Failed to create test value objects");
    }

    const result = TwoParams.fromValueObjects(
      directiveResult.data,
      layerResult.data,
    );
    
    assertEquals(result.ok, true);
  });
});

Deno.test("TwoParams - Path Resolution Operations", async (t) => {
  const twoParamsResult = TwoParams.create("to", "project");
  if (!twoParamsResult.ok) {
    throw new Error("Failed to create test TwoParams");
  }
  const twoParams = twoParamsResult.data;

  await t.step("should resolve prompt template path", () => {
    const result = twoParams.resolvePromptPath();
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "prompts/to/project/f_project.md");
    }
  });

  await t.step("should resolve prompt path with custom base directory", () => {
    const result = twoParams.resolvePromptPath("custom/prompts");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "custom/prompts/to/project/f_project.md");
    }
  });

  await t.step("should resolve prompt path with adaptation", () => {
    const result = twoParams.resolvePromptPath("prompts", "issue", "strict");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "prompts/to/project/f_project_strict.md");
    }
  });

  await t.step("should resolve schema file path", () => {
    const result = twoParams.resolveSchemaPath();
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "schema/to/project/base.schema.json");
    }
  });

  await t.step("should resolve schema path with custom base directory", () => {
    const result = twoParams.resolveSchemaPath("custom/schema");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "custom/schema/to/project/base.schema.json");
    }
  });

  await t.step("should resolve output directory path", () => {
    const result = twoParams.resolveOutputDirectory();
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "output/to/project");
    }
  });

  await t.step("should resolve output directory with custom base", () => {
    const result = twoParams.resolveOutputDirectory("build/output");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "build/output/to/project");
    }
  });
});

Deno.test("TwoParams - Domain Operations", async (t) => {
  const twoParams1Result = TwoParams.create("to", "project");
  const twoParams2Result = TwoParams.create("to", "project");
  const twoParams3Result = TwoParams.create("summary", "issue");
  
  if (!twoParams1Result.ok || !twoParams2Result.ok || !twoParams3Result.ok) {
    throw new Error("Failed to create test TwoParams");
  }
  
  const twoParams1 = twoParams1Result.data;
  const twoParams2 = twoParams2Result.data;
  const twoParams3 = twoParams3Result.data;

  await t.step("should check equality correctly", () => {
    assertEquals(twoParams1.equals(twoParams2), true);
    assertEquals(twoParams1.equals(twoParams3), false);
  });

  await t.step("should generate command structure", () => {
    const command = twoParams1.toCommand();
    
    assertEquals(command.directive, "to");
    assertEquals(command.layer, "project");
    assertEquals(typeof command.timestamp, "object");
    assertEquals(command.timestamp instanceof Date, true);
  });

  await t.step("should provide string representation", () => {
    const str = twoParams1.toString();
    assertEquals(str, "TwoParams(to/project)");
  });

  await t.step("should provide debug string representation", () => {
    const debugStr = twoParams1.toDebugString();
    assertEquals(debugStr.includes("directive="), true);
    assertEquals(debugStr.includes("layer="), true);
    assertEquals(debugStr.includes("to"), true);
    assertEquals(debugStr.includes("project"), true);
  });
});

Deno.test("TwoParams - Edge Cases and Error Handling", async (t) => {
  await t.step("should handle whitespace in inputs", () => {
    const result = TwoParams.create("  to  ", "  project  ");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive.value, "to");
      assertEquals(result.data.layer.value, "project");
    }
  });

  await t.step("should handle boundary length values", () => {
    // Test with valid directive values and maximum length layers
    // DirectiveType must be valid for default profile (to, summary, defect)
    // LayerType can be up to 30 characters
    const validDirective = "to"; // Valid for default profile
    const maxLayer = "a".repeat(30); // Maximum length for LayerType
    
    const result = TwoParams.create(validDirective, maxLayer);
    assertEquals(result.ok, true);
  });

  await t.step("should reject too long directive", () => {
    const tooLongDirective = "a".repeat(21); // Exceeds DirectiveType max length
    const result = TwoParams.create(tooLongDirective, "project");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "DirectiveCreationFailed");
    }
  });

  await t.step("should reject too long layer", () => {
    const tooLongLayer = "a".repeat(31); // Exceeds LayerType max length
    const result = TwoParams.create("to", tooLongLayer);
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "LayerCreationFailed");
    }
  });
});

Deno.test("TwoParamsCollection - Collection Operations", async (t) => {
  // Create test TwoParams instances
  const combinations = [
    ["to", "project"],
    ["to", "issue"],
    ["summary", "project"],
    ["summary", "issue"],
  ];
  
  const twoParamsInstances: TwoParams[] = [];
  for (const [directive, layer] of combinations) {
    const result = TwoParams.create(directive, layer);
    if (result.ok) {
      twoParamsInstances.push(result.data);
    }
  }
  
  const { TwoParamsCollection } = await import("./two_params_aggregate.ts");
  const collection = new TwoParamsCollection(twoParamsInstances);

  await t.step("should filter by directive", () => {
    const filtered = collection.filterByDirective("to");
    assertEquals(filtered.size, 2);
    assertEquals(filtered.toArray().every(item => item.directive.value === "to"), true);
  });

  await t.step("should filter by layer", () => {
    const filtered = collection.filterByLayer("project");
    assertEquals(filtered.size, 2);
    assertEquals(filtered.toArray().every(item => item.layer.value === "project"), true);
  });

  await t.step("should get unique directives", () => {
    const uniqueDirectives = collection.getUniqueDirectives();
    assertEquals(uniqueDirectives.length, 2);
    assertEquals(uniqueDirectives.includes("to"), true);
    assertEquals(uniqueDirectives.includes("summary"), true);
  });

  await t.step("should get unique layers", () => {
    const uniqueLayers = collection.getUniqueLayers();
    assertEquals(uniqueLayers.length, 2);
    assertEquals(uniqueLayers.includes("project"), true);
    assertEquals(uniqueLayers.includes("issue"), true);
  });

  await t.step("should check if contains combination", () => {
    assertEquals(collection.contains("to", "project"), true);
    assertEquals(collection.contains("defect", "bugs"), false);
  });

  await t.step("should return correct size", () => {
    assertEquals(collection.size, 4);
  });
});

Deno.test("TwoParams - Error Type Guards", async (t) => {
  await t.step("should properly type guard DirectiveCreationFailed", () => {
    const result = TwoParams.create("INVALID", "project");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      const error = result.error;
      if (error.kind === "DirectiveCreationFailed") {
        // Type guard works - can access DirectiveCreationFailed specific properties
        assertEquals(error.directiveValue, "INVALID");
        assertEquals(typeof error.underlyingError, "object");
      }
    }
  });

  await t.step("should properly type guard LayerCreationFailed", () => {
    const result = TwoParams.create("to", "INVALID");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      const error = result.error;
      if (error.kind === "LayerCreationFailed") {
        // Type guard works - can access LayerCreationFailed specific properties
        assertEquals(error.layerValue, "INVALID");
        assertEquals(typeof error.underlyingError, "object");
      }
    }
  });
});

Deno.test("TwoParams - Error Formatting", async (t) => {
  await t.step("should format DirectiveCreationFailed error", async () => {
    const { formatTwoParamsError } = await import("./two_params_aggregate.ts");
    
    const result = TwoParams.create("INVALID", "project");
    if (!result.ok && result.error.kind === "DirectiveCreationFailed") {
      const formatted = formatTwoParamsError(result.error);
      assertEquals(formatted.includes("Failed to create DirectiveType"), true);
    }
  });

  await t.step("should format LayerCreationFailed error", async () => {
    const { formatTwoParamsError } = await import("./two_params_aggregate.ts");
    
    const result = TwoParams.create("to", "INVALID");
    if (!result.ok && result.error.kind === "LayerCreationFailed") {
      const formatted = formatTwoParamsError(result.error);
      assertEquals(formatted.includes("Failed to create LayerType"), true);
    }
  });
});