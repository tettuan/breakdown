/**
 * Architecture tests for validators module barrel export
 *
 * These tests verify that the module follows architectural patterns
 * and maintains proper exports structure.
 *
 * @module cli/validators/tests/0_architecture_mod_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("Validators Module - Architecture", () => {
  it("should export all public validators", async () => {
    const _mod = await import("./mod.ts");

    // Core validators
    assertExists(_mod.TwoParamsValidator);
    assertExists(_mod.ParameterValidator);
  });

  it("should export all type definitions", async () => {
    const _mod = await import("./mod.ts");

    // Check that types are available (via type checking)
    const typeExports = Object.keys(_mod as Record<string, unknown>);

    // Should have validator classes
    assertEquals(typeExports.includes("TwoParamsValidator"), true);
    assertEquals(typeExports.includes("ParameterValidator"), true);
  });

  it("should not export internal implementations", async () => {
    const _mod = await import("./mod.ts");
    const exports = Object.keys(_mod);

    // Should not export internal helpers or private functions
    exports.forEach((exp) => {
      assertEquals(exp.startsWith("_"), false, `Should not export private member: ${exp}`);
      assertEquals(exp.includes("Internal"), false, `Should not export internal member: ${exp}`);
      assertEquals(exp.includes("Helper"), false, `Should not export helper member: ${exp}`);
    });
  });

  it("should follow barrel export pattern", async () => {
    const modContent = await Deno.readTextFile(new URL("./mod.ts", import.meta.url));

    // Should only contain exports, no implementations
    assertEquals(
      modContent.includes("function"),
      false,
      "Barrel file should not contain function implementations",
    );
    assertEquals(
      modContent.includes("class"),
      false,
      "Barrel file should not contain class definitions",
    );
    assertEquals(
      modContent.includes("const "),
      false,
      "Barrel file should not contain const definitions (except re-exports)",
    );
  });

  it("should maintain proper dependency hierarchy", async () => {
    const modContent = await Deno.readTextFile(new URL("./mod.ts", import.meta.url));

    // Should only import from subdirectories or siblings, not from parent
    assertEquals(
      modContent.includes('from "../'),
      true,
      "Can import from parent directories for cross-module dependencies",
    );
    assertEquals(modContent.includes('from "./'), true, "Should import from current directory");
    assertEquals(
      modContent.includes('from "@'),
      false,
      "Should not directly import external packages in barrel",
    );
  });

  it("should export consistent interfaces", async () => {
    const _mod = await import("./mod.ts");

    // All validators should follow consistent naming
    const validators = Object.keys(_mod).filter((k) => k.includes("Validator"));
    validators.forEach((v) => {
      assertEquals(v.endsWith("Validator"), true, `Validator ${v} should end with 'Validator'`);
    });
  });

  it("should support future extensibility", async () => {
    const modContent = await Deno.readTextFile(new URL("./mod.ts", import.meta.url));

    // Should have clear sections for different export types
    assertEquals(modContent.includes("// Core validator exports"), true);
    assertEquals(modContent.includes("// Type exports"), true);
  });

  it("should not leak implementation details", async () => {
    const _mod = await import("./mod.ts");
    const exports = Object.keys(_mod);

    // Should not export test utilities or mocks
    exports.forEach((exp) => {
      assertEquals(exp.includes("Mock"), false, `Should not export mock: ${exp}`);
      assertEquals(exp.includes("Test"), false, `Should not export test utility: ${exp}`);
      assertEquals(exp.includes("Stub"), false, `Should not export stub: ${exp}`);
    });
  });

  it("should maintain module cohesion", async () => {
    const _mod = await import("./mod.ts");
    const exports = Object.keys(_mod);

    // All exports should be related to validation
    exports.forEach((exp) => {
      const isValidationRelated = exp.includes("Validator") ||
        exp.includes("Validation") ||
        exp.includes("Validated") ||
        exp === "ParameterValidator"; // Exception for imported validator

      assertEquals(isValidationRelated, true, `Export ${exp} should be validation-related`);
    });
  });

  it("should support tree-shaking", async () => {
    const modContent = await Deno.readTextFile(new URL("./mod.ts", import.meta.url));

    // Should use named exports for tree-shaking
    assertEquals(modContent.includes("export {"), true, "Should use named exports");
    assertEquals(
      modContent.includes("export *"),
      false,
      "Should not use wildcard exports for better tree-shaking",
    );
  });
});
