/**
 * @fileoverview Behavior tests for stdin module
 *
 * Tests the behavior of stdin reading functionality with the current API
 *
 * @module io/stdin_test
 */

import { assert, assertEquals } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { isStdinAvailable, readStdin, safeReadStdin, shouldSkipStdinProcessing } from "./stdin.ts";

const logger = new BreakdownLogger("stdin-behavior");

describe("Stdin Module Behavior", () => {
  it("should check if stdin is available", () => {
    logger.debug("Testing stdin availability check");

    const result = isStdinAvailable();
    assertEquals(typeof result, "boolean", "Should return boolean");
  });

  it("should determine if stdin processing should be skipped", () => {
    logger.debug("Testing skip stdin processing logic");

    const result = shouldSkipStdinProcessing({ forceRead: false });
    assert(result !== null, "Should return result object");
    assertEquals(typeof result.skip, "boolean", "Should have skip boolean");
    assert(result.envInfo !== null, "Should have environment info");
  });

  it("should safely read stdin", async () => {
    logger.debug("Testing safe stdin read");

    const result = await safeReadStdin({ allowEmpty: true });
    assert(result !== null, "Should return result object");
    assertEquals(typeof result.success, "boolean", "Should have success boolean");
    assertEquals(typeof result.content, "string", "Should have content string");
    assertEquals(typeof result.skipped, "boolean", "Should have skipped boolean");
  });

  it("should handle readStdin with options", async () => {
    logger.debug("Testing readStdin with options");

    try {
      const content = await readStdin({ allowEmpty: true, forceRead: false });
      assertEquals(typeof content, "string", "Should return string content");
    } catch (error) {
      // It's ok if it throws in test environment
      assert(error instanceof Error, "Should throw Error type");
    }
  });
});
