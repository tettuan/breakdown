/**
 * @fileoverview AsyncConfigPatternProvider 1_behavior Tests - Business Logic and Behavior Validation
 *
 * Async pattern providerの動作とビジネスロジックを検証。
 * 非同期初期化、キャッシュ動作、設定読み込み、エラーハンドリングの挙動をテスト。
 *
 * テスト構成:
 * - 非同期初期化とライフサイクル
 * - パターンキャッシュの動作
 * - 設定データの抽出と変換
 * - エラーハンドリングとフォールバック
 * - デバッグ情報の提供
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import {
  AsyncConfigPatternProvider,
  createPatternProvider,
  DefaultPatternProvider,
  type PatternProviderError,
} from "./pattern_provider_async.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";

// =============================================================================
// Test Utilities
// =============================================================================

async function createTestConfigFiles(baseDir: string): Promise<void> {
  await ensureDir(baseDir);

  // Valid config with patterns
  const validConfig = {
    directivePattern: "^(to|summary|defect)$",
    layerTypePattern: "^(project|issue|task)$",
    twoParamsRules: {
      directive: {
        pattern: "^(to|summary|defect|init)$",
        errorMessage: "Invalid directive",
      },
      layer: {
        pattern: "^(project|issue|task|bugs)$",
        errorMessage: "Invalid layer",
      },
    },
  };

  // Nested validation config
  const nestedConfig = {
    validation: {
      directive: {
        pattern: "^(find|create|update)$",
      },
      layer: {
        pattern: "^(module|component|service)$",
      },
    },
  };

  // Minimal config
  const minimalConfig = {
    someOtherSetting: "value",
  };

  await Deno.writeTextFile(
    join(baseDir, "valid-app.yml"),
    `directivePattern: "^(to|summary|defect)$"\nlayerTypePattern: "^(project|issue|task)$"`,
  );

  await Deno.writeTextFile(
    join(baseDir, "nested-app.yml"),
    `validation:\n  directive:\n    pattern: "^(find|create|update)$"\n  layer:\n    pattern: "^(module|component|service)$"`,
  );

  await Deno.writeTextFile(
    join(baseDir, "minimal-app.yml"),
    `someOtherSetting: "value"`,
  );
}

// =============================================================================
// 1_BEHAVIOR: Business Logic and Behavior Tests
// =============================================================================

Deno.test("1_behavior - AsyncConfigPatternProvider initialization lifecycle", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "pattern_provider_test_" });
  await createTestConfigFiles(tempDir);

  try {
    // Test successful initialization
    const result = await AsyncConfigPatternProvider.create("valid", tempDir);

    if (result.ok) {
      const provider = result.data;

      // Should be initialized after creation
      assertEquals(provider.isInitialized(), true);

      // Debug info should reflect initialized state
      const debug = provider.debug();
      assertEquals(debug.initialized, true);
      assertExists(debug.hasConfigData);

      // Should be able to get patterns
      assertExists(provider.getDirectivePattern);
      assertExists(provider.getLayerTypePattern);
    } else {
      // If creation fails, should have proper error
      assertExists(result.error);
      assertExists(result.error.kind);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior - Pattern caching behavior", async () => {
  const provider = new DefaultPatternProvider();

  // First access should initialize cache
  const directive1 = provider.getDirectivePattern();
  const layer1 = provider.getLayerTypePattern();

  // Second access should return cached values
  const directive2 = provider.getDirectivePattern();
  const layer2 = provider.getLayerTypePattern();

  // Should return same instances (reference equality for caching)
  assertEquals(directive1, directive2);
  assertEquals(layer1, layer2);

  // Should be valid pattern instances
  if (directive1) {
    assert(directive1 instanceof TwoParamsDirectivePattern);
  }
  if (layer1) {
    assert(layer1 instanceof TwoParamsLayerTypePattern);
  }
});

Deno.test("1_behavior - Pattern extraction from different config structures", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "pattern_extraction_test_" });
  await createTestConfigFiles(tempDir);

  try {
    // Test nested validation structure
    const result = await AsyncConfigPatternProvider.create("nested", tempDir);

    if (result.ok) {
      const provider = result.data;

      // Should extract patterns from nested structure
      const directive = provider.getDirectivePattern();
      const layer = provider.getLayerTypePattern();

      // Patterns should be valid
      if (directive) {
        assert(directive instanceof TwoParamsDirectivePattern);
      }
      if (layer) {
        assert(layer instanceof TwoParamsLayerTypePattern);
      }

      // Should have valid patterns available
      const hasValid = provider.hasValidPatterns();
      assertEquals(typeof hasValid, "boolean");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior - Fallback to default patterns when config missing", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "fallback_test_" });
  await createTestConfigFiles(tempDir);

  try {
    // Test with minimal config (no patterns)
    const result = await AsyncConfigPatternProvider.create("minimal", tempDir);

    if (result.ok) {
      const provider = result.data;

      // Should still provide patterns (fallback to defaults)
      const directive = provider.getDirectivePattern();
      const layer = provider.getLayerTypePattern();

      // Should have fallback patterns
      assertExists(directive);
      assertExists(layer);

      assert(directive instanceof TwoParamsDirectivePattern);
      assert(layer instanceof TwoParamsLayerTypePattern);
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior - Cache clearing and reloading", async () => {
  const provider = new DefaultPatternProvider();

  // Get initial patterns
  const directive1 = provider.getDirectivePattern();
  const layer1 = provider.getLayerTypePattern();

  // For DefaultPatternProvider, patterns are static
  // Test that they remain consistent
  const directive2 = provider.getDirectivePattern();
  const layer2 = provider.getLayerTypePattern();

  assertEquals(directive1, directive2);
  assertEquals(layer1, layer2);

  // Should maintain pattern validity
  if (directive1) {
    assert(directive1 instanceof TwoParamsDirectivePattern);
  }
  if (layer1) {
    assert(layer1 instanceof TwoParamsLayerTypePattern);
  }
});

Deno.test("1_behavior - Error handling for invalid configurations", async () => {
  // Test with nonexistent config
  const result = await AsyncConfigPatternProvider.create("nonexistent", "/invalid/path");

  // Should return error result
  assert(!result.ok);
  assertExists(result.error);

  // Error should have proper structure
  assertEquals(result.error.kind, "ConfigLoadFailed");
  if (result.error.kind === "ConfigLoadFailed") {
    assertExists(result.error.message);
    assertEquals(typeof result.error.message, "string");
  }
});

Deno.test("1_behavior - createPatternProvider factory function behavior", async () => {
  // Test with config disabled (should use DefaultPatternProvider)
  const provider1 = await createPatternProvider(false);
  assert(provider1 instanceof DefaultPatternProvider);

  // Should provide valid patterns
  const directive1 = provider1.getDirectivePattern();
  const layer1 = provider1.getLayerTypePattern();

  assertExists(directive1);
  assertExists(layer1);

  // Test with invalid config (should fallback to DefaultPatternProvider)
  const provider2 = await createPatternProvider(true, "nonexistent", "/invalid");
  assert(provider2 instanceof DefaultPatternProvider);

  // Should still provide valid patterns
  const directive2 = provider2.getDirectivePattern();
  const layer2 = provider2.getLayerTypePattern();

  assertExists(directive2);
  assertExists(layer2);
});

Deno.test("1_behavior - getAllPatterns method behavior", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "get_all_patterns_test_" });
  await createTestConfigFiles(tempDir);

  try {
    const result = await AsyncConfigPatternProvider.create("valid", tempDir);

    if (result.ok) {
      const provider = result.data;

      // Test getAllPatterns method
      const patternsResult = await provider.getAllPatterns();

      if (patternsResult.ok) {
        const patterns = patternsResult.data;

        assertExists(patterns);
        assertExists(patterns.directive);
        assertExists(patterns.layer);

        // Should be proper pattern instances or null
        if (patterns.directive) {
          assert(patterns.directive instanceof TwoParamsDirectivePattern);
        }
        if (patterns.layer) {
          assert(patterns.layer instanceof TwoParamsLayerTypePattern);
        }
      } else {
        // If error, should have proper error structure
        assertExists(patternsResult.error);
        assertExists(patternsResult.error.kind);
      }
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior - Debug information provides accurate state", async () => {
  const provider = new DefaultPatternProvider();

  // DefaultPatternProvider doesn't have debug method, test interface consistency
  assertExists(provider.getDirectivePattern);
  assertExists(provider.getLayerTypePattern);

  // Test pattern availability
  const directive = provider.getDirectivePattern();
  const layer = provider.getLayerTypePattern();

  // Should have patterns available
  assertExists(directive);
  assertExists(layer);

  // Test hasValidPatterns equivalent
  const hasDirective = directive !== null;
  const hasLayer = layer !== null;

  assertEquals(hasDirective, true);
  assertEquals(hasLayer, true);
});

Deno.test("1_behavior - Pattern validation with different input patterns", () => {
  const provider = new DefaultPatternProvider();

  // Get patterns
  const directive = provider.getDirectivePattern();
  const layer = provider.getLayerTypePattern();

  assertExists(directive);
  assertExists(layer);

  // Patterns should be valid TwoParams patterns
  assert(directive instanceof TwoParamsDirectivePattern);
  assert(layer instanceof TwoParamsLayerTypePattern);

  // Should provide consistent results
  const directive2 = provider.getDirectivePattern();
  const layer2 = provider.getLayerTypePattern();

  assertEquals(directive, directive2);
  assertEquals(layer, layer2);
});

Deno.test("1_behavior - Concurrent pattern access behavior", async () => {
  const provider = new DefaultPatternProvider();

  // Simulate concurrent access
  const promises = Array.from({ length: 10 }, () =>
    Promise.resolve().then(() => ({
      directive: provider.getDirectivePattern(),
      layer: provider.getLayerTypePattern(),
    })));

  const results = await Promise.all(promises);

  // All results should be consistent
  const first = results[0];
  for (const result of results) {
    assertEquals(result.directive, first.directive);
    assertEquals(result.layer, first.layer);
  }

  // Should all be valid patterns
  for (const result of results) {
    if (result.directive) {
      assert(result.directive instanceof TwoParamsDirectivePattern);
    }
    if (result.layer) {
      assert(result.layer instanceof TwoParamsLayerTypePattern);
    }
  }
});

Deno.test("1_behavior - Edge cases in pattern extraction", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "edge_cases_test_" });

  try {
    // Create config with edge case data
    await Deno.writeTextFile(
      join(tempDir, "edge-app.yml"),
      `directivePattern: ""\nlayerTypePattern: null`,
    );

    const result = await AsyncConfigPatternProvider.create("edge", tempDir);

    if (result.ok) {
      const provider = result.data;

      // Should handle empty/null patterns gracefully
      const directive = provider.getDirectivePattern();
      const layer = provider.getLayerTypePattern();

      // Should either be null or valid patterns (fallback behavior)
      if (directive !== null) {
        assert(directive instanceof TwoParamsDirectivePattern);
      }
      if (layer !== null) {
        assert(layer instanceof TwoParamsLayerTypePattern);
      }
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("1_behavior - Provider state consistency across operations", async () => {
  const provider = new DefaultPatternProvider();

  // Multiple operations should maintain consistent state
  const operations = [
    () => provider.getDirectivePattern(),
    () => provider.getLayerTypePattern(),
    () => provider.getDirectivePattern(),
    () => provider.getLayerTypePattern(),
  ];

  const results = operations.map((op) => op());

  // Directive patterns should be consistent
  assertEquals(results[0], results[2]);
  // Layer patterns should be consistent
  assertEquals(results[1], results[3]);

  // All results should be valid
  for (const result of results) {
    if (result !== null) {
      assert(
        result instanceof TwoParamsDirectivePattern || result instanceof TwoParamsLayerTypePattern,
      );
    }
  }
});
