/**
 * @fileoverview Integration test for TwoParams type implementation
 * 
 * Tests the integration between lib/types/two_params.ts and domain aggregate.
 * Verifies Smart Constructor pattern and createOrError functionality.
 * 
 * @module types/two_params_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { TwoParamsType, createTwoParamsType } from "./two_params.ts";
import { createTwoParamsResult } from "./two_params_result_extension.ts";
import { ConfigProfileName } from "./config_profile_name.ts";

Deno.test("TwoParamsType - Smart Constructor Integration", async (t) => {
  await t.step("should create TwoParamsType from valid TwoParams_Result", () => {
    // Arrange
    const result = createTwoParamsResult("to", "task");
    
    // Act
    const twoParamsType = TwoParamsType.createOrError(result);
    
    // Assert
    assertEquals(twoParamsType.ok, true);
    if (twoParamsType.ok) {
      assertEquals(twoParamsType.data.directive, "to");
      assertEquals(twoParamsType.data.layer, "task");
      assertEquals(twoParamsType.data.params, ["to", "task"]);
    }
  });

  await t.step("should reject invalid TwoParams_Result", () => {
    // Arrange
    const invalidResult = { type: "invalid" };
    
    // Act
    const twoParamsType = TwoParamsType.createOrError(invalidResult);
    
    // Assert
    assertEquals(twoParamsType.ok, false);
    if (!twoParamsType.ok) {
      assertEquals(twoParamsType.error.kind, "InvalidInput");
    }
  });

  await t.step("should reject null or undefined input", () => {
    // Test null
    const nullResult = TwoParamsType.createOrError(null);
    assertEquals(nullResult.ok, false);
    
    // Test undefined
    const undefinedResult = TwoParamsType.createOrError(undefined);
    assertEquals(undefinedResult.ok, false);
  });

  await t.step("should validate params consistency", () => {
    // Arrange - inconsistent params
    const inconsistentResult = {
      type: "two",
    directiveType: "to",
      directiveType: "to",
      layerType: "task", 
      params: ["summary", "issue"], // Different from directiveType/layerType
      options: {},
    };
    
    // Act
    const twoParamsType = TwoParamsType.createOrError(inconsistentResult);
    
    // Assert
    assertEquals(twoParamsType.ok, false);
    if (!twoParamsType.ok) {
      assertEquals(twoParamsType.error.kind, "ValidationFailed");
    }
  });
});

Deno.test("TwoParamsType - Domain Integration", async (t) => {
  await t.step("should integrate with domain aggregate", async () => {
    // Arrange
    const result = createTwoParamsResult("to", "task");
    const twoParamsType = TwoParamsType.createOrError(result);
    assertEquals(twoParamsType.ok, true);
    
    if (twoParamsType.ok) {
      const profile = ConfigProfileName.createDefault();
      
      // Act
      const aggregateResult = await twoParamsType.data.toAggregate(profile);
      
      // Assert
      assertEquals(aggregateResult.ok, true);
      if (aggregateResult.ok) {
        assertEquals(aggregateResult.data.directive.value, "to");
        assertEquals(aggregateResult.data.layer.value, "task");
      }
    }
  });
});

Deno.test("TwoParamsType - Helper Functions", async (t) => {
  await t.step("should create TwoParamsType using helper function", async () => {
    // Act
    const result = await createTwoParamsType("to", "task");
    
    // Assert
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive, "to");
      assertEquals(result.data.layer, "task");
    }
  });

  await t.step("should handle options in helper function", async () => {
    // Arrange
    const options = { custom: "value" };
    
    // Act
    const result = await createTwoParamsType("summary", "issue", options);
    
    // Assert
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.directive, "summary");
      assertEquals(result.data.layer, "issue");
      assertEquals(result.data.options.custom, "value");
    }
  });
});

Deno.test("TwoParamsType - Type Operations", async (t) => {
  await t.step("should provide correct string representations", () => {
    // Arrange
    const result = createTwoParamsResult("to", "task");
    const twoParamsType = TwoParamsType.createOrError(result);
    assertEquals(twoParamsType.ok, true);
    
    if (twoParamsType.ok) {
      // Act & Assert
      assertEquals(twoParamsType.data.toString(), "to task");
      assertEquals(
        twoParamsType.data.toDebugString(),
        'TwoParamsType(directive="to", layer="task", params=[to, task])'
      );
    }
  });

  await t.step("should support equality comparison", () => {
    // Arrange
    const result1 = createTwoParamsResult("to", "task");
    const result2 = createTwoParamsResult("to", "task");
    const result3 = createTwoParamsResult("summary", "issue");
    
    const type1 = TwoParamsType.createOrError(result1);
    const type2 = TwoParamsType.createOrError(result2);
    const type3 = TwoParamsType.createOrError(result3);
    
    assertEquals(type1.ok && type2.ok && type3.ok, true);
    
    if (type1.ok && type2.ok && type3.ok) {
      // Act & Assert
      assertEquals(type1.data.equals(type2.data), true);
      assertEquals(type1.data.equals(type3.data), false);
    }
  });

  await t.step("should validate directive and layer", () => {
    // Arrange
    const result = createTwoParamsResult("to", "task");
    const twoParamsType = TwoParamsType.createOrError(result);
    assertEquals(twoParamsType.ok, true);
    
    if (twoParamsType.ok) {
      // Act
      const validationResult = twoParamsType.data.validate();
      
      // Assert
      assertEquals(validationResult.ok, true);
    }
  });

  await t.step("should reject empty directive in validation", () => {
    // Arrange - manually create instance with empty directive (bypassing createOrError)
    const validResult = createTwoParamsResult("", "task");
    
    // Act
    const twoParamsType = TwoParamsType.createOrError(validResult);
    
    // Assert - should fail at createOrError level
    assertEquals(twoParamsType.ok, false);
  });

  await t.step("should provide JSON serialization", () => {
    // Arrange
    const result = createTwoParamsResult("to", "task", { custom: "value" });
    const twoParamsType = TwoParamsType.createOrError(result);
    assertEquals(twoParamsType.ok, true);
    
    if (twoParamsType.ok) {
      // Act
      const json = twoParamsType.data.toJSON();
      
      // Assert
      assertExists(json.directive);
      assertExists(json.layer);
      assertExists(json.params);
      assertExists(json.options);
      assertEquals(json.directive, "to");
      assertEquals(json.layer, "task");
      assertEquals(json.params, ["to", "task"]);
      assertEquals((json.options as Record<string, unknown>).custom, "value");
    }
  });
});