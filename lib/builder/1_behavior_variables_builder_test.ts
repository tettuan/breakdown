/**
 * @fileoverview Behavior tests for VariablesBuilder module
 * Testing business logic and expected behaviors with Result-based Totality
 *
 * Behavior tests verify:
 * - Business rules and invariants (uv- prefix requirement, duplicates)
 * - Error handling with Result type
 * - Edge cases and boundary conditions
 * - Domain boundary integration (Factory/Builder pattern)
 */

import { assertEquals, assertExists } from "@std/assert";
import { VariablesBuilder } from "./variables_builder.ts";
import type { FactoryResolvedValues } from "./variables_builder.ts";

Deno.test("1_behavior: VariablesBuilder successfully builds with all variable types", () => {
  const builder = new VariablesBuilder();

  const result = builder
    .addStandardVariable("input_text_file", "input.txt")
    .addStandardVariable("destination_path", "/output/path.txt")
    .addFilePathVariable("schema_file", "/schema/schema.json")
    .addStdinVariable("This is stdin content")
    .addUserVariable("uv-custom", "custom value")
    .build();

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 5);
  }
});

Deno.test("1_behavior: VariablesBuilder handles duplicate variable names correctly", () => {
  const builder = new VariablesBuilder();

  const result = builder
    .addStandardVariable("input_text_file", "first.txt")
    .addStandardVariable("input_text_file", "second.txt") // Duplicate
    .build();

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.length, 1);
    assertEquals(result.error[0].kind, "DuplicateVariable");
    const dupError = result.error[0];
    if (dupError.kind === "DuplicateVariable") {
      assertEquals(dupError.name, "input_text_file");
    }
  }
});

Deno.test("1_behavior: VariablesBuilder enforces uv- prefix for user variables", () => {
  const builder = new VariablesBuilder();

  // Without uv- prefix
  const result1 = builder
    .addUserVariable("custom", "value")
    .build();

  assertEquals(result1.ok, false);
  if (!result1.ok) {
    assertEquals(result1.error[0].kind, "InvalidPrefix");
    const prefixError = result1.error[0];
    if (prefixError.kind === "InvalidPrefix") {
      assertEquals(prefixError.expectedPrefix, "uv-");
    }
  }

  // With uv- prefix
  builder.clear();
  const result2 = builder
    .addUserVariable("uv-custom", "value")
    .build();

  assertEquals(result2.ok, true);
});

Deno.test("1_behavior: VariablesBuilder accumulates multiple errors", () => {
  const builder = new VariablesBuilder();

  const result = builder
    .addUserVariable("invalid1", "value1") // Missing uv-
    .addUserVariable("invalid2", "value2") // Missing uv-
    .addStandardVariable("input_text_file", "file.txt")
    .addStandardVariable("input_text_file", "duplicate.txt") // Duplicate
    .build();

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.length, 3);
    // Two InvalidPrefix errors and one DuplicateVariable error
    const invalidPrefixErrors = result.error.filter((e) => e.kind === "InvalidPrefix");
    const duplicateErrors = result.error.filter((e) => e.kind === "DuplicateVariable");
    assertEquals(invalidPrefixErrors.length, 2);
    assertEquals(duplicateErrors.length, 1);
  }
});

Deno.test("1_behavior: VariablesBuilder correctly integrates with Factory values", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "/data/input.txt",
    outputFilePath: "/output/result.txt",
    schemaFilePath: "/schema/validation.json",
    customVariables: {
      "uv-author": "test-user",
      "uv-version": "1.0.0",
    },
    inputText: "Sample stdin text",
  };

  const builder = VariablesBuilder.fromFactoryValues(factoryValues);
  const result = builder.build();

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 6); // 3 standard + 1 file + 1 stdin + 2 custom

    // Verify toRecord() maintains uv- prefix for user variables
    const record = builder.toRecord();
    assertEquals(record["input_text_file"], "input.txt");
    assertEquals(record["destination_path"], "/output/result.txt");
    assertEquals(record["schema_file"], "/schema/validation.json");
    assertEquals(record["input_text"], "Sample stdin text");
    assertEquals(record["uv-author"], "test-user");
    assertEquals(record["uv-version"], "1.0.0");
  }
});

Deno.test("1_behavior: VariablesBuilder skips stdin when input is from file", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "-", // Stdin indicator
    outputFilePath: "/output/result.txt",
    schemaFilePath: "/schema/validation.json",
  };

  const builder = VariablesBuilder.fromFactoryValues(factoryValues);
  const result = builder.build();

  assertEquals(result.ok, true);
  if (result.ok) {
    // Should not add input_text_file when inputFilePath is "-"
    const record = builder.toRecord();
    assertEquals(record["input_text_file"], undefined);
  }
});

Deno.test("1_behavior: VariablesBuilder validates Factory values before processing", () => {
  const builder = new VariablesBuilder();

  // Missing required fields
  const invalidFactory: FactoryResolvedValues = {
    promptFilePath: "", // Empty
    inputFilePath: "/input.txt",
    outputFilePath: "", // Empty
    schemaFilePath: "/schema.json",
  };

  const validationResult = builder.validateFactoryValues(invalidFactory);
  assertEquals(validationResult.ok, false);
  if (!validationResult.ok) {
    assertEquals(validationResult.error.length, 2);
    const missingFields = validationResult.error.filter((e) => e.kind === "FactoryValueMissing");
    assertEquals(missingFields.length, 2);
  }
});

Deno.test("1_behavior: VariablesBuilder handles custom variables without uv- prefix validation", () => {
  const builder = new VariablesBuilder();

  const customVars = {
    "template_var1": "value1",
    "template_var2": "value2",
    "": "empty-name", // Should error
    "valid": "", // Empty value should be skipped
  };

  const result = builder
    .addCustomVariables(customVars)
    .build();

  assertEquals(result.ok, false); // Due to empty name
  if (!result.ok) {
    assertEquals(result.error.length, 1);
    assertEquals(result.error[0].kind, "DuplicateVariable");
  }
});

Deno.test("1_behavior: VariablesBuilder toTemplateRecord removes uv- prefix", () => {
  const builder = new VariablesBuilder();

  const result = builder
    .addStandardVariable("input_text_file", "file.txt")
    .addUserVariable("uv-custom", "custom value")
    .build();

  assertEquals(result.ok, true);
  if (result.ok) {
    const templateRecord = builder.toTemplateRecord();
    // UserVariable.toRecord() removes uv- prefix
    assertEquals(templateRecord["custom"], "custom value");
    assertEquals(templateRecord["uv-custom"], undefined);
    assertEquals(templateRecord["input_text_file"], "file.txt");
  }
});

Deno.test("1_behavior: VariablesBuilder clear() resets all state", () => {
  const builder = new VariablesBuilder();

  // Add some variables and errors
  builder
    .addStandardVariable("input_text_file", "file.txt")
    .addUserVariable("invalid", "value") // Error
    .addStandardVariable("input_text_file", "duplicate.txt"); // Error

  assertEquals(builder.getVariableCount(), 1);
  assertEquals(builder.getErrorCount(), 2);

  // Clear and verify reset
  builder.clear();
  assertEquals(builder.getVariableCount(), 0);
  assertEquals(builder.getErrorCount(), 0);

  // Should be able to build successfully after clear
  const result = builder
    .addStandardVariable("input_text_file", "new.txt") // Must use valid standard variable name
    .build();

  assertEquals(result.ok, true);
});

Deno.test("1_behavior: VariablesBuilder handles partial Factory values incrementally", () => {
  const builder = new VariablesBuilder();

  // Add values incrementally
  builder.addFromPartialFactoryValues({
    inputFilePath: "/input/file1.txt",
  });

  builder.addFromPartialFactoryValues({
    outputFilePath: "/output/result.txt",
    customVariables: { "uv-step": "1" },
  });

  builder.addFromPartialFactoryValues({
    schemaFilePath: "/schema/validate.json",
    inputText: "Additional stdin content",
  });

  const result = builder.build();
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.length, 5);
    const record = builder.toRecord();
    assertEquals(record["input_text_file"], "file1.txt");
    assertEquals(record["destination_path"], "/output/result.txt");
    assertEquals(record["uv-step"], "1");
  }
});

Deno.test("1_behavior: VariablesBuilder handles edge cases for file paths", () => {
  const builder = new VariablesBuilder();

  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "", // Empty string
    outputFilePath: "/output/result.txt",
    schemaFilePath: "", // Empty string
  };

  const result = builder
    .addFromFactoryValues(factoryValues)
    .build();

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = builder.toRecord();
    // Empty paths should be skipped
    assertEquals(record["input_text_file"], undefined);
    assertEquals(record["schema_file"], undefined);
    assertEquals(record["destination_path"], "/output/result.txt");
  }
});

Deno.test("1_behavior: VariablesBuilder validates custom variables in Factory values", () => {
  const factoryValues: FactoryResolvedValues = {
    promptFilePath: "/prompts/template.md",
    inputFilePath: "/input.txt",
    outputFilePath: "/output.txt",
    schemaFilePath: "/schema.json",
    customVariables: {
      "invalid-var": "value", // Missing uv- prefix
      "uv-valid": "value",
    },
  };

  const builder = new VariablesBuilder();
  const validationResult = builder.validateFactoryValues(factoryValues);

  assertEquals(validationResult.ok, false);
  if (!validationResult.ok) {
    const invalidPrefixErrors = validationResult.error.filter((e) => e.kind === "InvalidPrefix");
    assertEquals(invalidPrefixErrors.length, 1);
    assertEquals(invalidPrefixErrors[0].name, "invalid-var");
  }
});

Deno.test("1_behavior: VariablesBuilder handles Result pattern propagation", () => {
  const builder = new VariablesBuilder();

  // Test method chaining with errors
  const errorBuilder = builder
    .addStandardVariable("", "empty-name") // Should error
    .addFilePathVariable("schema_file", "") // Should error
    .addUserVariable("no-prefix", "value"); // Should error

  const result = errorBuilder.build();
  assertEquals(result.ok, false);
  if (!result.ok) {
    // All errors should be accumulated
    assertEquals(result.error.length >= 3, true);
  }
});

Deno.test("1_behavior: VariablesBuilder respects domain boundaries", () => {
  // Test that builder correctly delegates to Smart Constructors
  const builder = new VariablesBuilder();

  // Standard variable validation is delegated to StandardVariable
  const result1 = builder
    .addStandardVariable("invalid_name", "value") // Not input_text_file or destination_path
    .build();

  assertEquals(result1.ok, false);
  if (!result1.ok) {
    // The error comes from StandardVariable's validation
    assertExists(result1.error.find((e) => e.kind === "InvalidName"));
  }

  // File path variable validation is delegated to FilePathVariable
  builder.clear();
  const result2 = builder
    .addFilePathVariable("not_schema_file", "/path/to/file") // Must be schema_file
    .build();

  assertEquals(result2.ok, false);
  if (!result2.ok) {
    assertExists(result2.error.find((e) => e.kind === "InvalidName"));
  }
});
