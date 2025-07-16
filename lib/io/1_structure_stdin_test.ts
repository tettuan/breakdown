/**
 * @fileoverview Structure tests for stdin module
 *
 * Tests structural constraints and organization of the stdin module
 * with the current enhanced_stdin implementation
 *
 * @module io/stdin_structure_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import all exports to test structure
import * as StdinModule from "./enhanced_stdin.ts";

const logger = new BreakdownLogger("stdin-structure");

describe("Structure: Function categorization", () => {
  it("should organize exports into logical categories", () => {
    logger.debug("Testing export categorization");

    // Category 1: Core I/O functions
    const coreIOFunctions = {
      readStdinEnhanced: StdinModule.readStdinEnhanced,
      safeReadStdin: StdinModule.safeReadStdin,
      isStdinAvailableEnhanced: StdinModule.isStdinAvailableEnhanced,
      shouldSkipStdinProcessing: StdinModule.shouldSkipStdinProcessing,
    };

    // Category 2: Error handling
    const errorHandling = {
      EnhancedStdinError: StdinModule.EnhancedStdinError,
    };

    // Category 3: Environment detection
    const environmentDetection = {
      detectEnvironment: StdinModule.detectEnvironment,
      createStdinReaderForEnvironment: StdinModule.createStdinReaderForEnvironment,
    };

    // Verify all categories are properly exported
    Object.entries(coreIOFunctions).forEach(([name, value]) => {
      assertExists(value, `Core I/O function ${name} must be exported`);
      assertEquals(typeof value, "function", `${name} should be a function`);
    });

    Object.entries(errorHandling).forEach(([name, value]) => {
      assertExists(value, `Error class ${name} must be exported`);
      assertEquals(typeof value, "function", `${name} should be a constructor/class`);
    });

    Object.entries(environmentDetection).forEach(([name, value]) => {
      assertExists(value, `Environment function ${name} must be exported`);
      assertEquals(typeof value, "function", `${name} should be a function`);
    });

    logger.debug("Export categorization verified");
  });

  it("should export correct number of public functions", () => {
    logger.debug("Testing public API surface");

    const exports = Object.keys(StdinModule);
    const functionExports = exports.filter(
      (key) => typeof (StdinModule as any)[key] === "function",
    );

    // Core functions we expect
    const expectedFunctions = [
      "readStdinEnhanced",
      "safeReadStdin",
      "isStdinAvailableEnhanced",
      "shouldSkipStdinProcessing",
      "detectEnvironment",
      "createStdinReaderForEnvironment",
      "EnhancedStdinError",
    ];

    for (const funcName of expectedFunctions) {
      assertEquals(
        functionExports.includes(funcName),
        true,
        `Expected function ${funcName} to be exported`,
      );
    }

    logger.debug(`Found ${functionExports.length} function exports`);
  });

  it("should maintain consistent naming patterns", () => {
    logger.debug("Testing naming consistency");

    const exports = Object.keys(StdinModule);

    // Enhanced functions should have 'Enhanced' suffix
    const enhancedFunctions = exports.filter((name) => name.includes("Enhanced"));
    assertEquals(enhancedFunctions.length >= 2, true, "Should have at least 2 enhanced functions");

    // Environment-related functions should be clearly named
    const envFunctions = exports.filter(
      (name) => name.toLowerCase().includes("environment") || name.toLowerCase().includes("env"),
    );
    assertEquals(envFunctions.length >= 1, true, "Should have environment-related functions");

    logger.debug("Naming patterns verified");
  });
});
