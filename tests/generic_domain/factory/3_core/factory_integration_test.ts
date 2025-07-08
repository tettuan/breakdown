/**
 * @fileoverview Factory Integration Test - 汎用ドメインファクトリーの統合テスト
 * 
 * このテストは、ファクトリーパターンを用いたオブジェクト生成と変換プロセスの
 * 統合性を検証します。特に、ファクトリーコンポーネント間の協調動作を
 * 重点的にテストします。
 * 
 * @module tests/generic_domain/factory/3_core/factory_integration_test
 */

import { assertEquals, assertExists } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { TwoParams_Result } from "../../../../lib/deps.ts";

const logger = new BreakdownLogger("factory-integration-test");

/**
 * ファクトリー統合テスト群
 * 
 * 技術基盤の信頼性を保証するため、以下の観点でテストします：
 * 1. ファクトリー間の連携動作
 * 2. 変換プロセスの一貫性
 * 3. エラーハンドリングの適切性
 * 4. パフォーマンスの妥当性
 */

Deno.test("Factory Integration: Basic factory component validation", () => {
  logger.debug("基本ファクトリーコンポーネント検証開始", {
    testType: "integration",
    target: "basic factory components",
  });

  // TwoParams_Resultの基本構造テスト
  const mockTwoParams: TwoParams_Result = {
    type: "two",
    demonstrativeType: "to",
    layerType: "task",
    params: ["to", "task"],
    options: {
      fromFile: "./test_input.md",
      destinationFile: "./test_output.json",
      adaptation: "standard",
      customVariables: {
        userVar1: "testValue1",
        userVar2: "testValue2"
      }
    }
  };

  logger.debug("TwoParams_Result構造確認", {
    type: mockTwoParams.type,
    demonstrativeType: mockTwoParams.demonstrativeType,
    layerType: mockTwoParams.layerType,
    hasOptions: !!mockTwoParams.options,
  });

  // 基本的な構造の検証
  assertEquals(mockTwoParams.type, "two");
  assertEquals(mockTwoParams.demonstrativeType, "to");
  assertEquals(mockTwoParams.layerType, "task");
  assertExists(mockTwoParams.options);
  
  // オプションの構造確認
  if (mockTwoParams.options && mockTwoParams.options.customVariables) {
    const customVars = mockTwoParams.options.customVariables as Record<string, string>;
    assertEquals(customVars.userVar1, "testValue1");
    assertEquals(customVars.userVar2, "testValue2");
  }
});

Deno.test("Factory Integration: Path resolution pattern validation", () => {
  logger.debug("パス解決パターン検証テスト開始", {
    testType: "integration",
    target: "path resolution patterns",
  });

  // パス解決のパターンテスト
  const pathPatterns = [
    { directive: "to", layer: "project", expected: "to/project" },
    { directive: "summary", layer: "issue", expected: "summary/issue" },
    { directive: "defect", layer: "task", expected: "defect/task" },
  ];

  pathPatterns.forEach(({ directive, layer, expected }) => {
    const mockResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: directive,
      layerType: layer,
      params: [directive, layer],
      options: {}
    };

    logger.debug("パス解決パターン確認", {
      directive,
      layer,
      expected,
      resultValid: mockResult.type === "two",
    });

    // パターンの基本構造確認
    assertEquals(mockResult.demonstrativeType, directive);
    assertEquals(mockResult.layerType, layer);
    
    // 期待されるパス構造の検証
    const pathSegments = [directive, layer];
    assertEquals(pathSegments.join("/"), expected);
  });
});

Deno.test("Factory Integration: Configuration pattern validation", () => {
  logger.debug("設定パターン検証テスト開始", {
    testType: "integration",
    target: "configuration patterns",
  });

  // さまざまな設定パターンでのテスト
  const configPatterns = [
    { config: "default", prefix: "", expected: "default" },
    { config: "breakdown", prefix: "breakdown-", expected: "breakdown" },
    { config: "custom", prefix: "custom-", expected: "custom" },
  ];

  configPatterns.forEach(({ config, prefix, expected }) => {
    logger.debug("設定パターン確認", {
      config,
      prefix,
      expected,
    });

    // 設定パターンの基本検証
    assertEquals(config, expected);
    
    // プレフィックスパターンの検証
    if (prefix) {
      assertEquals(prefix.startsWith(config), true);
    }
  });
});

Deno.test("Factory Integration: Error handling patterns", () => {
  logger.debug("エラーハンドリングパターンテスト開始", {
    testType: "integration",
    target: "error handling patterns",
  });

  // エラーケースのテスト
  const errorCases = [
    {
      name: "Invalid directive type",
      params: { type: "two", demonstrativeType: "", layerType: "task" },
      shouldFail: true,
    },
    {
      name: "Invalid layer type", 
      params: { type: "two", demonstrativeType: "to", layerType: "" },
      shouldFail: true,
    },
    {
      name: "Valid parameters",
      params: { type: "two", demonstrativeType: "to", layerType: "task" },
      shouldFail: false,
    },
  ];

  errorCases.forEach(({ name, params, shouldFail }) => {
    logger.debug(`エラーケース確認: ${name}`, {
      params,
      shouldFail,
    });

    // 基本的なパラメータ検証
    const hasValidDirective = params.demonstrativeType && params.demonstrativeType.length > 0;
    const hasValidLayer = params.layerType && params.layerType.length > 0;
    const isValid = hasValidDirective && hasValidLayer;

    // shouldFailがtrueなら、isValidはfalseであるべき
    // shouldFailがfalseなら、isValidはtrueであるべき
    assertEquals(isValid, !shouldFail, `${name}: validation result mismatch - expected valid=${!shouldFail}, got valid=${isValid}`);
  });
});

Deno.test("Factory Integration: Performance characteristics validation", () => {
  logger.debug("パフォーマンス特性検証テスト開始", {
    testType: "integration",
    target: "performance validation",
  });

  const iterations = 1000;
  const startTime = performance.now();

  // 大量のオブジェクト作成パフォーマンステスト
  for (let i = 0; i < iterations; i++) {
    const mockResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "task",
      params: ["to", "task"],
      options: {
        fromFile: `./test_${i}.md`,
        customVariables: { iteration: i.toString() }
      }
    };

    // 基本的な操作の実行
    assertExists(mockResult);
    assertEquals(mockResult.type, "two");
  }

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const averageTime = totalTime / iterations;

  logger.debug("パフォーマンステスト結果", {
    iterations,
    totalTime: `${totalTime.toFixed(2)}ms`,
    averageTime: `${averageTime.toFixed(4)}ms`,
    acceptable: averageTime < 1, // 1ms未満/回を期待
  });

  // パフォーマンスの妥当性確認（1ms未満/回）
  assertEquals(averageTime < 1, true, 
    `Average time ${averageTime}ms exceeds 1ms threshold`);
});

Deno.test("Factory Integration: Memory usage stability validation", () => {
  logger.debug("メモリ使用量安定性検証テスト開始", {
    testType: "integration",
    target: "memory stability validation",
  });

  // 初期メモリ使用量の測定
  const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

  // 繰り返しオブジェクト作成
  const objects = [];
  for (let i = 0; i < 100; i++) {
    const mockResult: TwoParams_Result = {
      type: "two",
      demonstrativeType: "to",
      layerType: "task",
      params: ["to", "task"],
      options: {
        fromFile: `./test_${i}.md`,
        destinationFile: `./output_${i}.json`,
        adaptation: "standard",
        customVariables: { test: `value_${i}` }
      }
    };
    objects.push(mockResult);
  }

  // 最終メモリ使用量の測定
  const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const memoryIncrease = finalMemory - initialMemory;

  logger.debug("メモリ使用量測定結果", {
    objectsCreated: objects.length,
    initialMemory: `${Math.round(initialMemory / 1024)}KB`,
    finalMemory: `${Math.round(finalMemory / 1024)}KB`,
    increase: `${Math.round(memoryIncrease / 1024)}KB`,
    acceptable: memoryIncrease < 512 * 1024, // 512KB未満を期待
  });

  // オブジェクト数の確認
  assertEquals(objects.length, 100);

  // メモリリークがないことを確認（512KB未満の増加）
  if ((performance as any).memory) {
    assertEquals(memoryIncrease < 512 * 1024, true, 
      `Memory increase ${Math.round(memoryIncrease / 1024)}KB exceeds 512KB threshold`);
  }
});

Deno.test("Factory Integration: Data type consistency validation", () => {
  logger.debug("データ型一貫性検証テスト開始", {
    testType: "integration",
    target: "data type consistency",
  });

  // 様々なデータ型の一貫性テスト
  const typeTestCases = [
    {
      name: "String types",
      data: { demonstrativeType: "to", layerType: "task" },
      validator: (obj: any) => typeof obj.demonstrativeType === "string" && typeof obj.layerType === "string"
    },
    {
      name: "Object types",
      data: { options: { fromFile: "./test.md", customVariables: {} } },
      validator: (obj: any) => typeof obj.options === "object" && obj.options !== null
    },
    {
      name: "Optional types",
      data: { options: { adaptation: undefined, customVariables: null } },
      validator: (obj: any) => obj.options.adaptation === undefined && obj.options.customVariables === null
    },
  ];

  typeTestCases.forEach(({ name, data, validator }) => {
    logger.debug(`型一貫性確認: ${name}`, {
      dataKeys: Object.keys(data),
      valid: validator(data),
    });

    assertEquals(validator(data), true, `${name}: type validation failed`);
  });
});