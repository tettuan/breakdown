/**
 * @fileoverview Behavior tests for PromptVariableSource
 * 
 * Tests the behavioral aspects of PromptVariableSource including:
 * - Factory method behaviors
 * - Merge priority logic
 * - Validation logic
 * - Data transformation behaviors
 * 
 * @module types/prompt_variable_source_test
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import {
  DataSource,
  PromptVariableSource,
  PromptVariableSourceFactory,
  validateSource,
} from "./prompt_variable_source.ts";

Deno.test("PromptVariableSource - Behavior: fromCLI creates proper structure", () => {
  const args = {
    directive: "to",
    layer: "task",
    fromFile: "input.md",
    destinationFile: "output.md",
    userVariables: { key1: "value1", key2: "value2" },
    originalArgs: ["--directive", "to", "--layer", "task"],
  };

  const source = PromptVariableSourceFactory.fromCLI(args);

  assertEquals(source.directive, "to");
  assertEquals(source.layer, "task");
  assertEquals(source.inputFile, "input.md");
  assertEquals(source.destinationPath, "output.md");
  assertEquals(source.userVariables?.key1, "value1");
  assertEquals(source.userVariables?.key2, "value2");
  assertEquals(source.metadata?.source, DataSource.CLI);
  assertEquals(source.metadata?.originalArgs, args.originalArgs);
});

Deno.test("PromptVariableSource - Behavior: fromConfig creates proper structure", () => {
  const config = {
    directive: "summary",
    layer: "project",
    promptDir: "/path/to/prompts",
    profile: "development",
  };

  const source = PromptVariableSourceFactory.fromConfig(config);

  assertEquals(source.directive, "summary");
  assertEquals(source.layer, "project");
  assertEquals(source.metadata?.source, DataSource.CONFIG);
  assertEquals(source.metadata?.configProfile, "development");
});

Deno.test("PromptVariableSource - Behavior: fromStdin creates proper structure", () => {
  const content = "This is test stdin content\nwith multiple lines";

  const source = PromptVariableSourceFactory.fromStdin(content);

  assertEquals(source.stdinContent, content);
  assertEquals(source.metadata?.source, DataSource.STDIN);
});

Deno.test("PromptVariableSource - Behavior: merge respects priority order", () => {
  // Create sources with different priorities
  const defaultSource: PromptVariableSource = {
    directive: "default-directive",
    layer: "default-layer",
    metadata: { source: DataSource.DEFAULT, timestamp: new Date() },
  };

  const configSource = PromptVariableSourceFactory.fromConfig({
    directive: "config-directive",
    layer: "config-layer",
  });

  const stdinSource = PromptVariableSourceFactory.fromStdin("stdin content");

  const cliSource = PromptVariableSourceFactory.fromCLI({
    directive: "cli-directive",
    layer: "cli-layer",
  });

  const merged = PromptVariableSourceFactory.merge(
    defaultSource,
    configSource,
    stdinSource,
    cliSource,
  );

  // CLI should win for directive and layer
  assertEquals(merged.directive, "cli-directive");
  assertEquals(merged.layer, "cli-layer");
  
  // STDIN content should be preserved
  assertEquals(merged.stdinContent, "stdin content");
  
  // Merged metadata
  assertEquals(merged.metadata?.source, DataSource.MERGED);
});

Deno.test("PromptVariableSource - Behavior: merge handles partial overrides", () => {
  const configSource = PromptVariableSourceFactory.fromConfig({
    directive: "config-directive",
    layer: "config-layer",
  });

  const cliSource = PromptVariableSourceFactory.fromCLI({
    directive: "cli-directive",
    // Note: no layer specified
    userVariables: { cliVar: "cliValue" },
  });

  const merged = PromptVariableSourceFactory.merge(configSource, cliSource);

  // CLI directive should override
  assertEquals(merged.directive, "cli-directive");
  
  // Config layer should remain (CLI didn't specify)
  assertEquals(merged.layer, "config-layer");
  
  // CLI user variables should be present
  assertEquals(merged.userVariables?.cliVar, "cliValue");
});

Deno.test("PromptVariableSource - Behavior: merge combines user variables", () => {
  const source1 = PromptVariableSourceFactory.fromConfig({
    directive: "test",
  });
  source1.userVariables = { var1: "value1", var2: "value2" };

  const source2 = PromptVariableSourceFactory.fromCLI({
    directive: "test",
    userVariables: { var2: "overridden", var3: "value3" },
  });

  const merged = PromptVariableSourceFactory.merge(source1, source2);

  assertEquals(merged.userVariables?.var1, "value1");
  assertEquals(merged.userVariables?.var2, "overridden"); // CLI overrides
  assertEquals(merged.userVariables?.var3, "value3");
});

Deno.test("PromptVariableSource - Behavior: validateSource accepts valid sources", () => {
  const validSource: PromptVariableSource = {
    directive: "to",
    layer: "task",
    inputFile: "input.md",
    metadata: { source: DataSource.CLI, timestamp: new Date() },
  };

  const result = validateSource(validSource);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, validSource);
  }
});

Deno.test("PromptVariableSource - Behavior: validateSource accepts stdin content as input", () => {
  const validSource: PromptVariableSource = {
    directive: "summary",
    stdinContent: "Some content to process",
    metadata: { source: DataSource.STDIN, timestamp: new Date() },
  };

  const result = validateSource(validSource);
  assertEquals(result.ok, true);
});

Deno.test("PromptVariableSource - Behavior: validateSource rejects missing directive and layer", () => {
  const invalidSource: PromptVariableSource = {
    inputFile: "input.md",
    metadata: { source: DataSource.CLI, timestamp: new Date() },
  };

  const result = validateSource(invalidSource);
  assertEquals(result.ok, false);
  
  if (!result.ok) {
    assertEquals(result.error.length, 1);
    assertEquals(result.error[0].field, "directive");
    assertEquals(result.error[0].message, "Either directive or layer must be provided");
  }
});

Deno.test("PromptVariableSource - Behavior: validateSource rejects missing input source", () => {
  const invalidSource: PromptVariableSource = {
    directive: "to",
    layer: "task",
    metadata: { source: DataSource.CLI, timestamp: new Date() },
  };

  const result = validateSource(invalidSource);
  assertEquals(result.ok, false);
  
  if (!result.ok) {
    assertEquals(result.error.length, 1);
    assertEquals(result.error[0].field, "inputFile");
    assertEquals(result.error[0].message, "Either input file or stdin content must be provided");
  }
});

Deno.test("PromptVariableSource - Behavior: validateSource accumulates multiple errors", () => {
  const invalidSource: PromptVariableSource = {
    // Missing directive/layer and input source
    metadata: { source: DataSource.CLI, timestamp: new Date() },
  };

  const result = validateSource(invalidSource);
  assertEquals(result.ok, false);
  
  if (!result.ok) {
    assertEquals(result.error.length, 2);
    
    const fields = result.error.map(e => e.field);
    assertEquals(fields.includes("directive"), true);
    assertEquals(fields.includes("inputFile"), true);
  }
});

Deno.test("PromptVariableSource - Behavior: Factory methods generate different timestamps", async () => {
  const source1 = PromptVariableSourceFactory.fromCLI({ directive: "test" });
  
  // Small delay to ensure different timestamps
  await new Promise(resolve => setTimeout(resolve, 1));
  
  const source2 = PromptVariableSourceFactory.fromCLI({ directive: "test" });

  assertNotEquals(
    source1.metadata?.timestamp.getTime(),
    source2.metadata?.timestamp.getTime()
  );
});

Deno.test("PromptVariableSource - Behavior: merge preserves all undefined values", () => {
  const sparseSource1: PromptVariableSource = {
    directive: "test1",
    // inputFile intentionally undefined
    metadata: { source: DataSource.CONFIG, timestamp: new Date() },
  };

  const sparseSource2: PromptVariableSource = {
    layer: "test2",
    // directive intentionally undefined
    inputFile: "test.md",
    metadata: { source: DataSource.CLI, timestamp: new Date() },
  };

  const merged = PromptVariableSourceFactory.merge(sparseSource1, sparseSource2);

  // Both should be preserved since they come from different fields
  assertEquals(merged.directive, "test1"); // From sparseSource1 (but CLI has higher priority, however CLI source didn't set directive)
  assertEquals(merged.layer, "test2");     // From sparseSource2 (CLI)
  assertEquals(merged.inputFile, "test.md"); // From sparseSource2 (CLI)
});

Deno.test("PromptVariableSource - Behavior: merge handles empty sources gracefully", () => {
  const emptySource: PromptVariableSource = {};
  const normalSource = PromptVariableSourceFactory.fromCLI({
    directive: "test",
    layer: "task",
  });

  const merged = PromptVariableSourceFactory.merge(emptySource, normalSource);

  assertEquals(merged.directive, "test");
  assertEquals(merged.layer, "task");
  assertEquals(merged.metadata?.source, DataSource.MERGED);
});