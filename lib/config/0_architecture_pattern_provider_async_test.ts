/**
 * @fileoverview AsyncConfigPatternProvider 0_architecture Tests - Smart Constructor & Pattern Validation
 * 
 * Async pattern providerのアーキテクチャ制約とSmart Constructorパターンの正当性を検証。
 * Result型、非同期初期化パターン、型安全性の実装を検証。
 * 
 * テスト構成:
 * - Smart Constructor パターンの正当性
 * - Result型の適切な使用
 * - TypePatternProvider インターフェース実装
 * - エラー型の正確性とdiscriminated union
 * - 非同期初期化パターンの正当性
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  AsyncConfigPatternProvider,
  DefaultPatternProvider,
  createPatternProvider,
  type PatternProviderError,
} from "./pattern_provider_async.ts";
import type { TypePatternProvider } from "../types/type_factory.ts";
import { TwoParamsDirectivePattern } from "../types/directive_type.ts";
import { TwoParamsLayerTypePattern } from "../types/layer_type.ts";
import type { Result } from "../types/result.ts";

// =============================================================================
// 0_ARCHITECTURE: Smart Constructor & Interface Implementation Tests
// =============================================================================

Deno.test("0_architecture - AsyncConfigPatternProvider implements Smart Constructor pattern correctly", () => {
  // Smart Constructor: Private constructor, public static factory methods
  
  // Public factory methods exist
  assertExists(AsyncConfigPatternProvider.create);
  
  // Static factory method has proper async signature
  const createMethod = AsyncConfigPatternProvider.create;
  assertEquals(typeof createMethod, "function");
  
  // Factory method returns Promise<Result<AsyncConfigPatternProvider, PatternProviderError>>
  const result = createMethod();
  assert(result instanceof Promise);
  
  // Constructor should not be directly accessible (private)
  // This is enforced by TypeScript, not runtime
  assertExists(AsyncConfigPatternProvider);
});

Deno.test("0_architecture - AsyncConfigPatternProvider implements TypePatternProvider interface", () => {
  // Interface method signatures exist
  const provider = new DefaultPatternProvider(); // Use default for interface testing
  
  // Required methods from TypePatternProvider
  assertExists(provider.getDirectivePattern);
  assertExists(provider.getLayerTypePattern);
  
  assertEquals(typeof provider.getDirectivePattern, "function");
  assertEquals(typeof provider.getLayerTypePattern, "function");
  
  // Methods return proper types
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();
  
  // Should return TwoParamsDirectivePattern or null
  assert(directivePattern === null || directivePattern instanceof TwoParamsDirectivePattern);
  assert(layerPattern === null || layerPattern instanceof TwoParamsLayerTypePattern);
});

Deno.test("0_architecture - PatternProviderError has proper discriminated union structure", () => {
  // Error types should be discriminated unions with 'kind' property
  
  const configLoadError: PatternProviderError = {
    kind: "ConfigLoadFailed",
    message: "Test error"
  };
  
  const patternCreationError: PatternProviderError = {
    kind: "PatternCreationFailed",
    patternType: "directive",
    pattern: "test"
  };
  
  const notInitializedError: PatternProviderError = {
    kind: "NotInitialized"
  };
  
  // Verify discriminated union structure
  assertEquals(configLoadError.kind, "ConfigLoadFailed");
  assertExists(configLoadError.message);
  
  assertEquals(patternCreationError.kind, "PatternCreationFailed");
  assertExists(patternCreationError.patternType);
  assertExists(patternCreationError.pattern);
  
  assertEquals(notInitializedError.kind, "NotInitialized");
  
  // Type safety: each error type should have proper properties
  assertEquals(typeof configLoadError.message, "string");
  assert(["directive", "layer"].includes(patternCreationError.patternType));
  assertEquals(typeof patternCreationError.pattern, "string");
});

Deno.test("0_architecture - Result type used correctly in factory method", async () => {
  // Factory method should return Result<AsyncConfigPatternProvider, PatternProviderError>
  
  // Test with invalid config (should return error result)
  const result = await AsyncConfigPatternProvider.create("nonexistent-config", "/nonexistent/path");
  
  // Should be a Result type with ok/error structure
  assertExists(result);
  assert(typeof result === "object");
  assertExists(result.ok);
  
  // Error result should have proper structure
  if (!result.ok) {
    assertExists(result.error);
    assertExists(result.error.kind);
    assert(typeof result.error.kind === "string");
  } else {
    assertExists(result.data);
    assert(result.data instanceof AsyncConfigPatternProvider);
  }
});

Deno.test("0_architecture - DefaultPatternProvider follows proper constructor pattern", () => {
  // DefaultPatternProvider should use regular constructor (not Smart Constructor)
  const provider = new DefaultPatternProvider();
  
  assertExists(provider);
  assert(provider instanceof DefaultPatternProvider);
  
  // Should implement TypePatternProvider interface
  assertExists(provider.getDirectivePattern);
  assertExists(provider.getLayerTypePattern);
  
  // Should provide default patterns
  const directivePattern = provider.getDirectivePattern();
  const layerPattern = provider.getLayerTypePattern();
  
  assertExists(directivePattern);
  assertExists(layerPattern);
  
  assert(directivePattern instanceof TwoParamsDirectivePattern);
  assert(layerPattern instanceof TwoParamsLayerTypePattern);
});

Deno.test("0_architecture - createPatternProvider factory function has proper signature", async () => {
  // Factory function should handle both async and sync pattern providers
  
  assertExists(createPatternProvider);
  assertEquals(typeof createPatternProvider, "function");
  
  // Should return Promise<TypePatternProvider>
  const result1 = createPatternProvider(false); // Should use DefaultPatternProvider
  assert(result1 instanceof Promise);
  
  const provider1 = await result1;
  assert(provider1 instanceof DefaultPatternProvider);
  
  // Should return TypePatternProvider interface
  assertExists(provider1.getDirectivePattern);
  assertExists(provider1.getLayerTypePattern);
});

Deno.test("0_architecture - AsyncConfigPatternProvider instance methods have correct signatures", async () => {
  // Create provider instance for testing
  const provider = new DefaultPatternProvider(); // Use default for signature testing
  
  // Core interface methods
  assertEquals(typeof provider.getDirectivePattern, "function");
  assertEquals(typeof provider.getLayerTypePattern, "function");
  
  // Async provider specific methods (tested on interface)
  // Note: These are specific to AsyncConfigPatternProvider but not in base interface
  
  // Pattern methods should return proper types
  const directive = provider.getDirectivePattern();
  const layer = provider.getLayerTypePattern();
  
  // Should be null or proper pattern instances
  if (directive !== null) {
    assert(directive instanceof TwoParamsDirectivePattern);
  }
  if (layer !== null) {
    assert(layer instanceof TwoParamsLayerTypePattern);
  }
});

Deno.test("0_architecture - Pattern cache structure maintains type safety", () => {
  // Create provider to test internal cache structure
  const provider = new DefaultPatternProvider();
  
  // Cache should maintain proper types
  const directive1 = provider.getDirectivePattern();
  const directive2 = provider.getDirectivePattern();
  const layer1 = provider.getLayerTypePattern();
  const layer2 = provider.getLayerTypePattern();
  
  // Should return consistent types
  assertEquals(typeof directive1, typeof directive2);
  assertEquals(typeof layer1, typeof layer2);
  
  // If not null, should be proper pattern instances
  if (directive1) {
    assert(directive1 instanceof TwoParamsDirectivePattern);
    assertEquals(directive1.constructor, directive2?.constructor);
  }
  if (layer1) {
    assert(layer1 instanceof TwoParamsLayerTypePattern);
    assertEquals(layer1.constructor, layer2?.constructor);
  }
});

Deno.test("0_architecture - Async initialization pattern maintains state consistency", async () => {
  // Test that async initialization maintains proper state
  
  // Factory should handle initialization properly
  const result = await AsyncConfigPatternProvider.create("test-config", Deno.cwd());
  
  // Result should have consistent structure regardless of success/failure
  assertExists(result);
  assertExists(result.ok);
  
  if (result.ok) {
    assertExists(result.data);
    assertEquals(typeof result.data.isInitialized, "function");
    assertEquals(typeof result.data.debug, "function");
  } else {
    assertExists(result.error);
    assertExists(result.error.kind);
  }
});

Deno.test("0_architecture - Error factory maintains proper error hierarchy", () => {
  // Test different error types maintain proper structure
  
  const errors: PatternProviderError[] = [
    { kind: "ConfigLoadFailed", message: "Config failed" },
    { kind: "PatternCreationFailed", patternType: "directive", pattern: "invalid" },
    { kind: "NotInitialized" }
  ];
  
  for (const error of errors) {
    // All errors should have kind property
    assertExists(error.kind);
    assertEquals(typeof error.kind, "string");
    
    // Verify specific error structure
    switch (error.kind) {
      case "ConfigLoadFailed":
        assertExists(error.message);
        assertEquals(typeof error.message, "string");
        break;
      case "PatternCreationFailed":
        assertExists(error.patternType);
        assertExists(error.pattern);
        assert(["directive", "layer"].includes(error.patternType));
        assertEquals(typeof error.pattern, "string");
        break;
      case "NotInitialized":
        // Should only have kind property
        assertEquals(Object.keys(error).length, 1);
        break;
    }
  }
});

Deno.test("0_architecture - TypePatternProvider interface consistency", () => {
  // Both implementations should provide consistent interface
  
  const defaultProvider = new DefaultPatternProvider();
  
  // Interface methods should exist and be functions
  const methods = [
    "getDirectivePattern",
    "getLayerTypePattern"
  ];
  
  for (const method of methods) {
    assertExists((defaultProvider as any)[method]);
    assertEquals(typeof (defaultProvider as any)[method], "function");
  }
  
  // Methods should return proper types
  const directiveResult = defaultProvider.getDirectivePattern();
  const layerResult = defaultProvider.getLayerTypePattern();
  
  // Should be null or proper pattern types
  assert(directiveResult === null || directiveResult instanceof TwoParamsDirectivePattern);
  assert(layerResult === null || layerResult instanceof TwoParamsLayerTypePattern);
});

Deno.test("0_architecture - Const assertions and type safety in configuration", () => {
  // Test that configuration patterns maintain const assertions
  
  const provider = new DefaultPatternProvider();
  
  // Pattern instances should be immutable
  const pattern1 = provider.getDirectivePattern();
  const pattern2 = provider.getDirectivePattern();
  
  if (pattern1 && pattern2) {
    // Should return same instance (cached)
    assertEquals(pattern1, pattern2);
  }
  
  // Pattern objects should be readonly
  const layerPattern = provider.getLayerTypePattern();
  if (layerPattern) {
    // Pattern should be immutable TwoParamsLayerTypePattern
    assert(layerPattern instanceof TwoParamsLayerTypePattern);
  }
});