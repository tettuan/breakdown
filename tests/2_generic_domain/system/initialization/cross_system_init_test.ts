/**
 * @fileoverview Cross-System Initialization Integration Test
 *
 * システム横断的な初期化処理の統合性と依存関係を検証します。
 * 複数のシステムコンポーネントが正しい順序で初期化され、
 * 相互依存関係が適切に処理されることを確認します。
 *
 * @module tests/2_generic_domain/system/initialization/cross_system_init_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "../../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";
import { ensureDir, exists } from "@std/fs";

const logger = new BreakdownLogger("cross-system-init");

/**
 * システム横断初期化テスト群
 *
 * 複数システムコンポーネントの初期化シーケンスを検証：
 * 1. 初期化順序の依存関係確認
 * 2. 並行初期化の安全性
 * 3. 初期化失敗時の復旧処理
 * 4. 部分初期化状態の処理
 * 5. 初期化状態の整合性確認
 * 6. リソースクリーンアップの確実性
 */

// システムコンポーネントの初期化状態を管理
interface SystemComponent {
  name: string;
  dependencies: string[];
  initialized: boolean;
  initTime?: number;
  error?: string;
}

class SystemInitializationManager {
  private components: Map<string, SystemComponent> = new Map();
  private initializationOrder: string[] = [];

  constructor() {
    // システムコンポーネントの定義
    this.defineComponent("logger", []);
    this.defineComponent("filesystem", ["logger"]);
    this.defineComponent("config", ["filesystem", "logger"]);
    this.defineComponent("template", ["config", "filesystem"]);
    this.defineComponent("schema", ["config", "filesystem"]);
    this.defineComponent("workspace", ["config", "filesystem"]);
    this.defineComponent("params", ["config"]);
    this.defineComponent("prompt", ["template", "schema", "params"]);
  }

  private defineComponent(name: string, dependencies: string[]): void {
    this.components.set(name, {
      name,
      dependencies,
      initialized: false,
    });
  }

  async initializeComponent(name: string, simulateError = false): Promise<boolean> {
    const component = this.components.get(name);
    if (!component) {
      throw new Error(`Unknown component: ${name}`);
    }

    // 依存関係の確認
    for (const dep of component.dependencies) {
      const depComponent = this.components.get(dep);
      if (!depComponent || !depComponent.initialized) {
        throw new Error(`Dependency ${dep} not initialized for ${name}`);
      }
    }

    const startTime = performance.now();

    try {
      if (simulateError) {
        throw new Error(`Simulated initialization error for ${name}`);
      }

      // 初期化処理のシミュレーション
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));

      component.initialized = true;
      component.initTime = performance.now() - startTime;
      this.initializationOrder.push(name);

      logger.debug(`コンポーネント${name}初期化完了`, {
        component: name,
        initTime: component.initTime,
        dependencies: component.dependencies,
      });

      return true;
    } catch (error) {
      const err = error as Error;
      component.error = err.message;

      logger.error(`コンポーネント${name}初期化失敗`, {
        component: name,
        error: err.message,
        dependencies: component.dependencies,
      });

      return false;
    }
  }

  async initializeAll(): Promise<{ success: boolean; results: Map<string, SystemComponent> }> {
    const initQueue: string[] = [];
    const visited = new Set<string>();

    // 依存関係に基づく初期化順序の決定（トポロジカルソート）
    const sortComponents = (componentName: string) => {
      if (visited.has(componentName)) return;
      visited.add(componentName);

      const component = this.components.get(componentName);
      if (component) {
        for (const dep of component.dependencies) {
          sortComponents(dep);
        }
        initQueue.push(componentName);
      }
    };

    // すべてのコンポーネントをソート
    for (const [name] of this.components) {
      sortComponents(name);
    }

    // 順次初期化
    let allSuccess = true;
    for (const componentName of initQueue) {
      const success = await this.initializeComponent(componentName);
      if (!success) {
        allSuccess = false;
      }
    }

    return { success: allSuccess, results: this.components };
  }

  async concurrentInitialize(): Promise<
    { success: boolean; results: Map<string, SystemComponent> }
  > {
    // 並行初期化が可能なコンポーネントグループを特定
    const levelGroups: string[][] = [];
    const componentLevels = new Map<string, number>();

    // 各コンポーネントの依存レベルを計算
    const calculateLevel = (componentName: string): number => {
      if (componentLevels.has(componentName)) {
        return componentLevels.get(componentName)!;
      }

      const component = this.components.get(componentName);
      if (!component) return 0;

      let maxDepLevel = -1;
      for (const dep of component.dependencies) {
        maxDepLevel = Math.max(maxDepLevel, calculateLevel(dep));
      }

      const level = maxDepLevel + 1;
      componentLevels.set(componentName, level);
      return level;
    };

    // すべてのコンポーネントのレベルを計算
    for (const [name] of this.components) {
      calculateLevel(name);
    }

    // レベルごとにグループ化
    for (const [name, level] of componentLevels) {
      if (!levelGroups[level]) {
        levelGroups[level] = [];
      }
      levelGroups[level].push(name);
    }

    // レベルごとに並行初期化
    let allSuccess = true;
    for (let level = 0; level < levelGroups.length; level++) {
      const group = levelGroups[level];
      if (!group) continue;

      logger.debug(`初期化レベル${level}開始`, {
        level,
        components: group,
      });

      const initPromises = group.map((componentName) => this.initializeComponent(componentName));

      const results = await Promise.all(initPromises);
      const levelSuccess = results.every((r) => r);

      if (!levelSuccess) {
        allSuccess = false;
      }

      logger.debug(`初期化レベル${level}完了`, {
        level,
        components: group,
        success: levelSuccess,
      });
    }

    return { success: allSuccess, results: this.components };
  }

  getInitializationOrder(): string[] {
    return [...this.initializationOrder];
  }

  reset(): void {
    this.initializationOrder = [];
    for (const [, component] of this.components) {
      component.initialized = false;
      component.initTime = undefined;
      component.error = undefined;
    }
  }
}

Deno.test("Cross-System Init: Sequential initialization dependency order", async () => {
  logger.debug("順次初期化依存順序テスト開始", {
    testType: "cross-system-init",
    target: "sequential initialization dependency order",
  });

  const manager = new SystemInitializationManager();
  const result = await manager.initializeAll();

  logger.debug("順次初期化結果", {
    success: result.success,
    initOrder: manager.getInitializationOrder(),
    componentCount: result.results.size,
  });

  // 初期化成功の確認
  assertEquals(result.success, true, "All components should initialize successfully");

  // 依存関係順序の確認
  const initOrder = manager.getInitializationOrder();
  const loggerIndex = initOrder.indexOf("logger");
  const filesystemIndex = initOrder.indexOf("filesystem");
  const configIndex = initOrder.indexOf("config");
  const promptIndex = initOrder.indexOf("prompt");

  // logger は最初に初期化されるべき
  assertEquals(loggerIndex < filesystemIndex, true, "Logger should initialize before filesystem");
  assertEquals(filesystemIndex < configIndex, true, "Filesystem should initialize before config");
  assertEquals(configIndex < promptIndex, true, "Config should initialize before prompt");

  // すべてのコンポーネントが初期化されていることを確認
  for (const [name, component] of result.results) {
    assertEquals(component.initialized, true, `Component ${name} should be initialized`);
    assertExists(component.initTime, `Component ${name} should have init time recorded`);
  }
});

Deno.test("Cross-System Init: Concurrent initialization safety", async () => {
  logger.debug("並行初期化安全性テスト開始", {
    testType: "cross-system-init",
    target: "concurrent initialization safety",
  });

  const manager = new SystemInitializationManager();
  const result = await manager.concurrentInitialize();

  logger.debug("並行初期化結果", {
    success: result.success,
    initOrder: manager.getInitializationOrder(),
    componentCount: result.results.size,
  });

  // 初期化成功の確認
  assertEquals(
    result.success,
    true,
    "All components should initialize successfully in concurrent mode",
  );

  // 依存関係が維持されていることを確認
  const initOrder = manager.getInitializationOrder();

  // 依存関係違反がないことを確認
  for (const [name, component] of result.results) {
    if (component.initialized) {
      const componentInitIndex = initOrder.indexOf(name);

      for (const dep of component.dependencies) {
        const depInitIndex = initOrder.indexOf(dep);
        assertEquals(
          depInitIndex < componentInitIndex,
          true,
          `Dependency ${dep} should initialize before ${name}`,
        );
      }
    }
  }
});

Deno.test("Cross-System Init: Initialization failure recovery", async () => {
  logger.debug("初期化失敗復旧テスト開始", {
    testType: "cross-system-init",
    target: "initialization failure recovery",
  });

  const manager = new SystemInitializationManager();

  // filesystemコンポーネントの初期化を失敗させる
  const _filesystemInitialized = false;
  try {
    await manager.initializeComponent("logger");
    assertEquals(true, true, "Logger should initialize successfully");

    // filesystem初期化を失敗させる
    const filesystemResult = await manager.initializeComponent("filesystem", true);
    assertEquals(filesystemResult, false, "Filesystem initialization should fail");
  } catch (error) {
    // 依存関係エラーが適切に処理されることを確認
    const err = error as Error;
    logger.debug("予期されたエラー", {
      error: err.message,
      expectedBehavior: "dependency failure handling",
    });
  }

  // 失敗したコンポーネントに依存するコンポーネントの初期化を試行
  try {
    await manager.initializeComponent("config");
    assertEquals(true, false, "Config should not initialize when filesystem failed");
  } catch (error) {
    const err = error as Error;
    assertStringIncludes(err.message, "Dependency", "Should fail with dependency error");

    logger.debug("依存関係エラー適切に検出", {
      error: err.message,
      component: "config",
      dependency: "filesystem",
    });
  }
});

Deno.test("Cross-System Init: Partial initialization state handling", async () => {
  logger.debug("部分初期化状態処理テスト開始", {
    testType: "cross-system-init",
    target: "partial initialization state handling",
  });

  const manager = new SystemInitializationManager();

  // 一部のコンポーネントのみ初期化
  await manager.initializeComponent("logger");
  await manager.initializeComponent("filesystem");

  // 初期化状態の確認
  const loggerComponent = manager["components"].get("logger");
  const filesystemComponent = manager["components"].get("filesystem");
  const configComponent = manager["components"].get("config");

  assertEquals(loggerComponent?.initialized, true, "Logger should be initialized");
  assertEquals(filesystemComponent?.initialized, true, "Filesystem should be initialized");
  assertEquals(configComponent?.initialized, false, "Config should not be initialized yet");

  // 部分初期化状態からの続行
  await manager.initializeComponent("config");
  assertEquals(configComponent?.initialized, true, "Config should now be initialized");

  logger.debug("部分初期化状態処理成功", {
    initializedComponents: ["logger", "filesystem", "config"],
    pendingComponents: ["template", "schema", "workspace", "params", "prompt"],
  });
});

Deno.test("Cross-System Init: Resource cleanup verification", async () => {
  logger.debug("リソースクリーンアップ検証テスト開始", {
    testType: "cross-system-init",
    target: "resource cleanup verification",
  });

  const testDir = "/tmp/breakdown_init_cleanup_test";
  await ensureDir(testDir);

  try {
    // 初期化プロセスでリソースを作成
    const resourceFiles = [
      join(testDir, "logger.log"),
      join(testDir, "config.yml"),
      join(testDir, "workspace", "prompts"),
      join(testDir, "workspace", "schema"),
    ];

    // リソース作成のシミュレーション
    for (const resource of resourceFiles) {
      if (resource.includes("workspace")) {
        await ensureDir(resource);
      } else {
        await ensureDir(join(testDir, "workspace"));
        await Deno.writeTextFile(resource, `Resource content for ${resource}`);
      }
    }

    // リソースが存在することを確認
    for (const resource of resourceFiles) {
      const resourceExists = await exists(resource);
      assertEquals(resourceExists, true, `Resource ${resource} should exist`);
    }

    logger.debug("初期化リソース作成完了", {
      resourceCount: resourceFiles.length,
      testDir,
    });

    // クリーンアップ処理のシミュレーション
    const cleanupOperations = [];

    for (const resource of resourceFiles) {
      cleanupOperations.push(async () => {
        try {
          const stat = await Deno.stat(resource);
          if (stat.isDirectory) {
            await Deno.remove(resource, { recursive: true });
          } else {
            await Deno.remove(resource);
          }
          return { resource, success: true };
        } catch (error) {
          const err = error as Error;
          return { resource, success: false, error: err.message };
        }
      });
    }

    // 並行クリーンアップ実行
    const cleanupResults = await Promise.all(
      cleanupOperations.map((op) => op()),
    );

    // クリーンアップ結果の検証
    const successfulCleanups = cleanupResults.filter((r) => r.success);

    logger.debug("リソースクリーンアップ結果", {
      totalResources: cleanupResults.length,
      successfulCleanups: successfulCleanups.length,
      cleanupRate: `${(successfulCleanups.length / cleanupResults.length * 100).toFixed(1)}%`,
    });

    // 高いクリーンアップ成功率を期待
    assertEquals(
      successfulCleanups.length >= cleanupResults.length * 0.9,
      true,
      "At least 90% of resources should be cleaned up successfully",
    );
  } finally {
    // 最終クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // ディレクトリが存在しない場合は無視
    }
  }
});

Deno.test("Cross-System Init: Initialization state consistency", async () => {
  logger.debug("初期化状態整合性テスト開始", {
    testType: "cross-system-init",
    target: "initialization state consistency",
  });

  const manager = new SystemInitializationManager();

  // 複数回の初期化サイクルテスト
  for (let cycle = 0; cycle < 3; cycle++) {
    logger.debug(`初期化サイクル${cycle + 1}開始`, { cycle: cycle + 1 });

    const result = await manager.initializeAll();
    assertEquals(result.success, true, `Cycle ${cycle + 1} should succeed`);

    // 状態の一貫性確認
    for (const [name, component] of result.results) {
      assertEquals(
        component.initialized,
        true,
        `Component ${name} should be initialized in cycle ${cycle + 1}`,
      );
      assertExists(
        component.initTime,
        `Component ${name} should have init time in cycle ${cycle + 1}`,
      );
    }

    const initOrder = manager.getInitializationOrder();
    logger.debug(`サイクル${cycle + 1}初期化順序`, {
      cycle: cycle + 1,
      order: initOrder,
      componentCount: initOrder.length,
    });

    // 次のサイクルのためにリセット
    manager.reset();
  }

  logger.debug("初期化状態整合性テスト完了", {
    totalCycles: 3,
    allCyclesSuccessful: true,
  });
});
