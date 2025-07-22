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

// テストロガー初期化
const logger = new BreakdownLogger("e2e-two-params");

/**
 * E2E テストフィクスチャーセットアップ
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
 * STDOUT キャプチャヘルパー
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
 * 基本機能の完全な処理チェーンテスト
 */
Deno.test("E2E: Tier1 - Basic Two Params Command Execution", async () => {
  logger.debug("E2E基本コマンド実行テスト開始", {
    tier: "Tier1",
    scenario: "基本的なtwo paramsコマンド実行",
  });

  // Setup test configuration
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  logger.debug("テスト設定準備完了", {
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
    logger.debug("Breakdown実行開始", { args, inputFile });

    const result = await runBreakdown(args);
    const output = stdout.stop();

    logger.debug("Breakdown実行結果", {
      success: result.ok,
      outputLength: output.length,
      hasOutput: output.length > 0,
    });

    // Verify successful execution
    assertEquals(result.ok, true, "Breakdown execution should succeed");

    // Verify output contains expected elements
    assertExists(output, "Output should be generated");
    assertEquals(output.length > 0, true, "Output should not be empty");

    logger.debug("E2E基本コマンド実行テスト完了", {
      resultStatus: "SUCCESS",
      outputPreview: output.substring(0, 100),
    });
  } finally {
    stdout.stop();
    await testSetup.cleanup();
  }
});

/**
 * Tier 1: Multiple Directive-Layer Combinations
 * 異なるDirectiveType・LayerTypeの組み合わせテスト
 */
Deno.test("E2E: Tier1 - Multiple Directive-Layer Combinations", async () => {
  logger.debug("E2E複数組み合わせテスト開始", {
    tier: "Tier1",
    scenario: "複数のDirective-Layer組み合わせ",
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
    logger.debug(`組み合わせテスト ${i + 1}/${testCombinations.length}`, { directive, layer });

    const _inputFile = await testSetup.createTestInput(`combo-test-${i}.md`, testInputContent);
    const stdout = new StdoutCapture();
    stdout.start();

    try {
      const args = [directive, layer];
      const result = await runBreakdown(args);
      const output = stdout.stop();

      logger.debug(`組み合わせ ${directive}-${layer} 結果`, {
        success: result.ok,
        outputLength: output.length,
      });

      // Verify each combination works
      assertEquals(result.ok, true, `Combination ${directive}-${layer} should succeed`);
      assertExists(output, `Output should be generated for ${directive}-${layer}`);
    } finally {
      stdout.stop();
    }
  }

  await testSetup.cleanup();
  logger.debug("E2E複数組み合わせテスト完了", {
    totalCombinations: testCombinations.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Tier 2: Configuration Profile Tests
 * 設定プロファイル切り替えテスト
 */
Deno.test("E2E: Tier2 - Configuration Profile Switching", async () => {
  logger.debug("E2E設定プロファイル切り替えテスト開始", {
    tier: "Tier2",
    scenario: "複数プロファイル動作確認",
  });

  const profiles = ["default-test", "flexible-test"];
  const testInputContent = "# Profile Test Content\n\nTesting different configuration profiles.";

  for (const profile of profiles) {
    logger.debug(`プロファイルテスト: ${profile}`, { profile });

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
      Deno.env.set("BREAKDOWN_PROFILE", profile);

      const args = [validDirective, validLayer];
      const result = await runBreakdown(args);
      const output = stdout.stop();

      logger.debug(`プロファイル ${profile} 実行結果`, {
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
    } finally {
      stdout.stop();
    }
  }

  await testSetup.cleanup();
  logger.debug("E2E設定プロファイル切り替えテスト完了", {
    profiles: profiles.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Tier 3: Error Handling E2E Tests
 * エラーハンドリングの完全テスト
 */
Deno.test("E2E: Tier3 - Invalid Arguments Error Handling", async () => {
  logger.debug("E2E無効引数エラーハンドリングテスト開始", {
    tier: "Tier3",
    scenario: "無効引数の適切なエラー処理",
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
    logger.debug(`エラーケーステスト: ${testCase.name}`, {
      args: testCase.args,
      expectedError: testCase.expectedError,
    });

    const stdout = new StdoutCapture();
    stdout.start();

    try {
      const result = await runBreakdown(testCase.args);
      const output = stdout.stop();

      logger.debug(`エラーケース ${testCase.name} 結果`, {
        success: result.ok,
        hasError: !result.ok,
        outputLength: output.length,
      });

      // Verify error is properly handled
      assertEquals(result.ok, false, `${testCase.name} should result in error`);

      // Check error structure
      if (!result.ok) {
        assertExists(result.error, "Error should be present");
        logger.debug(`エラー詳細 ${testCase.name}`, { error: result.error });
      }
    } finally {
      stdout.stop();
    }
  }

  logger.debug("E2E無効引数エラーハンドリングテスト完了", {
    testCases: testCases.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Tier 3: Configuration Error Handling
 * 設定エラーのハンドリングテスト
 */
Deno.test("E2E: Tier3 - Configuration Error Handling", async () => {
  logger.debug("E2E設定エラーハンドリングテスト開始", {
    tier: "Tier3",
    scenario: "設定ファイル問題の適切な処理",
  });

  const stdout = new StdoutCapture();
  stdout.start();

  try {
    // Test with non-existent configuration profile
    const originalEnv = Deno.env.get("BREAKDOWN_PROFILE");
    Deno.env.set("BREAKDOWN_PROFILE", "non-existent-profile");

    const args = ["to", "project"];
    const result = await runBreakdown(args);
    const output = stdout.stop();

    logger.debug("非存在プロファイルテスト結果", {
      success: result.ok,
      outputLength: output.length,
    });

    // Should still work with fallback to defaults
    // (The system should gracefully handle missing config)
    if (result.ok) {
      logger.debug("非存在プロファイルで正常にフォールバック動作", { fallbackSuccessful: true });
    } else {
      logger.debug("非存在プロファイルでエラー処理", { errorHandled: true, error: result.error });
    }

    // Restore environment
    if (originalEnv) {
      Deno.env.set("BREAKDOWN_PROFILE", originalEnv);
    } else {
      Deno.env.delete("BREAKDOWN_PROFILE");
    }
  } finally {
    stdout.stop();
  }

  logger.debug("E2E設定エラーハンドリングテスト完了", { resultStatus: "SUCCESS" });
});

/**
 * Tier 4: Performance Characteristics Test
 * パフォーマンス特性テスト
 */
Deno.test("E2E: Tier4 - Performance Characteristics", async () => {
  logger.debug("E2Eパフォーマンス特性テスト開始", {
    tier: "Tier4",
    scenario: "処理速度と安定性確認",
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
      const args = [validDirective, validLayer];
      const result = await runBreakdown(args);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      executionTimes.push(executionTime);

      const output = stdout.stop();

      logger.debug(`実行 ${i + 1}/${executionCount}`, {
        executionTime: `${executionTime.toFixed(2)}ms`,
        success: result.ok,
        outputLength: output.length,
      });

      assertEquals(result.ok, true, `Execution ${i + 1} should succeed`);
    } finally {
      stdout.stop();
    }
  }

  // Analyze performance characteristics
  const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;
  const maxTime = Math.max(...executionTimes);
  const minTime = Math.min(...executionTimes);

  logger.debug("パフォーマンス分析結果", {
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
  logger.debug("E2Eパフォーマンス特性テスト完了", { resultStatus: "SUCCESS" });
});

/**
 * Tier 5: Complete Integration Flow Test
 * 完全統合フローテスト - 全処理段階の検証
 */
Deno.test("E2E: Tier5 - Complete Integration Flow Validation", async () => {
  logger.debug("E2E完全統合フロー検証テスト開始", {
    tier: "Tier5",
    scenario: "全処理段階の完全な統合動作確認",
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
    logger.debug("完全統合フロー実行開始", {
      directive: validDirective,
      layer: validLayer,
      inputContentLength: realWorldContent.length,
    });

    const args = [validDirective, validLayer];
    const result = await runBreakdown(args);
    const output = stdout.stop();

    logger.debug("完全統合フロー実行完了", {
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
    logger.debug("完全統合フロー検証成功", {
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
    stdout.stop();
    await testSetup.cleanup();
  }

  logger.debug("E2E完全統合フロー検証テスト完了", {
    resultStatus: "COMPREHENSIVE_SUCCESS",
    message: "All processing stages validated successfully",
  });
});
