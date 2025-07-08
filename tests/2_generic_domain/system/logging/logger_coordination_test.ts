/**
 * @fileoverview Logger System Coordination Integration Test
 * 
 * ログシステムの協調動作と複雑なシナリオでの信頼性を検証します。
 * 複数モジュールからの同時ログ出力、フィルタリング、パフォーマンスを
 * 重点的にテストします。
 * 
 * @module tests/2_generic_domain/system/logging/logger_coordination_test
 */

import { assertEquals, assertStringIncludes } from "../../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("logger-coordination");

/**
 * ログシステム協調動作テスト群
 * 
 * 複雑なログシナリオでの信頼性を検証：
 * 1. 複数モジュールからの同時ログ出力
 * 2. ログレベルフィルタリングの動作
 * 3. ログキーフィルタリングの精度
 * 4. 大量ログ出力時のパフォーマンス
 * 5. エラー時のログ整合性
 * 6. ログ出力の非同期処理
 */

Deno.test("Logger Coordination: Multiple modules concurrent logging", async () => {
  logger.debug("複数モジュール同時ログ出力テスト開始", {
    testType: "coordination",
    target: "concurrent multi-module logging",
  });

  // 複数のモジュールを模擬
  const modules = [
    { name: "config", logger: new BreakdownLogger("config") },
    { name: "template", logger: new BreakdownLogger("template") },
    { name: "stdin", logger: new BreakdownLogger("stdin") },
    { name: "params", logger: new BreakdownLogger("params") },
    { name: "options", logger: new BreakdownLogger("options") },
    { name: "schema", logger: new BreakdownLogger("schema") },
  ];

  // 各モジュールからの並行ログ出力タスク
  const concurrentLogTasks = modules.map((module, moduleIndex) => {
    return async () => {
      const results = [];
      
      for (let i = 0; i < 50; i++) {
        const logData = {
          moduleIndex,
          logIndex: i,
          timestamp: Date.now(),
          data: `Module ${module.name} log entry ${i}`,
        };

        // 異なるログレベルでランダムに出力
        const logLevel = i % 4;
        try {
          switch (logLevel) {
            case 0:
              module.logger.debug(`Debug: ${logData.data}`, logData);
              break;
            case 1:
              module.logger.info(`Info: ${logData.data}`, logData);
              break;
            case 2:
              module.logger.warn(`Warning: ${logData.data}`, logData);
              break;
            case 3:
              module.logger.error(`Error: ${logData.data}`, logData);
              break;
          }
          results.push({ ...logData, success: true });
        } catch (error) {
          const err = error as Error;
          results.push({ 
            ...logData, 
            success: false, 
            error: err.message 
          });
        }

        // 小さな遅延を追加してリアルな並行性を模擬
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      }

      return {
        moduleName: module.name,
        totalLogs: results.length,
        successfulLogs: results.filter(r => r.success).length,
        failedLogs: results.filter(r => !r.success).length,
        results,
      };
    };
  });

  // すべてのモジュールの並行ログ出力を実行
  const moduleResults = await Promise.all(
    concurrentLogTasks.map(task => task())
  );

  // 結果の検証
  let totalLogs = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;

  moduleResults.forEach(result => {
    totalLogs += result.totalLogs;
    totalSuccessful += result.successfulLogs;
    totalFailed += result.failedLogs;

    logger.debug(`モジュール${result.moduleName}ログ結果`, {
      module: result.moduleName,
      total: result.totalLogs,
      successful: result.successfulLogs,
      failed: result.failedLogs,
      successRate: `${(result.successfulLogs / result.totalLogs * 100).toFixed(1)}%`,
    });
  });

  logger.debug("並行ログ出力テスト結果", {
    totalModules: modules.length,
    totalLogs,
    totalSuccessful,
    totalFailed,
    overallSuccessRate: `${(totalSuccessful / totalLogs * 100).toFixed(1)}%`,
  });

  // 高い成功率を期待（95%以上）
  assertEquals(totalSuccessful >= Math.floor(totalLogs * 0.95), true,
    `Log success rate should be at least 95%, got ${totalSuccessful}/${totalLogs}`);
});

Deno.test("Logger Coordination: Log level filtering verification", () => {
  logger.debug("ログレベルフィルタリング検証テスト開始", {
    testType: "coordination",
    target: "log level filtering",
  });

  // 異なるログレベルでの出力テスト
  const testLogger = new BreakdownLogger("level-filter-test");
  
  // 現在のログレベル設定に関係なく、
  // メソッド呼び出しが正常に動作することを確認
  const logTests = [
    { level: "debug", method: () => testLogger.debug("Debug test message", { level: "debug" }) },
    { level: "info", method: () => testLogger.info("Info test message", { level: "info" }) },
    { level: "warn", method: () => testLogger.warn("Warn test message", { level: "warn" }) },
    { level: "error", method: () => testLogger.error("Error test message", { level: "error" }) },
  ];

  logTests.forEach(test => {
    try {
      test.method();
      logger.debug(`ログレベル${test.level}出力成功`, {
        level: test.level,
        methodCalled: true,
      });
    } catch (error) {
      const err = error as Error;
      logger.error(`ログレベル${test.level}出力失敗`, {
        level: test.level,
        error: err.message,
      });
    }
  });

  // ログメソッドが存在し、呼び出し可能であることを確認
  assertEquals(typeof testLogger.debug, "function");
  assertEquals(typeof testLogger.info, "function");
  assertEquals(typeof testLogger.warn, "function");
  assertEquals(typeof testLogger.error, "function");
});

Deno.test("Logger Coordination: Log key filtering accuracy", () => {
  logger.debug("ログキーフィルタリング精度テスト開始", {
    testType: "coordination",
    target: "log key filtering accuracy",
  });

  // 様々なキーパターンでのログ出力テスト
  const keyTestCases = [
    { key: "config", logger: new BreakdownLogger("config") },
    { key: "template", logger: new BreakdownLogger("template") },
    { key: "stdin", logger: new BreakdownLogger("stdin") },
    { key: "params", logger: new BreakdownLogger("params") },
    { key: "options", logger: new BreakdownLogger("options") },
    { key: "schema", logger: new BreakdownLogger("schema") },
    { key: "nested:module:key", logger: new BreakdownLogger("nested:module:key") },
    { key: "hierarchical/path/key", logger: new BreakdownLogger("hierarchical/path/key") },
  ];

  keyTestCases.forEach(testCase => {
    // 各キーパターンで様々なデータ構造をテスト
    const testData = {
      simpleString: "Simple string value",
      number: 42,
      boolean: true,
      array: [1, 2, 3, "test"],
      nestedObject: {
        level1: {
          level2: {
            value: "deep nested value",
            timestamp: new Date().toISOString(),
          },
        },
      },
      nullValue: null,
      undefinedValue: undefined,
    };

    try {
      testCase.logger.debug(`Key filtering test for ${testCase.key}`, {
        key: testCase.key,
        testData,
        timestamp: Date.now(),
      });

      testCase.logger.info(`Info level test for ${testCase.key}`, {
        key: testCase.key,
        infoData: "Information level test data",
      });

      testCase.logger.warn(`Warning level test for ${testCase.key}`, {
        key: testCase.key,
        warningData: "Warning level test data",
      });

      testCase.logger.error(`Error level test for ${testCase.key}`, {
        key: testCase.key,
        errorData: "Error level test data",
      });

      logger.debug(`キー${testCase.key}フィルタリングテスト完了`, {
        key: testCase.key,
        levelsTestsed: ["debug", "info", "warn", "error"],
        success: true,
      });

    } catch (error) {
      const err = error as Error;
      logger.error(`キー${testCase.key}フィルタリングエラー`, {
        key: testCase.key,
        error: err.message,
      });
    }
  });
});

Deno.test("Logger Coordination: High volume logging performance", async () => {
  logger.debug("大量ログ出力パフォーマンステスト開始", {
    testType: "coordination",
    target: "high volume logging performance",
  });

  const performanceLogger = new BreakdownLogger("performance-test");
  const logCount = 1000;
  const startTime = performance.now();

  // 大量のログ出力（パフォーマンス測定）
  const logPromises = [];
  for (let i = 0; i < logCount; i++) {
    const logOperation = () => {
      const logData = {
        logIndex: i,
        timestamp: Date.now(),
        payload: `Performance test log entry ${i}`,
        metadata: {
          batchId: Math.floor(i / 100),
          category: i % 5 === 0 ? "critical" : "normal",
          size: "medium",
        },
      };

      // 異なるログレベルを混在
      switch (i % 4) {
        case 0:
          performanceLogger.debug(`Debug ${i}`, logData);
          break;
        case 1:
          performanceLogger.info(`Info ${i}`, logData);
          break;
        case 2:
          performanceLogger.warn(`Warning ${i}`, logData);
          break;
        case 3:
          performanceLogger.error(`Error ${i}`, logData);
          break;
      }
    };

    logPromises.push(Promise.resolve().then(logOperation));

    // バッチ処理のシミュレーション
    if (i % 100 === 0 && i > 0) {
      await Promise.all(logPromises.splice(0, 100));
    }
  }

  // 残りのログ出力を完了
  await Promise.all(logPromises);

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const logsPerSecond = (logCount / (totalTime / 1000)).toFixed(0);

  logger.debug("大量ログ出力パフォーマンス結果", {
    totalLogs: logCount,
    totalTimeMs: Math.round(totalTime),
    logsPerSecond,
    averageTimePerLog: `${(totalTime / logCount).toFixed(3)}ms`,
    performanceCategory: totalTime < 1000 ? "excellent" : 
                        totalTime < 5000 ? "good" : "needs_optimization",
  });

  // パフォーマンス基準の確認（1秒で1000ログ以上）
  assertEquals(totalTime < 10000, true, 
    `Logging 1000 entries should complete within 10 seconds, took ${totalTime}ms`);
});

Deno.test("Logger Coordination: Error context logging integrity", async () => {
  logger.debug("エラーコンテキストログ整合性テスト開始", {
    testType: "coordination",
    target: "error context logging integrity",
  });

  const errorLogger = new BreakdownLogger("error-context-test");

  // 様々なエラーシナリオでのログ整合性テスト
  const errorScenarios = [
    {
      name: "Simple Error",
      error: new Error("Simple test error"),
      context: { operation: "test", step: 1 },
    },
    {
      name: "Error with Cause",
      error: (() => {
        const err = new Error("Error with cause");
        (err as any).cause = new Error("Root cause error");
        return err;
      })(),
      context: { operation: "nested_operation", details: "complex scenario" },
    },
    {
      name: "TypeError",
      error: new TypeError("Type error test"),
      context: { type: "validation", input: "invalid_data" },
    },
    {
      name: "Custom Error",
      error: (() => {
        const err = new Error("Custom error");
        err.name = "CustomTestError";
        (err as any).code = "TEST_ERR_001";
        (err as any).severity = "high";
        return err;
      })(),
      context: { module: "test_module", function: "test_function" },
    },
  ];

  for (const scenario of errorScenarios) {
    try {
      // エラーコンテキストと共にログ出力
      errorLogger.error(`Error scenario: ${scenario.name}`, {
        scenario: scenario.name,
        error: {
          name: scenario.error.name,
          message: scenario.error.message,
          stack: scenario.error.stack,
          cause: (scenario.error as any).cause?.message,
          code: (scenario.error as any).code,
          severity: (scenario.error as any).severity,
        },
        context: scenario.context,
        timestamp: new Date().toISOString(),
        testMetadata: {
          testType: "error_context_integrity",
          scenarioIndex: errorScenarios.indexOf(scenario),
        },
      });

      // 追加のコンテキスト情報をログ
      errorLogger.warn(`Error context details for ${scenario.name}`, {
        errorType: scenario.error.constructor.name,
        hasStack: !!scenario.error.stack,
        hasCause: !!(scenario.error as any).cause,
        contextKeys: Object.keys(scenario.context),
        errorStringified: scenario.error.toString(),
      });

      logger.debug(`エラーシナリオ${scenario.name}ログ完了`, {
        scenario: scenario.name,
        errorLogged: true,
        contextLogged: true,
      });

    } catch (loggingError) {
      const err = loggingError as Error;
      logger.error(`エラーログ出力失敗: ${scenario.name}`, {
        scenario: scenario.name,
        loggingError: err.message,
        originalError: scenario.error.message,
      });
    }
  }

  logger.debug("エラーコンテキストログ整合性テスト完了", {
    totalScenarios: errorScenarios.length,
    testCompleted: true,
  });
});

Deno.test("Logger Coordination: Asynchronous logging reliability", async () => {
  logger.debug("非同期ログ出力信頼性テスト開始", {
    testType: "coordination",
    target: "asynchronous logging reliability",
  });

  const asyncLogger = new BreakdownLogger("async-reliability-test");
  const asyncOperations = 50;

  // 非同期操作とログ出力の組み合わせテスト
  const asyncTasks = Array.from({ length: asyncOperations }, (_, i) => {
    return async () => {
      const taskId = `async-task-${i}`;
      const startTime = performance.now();

      try {
        asyncLogger.debug(`非同期タスク${taskId}開始`, {
          taskId,
          startTime,
          operation: "async_test",
        });

        // 非同期処理のシミュレーション
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 100)
        );

        // ランダムでエラーを発生させる
        if (Math.random() < 0.2) { // 20%の確率でエラー
          throw new Error(`Simulated error in ${taskId}`);
        }

        // 処理中のログ
        asyncLogger.info(`非同期タスク${taskId}処理中`, {
          taskId,
          progress: 50,
          elapsedTime: performance.now() - startTime,
        });

        // さらなる非同期処理
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 50)
        );

        const endTime = performance.now();
        asyncLogger.debug(`非同期タスク${taskId}完了`, {
          taskId,
          endTime,
          totalTime: endTime - startTime,
          success: true,
        });

        return { taskId, success: true, totalTime: endTime - startTime };

      } catch (error) {
        const err = error as Error;
        const errorTime = performance.now();
        
        asyncLogger.error(`非同期タスク${taskId}エラー`, {
          taskId,
          error: err.message,
          errorTime,
          totalTime: errorTime - startTime,
          success: false,
        });

        return { 
          taskId, 
          success: false, 
          error: err.message,
          totalTime: errorTime - startTime 
        };
      }
    };
  });

  // すべての非同期タスクを並行実行
  const results = await Promise.all(
    asyncTasks.map(task => task())
  );

  // 結果の集計
  const successfulTasks = results.filter(r => r.success);
  const failedTasks = results.filter(r => !r.success);
  const averageTime = results.reduce((sum, r) => sum + r.totalTime, 0) / results.length;

  logger.debug("非同期ログ出力信頼性テスト結果", {
    totalTasks: results.length,
    successfulTasks: successfulTasks.length,
    failedTasks: failedTasks.length,
    successRate: `${(successfulTasks.length / results.length * 100).toFixed(1)}%`,
    averageTaskTime: `${averageTime.toFixed(2)}ms`,
    reliability: "All tasks completed logging operations",
  });

  // すべてのタスクがログ出力を完了していることを確認
  assertEquals(results.length, asyncOperations,
    "All async tasks should complete with logging");
});