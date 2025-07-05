/**
 * STDIN Test Helper
 *
 * CI環境でSTDINテストを安全に実行するためのヘルパー関数群
 *
 * @module
 */

import {
  CIStdinTestFramework,
  EnhancedTerminalDetector,
  StdinEnvironmentController,
  type StdinMockConfig,
  StdinTestScenario,
} from "../../lib/io/ci_stdin_test_framework.ts";
import { assertEquals, assertRejects } from "jsr:@std/assert@1.0.8";

/**
 * STDIN test utilities for use in test files
 */
export class StdinTestUtils {
  private static framework = new CIStdinTestFramework();

  /**
   * Test STDIN functionality across different environments
   */
  static async testStdinAcrossEnvironments<T>(
    testName: string,
    testFunction: (scenario: StdinTestScenario, mockConfig: StdinMockConfig) => Promise<T>,
  ): Promise<void> {
    const _scenarios = this.framework.createTestScenarios();

    for (const config of _scenarios) {
      await Deno.test(`${testName} - ${config.scenario}`, async () => {
        await this.framework.runStdinTest(config, async () => {
          return await testFunction(config.scenario, config);
        });
      });
    }
  }

  /**
   * Test specific STDIN scenario
   */
  static async testStdinScenario<T>(
    testName: string,
    config: StdinMockConfig,
    testFunction: (mockConfig: StdinMockConfig) => Promise<T>,
  ): Promise<void> {
    await Deno.test(testName, async () => {
      await this.framework.runStdinTest(config, async () => {
        return await testFunction(config);
      });
    });
  }

  /**
   * Test CI-specific STDIN behavior
   */
  static async testCIStdinBehavior<T>(
    testName: string,
    inputData: string,
    testFunction: (inputData: string) => Promise<T>,
  ): Promise<void> {
    const config: StdinMockConfig = {
      scenario: StdinTestScenario.CI_PIPED,
      inputData,
      isTerminal: false,
      envVars: {
        CI: "true",
        GITHUB_ACTIONS: "true",
        // STDIN_DEBUG removed - use LOG_LEVEL
      },
      debug: true,
    };

    await this.testStdinScenario(testName, config, async () => {
      return await testFunction(inputData);
    });
  }

  /**
   * Test terminal detection in various environments
   */
  static async testTerminalDetection(): Promise<void> {
    await Deno.test("Terminal detection - CI environment", async () => {
      const config: StdinMockConfig = {
        scenario: StdinTestScenario.CI_NO_INPUT,
        isTerminal: true,
        envVars: { CI: "true", GITHUB_ACTIONS: "true" },
        debug: true,
      };

      await this.framework.runStdinTest(config, () => {
        const _result = EnhancedTerminalDetector.detectTerminalState();
        assertEquals(_result.envInfo.isCI, true);
        assertEquals(_result.isTerminal, true);
        return Promise.resolve();
      });
    });

    await Deno.test("Terminal detection - piped input", async () => {
      const config: StdinMockConfig = {
        scenario: StdinTestScenario.PIPED_INPUT,
        inputData: "test data",
        isTerminal: false,
        debug: true,
      };

      await this.framework.runStdinTest(config, () => {
        const _result = EnhancedTerminalDetector.detectTerminalState();
        assertEquals(_result.isTerminal, false);
        assertEquals(_result.confidence, "high");
        return Promise.resolve();
      });
    });
  }

  /**
   * Validate environment configuration
   */
  static validateEnvironmentConfig(): void {
    Deno.test("Environment configuration validation", () => {
      const config = StdinEnvironmentController.getEnvironmentConfig();

      // Validate structure
      assertEquals(typeof config.ci.enabled, "boolean");
      assertEquals(typeof config.test.enabled, "boolean");
      assertEquals(typeof config.debug.enabled, "boolean");
      assertEquals(typeof config.timeout.default, "number");

      // Validate timeout values are reasonable
      assertEquals(config.timeout.default > 0, true);
      assertEquals(config.timeout.ci > 0, true);
      assertEquals(config.timeout.test > 0, true);
    });
  }

  /**
   * Create mock configuration for specific test needs
   */
  static createMockConfig(overrides: Partial<StdinMockConfig> = {}): StdinMockConfig {
    return {
      scenario: StdinTestScenario.TEST_CONTROLLED,
      inputData: "test input",
      isTerminal: false,
      envVars: { DENO_TESTING: "true" }, // STDIN_DEBUG removed
      timeout: 1000,
      debug: true,
      ...overrides,
    };
  }

  /**
   * Assert STDIN operation results
   */
  static assertStdinResult(
    result: { success: boolean; content: string; skipped: boolean; reason?: string },
    expected: { success: boolean; contentMatch?: string | RegExp; skipped: boolean },
  ): void {
    assertEquals(
      result.success,
      expected.success,
      `Success mismatch: ${result.reason || "no reason"}`,
    );
    assertEquals(result.skipped, expected.skipped, "Skipped status mismatch");

    if (expected.contentMatch) {
      if (typeof expected.contentMatch === "string") {
        assertEquals(result.content, expected.contentMatch, "Content exact match failed");
      } else {
        assertEquals(
          expected.contentMatch.test(result.content),
          true,
          "Content regex match failed",
        );
      }
    }
  }

  /**
   * Test timeout behavior safely
   */
  static async testTimeoutBehavior(
    testName: string,
    timeout: number,
    expectTimeout: boolean = true,
  ): Promise<void> {
    await Deno.test(testName, async () => {
      const config: StdinMockConfig = {
        scenario: StdinTestScenario.NO_INPUT,
        inputData: "",
        isTerminal: true,
        timeout,
        debug: true,
      };

      if (expectTimeout) {
        await this.framework.runStdinTest(config, async () => {
          // Import the function to test here to avoid circular dependencies
          const { readStdinEnhanced } = await import("../../lib/io/enhanced_stdin.ts");

          await assertRejects(
            async () => {
              await readStdinEnhanced({ timeout, debug: true });
            },
            Error,
            "timeout",
          );
        });
      } else {
        await this.framework.runStdinTest(config, async () => {
          // Test should complete without timeout
          const { readStdinEnhanced } = await import("../../lib/io/enhanced_stdin.ts");

          try {
            await readStdinEnhanced({ timeout, allowEmpty: true, debug: true });
          } catch (error) {
            // Check if it's a timeout error
            const isTimeoutError = error instanceof Error && error.message.includes("timeout");
            assertEquals(
              isTimeoutError,
              false,
              `Unexpected timeout: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        });
      }
    });
  }
}

/**
 * Environment variable setup helper for tests
 */
export class TestEnvironmentSetup {
  private originalEnv: Record<string, string> = {};

  /**
   * Setup test environment with specific variables
   */
  setup(envVars: Record<string, string>): void {
    // Backup original values
    for (const key of Object.keys(envVars)) {
      const original = Deno.env.get(key);
      if (original !== undefined) {
        this.originalEnv[key] = original;
      }
    }

    // Set test values
    for (const [key, value] of Object.entries(envVars)) {
      Deno.env.set(key, value);
    }
  }

  /**
   * Restore original environment
   */
  cleanup(): void {
    // Restore original values
    for (const [key, value] of Object.entries(this.originalEnv)) {
      Deno.env.set(key, value);
    }

    // Clear test-only variables
    const testOnlyVars = ["TEST_STDIN_AVAILABLE"]; // Removed obsolete env vars
    for (const key of testOnlyVars) {
      if (!(key in this.originalEnv)) {
        Deno.env.delete(key);
      }
    }

    this.originalEnv = {};
  }

  /**
   * Run test with temporary environment
   */
  async withEnvironment<T>(
    envVars: Record<string, string>,
    testFunction: () => Promise<T>,
  ): Promise<T> {
    this.setup(envVars);
    try {
      return await testFunction();
    } finally {
      this.cleanup();
    }
  }
}
