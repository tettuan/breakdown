/**
 * @fileoverview Structure tests for PromptVariableSource
 *
 * Tests structural integrity and relationships within the PromptVariableSource
 * system including:
 * - Type relationships and constraints
 * - Data structure integrity
 * - Interface consistency
 * - Enum value consistency
 *
 * @module types/prompt_variable_source_test
 */

import { assertEquals, assertThrows as _assertThrows } from "@std/assert";
import {
  DataSource,
  PromptVariableSource,
  PromptVariableSourceFactory,
  SourceMetadata,
  SourceValidationError,
  SourceValidationResult as _SourceValidationResult,
  validateSource,
} from "./prompt_variable_source.ts";

Deno.test("PromptVariableSource - Structure: PromptVariableSource interface consistency", () => {
  // Test that all optional fields can be omitted
  const minimal: PromptVariableSource = {};
  assertEquals(typeof minimal, "object");

  // Test that all fields can be present
  const complete: PromptVariableSource = {
    directive: "test",
    layer: "test",
    inputFile: "test.md",
    destinationPath: "output.md",
    schemaFile: "schema.json",
    stdinContent: "content",
    userVariables: { key: "value" },
    metadata: {
      source: DataSource.CLI,
      timestamp: new Date(),
      originalArgs: ["arg1", "arg2"],
      configProfile: "profile",
    },
  };

  // Verify all fields have expected types
  assertEquals(typeof complete.directive, "string");
  assertEquals(typeof complete.layer, "string");
  assertEquals(typeof complete.inputFile, "string");
  assertEquals(typeof complete.destinationPath, "string");
  assertEquals(typeof complete.schemaFile, "string");
  assertEquals(typeof complete.stdinContent, "string");
  assertEquals(typeof complete.userVariables, "object");
  assertEquals(typeof complete.metadata, "object");
});

Deno.test("PromptVariableSource - Structure: SourceMetadata interface consistency", () => {
  const requiredMetadata: SourceMetadata = {
    source: DataSource.CLI,
    timestamp: new Date(),
  };

  assertEquals(requiredMetadata.source, DataSource.CLI);
  assertEquals(requiredMetadata.timestamp instanceof Date, true);

  const completeMetadata: SourceMetadata = {
    source: DataSource.CONFIG,
    timestamp: new Date(),
    originalArgs: ["--directive", "test"],
    configProfile: "development",
  };

  assertEquals(Array.isArray(completeMetadata.originalArgs), true);
  assertEquals(typeof completeMetadata.configProfile, "string");
});

Deno.test("PromptVariableSource - Structure: DataSource enum consistency", () => {
  // Test that all enum values are strings
  assertEquals(typeof DataSource.CLI, "string");
  assertEquals(typeof DataSource.CONFIG, "string");
  assertEquals(typeof DataSource.STDIN, "string");
  assertEquals(typeof DataSource.DEFAULT, "string");
  assertEquals(typeof DataSource.MERGED, "string");

  // Test that enum values are distinct
  const values = Object.values(DataSource);
  const uniqueValues = new Set(values);
  assertEquals(values.length, uniqueValues.size);

  // Test specific values match expected strings
  assertEquals(DataSource.CLI, "cli");
  assertEquals(DataSource.CONFIG, "config");
  assertEquals(DataSource.STDIN, "stdin");
  assertEquals(DataSource.DEFAULT, "default");
  assertEquals(DataSource.MERGED, "merged");
});

Deno.test("PromptVariableSource - Structure: SourceValidationError interface consistency", () => {
  const validError: SourceValidationError = {
    field: "directive",
    message: "Test error message",
    source: DataSource.CLI,
  };

  // Field should be a key of PromptVariableSource
  const validFields: Array<keyof PromptVariableSource> = [
    "directive",
    "layer",
    "inputFile",
    "destinationPath",
    "schemaFile",
    "stdinContent",
    "userVariables",
    "metadata",
  ];

  assertEquals(validFields.includes(validError.field), true);
  assertEquals(typeof validError.message, "string");
  assertEquals(typeof validError.source, "string");

  // Test with minimal error (source is optional)
  const minimalError: SourceValidationError = {
    field: "layer",
    message: "Layer is required",
  };

  assertEquals(typeof minimalError.field, "string");
  assertEquals(typeof minimalError.message, "string");
  assertEquals(minimalError.source, undefined);
});

Deno.test("PromptVariableSource - Structure: SourceValidationResult type consistency", () => {
  const source: PromptVariableSource = {
    directive: "test",
    inputFile: "test.md",
    metadata: { source: DataSource.CLI, timestamp: new Date() },
  };

  // Test success result structure
  const successResult = validateSource(source);
  assertEquals(typeof successResult.ok, "boolean");

  if (successResult.ok) {
    assertEquals(typeof successResult.data, "object");
    assertEquals("error" in successResult, false);
  }

  // Test error result structure
  const invalidSource: PromptVariableSource = {};
  const errorResult = validateSource(invalidSource);

  if (!errorResult.ok) {
    assertEquals(Array.isArray(errorResult.error), true);
    assertEquals("data" in errorResult, false);

    // Each error should have proper structure
    errorResult.error.forEach((error) => {
      assertEquals(typeof error.field, "string");
      assertEquals(typeof error.message, "string");
    });
  }
});

Deno.test("PromptVariableSource - Structure: Factory method parameter consistency", () => {
  // Test fromCLI parameter structure
  const cliParams = {
    directive: "test",
    layer: "task",
    fromFile: "input.md",
    destinationFile: "output.md",
    userVariables: { key: "value" },
    originalArgs: ["--directive", "test"],
  };

  const cliSource = PromptVariableSourceFactory.fromCLI(cliParams);
  assertEquals(cliSource.directive, cliParams.directive);
  assertEquals(cliSource.layer, cliParams.layer);
  assertEquals(cliSource.inputFile, cliParams.fromFile);
  assertEquals(cliSource.destinationPath, cliParams.destinationFile);

  // Test fromConfig parameter structure
  const configParams = {
    directive: "summary",
    layer: "project",
    promptDir: "/path/to/prompts",
    profile: "development",
  };

  const configSource = PromptVariableSourceFactory.fromConfig(configParams);
  assertEquals(configSource.directive, configParams.directive);
  assertEquals(configSource.layer, configParams.layer);

  // Test fromStdin parameter consistency
  const stdinContent = "test content";
  const stdinSource = PromptVariableSourceFactory.fromStdin(stdinContent);
  assertEquals(stdinSource.stdinContent, stdinContent);
});

Deno.test("PromptVariableSource - Structure: userVariables Record consistency", () => {
  const source: PromptVariableSource = {
    userVariables: {
      stringKey: "stringValue",
      anotherKey: "anotherValue",
    },
  };

  // Should be Record<string, string>
  if (source.userVariables) {
    Object.entries(source.userVariables).forEach(([key, value]) => {
      assertEquals(typeof key, "string");
      assertEquals(typeof value, "string");
    });
  }
});

Deno.test("PromptVariableSource - Structure: timestamp field consistency", () => {
  const source1 = PromptVariableSourceFactory.fromCLI({ directive: "test" });
  const source2 = PromptVariableSourceFactory.fromConfig({ directive: "test" });
  const source3 = PromptVariableSourceFactory.fromStdin("content");

  // All factory methods should create Date objects for timestamp
  assertEquals(source1.metadata?.timestamp instanceof Date, true);
  assertEquals(source2.metadata?.timestamp instanceof Date, true);
  assertEquals(source3.metadata?.timestamp instanceof Date, true);

  // Timestamps should be recent (within last minute)
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  assertEquals(source1.metadata!.timestamp >= oneMinuteAgo, true);
  assertEquals(source1.metadata!.timestamp <= now, true);
});

Deno.test("PromptVariableSource - Structure: merge result structure consistency", () => {
  const source1 = PromptVariableSourceFactory.fromConfig({ directive: "test1" });
  const source2 = PromptVariableSourceFactory.fromCLI({ layer: "test2" });

  const merged = PromptVariableSourceFactory.merge(source1, source2);

  // Merged result should have proper structure
  assertEquals(typeof merged, "object");
  assertEquals(merged.metadata?.source, DataSource.MERGED);
  assertEquals(merged.metadata?.timestamp instanceof Date, true);

  // Should preserve data from both sources appropriately
  assertEquals(merged.directive, "test1");
  assertEquals(merged.layer, "test2");
});

Deno.test("PromptVariableSource - Structure: validation error field names match interface", () => {
  const source: PromptVariableSource = {};
  const result = validateSource(source);

  if (!result.ok) {
    result.error.forEach((error) => {
      // Error field should be a valid key of PromptVariableSource
      const validKeys: Array<keyof PromptVariableSource> = [
        "directive",
        "layer",
        "inputFile",
        "destinationPath",
        "schemaFile",
        "stdinContent",
        "userVariables",
        "metadata",
      ];

      assertEquals(validKeys.includes(error.field), true);
    });
  }
});

Deno.test("PromptVariableSource - Structure: source metadata relationship consistency", () => {
  const sources = [
    PromptVariableSourceFactory.fromCLI({ directive: "test" }),
    PromptVariableSourceFactory.fromConfig({ directive: "test" }),
    PromptVariableSourceFactory.fromStdin("content"),
  ];

  sources.forEach((source) => {
    // All sources should have metadata
    assertEquals(source.metadata !== undefined, true);

    // Metadata should have required fields
    assertEquals(typeof source.metadata!.source, "string");
    assertEquals(source.metadata!.timestamp instanceof Date, true);

    // Source field should be valid DataSource enum value
    const validSources = Object.values(DataSource);
    assertEquals(validSources.includes(source.metadata!.source), true);
  });
});

Deno.test("PromptVariableSource - Structure: empty object handling", () => {
  // Empty PromptVariableSource should be valid structurally
  const empty: PromptVariableSource = {};
  assertEquals(typeof empty, "object");
  assertEquals(Object.keys(empty).length, 0);

  // Should be able to merge with empty sources
  const normalSource = PromptVariableSourceFactory.fromCLI({ directive: "test" });
  const merged = PromptVariableSourceFactory.merge(empty, normalSource);

  assertEquals(typeof merged, "object");
  assertEquals(merged.directive, "test");
});
