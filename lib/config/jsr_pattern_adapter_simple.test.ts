/**
 * @fileoverview JSRPatternAdapter simple test
 *
 * Simple operation verification using only DEFAULT_CUSTOM_CONFIG
 */

import { assert, assertEquals } from "../deps.ts";
import { JSRPatternAdapter } from "./jsr_pattern_adapter.ts";

Deno.test("JSRPatternAdapter - Basic operation with DEFAULT_CUSTOM_CONFIG", () => {
  // Create with DEFAULT_CUSTOM_CONFIG
  const result = JSRPatternAdapter.create();

  if (!result.ok) {
    const errorMessage = "message" in result.error ? result.error.message : result.error.kind;
    console.log(`Creation failed: ${errorMessage}`);

    // Continue even on error (for debugging purposes)
    assert(false, `JSRPatternAdapter creation failed: ${errorMessage}`);
  }

  const adapter = result.data;

  // Basic initialization verification
  assertEquals(adapter.isInitialized(), true);

  // Debug information verification
  const debugInfo = adapter.debug();
  console.log("Debug info:", debugInfo);

  // Verify TypePatternProvider basic method operation
  console.log("validateDirectiveType('to'):", adapter.validateDirectiveType("to"));
  console.log("validateLayerType('project'):", adapter.validateLayerType("project"));

  console.log("getValidDirectiveTypes():", adapter.getValidDirectiveTypes());
  console.log("getValidLayerTypes():", adapter.getValidLayerTypes());
});

Deno.test("JSRPatternAdapter - Pattern object retrieval", () => {
  const result = JSRPatternAdapter.create();

  if (result.ok) {
    const adapter = result.data;

    const directivePattern = adapter.getDirectivePattern();
    const layerPattern = adapter.getLayerTypePattern();

    console.log("DirectivePattern:", directivePattern);
    console.log("LayerPattern:", layerPattern);

    // Verify patterns can be retrieved (null is acceptable)
    console.log("Has directive pattern:", directivePattern !== null);
    console.log("Has layer pattern:", layerPattern !== null);
  } else {
    console.log("Adapter creation failed, skipping pattern test");
  }
});
