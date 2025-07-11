/**
 * @fileoverview Structure tests for OptionsNormalizer
 *
 * Tests focus on data structure integrity:
 * - Type safety and interface contracts
 * - Schema validation of normalized options
 * - Data transformation consistency
 *
 * @module lib/validator/2_structure_options_normalizer_test
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  type NormalizationConfig,
  type NormalizedOptions,
  OptionsNormalizer,
} from "./options_normalizer.ts";
import { isOk } from "../types/result.ts";

Deno.test("2_structure: OptionsNormalizer - normalized options structure integrity", () => {
  const normalizer = new OptionsNormalizer();
  const result = normalizer.normalize({});

  assertExists(result);
  assertEquals(isOk(result), true);

  if (isOk(result)) {
    const normalized = result.data;

    // Verify all required fields exist
    assertExists(normalized.inputPath);
    assertExists(normalized.outputPath);

    // Verify field types
    assertEquals(typeof normalized.inputPath, "string");
    assertEquals(typeof normalized.outputPath, "string");

    // Optional fields should be string or undefined
    if (normalized.schemaPath !== undefined) {
      assertEquals(typeof normalized.schemaPath, "string");
    }
    if (normalized.promptPath !== undefined) {
      assertEquals(typeof normalized.promptPath, "string");
    }
    if (normalized.stdin !== undefined) {
      assertEquals(typeof normalized.stdin, "string");
    }
    if (normalized.profile !== undefined) {
      assertEquals(typeof normalized.profile, "string");
    }
  }
});

Deno.test("2_structure: OptionsNormalizer - configuration structure validation", () => {
  const config: NormalizationConfig = {
    defaultInput: "custom-input",
    defaultOutput: "custom-output",
    aliases: {
      input: ["customInput"],
      output: ["customOutput"],
    },
  };

  const normalizer = new OptionsNormalizer(config);
  const result = normalizer.normalize({});

  if (isOk(result)) {
    // Verify defaults are applied correctly
    assertEquals(result.data.inputPath, "custom-input");
    assertEquals(result.data.outputPath, "custom-output");
  }
});

Deno.test("2_structure: OptionsNormalizer - alias structure and type coercion", () => {
  const normalizer = new OptionsNormalizer();

  // Test string values
  const stringResult = normalizer.normalize({
    fromFile: "input.txt",
    destinationFile: "output.txt",
    schemaFile: "schema.json",
    promptFile: "prompt.md",
  });

  if (isOk(stringResult)) {
    assertEquals(stringResult.data.inputPath, "input.txt");
    assertEquals(stringResult.data.outputPath, "output.txt");
    assertEquals(stringResult.data.schemaPath, "schema.json");
    assertEquals(stringResult.data.promptPath, "prompt.md");
  }

  // Test number coercion
  const numberResult = normalizer.normalize({
    fromFile: 123,
    destinationFile: 456,
  });

  if (isOk(numberResult)) {
    assertEquals(numberResult.data.inputPath, "123");
    assertEquals(numberResult.data.outputPath, "456");
  }

  // Test null/undefined handling
  const nullResult = normalizer.normalize({
    fromFile: null,
    destinationFile: undefined,
  });

  if (isOk(nullResult)) {
    // Should fall back to defaults
    assertEquals(nullResult.data.inputPath, "stdin");
    assertEquals(nullResult.data.outputPath, "stdout");
  }
});

Deno.test("2_structure: OptionsNormalizer - multiple alias resolution order", () => {
  const normalizer = new OptionsNormalizer();

  // When multiple aliases are present, first one in options should win
  const result = normalizer.normalize({
    fromFile: "from-file.txt",
    input: "input.txt",
    i: "i.txt",
  });

  if (isOk(result)) {
    // Should use the first found value based on key order in options
    assertExists(result.data.inputPath);
    assertEquals(["from-file.txt", "input.txt", "i.txt"].includes(result.data.inputPath), true);
  }
});

Deno.test("2_structure: OptionsNormalizer - stdin/stdout detection structure", () => {
  const normalizer = new OptionsNormalizer();

  // Test stdin detection
  const stdinOptions1: NormalizedOptions = {
    inputPath: "stdin",
    outputPath: "output.txt",
  };
  assertEquals(normalizer.isStdinInput(stdinOptions1), true);

  const stdinOptions2: NormalizedOptions = {
    inputPath: "-",
    outputPath: "output.txt",
  };
  assertEquals(normalizer.isStdinInput(stdinOptions2), true);

  const fileOptions: NormalizedOptions = {
    inputPath: "file.txt",
    outputPath: "output.txt",
  };
  assertEquals(normalizer.isStdinInput(fileOptions), false);

  // Test stdout detection
  const stdoutOptions1: NormalizedOptions = {
    inputPath: "input.txt",
    outputPath: "stdout",
  };
  assertEquals(normalizer.isStdoutOutput(stdoutOptions1), true);

  const stdoutOptions2: NormalizedOptions = {
    inputPath: "input.txt",
    outputPath: "-",
  };
  assertEquals(normalizer.isStdoutOutput(stdoutOptions2), true);
});

Deno.test("2_structure: OptionsNormalizer - alias lookup structure", () => {
  const normalizer = new OptionsNormalizer();

  // Test getAliases returns correct structure
  const inputAliases = normalizer.getAliases("input");
  assertExists(inputAliases);
  assertEquals(Array.isArray(inputAliases), true);
  assertEquals(inputAliases.length > 0, true);

  // Test isAliasFor structure
  assertEquals(normalizer.isAliasFor("fromFile", "input"), true);
  assertEquals(normalizer.isAliasFor("destinationFile", "output"), true);
  assertEquals(normalizer.isAliasFor("schemaFile", "schema"), true);
  assertEquals(normalizer.isAliasFor("notAnAlias", "input"), false);
});

Deno.test("2_structure: OptionsNormalizer - complete option structure validation", () => {
  const normalizer = new OptionsNormalizer();

  const completeOptions = {
    fromFile: "input.md",
    destinationFile: "output.json",
    schemaFile: "schema.json",
    promptFile: "template.md",
    input_text: "some stdin content",
    profile: "production",
  };

  const result = normalizer.normalize(completeOptions);

  if (isOk(result)) {
    const normalized = result.data;

    // Verify complete structure
    assertEquals(normalized.inputPath, "input.md");
    assertEquals(normalized.outputPath, "output.json");
    assertEquals(normalized.schemaPath, "schema.json");
    assertEquals(normalized.promptPath, "template.md");
    assertEquals(normalized.stdin, "some stdin content");
    assertEquals(normalized.profile, "production");

    // Verify no extra fields
    const expectedKeys = [
      "inputPath",
      "outputPath",
      "schemaPath",
      "promptPath",
      "stdin",
      "profile",
    ];
    const actualKeys = Object.keys(normalized);
    assertEquals(actualKeys.sort(), expectedKeys.sort());
  }
});
