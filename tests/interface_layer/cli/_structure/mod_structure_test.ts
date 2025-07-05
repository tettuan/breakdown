/**
 * Structure tests for validators module barrel export
 *
 * These tests verify that the module follows structural patterns
 * and maintains proper organization.
 *
 * @module cli/validators/tests/1_structure_mod_test
 */

import { assertEquals, assertExists } from "../../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";

describe("Validators Module - Structure", () => {
  it("should follow single responsibility principle", async () => {
    const _mod = await import("../../../../lib/cli/validators/mod.ts");
    const exports = Object.keys(_mod);

    // All exports should be focused on validation
    exports.forEach((exp) => {
      const isValidationFocused = exp.toLowerCase().includes("validat") ||
        exp.toLowerCase().includes("parameter");
      assertEquals(isValidationFocused, true, `Export ${exp} should be validation-focused`);
    });
  });

  it("should organize exports by category", async () => {
    const modContent = await Deno.readTextFile(new URL("../../../../lib/cli/validators/mod.ts", import.meta.url));

    // Should have clear category sections
    const hasCategories = modContent.includes("// Core validator exports") &&
      modContent.includes("// Type exports");

    assertEquals(hasCategories, true, "Should organize exports by category with comments");
  });

  it("should maintain proper abstraction level", async () => {
    const _mod = await import("../../../../lib/cli/validators/mod.ts");

    // Should export high-level validators, not low-level utilities
    assertExists(_mod.TwoParamsValidator, "Should export main validator");
    assertExists(_mod.ParameterValidator, "Should export parameter validator");

    // Should not export low-level helpers
    const exports = Object.keys(_mod);
    exports.forEach((exp) => {
      assertEquals(exp.includes("Helper"), false, `Should not export low-level helper: ${exp}`);
      assertEquals(exp.includes("Util"), false, `Should not export utility: ${exp}`);
    });
  });

  it("should provide clear public API", async () => {
    const _mod = await import("../../../../lib/cli/validators/mod.ts");

    // Main validators should be classes
    assertEquals(
      typeof _mod.TwoParamsValidator,
      "function",
      "TwoParamsValidator should be a class/function",
    );
    assertEquals(
      typeof _mod.ParameterValidator,
      "function",
      "ParameterValidator should be a class/function",
    );
  });

  it("should export necessary types", async () => {
    const modContent = await Deno.readTextFile(new URL("../../../../lib/cli/validators/mod.ts", import.meta.url));

    // Should export validation-related types
    assertEquals(
      modContent.includes("ValidationError"),
      true,
      "Should export ValidationError type",
    );
    assertEquals(
      modContent.includes("ValidatedParams"),
      true,
      "Should export ValidatedParams type",
    );
  });

  it("should maintain exports cohesion", async () => {
    const modContent = await Deno.readTextFile(new URL("../../../../lib/cli/validators/mod.ts", import.meta.url));

    // All exports should come from validator modules
    const exportLines = modContent.split("\n").filter((line) => line.includes("export"));
    exportLines.forEach((line) => {
      if (line.includes("from")) {
        const isValidatorModule = line.includes("validator") ||
          line.includes("validation");
        assertEquals(
          isValidatorModule,
          true,
          `Export should be from validator module: ${line.trim()}`,
        );
      }
    });
  });

  it("should minimize coupling", async () => {
    const modContent = await Deno.readTextFile(new URL("../../../../lib/cli/validators/mod.ts", import.meta.url));

    // Should not import from too many different modules
    const fromStatements = modContent.match(/from\s+"[^"]+"/g) || [];
    const uniqueImports = new Set(fromStatements);

    assertEquals(
      uniqueImports.size <= 3,
      true,
      `Should minimize imports, found ${uniqueImports.size} different imports`,
    );
  });

  it("should have clear boundaries", async () => {
    const _mod = await import("../../../../lib/cli/validators/mod.ts");
    const exports = Object.keys(_mod);

    // Should not mix validators with other concerns
    exports.forEach((exp) => {
      const isValidatorConcern = exp.includes("Validator") ||
        exp.includes("Validation") ||
        exp.includes("Validated") ||
        exp.includes("Parameter");
      assertEquals(isValidatorConcern, true, `Export ${exp} should be validator-related`);
    });
  });

  it("should follow composition over inheritance", async () => {
    const modContent = await Deno.readTextFile(new URL("../../../../lib/cli/validators/mod.ts", import.meta.url));

    // Should not export abstract classes or base classes
    assertEquals(modContent.includes("Abstract"), false, "Should not export abstract classes");
    assertEquals(modContent.includes("Base"), false, "Should not export base classes");
  });

  it("should be extensible without modification", async () => {
    const modContent = await Deno.readTextFile(new URL("../../../../lib/cli/validators/mod.ts", import.meta.url));

    // Should have clear sections where new exports can be added
    const lines = modContent.split("\n");
    const sectionComments = lines.filter((line) => line.trim().startsWith("//"));

    assertEquals(
      sectionComments.length >= 2,
      true,
      "Should have section comments for extensibility",
    );
  });
});
