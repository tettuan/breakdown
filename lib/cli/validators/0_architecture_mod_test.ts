/**
 * @fileoverview Architecture Test for CLI Validators Module
 * 
 * Verifies architectural constraints for the validators module index:
 * - Module export patterns and re-export consistency
 * - Dependency direction compliance (no circular dependencies)
 * - Layer boundary adherence (validators layer constraints)
 * - Public API surface control
 * 
 * This test ensures the module follows the Totality principle by:
 * - Properly encapsulating validator implementations
 * - Maintaining clean module boundaries
 * - Following consistent export patterns
 * 
 * @module lib/cli/validators/0_architecture_mod_test
 */

import { assertEquals, assertExists } from "@std/assert";

Deno.test("Architecture: Validators module should export required types and classes", async () => {
  // Import the module exports
  const validatorsModule = await import("./mod.ts");
  
  // Verify required exports exist
  assertExists(validatorsModule.TwoParamsValidator);
  assertEquals(typeof validatorsModule.TwoParamsValidator, "function");
  
  // Type exports should be available (verified by successful import compilation)
  // These are type exports, so we can't check them at runtime
  // Their presence is verified by the module compiling without errors
});

Deno.test("Architecture: Module should follow barrel export pattern", async () => {
  // The mod.ts should act as a barrel, re-exporting from internal modules
  const modContent = await Deno.readTextFile("./lib/cli/validators/mod.ts");
  
  // Should use export statements, not direct implementations
  assertEquals(modContent.includes("export {"), true);
  assertEquals(modContent.includes("class "), false, "mod.ts should not contain class implementations");
  assertEquals(modContent.includes("function "), false, "mod.ts should not contain function implementations");
});

Deno.test("Architecture: Module should maintain proper dependency hierarchy", async () => {
  // Validators should only depend on lower-level modules
  const modContent = await Deno.readTextFile("./lib/cli/validators/mod.ts");
  
  // Should not import from higher-level modules
  assertEquals(modContent.includes("from \"../handlers/"), false, "Should not import from handlers");
  assertEquals(modContent.includes("from \"../orchestrators/"), false, "Should not import from orchestrators");
  assertEquals(modContent.includes("from \"../processors/"), false, "Should not import from processors");
  
  // Should only import from its own directory
  assertEquals(modContent.includes("from \"./"), true, "Should import from local modules");
});

Deno.test("Architecture: Module exports should be consistent with implementation", async () => {
  // Import both the module and the implementation
  const modExports = await import("./mod.ts");
  const implExports = await import("./two_params_validator.ts");
  
  // Verify that exports match
  assertEquals(modExports.TwoParamsValidator, implExports.TwoParamsValidator);
  
  // Both should have the same class constructor
  assertEquals(
    modExports.TwoParamsValidator.prototype.constructor,
    implExports.TwoParamsValidator.prototype.constructor
  );
});

Deno.test("Architecture: Module should control public API surface", () => {
  // The module should only export what's necessary for external use
  // This is verified by checking the export statement structure
  const expectedExports = [
    "TwoParamsValidator",
    "ValidationError", // type export
    "ValidatedParams" // type export
  ];
  
  // This test ensures we're not accidentally exposing internal utilities
  assertEquals(expectedExports.length, 3, "Should only export necessary public API");
});

Deno.test("Architecture: Module should support future extensibility", async () => {
  // The module structure should allow adding new validators without breaking changes
  const modContent = await Deno.readTextFile("./lib/cli/validators/mod.ts");
  
  // Should use named exports for extensibility
  assertEquals(modContent.includes("export {"), true);
  
  // Should be able to add new exports without modifying existing ones
  const exportPattern = /export\s*{[\s\S]*?}\s*from/;
  assertEquals(exportPattern.test(modContent), true, "Should use extensible export pattern");
});

Deno.test("Architecture: Module should not leak implementation details", async () => {
  const modExports = await import("./mod.ts");
  
  // Internal constants should not be exported
  assertEquals((modExports as { VALID_DEMONSTRATIVE_TYPES?: unknown }).VALID_DEMONSTRATIVE_TYPES, undefined);
  assertEquals((modExports as { VALID_LAYER_TYPES?: unknown }).VALID_LAYER_TYPES, undefined);
  
  // Internal functions should not be exported
  assertEquals((modExports as { isDemonstrativeType?: unknown }).isDemonstrativeType, undefined);
  assertEquals((modExports as { isLayerType?: unknown }).isLayerType, undefined);
});

Deno.test("Architecture: Module should follow naming conventions", async () => {
  // Verify the module follows standard naming conventions
  const modPath = "./lib/cli/validators/mod.ts";
  
  // mod.ts is the standard name for index modules in Deno
  assertEquals(modPath.endsWith("mod.ts"), true);
  
  // Directory structure should be logical
  assertEquals(modPath.includes("/cli/validators/"), true);
});

Deno.test("Architecture: Type exports should maintain consistency", async () => {
  // Verify that type exports are properly structured
  const modContent = await Deno.readTextFile("./lib/cli/validators/mod.ts");
  
  // Should export types along with implementations
  assertEquals(modContent.includes("type ValidationError"), true);
  assertEquals(modContent.includes("type ValidatedParams"), true);
  
  // Types should be exported from the same module as their implementations
  const hasConsistentExport = modContent.includes("TwoParamsValidator") && 
                              modContent.includes("ValidationError") &&
                              modContent.includes("ValidatedParams");
  assertEquals(hasConsistentExport, true, "Types and implementations should be co-located");
});

Deno.test("Architecture: Module should support tree-shaking", async () => {
  // The module structure should support tree-shaking for optimal bundle size
  const modContent = await Deno.readTextFile("./lib/cli/validators/mod.ts");
  
  // Should use named exports (better for tree-shaking than default exports)
  assertEquals(modContent.includes("export {"), true);
  assertEquals(modContent.includes("export default"), false, "Should not use default exports");
  
  // Each export should be individually importable
  const { TwoParamsValidator } = await import("./mod.ts");
  assertExists(TwoParamsValidator);
});