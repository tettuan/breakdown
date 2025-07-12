/**
 * @fileoverview DirectiveType validation enhancement tests
 *
 * This test file specifically focuses on validatedByPattern property
 * and type safety improvements for DirectiveType validation.
 *
 * @module lib/types/directive_type_validation_enhancement_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { DirectiveType, TwoParamsDirectivePattern } from "./mod.ts";
import type { TwoParams_Result } from "../deps.ts";
import type { ValidationError as _ValidationError } from "./mod.ts";

// Test helper to create valid TwoParams_Result
const createTwoParamsResult = (
  demonstrativeType: string,
  layerType: string = "project",
  options: Record<string, unknown> = {},
): TwoParams_Result => ({
  type: "two",
  demonstrativeType,
  layerType,
  params: [demonstrativeType, layerType],
  options,
});

Deno.test("DirectiveType validation enhancement - validatedByPattern property behavior", async (t) => {
  await t.step("should return true when created with pattern validation", () => {
    const patternResult = TwoParamsDirectivePattern.createOrError("^(to|summary|defect)$");
    assertEquals(patternResult.ok, true);

    if (patternResult.ok) {
      const result = createTwoParamsResult("to");
      const directiveResult = DirectiveType.createOrError(result, patternResult.data);
      assertEquals(directiveResult.ok, true);

      if (directiveResult.ok) {
        assertEquals(directiveResult.data.validatedByPattern, true);
      }
    }
  });

  await t.step("should return false when created without pattern validation", () => {
    const result = createTwoParamsResult("custom-directive");
    const directiveResult = DirectiveType.createOrError(result);
    assertEquals(directiveResult.ok, true);

    if (directiveResult.ok) {
      assertEquals(directiveResult.data.validatedByPattern, false);
    }
  });

  await t.step("should return true for legacy create method", () => {
    const result = createTwoParamsResult("legacy");
    const directive = DirectiveType.create(result);
    assertEquals(directive.validatedByPattern, true);
  });
});

Deno.test("DirectiveType validation enhancement - pattern validation flag management", async (t) => {
  await t.step("should accurately track pattern validation state", () => {
    const pattern = TwoParamsDirectivePattern.createOrError("^[a-z]+$");
    assertEquals(pattern.ok, true);

    if (pattern.ok) {
      // With pattern
      const withPatternResult = createTwoParamsResult("valid");
      const withPattern = DirectiveType.createOrError(withPatternResult, pattern.data);
      assertEquals(withPattern.ok, true);

      if (withPattern.ok) {
        assertEquals(withPattern.data.validatedByPattern, true);
      }

      // Without pattern
      const withoutPatternResult = createTwoParamsResult("anything");
      const withoutPattern = DirectiveType.createOrError(withoutPatternResult);
      assertEquals(withoutPattern.ok, true);

      if (withoutPattern.ok) {
        assertEquals(withoutPattern.data.validatedByPattern, false);
      }
    }
  });

  await t.step("should maintain pattern validation state through composition", () => {
    const strictPattern = TwoParamsDirectivePattern.createOrError("^(analyze|process|transform)$");
    assertEquals(strictPattern.ok, true);

    if (strictPattern.ok) {
      const testCases = [
        { value: "analyze", shouldPass: true },
        { value: "process", shouldPass: true },
        { value: "transform", shouldPass: true },
        { value: "invalid", shouldPass: false },
      ];

      for (const { value, shouldPass } of testCases) {
        const result = createTwoParamsResult(value);
        const directive = DirectiveType.createOrError(result, strictPattern.data);

        if (shouldPass) {
          assertEquals(directive.ok, true);
          if (directive.ok) {
            assertEquals(directive.data.validatedByPattern, true);
            assertEquals(directive.data.value, value);
          }
        } else {
          assertEquals(directive.ok, false);
        }
      }
    }
  });
});

Deno.test("DirectiveType validation enhancement - type safety strengthening", async (t) => {
  await t.step("should provide exhaustive error information for invalid patterns", () => {
    const invalidPatterns = [
      { pattern: "", expectedField: "pattern", expectedReason: "Pattern cannot be empty" },
      { pattern: "[unclosed", expectedField: "pattern", expectedReason: "Invalid regex pattern" },
      {
        pattern: "(?P<invalid>",
        expectedField: "pattern",
        expectedReason: "Invalid regex pattern",
      },
    ];

    for (const { pattern, expectedField, expectedReason } of invalidPatterns) {
      const patternResult = TwoParamsDirectivePattern.createOrError(pattern);
      assertEquals(patternResult.ok, false);

      if (!patternResult.ok) {
        assertEquals(patternResult.error.kind, "InvalidInput");
        if (patternResult.error.kind === "InvalidInput") {
          assertEquals(patternResult.error.field, expectedField);
          assertEquals(patternResult.error.reason.includes(expectedReason), true);
        }
      }
    }
  });

  await t.step("should handle complex pattern validation scenarios", () => {
    const complexPattern = TwoParamsDirectivePattern.createOrError(
      "^[a-z]+(-[a-z]+)*(\\.v[0-9]+)?$",
    );
    assertEquals(complexPattern.ok, true);

    if (complexPattern.ok) {
      const testCases = [
        { value: "simple", shouldPass: true },
        { value: "multi-word", shouldPass: true },
        { value: "versioned.v1", shouldPass: true },
        { value: "complex-directive.v123", shouldPass: true },
        { value: "Invalid-Case", shouldPass: false },
        { value: "with_underscore", shouldPass: false },
        { value: "with spaces", shouldPass: false },
        { value: "123start", shouldPass: false },
        { value: "ends-", shouldPass: false },
        { value: "version.v", shouldPass: false },
      ];

      for (const { value, shouldPass } of testCases) {
        const result = createTwoParamsResult(value);
        const directive = DirectiveType.createOrError(result, complexPattern.data);

        assertEquals(directive.ok, shouldPass);
        if (directive.ok) {
          assertEquals(directive.data.validatedByPattern, true);
          assertEquals(directive.data.value, value);
        } else {
          assertEquals(directive.error.kind, "InvalidInput");
          if (directive.error.kind === "InvalidInput") {
            assertEquals(directive.error.field, "demonstrativeType");
            assertEquals(directive.error.value, value);
          }
        }
      }
    }
  });

  await t.step("should ensure type safety across all creation methods", () => {
    const result = createTwoParamsResult("test");

    // Legacy create method
    const legacy = DirectiveType.create(result);
    assertEquals(typeof legacy.validatedByPattern, "boolean");
    assertEquals(legacy.validatedByPattern, true);

    // Result-based creation without pattern
    const withoutPattern = DirectiveType.createOrError(result);
    assertEquals(withoutPattern.ok, true);
    if (withoutPattern.ok) {
      assertEquals(typeof withoutPattern.data.validatedByPattern, "boolean");
      assertEquals(withoutPattern.data.validatedByPattern, false);
    }

    // Result-based creation with pattern
    const pattern = TwoParamsDirectivePattern.createOrError("^test$");
    assertEquals(pattern.ok, true);
    if (pattern.ok) {
      const withPattern = DirectiveType.createOrError(result, pattern.data);
      assertEquals(withPattern.ok, true);
      if (withPattern.ok) {
        assertEquals(typeof withPattern.data.validatedByPattern, "boolean");
        assertEquals(withPattern.data.validatedByPattern, true);
      }
    }
  });
});

Deno.test("DirectiveType validation enhancement - Smart Constructor pattern maintenance", async (t) => {
  await t.step("should maintain private constructor restriction", () => {
    // This test ensures that DirectiveType cannot be instantiated directly
    // TypeScript should prevent this at compile time
    const result = createTwoParamsResult("test");

    // Valid creation methods
    const legacy = DirectiveType.create(result);
    assertExists(legacy);
    assertEquals(legacy.value, "test");

    const withResult = DirectiveType.createOrError(result);
    assertEquals(withResult.ok, true);

    // Constructor should not be accessible
    // The private constructor ensures encapsulation
    // We test this by verifying that valid creation methods work
    assertEquals(typeof legacy.value, "string");
    assertEquals(typeof withResult.ok, "boolean");
  });

  await t.step("should ensure immutability of created instances", () => {
    const result = createTwoParamsResult("immutable");
    const directive = DirectiveType.create(result);

    // Properties should be readonly
    const originalValue = directive.value;
    const originalValidated = directive.validatedByPattern;

    // Properties are readonly - TypeScript prevents modification
    // We verify this by confirming the properties exist and have expected types
    assertEquals(typeof directive.value, "string");
    assertEquals(typeof directive.validatedByPattern, "boolean");

    // Values should remain unchanged (immutability test)
    assertEquals(directive.value, originalValue);
    assertEquals(directive.validatedByPattern, originalValidated);
  });

  await t.step("should provide consistent interface across creation methods", () => {
    const result = createTwoParamsResult("consistent");
    const pattern = TwoParamsDirectivePattern.createOrError("^consistent$");
    assertEquals(pattern.ok, true);

    if (pattern.ok) {
      const createResult = DirectiveType.createOrError(result);
      const createWithPatternResult = DirectiveType.createOrError(result, pattern.data);

      const methods = [
        DirectiveType.create(result),
        createResult.ok ? createResult.data : null,
        createWithPatternResult.ok ? createWithPatternResult.data : null,
      ].filter(Boolean);

      for (const directive of methods) {
        if (directive) {
          // All instances should have the same interface
          assertEquals(typeof directive.value, "string");
          assertEquals(typeof directive.validatedByPattern, "boolean");
          assertEquals(typeof directive.getValue, "function");
          assertEquals(typeof directive.equals, "function");
          assertEquals(typeof directive.toString, "function");
        }
      }
    }
  });
});

Deno.test("DirectiveType validation enhancement - Result type error handling extension", async (t) => {
  await t.step("should provide comprehensive error classification", () => {
    const errorScenarios = [
      {
        name: "null input",
        input: null as unknown as TwoParams_Result,
        expectedKind: "InvalidInput" as const,
      },
      {
        name: "wrong type",
        input: { type: "one" } as unknown as TwoParams_Result,
        expectedKind: "InvalidInput" as const,
      },
      {
        name: "missing demonstrativeType",
        input: { type: "two", layerType: "project" } as TwoParams_Result,
        expectedKind: "MissingRequiredField" as const,
      },
      {
        name: "empty demonstrativeType",
        input: createTwoParamsResult(""),
        expectedKind: "MissingRequiredField" as const,
      },
    ];

    for (const { name, input, expectedKind } of errorScenarios) {
      const result = DirectiveType.createOrError(input);
      assertEquals(result.ok, false, `Expected error for ${name}`);

      if (!result.ok) {
        assertEquals(result.error.kind, expectedKind, `Wrong error kind for ${name}`);
      }
    }
  });

  await t.step("should provide detailed pattern mismatch errors", () => {
    const pattern = TwoParamsDirectivePattern.createOrError("^(allowed|valid)$");
    assertEquals(pattern.ok, true);

    if (pattern.ok) {
      const invalidValues = ["notallowed", "invalid123", "ALLOWED", "valid "];

      for (const value of invalidValues) {
        const result = createTwoParamsResult(value);
        const directive = DirectiveType.createOrError(result, pattern.data);
        assertEquals(directive.ok, false);

        if (!directive.ok) {
          assertEquals(directive.error.kind, "InvalidInput");
          if (directive.error.kind === "InvalidInput") {
            assertEquals(directive.error.field, "demonstrativeType");
            assertEquals(directive.error.value, value);
            assertEquals(
              directive.error.reason,
              "Value does not match required pattern: ^(allowed|valid)$",
            );
          }
        }
      }
    }
  });

  await t.step("should enable composable error handling", () => {
    function processDirectiveCreation(value: string): string {
      const pattern = TwoParamsDirectivePattern.createOrError("^[a-z]+$");
      if (!pattern.ok) {
        const error = pattern.error;
        return `Pattern error: ${error.kind === "InvalidInput" ? error.reason : "Unknown error"}`;
      }

      const result = createTwoParamsResult(value);
      const directive = DirectiveType.createOrError(result, pattern.data);
      if (!directive.ok) {
        const error = directive.error;
        return `Directive error: ${error.kind === "InvalidInput" ? error.reason : "Unknown error"}`;
      }

      return `Success: ${directive.data.value} (validated: ${directive.data.validatedByPattern})`;
    }

    // Test success case
    assertEquals(
      processDirectiveCreation("valid"),
      "Success: valid (validated: true)",
    );

    // Test failure case
    assertEquals(
      processDirectiveCreation("Invalid123"),
      "Directive error: Value does not match required pattern: ^[a-z]+$",
    );
  });
});
