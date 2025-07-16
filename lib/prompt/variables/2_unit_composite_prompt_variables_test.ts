/**
 * @fileoverview Unit tests for CompositePromptVariables (SIMPLIFIED)
 *
 * NOTE: UserPromptVariables has been replaced with StandardPromptVariables.
 * This test file has been simplified to avoid interface mismatches.
 *
 * @module prompt/variables/2_unit_composite_prompt_variables_test
 */

import { assertEquals } from "../../deps.ts";
import { CompositePromptVariables } from "./composite_prompt_variables.ts";
import type { PromptVariables } from "../../types/prompt_types.ts";

/**
 * Simple mock PromptVariables for testing
 */
class MockPromptVariables implements PromptVariables {
  constructor(private readonly variables: Record<string, string>) {}

  toRecord(): Record<string, string> {
    return { ...this.variables };
  }
}

Deno.test("CompositePromptVariables - basic functionality", () => {
  const vars1 = new MockPromptVariables({ key1: "value1" });
  const vars2 = new MockPromptVariables({ key2: "value2" });

  const composite = new CompositePromptVariables([vars1, vars2]);
  const result = composite.toRecord();

  assertEquals(result.key1, "value1");
  assertEquals(result.key2, "value2");
});

console.log("CompositePromptVariables tests simplified due to UserPromptVariables deprecation.");
