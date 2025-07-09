/**
 * @fileoverview Tests for StdinPromptVariables
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { StdinPromptVariables } from "./stdin_prompt_variables.ts";

Deno.test("StdinPromptVariables - create with valid input", () => {
  const result = StdinPromptVariables.create("Hello, world!");

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record, { input_text: "Hello, world!" });
  }
});

Deno.test("StdinPromptVariables - create with empty input", () => {
  const result = StdinPromptVariables.create("");

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.message, "Standard input cannot be empty");
  }
});

Deno.test("StdinPromptVariables - has and get methods", () => {
  const result = StdinPromptVariables.create("Test input");

  assertEquals(result.ok, true);
  if (result.ok) {
    const variables = result.data;

    // Check has method
    assertEquals(variables.has("input_text"), true);
    assertEquals(variables.has("invalid_name"), false);

    // Check get method
    assertEquals(variables.get("input_text"), "Test input");
    assertEquals(variables.get("invalid_name"), undefined);
  }
});

Deno.test("StdinPromptVariables - getVariables returns array", () => {
  const result = StdinPromptVariables.create("Test content");

  assertEquals(result.ok, true);
  if (result.ok) {
    const variables = result.data.getVariables();
    assertExists(variables);
    assertEquals(variables.length, 1);
  }
});
