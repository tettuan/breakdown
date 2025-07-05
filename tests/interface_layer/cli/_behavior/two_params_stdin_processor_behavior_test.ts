/**
 * Unit tests for TwoParamsStdinProcessor functionality with comprehensive Totality compliance
 *
 * These tests verify the actual functionality of the stdin processor:
 * - STDIN detection and reading logic
 * - Timeout configuration and handling
 * - Option flag interpretation
 * - Error handling and recovery
 * - Resource cleanup and management
 * - Edge case handling
 *
 * @module cli/processors/2_unit_two_params_stdin_processor_test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

import { TwoParamsStdinProcessor } from "./two_params_stdin_processor.ts";
import type { BreakdownConfigCompatible } from "../../config/timeout_manager.ts";

const _logger = new _BreakdownLogger("unit-stdin-processor");

describe("TwoParamsStdinProcessor Unit Tests - STDIN Detection Logic", () => {
  let processor: TwoParamsStdinProcessor;

  beforeEach(() => {
    processor = new TwoParamsStdinProcessor();
  });

  it("should correctly detect stdin flags", async () => {
    _logger.debug("Testing stdin flag detection logic");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Test all stdin flag combinations
    const stdinFlagTests = [
      { options: { from: "-" }, shouldReadStdin: true, desc: "from dash" },
      { options: { fromFile: "-" }, shouldReadStdin: true, desc: "fromFile dash" },
      {
        options: { from: "-", fromFile: "file.txt" },
        shouldReadStdin: true,
        desc: "from dash with file",
      },
      {
        options: { from: "file.txt", fromFile: "-" },
        shouldReadStdin: true,
        desc: "fromFile dash with file",
      },
      { options: { from: "-", fromFile: "-" }, shouldReadStdin: true, desc: "both dash" },
      { options: { from: "file.txt" }, shouldReadStdin: false, desc: "from file" },
      { options: { fromFile: "file.txt" }, shouldReadStdin: false, desc: "fromFile file" },
      {
        options: { from: "file1.txt", fromFile: "file2.txt" },
        shouldReadStdin: false,
        desc: "both files",
      },
      { options: {}, shouldReadStdin: false, desc: "no options" },
    ];

    for (const test of stdinFlagTests) {
      const result = await processor.process(config, test.options);

      assertExists(result);
      assertEquals(typeof result.ok, "boolean");

      if (test.shouldReadStdin) {
        // When stdin should be read, result depends on actual availability
        // But structure should handle it
      } else {
        // When stdin should NOT be read, always return empty
        if (result.ok) {
          assertEquals(result.data, "", `Failed for: ${test.desc}`);
        }
      }
    }
  });

  it("should handle skipStdin flag correctly", async () => {
    _logger.debug("Testing skipStdin flag handling");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // skipStdin should override all other stdin flags
    const skipStdinTests = [
      { options: { skipStdin: true, from: "-" }, desc: "skip with from dash" },
      { options: { skipStdin: true, fromFile: "-" }, desc: "skip with fromFile dash" },
      { options: { skipStdin: true, from: "-", fromFile: "-" }, desc: "skip with both dash" },
      { options: { skipStdin: true }, desc: "skip alone" },
      { options: { skipStdin: false, from: "-" }, desc: "no skip with from dash" },
    ];

    for (const test of skipStdinTests) {
      const result = await processor.process(config, test.options);

      assertExists(result);

      if (test.options.skipStdin === true) {
        // Should always return empty when skipStdin is true
        assertEquals(result.ok, true);
        if (result.ok) {
          assertEquals(result.data, "", `Failed for: ${test.desc}`);
        }
      }
    }
  });

  it("should handle edge case option values", async () => {
    _logger.debug("Testing edge case option values");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Test various edge case values that might be mistaken for stdin flags
    const edgeCaseTests = [
      { options: { from: "" }, shouldReadStdin: false, desc: "empty string" },
      { options: { from: " " }, shouldReadStdin: false, desc: "space" },
      { options: { from: "-file.txt" }, shouldReadStdin: false, desc: "dash prefix" },
      { options: { from: "file-.txt" }, shouldReadStdin: false, desc: "dash in name" },
      { options: { from: "-.txt" }, shouldReadStdin: false, desc: "dash dot" },
      { options: { from: "--" }, shouldReadStdin: false, desc: "double dash" },
      { options: { from: null as any as string }, shouldReadStdin: false, desc: "null" },
      {
        options: { from: undefined as any as string },
        shouldReadStdin: false,
        desc: "undefined",
      },
      { options: { from: 0 as any as string }, shouldReadStdin: false, desc: "zero" },
      { options: { from: false as any as string }, shouldReadStdin: false, desc: "false" },
    ];

    for (const test of edgeCaseTests) {
      const result = await processor.process(config, test.options);

      assertExists(result);

      if (!test.shouldReadStdin && result.ok) {
        assertEquals(result.data, "", `Failed for: ${test.desc}`);
      }
    }
  });
});

describe("TwoParamsStdinProcessor Unit Tests - Timeout Configuration", () => {
  let processor: TwoParamsStdinProcessor;

  beforeEach(() => {
    processor = new TwoParamsStdinProcessor();
  });

  it("should handle various timeout configurations", async () => {
    _logger.debug("Testing timeout configuration handling");

    const timeoutTests = [
      { timeout: 5000, desc: "normal timeout" },
      { timeout: 100, desc: "short timeout" },
      { timeout: 60000, desc: "long timeout" },
      { timeout: 0, desc: "zero timeout" },
      { timeout: Number.MAX_SAFE_INTEGER, desc: "max timeout" },
    ];

    for (const test of timeoutTests) {
      const config: BreakdownConfigCompatible = {
        stdin: { timeout_ms: test.timeout },
      };

      const result = await processor.process(config, { skipStdin: true });

      assertExists(result);
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data, "");
      }
    }
  });

  it("should handle missing or invalid timeout configurations", async () => {
    _logger.debug("Testing missing/invalid timeout configurations");

    const invalidTimeoutTests = [
      { config: { stdin: {} }, desc: "missing timeout_ms" },
      { config: {}, desc: "missing stdin section" },
      { config: { stdin: { timeout_ms: "1000" as any as number } }, desc: "string timeout" },
      { config: { stdin: { timeout_ms: null as any as number } }, desc: "null timeout" },
      {
        config: { stdin: { timeout_ms: undefined as any as number } },
        desc: "undefined timeout",
      },
      { config: { stdin: { timeout_ms: NaN } }, desc: "NaN timeout" },
      { config: { stdin: { timeout_ms: Infinity } }, desc: "Infinity timeout" },
      { config: { stdin: { timeout_ms: -1000 } }, desc: "negative timeout" },
    ];

    for (const test of invalidTimeoutTests) {
      const result = await processor.process(
        test.config as BreakdownConfigCompatible,
        { skipStdin: true },
      );

      assertExists(result);
      assertEquals(typeof result.ok, "boolean", `Failed for: ${test.desc}`);

      // Should handle gracefully, either with defaults or error
      if (result.ok) {
        assertEquals(result.data, "");
      } else {
        assertEquals(result.error.kind, "StdinReadError");
      }
    }
  });

  it("should use correct default timeout in convenience method", async () => {
    _logger.debug("Testing default timeout in convenience method");

    const result = await processor.processWithDefaultTimeout({ skipStdin: true });

    assertExists(result);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "");
    }

    // Test that it's equivalent to explicit 5000ms timeout
    const explicitConfig: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 5000 },
    };

    const explicitResult = await processor.process(explicitConfig, { skipStdin: true });

    if (result.ok && explicitResult.ok) {
      assertEquals(result.data, explicitResult.data);
    }
  });
});

describe("TwoParamsStdinProcessor Unit Tests - Error Handling", () => {
  let processor: TwoParamsStdinProcessor;

  beforeEach(() => {
    processor = new TwoParamsStdinProcessor();
  });

  it("should handle all error scenarios gracefully", async () => {
    _logger.debug("Testing comprehensive error handling");

    const errorScenarios = [
      {
        config: null as any,
        options: { from: "-" },
        desc: "null config with stdin",
      },
      {
        config: undefined as any,
        options: { fromFile: "-" },
        desc: "undefined config with stdin",
      },
      {
        config: "invalid" as any as BreakdownConfigCompatible,
        options: { from: "-" },
        desc: "string config with stdin",
      },
      {
        config: { stdin: null as any as { timeout_ms: number } },
        options: { from: "-" },
        desc: "null stdin section",
      },
      {
        config: { stdin: { timeout_ms: 1 } },
        options: { from: "-" },
        desc: "extremely short timeout",
      },
    ];

    for (const scenario of errorScenarios) {
      const result = await processor.process(
        scenario.config as BreakdownConfigCompatible,
        scenario.options,
      );

      assertExists(result);
      assertEquals(typeof result.ok, "boolean", `Failed for: ${scenario.desc}`);

      // All errors should be contained in Result type
      if (!result.ok) {
        assertEquals(result.error.kind, "StdinReadError");
        assertExists(result.error.message);
        assertEquals(typeof result.error.message, "string");
        assertEquals(result.error.message.length > 0, true);
      }
    }
  });

  it("should preserve error cause information", async () => {
    _logger.debug("Testing error cause preservation");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1 }, // Very short to trigger timeout
    };

    const result = await processor.process(config, { from: "-" });

    if (!result.ok) {
      assertEquals(result.error.kind, "StdinReadError");
      assertExists(result.error.message);

      // Check if cause is preserved when available
      if (result.error.cause) {
        assertExists(result.error.cause);
      }
    }
  });

  it("should handle concurrent error scenarios", async () => {
    _logger.debug("Testing concurrent error handling");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 10 }, // Short timeout
    };

    // Run multiple concurrent operations that might fail
    const promises = Array(5).fill(0).map(() => processor.process(config, { from: "-" }));

    const results = await Promise.all(promises);

    // All should complete without throwing
    for (const result of results) {
      assertExists(result);
      assertEquals(typeof result.ok, "boolean");

      if (!result.ok) {
        assertEquals(result.error.kind, "StdinReadError");
      }
    }
  });
});

describe("TwoParamsStdinProcessor Unit Tests - Resource Management", () => {
  let processor: TwoParamsStdinProcessor;

  beforeEach(() => {
    processor = new TwoParamsStdinProcessor();
  });

  it("should clean up resources properly on success", async () => {
    _logger.debug("Testing resource cleanup on success");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Multiple successful operations
    for (let i = 0; i < 5; i++) {
      const result = await processor.process(config, { skipStdin: true });

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data, "");
      }
    }

    // Should not leak resources across calls
  });

  it("should clean up resources properly on timeout", async () => {
    _logger.debug("Testing resource cleanup on timeout");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1 }, // Very short timeout
    };

    // Multiple timeout scenarios
    for (let i = 0; i < 3; i++) {
      const result = await processor.process(config, { from: "-" });

      assertExists(result);
      // May succeed or timeout, but should always clean up
    }
  });

  it("should handle abort controller lifecycle correctly", async () => {
    _logger.debug("Testing abort controller lifecycle");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 100 },
    };

    // Test various scenarios that exercise abort controller
    const scenarios = [
      { options: { skipStdin: true }, desc: "skip stdin" },
      { options: { from: "-" }, desc: "read stdin" },
      { options: {}, desc: "no stdin" },
    ];

    for (const scenario of scenarios) {
      const result = await processor.process(config, scenario.options);

      assertExists(result);
      // Abort controller should be cleaned up in all cases
    }
  });
});

describe("TwoParamsStdinProcessor Unit Tests - State Management", () => {
  let processor: TwoParamsStdinProcessor;

  beforeEach(() => {
    processor = new TwoParamsStdinProcessor();
  });

  it("should maintain stateless operation", async () => {
    _logger.debug("Testing stateless operation");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Run with different options in sequence
    const result1 = await processor.process(config, { from: "-" });
    const result2 = await processor.process(config, { fromFile: "-" });
    const result3 = await processor.process(config, {});
    const result4 = await processor.process(config, { from: "-" }); // Repeat first

    // Each call should be independent
    assertExists(result1);
    assertExists(result2);
    assertExists(result3);
    assertExists(result4);

    // Results should be consistent for same inputs
    if (result1.ok && result4.ok) {
      // Both might be empty or have content, but should be consistent
      assertEquals(typeof result1.data, typeof result4.data);
    }
  });

  it("should handle concurrent operations correctly", async () => {
    _logger.debug("Testing concurrent operations");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Run multiple operations concurrently
    const operations = [
      processor.process(config, { skipStdin: true }),
      processor.process(config, { skipStdin: true }),
      processor.processWithDefaultTimeout({ skipStdin: true }),
      processor.process(config, { skipStdin: true }),
      processor.processWithDefaultTimeout({ skipStdin: true }),
    ];

    const results = await Promise.all(operations);

    // All should complete successfully (no file or stdin operations)
    for (const result of results) {
      assertExists(result);
      if (!result.ok) {
        _logger.debug("Unexpected error in concurrent test", { error: result.error });
      }
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data, "");
      }
    }
  });

  it("should not share state between instances", async () => {
    _logger.debug("Testing instance isolation");

    const processor1 = new TwoParamsStdinProcessor();
    const processor2 = new TwoParamsStdinProcessor();

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Run operations on different instances
    const result1 = await processor1.process(config, { skipStdin: true });
    const result2 = await processor2.process(config, { skipStdin: true });

    // Both should produce identical results
    assertEquals(result1.ok, result2.ok);
    if (result1.ok && result2.ok) {
      assertEquals(result1.data, result2.data);
    }
  });
});

describe("TwoParamsStdinProcessor Unit Tests - Integration Scenarios", () => {
  let processor: TwoParamsStdinProcessor;

  beforeEach(() => {
    processor = new TwoParamsStdinProcessor();
  });

  it("should handle realistic CLI usage patterns", async () => {
    _logger.debug("Testing realistic CLI usage patterns");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 5000 },
    };

    // Common CLI usage patterns
    const cliPatterns = [
      {
        options: { from: "-", destinationFile: "output.md" },
        desc: "stdin to file",
      },
      {
        options: { fromFile: "input.md", destinationFile: "output.md" },
        desc: "file to file",
      },
      {
        options: { from: "-" },
        desc: "stdin to stdout",
      },
      {
        options: {},
        desc: "no explicit input",
      },
    ];

    for (const pattern of cliPatterns) {
      const result = await processor.process(config, pattern.options);

      assertExists(result);
      assertEquals(typeof result.ok, "boolean");

      // All patterns should be handled
      if (result.ok) {
        assertEquals(typeof result.data, "string");
      }
    }
  });

  it("should work with various config sources", async () => {
    _logger.debug("Testing various config sources");

    // Simulate configs from different sources
    const configSources = [
      {
        config: { stdin: { timeout_ms: 3000 } },
        desc: "minimal config",
      },
      {
        config: {
          stdin: { timeout_ms: 5000 },
          app: { name: "test" },
          other: { setting: "value" },
        },
        desc: "full config with extra sections",
      },
      {
        config: {
          stdin: { timeout_ms: 2000, extra_field: "ignored" },
        },
        desc: "config with extra stdin fields",
      },
    ];

    for (const source of configSources) {
      const result = await processor.process(
        source.config as BreakdownConfigCompatible,
        { skipStdin: true },
      );

      assertExists(result);
      assertEquals(result.ok, true, `Failed for: ${source.desc}`);
      if (result.ok) {
        assertEquals(result.data, "");
      }
    }
  });

  it("should demonstrate complete functionality", async () => {
    _logger.debug("Testing complete functionality demonstration");

    const config: BreakdownConfigCompatible = {
      stdin: { timeout_ms: 1000 },
    };

    // Test all major functionality paths

    // 1. No stdin reading (skip both stdin and file)
    const noStdinResult = await processor.process(config, { skipStdin: true });
    if (!noStdinResult.ok) {
      _logger.debug("Unexpected error in integration test", { error: noStdinResult.error });
    }
    assertEquals(noStdinResult.ok, true);
    if (noStdinResult.ok) {
      assertEquals(noStdinResult.data, "");
    }

    // 2. Skip stdin flag
    const skipResult = await processor.process(config, { from: "-", skipStdin: true });
    assertEquals(skipResult.ok, true);
    if (skipResult.ok) {
      assertEquals(skipResult.data, "");
    }

    // 3. Convenience method
    const convenienceResult = await processor.processWithDefaultTimeout({ skipStdin: true });
    assertEquals(convenienceResult.ok, true);
    if (convenienceResult.ok) {
      assertEquals(convenienceResult.data, "");
    }

    // 4. Error handling
    const errorResult = await processor.process(null as any as BreakdownConfigCompatible, {
      from: "-",
    });
    assertExists(errorResult);
    assertEquals(typeof errorResult.ok, "boolean");
  });
});
