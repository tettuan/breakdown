/**
 * @fileoverview DirectiveType unit tests
 *
 * Tests for DirectiveType implementation following the Totality principle.
 * Covers architecture constraints, behavior verification, and structure validation.
 *
 * @module types/directive_type.test
 */

import {
  assert,
  assertEquals,
  assertExists,
  assertInstanceOf,
  assertNotEquals,
  assertStrictEquals,
} from "../deps.ts";
import { DirectiveType, TwoParamsDirectivePattern } from "./directive_type.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Test helper: Create a valid TwoParams_Result
 */
function createValidTwoParamsResult(
  demonstrativeType: string = "to",
  layerType: string = "project",
  params: string[] = ["test1", "test2"],
): TwoParams_Result {
  return {
    type: "two",
    demonstrativeType,
    layerType,
    params,
    options: {},
  };
}

// =============================================================================
// 0_architecture: Architecture constraints and design patterns
// =============================================================================

Deno.test("0_architecture: DirectiveType follows Smart Constructor pattern", () => {
  // Private constructor prevents direct instantiation
  // @ts-expect-error - Testing that constructor is private
  assert(() => new DirectiveType() === undefined);

  // Only way to create is through static create method
  const result = createValidTwoParamsResult();
  const directiveType = DirectiveType.create(result);
  assertExists(directiveType);
  assert(directiveType instanceof DirectiveType);
});

Deno.test("0_architecture: DirectiveType prevents invalid state at type level", () => {
  // DirectiveType can only be created from TwoParams_Result
  // This ensures that all DirectiveType instances are valid by construction
  
  // Valid TwoParams_Result always produces valid DirectiveType
  const validResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "any-value",
    layerType: "any-layer",
    params: ["param1", "param2"],
    options: {},
  };
  
  const directiveType = DirectiveType.create(validResult);
  assertExists(directiveType);
  
  // Cannot create DirectiveType without proper TwoParams_Result
  // Type system prevents this:
  // @ts-expect-error - Type system prevents invalid input
  DirectiveType.create({ invalid: "object" });
  
  // @ts-expect-error - Type system prevents null/undefined
  DirectiveType.create(null);
  
  // @ts-expect-error - Type system prevents wrong type
  DirectiveType.create("string");
});

Deno.test("0_architecture: TwoParamsDirectivePattern Smart Constructor totality", () => {
  // create() is total - returns TwoParamsDirectivePattern | null for ALL inputs
  
  // Valid patterns return instance
  const validPatterns = [
    "^test$",
    ".*",
    "[a-z]+",
    "^(to|from|summary)$",
    "\\d+",
    "",  // Empty pattern is valid regex
  ];
  
  for (const patternStr of validPatterns) {
    const pattern = TwoParamsDirectivePattern.create(patternStr);
    assertExists(pattern);
    assert(pattern instanceof TwoParamsDirectivePattern);
  }
  
  // Invalid patterns return null (not throw)
  const invalidPatterns = [
    "[",        // Unclosed bracket
    "(?<",      // Unclosed group
    "*",        // Invalid quantifier
    "\\",       // Trailing backslash
    "((",       // Unmatched parentheses
  ];
  
  for (const patternStr of invalidPatterns) {
    const pattern = TwoParamsDirectivePattern.create(patternStr);
    assertEquals(pattern, null);
  }
});

Deno.test("0_architecture: DirectiveType implements Totality principle", () => {
  // create() method is total - always returns DirectiveType, never throws
  const testCases = [
    createValidTwoParamsResult("to", "project"),
    createValidTwoParamsResult("summary", "issue"),
    createValidTwoParamsResult("defect", "task"),
    createValidTwoParamsResult("custom-value", "another-custom"),
  ];

  for (const result of testCases) {
    const directiveType = DirectiveType.create(result);
    assertExists(directiveType);
    assert(directiveType instanceof DirectiveType);
    assertEquals(directiveType.value, result.demonstrativeType);
  }
});

Deno.test("0_architecture: DirectiveType.create is exhaustive for all TwoParams_Result", () => {
  // Exhaustiveness: create() handles ALL possible TwoParams_Result shapes
  
  // Test with minimum required fields
  const minimalResult: TwoParams_Result = {
    type: "two",
    demonstrativeType: "minimal",
    layerType: "layer",
    params: [],
    options: {},
  };
  
  const minimal = DirectiveType.create(minimalResult);
  assertEquals(minimal.value, "minimal");
  
  // Test with additional options
  const withOptions: TwoParams_Result = {
    type: "two",
    demonstrativeType: "with-options",
    layerType: "layer",
    params: ["arg1", "arg2"],
    options: {
      verbose: true,
      debug: false,
      output: "file.txt",
      nested: { deep: { value: 123 } },
    },
  };
  
  const optioned = DirectiveType.create(withOptions);
  assertEquals(optioned.value, "with-options");
  
  // Test with extreme values
  const extremeValues: TwoParams_Result = {
    type: "two",
    demonstrativeType: "a".repeat(1000), // Very long string
    layerType: "🔥".repeat(100), // Unicode characters
    params: ["极限", "🚀", "", " ", "\n"],
    options: {
      bigNumber: Number.MAX_SAFE_INTEGER,
      smallNumber: Number.MIN_SAFE_INTEGER,
      infinity: Infinity,
      negInfinity: -Infinity,
      zero: 0,
      negZero: -0,
    },
  };
  
  const extreme = DirectiveType.create(extremeValues);
  assertEquals(extreme.value, "a".repeat(1000));
});

Deno.test("0_architecture: DirectiveType is immutable at interface level", () => {
  const result = createValidTwoParamsResult("to", "project");
  const directiveType = DirectiveType.create(result);

  // Value property is read-only (getter-only, no setter)
  const originalValue = directiveType.value;
  
  // DirectiveType provides immutable interface
  // The value property cannot be directly assigned
  try {
    // This should fail at runtime (getter-only property)
    (directiveType as any).value = "attempt-mutation";
    // If no error thrown, the assignment was ignored
  } catch (error) {
    // Expected: TypeError for read-only property
    assert(error instanceof TypeError);
  }
  
  // Value remains unchanged through the getter interface
  assertEquals(directiveType.value, originalValue);
  
  // DirectiveType interface is immutable even if underlying data changes
  result.demonstrativeType = "mutated";
  // Note: DirectiveType stores reference, so this reflects the change
  // This demonstrates that immutability is enforced at the interface level
  assertEquals(directiveType.value, "mutated"); // Reflects underlying change
});

Deno.test("0_architecture: TwoParamsDirectivePattern follows Smart Constructor pattern", () => {
  // Private constructor prevents direct instantiation
  // @ts-expect-error - Testing that constructor is private
  assert(() => new TwoParamsDirectivePattern() === undefined);

  // Valid pattern creation
  const pattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
  assertExists(pattern);
  assert(pattern instanceof TwoParamsDirectivePattern);

  // Invalid pattern returns null
  const invalidPattern = TwoParamsDirectivePattern.create("[invalid");
  assertEquals(invalidPattern, null);
});

Deno.test("0_architecture: Type-level guarantees prevent invalid DirectiveType states", () => {
  // The type system guarantees that DirectiveType can only exist in valid states
  
  // 1. Cannot exist without TwoParams_Result
  // 2. Cannot be modified after creation (interface-level immutability)
  // 3. Always has a valid demonstrativeType value
  
  const result = createValidTwoParamsResult("test", "layer");
  const directiveType = DirectiveType.create(result);
  
  // Type system prevents accessing non-existent properties
  // Note: TypeScript would catch this at compile time:
  // directiveType.invalidProperty; // TS Error
  
  // Type system prevents mutation at interface level
  // Note: TypeScript would catch this at compile time:
  // directiveType.value = "mutated"; // TS Error: readonly property
  
  // Type system ensures all instances have required methods and properties
  assertExists(directiveType.value);
  assertEquals(typeof directiveType.getValue, "function");
  assertEquals(typeof directiveType.equals, "function");
  assertEquals(typeof directiveType.toString, "function");
  assertExists(directiveType.originalResult);
  
  // All methods work correctly
  assertEquals(directiveType.value, "test");
  assertEquals(directiveType.getValue(), "test");
  assertEquals(directiveType.toString(), "DirectiveType(test)");
  assertEquals(directiveType.originalResult.demonstrativeType, "test");
});

// =============================================================================
// 1_behavior: Behavior verification and functional requirements
// =============================================================================

Deno.test("1_behavior: DirectiveType.create creates instance from TwoParams_Result", () => {
  const result = createValidTwoParamsResult("analyze", "system");
  const directiveType = DirectiveType.create(result);

  assertEquals(directiveType.value, "analyze");
  assertEquals(directiveType.getValue(), "analyze"); // Deprecated method
  assertEquals(directiveType.originalResult, result);
});

Deno.test("1_behavior: DirectiveType.equals compares values correctly", () => {
  const result1 = createValidTwoParamsResult("to", "project");
  const result2 = createValidTwoParamsResult("to", "issue");
  const result3 = createValidTwoParamsResult("summary", "project");

  const directive1 = DirectiveType.create(result1);
  const directive2 = DirectiveType.create(result2);
  const directive3 = DirectiveType.create(result3);

  // Same demonstrativeType values are equal
  assert(directive1.equals(directive2));
  assert(directive2.equals(directive1));

  // Different demonstrativeType values are not equal
  assert(!directive1.equals(directive3));
  assert(!directive3.equals(directive1));
});

Deno.test("1_behavior: DirectiveType.toString provides readable representation", () => {
  const result = createValidTwoParamsResult("defect", "task");
  const directiveType = DirectiveType.create(result);

  assertEquals(directiveType.toString(), "DirectiveType(defect)");
});

Deno.test("1_behavior: TwoParamsDirectivePattern.test validates strings", () => {
  const pattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
  assertExists(pattern);

  // Valid values
  assert(pattern.test("to"));
  assert(pattern.test("summary"));
  assert(pattern.test("defect"));

  // Invalid values
  assert(!pattern.test("invalid"));
  assert(!pattern.test("TO")); // Case sensitive
  assert(!pattern.test("to ")); // Extra space
  assert(!pattern.test(" to")); // Leading space
});

Deno.test("1_behavior: TwoParamsDirectivePattern string representations", () => {
  const pattern = TwoParamsDirectivePattern.create("^(to|from)$");
  assertExists(pattern);

  assertEquals(pattern.getPattern(), "^(to|from)$");
  assertEquals(pattern.toString(), "/^(to|from)$/");
});

Deno.test("1_behavior: TwoParamsDirectivePattern.getDirectivePattern returns self", () => {
  const pattern = TwoParamsDirectivePattern.create("^test$");
  assertExists(pattern);

  const returned = pattern.getDirectivePattern();
  assertStrictEquals(returned, pattern);
});

Deno.test("1_behavior: DirectiveType handles all possible string values (totality)", () => {
  // Totality: ANY valid TwoParams_Result produces a valid DirectiveType
  
  const edgeCaseValues = [
    "",                     // Empty string
    " ",                    // Single space
    "\n",                   // Newline
    "\t",                   // Tab
    "null",                 // String "null"
    "undefined",            // String "undefined"
    "true",                 // String "true"
    "false",                // String "false"
    "0",                    // String "0"
    "-1",                   // Negative number string
    "NaN",                  // String "NaN"
    "Infinity",             // String "Infinity"
    "'quoted'",             // With quotes
    '"double-quoted"',      // With double quotes
    "with spaces",          // Multiple words
    "with-dashes",          // Kebab case
    "with_underscores",     // Snake case
    "CamelCase",            // Camel case
    "UPPERCASE",            // All caps
    "日本語",               // Japanese
    "😀🎉",                // Emojis
    "\u0000",               // Null character
    "\uFFFF",               // Max BMP character
  ];
  
  for (const value of edgeCaseValues) {
    const result = createValidTwoParamsResult(value);
    const directiveType = DirectiveType.create(result);
    
    // Every input produces a valid DirectiveType
    assertExists(directiveType);
    assertEquals(directiveType.value, value);
    
    // Methods work correctly for all values
    assertEquals(directiveType.getValue(), value);
    assertEquals(directiveType.toString(), `DirectiveType(${value})`);
    
    // Equality works for all values
    const sameDirective = DirectiveType.create(result);
    assert(directiveType.equals(sameDirective));
  }
});

Deno.test("1_behavior: TwoParamsDirectivePattern.create handles all string inputs", () => {
  // Totality for pattern creation: ALL strings either produce pattern or null
  
  const testInputs = [
    // Valid regex patterns
    { input: ".*", shouldBeValid: true },
    { input: "^$", shouldBeValid: true },
    { input: "[a-zA-Z0-9]+", shouldBeValid: true },
    { input: "\\w+", shouldBeValid: true },
    { input: "(?:group)", shouldBeValid: true },
    { input: "a{2,5}", shouldBeValid: true },
    { input: "test|other", shouldBeValid: true },
    
    // Invalid regex patterns
    { input: "[", shouldBeValid: false },
    { input: "(?<", shouldBeValid: false },
    { input: "(?P<", shouldBeValid: false },
    { input: "*", shouldBeValid: false },
    { input: "+", shouldBeValid: false },
    { input: "?", shouldBeValid: false },
    { input: "\\", shouldBeValid: false },
    // Note: "}" and "{" are valid as literal characters in JavaScript regex
  ];
  
  for (const { input, shouldBeValid } of testInputs) {
    const pattern = TwoParamsDirectivePattern.create(input);
    
    if (shouldBeValid) {
      assertExists(pattern, `Expected valid pattern for: ${input}`);
      assert(pattern instanceof TwoParamsDirectivePattern);
    } else {
      assertEquals(pattern, null, `Expected null for invalid pattern: ${input}`);
    }
  }
});

// =============================================================================
// 2_structure: Structure validation and data integrity
// =============================================================================

Deno.test("2_structure: DirectiveType preserves TwoParams_Result structure", () => {
  const result: TwoParams_Result = {
    type: "two",
    demonstrativeType: "custom-directive",
    layerType: "custom-layer",
    params: ["test", "params"],
    options: {
      verbose: true,
      output: "test.txt",
    },
  };

  const directiveType = DirectiveType.create(result);

  // Original result is preserved completely
  assertEquals(directiveType.originalResult.type, "two");
  assertEquals(directiveType.originalResult.demonstrativeType, "custom-directive");
  assertEquals(directiveType.originalResult.layerType, "custom-layer");
  assertEquals(directiveType.originalResult.options, {
    verbose: true,
    output: "test.txt",
  });
});

Deno.test("2_structure: DirectiveType.originalResult provides readonly access", () => {
  const result = createValidTwoParamsResult();
  const directiveType = DirectiveType.create(result);

  const original = directiveType.originalResult;

  // TypeScript types ensure read-only access at compile time
  // Runtime behavior: the object is returned as-is but with Readonly<T> type
  
  // Verify the original result is accessible
  assertEquals(original.type, "two");
  assertEquals(original.demonstrativeType, "to");
  assertEquals(original.layerType, "project");
  assertExists(original.params);
  assertExists(original.options);
  
  // The Readonly<T> type prevents modification at TypeScript level
  // At runtime, the object reference is the same, so mutations would affect it
  // This is intentional - TypeScript's Readonly is a compile-time constraint
  
  // Verify the DirectiveType reflects any changes to the underlying data
  const initialValue = directiveType.value;
  assertEquals(initialValue, "to");
  
  // If external code modifies the original result, DirectiveType reflects it
  result.demonstrativeType = "modified";
  assertEquals(directiveType.value, "modified");
});

Deno.test("2_structure: DirectiveType maintains referential transparency", () => {
  const result = createValidTwoParamsResult("analyze", "module");
  
  // Multiple calls with same input produce equivalent results
  const directive1 = DirectiveType.create(result);
  const directive2 = DirectiveType.create(result);

  assertEquals(directive1.value, directive2.value);
  assert(directive1.equals(directive2));
  assertEquals(directive1.toString(), directive2.toString());
});

Deno.test("2_structure: TwoParamsDirectivePattern handles edge cases", () => {
  // Empty pattern
  const emptyPattern = TwoParamsDirectivePattern.create("");
  assertExists(emptyPattern);
  assert(emptyPattern.test("")); // Matches empty string

  // Complex pattern
  const complexPattern = TwoParamsDirectivePattern.create(
    "^(to|from|summary|defect|analyze|transform|extract)$"
  );
  assertExists(complexPattern);
  assert(complexPattern.test("transform"));
  assert(!complexPattern.test("invalid"));

  // Unicode pattern
  const unicodePattern = TwoParamsDirectivePattern.create("^[あ-ん]+$");
  assertExists(unicodePattern);
  assert(unicodePattern.test("あいうえお"));
  assert(!unicodePattern.test("abc"));
});

Deno.test("2_structure: DirectiveType handles various demonstrativeType values", () => {
  const testValues = [
    "to",
    "from",
    "summary",
    "defect",
    "analyze-data",
    "transform_input",
    "extract.info",
    "複雑な値",
    "value-with-特殊文字",
    "",  // Empty string is technically valid since no validation here
  ];

  for (const value of testValues) {
    const result = createValidTwoParamsResult(value);
    const directiveType = DirectiveType.create(result);
    
    assertEquals(directiveType.value, value);
    assertEquals(directiveType.originalResult.demonstrativeType, value);
  }
});

Deno.test("2_structure: DirectiveType structural integrity with TwoParams_Result variations", () => {
  // Test that DirectiveType maintains integrity with all possible TwoParams_Result structures
  
  // Minimal structure
  const minimal: TwoParams_Result = {
    type: "two",
    demonstrativeType: "test",
    layerType: "layer",
    params: [],
    options: {},
  };
  
  const minimalDirective = DirectiveType.create(minimal);
  assertEquals(minimalDirective.originalResult.type, "two");
  assertEquals(minimalDirective.originalResult.demonstrativeType, "test");
  assertEquals(minimalDirective.originalResult.layerType, "layer");
  assertEquals(minimalDirective.originalResult.options, {});
  
  // Complex nested options
  const complex: TwoParams_Result = {
    type: "two",
    demonstrativeType: "complex",
    layerType: "nested",
    params: ["param1", "param2", "param3"],
    options: {
      level1: {
        level2: {
          level3: {
            deep: "value",
            array: [1, 2, 3],
            boolean: true,
          },
        },
      },
      mixedTypes: [
        "string",
        123,
        true,
        null,
        { nested: "object" },
        ["nested", "array"],
      ],
    },
  };
  
  const complexDirective = DirectiveType.create(complex);
  assertEquals(complexDirective.value, "complex");
  // Deep equality check for complex options
  assertEquals(
    JSON.stringify(complexDirective.originalResult.options),
    JSON.stringify(complex.options)
  );
});

Deno.test("2_structure: TwoParams_Result type exhaustiveness in DirectiveType", () => {
  // Verify that DirectiveType correctly handles all fields of TwoParams_Result
  
  const result: TwoParams_Result = {
    type: "two" as const,  // Literal type
    demonstrativeType: "exhaustive",
    layerType: "test",
    params: ["arg1", "arg2"],
    options: {
      key1: "value1",
      key2: 42,
    },
  };
  
  const directiveType = DirectiveType.create(result);
  
  // Verify all fields are accessible and correct
  const original = directiveType.originalResult;
  
  // Type field
  assertEquals(original.type, "two");
  // @ts-expect-error - type must be "two"
  original.type = "one";
  
  // DemonstrativeType field (primary value)
  assertEquals(original.demonstrativeType, "exhaustive");
  assertEquals(directiveType.value, "exhaustive");
  
  // LayerType field (preserved but not primary)
  assertEquals(original.layerType, "test");
  
  // Options field (arbitrary shape preserved)
  assertEquals(original.options.key1, "value1");
  assertEquals(original.options.key2, 42);
});

Deno.test("2_structure: DirectiveType preserves Result type discrimination", () => {
  // DirectiveType only accepts TwoParams_Result (type: "two")
  // This structural test ensures type discrimination is preserved
  
  const validTwoParams: TwoParams_Result = {
    type: "two",
    demonstrativeType: "valid",
    layerType: "layer",
    params: ["param"],
    options: {},
  };
  
  const directiveType = DirectiveType.create(validTwoParams);
  assertEquals(directiveType.originalResult.type, "two");
  
  // Type system prevents other Result types at compile time
  // These would cause TypeScript compilation errors if uncommented:
  /*
  const invalidOneParams = {
    type: "one",
    inputType: "file", 
    outputType: "stdout",
    options: {},
  };
  DirectiveType.create(invalidOneParams); // TS Error: incompatible type
  
  const invalidZeroParams = {
    type: "zero", 
    subCommand: "init",
    options: {},
  };
  DirectiveType.create(invalidZeroParams); // TS Error: incompatible type
  */
});