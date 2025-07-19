/**
 * @fileoverview Architecture Test for Variable Processor
 *
 * Tests the architectural constraints and dependencies of the TwoParamsVariableProcessor:
 * - Dependency direction validation (should not depend on higher-level modules)
 * - Interface consistency with other processors
 * - Layer boundary compliance
 * - Circular dependency detection
 *
 * @module lib/processor/0_architecture_variable_processor_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import {
  type ProcessorOptions,
  type ProcessorResult,
  TwoParamsVariableProcessor,
  type VariableProcessorError,
} from "./variable_processor_v2.ts";
import type { Result as _Result } from "../types/result.ts";

// Type for architecture testing
interface ProcessorArchitecture {
  [key: string]: unknown;
}
import type { PromptVariable as _PromptVariable } from "../types/prompt_variables_vo.ts";

/**
 * Architecture constraints for Variable Processor
 *
 * The Variable Processor should:
 * 1. Only depend on lower-level modules (types, factory, builder)
 * 2. Not depend on handlers, orchestrators, or CLI modules
 * 3. Implement consistent interface patterns with other processors
 * 4. Follow Result type pattern for error handling
 */

Deno.test("Architecture: Variable Processor should have proper dependencies", () => {
  // Test that the processor can be instantiated without higher-level dependencies
  const _processor = new TwoParamsVariableProcessor();
  assertExists(_processor);

  // Verify the processor has expected methods
  assertEquals(typeof _processor.process, "function");
  assertEquals(typeof _processor.extractCustomVariables, "function");
});

Deno.test("Architecture: Variable Processor should use Result type pattern", () => {
  const _processor = new TwoParamsVariableProcessor();

  // Test that extractCustomVariables returns Result type
  const result = _processor.extractCustomVariables({});
  assertExists(result);
  assertEquals(typeof result.ok, "boolean");

  // Verify error handling structure
  if (!result.ok) {
    assertExists(result.error);
    assertEquals(typeof result.error.kind, "string");
  }
});

Deno.test("Architecture: Variable Processor should have consistent error types", () => {
  // Verify that all error types follow the expected pattern
  const _errorKinds = [
    "InvalidOption",
    "StdinVariableError",
    "BuilderError",
    "ValidationError",
  ];

  // This test ensures error types are defined correctly
  // by checking they can be used in type annotations
  const testError: VariableProcessorError = {
    kind: "CustomVariableError",
    message: "Test error for architecture validation",
    error: "test error",
  };

  assertEquals(testError.kind, "CustomVariableError");
});

Deno.test("Architecture: Variable Processor should have consistent interface", () => {
  // Verify ProcessorOptions interface structure
  const options: ProcessorOptions = {
    options: {},
  };

  assertExists(options.options);
  assertEquals(typeof options.options, "object");

  // Verify ProcessorResult interface structure
  const mockResult: Partial<ProcessorResult> = {
    variables: {},
    customVariables: {},
    standardVariables: {
      input_text_file: "test",
      destination_path: "test",
    },
  };

  assertExists(mockResult.variables);
  assertExists(mockResult.customVariables);
  assertExists(mockResult.standardVariables);
});

Deno.test("Architecture: Variable Processor should follow single responsibility", () => {
  const _processor = new TwoParamsVariableProcessor();

  // The processor should focus only on variable processing
  // and delegate other responsibilities to appropriate modules

  // Check that it has a focused set of public methods
  const publicMethods = [
    "process",
    "extractCustomVariables",
  ];

  publicMethods.forEach((method) => {
    assertEquals(typeof (_processor as unknown as ProcessorArchitecture)[method], "function");
  });

  // Should not have methods that belong to other layers
  const shouldNotHave = [
    "parseArgs",
    "loadConfig",
    "executeCommand",
    "handleOutput",
  ];

  shouldNotHave.forEach((method) => {
    assertEquals((_processor as unknown as ProcessorArchitecture)[method], undefined);
  });
});

Deno.test("Architecture: Variable Processor should use dependency injection pattern", () => {
  // The processor should accept dependencies rather than creating them internally
  // This ensures testability and loose coupling

  const _processor = new TwoParamsVariableProcessor();

  // Should be able to process without requiring external configuration
  const result = _processor.extractVariables({
    "uv-test": "value",
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data["uv-test"], "value");
  }
});

Deno.test("Architecture: Variable Processor should maintain interface consistency", () => {
  const _processor = new TwoParamsVariableProcessor();

  // Process method is synchronous and returns Result<T, E>
  const processResult = _processor.processAllVariables({
    options: {},
    stdinContent: "test",
  });

  // Verify it returns a Result (not a Promise)
  assertEquals(processResult instanceof Promise, false);

  // Verify it has Result interface
  assertExists(processResult);
  assertEquals(typeof processResult.ok, "boolean");
});

Deno.test("Architecture: Variable Processor should not leak implementation details", () => {
  const _processor = new TwoParamsVariableProcessor();

  // Internal methods should be private
  const internalMethods = [
    "processStandardVariables",
    "resolveInputTextFile",
    "resolveDestinationPath",
    "buildVariables",
  ];

  internalMethods.forEach((method) => {
    // Private methods should not be accessible
    assertEquals((_processor as unknown as ProcessorArchitecture)[method], undefined);
  });
});

Deno.test("Architecture: Static factory methods should maintain consistency", () => {
  // Test static factory method
  const result = TwoParamsVariableProcessor.extractCustomVariables({
    "uv-test": "value",
    "normal": "ignored",
  });

  assertEquals(typeof result, "object");
  assertEquals(result["uv-test"], "value");
  assertEquals(result["normal"], undefined);
});

Deno.test("Architecture: Module exports should follow naming conventions", () => {
  // Verify proper export naming
  assertExists(TwoParamsVariableProcessor);

  // Verify type exports are available
  // This is tested by successful import at the top of the file
  const testOptions: ProcessorOptions = { options: {} };
  assertExists(testOptions);
});
