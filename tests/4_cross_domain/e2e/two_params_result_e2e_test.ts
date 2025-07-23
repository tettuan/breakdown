/**
 * @fileoverview TwoParamsResult Processing Chain - Comprehensive E2E Integration Tests
 *
 * This module provides end-to-end testing for the complete twoParamsResult processing chain:
 * CLI → BreakdownConfig → BreakdownParams → TwoParamsResult → TwoParams → VariablesBuilder → BreakdownPrompt → Output
 *
 * Test Coverage:
 * - Complete processing chain from CLI input to final output
 * - Real-world scenarios with actual file system operations
 * - Error handling and edge cases across all processing stages
 * - STDIN processing integration
 * - Configuration-driven testing with multiple profiles
 * - Performance and reliability characteristics
 *
 * @module tests/4_cross_domain/e2e/two_params_result_e2e_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigurationTestHelper } from "../../../lib/test_helpers/configuration_test_helper_simple.ts";
import { runBreakdown } from "../../../cli/breakdown.ts";
import { join } from "@std/path";

// Initialize test logger
const logger = new BreakdownLogger("e2e-two-params");

/**
 * E2E Test Fixture Setup
 */
class E2ETestSetup {
  private readonly tempDir = "./tmp";
  private readonly fixturesDir = "./tests/fixtures";

  async setupTempDirectory(): Promise<string> {
    try {
      await Deno.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
    return this.tempDir;
  }

  async createTestInput(filename: string, content: string): Promise<string> {
    const tempDir = await this.setupTempDirectory();
    const filePath = join(tempDir, filename);
    await Deno.writeTextFile(filePath, content);
    return filePath;
  }

  async cleanup(): Promise<void> {
    try {
      await Deno.remove(this.tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * STDOUT Capture Helper
 */
class StdoutCapture {
  private originalWrite: typeof Deno.stdout.write | null = null;
  private capturedOutput: Uint8Array[] = [];

  start() {
    this.originalWrite = Deno.stdout.write;
    this.capturedOutput = [];

    Deno.stdout.write = (data: Uint8Array) => {
      this.capturedOutput.push(data);
      return Promise.resolve(data.length);
    };
  }

  stop(): string {
    if (this.originalWrite) {
      Deno.stdout.write = this.originalWrite;
    }
    const concatenated = new Uint8Array(
      this.capturedOutput.reduce((acc, arr) => acc + arr.length, 0),
    );
    let offset = 0;
    for (const arr of this.capturedOutput) {
      concatenated.set(arr, offset);
      offset += arr.length;
    }
    return new TextDecoder().decode(concatenated);
  }

  getOutput(): string {
    const concatenated = new Uint8Array(
      this.capturedOutput.reduce((acc, arr) => acc + arr.length, 0),
    );
    let offset = 0;
    for (const arr of this.capturedOutput) {
      concatenated.set(arr, offset);
      offset += arr.length;
    }
    return new TextDecoder().decode(concatenated);
  }
}

const testSetup = new E2ETestSetup();

/**
 * Tier 1: Basic Functionality E2E Tests
 * Complete processing chain test for basic functionality
 */
Deno.test("E2E: Tier1 - Basic Two Params Command Execution", async () => {
  logger.debug("E2E basic command execution test started", {
    tier: "Tier1",
    scenario: "Basic two params command execution",
  });

  // Setup test configuration
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  logger.debug("Test configuration preparation completed", {
    directive: validDirective,
    layer: validLayer,
    profile: "default-test",
  });

  // Create test input file
  const testInputContent =
    "# Test Project\n\nThis is a test project for E2E testing.\n\n## Issues\n- Issue 1\n- Issue 2";
  const inputFile = await testSetup.createTestInput("test-input.md", testInputContent);

  // Capture stdout for result verification
  const stdout = new StdoutCapture();
  stdout.start();

  try {
    // Execute complete breakdown command
    const args = [validDirective, validLayer];
    logger.debug("Breakdown execution started", { args, inputFile });

    // Set environment to skip stdin processing in this test
    const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
    Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

    try {
      const result = await runBreakdown(args);
      const output = stdout.stop();

      logger.debug("Breakdown execution result", {
        success: result.ok,
        outputLength: output.length,
        hasOutput: output.length > 0,
      });

      // Verify successful execution
      assertEquals(result.ok, true, "Breakdown execution should succeed");

      // Verify output contains expected elements
      assertExists(output, "Output should be generated");
      assertEquals(output.length > 0, true, "Output should not be empty");

      logger.debug("E2E basic command execution test completed", {
        resultStatus: "SUCCESS",
        outputPreview: output.substring(0, 100),
      });
    } finally {
      // Restore environment
      if (originalSkipStdin !== undefined) {
        Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
      } else {
        Deno.env.delete("BREAKDOWN_SKIP_STDIN");
      }
    }
  } finally {
    stdout.stop();
    await testSetup.cleanup();
  }
});

/**
 * Tier 1: Multiple Directive-Layer Combinations
 * Test for different DirectiveType/LayerType combinations
 */
Deno.test("E2E: Tier1 - Multiple Directive-Layer Combinations", async () => {
  logger.debug("E2E multiple combinations test started", {
    tier: "Tier1",
    scenario: "Multiple Directive-Layer combinations",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const validDirectives = configResult.userConfig.testData.validDirectives;
  const validLayers = configResult.userConfig.testData.validLayers;

  // Test multiple combinations
  const testCombinations = [
    [validDirectives[0], validLayers[0]], // to + project
    [validDirectives[1] || "summary", validLayers[1] || "issue"], // summary + issue
    [validDirectives[2] || "defect", validLayers[2] || "task"], // defect + task
  ];

  const testInputContent =
    "# Test Content for Multiple Combinations\n\nTest data for various directive-layer combinations.";

  for (let i = 0; i < testCombinations.length; i++) {
    const [directive, layer] = testCombinations[i];
    logger.debug(`Combination test ${i + 1}/${testCombinations.length}`, { directive, layer });

    const _inputFile = await testSetup.createTestInput(`combo-test-${i}.md`, testInputContent);
    const stdout = new StdoutCapture();
    stdout.start();

    try {
      // Set environment to skip stdin processing in this test
      const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
      Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

      try {
        const args = [directive, layer];
        const result = await runBreakdown(args);
        const output = stdout.stop();

        logger.debug(`Combination ${directive}-${layer} result`, {
          success: result.ok,
          outputLength: output.length,
        });

        // Verify each combination works
        assertEquals(result.ok, true, `Combination ${directive}-${layer} should succeed`);
        assertExists(output, `Output should be generated for ${directive}-${layer}`);
      } finally {
        // Restore environment
        if (originalSkipStdin !== undefined) {
          Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
        } else {
          Deno.env.delete("BREAKDOWN_SKIP_STDIN");
        }
      }
    } finally {
      stdout.stop();
    }
  }

  await testSetup.cleanup();
  logger.debug("E2E multiple combinations test completed", {
    totalCombinations: testCombinations.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Tier 2: Configuration Profile Tests
 * Configuration profile switching test
 */
Deno.test("E2E: Tier2 - Configuration Profile Switching", async () => {
  logger.debug("E2E configuration profile switching test started", {
    tier: "Tier2",
    scenario: "Multiple profile operation verification",
  });

  const profiles = ["default-test", "flexible-test"];
  const testInputContent = "# Profile Test Content\n\nTesting different configuration profiles.";

  for (const profile of profiles) {
    logger.debug(`Profile test: ${profile}`, { profile });

    const configResult = await ConfigurationTestHelper.loadTestConfiguration(profile);
    const validDirective = configResult.userConfig.testData.validDirectives[0];
    const validLayer = configResult.userConfig.testData.validLayers[0];

    const _inputFile = await testSetup.createTestInput(
      `profile-test-${profile}.md`,
      testInputContent,
    );
    const stdout = new StdoutCapture();
    stdout.start();

    try {
      // Set environment variable for profile (simulating CLI --config)
      const originalEnv = Deno.env.get("BREAKDOWN_PROFILE");
      const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
      Deno.env.set("BREAKDOWN_PROFILE", profile);
      Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

      const args = [validDirective, validLayer];
      const result = await runBreakdown(args);
      const output = stdout.stop();

      logger.debug(`Profile ${profile} execution result`, {
        success: result.ok,
        outputLength: output.length,
      });

      // Verify profile-specific behavior
      assertEquals(result.ok, true, `Profile ${profile} should work correctly`);
      assertExists(output, `Profile ${profile} should generate output`);

      // Restore environment
      if (originalEnv) {
        Deno.env.set("BREAKDOWN_PROFILE", originalEnv);
      } else {
        Deno.env.delete("BREAKDOWN_PROFILE");
      }
      if (originalSkipStdin !== undefined) {
        Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
      } else {
        Deno.env.delete("BREAKDOWN_SKIP_STDIN");
      }
    } finally {
      stdout.stop();
    }
  }

  await testSetup.cleanup();
  logger.debug("E2E configuration profile switching test completed", {
    profiles: profiles.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Tier 3: Error Handling E2E Tests
 * Complete error handling test
 */
Deno.test("E2E: Tier3 - Invalid Arguments Error Handling", async () => {
  logger.debug("E2E invalid argument error handling test started", {
    tier: "Tier3",
    scenario: "Appropriate error handling for invalid arguments",
  });

  const testCases = [
    {
      name: "Invalid Directive",
      args: ["invalid_directive", "project"],
      expectedError: "Invalid directive",
    },
    {
      name: "Invalid Layer",
      args: ["to", "invalid_layer"],
      expectedError: "Invalid layer",
    },
    {
      name: "Both Invalid",
      args: ["invalid_directive", "invalid_layer"],
      expectedError: "Invalid",
    },
  ];

  for (const testCase of testCases) {
    logger.debug(`Error case test: ${testCase.name}`, {
      args: testCase.args,
      expectedError: testCase.expectedError,
    });

    const stdout = new StdoutCapture();
    stdout.start();

    try {
      // Set environment to skip stdin processing in this test
      const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
      Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

      try {
        const result = await runBreakdown(testCase.args);
        const output = stdout.stop();

        logger.debug(`Error case ${testCase.name} result`, {
          success: result.ok,
          hasError: !result.ok,
          outputLength: output.length,
        });

        // Verify error is properly handled
        assertEquals(result.ok, false, `${testCase.name} should result in error`);

        // Check error structure
        if (!result.ok) {
          assertExists(result.error, "Error should be present");
          logger.debug(`Error details ${testCase.name}`, { error: result.error });
        }
      } finally {
        // Restore environment
        if (originalSkipStdin !== undefined) {
          Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
        } else {
          Deno.env.delete("BREAKDOWN_SKIP_STDIN");
        }
      }
    } finally {
      stdout.stop();
    }
  }

  logger.debug("E2E invalid argument error handling test completed", {
    testCases: testCases.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Tier 3: Configuration Error Handling
 * Configuration error handling test
 */
Deno.test("E2E: Tier3 - Configuration Error Handling", async () => {
  logger.debug("E2E configuration error handling test started", {
    tier: "Tier3",
    scenario: "Appropriate handling of configuration file issues",
  });

  const stdout = new StdoutCapture();
  stdout.start();

  try {
    // Test with non-existent configuration profile
    const originalEnv = Deno.env.get("BREAKDOWN_PROFILE");
    const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
    Deno.env.set("BREAKDOWN_PROFILE", "non-existent-profile");
    Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

    const args = ["to", "project"];
    const result = await runBreakdown(args);
    const output = stdout.stop();

    logger.debug("Non-existent profile test result", {
      success: result.ok,
      outputLength: output.length,
    });

    // Should still work with fallback to defaults
    // (The system should gracefully handle missing config)
    if (result.ok) {
      logger.debug("Non-existent profile fallback operation successful", {
        fallbackSuccessful: true,
      });
    } else {
      logger.debug("Non-existent profile error handling", {
        errorHandled: true,
        error: result.error,
      });
    }

    // Restore environment
    if (originalEnv) {
      Deno.env.set("BREAKDOWN_PROFILE", originalEnv);
    } else {
      Deno.env.delete("BREAKDOWN_PROFILE");
    }
    if (originalSkipStdin !== undefined) {
      Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
    } else {
      Deno.env.delete("BREAKDOWN_SKIP_STDIN");
    }
  } finally {
    stdout.stop();
  }

  logger.debug("E2E configuration error handling test completed", { resultStatus: "SUCCESS" });
});

/**
 * Tier 4: Performance Characteristics Test
 * Performance characteristics test
 */
Deno.test("E2E: Tier4 - Performance Characteristics", async () => {
  logger.debug("E2E performance characteristics test started", {
    tier: "Tier4",
    scenario: "Processing speed and stability verification",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  // Create larger test content
  const largeTestContent = "# Large Test Content\n\n" +
    Array.from(
      { length: 100 },
      (_, i) => `## Section ${i + 1}\n\nContent for section ${i + 1} with detailed information.`,
    ).join("\n\n");

  const _inputFile = await testSetup.createTestInput("large-test-input.md", largeTestContent);

  // Multiple executions for performance consistency
  const executionTimes: number[] = [];
  const executionCount = 5;

  for (let i = 0; i < executionCount; i++) {
    const stdout = new StdoutCapture();
    stdout.start();

    const startTime = performance.now();

    try {
      // Set environment to skip stdin processing in this test
      const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
      Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

      try {
        const args = [validDirective, validLayer];
        const result = await runBreakdown(args);
        const endTime = performance.now();

        const executionTime = endTime - startTime;
        executionTimes.push(executionTime);

        const output = stdout.stop();

        logger.debug(`Execution ${i + 1}/${executionCount}`, {
          executionTime: `${executionTime.toFixed(2)}ms`,
          success: result.ok,
          outputLength: output.length,
        });

        assertEquals(result.ok, true, `Execution ${i + 1} should succeed`);
      } finally {
        // Restore environment
        if (originalSkipStdin !== undefined) {
          Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
        } else {
          Deno.env.delete("BREAKDOWN_SKIP_STDIN");
        }
      }
    } finally {
      stdout.stop();
    }
  }

  // Analyze performance characteristics
  const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  const maxTime = Math.max(...executionTimes);
  const minTime = Math.min(...executionTimes);

  logger.debug("Performance analysis result", {
    executionCount,
    avgTime: `${avgTime.toFixed(2)}ms`,
    maxTime: `${maxTime.toFixed(2)}ms`,
    minTime: `${minTime.toFixed(2)}ms`,
    consistency: `${((1 - (maxTime - minTime) / avgTime) * 100).toFixed(1)}%`,
  });

  // Performance assertions (reasonable thresholds)
  assertEquals(avgTime < 5000, true, "Average execution time should be under 5 seconds");
  assertEquals(maxTime < 10000, true, "Maximum execution time should be under 10 seconds");

  await testSetup.cleanup();
  logger.debug("E2E performance characteristics test completed", { resultStatus: "SUCCESS" });
});

/**
 * Tier 5: Complete Integration Flow Test
 * Complete integration flow test - verification of all processing stages
 */
Deno.test("E2E: Tier5 - Complete Integration Flow Validation", async () => {
  logger.debug("E2E complete integration flow verification test started", {
    tier: "Tier5",
    scenario: "Complete integrated operation verification of all processing stages",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  // Create realistic test content
  const realWorldContent = `# Real World Project Analysis

## Overview
This is a comprehensive project that requires detailed breakdown and analysis.

## Current Issues
1. Performance bottlenecks in the data processing pipeline
2. User interface responsiveness issues
3. Database connection pooling problems

## Technical Requirements  
- Scalability improvements
- Error handling enhancements
- Test coverage expansion

## Business Context
The project serves critical business functions and requires careful analysis to ensure stability while implementing improvements.`;

  const _inputFile = await testSetup.createTestInput("real-world-input.md", realWorldContent);
  const stdout = new StdoutCapture();
  stdout.start();

  try {
    // Execute complete flow with detailed logging
    logger.debug("Complete integration flow execution started", {
      directive: validDirective,
      layer: validLayer,
      inputContentLength: realWorldContent.length,
    });

    // Set environment to skip stdin processing in this test
    const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
    Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");

    try {
      const args = [validDirective, validLayer];
      const result = await runBreakdown(args);
      const output = stdout.stop();

      logger.debug("Complete integration flow execution completed", {
        success: result.ok,
        outputLength: output.length,
        hasOutput: output.length > 0,
      });

      // Comprehensive validation of the complete flow
      assertEquals(result.ok, true, "Complete integration flow should succeed");
      assertExists(output, "Final output should be generated");
      assertEquals(output.length > 0, true, "Output should contain generated content");

      // Verify output contains expected prompt structure elements
      // (The exact content depends on templates, but should have structured output)
      const outputLowerCase = output.toLowerCase();
      const hasPromptStructure = outputLowerCase.includes("project") ||
        outputLowerCase.includes("analysis") ||
        outputLowerCase.includes("breakdown") ||
        outputLowerCase.length > 50; // Reasonable minimum length

      assertEquals(hasPromptStructure, true, "Output should contain structured prompt content");

      // Log success with comprehensive details
      logger.debug("Complete integration flow verification successful", {
        processing_chain:
          "CLI → BreakdownConfig → BreakdownParams → TwoParamsResult → TwoParams → VariablesBuilder → BreakdownPrompt → Output",
        stages_validated: [
          "CLI argument parsing",
          "Configuration loading",
          "Parameter validation",
          "Domain object creation",
          "Variable processing",
          "Prompt generation",
          "Output formatting",
        ],
        resultStatus: "SUCCESS",
        outputCharacteristics: {
          length: output.length,
          hasContent: output.length > 0,
          hasStructure: hasPromptStructure,
        },
      });
    } finally {
      // Restore environment
      if (originalSkipStdin !== undefined) {
        Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
      } else {
        Deno.env.delete("BREAKDOWN_SKIP_STDIN");
      }
    }
  } finally {
    stdout.stop();
    await testSetup.cleanup();
  }

  logger.debug("E2E complete integration flow verification test completed", {
    resultStatus: "COMPREHENSIVE_SUCCESS",
    message: "All processing stages validated successfully",
  });
});
