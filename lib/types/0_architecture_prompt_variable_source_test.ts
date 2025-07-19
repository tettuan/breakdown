/**
 * @fileoverview Architecture tests for PromptVariableSource
 *
 * Tests architectural constraints and completeness of the PromptVariableSource
 * system including Factory methods, merge functionality, and validation.
 *
 * @module types/prompt_variable_source_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  DataSource,
  PromptVariableSource,
  PromptVariableSourceFactory,
  SourceMetadata,
  SourceValidationError,
  validateSource,
} from "./prompt_variable_source.ts";

Deno.test("PromptVariableSource - Architecture: Factory completeness", () => {
  // Factory should have all required static methods
  assertEquals(typeof PromptVariableSourceFactory.fromCLI, "function");
  assertEquals(typeof PromptVariableSourceFactory.fromConfig, "function");
  assertEquals(typeof PromptVariableSourceFactory.fromStdin, "function");
  assertEquals(typeof PromptVariableSourceFactory.merge, "function");
});

Deno.test("PromptVariableSource - Architecture: Interface completeness", () => {
  // Create a complete PromptVariableSource to verify all fields are accessible
  const source: PromptVariableSource = {
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
      originalArgs: ["--directive", "test"],
      configProfile: "default",
    },
  };

  // Verify all fields are accessible
  assertExists(source.directive);
  assertExists(source.layer);
  assertExists(source.inputFile);
  assertExists(source.destinationPath);
  assertExists(source.schemaFile);
  assertExists(source.stdinContent);
  assertExists(source.userVariables);
  assertExists(source.metadata);
});

Deno.test("PromptVariableSource - Architecture: SourceMetadata completeness", () => {
  const metadata: SourceMetadata = {
    source: DataSource.CLI,
    timestamp: new Date(),
    originalArgs: ["--directive", "test"],
    configProfile: "default",
  };

  // Verify all metadata fields are accessible
  assertEquals(metadata.source, DataSource.CLI);
  assertExists(metadata.timestamp);
  assertExists(metadata.originalArgs);
  assertExists(metadata.configProfile);
});

Deno.test("PromptVariableSource - Architecture: DataSource enum completeness", () => {
  // Verify all expected data sources exist
  assertEquals(DataSource.CLI, "cli");
  assertEquals(DataSource.CONFIG, "config");
  assertEquals(DataSource.STDIN, "stdin");
  assertEquals(DataSource.DEFAULT, "default");
  assertEquals(DataSource.MERGED, "merged");
});

Deno.test("PromptVariableSource - Architecture: SourceValidationError completeness", () => {
  const error: SourceValidationError = {
    field: "directive",
    message: "Required field missing",
    source: DataSource.CLI,
  };

  // Verify all error fields are accessible
  assertEquals(error.field, "directive");
  assertEquals(error.message, "Required field missing");
  assertEquals(error.source, DataSource.CLI);
});

Deno.test("PromptVariableSource - Architecture: validateSource function exists", () => {
  assertEquals(typeof validateSource, "function");

  // Test basic validation structure
  const source: PromptVariableSource = {
    directive: "test",
    inputFile: "test.md",
    metadata: {
      source: DataSource.CLI,
      timestamp: new Date(),
    },
  };

  const result = validateSource(source);
  assertEquals(typeof result, "object");
  assertEquals(typeof result.ok, "boolean");
});

Deno.test("PromptVariableSource - Architecture: Factory methods return proper types", () => {
  // Test fromCLI
  const cliSource = PromptVariableSourceFactory.fromCLI({
    directive: "test",
    layer: "task",
  });
  assertEquals(cliSource.metadata?.source, DataSource.CLI);
  assertExists(cliSource.metadata?.timestamp);

  // Test fromConfig
  const configSource = PromptVariableSourceFactory.fromConfig({
    directive: "test",
    profile: "default",
  });
  assertEquals(configSource.metadata?.source, DataSource.CONFIG);
  assertExists(configSource.metadata?.timestamp);

  // Test fromStdin
  const stdinSource = PromptVariableSourceFactory.fromStdin("content");
  assertEquals(stdinSource.metadata?.source, DataSource.STDIN);
  assertEquals(stdinSource.stdinContent, "content");
  assertExists(stdinSource.metadata?.timestamp);
});

Deno.test("PromptVariableSource - Architecture: merge function completeness", () => {
  const source1 = PromptVariableSourceFactory.fromConfig({
    directive: "config-directive",
  });

  const source2 = PromptVariableSourceFactory.fromCLI({
    directive: "cli-directive",
    layer: "task",
  });

  const merged = PromptVariableSourceFactory.merge(source1, source2);

  // CLI should override config
  assertEquals(merged.directive, "cli-directive");
  assertEquals(merged.layer, "task");
  assertEquals(merged.metadata?.source, DataSource.MERGED);
  assertExists(merged.metadata?.timestamp);
});

Deno.test("PromptVariableSource - Architecture: All field types are properly optional", () => {
  // Should be able to create with minimal fields
  const minimal: PromptVariableSource = {};
  assertEquals(typeof minimal, "object");

  // Should be able to create with only metadata
  const withMetadata: PromptVariableSource = {
    metadata: {
      source: DataSource.DEFAULT,
      timestamp: new Date(),
    },
  };
  assertExists(withMetadata.metadata);
});

Deno.test("PromptVariableSource - Architecture: Type safety constraints", () => {
  // userVariables should be Record<string, string>
  const sourceWithUserVars: PromptVariableSource = {
    userVariables: {
      key1: "value1",
      key2: "value2",
    },
  };

  assertEquals(typeof sourceWithUserVars.userVariables?.key1, "string");
  assertEquals(typeof sourceWithUserVars.userVariables?.key2, "string");
});
