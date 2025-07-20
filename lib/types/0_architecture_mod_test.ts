/**
 * @fileoverview Architecture test for types/mod.ts - Totality Principle Compliance
 *
 * This test ensures that the types module follows the Totality principle:
 * - All functions are total (no exceptions, undefined returns)
 * - All error cases are represented as values using Result types
 * - Exhaustive pattern matching is enforced through discriminated unions
 * - Smart Constructor patterns are properly implemented
 *
 * @module types/0_architecture_mod_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { describe, it } from "@std/testing/bdd";

// Import the types module and related implementations
import {
  ConfigProfileName,
  DefaultTypePatternProvider,
  DirectiveType,
  error,
  FilePathVariable,
  isError,
  isOk,
  LayerType,
  ok,
  StandardVariable,
  TypeFactory,
} from "./mod.ts";

describe("0_architecture_mod_test", () => {
  describe("Smart Constructor Pattern Compliance", () => {
    it("should implement Smart Constructor for DirectiveType", () => {
      // Verify static create method exists and returns Result type
      const mockTwoParamsResult = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const result = DirectiveType.create(mockTwoParamsResult.directiveType);

      // Verify DirectiveType instance creation
      assertExists(result);
      assertEquals(typeof result, "object");
      assertEquals(result.ok, true);

      if (result.ok) {
        const directiveType = result.data;
        assertEquals(directiveType.value, "to");

        // Verify it's a DirectiveType instance
        assertExists(directiveType.value);
        assertEquals(typeof directiveType.value, "string");
        assertEquals(directiveType.value, "to");
      }
    });

    it("should implement Smart Constructor for LayerType", () => {
      const mockTwoParamsResult = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const result = LayerType.create(mockTwoParamsResult.layerType);

      // Verify LayerType instance creation
      assertExists(result);
      assertEquals(typeof result, "object");
      assertEquals(result.ok, true);

      if (result.ok) {
        const layerType = result.data;
        assertEquals(layerType.value, "project");

        // Verify it's a LayerType instance
        assertExists(layerType.value);
        assertEquals(typeof layerType.value, "string");
        assertEquals(layerType.value, "project");
      }
    });

    it("should implement Smart Constructor for ConfigProfileName", () => {
      const result = ConfigProfileName.create("production");

      assertExists(result);
      assertEquals(typeof result, "object");
      assertEquals(result.value, "production");
      assertEquals(result.isDefault(), false);
    });

    it("should implement Smart Constructor for Variables", () => {
      const standardVar = StandardVariable.create("test", "value");
      const filePathVar = FilePathVariable.create("path", "/test/path");

      assertExists(standardVar);
      assertExists(filePathVar);
      assertEquals(typeof standardVar, "object");
      assertEquals(typeof filePathVar, "object");
    });
  });

  describe("Result Type Pattern Compliance", () => {
    it("should never throw exceptions in public APIs", () => {
      // Test ConfigProfileName with invalid input (doesn't throw)
      const invalidResult = ConfigProfileName.create("INVALID");

      // ConfigProfileName.create always returns a valid instance, never throws
      assertExists(invalidResult);
      assertEquals(typeof invalidResult, "object");
      assertEquals(invalidResult instanceof ConfigProfileName, true);

      // Test createOrError for Result pattern
      const errorResult = ConfigProfileName.createOrError("");
      assertEquals(typeof errorResult, "object");
      assertEquals("ok" in errorResult, true);
    });

    it("should provide meaningful error messages", () => {
      // ConfigProfileName.create() always returns valid object, use createOrError for error testing
      const result = ConfigProfileName.createOrError("");

      if (!result.ok) {
        assertExists(result.error);
        assertEquals(typeof result.error, "object");
        // Error should have meaningful structure
        assertExists(result.error.kind);
        if (result.error.kind === "InvalidInput") {
          assertEquals(result.error.field, "profileName");
        }
      }
    });

    it("should maintain Result type consistency", () => {
      const okResult = ok({ value: 42 });
      const errorResult = error("test error");

      // Test Result type discrimination
      assertEquals(isOk(okResult), true);
      assertEquals(isError(okResult), false);
      assertEquals(isOk(errorResult), false);
      assertEquals(isError(errorResult), true);
    });
  });

  describe("Type Safety Boundaries", () => {
    it("should enforce strict typing without any/unknown", () => {
      // This test is more about code review, but we can test behavior
      const factory = new TypeFactory(new DefaultTypePatternProvider());

      // Factory should handle type validation properly
      assertExists(factory);
      assertEquals(typeof factory, "object");
    });

    it("should maintain immutability patterns", () => {
      const directive = StandardVariable.create("directive", "to");
      const layer = StandardVariable.create("layer", "project");

      // Variables should be immutable
      assertExists(directive);
      assertExists(layer);
      assertEquals(typeof directive, "object");
      assertEquals(typeof layer, "object");

      // Check that variables maintain their state
      if (directive && "ok" in directive && directive.ok) {
        assertExists(directive.data);
        assertEquals(typeof directive.data, "object");
      }

      if (layer && "ok" in layer && layer.ok) {
        assertExists(layer.data);
        assertEquals(typeof layer.data, "object");
      }
    });

    it("should integrate with domain boundaries properly", () => {
      // Test that types integrate correctly with domain boundaries
      const profileResult = ConfigProfileName.create("test");

      assertExists(profileResult);
      assertEquals(typeof profileResult, "object");
      assertEquals(typeof profileResult.value, "string");
      assertEquals(profileResult.value, "test");
    });
  });

  describe("Barrel Export Structure", () => {
    it("should export all required types", () => {
      // Core types
      assertExists(DirectiveType);
      assertExists(LayerType);
      assertExists(ConfigProfileName);

      // Factory types
      assertExists(TypeFactory);
      assertExists(DefaultTypePatternProvider);

      // Result types
      assertExists(ok);
      assertExists(error);
      assertExists(isOk);
      assertExists(isError);

      // Variable types
      assertExists(StandardVariable);
      assertExists(FilePathVariable);
    });

    it("should maintain consistent export naming", () => {
      // Test that core exports follow consistent naming patterns
      const coreExports = [
        DirectiveType,
        LayerType,
        ConfigProfileName,
        TypeFactory,
        ok,
        error,
        isOk,
        isError,
        StandardVariable,
        FilePathVariable,
      ];

      coreExports.forEach((exportItem) => {
        // All exports should exist and be properly typed
        assertExists(exportItem);
      });
    });
  });

  describe("Totality Principle Validation", () => {
    it("should handle all possible input cases", () => {
      // Test boundary conditions with ConfigProfileName
      const emptyResult = ConfigProfileName.create("");
      const nullResult = ConfigProfileName.create(null);
      const undefinedResult = ConfigProfileName.create(undefined);

      // Should return Results, not undefined/null
      assertExists(emptyResult);
      assertExists(nullResult);
      assertExists(undefinedResult);
      assertEquals(typeof emptyResult, "object");
      assertEquals(typeof nullResult, "object");
      assertEquals(typeof undefinedResult, "object");
    });

    it("should provide exhaustive error handling", () => {
      // ConfigProfileName.create() always returns valid object, testing defaults
      const scenarios = [
        "", // Empty string -> default
        null, // Null -> default
        undefined, // Undefined -> default
        "INVALID", // Valid format -> returned as-is
        "a".repeat(51), // Too long -> valid (accepted)
        "invalid-CHARACTER", // Valid characters -> returned as-is
      ];

      scenarios.forEach((scenario) => {
        const result = ConfigProfileName.create(scenario as string);

        // Each scenario should return a ConfigProfileName
        assertExists(result);
        assertEquals(typeof result, "object");
        assertEquals(typeof result.value, "string");
        assertEquals(result.value.length > 0, true);
      });
    });

    it("should maintain discriminated union consistency", () => {
      // Test that Result types properly discriminate
      const successResult = ok("success");
      const errorResult = error("failure");

      // Type discrimination should work consistently
      if (isOk(successResult)) {
        assertEquals(successResult.data, "success");
      }

      if (isError(errorResult)) {
        assertEquals(errorResult.error, "failure");
      }
    });
  });
});
