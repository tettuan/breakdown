/**
 * @fileoverview Structure Test for Variable Processor
 *
 * Tests the class structure and responsibility separation of TwoParamsVariableProcessor:
 * - Single responsibility principle compliance
 * - Method responsibility distribution
 * - Proper encapsulation and abstraction
 * - Class cohesion and coupling analysis
 *
 * @module lib/processor/1_structure_variable_processor_test
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import {
  type ProcessorOptions,
  type ProcessorResult,
  TwoParamsVariableProcessor,
  type VariableProcessorError,
} from "./variable_processor.ts";
import { VariablesBuilder } from "../builder/variables_builder.ts";

/**
 * Structure validation for Variable Processor
 *
 * The Variable Processor structure should:
 * 1. Follow single responsibility principle (variable processing only)
 * 2. Have clear method separation for different concerns
 * 3. Proper encapsulation with private methods for internal logic
 * 4. Cohesive class design with minimal external coupling
 */

Deno.test("Structure: Variable Processor should have single responsibility", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Primary responsibility: Variable processing
  assertExists(_processor.process);
  assertEquals(typeof _processor.process, "function");

  // Secondary responsibility: Custom variable extraction
  assertExists(_processor.extractCustomVariables);
  assertEquals(typeof _processor.extractCustomVariables, "function");

  // Should NOT have responsibilities that belong elsewhere
  const nonResponsibilities = [
    "parseCommandLine", // CLI parsing responsibility
    "loadConfiguration", // Configuration responsibility
    "executeCommand", // Command execution responsibility
    "renderOutput", // Output rendering responsibility
    "validateSchema", // Schema validation responsibility
    "readFile", // File I/O responsibility
    "writeFile", // File I/O responsibility
  ];

  nonResponsibilities.forEach((method) => {
    assertEquals(
      (_processor as any)[method],
      undefined,
      `Processor should not have ${method} method - violates single responsibility`,
    );
  });
});

Deno.test("Structure: Variable Processor should have proper method organization", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Public interface methods
  const publicMethods = ["process", "extractCustomVariables"];
  publicMethods.forEach((method) => {
    assertEquals(
      typeof (_processor as any)[method],
      "function",
      `Public method ${method} should exist`,
    );
  });

  // Private methods should not be accessible (TypeScript private)
  const privateMethods = [
    "processStandardVariables",
    "resolveInputTextFile",
    "resolveDestinationPath",
    "buildVariables",
  ];

  privateMethods.forEach((method) => {
    // Private methods are not accessible from outside the class
    assertEquals(
      (_processor as any)[method],
      undefined,
      `Private method ${method} should not be accessible externally`,
    );
  });
});

Deno.test("Structure: Variable Processor should properly encapsulate dependencies", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Dependencies should be encapsulated within the class
  // Internal dependency management should not be exposed

  // Should not expose internal factory instance
  assertEquals(
    (_processor as any).stdinFactory,
    undefined,
    "Internal StdinVariableFactory should not be exposed",
  );

  // Should not expose builder instances directly
  assertEquals(
    (_processor as any).builder,
    undefined,
    "Internal VariablesBuilder should not be exposed as instance property",
  );
});

Deno.test("Structure: Variable Processor should have cohesive method grouping", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Test cohesion: all methods should work together toward variable processing

  // 1. Custom variable extraction (specific concern)
  const customVars = _processor.extractCustomVariables({
    "uv-project": "test-project",
    "uv-version": "1.0.0",
    "normal-option": "ignored",
  });

  assertEquals(customVars.ok, true);
  if (customVars.ok) {
    assertEquals(Object.keys(customVars.data).length, 2);
    assertEquals(customVars.data["uv-project"], "test-project");
    assertEquals(customVars.data["uv-version"], "1.0.0");
  }

  // 2. Full processing (integrated concern)
  const fullResult = await _processor.process({
    options: {
      "uv-project": "test-project",
      "uv-version": "1.0.0",
    },
    stdinContent: "test content",
    inputFile: "input.txt",
    outputFile: "output.md",
  });

  assertEquals(fullResult.ok, true);
  if (fullResult.ok) {
    // Result should contain all processed variables
    assertExists(fullResult.data.variables);
    assertExists(fullResult.data.customVariables);
    assertExists(fullResult.data.standardVariables);
    assertExists(fullResult.data.builder);

    // Builder should be properly configured
    assertInstanceOf(fullResult.data.builder, VariablesBuilder);
  }
});

Deno.test("Structure: Variable Processor should have minimal coupling", async () => {
  // Test that the processor can work with minimal external dependencies
  const _processor = new TwoParamsVariableProcessor();

  // Should work with empty options
  const emptyResult = _processor.extractCustomVariables({});
  assertEquals(emptyResult.ok, true);
  if (emptyResult.ok) {
    assertEquals(Object.keys(emptyResult.data).length, 0);
  }

  // Should handle null/undefined values gracefully
  const nullResult = _processor.extractCustomVariables({
    "uv-test": null,
    "uv-valid": "value",
  });

  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "InvalidOption");
    if (nullResult.error.kind === "InvalidOption") {
      assertEquals(nullResult.error.key, "uv-test");
    }
  }
});

Deno.test("Structure: Variable Processor should have clear abstraction levels", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // High-level abstraction: complete processing
  const highLevel = await _processor.process({
    options: { "uv-test": "value" },
    stdinContent: "content",
  });

  assertEquals(highLevel.ok, true);

  // Mid-level abstraction: specific processing
  const midLevel = _processor.extractCustomVariables({
    "uv-test": "value",
    "regular": "ignored",
  });

  assertEquals(midLevel.ok, true);

  // Abstractions should be consistent and complementary
  if (highLevel.ok && midLevel.ok) {
    assertEquals(highLevel.data.customVariables["uv-test"], "value");
    assertEquals(midLevel.data["uv-test"], "value");
  }
});

Deno.test("Structure: Variable Processor should maintain state consistency", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Multiple calls should not affect each other (stateless behavior)
  const call1 = _processor.extractCustomVariables({ "uv-a": "1" });
  const call2 = _processor.extractCustomVariables({ "uv-b": "2" });

  assertEquals(call1.ok, true);
  assertEquals(call2.ok, true);

  if (call1.ok && call2.ok) {
    // Results should be independent
    assertEquals(call1.data["uv-a"], "1");
    assertEquals(call1.data["uv-b"], undefined);
    assertEquals(call2.data["uv-a"], undefined);
    assertEquals(call2.data["uv-b"], "2");
  }

  // Process calls should also be independent
  const process1 = await _processor.process({
    options: { "uv-x": "first" },
  });

  const process2 = await _processor.process({
    options: { "uv-y": "second" },
  });

  assertEquals(process1.ok, true);
  assertEquals(process2.ok, true);

  if (process1.ok && process2.ok) {
    assertEquals(process1.data.customVariables["uv-x"], "first");
    assertEquals(process1.data.customVariables["uv-y"], undefined);
    assertEquals(process2.data.customVariables["uv-x"], undefined);
    assertEquals(process2.data.customVariables["uv-y"], "second");
  }
});

Deno.test("Structure: Variable Processor should have appropriate error granularity", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Different types of errors should be distinguishable

  // Invalid option error
  const invalidResult = _processor.extractCustomVariables({
    "uv-invalid": null,
  });

  assertEquals(invalidResult.ok, false);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidOption");
    if (invalidResult.error.kind === "InvalidOption") {
      assertExists(invalidResult.error.key);
      assertExists(invalidResult.error.reason);
    }
  }
});

Deno.test("Structure: Variable Processor should support composition", async () => {
  const _processor = new TwoParamsVariableProcessor();

  // Should work well as part of larger systems
  // Test composition by chaining operations

  const step1 = _processor.extractCustomVariables({
    "uv-step1": "value1",
  });

  assertEquals(step1.ok, true);

  if (step1.ok) {
    // Use result from step1 in step2
    const step2 = await _processor.process({
      options: {
        ...step1.data,
        "uv-step2": "value2",
      },
    });

    assertEquals(step2.ok, true);

    if (step2.ok) {
      assertEquals(step2.data.customVariables["uv-step1"], "value1");
      assertEquals(step2.data.customVariables["uv-step2"], "value2");
    }
  }
});

Deno.test("Structure: Static methods should complement instance methods", async () => {
  // Static factory method should provide same functionality as instance method
  const instanceResult = new TwoParamsVariableProcessor().extractCustomVariables({
    "uv-test": "value",
  });

  const staticResult = TwoParamsVariableProcessor.extractCustomVariables({
    "uv-test": "value",
  });

  assertEquals(instanceResult.ok, true);
  assertEquals(typeof staticResult, "object");

  if (instanceResult.ok) {
    assertEquals(instanceResult.data["uv-test"], staticResult["uv-test"]);
  }
});
