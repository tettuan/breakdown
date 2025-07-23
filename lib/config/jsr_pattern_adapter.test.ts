/**
 * @fileoverview JSRPatternAdapter test
 *
 * Verify complete TypePatternProvider implementation operation and AsyncConfigPatternProvider compatibility
 */

import { assert, assertEquals, assertExists } from "../deps.ts";
import { createJSRPatternAdapter, JSRPatternAdapter } from "./jsr_pattern_adapter.ts";
import { DEFAULT_CUSTOM_CONFIG } from "../deps.ts";
import type { CustomConfig } from "../deps.ts";

Deno.test("JSRPatternAdapter - Basic creation and TypePatternProvider implementation", () => {
  // Test custom configuration
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  // Create JSRPatternAdapter
  const result = JSRPatternAdapter.create(testConfig);
  if (!result.ok) {
    const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
    assert(false, `Failed to create JSRPatternAdapter: ${errorMessage}`);
  }

  const adapter = result.data;

  // Verify TypePatternProvider implementation methods
  assertEquals(adapter.isInitialized(), true);

  // DirectiveType validation
  assertEquals(adapter.validateDirectiveType("to"), true);
  assertEquals(adapter.validateDirectiveType("summary"), true);
  assertEquals(adapter.validateDirectiveType("invalid"), false);

  // LayerType validation
  assertEquals(adapter.validateLayerType("project"), true);
  assertEquals(adapter.validateLayerType("issue"), true);
  assertEquals(adapter.validateLayerType("invalid"), false);
});

Deno.test("JSRPatternAdapter - Valid value retrieval", () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  const result = JSRPatternAdapter.create(testConfig);
  assert(result.ok);
  const adapter = result.data;

  // Get valid DirectiveTypes
  const validDirectives = adapter.getValidDirectiveTypes();
  assertEquals(validDirectives.length, 3);
  assertEquals(validDirectives, ["to", "summary", "defect"]);

  // Get valid LayerTypes
  const validLayers = adapter.getValidLayerTypes();
  assertEquals(validLayers.length, 3);
  assertEquals(validLayers, ["project", "issue", "task"]);
});

Deno.test("JSRPatternAdapter - Pattern object retrieval", () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  const result = JSRPatternAdapter.create(testConfig);
  assert(result.ok);
  const adapter = result.data;

  // DirectiveType pattern object
  const directivePattern = adapter.getDirectivePattern();
  assertExists(directivePattern);
  assertEquals(directivePattern.test("to"), true);
  assertEquals(directivePattern.test("invalid"), false);
  assertEquals(directivePattern.getPattern(), "to|summary|defect");

  // LayerType pattern object
  const layerPattern = adapter.getLayerTypePattern();
  assertExists(layerPattern);
  assertEquals(layerPattern.test("project"), true);
  assertEquals(layerPattern.test("invalid"), false);
  assertEquals(layerPattern.getPattern(), "project|issue|task");
});

Deno.test("JSRPatternAdapter - AsyncConfigPatternProvider compatibility function", () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  const result = JSRPatternAdapter.create(testConfig);
  assert(result.ok);
  const adapter = result.data;

  // hasValidPatterns
  assertEquals(adapter.hasValidPatterns(), true);

  // getAllPatterns
  const allPatternsResult = adapter.getAllPatterns();
  assert(allPatternsResult.ok);
  assertExists(allPatternsResult.data.directive);
  assertExists(allPatternsResult.data.layer);

  // clearCache (正常動作確認)
  adapter.clearCache();
  assertEquals(adapter.hasValidPatterns(), true); // 再初期化されるので有効のまま

  // Debug information
  const debugInfo = adapter.debug();
  assertEquals(debugInfo.initialized, true);
  assertEquals(debugInfo.hasDirectivePattern, true);
  assertEquals(debugInfo.hasLayerTypePattern, true);
  assertEquals(debugInfo.validDirectives, ["to", "summary", "defect"]);
  assertEquals(debugInfo.validLayers, ["project", "issue", "task"]);
});

Deno.test("JSRPatternAdapter - Factory function", async () => {
  const testConfig: CustomConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: {
      two: {
        directiveType: {
          pattern: "to|summary|defect",
          errorMessage: "Invalid directive type",
        },
        layerType: {
          pattern: "project|issue|task",
          errorMessage: "Invalid layer type",
        },
      },
    },
  };

  // createJSRPatternAdapter factory function
  const adapter = await createJSRPatternAdapter(testConfig);
  assertEquals(adapter.isInitialized(), true);
  assertEquals(adapter.validateDirectiveType("to"), true);
  assertEquals(adapter.validateLayerType("project"), true);
});

Deno.test("JSRPatternAdapter - DEFAULT_CUSTOM_CONFIG usage", () => {
  // Create with DEFAULT_CUSTOM_CONFIG
  const result = JSRPatternAdapter.create();
  if (!result.ok) {
    const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
    assert(false, `Failed with DEFAULT_CUSTOM_CONFIG: ${errorMessage}`);
  }

  const adapter = result.data;
  assertEquals(adapter.isInitialized(), true);

  // Verify operation with DEFAULT_CUSTOM_CONFIG values
  const debugInfo = adapter.debug();
  assertEquals(debugInfo.initialized, true);
});

Deno.test("JSRPatternAdapter - Error handling", () => {
  // Test with invalid configuration (no params to trigger error)
  const invalidConfig = {
    ...DEFAULT_CUSTOM_CONFIG,
    params: undefined as never, // Invalid configuration
  } as CustomConfig;

  const result = JSRPatternAdapter.create(invalidConfig);
  assert(!result.ok, "Should fail with invalid config");
  assertEquals(result.error.kind, "ConfigurationInvalid");
});
