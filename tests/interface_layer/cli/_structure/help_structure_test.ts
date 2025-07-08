/**
 * @fileoverview Structure Test for Help Module
 *
 * Validates structural design and responsibility separation
 * for the help module following Totality principle.
 *
 * Key structural validations:
 * - Single responsibility per function
 * - Proper data structure design
 * - Clear separation of concerns
 * - Consistent abstraction levels
 *
 * @module cli/1_structure_help_test
 */

import { assertEquals, assertExists } from "../../../../lib/deps.ts";
import {
  _VERSION,
  APP_NAME,
  HELP_TEXT,
  type HelpTextConfig,
  showHelp,
  showUsage,
  showVersion,
} from "$lib/cli/help.ts";

/**
 * Structure Test Suite: Help Module
 *
 * These tests verify structural design principles:
 * 1. Single responsibility principle
 * 2. Proper encapsulation
 * 3. Clear separation of concerns
 * 4. Consistent abstraction levels
 * 5. Data structure coherence
 */
Deno.test("Help Module Structure", async (t) => {
  await t.step("maintains single responsibility per function", async () => {
    const _helpContent = await Deno.readTextFile(new URL("../../../../lib/cli/help.ts", import.meta.url));

    // Each function should have a single, clear purpose
    // const functionDefinitions = _helpContent.match(/export function (\w+)[^{]*\{([^}]+)\}/g) || [];

    // Check showVersion function
    const showVersionMatch = _helpContent.match(/export function showVersion[^{]*\{([\s\S]*?)\n\}/);
    assertExists(showVersionMatch);
    const showVersionBody = showVersionMatch[1];

    // Should only display version info
    assertEquals(showVersionBody.includes("console.log"), true);
    assertEquals(
      showVersionBody.includes("VERSION") || showVersionBody.includes("${VERSION}"),
      true,
    );
    assertEquals(showVersionBody.includes("APP_NAME"), true);
    const showVersionLines = showVersionBody.trim().split("\n").filter((l: string) =>
      l.trim()
    ).length;
    assertEquals(showVersionLines <= 4, true, "showVersion should be concise");

    // Check showHelp function
    const showHelpMatch = _helpContent.match(/export function showHelp[^{]*\{([\s\S]*?)\n\}/);
    assertExists(showHelpMatch);
    const showHelpBody = showHelpMatch[1];

    // Should only display help text
    assertEquals(showHelpBody.includes("console.log"), true);
    assertEquals(showHelpBody.includes("HELP_TEXT"), true);
    const showHelpLines = showHelpBody.trim().split("\n").filter((l: string) => l.trim()).length;
    assertEquals(showHelpLines <= 3, true, "showHelp should be concise");

    // Check showUsage function
    const showUsageMatch = _helpContent.match(/export function showUsage[^{]*\{([\s\S]*?)\n\}/);
    assertExists(showUsageMatch);
    const showUsageBody = showUsageMatch[1];

    // Should only display usage info
    assertEquals(showUsageBody.includes("console.log"), true);
    const showUsageLines = showUsageBody.trim().split("\n").filter((l: string) => l.trim()).length;
    assertEquals(showUsageLines <= 3, true, "showUsage should be concise");
  });

  await t.step("separates data from presentation logic", async () => {
    const _helpContent = await Deno.readTextFile(new URL("../../../../lib/cli/help.ts", import.meta.url));

    // Data should be defined separately from display logic
    assertEquals(
      _helpContent.includes("const DEFAULT_HELP_CONFIG"),
      true,
      "Should define help config data",
    );
    assertEquals(
      _helpContent.includes("function generateHelpText"),
      true,
      "Should have text generation function",
    );
    assertEquals(
      _helpContent.includes("export const HELP_TEXT"),
      true,
      "Should export generated text",
    );

    // Display functions should not contain data
    const displayFunctions = ["showHelp", "showVersion", "showUsage"];
    for (const fn of displayFunctions) {
      const fnMatch = _helpContent.match(new RegExp(`export function ${fn}[^{]*\{([^}]+)\}`));
      if (fnMatch) {
        const body = fnMatch[1];
        // Should not define complex data structures
        assertEquals(body.includes("commands:"), false, `${fn} should not define data`);
        assertEquals(body.includes("options:"), false, `${fn} should not define data`);
        assertEquals(body.includes("examples:"), false, `${fn} should not define data`);
      }
    }
  });

  await t.step("uses appropriate data structures", () => {
    // Test HelpTextConfig interface structure
    const config: HelpTextConfig = {
      commands: [{ name: "test", description: "Test command" }],
      options: [{ flags: "--test", description: "Test option" }],
      examples: ["test example"],
    };

    // Interface should be well-structured
    assertExists(config.commands);
    assertExists(config.options);
    assertExists(config.examples);

    // Arrays should contain appropriate types
    assertEquals(Array.isArray(config.commands), true);
    assertEquals(Array.isArray(config.options), true);
    assertEquals(Array.isArray(config.examples), true);

    // Command structure
    assertEquals(typeof config.commands[0].name, "string");
    assertEquals(typeof config.commands[0].description, "string");

    // Option structure
    assertEquals(typeof config.options[0].flags, "string");
    assertEquals(typeof config.options[0].description, "string");

    // Example structure
    assertEquals(typeof config.examples[0], "string");
  });

  await t.step("maintains proper encapsulation", async () => {
    const _helpContent = await Deno.readTextFile(new URL("../../../../lib/cli/help.ts", import.meta.url));

    // Internal functions should not be exported
    assertEquals(
      _helpContent.includes("export function generateHelpText"),
      false,
      "generateHelpText should be private",
    );

    // Internal data should not be exported
    assertEquals(
      _helpContent.includes("export const DEFAULT_HELP_CONFIG"),
      false,
      "DEFAULT_HELP_CONFIG should be private",
    );

    // Only public API should be exported
    const exports = _helpContent.match(/export (?:const|function|interface|type) (\w+)/g) || [];
    const publicAPI = [
      "showHelp",
      "showVersion",
      "showUsage",
      "HELP_TEXT",
      "APP_NAME",
      "_VERSION",
      "HelpTextConfig",
    ];

    for (const exp of exports) {
      const name = exp.split(" ").pop();
      assertEquals(
        publicAPI.includes(name!),
        true,
        `${name} should be part of public API`,
      );
    }
  });

  await t.step("follows composition pattern", async () => {
    const _helpContent = await Deno.readTextFile(new URL("../../../../lib/cli/help.ts", import.meta.url));

    // generateHelpText should compose from configuration
    const generateMatch = _helpContent.match(/function generateHelpText[\s\S]*?\n\}/);
    assertExists(generateMatch);

    // Should use configuration object
    assertEquals(_helpContent.includes("config: HelpTextConfig"), true);
    assertEquals(_helpContent.includes("DEFAULT_HELP_CONFIG"), true);

    // Should compose text from parts
    assertEquals(_helpContent.includes("Commands:"), true);
    assertEquals(_helpContent.includes("Options:"), true);
    assertEquals(_helpContent.includes("Examples:"), true);
  });

  await t.step("maintains consistent abstraction level", () => {
    // All exported functions should operate at the same abstraction level

    // High-level display functions
    assertEquals(typeof showHelp, "function");
    assertEquals(typeof showVersion, "function");
    assertEquals(typeof showUsage, "function");

    // These should all be void functions (side effects only)
    assertEquals(showHelp(), undefined);
    assertEquals(showVersion(), undefined);
    assertEquals(showUsage(), undefined);

    // Constants should be at appropriate level
    assertEquals(typeof HELP_TEXT, "string");
    assertEquals(typeof APP_NAME, "string");
    assertEquals(typeof _VERSION, "string");
  });

  await t.step("provides clear and focused public API", async () => {
    const { showHelp, showVersion, showUsage, HELP_TEXT, APP_NAME, _VERSION, ...otherExports } =
      await import("../../../../lib/cli/help.ts");

    // Verify main exports exist
    assertExists(showHelp);
    assertExists(showVersion);
    assertExists(showUsage);
    assertExists(HELP_TEXT);
    assertExists(APP_NAME);
    assertExists(_VERSION);

    // Count exported items (HelpTextConfig is a type, not available at runtime)
    const exportedKeys = Object.keys({
      showHelp,
      showVersion,
      showUsage,
      HELP_TEXT,
      APP_NAME,
      _VERSION,
      ...otherExports,
    });
    assertEquals(exportedKeys.length, 6, "Should have exactly 6 runtime exports");

    // Verify each export serves a clear purpose
    const purposes = {
      showHelp: "Display full help text",
      showVersion: "Display version information",
      showUsage: "Display minimal usage hint",
      HELP_TEXT: "Pre-generated help text",
      APP_NAME: "Application name constant",
      _VERSION: "Version number",
    };

    for (const key of exportedKeys) {
      assertExists(purposes[key as keyof typeof purposes], `${key} should have clear purpose`);
    }
  });

  await t.step("uses functional programming principles", async () => {
    const _helpContent = await Deno.readTextFile(new URL("../../../../lib/cli/help.ts", import.meta.url));

    // Should not use classes
    assertEquals(_helpContent.includes("class "), false, "Should not use classes");

    // Should not use this keyword
    assertEquals(_helpContent.includes("this."), false, "Should not use this");

    // Should use const for immutability
    const constCount = (_helpContent.match(/const /g) || []).length;
    const letCount = (_helpContent.match(/let /g) || []).length;
    assertEquals(letCount, 1, "Should minimize mutable variables"); // Only 'let text' in generateHelpText
    assertEquals(constCount > letCount, true, "Should prefer const over let");
  });

  await t.step("separates configuration from implementation", async () => {
    const _helpContent = await Deno.readTextFile(new URL("../../../../lib/cli/help.ts", import.meta.url));

    // Configuration should be separate from logic
    const configMatch = _helpContent.match(/const DEFAULT_HELP_CONFIG[^}]+\}/s);
    assertExists(configMatch);

    // Config should be pure data
    const configString = configMatch[0];
    assertEquals(configString.includes("function"), false, "Config should not contain functions");
    assertEquals(configString.includes("=>"), false, "Config should not contain arrow functions");

    // Implementation should use configuration
    assertEquals(_helpContent.includes("config: HelpTextConfig = DEFAULT_HELP_CONFIG"), true);
  });
});

/**
 * Output Consistency Test
 *
 * Verifies that the module produces consistent, well-structured output
 */
Deno.test("Help Module Output Structure", async (t) => {
  await t.step("generates well-structured help text", () => {
    assertExists(HELP_TEXT);

    // Should contain all sections
    assertEquals(HELP_TEXT.includes("Usage:"), true);
    assertEquals(HELP_TEXT.includes("Commands:"), true);
    assertEquals(HELP_TEXT.includes("Options:"), true);
    assertEquals(HELP_TEXT.includes("Examples:"), true);

    // Should be properly formatted
    const lines = HELP_TEXT.split("\n");

    // Should have consistent indentation
    const commandLines = lines.filter((l) => l.includes("init") || l.includes("to <type>"));
    for (const line of commandLines) {
      assertEquals(line.startsWith("  "), true, "Command lines should be indented");
    }

    // Should have aligned descriptions
    const optionLines = lines.filter((l) => l.includes("--"));
    for (const line of optionLines) {
      assertEquals(line.startsWith("  "), true, "Option lines should be indented");
    }
  });

  await t.step("maintains output format consistency", () => {
    // All output functions should follow similar patterns
    const originalLog = console.log;
    let outputs: string[] = [];

    // Mock console.log
    console.log = (...args: any[]) => {
      outputs.push(args.join(" "));
    };

    try {
      // Test each output function
      outputs = [];
      showVersion();
      assertEquals(outputs.length >= 2, true, "showVersion should output at least 2 lines");
      assertEquals(outputs.some((o) => o.includes("Breakdown")), true);
      assertEquals(outputs.some((o) => o.includes(_VERSION)), true);

      outputs = [];
      showHelp();
      assertEquals(outputs.length >= 2, true, "showHelp should output at least 2 lines");
      assertEquals(outputs[0], APP_NAME, "showHelp should start with app name");

      outputs = [];
      showUsage();
      assertEquals(outputs.length >= 2, true, "showUsage should output at least 2 lines");
      assertEquals(outputs[0], APP_NAME, "showUsage should start with app name");
    } finally {
      // Restore console.log
      console.log = originalLog;
    }
  });
});
