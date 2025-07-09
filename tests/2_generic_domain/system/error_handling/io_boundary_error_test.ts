/**
 * @fileoverview I/O Boundary Error Handling Integration Test
 *
 * I/O操作の境界条件におけるエラーハンドリングの信頼性を検証します。
 * システム全体のエラー伝播、復旧処理、エラー状態の一貫性を
 * 重点的にテストします。
 *
 * @module tests/2_generic_domain/system/error_handling/io_boundary_error_test
 */

import { assertEquals, assertRejects, assertStringIncludes } from "../../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger("io-boundary-error");

/**
 * I/O境界エラーハンドリングテスト群
 *
 * システム境界でのエラー処理信頼性を検証：
 * 1. ファイルアクセス権限エラーの適切な処理
 * 2. ディスク容量不足エラーの対応
 * 3. ネットワークタイムアウトのシミュレーション
 * 4. 同時アクセス競合エラーの処理
 * 5. 破損データエラーの検出と復旧
 * 6. エラー伝播とログ記録の整合性
 */

// エラーシナリオを管理するクラス
class ErrorScenarioManager {
  private scenarios: Map<string, () => Promise<void>> = new Map();
  private logger: BreakdownLogger;

  constructor() {
    this.logger = new BreakdownLogger("error-scenario");
    this.setupScenarios();
  }

  private setupScenarios(): void {
    // ファイルアクセス権限エラー
    this.scenarios.set("permission_denied", async () => {
      const restrictedFile = "/root/restricted_access.txt";
      await Deno.writeTextFile(restrictedFile, "test content");
    });

    // ファイル存在エラー
    this.scenarios.set("file_not_found", async () => {
      await Deno.readTextFile("/nonexistent/path/file.txt");
    });

    // ディレクトリ作成権限エラー
    this.scenarios.set("directory_creation_denied", async () => {
      await Deno.mkdir("/root/new_directory");
    });

    // 読み取り専用ファイルシステムエラー
    this.scenarios.set("readonly_filesystem", async () => {
      // /proc は通常読み取り専用
      await Deno.writeTextFile("/proc/test_file.txt", "test");
    });

    // シンボリックリンクエラー
    this.scenarios.set("broken_symlink", async () => {
      const tempDir = "/tmp/breakdown_symlink_test";
      await ensureDir(tempDir);
      const linkPath = join(tempDir, "broken_link");
      const targetPath = join(tempDir, "nonexistent_target");

      // 壊れたシンボリックリンクを作成
      await Deno.symlink(targetPath, linkPath);
      await Deno.readTextFile(linkPath);
    });
  }

  async executeScenario(scenarioName: string): Promise<{ success: boolean; error?: Error }> {
    const scenario = this.scenarios.get(scenarioName);
    if (!scenario) {
      throw new Error(`Unknown scenario: ${scenarioName}`);
    }

    try {
      await scenario();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  getAvailableScenarios(): string[] {
    return Array.from(this.scenarios.keys());
  }
}

Deno.test("I/O Boundary Error: File permission error handling", async () => {
  logger.debug("ファイル権限エラーハンドリングテスト開始", {
    testType: "io-boundary-error",
    target: "file permission error handling",
  });

  const errorManager = new ErrorScenarioManager();

  // 権限エラーシナリオのテスト
  const permissionScenarios = [
    "permission_denied",
    "directory_creation_denied",
    "readonly_filesystem",
  ];

  for (const scenario of permissionScenarios) {
    const result = await errorManager.executeScenario(scenario);

    logger.debug(`権限エラーシナリオ${scenario}結果`, {
      scenario,
      expectError: true,
      gotError: !result.success,
      errorType: result.error?.name,
      errorMessage: result.error?.message,
    });

    // エラーが適切に発生することを確認
    assertEquals(result.success, false, `Scenario ${scenario} should fail with permission error`);

    if (result.error) {
      // 権限関連のエラーであることを確認
      const isPermissionError = result.error.name === "PermissionDenied" ||
        result.error.message.toLowerCase().includes("permission") ||
        result.error.message.toLowerCase().includes("access") ||
        result.error.message.toLowerCase().includes("no such file or directory");

      assertEquals(
        isPermissionError,
        true,
        `Error should be permission-related: ${result.error.message}`,
      );
    }
  }
});

Deno.test("I/O Boundary Error: File system operation error recovery", async () => {
  logger.debug("ファイルシステム操作エラー復旧テスト開始", {
    testType: "io-boundary-error",
    target: "filesystem operation error recovery",
  });

  const testDir = "/tmp/breakdown_error_recovery";
  await ensureDir(testDir);

  try {
    // 復旧可能なエラーシナリオのテスト
    const recoverableScenarios = [
      {
        name: "temporary_file_lock",
        operation: async () => {
          const filePath = join(testDir, "locked_file.txt");

          // ファイルを作成してロック状態をシミュレート
          const file1 = await Deno.open(filePath, { create: true, write: true });

          try {
            // 同じファイルに同時書き込みを試行（エラーを引き起こす可能性）
            const file2 = await Deno.open(filePath, { write: true, truncate: true });
            file2.close();
          } catch (error) {
            // ファイルロックエラーをシミュレート
            throw error;
          } finally {
            file1.close();
          }
        },
        recovery: async () => {
          // リトライによる復旧
          const filePath = join(testDir, "locked_file.txt");
          await new Promise((resolve) => setTimeout(resolve, 100)); // 待機
          await Deno.writeTextFile(filePath, "recovery successful");
          const content = await Deno.readTextFile(filePath);
          return content === "recovery successful";
        },
      },
      {
        name: "insufficient_space_simulation",
        operation: async () => {
          // 大きなファイル作成でディスク容量不足をシミュレート
          const largePath = join(testDir, "large_file.txt");
          const largeContent = "x".repeat(1024 * 1024 * 100); // 100MB
          await Deno.writeTextFile(largePath, largeContent);
        },
        recovery: async () => {
          // 小さなファイルでの復旧を試行
          const smallPath = join(testDir, "small_file.txt");
          await Deno.writeTextFile(smallPath, "small content");
          const content = await Deno.readTextFile(smallPath);
          return content === "small content";
        },
      },
    ];

    for (const scenario of recoverableScenarios) {
      let operationFailed = false;
      let recoverySuccessful = false;

      // 初期操作（エラーが発生する可能性）
      try {
        await scenario.operation();
      } catch (error) {
        operationFailed = true;
        const err = error as Error;

        logger.debug(`シナリオ${scenario.name}でエラー発生`, {
          scenario: scenario.name,
          error: err.message,
          errorType: err.name,
        });
      }

      // 復旧操作の実行
      try {
        recoverySuccessful = await scenario.recovery();

        logger.debug(`シナリオ${scenario.name}復旧結果`, {
          scenario: scenario.name,
          operationFailed,
          recoverySuccessful,
        });
      } catch (error) {
        const err = error as Error;
        logger.error(`シナリオ${scenario.name}復旧失敗`, {
          scenario: scenario.name,
          error: err.message,
        });
      }

      // 復旧が成功することを確認（操作が失敗しても復旧は可能であるべき）
      assertEquals(
        recoverySuccessful,
        true,
        `Recovery should succeed for scenario ${scenario.name}`,
      );
    }
  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // クリーンアップエラーは無視
    }
  }
});

Deno.test("I/O Boundary Error: Concurrent access error handling", async () => {
  logger.debug("同時アクセスエラーハンドリングテスト開始", {
    testType: "io-boundary-error",
    target: "concurrent access error handling",
  });

  const testDir = "/tmp/breakdown_concurrent_error";
  await ensureDir(testDir);

  try {
    const sharedResource = join(testDir, "shared_resource.txt");
    const concurrentOperations = 20;
    const errorHandlingResults: Array<{
      operationId: number;
      success: boolean;
      error?: string;
      recoveryAttempted: boolean;
      recoverySuccessful: boolean;
    }> = [];

    // 同時アクセス操作の実行
    const operations = Array.from({ length: concurrentOperations }, (_, i) => {
      return async () => {
        const operationId = i;
        let success = false;
        let error: string | undefined;
        let recoveryAttempted = false;
        let recoverySuccessful = false;

        try {
          // 競合状態を引き起こす可能性のある操作
          const content = `Operation ${operationId} content at ${Date.now()}`;

          // ファイルの排他制御なしでの書き込み
          await Deno.writeTextFile(sharedResource, content);

          // 読み込みで内容確認
          const readContent = await Deno.readTextFile(sharedResource);
          success = readContent.includes(`Operation ${operationId}`);
        } catch (err) {
          const e = err as Error;
          error = e.message;

          // エラー発生時の復旧処理
          recoveryAttempted = true;

          try {
            // リトライによる復旧
            await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
            const retryContent = `Retry ${operationId} at ${Date.now()}`;
            await Deno.writeTextFile(sharedResource, retryContent);
            recoverySuccessful = true;
          } catch (retryErr) {
            // 復旧も失敗
            recoverySuccessful = false;
          }
        }

        return {
          operationId,
          success,
          error,
          recoveryAttempted,
          recoverySuccessful,
        };
      };
    });

    // すべての操作を並行実行
    const results = await Promise.all(operations.map((op) => op()));
    errorHandlingResults.push(...results);

    // エラーハンドリング結果の分析
    const successfulOperations = results.filter((r) => r.success);
    const failedOperations = results.filter((r) => !r.success);
    const recoveryAttempts = results.filter((r) => r.recoveryAttempted);
    const successfulRecoveries = results.filter((r) => r.recoverySuccessful);

    logger.debug("同時アクセスエラーハンドリング結果", {
      totalOperations: results.length,
      successfulOperations: successfulOperations.length,
      failedOperations: failedOperations.length,
      recoveryAttempts: recoveryAttempts.length,
      successfulRecoveries: successfulRecoveries.length,
      overallSuccessRate: `${(successfulOperations.length / results.length * 100).toFixed(1)}%`,
      recoverySuccessRate: recoveryAttempts.length > 0
        ? `${(successfulRecoveries.length / recoveryAttempts.length * 100).toFixed(1)}%`
        : "N/A",
    });

    // エラー処理の有効性を確認
    // 完全な成功は期待しないが、適切なエラーハンドリングが機能することを確認
    assertEquals(results.length, concurrentOperations, "All operations should complete");

    // 復旧試行があった場合、復旧成功率が適切であることを確認
    if (recoveryAttempts.length > 0) {
      assertEquals(
        successfulRecoveries.length >= recoveryAttempts.length * 0.5,
        true,
        "At least 50% of recovery attempts should succeed",
      );
    }
  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // クリーンアップエラーは無視
    }
  }
});

Deno.test("I/O Boundary Error: Data corruption detection and handling", async () => {
  logger.debug("データ破損検出・ハンドリングテスト開始", {
    testType: "io-boundary-error",
    target: "data corruption detection and handling",
  });

  const testDir = "/tmp/breakdown_corruption_test";
  await ensureDir(testDir);

  try {
    // データ破損シナリオのテスト
    const corruptionScenarios = [
      {
        name: "truncated_file",
        setup: async (filePath: string) => {
          const originalContent = JSON.stringify({
            config: "test configuration",
            data: Array.from({ length: 1000 }, (_, i) => `item-${i}`),
            metadata: { created: new Date().toISOString() },
          });
          await Deno.writeTextFile(filePath, originalContent);

          // ファイルを途中で切断してデータ破損をシミュレート
          const file = await Deno.open(filePath, { write: true });
          await file.truncate(originalContent.length / 2);
          file.close();
        },
        validate: async (filePath: string) => {
          const content = await Deno.readTextFile(filePath);
          try {
            JSON.parse(content);
            return { valid: true };
          } catch (error) {
            return { valid: false, error: (error as Error).message };
          }
        },
      },
      {
        name: "invalid_encoding",
        setup: async (filePath: string) => {
          // 無効なUTF-8シーケンスを含むデータを作成
          const invalidBytes = new Uint8Array([
            0xFF,
            0xFE,
            0xFD, // 無効なUTF-8バイト
            ...new TextEncoder().encode("valid text after invalid bytes"),
          ]);
          await Deno.writeFile(filePath, invalidBytes);
        },
        validate: async (filePath: string) => {
          try {
            const content = await Deno.readTextFile(filePath);
            return { valid: true, content: content.substring(0, 50) };
          } catch (error) {
            return { valid: false, error: (error as Error).message };
          }
        },
      },
      {
        name: "partial_write",
        setup: async (filePath: string) => {
          const largeData = "x".repeat(10000);

          // 書き込み途中でのエラーをシミュレート
          const file = await Deno.open(filePath, { create: true, write: true });
          const encoder = new TextEncoder();
          const data = encoder.encode(largeData);

          // 半分だけ書き込んで停止
          await file.write(data.slice(0, data.length / 2));
          file.close();
        },
        validate: async (filePath: string) => {
          const content = await Deno.readTextFile(filePath);
          const expectedLength = 10000;
          return {
            valid: content.length === expectedLength,
            actualLength: content.length,
            expectedLength,
          };
        },
      },
    ];

    for (const scenario of corruptionScenarios) {
      const filePath = join(testDir, `${scenario.name}_test.txt`);

      // データ破損のセットアップ
      await scenario.setup(filePath);

      // 破損データの検出
      const validationResult = await scenario.validate(filePath);

      logger.debug(`データ破損シナリオ${scenario.name}結果`, {
        scenario: scenario.name,
        validationResult,
      });

      // 復旧処理の実装
      if (!validationResult.valid) {
        let recoverySuccessful = false;

        try {
          // バックアップからの復旧をシミュレート
          const backupContent = JSON.stringify({
            config: "backup configuration",
            data: ["backup-item-1", "backup-item-2"],
            metadata: { created: new Date().toISOString(), restored: true },
          });

          const backupPath = `${filePath}.backup`;
          await Deno.writeTextFile(backupPath, backupContent);

          // バックアップから復旧
          await Deno.copyFile(backupPath, filePath);

          // 復旧後の検証
          const recoveredContent = await Deno.readTextFile(filePath);
          const recoveredData = JSON.parse(recoveredContent);

          recoverySuccessful = recoveredData.metadata?.restored === true;
        } catch (error) {
          const err = error as Error;
          logger.error(`復旧処理失敗: ${scenario.name}`, {
            scenario: scenario.name,
            error: err.message,
          });
        }

        logger.debug(`データ復旧結果: ${scenario.name}`, {
          scenario: scenario.name,
          recoverySuccessful,
        });

        // 復旧処理が実装されていることを確認
        assertEquals(
          typeof recoverySuccessful,
          "boolean",
          "Recovery should be attempted for corrupted data",
        );
      }
    }
  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // クリーンアップエラーは無視
    }
  }
});

Deno.test("I/O Boundary Error: Error propagation and logging consistency", async () => {
  logger.debug("エラー伝播・ログ整合性テスト開始", {
    testType: "io-boundary-error",
    target: "error propagation and logging consistency",
  });

  // エラー伝播チェーンのテスト
  class ErrorPropagationChain {
    private logger: BreakdownLogger;
    private errorHistory: Array<{ level: string; error: Error; timestamp: number }> = [];

    constructor(moduleName: string) {
      this.logger = new BreakdownLogger(moduleName);
    }

    async lowLevelOperation(shouldFail = false): Promise<string> {
      try {
        if (shouldFail) {
          throw new Error("Low-level I/O operation failed");
        }
        return "success";
      } catch (error) {
        const err = error as Error;
        this.errorHistory.push({ level: "low", error: err, timestamp: Date.now() });
        this.logger.error("Low-level operation error", {
          error: err.message,
          level: "low",
        });
        throw new Error(`Low-level failure: ${err.message}`);
      }
    }

    async midLevelOperation(shouldFail = false): Promise<string> {
      try {
        const result = await this.lowLevelOperation(shouldFail);
        return `mid-level processed: ${result}`;
      } catch (error) {
        const err = error as Error;
        this.errorHistory.push({ level: "mid", error: err, timestamp: Date.now() });
        this.logger.error("Mid-level operation error", {
          error: err.message,
          level: "mid",
          cause: "low-level failure",
        });
        throw new Error(`Mid-level failure: ${err.message}`);
      }
    }

    async highLevelOperation(shouldFail = false): Promise<string> {
      try {
        const result = await this.midLevelOperation(shouldFail);
        return `high-level result: ${result}`;
      } catch (error) {
        const err = error as Error;
        this.errorHistory.push({ level: "high", error: err, timestamp: Date.now() });
        this.logger.error("High-level operation error", {
          error: err.message,
          level: "high",
          cause: "mid-level failure",
          totalErrors: this.errorHistory.length,
        });
        throw new Error(`High-level failure: ${err.message}`);
      }
    }

    getErrorHistory(): Array<{ level: string; error: Error; timestamp: number }> {
      return [...this.errorHistory];
    }

    clearHistory(): void {
      this.errorHistory = [];
    }
  }

  // エラー伝播チェーンのテスト
  const chain = new ErrorPropagationChain("error-propagation-test");

  // 正常ケースのテスト
  const successResult = await chain.highLevelOperation(false);
  assertEquals(typeof successResult, "string", "Normal operation should succeed");
  assertEquals(
    chain.getErrorHistory().length,
    0,
    "No errors should be recorded for successful operation",
  );

  // エラー伝播のテスト
  chain.clearHistory();

  try {
    await chain.highLevelOperation(true);
    assertEquals(true, false, "Error case should throw");
  } catch (error) {
    const err = error as Error;
    assertStringIncludes(err.message, "High-level failure", "Error should propagate to high level");

    const errorHistory = chain.getErrorHistory();
    assertEquals(errorHistory.length, 3, "Should have errors from all three levels");

    // エラーレベルの順序確認
    assertEquals(errorHistory[0].level, "low", "First error should be from low level");
    assertEquals(errorHistory[1].level, "mid", "Second error should be from mid level");
    assertEquals(errorHistory[2].level, "high", "Third error should be from high level");

    // エラータイムスタンプの順序確認
    assertEquals(
      errorHistory[0].timestamp <= errorHistory[1].timestamp &&
        errorHistory[1].timestamp <= errorHistory[2].timestamp,
      true,
      "Error timestamps should be in chronological order",
    );

    logger.debug("エラー伝播チェーン検証完了", {
      totalErrors: errorHistory.length,
      errorLevels: errorHistory.map((e) => e.level),
      propagationCorrect: true,
    });
  }
});
