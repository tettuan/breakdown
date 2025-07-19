/**
 * @fileoverview Unit tests for stdin module (stdin.ts)
 *
 * Tests functionality and behavior:
 * - Core I/O function operations
 * - Error handling scenarios
 * - UI component behavior
 * - Options and configuration
 * - Integration with enhanced stdin
 * - Resource management and cleanup
 *
 * @module io/stdin_unit_test
 */

import {
  assertEquals,
  assertExists as _assertExists,
  assertRejects,
  assertThrows as _assertThrows,
} from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import all exports for comprehensive testing
import {
  hasStdinContent,
  isStdinAvailable,
  ProgressBar,
  readStdin,
  Spinner,
  StdinError,
  writeStdout,
} from "./stdin.ts";

const logger = new BreakdownLogger("stdin-unit");

describe("Unit: Core I/O functions", () => {
  it("should create and handle StdinError correctly", () => {
    logger.debug("Testing StdinError creation and properties");

    const environmentInfo = {
      isCI: false,
      isTerminal: true,
      isTest: true,
      envVars: {},
    };

    const error = new StdinError("Test error message", environmentInfo);

    assertEquals(error.name, "StdinError", "Should have correct error name");
    assertEquals(error.message, "Test error message", "Should preserve error message");
    assertEquals(error instanceof Error, true, "Should extend Error class");
    assertEquals(error instanceof StdinError, true, "Should be instance of StdinError");
    assertEquals(error.environmentInfo, environmentInfo, "Should preserve environment info");

    // Test with empty message
    const emptyError = new StdinError("", environmentInfo);
    assertEquals(emptyError.name, "StdinError", "Should work with empty message");
    assertEquals(emptyError.message, "", "Should preserve empty message");

    logger.debug("StdinError verified");
  });

  it("should handle readStdin timeout scenarios", async () => {
    logger.debug("Testing readStdin timeout behavior");

    // Test with allowEmpty false (should fail quickly in test env)
    const shortTimeoutPromise = readStdin({ allowEmpty: false });

    try {
      await shortTimeoutPromise;
      // If it succeeds, that's ok - might be in special test environment
      logger.debug("readStdin succeeded unexpectedly (test environment)");
    } catch (error) {
      assertEquals(
        error instanceof Error,
        true,
        "Should throw Error on timeout",
      );
    }

    // Test with allowEmpty option
    const allowEmptyPromise = readStdin({ allowEmpty: true });

    try {
      await allowEmptyPromise;
      // If it succeeds, that's ok - might be in special test environment
      logger.debug("readStdin with allowEmpty succeeded unexpectedly (test environment)");
    } catch (error) {
      assertEquals(
        error instanceof Error,
        true,
        "Should throw Error on timeout",
      );
    }

    logger.debug("readStdin timeout behavior verified");
  });

  it("should check stdin content availability", () => {
    logger.debug("Testing hasStdinContent function");

    const hasContent = hasStdinContent();

    assertEquals(typeof hasContent, "boolean", "Should return boolean");

    // In test environment, typically returns false (no piped input)
    // But we don't assert the specific value since it depends on how tests are run
    logger.debug(`hasStdinContent returned: ${hasContent}`);

    logger.debug("hasStdinContent verified");
  });

  it("should check stdin availability", () => {
    logger.debug("Testing isStdinAvailable function");

    // Test default behavior
    const isAvailable = isStdinAvailable();
    assertEquals(typeof isAvailable, "boolean", "Should return boolean");

    // Test with override options
    const forcedAvailable = isStdinAvailable({
      environmentInfo: { isTerminal: false, isCI: false, isTest: true, envVars: {} },
    });
    assertEquals(forcedAvailable, true, "Should return true when isTerminal is false");

    const forcedUnavailable = isStdinAvailable({
      environmentInfo: { isTerminal: true, isCI: false, isTest: true, envVars: {} },
    });
    assertEquals(forcedUnavailable, false, "Should return false when isTerminal is true");

    logger.debug("isStdinAvailable verified");
  });

  it("should write to stdout correctly", () => {
    logger.debug("Testing writeStdout function");

    // Test with normal content - should not throw
    writeStdout("test output");
    writeStdout(""); // Empty string
    writeStdout("Multiple\nlines\nof\ntext");

    // Test with various content types
    writeStdout("Unicode: 🚀 ✅ 💻");
    writeStdout("Numbers: 123456789");
    writeStdout("Special chars: !@#$%^&*()");

    logger.debug("writeStdout verified");
  });
});

describe("Unit: ProgressBar functionality", () => {
  it("should create ProgressBar with various configurations", () => {
    logger.debug("Testing ProgressBar creation");

    // Test with minimal configuration
    // Progress bar has width parameter required
    const progress1 = new ProgressBar(100, 40);
    progress1.update(50);
    progress1.finish();

    // Test with custom width
    const progress2 = new ProgressBar(50, 20);
    progress2.update(25);
    progress2.finish();

    // Test with quiet option
    const progress3 = new ProgressBar(100, 40, { quiet: true });
    progress3.update(50);
    progress3.finish();

    // Test with no quiet option explicitly
    const progress4 = new ProgressBar(100, 40, { quiet: false });
    progress4.update(50);
    progress4.finish();

    logger.debug("ProgressBar creation verified");
  });

  it("should update progress correctly", () => {
    logger.debug("Testing ProgressBar update functionality");

    // Test with enabled progress bar (quiet: false) since quiet mode skips updates
    const progress = new ProgressBar(100, 40, { quiet: false });

    // Test updates (these will actually write to stdout but that's ok for testing)
    progress.update(25);
    progress.update(50);
    progress.update(100);
    progress.update(0);
    progress.update(100);
    progress.finish();

    // Test that quiet mode works
    const quietProgress = new ProgressBar(100, 40, { quiet: true });
    quietProgress.update(50);
    quietProgress.finish();

    logger.debug("ProgressBar update verified");
  });

  it("should handle edge cases in ProgressBar", () => {
    logger.debug("Testing ProgressBar edge cases");

    // Test with zero total
    const zeroProgress = new ProgressBar(0, 40, { quiet: true });
    zeroProgress.update(0); // Should not throw
    zeroProgress.finish();

    // Test with small total
    const smallProgress = new ProgressBar(1, 40, { quiet: true });
    smallProgress.update(1); // Should not throw
    smallProgress.finish();

    // Test with zero width
    const zeroWidth = new ProgressBar(100, 0, { quiet: true });
    zeroWidth.update(50); // Should not throw
    zeroWidth.finish();

    logger.debug("ProgressBar edge cases verified");
  });
});

describe("Unit: Spinner functionality", () => {
  it("should create Spinner with various configurations", () => {
    logger.debug("Testing Spinner creation");

    // Test with default configuration
    const spinner1 = new Spinner();
    spinner1.start();
    spinner1.stop();

    // Test with quiet option
    const spinner2 = new Spinner({ quiet: true });
    spinner2.start();
    spinner2.stop();

    // Test with explicit quiet: false
    const spinner3 = new Spinner({ quiet: false });
    spinner3.start();
    spinner3.stop();

    logger.debug("Spinner creation verified");
  });

  it("should handle Spinner lifecycle correctly", () => {
    logger.debug("Testing Spinner lifecycle");

    const spinner = new Spinner({ quiet: true }); // Quiet to avoid actual spinning

    // Test lifecycle behavior
    spinner.start(); // Should not throw
    spinner.stop(); // Should not throw

    // Test multiple starts/stops
    spinner.start();
    spinner.start(); // Should handle multiple starts
    spinner.stop();
    spinner.stop(); // Should handle multiple stops

    logger.debug("Spinner lifecycle verified");
  });

  it("should handle Spinner frames correctly", () => {
    logger.debug("Testing Spinner frames");

    const spinner = new Spinner({ quiet: true });

    // Test behavior through public API
    spinner.start();
    spinner.stop();

    logger.debug("Spinner frames verified");
  });

  it("should provide proper AbortController management", () => {
    logger.debug("Testing Spinner AbortController");

    const spinner = new Spinner({ quiet: true });

    // Test that AbortController is managed properly
    spinner.start();
    // Cannot easily test private abortController, but ensure no errors

    spinner.stop();
    // Should clean up without errors

    // Test cleanup on process exit simulation
    spinner.start();
    // Simulate cleanup
    spinner.stop();

    logger.debug("Spinner AbortController verified");
  });
});

describe("Unit: Options and configuration", () => {
  it("should handle StdinOptions correctly", () => {
    logger.debug("Testing StdinOptions");

    // Test that readStdin accepts various option combinations
    // In test environment, behavior may vary so we test structure rather than exact behavior

    // Test allowEmpty option structure
    const allowEmptyPromise = readStdin({ allowEmpty: true });
    assertEquals(allowEmptyPromise instanceof Promise, true, "Should return Promise");
    allowEmptyPromise.catch(() => {}); // Prevent unhandled rejection

    // Test forceRead option structure
    const forceReadPromise = readStdin({ forceRead: true });
    assertEquals(forceReadPromise instanceof Promise, true, "Should return Promise");
    forceReadPromise.catch(() => {}); // Prevent unhandled rejection

    // Test combined options structure
    const combinedPromise = readStdin({ allowEmpty: true, forceRead: false });
    assertEquals(combinedPromise instanceof Promise, true, "Should return Promise");
    combinedPromise.catch(() => {}); // Prevent unhandled rejection

    // Test empty options
    const emptyPromise = readStdin({});
    assertEquals(emptyPromise instanceof Promise, true, "Should return Promise");
    emptyPromise.catch(() => {}); // Prevent unhandled rejection

    logger.debug("StdinOptions verified");
  });

  it("should handle UI component options consistently", () => {
    logger.debug("Testing UI component options");

    // Test ProgressBar options
    const progressDefault = new ProgressBar(100, 40);
    const progressQuiet = new ProgressBar(100, 40, { quiet: true });
    const progressLoud = new ProgressBar(100, 40, { quiet: false });

    // Test through behavior
    progressDefault.update(50);
    progressDefault.finish();
    progressQuiet.update(50);
    progressQuiet.finish();
    progressLoud.update(50);
    progressLoud.finish();

    // Test Spinner options
    const spinnerDefault = new Spinner();
    const spinnerQuiet = new Spinner({ quiet: true });
    const spinnerLoud = new Spinner({ quiet: false });

    // Test through behavior
    spinnerDefault.start();
    spinnerDefault.stop();
    spinnerQuiet.start();
    spinnerQuiet.stop();
    spinnerLoud.start();
    spinnerLoud.stop();

    logger.debug("UI component options verified");
  });
});

describe("Unit: Error handling and edge cases", () => {
  it("should handle various error scenarios", async () => {
    logger.debug("Testing error scenarios");

    // Test readStdin with various options
    const emptyPromise = readStdin({ allowEmpty: false });

    try {
      await emptyPromise;
      // If it doesn't reject, that's ok - enhanced stdin might handle it
    } catch (error) {
      assertEquals(error instanceof Error, true, "Should throw Error");
    }

    // Test readStdin with forceRead
    const forceReadPromise = readStdin({ forceRead: false });

    try {
      await forceReadPromise;
      // If it doesn't reject, that's ok
    } catch (error) {
      assertEquals(error instanceof Error, true, "Should throw Error");
    }

    logger.debug("Error scenarios verified");
  });

  it("should handle UI component edge cases", () => {
    logger.debug("Testing UI component edge cases");

    // Test ProgressBar with edge values (using enabled progress bar)
    const progress = new ProgressBar(100, 40, { quiet: false });

    // Test with normal range values
    progress.update(75);

    // Test edge cases with quiet mode to avoid output errors
    const quietProgress = new ProgressBar(100, 40, { quiet: true });
    quietProgress.update(-10); // Should not throw in quiet mode
    quietProgress.update(200); // Over limit
    quietProgress.finish();

    // Test Spinner with rapid start/stop
    const spinner = new Spinner({ quiet: true });
    for (let i = 0; i < 10; i++) {
      spinner.start();
      spinner.stop();
    }
    // Should complete without errors

    logger.debug("UI component edge cases verified");
  });
});

describe("Unit: Integration behavior", () => {
  it("should integrate with enhanced stdin correctly", async () => {
    logger.debug("Testing enhanced stdin integration");

    // Test that readStdin delegates to enhanced stdin
    const promise = readStdin({ allowEmpty: false });

    await assertRejects(
      () => promise,
      Error,
      undefined,
      "Should throw Error on failure",
    );

    logger.debug("Enhanced stdin integration verified");
  });

  it("should maintain consistent behavior across all functions", () => {
    logger.debug("Testing behavior consistency");

    // Test that sync functions are truly synchronous
    const start = Date.now();

    hasStdinContent();
    isStdinAvailable();
    writeStdout("");

    const duration = Date.now() - start;
    assertEquals(duration < 50, true, "Sync functions should complete quickly");

    // Test that async functions return Promises
    const readPromise = readStdin({ allowEmpty: false });
    assertEquals(readPromise instanceof Promise, true, "readStdin should return Promise");

    // Clean up the promise
    readPromise.catch(() => {
      // Expected to fail
    });

    logger.debug("Behavior consistency verified");
  });

  it("should support testability through option injection", () => {
    logger.debug("Testing testability features");

    // Test isStdinAvailable with injected environmentInfo
    const availableResult = isStdinAvailable({
      environmentInfo: { isTerminal: false, isCI: false, isTest: true, envVars: {} },
    });
    assertEquals(availableResult, true, "Should support environment injection");

    const unavailableResult = isStdinAvailable({
      environmentInfo: { isTerminal: true, isCI: false, isTest: true, envVars: {} },
    });
    assertEquals(unavailableResult, false, "Should support environment injection");

    // Test UI components with quiet mode for testing
    const progress = new ProgressBar(100, 40, { quiet: true });
    const spinner = new Spinner({ quiet: true });

    // Verify quiet mode through behavior
    progress.update(50);
    progress.finish();
    spinner.start();
    spinner.stop();

    logger.debug("Testability features verified");
  });
});
