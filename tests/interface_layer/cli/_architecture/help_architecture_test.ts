/**
 * @fileoverview Architecture Test for Help Module
 *
 * Validates architectural constraints and dependency relationships
 * for the help module following Totality principle.
 *
 * Key architectural validations:
 * - Dependency direction and boundaries
 * - No circular dependencies
 * - Proper layer separation
 * - External dependency management
 *
 * @module cli/0_architecture_help_test
 */

import { assertEquals, assertExists } from "@std/assert";

/**
 * Architecture Test Suite: Help Module
 *
 * These tests verify architectural principles:
 * 1. Proper dependency direction (inward only)
 * 2. No circular dependencies
 * 3. Appropriate external dependencies
 * 4. Clear module boundaries
 * 5. Proper abstraction layers
 */
Deno.test("Help Module Architecture", async (t) => {
  await t.step("has minimal and appropriate dependencies", async () => {
    const _helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Should only depend on version module
    const importMatches = _helpContent.match(/import.*from/g) || [];
    assertEquals(importMatches.length, 1, "Should have exactly one import");

    // Verify the only dependency is version.ts
    assertEquals(
      _helpContent.includes('from "../version.ts"'),
      true,
      "Should only import from version.ts",
    );

    // Should not depend on other CLI modules
    assertEquals(
      _helpContent.includes('from "./'),
      false,
      "Should not import from sibling modules",
    );
    assertEquals(_helpContent.includes('from "../params'), false, "Should not depend on params");
    assertEquals(_helpContent.includes('from "../config'), false, "Should not depend on config");
    assertEquals(_helpContent.includes('from "../prompt'), false, "Should not depend on prompt");
  });

  await t.step("maintains proper dependency direction", async () => {
    const helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Should not import from deeper layers
    assertEquals(
      helpContent.includes('from "../../'),
      false,
      "Should not import from parent directories",
    );
    assertEquals(
      helpContent.includes('from "../factory'),
      false,
      "Should not depend on factory layer",
    );
    assertEquals(
      helpContent.includes('from "../types'),
      false,
      "Should not depend on types directly",
    );

    // Should only export, not re-export complex types
    const exportCount = (helpContent.match(/export/g) || []).length;
    const functionExports = (helpContent.match(/export function/g) || []).length;
    const interfaceExports = (helpContent.match(/export interface/g) || []).length;
    const constExports = (helpContent.match(/export const/g) || []).length;
    const reExports = (helpContent.match(/export \{.*\} from/g) || []).length;

    // All exports should be explicit declarations or simple re-exports
    assertEquals(
      exportCount,
      functionExports + interfaceExports + constExports + reExports + 1, // +1 for export { VERSION }
      "All exports should be accounted for",
    );
  });

  await t.step("defines clear module boundaries", async () => {
    const { showHelp, showVersion, showUsage, HELP_TEXT, _VERSION, APP_NAME, ...otherExports } =
      await import("./help.ts");

    // Should export specific help-related functionality
    assertExists(showHelp, "Should export showHelp function");
    assertExists(showVersion, "Should export showVersion function");
    assertExists(showUsage, "Should export showUsage function");
    assertExists(HELP_TEXT, "Should export HELP_TEXT constant");
    assertExists(_VERSION, "Should export _VERSION");
    assertExists(APP_NAME, "Should export APP_NAME");
    // Note: TypeScript interfaces are not available at runtime, so we can't check HelpTextConfig

    // Should not export internal implementation
    assertEquals(
      (otherExports as any).generateHelpText,
      undefined,
      "Should not export internal generateHelpText",
    );
    assertEquals(
      (otherExports as any).DEFAULT_HELP_CONFIG,
      undefined,
      "Should not export internal config",
    );
  });

  await t.step("follows single responsibility principle", async () => {
    const helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Module should only contain help-related functionality
    const functionMatches = helpContent.match(/function\s+\w+/g) || [];
    const helpRelatedFunctions = functionMatches.filter((fn) =>
      fn.includes("show") || fn.includes("generate") || fn.includes("Help")
    );

    assertEquals(
      functionMatches.length,
      helpRelatedFunctions.length,
      "All functions should be help-related",
    );

    // Should not contain business logic
    assertEquals(helpContent.includes("parse"), false, "Should not contain parsing logic");
    assertEquals(helpContent.includes("validate"), false, "Should not contain validation logic");
    assertEquals(helpContent.includes("process"), false, "Should not contain processing logic");
  });

  await t.step("maintains stateless architecture", async () => {
    const helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Should minimize mutable state (only in generateHelpText)
    const letMatches = helpContent.match(/let /g) || [];
    assertEquals(letMatches.length, 1, "Should use let only in generateHelpText for text building");
    assertEquals(helpContent.includes("this."), false, "Should not use class instances");
    assertEquals(helpContent.includes("class "), false, "Should not define classes");

    // All functions should be pure or have simple side effects (console.log)
    const functionBodies = helpContent.match(/function.*?\{[\s\S]*?\n\}/g) || [];
    for (const body of functionBodies) {
      const hasStateModification = body.includes("=") && !body.includes("const");
      assertEquals(hasStateModification, false, "Functions should not modify state");
    }
  });

  await t.step("uses appropriate abstraction level", async () => {
    const helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Should work at high level (user-facing messages)
    assertEquals(helpContent.includes("console.log"), true, "Should handle console output");

    // Should not work at low level
    assertEquals(helpContent.includes("Deno."), false, "Should not use Deno APIs directly");
    assertEquals(helpContent.includes("process."), false, "Should not use process APIs");
    assertEquals(helpContent.includes("fs."), false, "Should not use file system APIs");
    assertEquals(helpContent.includes("path."), false, "Should not use path APIs");
  });

  await t.step("follows consistent export patterns", async () => {
    const helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Check export patterns
    const namedExports = helpContent.match(/export\s+(?:const|function|interface)\s+(\w+)/g) || [];
    const reExports = helpContent.match(/export\s*\{[^}]+\}\s*from/g) || [];

    // Should use named exports consistently
    assertEquals(namedExports.length > 0, true, "Should use named exports");
    assertEquals(helpContent.includes("export default"), false, "Should not use default exports");

    // Re-exports should be minimal and clear
    assertEquals(reExports.length, 0, "Should minimize re-exports");
  });
});

/**
 * Dependency Graph Test
 *
 * Verifies the module's position in the dependency graph
 */
Deno.test("Help Module Dependency Graph", async (t) => {
  await t.step("is a leaf module with minimal dependencies", async () => {
    const helpContent = await Deno.readTextFile("./lib/cli/help.ts");

    // Count total dependencies
    const importStatements = helpContent.match(/import.*from\s+["'][^"']+["']/g) || [];
    assertEquals(importStatements.length, 1, "Should have exactly one dependency");

    // Verify it's a presentation layer module
    const hasUIOutput = helpContent.includes("console.log");
    const hasBusinessLogic = helpContent.includes("Result<") || helpContent.includes("Error");

    assertEquals(hasUIOutput, true, "Should handle UI output");
    assertEquals(hasBusinessLogic, false, "Should not contain business logic");
  });

  await t.step("can be safely imported by CLI entry points", async () => {
    // This module should be safe to import without side effects
    const helpModule = await import("./help.ts");
    assertExists(helpModule, "Should be importable");

    // Importing should not cause side effects
    // (No console output, no file operations, no network calls)
  });
});
