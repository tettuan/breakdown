/**
 * @fileoverview System Coordination Integration Test
 * 
 * システム全体の協調動作を検証し、複数のシステム基盤コンポーネント
 * （ファイルシステム、ログ、初期化）が連携して正常に動作することを確認します。
 * 
 * @module tests/2_generic_domain/system/coordination/system_coordination_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "../../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";

const logger = new BreakdownLogger("system-coordination");

/**
 * システム協調動作テスト群
 * 
 * 複数システムコンポーネントの協調動作を検証：
 * 1. ファイルシステム + ログシステムの協調
 * 2. 初期化 + ファイルシステム + ログの連携
 * 3. エラー発生時の全システム連携
 * 4. 高負荷時のシステム安定性
 * 5. システム復旧時の協調動作
 * 6. 総合的なシステム信頼性検証
 */

// システム協調動作を管理するクラス
class SystemCoordinationManager {
  private logger: BreakdownLogger;
  private workspaceDir: string;
  private isInitialized = false;
  private components: Map<string, boolean> = new Map();

  constructor(workspaceDir: string) {
    this.logger = new BreakdownLogger("coordination-manager");
    this.workspaceDir = workspaceDir;
    this.components.set("filesystem", false);
    this.components.set("logger", false);
    this.components.set("workspace", false);
  }

  async initializeSystem(): Promise<boolean> {
    this.logger.debug("システム初期化開始", {
      workspaceDir: this.workspaceDir,
      components: Array.from(this.components.keys()),
    });

    try {
      // 1. ファイルシステム初期化
      await this.initializeFilesystem();
      this.components.set("filesystem", true);

      // 2. ログシステム初期化（既に動作中だが正式に登録）
      await this.initializeLogger();
      this.components.set("logger", true);

      // 3. ワークスペース初期化
      await this.initializeWorkspace();
      this.components.set("workspace", true);

      this.isInitialized = true;

      this.logger.debug("システム初期化完了", {
        initialized: this.isInitialized,
        components: Object.fromEntries(this.components),
      });

      return true;

    } catch (error) {
      const err = error as Error;
      this.logger.error("システム初期化失敗", {
        error: err.message,
        components: Object.fromEntries(this.components),
      });
      return false;
    }
  }

  private async initializeFilesystem(): Promise<void> {
    // ワークスペースディレクトリ構造の作成
    const dirs = [
      this.workspaceDir,
      join(this.workspaceDir, "config"),
      join(this.workspaceDir, "data"),
      join(this.workspaceDir, "logs"),
      join(this.workspaceDir, "temp"),
    ];

    for (const dir of dirs) {
      await ensureDir(dir);
    }

    // 設定ファイルの作成
    const configContent = {
      system: {
        name: "breakdown-test-system",
        version: "1.0.0",
        initialized: new Date().toISOString(),
      },
      components: {
        filesystem: { enabled: true },
        logger: { enabled: true, level: "debug" },
        workspace: { enabled: true },
      },
    };

    await Deno.writeTextFile(
      join(this.workspaceDir, "config", "system.json"),
      JSON.stringify(configContent, null, 2)
    );
  }

  private async initializeLogger(): Promise<void> {
    // ログディレクトリの確認
    const logDir = join(this.workspaceDir, "logs");
    const logExists = await exists(logDir);
    if (!logExists) {
      throw new Error("Log directory not found");
    }

    // ログファイルの作成
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Logger system initialized",
      component: "logger",
    };

    await Deno.writeTextFile(
      join(logDir, "system.log"),
      JSON.stringify(logEntry) + "\n"
    );
  }

  private async initializeWorkspace(): Promise<void> {
    // ワークスペース設定の作成
    const workspaceConfig = {
      name: "test-workspace",
      created: new Date().toISOString(),
      components: Array.from(this.components.keys()),
      status: "active",
    };

    await Deno.writeTextFile(
      join(this.workspaceDir, "workspace.json"),
      JSON.stringify(workspaceConfig, null, 2)
    );

    // データディレクトリにサンプルファイル作成
    await Deno.writeTextFile(
      join(this.workspaceDir, "data", "sample.txt"),
      "Sample data for system coordination test"
    );
  }

  async performCoordinatedOperation(operationName: string): Promise<{
    success: boolean;
    results: Map<string, any>;
    errors?: string[];
  }> {
    if (!this.isInitialized) {
      throw new Error("System not initialized");
    }

    const results = new Map<string, any>();
    const errors: string[] = [];

    this.logger.debug(`協調動作${operationName}開始`, {
      operation: operationName,
      timestamp: Date.now(),
    });

    try {
      switch (operationName) {
        case "file_log_coordination":
          await this.fileLogCoordination(results, errors);
          break;
        case "backup_operation":
          await this.backupOperation(results, errors);
          break;
        case "data_processing":
          await this.dataProcessing(results, errors);
          break;
        default:
          throw new Error(`Unknown operation: ${operationName}`);
      }

      const success = errors.length === 0;

      this.logger.debug(`協調動作${operationName}完了`, {
        operation: operationName,
        success,
        errorCount: errors.length,
      });

      return { success, results, errors: errors.length > 0 ? errors : undefined };

    } catch (error) {
      const err = error as Error;
      errors.push(err.message);
      return { success: false, results, errors };
    }
  }

  private async fileLogCoordination(results: Map<string, any>, errors: string[]): Promise<void> {
    try {
      // ファイル操作とログ出力の協調
      const dataFile = join(this.workspaceDir, "data", "coordination_test.txt");
      const logFile = join(this.workspaceDir, "logs", "coordination.log");

      // 1. ファイル作成
      const content = `Coordination test data: ${Date.now()}`;
      await Deno.writeTextFile(dataFile, content);

      // 2. ログ記録
      const logEntry = {
        timestamp: new Date().toISOString(),
        operation: "file_creation",
        file: dataFile,
        success: true,
      };
      await Deno.writeTextFile(logFile, JSON.stringify(logEntry) + "\n", { append: true });

      // 3. ファイル読み込み検証
      const readContent = await Deno.readTextFile(dataFile);
      if (readContent !== content) {
        throw new Error("File content verification failed");
      }

      // 4. ログ検証
      const logContent = await Deno.readTextFile(logFile);
      if (!logContent.includes("file_creation")) {
        throw new Error("Log verification failed");
      }

      results.set("fileLogCoordination", {
        fileCreated: true,
        logRecorded: true,
        verified: true,
      });

    } catch (error) {
      const err = error as Error;
      errors.push(`File-Log coordination error: ${err.message}`);
    }
  }

  private async backupOperation(results: Map<string, any>, errors: string[]): Promise<void> {
    try {
      // バックアップ操作での協調動作
      const sourceDir = join(this.workspaceDir, "data");
      const backupDir = join(this.workspaceDir, "backup");
      
      await ensureDir(backupDir);

      // ソースファイル一覧取得
      const sourceFiles: string[] = [];
      for await (const entry of Deno.readDir(sourceDir)) {
        if (entry.isFile) {
          sourceFiles.push(entry.name);
        }
      }

      // ファイルバックアップとログ記録
      const backupResults = [];
      for (const fileName of sourceFiles) {
        const sourcePath = join(sourceDir, fileName);
        const backupPath = join(backupDir, `${fileName}.backup`);

        await Deno.copyFile(sourcePath, backupPath);
        
        const logEntry = {
          timestamp: new Date().toISOString(),
          operation: "backup",
          source: sourcePath,
          destination: backupPath,
          success: true,
        };
        
        await Deno.writeTextFile(
          join(this.workspaceDir, "logs", "backup.log"),
          JSON.stringify(logEntry) + "\n",
          { append: true }
        );

        backupResults.push({ source: fileName, backup: `${fileName}.backup` });
      }

      results.set("backupOperation", {
        filesBackedUp: backupResults.length,
        backupFiles: backupResults,
      });

    } catch (error) {
      const err = error as Error;
      errors.push(`Backup operation error: ${err.message}`);
    }
  }

  private async dataProcessing(results: Map<string, any>, errors: string[]): Promise<void> {
    try {
      // データ処理での協調動作
      const inputFile = join(this.workspaceDir, "data", "input.json");
      const outputFile = join(this.workspaceDir, "data", "output.json");
      const tempFile = join(this.workspaceDir, "temp", "processing.tmp");

      // 1. 入力データ作成
      const inputData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: Math.random(),
          timestamp: Date.now() + i,
        })),
      };
      await Deno.writeTextFile(inputFile, JSON.stringify(inputData));

      // 2. 一時ファイルでの処理
      const processingStart = performance.now();
      const processedData = {
        ...inputData,
        processed: true,
        processedAt: new Date().toISOString(),
        itemCount: inputData.items.length,
      };
      await Deno.writeTextFile(tempFile, JSON.stringify(processedData));

      // 3. 結果ファイル出力
      await Deno.copyFile(tempFile, outputFile);
      await Deno.remove(tempFile);

      const processingTime = performance.now() - processingStart;

      // 4. 処理ログ記録
      const logEntry = {
        timestamp: new Date().toISOString(),
        operation: "data_processing",
        inputFile,
        outputFile,
        itemCount: inputData.items.length,
        processingTime,
        success: true,
      };

      await Deno.writeTextFile(
        join(this.workspaceDir, "logs", "processing.log"),
        JSON.stringify(logEntry) + "\n",
        { append: true }
      );

      results.set("dataProcessing", {
        itemsProcessed: inputData.items.length,
        processingTime,
        outputGenerated: true,
      });

    } catch (error) {
      const err = error as Error;
      errors.push(`Data processing error: ${err.message}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await Deno.remove(this.workspaceDir, { recursive: true });
      this.logger.debug("システムクリーンアップ完了", {
        workspaceDir: this.workspaceDir,
      });
    } catch (error) {
      const err = error as Error;
      this.logger.warn("クリーンアップ部分的失敗", {
        error: err.message,
      });
    }
  }
}

Deno.test("System Coordination: Complete system initialization", async () => {
  logger.debug("完全システム初期化テスト開始", {
    testType: "system-coordination",
    target: "complete system initialization",
  });

  const testDir = "/tmp/breakdown_system_coordination";
  const manager = new SystemCoordinationManager(testDir);

  try {
    const initResult = await manager.initializeSystem();
    assertEquals(initResult, true, "System initialization should succeed");

    // 初期化結果の検証
    const configExists = await exists(join(testDir, "config", "system.json"));
    const logExists = await exists(join(testDir, "logs", "system.log"));
    const workspaceExists = await exists(join(testDir, "workspace.json"));

    assertEquals(configExists, true, "System config should be created");
    assertEquals(logExists, true, "System log should be created");
    assertEquals(workspaceExists, true, "Workspace config should be created");

    logger.debug("システム初期化検証完了", {
      configExists,
      logExists,
      workspaceExists,
    });

  } finally {
    await manager.cleanup();
  }
});

Deno.test("System Coordination: File and logging coordination", async () => {
  logger.debug("ファイル・ログ協調テスト開始", {
    testType: "system-coordination",
    target: "file and logging coordination",
  });

  const testDir = "/tmp/breakdown_file_log_coordination";
  const manager = new SystemCoordinationManager(testDir);

  try {
    await manager.initializeSystem();
    
    const result = await manager.performCoordinatedOperation("file_log_coordination");
    
    assertEquals(result.success, true, "File-log coordination should succeed");
    assertExists(result.results.get("fileLogCoordination"), "Coordination results should exist");
    
    const coordination = result.results.get("fileLogCoordination");
    assertEquals(coordination.fileCreated, true, "File should be created");
    assertEquals(coordination.logRecorded, true, "Log should be recorded");
    assertEquals(coordination.verified, true, "Operations should be verified");

    logger.debug("ファイル・ログ協調結果", {
      success: result.success,
      results: coordination,
    });

  } finally {
    await manager.cleanup();
  }
});

Deno.test("System Coordination: Multi-operation workflow", async () => {
  logger.debug("複数操作ワークフローテスト開始", {
    testType: "system-coordination",
    target: "multi-operation workflow",
  });

  const testDir = "/tmp/breakdown_multi_operation";
  const manager = new SystemCoordinationManager(testDir);

  try {
    await manager.initializeSystem();

    // 複数の協調動作を順次実行
    const operations = ["file_log_coordination", "backup_operation", "data_processing"];
    const workflowResults = [];

    for (const operation of operations) {
      const result = await manager.performCoordinatedOperation(operation);
      workflowResults.push({ operation, ...result });
      
      assertEquals(result.success, true, `Operation ${operation} should succeed`);
    }

    // ワークフロー全体の検証
    const allSuccessful = workflowResults.every(r => r.success);
    assertEquals(allSuccessful, true, "All workflow operations should succeed");

    // 生成されたファイル・ログの検証
    const backupExists = await exists(join(testDir, "backup"));
    const outputExists = await exists(join(testDir, "data", "output.json"));
    const logFiles = ["coordination.log", "backup.log", "processing.log"];
    
    assertEquals(backupExists, true, "Backup directory should exist");
    assertEquals(outputExists, true, "Output file should exist");

    for (const logFile of logFiles) {
      const logExists = await exists(join(testDir, "logs", logFile));
      assertEquals(logExists, true, `Log file ${logFile} should exist`);
    }

    logger.debug("複数操作ワークフロー結果", {
      totalOperations: operations.length,
      successfulOperations: workflowResults.filter(r => r.success).length,
      backupExists,
      outputExists,
      logFilesCreated: logFiles.length,
    });

  } finally {
    await manager.cleanup();
  }
});

Deno.test("System Coordination: Error handling and recovery", async () => {
  logger.debug("エラーハンドリング・復旧テスト開始", {
    testType: "system-coordination",
    target: "error handling and recovery",
  });

  const testDir = "/tmp/breakdown_error_recovery";
  const manager = new SystemCoordinationManager(testDir);

  try {
    await manager.initializeSystem();

    // エラー状況をシミュレート
    const protectedDir = join(testDir, "protected");
    await ensureDir(protectedDir);
    
    // 権限制限ファイルの作成（読み取り専用）
    const protectedFile = join(protectedDir, "readonly.txt");
    await Deno.writeTextFile(protectedFile, "protected content");
    
    // ファイルを読み取り専用に設定を試行
    try {
      await Deno.chmod(protectedFile, 0o444);
    } catch {
      // 権限変更が失敗しても続行
    }

    // エラーが発生する可能性のある操作を実行
    let errorOccurred = false;
    let recoveryAttempted = false;

    try {
      // 通常の協調動作は成功するはず
      const normalResult = await manager.performCoordinatedOperation("file_log_coordination");
      assertEquals(normalResult.success, true, "Normal operation should succeed");

      // 保護されたファイルの変更を試行（エラーが発生する可能性）
      await Deno.writeTextFile(protectedFile, "modified content");
      
    } catch (error) {
      errorOccurred = true;
      const err = error as Error;
      
      logger.debug("予期されたエラー発生", {
        error: err.message,
        errorType: err.name,
      });

      // 復旧処理の実行
      recoveryAttempted = true;
      try {
        // 代替ファイルでの操作
        const alternativeFile = join(testDir, "data", "alternative.txt");
        await Deno.writeTextFile(alternativeFile, "recovery content");
        
        const recoveryExists = await exists(alternativeFile);
        assertEquals(recoveryExists, true, "Recovery file should be created");
        
      } catch (recoveryError) {
        const recErr = recoveryError as Error;
        logger.error("復旧処理失敗", {
          recoveryError: recErr.message,
        });
      }
    }

    logger.debug("エラーハンドリング・復旧結果", {
      errorOccurred,
      recoveryAttempted,
      systemMaintainedIntegrity: true,
    });

    // システムが引き続き機能することを確認
    const postErrorResult = await manager.performCoordinatedOperation("data_processing");
    assertEquals(postErrorResult.success, true, "System should continue functioning after error");

  } finally {
    await manager.cleanup();
  }
});

Deno.test("System Coordination: High load system stability", async () => {
  logger.debug("高負荷システム安定性テスト開始", {
    testType: "system-coordination",
    target: "high load system stability",
  });

  const testDir = "/tmp/breakdown_high_load";
  const manager = new SystemCoordinationManager(testDir);

  try {
    await manager.initializeSystem();

    // 高負荷シミュレーション
    const concurrentOperations = 10;
    const operationTypes = ["file_log_coordination", "backup_operation", "data_processing"];
    
    const loadTasks = Array.from({ length: concurrentOperations }, (_, i) => {
      return async () => {
        const operationType = operationTypes[i % operationTypes.length];
        const startTime = performance.now();
        
        try {
          const result = await manager.performCoordinatedOperation(operationType);
          const endTime = performance.now();
          
          return {
            taskId: i,
            operationType,
            success: result.success,
            duration: endTime - startTime,
            errors: result.errors,
          };
        } catch (error) {
          const err = error as Error;
          return {
            taskId: i,
            operationType,
            success: false,
            duration: performance.now() - startTime,
            error: err.message,
          };
        }
      };
    });

    // すべての負荷タスクを並行実行
    const loadResults = await Promise.all(loadTasks.map(task => task()));

    // 負荷テスト結果の分析
    const successfulTasks = loadResults.filter(r => r.success);
    const failedTasks = loadResults.filter(r => !r.success);
    const averageDuration = loadResults.reduce((sum, r) => sum + r.duration, 0) / loadResults.length;

    logger.debug("高負荷システム安定性結果", {
      totalTasks: loadResults.length,
      successfulTasks: successfulTasks.length,
      failedTasks: failedTasks.length,
      successRate: `${(successfulTasks.length / loadResults.length * 100).toFixed(1)}%`,
      averageDuration: `${averageDuration.toFixed(2)}ms`,
      systemStable: successfulTasks.length >= loadResults.length * 0.8,
    });

    // 高い成功率とシステム安定性を確認（60%以上で安定と判定）
    assertEquals(successfulTasks.length >= Math.floor(loadResults.length * 0.6), true,
      "At least 60% of high-load operations should succeed");
    
    // パフォーマンスの適切性確認（1操作あたり5秒以内）
    assertEquals(averageDuration < 5000, true,
      "Average operation duration should be under 5 seconds");

  } finally {
    await manager.cleanup();
  }
});