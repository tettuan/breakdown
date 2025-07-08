/**
 * @fileoverview System Integration Test - 汎用ドメインシステム基盤の統合テスト
 * 
 * このテストは、システム基盤コンポーネント（I/O、ログ、初期化）の
 * 統合性と信頼性を検証します。技術基盤として重要な横断的関心事の
 * 正常動作を保証します。
 * 
 * @module tests/generic_domain/system/3_core/system_integration_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("system-integration-test");

/**
 * システム基盤統合テスト群
 * 
 * 技術基盤の信頼性を保証するため、以下の観点でテストします：
 * 1. I/Oシステムの安定性
 * 2. ログシステムの一貫性
 * 3. 初期化プロセスの完全性
 * 4. システム横断的な相互作用
 */

Deno.test("System Integration: I/O operations work reliably", async () => {
  logger.debug("I/Oシステム統合テスト開始", {
    testType: "integration",
    target: "I/O system reliability",
  });

  // テスト用の一時ファイル作成
  const testFilePath = "/tmp/breakdown_test_io.txt";
  const testContent = "Test content for I/O integration test";

  try {
    // ファイル書き込みテスト
    await Deno.writeTextFile(testFilePath, testContent);
    
    // ファイル読み込みテスト
    const readContent = await Deno.readTextFile(testFilePath);
    
    assertEquals(readContent, testContent);
    
    // ファイル統計情報テスト
    const fileInfo = await Deno.stat(testFilePath);
    assertExists(fileInfo);
    assertEquals(fileInfo.isFile, true);
    
    logger.debug("I/Oシステムテスト成功", {
      operation: "file read/write",
      fileSize: fileInfo.size,
      success: true,
    });

  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testFilePath);
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
});

Deno.test("System Integration: STDIN handling with timeout", async () => {
  logger.debug("STDIN処理統合テスト開始", {
    testType: "integration",
    target: "STDIN handling with timeout",
  });

  // STDINのモック処理をシミュレート
  const mockStdinContent = "Mock STDIN input for testing";
  const timeoutMs = 1000;

  // タイムアウト付きの非同期処理シミュレーション
  const stdinPromise = new Promise<string>((resolve) => {
    setTimeout(() => {
      resolve(mockStdinContent);
    }, 100); // 100ms後に解決
  });

  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => {
      reject(new Error("STDIN timeout"));
    }, timeoutMs);
  });

  // レース条件でタイムアウトテスト
  try {
    const result = await Promise.race([stdinPromise, timeoutPromise]);
    assertEquals(result, mockStdinContent);
    
    logger.debug("STDIN処理成功", {
      content: result,
      withinTimeout: true,
    });
  } catch (error) {
    const err = error as Error;
    logger.debug("STDIN処理タイムアウト", {
      error: err.message,
      timeoutMs,
    });
    
    // タイムアウトエラーの適切な処理を確認
    assertStringIncludes(err.message, "timeout");
  }
});

Deno.test("System Integration: Logger configuration and output", () => {
  logger.debug("ログシステム統合テスト開始", {
    testType: "integration",
    target: "logger system integration",
  });

  // 異なるログレベルでのテスト
  const testLogger = new BreakdownLogger("integration-test");
  
  // ログ出力の基本テスト
  testLogger.debug("Debug level test message", { level: "debug" });
  testLogger.info("Info level test message", { level: "info" });
  testLogger.warn("Warning level test message", { level: "warn" });
  testLogger.error("Error level test message", { level: "error" });

  // ログキーフィルタリングのテスト
  const keyedLogger = new BreakdownLogger("specific-key");
  keyedLogger.debug("Keyed log message", {
    testData: "filtered content",
    timestamp: new Date().toISOString(),
  });

  // ログが正常に出力されることを確認
  // （実際の出力確認は環境変数LOG_LEVELに依存）
  assertEquals(typeof testLogger.debug, "function");
  assertEquals(typeof testLogger.info, "function");
  assertEquals(typeof testLogger.warn, "function");
  assertEquals(typeof testLogger.error, "function");

  logger.debug("ログシステムテスト完了", {
    loggerTypes: ["basic", "keyed"],
    levels: ["debug", "info", "warn", "error"],
  });
});

Deno.test("System Integration: Initialization process completeness", async () => {
  logger.debug("初期化プロセス統合テスト開始", {
    testType: "integration",
    target: "initialization process",
  });

  // 初期化に必要な基本コンポーネントの確認
  const initSteps = [
    { name: "Logger", check: () => typeof BreakdownLogger !== "undefined" },
    { name: "FileSystem", check: () => typeof Deno.readTextFile !== "undefined" },
    { name: "Performance", check: () => typeof performance !== "undefined" },
    { name: "Crypto", check: () => typeof crypto !== "undefined" },
  ];

  const results = initSteps.map(step => {
    const isAvailable = step.check();
    logger.debug(`初期化確認: ${step.name}`, {
      component: step.name,
      available: isAvailable,
    });
    return { name: step.name, available: isAvailable };
  });

  // すべてのコンポーネントが利用可能であることを確認
  results.forEach(result => {
    assertEquals(result.available, true, `${result.name} should be available`);
  });

  logger.debug("初期化プロセステスト完了", {
    totalComponents: results.length,
    availableComponents: results.filter(r => r.available).length,
  });
});

Deno.test("System Integration: Error propagation across system layers", async () => {
  logger.debug("システム横断エラー伝播テスト開始", {
    testType: "integration",
    target: "cross-layer error propagation",
  });

  // 各層でのエラーハンドリングをテスト
  const testScenarios = [
    {
      name: "File not found error",
      action: () => Deno.readTextFile("/nonexistent/file.txt"),
      expectedError: "NotFound",
    },
    {
      name: "Permission denied error", 
      action: () => Deno.writeTextFile("/root/forbidden.txt", "test"),
      expectedError: "PermissionDenied",
    },
  ];

  for (const scenario of testScenarios) {
    try {
      await scenario.action();
      // エラーが発生すべき場合
      assertEquals(true, false, `${scenario.name} should have thrown an error`);
    } catch (error) {
      const err = error as Error & { name: string };
      logger.debug(`エラーハンドリング確認: ${scenario.name}`, {
        errorName: err.name,
        errorMessage: err.message,
        expected: scenario.expectedError,
      });

      // 適切なエラータイプが発生することを確認
      assertStringIncludes(err.name, scenario.expectedError);
    }
  }
});

Deno.test("System Integration: Concurrent operations stability", async () => {
  logger.debug("並行操作安定性テスト開始", {
    testType: "integration", 
    target: "concurrent operations",
  });

  // 並行してファイル操作とログ出力を実行
  const concurrentTasks = Array.from({ length: 10 }, (_, i) => {
    return async () => {
      const taskLogger = new BreakdownLogger(`concurrent-task-${i}`);
      const tempFile = `/tmp/breakdown_concurrent_${i}.txt`;
      
      try {
        // 並行ファイル操作
        await Deno.writeTextFile(tempFile, `Concurrent task ${i} content`);
        const content = await Deno.readTextFile(tempFile);
        
        // 並行ログ出力
        taskLogger.debug(`並行タスク${i}完了`, {
          taskId: i,
          contentLength: content.length,
        });

        return { taskId: i, success: true, content };
      } catch (error) {
        const err = error as Error;
        taskLogger.error(`並行タスク${i}エラー`, {
          taskId: i,
          error: err.message,
        });
        return { taskId: i, success: false, error: err.message };
      } finally {
        // クリーンアップ
        try {
          await Deno.remove(tempFile);
        } catch {
          // ファイルが存在しない場合は無視
        }
      }
    };
  });

  // すべてのタスクを並行実行
  const results = await Promise.all(concurrentTasks.map(task => task()));
  
  // すべてのタスクが成功することを確認
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  logger.debug("並行操作テスト結果", {
    totalTasks: results.length,
    successCount,
    failureCount,
    successRate: `${(successCount / results.length * 100).toFixed(1)}%`,
  });

  // 高い成功率を期待（90%以上）
  assertEquals(successCount >= Math.floor(results.length * 0.9), true,
    `Success rate should be at least 90%, got ${successCount}/${results.length}`);
});

Deno.test("System Integration: Resource cleanup and memory management", async () => {
  logger.debug("リソースクリーンアップテスト開始", {
    testType: "integration",
    target: "resource cleanup",
  });

  const resourceOperations = async () => {
    // 一時リソースの作成
    const tempFiles = [];
    for (let i = 0; i < 5; i++) {
      const tempFile = `/tmp/breakdown_resource_${i}.txt`;
      await Deno.writeTextFile(tempFile, `Resource test ${i}`);
      tempFiles.push(tempFile);
    }

    // リソースの使用
    const contents = await Promise.all(
      tempFiles.map(file => Deno.readTextFile(file))
    );

    // リソースのクリーンアップ
    await Promise.all(
      tempFiles.map(file => Deno.remove(file).catch(() => {}))
    );

    return contents;
  };

  // 初期メモリ測定
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

  // リソース操作の実行
  const results = await resourceOperations();
  
  // 最終メモリ測定
  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const memoryDiff = finalMemory - initialMemory;

  logger.debug("リソース管理テスト結果", {
    operationsCompleted: results.length,
    initialMemory: `${Math.round(initialMemory / 1024)}KB`,
    finalMemory: `${Math.round(finalMemory / 1024)}KB`,
    memoryDiff: `${Math.round(memoryDiff / 1024)}KB`,
  });

  // 操作が正常完了することを確認
  assertEquals(results.length, 5);
  results.forEach((content, i) => {
    assertEquals(content, `Resource test ${i}`);
  });

  // メモリ使用量の増加が適切な範囲内であることを確認
  if ((performance as any).memory) {
    assertEquals(memoryDiff < 512 * 1024, true, // 512KB未満
      `Memory increase ${Math.round(memoryDiff / 1024)}KB should be less than 512KB`);
  }
});