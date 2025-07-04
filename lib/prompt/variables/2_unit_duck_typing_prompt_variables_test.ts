/**
 * @fileoverview Unit tests for DuckTypingPromptVariables
 *
 * This test suite verifies the Duck Typing Pattern implementation for PromptVariables,
 * focusing on type safety, flexibility, and compatibility with existing code.
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import {
  createPromptVariables,
  DuckTypingPromptVariables,
  isPromptVariables,
  isPromptVariablesLike,
  mergePromptVariables,
} from "./duck_typing_prompt_variables.ts";
import { StandardPromptVariables } from "./standard_prompt_variables.ts";
import { UserPromptVariables } from "./user_prompt_variables.ts";

Deno.test("DuckTypingPromptVariables - fromRecord creates instance from valid record", () => {
  const variables = { key1: "value1", key2: "value2" };
  const result = DuckTypingPromptVariables.fromRecord(variables);

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.toRecord(), variables);
    assertEquals(result.data.size(), 2);
  }
});

Deno.test("DuckTypingPromptVariables - fromRecord validates input", () => {
  // Test invalid key
  const invalidKey = DuckTypingPromptVariables.fromRecord({ "": "value" });
  assertEquals(invalidKey.ok, false);

  // Test null value
  const nullValue = DuckTypingPromptVariables.fromRecord({ key: null as any });
  assertEquals(nullValue.ok, false);

  // Test undefined value
  const undefinedValue = DuckTypingPromptVariables.fromRecord({ key: undefined as any });
  assertEquals(undefinedValue.ok, false);

  // Test non-string value
  const nonStringValue = DuckTypingPromptVariables.fromRecord({ key: 123 as any });
  assertEquals(nonStringValue.ok, false);
});

Deno.test("DuckTypingPromptVariables - fromPromptVariables works with existing implementations", () => {
  // Test with StandardPromptVariables
  const standardResult = StandardPromptVariables.create("input.txt", "/output/path");
  assertEquals(standardResult.ok, true);

  if (standardResult.ok) {
    const duckResult = DuckTypingPromptVariables.fromPromptVariables(standardResult.data);
    assertEquals(duckResult.ok, true);

    if (duckResult.ok) {
      const record = duckResult.data.toRecord();
      assertEquals(record.input_text_file, "input.txt");
      assertEquals(record.destination_path, "/output/path");
    }
  }
});

Deno.test("DuckTypingPromptVariables - fromPairs creates instance from key-value pairs", () => {
  const pairs: Array<[string, string]> = [
    ["key1", "value1"],
    ["key2", "value2"],
    ["key3", "value3"],
  ];

  const result = DuckTypingPromptVariables.fromPairs(pairs);
  assertEquals(result.ok, true);

  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.key1, "value1");
    assertEquals(record.key2, "value2");
    assertEquals(record.key3, "value3");
    assertEquals(result.data.size(), 3);
  }
});

Deno.test("DuckTypingPromptVariables - empty creates empty instance", () => {
  const result = DuckTypingPromptVariables.empty();
  assertEquals(result.ok, true);

  if (result.ok) {
    assertEquals(result.data.isEmpty(), true);
    assertEquals(result.data.size(), 0);
    assertEquals(Object.keys(result.data.toRecord()).length, 0);
  }
});

Deno.test("DuckTypingPromptVariables - get and has methods work correctly", () => {
  const result = DuckTypingPromptVariables.fromRecord({ key1: "value1", key2: "value2" });
  assertEquals(result.ok, true);

  if (result.ok) {
    const vars = result.data;

    assertEquals(vars.get("key1"), "value1");
    assertEquals(vars.get("key2"), "value2");
    assertEquals(vars.get("nonexistent"), undefined);

    assertEquals(vars.has("key1"), true);
    assertEquals(vars.has("key2"), true);
    assertEquals(vars.has("nonexistent"), false);
  }
});

Deno.test("DuckTypingPromptVariables - keys, values, entries methods work correctly", () => {
  const result = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2", c: "3" });
  assertEquals(result.ok, true);

  if (result.ok) {
    const vars = result.data;

    const keys = vars.keys().sort();
    assertEquals(keys, ["a", "b", "c"]);

    const values = vars.values().sort();
    assertEquals(values, ["1", "2", "3"]);

    const entries = vars.entries().sort();
    assertEquals(entries, [["a", "1"], ["b", "2"], ["c", "3"]]);
  }
});

Deno.test("DuckTypingPromptVariables - withVariable creates new instance", () => {
  const original = DuckTypingPromptVariables.fromRecord({ key1: "value1" });
  assertEquals(original.ok, true);

  if (original.ok) {
    const updated = original.data.withVariable("key2", "value2");
    assertEquals(updated.ok, true);

    if (updated.ok) {
      // Original should be unchanged
      assertEquals(original.data.size(), 1);
      assertEquals(original.data.has("key2"), false);

      // New instance should have both variables
      assertEquals(updated.data.size(), 2);
      assertEquals(updated.data.get("key1"), "value1");
      assertEquals(updated.data.get("key2"), "value2");
    }
  }
});

Deno.test("DuckTypingPromptVariables - withVariables merges with other PromptVariables", () => {
  const vars1 = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2" });
  const vars2 = DuckTypingPromptVariables.fromRecord({ c: "3", d: "4" });

  assertEquals(vars1.ok, true);
  assertEquals(vars2.ok, true);

  if (vars1.ok && vars2.ok) {
    const merged = vars1.data.withVariables(vars2.data);
    assertEquals(merged.ok, true);

    if (merged.ok) {
      assertEquals(merged.data.size(), 4);
      assertEquals(merged.data.get("a"), "1");
      assertEquals(merged.data.get("b"), "2");
      assertEquals(merged.data.get("c"), "3");
      assertEquals(merged.data.get("d"), "4");
    }
  }
});

Deno.test("DuckTypingPromptVariables - without removes specified variables", () => {
  const original = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2", c: "3", d: "4" });
  assertEquals(original.ok, true);

  if (original.ok) {
    const filtered = original.data.without("b", "d");
    assertEquals(filtered.ok, true);

    if (filtered.ok) {
      assertEquals(filtered.data.size(), 2);
      assertEquals(filtered.data.has("a"), true);
      assertEquals(filtered.data.has("c"), true);
      assertEquals(filtered.data.has("b"), false);
      assertEquals(filtered.data.has("d"), false);
    }
  }
});

Deno.test("DuckTypingPromptVariables - pick selects specified variables", () => {
  const original = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2", c: "3", d: "4" });
  assertEquals(original.ok, true);

  if (original.ok) {
    const picked = original.data.pick("a", "c", "nonexistent");
    assertEquals(picked.ok, true);

    if (picked.ok) {
      assertEquals(picked.data.size(), 2);
      assertEquals(picked.data.get("a"), "1");
      assertEquals(picked.data.get("c"), "3");
      assertEquals(picked.data.has("b"), false);
      assertEquals(picked.data.has("d"), false);
    }
  }
});

Deno.test("DuckTypingPromptVariables - filter works with predicate function", () => {
  const original = DuckTypingPromptVariables.fromRecord({
    short: "hi",
    medium: "hello",
    long: "hello world",
  });
  assertEquals(original.ok, true);

  if (original.ok) {
    const filtered = original.data.filter((key, value) => value.length > 2);
    assertEquals(filtered.ok, true);

    if (filtered.ok) {
      assertEquals(filtered.data.size(), 2);
      assertEquals(filtered.data.has("short"), false);
      assertEquals(filtered.data.has("medium"), true);
      assertEquals(filtered.data.has("long"), true);
    }
  }
});

Deno.test("DuckTypingPromptVariables - map transforms variable values", () => {
  const original = DuckTypingPromptVariables.fromRecord({ a: "hello", b: "world" });
  assertEquals(original.ok, true);

  if (original.ok) {
    const mapped = original.data.map((key, value) => value.toUpperCase());
    assertEquals(mapped.ok, true);

    if (mapped.ok) {
      assertEquals(mapped.data.get("a"), "HELLO");
      assertEquals(mapped.data.get("b"), "WORLD");
    }
  }
});

Deno.test("DuckTypingPromptVariables - validate checks all variables", () => {
  const vars = DuckTypingPromptVariables.fromRecord({ a: "123", b: "456", c: "abc" });
  assertEquals(vars.ok, true);

  if (vars.ok) {
    // Test validation that passes
    const numericValidation = vars.data.validate((key, value) => /^\d+$/.test(value));
    assertEquals(numericValidation.ok, false); // Should fail because "abc" is not numeric

    // Test validation that fails
    const lengthValidation = vars.data.validate((key, value) => value.length >= 3);
    assertEquals(lengthValidation.ok, true); // Should pass because all values have length >= 3
  }
});

Deno.test("DuckTypingPromptVariables - JSON serialization works correctly", () => {
  const original = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2" });
  assertEquals(original.ok, true);

  if (original.ok) {
    const json = original.data.toJSON();
    assertExists(json);

    const restored = DuckTypingPromptVariables.fromJSON(json);
    assertEquals(restored.ok, true);

    if (restored.ok) {
      assertEquals(restored.data.equals(original.data), true);
    }
  }
});

Deno.test("DuckTypingPromptVariables - equals compares instances correctly", () => {
  const vars1 = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2" });
  const vars2 = DuckTypingPromptVariables.fromRecord({ b: "2", a: "1" }); // Different order
  const vars3 = DuckTypingPromptVariables.fromRecord({ a: "1", b: "3" }); // Different value

  assertEquals(vars1.ok, true);
  assertEquals(vars2.ok, true);
  assertEquals(vars3.ok, true);

  if (vars1.ok && vars2.ok && vars3.ok) {
    assertEquals(vars1.data.equals(vars2.data), true); // Order shouldn't matter
    assertEquals(vars1.data.equals(vars3.data), false); // Different values
    assertEquals(vars1.data.equals("not a PromptVariables"), false); // Different type
  }
});

Deno.test("DuckTypingPromptVariables - toString provides useful representation", () => {
  const small = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2" });
  const large = DuckTypingPromptVariables.fromRecord({
    a: "1",
    b: "2",
    c: "3",
    d: "4",
    e: "5",
    f: "6",
  });

  assertEquals(small.ok, true);
  assertEquals(large.ok, true);

  if (small.ok && large.ok) {
    const smallStr = small.data.toString();
    const largeStr = large.data.toString();

    // Small should show all variables
    assertEquals(smallStr.includes("2 variables"), true);
    assertEquals(smallStr.includes("a=1"), true);
    assertEquals(smallStr.includes("b=2"), true);

    // Large should show truncated view
    assertEquals(largeStr.includes("6 variables"), true);
    assertEquals(largeStr.includes("... (+"), true);
  }
});

Deno.test("isPromptVariables type guard works correctly", () => {
  const standardVars = StandardPromptVariables.create("input.txt", "/output");
  assertEquals(standardVars.ok, true);

  if (standardVars.ok) {
    assertEquals(isPromptVariables(standardVars.data), true);
  }

  const duckVars = DuckTypingPromptVariables.fromRecord({ a: "1" });
  assertEquals(duckVars.ok, true);

  if (duckVars.ok) {
    assertEquals(isPromptVariables(duckVars.data), true);
  }

  assertEquals(isPromptVariables(null), false);
  assertEquals(isPromptVariables(undefined), false);
  assertEquals(isPromptVariables({}), false);
  assertEquals(isPromptVariables({ a: "1" }), false); // No toRecord method
  assertEquals(isPromptVariables("string"), false);
});

Deno.test("isPromptVariablesLike type guard works correctly", () => {
  assertEquals(isPromptVariablesLike({ a: "1", b: "2" }), true);
  assertEquals(isPromptVariablesLike({}), true);

  assertEquals(isPromptVariablesLike({ a: 1 }), false); // Non-string value
  assertEquals(isPromptVariablesLike({ "1": "a" }), true); // Numeric key as string is ok
  assertEquals(isPromptVariablesLike(null), false);
  assertEquals(isPromptVariablesLike(undefined), false);
  assertEquals(isPromptVariablesLike("string"), false);
  assertEquals(isPromptVariablesLike([]), true); // Empty array is technically an object with no entries
});

Deno.test("createPromptVariables utility function works with different sources", () => {
  // Test with record
  const fromRecord = createPromptVariables({ a: "1", b: "2" });
  assertEquals(fromRecord.ok, true);

  // Test with array of pairs
  const fromPairs = createPromptVariables([["a", "1"], ["b", "2"]]);
  assertEquals(fromPairs.ok, true);

  // Test with existing PromptVariables
  if (fromRecord.ok) {
    const fromExisting = createPromptVariables(fromRecord.data);
    assertEquals(fromExisting.ok, true);
  }

  // Test with invalid source
  const fromInvalid = createPromptVariables("invalid");
  assertEquals(fromInvalid.ok, false);
});

Deno.test("mergePromptVariables utility function merges multiple sources", () => {
  const source1 = { a: "1", b: "2" };
  const source2 = DuckTypingPromptVariables.fromRecord({ c: "3", d: "4" });
  const source3 = [["e", "5"], ["f", "6"]] as Array<[string, string]>;

  assertEquals(source2.ok, true);

  if (source2.ok) {
    const merged = mergePromptVariables(source1, source2.data, source3);

    // Debug the merge failure
    if (!merged.ok) {
      console.log("Merge failed with error:", merged.error.message);
    }

    assertEquals(merged.ok, true);

    if (merged.ok) {
      assertEquals(merged.data.size(), 6);
      assertEquals(merged.data.get("a"), "1");
      assertEquals(merged.data.get("c"), "3");
      assertEquals(merged.data.get("e"), "5");
    }
  }
});

Deno.test("DuckTypingPromptVariables - compatibility with existing PromptVariables implementations", () => {
  // Test with StandardPromptVariables
  const standard = StandardPromptVariables.create("input.txt", "/output/path", { custom: "value" });
  assertEquals(standard.ok, true);

  if (standard.ok) {
    const duck = DuckTypingPromptVariables.fromPromptVariables(standard.data);
    assertEquals(duck.ok, true);

    if (duck.ok) {
      const record = duck.data.toRecord();
      assertEquals(record.input_text_file, "input.txt");
      assertEquals(record.destination_path, "/output/path");
      assertEquals(record.custom, "value");

      // Test that it can be used anywhere PromptVariables is expected
      const testFunction = (vars: { toRecord(): Record<string, string> }) => {
        return vars.toRecord();
      };

      const result = testFunction(duck.data);
      assertEquals(result.input_text_file, "input.txt");
    }
  }
});

Deno.test("DuckTypingPromptVariables - immutability guarantee", () => {
  const original = DuckTypingPromptVariables.fromRecord({ a: "1", b: "2" });
  assertEquals(original.ok, true);

  if (original.ok) {
    const originalRecord = original.data.toRecord();

    // Modify the returned record
    originalRecord.a = "modified";
    originalRecord.c = "new";

    // Original should be unchanged
    assertEquals(original.data.get("a"), "1");
    assertEquals(original.data.has("c"), false);

    // Create new instance and verify original is still unchanged
    const updated = original.data.withVariable("d", "4");
    assertEquals(updated.ok, true);

    assertEquals(original.data.size(), 2);
    if (updated.ok) {
      assertEquals(updated.data.size(), 3);
    }
  }
});

Deno.test("DuckTypingPromptVariables - error handling for edge cases", () => {
  // Test with empty string key
  const emptyKey = DuckTypingPromptVariables.fromRecord({ "": "value" });
  assertEquals(emptyKey.ok, false);

  // Test with whitespace-only key
  const whitespaceKey = DuckTypingPromptVariables.fromRecord({ "   ": "value" });
  assertEquals(whitespaceKey.ok, false);

  // Test map function that returns non-string
  const vars = DuckTypingPromptVariables.fromRecord({ a: "1" });
  assertEquals(vars.ok, true);

  if (vars.ok) {
    const invalidMap = vars.data.map((key, value) => parseInt(value) as any);
    assertEquals(invalidMap.ok, false);
  }

  // Test invalid JSON
  const invalidJson = DuckTypingPromptVariables.fromJSON("invalid json");
  assertEquals(invalidJson.ok, false);
});
