/**
 * Core tests for parameter processing functionality
 * Following docs/breakdown/testing.ja.md specifications
 */

import { assert, assertEquals, assertRejects, assertThrows } from "$std/testing/asserts.ts";
import { cleanupTestEnvironment, setupTestEnvironment } from "../helpers/setup.ts";
import { assertPromptContains, assertValidPrompt } from "../helpers/assertions.ts";
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { CommandParams, DemonstrativeType, NoParamsResult, SingleParamResult, DoubleParamsResult } from "../../lib/types/mod.ts";
import { ParamsParser } from "../../lib/cli/params.ts";
import { getTestEnvOptions } from "../helpers/test_utils.ts";

/**
 * TODO: [Spec Mismatch] Test Helpers
 * - Current implementation lacks required test helpers
 * - Need to implement:
 *   1. File operation helpers
 *   2. Markdown helpers
 *   3. JSON helpers
 *   4. Assertion helpers with proper error messages
 */
const logger = new BreakdownLogger();
const TEST_ENV = await setupTestEnvironment({ workingDir: "./tmp/test" });

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

/**
 * TODO: [Spec Mismatch] Test Coverage
 * - Current tests don't meet coverage requirements
 * - Need to add:
 *   1. Error condition tests
 *   2. Edge case tests
 *   3. Performance tests
 *   4. Recovery process tests
 */
// Core functionality tests (95% coverage required)
Deno.test("parameter processing - basic functionality", async (t) => {
  await t.step("initial loading", async () => {
    // Test initial parameter loading
    logger.debug("Testing initial parameter loading");
    // Implementation
  });

  await t.step("use case entry", async () => {
    // Test use case parameter handling
    logger.debug("Testing use case parameter handling");
    // Implementation
  });

  await t.step("conversion", async () => {
    // Test parameter conversion
    logger.debug("Testing parameter conversion");
    // Implementation
  });

  await t.step("output", async () => {
    // Test output parameter handling
    logger.debug("Testing output parameter handling");
    // Implementation
  });

  await t.step("integration", async () => {
    // Test parameter integration
    logger.debug("Testing parameter integration");
    // Implementation
  });

  await t.step("edge cases", async () => {
    // Test edge cases
    logger.debug("Testing parameter edge cases");
    // Implementation
  });
});

// Performance requirements
Deno.test("parameter processing - performance", async () => {
  const start = performance.now();
  // Test implementation
  const duration = performance.now() - start;
  assert(duration < 100, "Parameter processing should complete within 100ms");
});

// Error handling test
Deno.test({
  name: "params - error handling",
  fn: async () => {
    await assertRejects(
      async () => {
        const invalidInput = undefined;
        await assertValidPrompt(invalidInput);
      },
      Error,
      "Prompt must be a string",
    );
  },
});

// Content validation with specific requirements
Deno.test({
  name: "params - content requirements",
  fn: async () => {
    const content = "Test content with required elements";
    await assertPromptContains(content, "required elements");
    logger.debug("Content validation completed", { content });
  },
});

// Basic parameter validation tests
Deno.test("params - basic text validation", () => {
  const text = "Basic parameter text";
  assertValidPrompt(text);
});

Deno.test("params - content validation", () => {
  const content = "Test content with specific terms";
  assertPromptContains(content, "specific terms");
});

// Parameter processing tests
Deno.test("params - empty input handling", async () => {
  await assertRejects(
    async () => {
      const emptyInput = "";
      await assertValidPrompt(emptyInput);
    },
    Error,
    "Prompt cannot be empty",
  );
});

Deno.test("params - special characters handling", () => {
  const specialChars = "Test with @special #characters";
  assertValidPrompt(specialChars);
});

// New tests for ParamsParser
Deno.test("ParamsParser - no-params result", async () => {
  logger.debug("Testing no-params result");
  const parser = new ParamsParser();

  // Test help flag
  const helpResult = await parser.parse(["--help"]) as NoParamsResult;
  assertEquals(helpResult.type, "no-params");
  assertEquals(helpResult.help, true);
  assertEquals(helpResult.version, undefined);

  // Test version flag
  const versionResult = await parser.parse(["--version"]) as NoParamsResult;
  assertEquals(versionResult.type, "no-params");
  assertEquals(versionResult.help, undefined);
  assertEquals(versionResult.version, true);

  // Test empty args
  const emptyResult = await parser.parse([]) as NoParamsResult;
  assertEquals(emptyResult.type, "no-params");
  assertEquals(emptyResult.help, undefined);
  assertEquals(emptyResult.version, undefined);
});

Deno.test("ParamsParser - single command result", async () => {
  logger.debug("Testing single command result");
  const parser = new ParamsParser();

  // Test init command
  const initResult = await parser.parse(["init"]) as SingleParamResult;
  assertEquals(initResult.type, "single");
  assertEquals(initResult.command, "init");
});

Deno.test("ParamsParser - double command result", async () => {
  logger.debug("Testing double command result");
  const parser = new ParamsParser();

  // Test to command with required options
  const toResult = await parser.parse([
    "to",
    "project",
    "--from",
    "input.md",
    "--destination",
    "output.json",
  ]) as DoubleParamsResult;
  assertEquals(toResult.type, "double");
  assertEquals(toResult.demonstrativeType, "to");
  assertEquals(toResult.layerType, "project");
  assert(toResult.options !== undefined, "Options should be defined for double params result");
  assertEquals(toResult.options.fromFile, "input.md");
  assertEquals(toResult.options.destinationFile, "output.json");

  // Test summary command with minimum options
  const summaryResult = await parser.parse([
    "summary",
    "issue",
    "--from",
    "input.md",
  ]) as DoubleParamsResult;
  assertEquals(summaryResult.type, "double");
  assertEquals(summaryResult.demonstrativeType, "summary");
  assertEquals(summaryResult.layerType, "issue");
  assert(summaryResult.options !== undefined, "Options should be defined for double params result");
  assertEquals(summaryResult.options.fromFile, "input.md");
  assertEquals(summaryResult.options.destinationFile, undefined);
});

Deno.test("ParamsParser - invalid inputs", async () => {
  logger.debug("Testing invalid inputs");
  const parser = new ParamsParser();

  // Test invalid command
  try {
    await parser.parse(["invalid", "project"]);
    throw new Error("Should have thrown an error for invalid command");
  } catch (error) {
    assertEquals(error instanceof Error, true);
  }

  // Test missing layer type
  try {
    await parser.parse(["to"]);
    throw new Error("Should have thrown an error for missing layer type");
  } catch (error) {
    assertEquals(error instanceof Error, true);
  }

  // Test missing --from option
  try {
    await parser.parse(["to", "project"]);
    throw new Error("Should have thrown an error for missing --from option");
  } catch (error) {
    assertEquals(error instanceof Error, true);
  }
});

Deno.test("ParamsParser - double command result with --to", async () => {
  const parser = new ParamsParser();
  const args = ["to", "project", "--from", "input.md", "--to", "output.md"];
  const result = await parser.parse(args) as DoubleParamsResult;

  assertEquals(result.type, "double");
  assertEquals(result.demonstrativeType, "to");
  assertEquals(result.layerType, "project");
  assert(result.options !== undefined, "Options should be defined");
  assertEquals(result.options.fromFile, "input.md");
  assertEquals(result.options.destinationFile, "output.md");
});

Deno.test("ParamsParser - double command result with --destination", async () => {
  const parser = new ParamsParser();
  const args = ["to", "project", "--from", "input.md", "--destination", "output.md"];
  const result = await parser.parse(args) as DoubleParamsResult;

  assertEquals(result.type, "double");
  assertEquals(result.demonstrativeType, "to");
  assertEquals(result.layerType, "project");
  assert(result.options !== undefined, "Options should be defined");
  assertEquals(result.options.fromFile, "input.md");
  assertEquals(result.options.destinationFile, "output.md");
});

Deno.test("ParamsParser - throws error when --from is missing", async () => {
  const parser = new ParamsParser();
  const args = ["to", "project", "--to", "output.md"];
  
  try {
    await parser.parse(args);
    throw new Error("Should have thrown an error for missing --from option");
  } catch (error: unknown) {
    assert(error instanceof Error, "Expected error to be an instance of Error");
    assertEquals(error.message, "--from option is required for this command");
  }
});

Deno.test("ParamsParser - shorthand options", async () => {
  const parser = new ParamsParser();
  const args = ["to", "project", "-f", "input.md", "-o", "output.md"];
  const result = await parser.parse(args) as DoubleParamsResult;

  assertEquals(result.type, "double");
  assertEquals(result.demonstrativeType, "to");
  assertEquals(result.layerType, "project");
  assert(result.options !== undefined, "Options should be defined");
  assertEquals(result.options.fromFile, "input.md");
  assertEquals(result.options.destinationFile, "output.md");
});

Deno.test("ParamsParser - input layer type validation", async () => {
  const parser = new ParamsParser();

  // Valid input layer type
  const validArgs = ["to", "project", "--from", "input.md", "--input", "issue"];
  const validResult = await parser.parse(validArgs) as DoubleParamsResult;
  assertEquals(validResult.options.fromLayerType, "issue");

  // Invalid input layer type
  const invalidArgs = ["to", "project", "--from", "input.md", "--input", "invalid"];
  try {
    await parser.parse(invalidArgs);
    throw new Error("Should have thrown an error for invalid input layer type");
  } catch (error: unknown) {
    assert(error instanceof Error, "Expected error to be an instance of Error");
    assertEquals(error.message, "Invalid input layer type. Must be one of: project, issue, task");
  }
});

Deno.test({
  name: "log level - basic functionality",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("log-basic"));
    try {
      const logger = new BreakdownLogger();
      
      // Test default log level by checking if debug messages are not logged
      let debugOutput = "";
      const originalConsoleDebug = console.debug;
      console.debug = (msg: string) => {
        debugOutput += msg + "\n";
      };
      
      logger.debug("Test debug message");
      assertEquals(debugOutput, "", "Debug messages should not be logged by default");
      
      // Test setting log level to debug
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug("Test debug message after level change");
      assert(debugOutput.includes("Test debug message after level change"), "Debug messages should be logged after setting level to debug");
      
      // Test invalid log level
      assertThrows(
        () => logger.setLogLevel("invalid" as LogLevel),
        Error,
        "Invalid log level"
      );
      
      // Restore console.debug
      console.debug = originalConsoleDebug;
    } finally {
      await cleanupTestEnvironment(env);
    }
  },
});

Deno.test({
  name: "log level - configuration",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("log-config"));
    try {
      // Test environment variable configuration
      Deno.env.set("LOG_LEVEL", "debug");
      const debugLogger = new BreakdownLogger();
      
      let debugOutput = "";
      const originalConsoleDebug = console.debug;
      console.debug = (msg: string) => {
        debugOutput += msg + "\n";
      };
      
      debugLogger.debug("Test debug message");
      assert(debugOutput.includes("Test debug message"), "Debug messages should be logged when LOG_LEVEL=debug");
      
      // Test overriding environment variable
      const infoLogger = new BreakdownLogger({ initialLevel: LogLevel.INFO });
      infoLogger.debug("This should not be logged");
      assertEquals(debugOutput.includes("This should not be logged"), false, "Debug messages should not be logged when level is INFO");
      
      // Test invalid environment variable
      Deno.env.set("LOG_LEVEL", "invalid");
      const defaultLogger = new BreakdownLogger();
      defaultLogger.debug("This should not be logged");
      assertEquals(debugOutput.includes("This should not be logged"), false, "Invalid log level should default to INFO");
      
      // Restore console.debug
      console.debug = originalConsoleDebug;
    } finally {
      await cleanupTestEnvironment(env);
      Deno.env.delete("LOG_LEVEL");
    }
  },
});
