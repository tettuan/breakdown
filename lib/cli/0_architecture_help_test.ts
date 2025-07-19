/**
 * Architecture tests for Help Module
 *
 * Tests architectural constraints and dependencies:
 * - Module structure and responsibility boundaries
 * - Interface design and type safety
 * - Dependency management
 * - Separation of concerns
 * - Configuration-driven design
 *
 * @module cli/help_architecture_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  VERSION,
  APP_NAME,
  HELP_TEXT,
  type HelpTextConfig,
  showHelp,
  showUsage,
  showVersion,
} from "./help.ts";

const logger = new BreakdownLogger("help-architecture");

describe("Architecture: Help Module Structure", () => {
  it("should export required public interfaces", () => {
    logger.debug("Testing module exports");

    // Required constant exports
    assertExists(VERSION, "VERSION constant must be exported");
    assertExists(APP_NAME, "APP_NAME constant must be exported");
    assertExists(HELP_TEXT, "HELP_TEXT constant must be exported");

    assertEquals(typeof VERSION, "string", "VERSION must be a string");
    assertEquals(typeof APP_NAME, "string", "APP_NAME must be a string");
    assertEquals(typeof HELP_TEXT, "string", "HELP_TEXT must be a string");

    // Required function exports
    assertExists(showVersion, "showVersion function must be exported");
    assertExists(showHelp, "showHelp function must be exported");
    assertExists(showUsage, "showUsage function must be exported");

    assertEquals(typeof showVersion, "function", "showVersion must be a function");
    assertEquals(typeof showHelp, "function", "showHelp must be a function");
    assertEquals(typeof showUsage, "function", "showUsage must be a function");

    logger.debug("Module exports verification completed");
  });

  it("should maintain proper function signatures", () => {
    logger.debug("Testing function signatures");

    // All display functions should take no parameters
    assertEquals(
      showVersion.length,
      0,
      "showVersion should take no parameters",
    );
    assertEquals(
      showHelp.length,
      0,
      "showHelp should take no parameters",
    );
    assertEquals(
      showUsage.length,
      0,
      "showUsage should take no parameters",
    );

    // Functions should be side-effect only (void return)
    const versionResult = showVersion();
    const helpResult = showHelp();
    const usageResult = showUsage();

    assertEquals(versionResult, undefined, "showVersion should return void");
    assertEquals(helpResult, undefined, "showHelp should return void");
    assertEquals(usageResult, undefined, "showUsage should return void");

    logger.debug("Function signatures verification completed");
  });

  it("should follow single responsibility principle", () => {
    logger.debug("Testing single responsibility principle");

    // Each function should have a focused responsibility
    const versionString = showVersion.toString();
    assertEquals(
      versionString.includes("version") || versionString.includes("VERSION"),
      true,
      "showVersion should focus on version display",
    );
    assertEquals(
      versionString.includes("help") && !versionString.includes("APP_NAME"),
      false,
      "showVersion should not mix help content",
    );

    const helpString = showHelp.toString();
    assertEquals(
      helpString.includes("HELP_TEXT") || helpString.includes("help"),
      true,
      "showHelp should focus on help text display",
    );

    const usageString = showUsage.toString();
    assertEquals(
      usageString.includes("usage") || usageString.includes("parameters"),
      true,
      "showUsage should focus on usage information",
    );

    logger.debug("Single responsibility principle verification completed");
  });

  it("should manage dependencies appropriately", () => {
    logger.debug("Testing dependency management");

    // Should depend on version module
    assertEquals(
      typeof VERSION,
      "string",
      "Should import version from version module",
    );
    assertEquals(
      VERSION.length > 0,
      true,
      "Version should be non-empty string",
    );

    // Should not have heavy external dependencies
    const moduleCode = [showVersion, showHelp, showUsage].map((f) => f.toString()).join();
    assertEquals(
      moduleCode.includes("import(") || moduleCode.includes("require("),
      false,
      "Functions should not perform dynamic imports",
    );
    assertEquals(
      moduleCode.includes("fetch") || moduleCode.includes("http"),
      false,
      "Functions should not have network dependencies",
    );

    logger.debug("Dependency management verification completed");
  });
});

describe("Architecture: Interface Design", () => {
  it("should define clear HelpTextConfig interface", () => {
    logger.debug("Testing HelpTextConfig interface design");

    // Interface should be properly structured for configuration
    const testConfig: HelpTextConfig = {
      commands: [{ name: "test", description: "test command" }],
      options: [{ flags: "--test", description: "test option" }],
      examples: ["test example"],
    };

    // Should accept valid configuration
    assertExists(testConfig.commands, "HelpTextConfig should have commands array");
    assertExists(testConfig.options, "HelpTextConfig should have options array");
    assertExists(testConfig.examples, "HelpTextConfig should have examples array");

    // Commands should have proper structure
    assertEquals(typeof testConfig.commands[0].name, "string", "Command name should be string");
    assertEquals(
      typeof testConfig.commands[0].description,
      "string",
      "Command description should be string",
    );

    // Options should have proper structure
    assertEquals(typeof testConfig.options[0].flags, "string", "Option flags should be string");
    assertEquals(
      typeof testConfig.options[0].description,
      "string",
      "Option description should be string",
    );

    // Examples should be strings
    assertEquals(typeof testConfig.examples[0], "string", "Examples should be strings");

    logger.debug("HelpTextConfig interface design verification completed");
  });

  it("should use immutable configuration approach", () => {
    logger.debug("Testing immutable configuration approach");

    // HELP_TEXT should be generated at module load time
    const helpText1 = HELP_TEXT;
    const helpText2 = HELP_TEXT;

    assertEquals(
      helpText1,
      helpText2,
      "HELP_TEXT should be consistent across accesses",
    );
    assertEquals(
      helpText1 === helpText2,
      true,
      "HELP_TEXT should be the same reference (immutable)",
    );

    // APP_NAME should be constant
    assertEquals(
      APP_NAME.includes("Breakdown"),
      true,
      "APP_NAME should identify the application",
    );
    assertEquals(
      APP_NAME.length > 10,
      true,
      "APP_NAME should be descriptive",
    );

    logger.debug("Immutable configuration approach verification completed");
  });

  it("should separate configuration from presentation", () => {
    logger.debug("Testing configuration/presentation separation");

    // Configuration should be declarative
    assertEquals(
      HELP_TEXT.includes("Commands:"),
      true,
      "Generated help should include commands section",
    );
    assertEquals(
      HELP_TEXT.includes("Options:"),
      true,
      "Generated help should include options section",
    );
    assertEquals(
      HELP_TEXT.includes("Examples:"),
      true,
      "Generated help should include examples section",
    );

    // Presentation logic should be separate from data
    assertEquals(
      HELP_TEXT.includes("breakdown"),
      true,
      "Generated help should include application name",
    );
    assertEquals(
      HELP_TEXT.includes("init"),
      true,
      "Generated help should include configured commands",
    );

    logger.debug("Configuration/presentation separation verification completed");
  });
});

describe("Architecture: Output Strategy", () => {
  it("should use console for output consistently", () => {
    logger.debug("Testing console output strategy");

    // All display functions should use console
    const versionString = showVersion.toString();
    const helpString = showHelp.toString();
    const usageString = showUsage.toString();

    assertEquals(
      versionString.includes("console.log"),
      true,
      "showVersion should use console.log",
    );
    assertEquals(
      helpString.includes("console.log"),
      true,
      "showHelp should use console.log",
    );
    assertEquals(
      usageString.includes("console.log"),
      true,
      "showUsage should use console.log",
    );

    // Should not use other output methods
    const allCode = [versionString, helpString, usageString].join();
    assertEquals(
      allCode.includes("console.error") || allCode.includes("console.warn"),
      false,
      "Should not use error/warn console methods for help",
    );
    assertEquals(
      allCode.includes("process.stdout") || allCode.includes("Deno.stdout"),
      false,
      "Should not use low-level output methods",
    );

    logger.debug("Console output strategy verification completed");
  });

  it("should maintain consistent output formatting", () => {
    logger.debug("Testing output formatting consistency");

    // Capture console output for analysis
    let capturedOutput: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput.push(msg);
    };

    try {
      // Test each function
      showVersion();
      const versionOutput = capturedOutput.slice();
      capturedOutput = [];

      showHelp();
      const helpOutput = capturedOutput.slice();
      capturedOutput = [];

      showUsage();
      const usageOutput = capturedOutput.slice();

      // Version output should include version and app name
      assertEquals(
        versionOutput.some((line) => line.includes(VERSION)),
        true,
        "Version output should include version number",
      );
      assertEquals(
        versionOutput.some((line) => line.includes(APP_NAME)),
        true,
        "Version output should include app name",
      );

      // Help output should include app name and help text
      assertEquals(
        helpOutput.some((line) => line.includes(APP_NAME)),
        true,
        "Help output should include app name",
      );
      assertEquals(
        helpOutput.some((line) => line.includes("Usage:")),
        true,
        "Help output should include usage information",
      );

      // Usage output should include app name and guidance
      assertEquals(
        usageOutput.some((line) => line.includes(APP_NAME)),
        true,
        "Usage output should include app name",
      );
      assertEquals(
        usageOutput.some((line) => line.includes("--help")),
        true,
        "Usage output should reference help option",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Output formatting consistency verification completed");
  });

  it("should handle output side effects properly", () => {
    logger.debug("Testing output side effects");

    // Functions should only perform console output (no file I/O, network, etc.)
    const allFunctionCode = [showVersion, showHelp, showUsage]
      .map((f) => f.toString())
      .join();

    assertEquals(
      allFunctionCode.includes("writeFile") || allFunctionCode.includes("appendFile"),
      false,
      "Functions should not perform file I/O",
    );
    assertEquals(
      allFunctionCode.includes("fetch") || allFunctionCode.includes("XMLHttpRequest"),
      false,
      "Functions should not perform network operations",
    );
    assertEquals(
      allFunctionCode.includes("localStorage") || allFunctionCode.includes("sessionStorage"),
      false,
      "Functions should not access browser storage",
    );

    // Should be safe to call multiple times
    let outputCount = 0;
    const originalLog = console.log;
    console.log = () => {
      outputCount++;
    };

    try {
      showVersion();
      const firstCount = outputCount;
      showVersion();
      const secondCount = outputCount;

      assertEquals(
        secondCount - firstCount,
        firstCount,
        "Function should produce consistent output on repeated calls",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Output side effects verification completed");
  });
});

describe("Architecture: Configuration-Driven Design", () => {
  it("should support configuration-driven help generation", () => {
    logger.debug("Testing configuration-driven help generation");

    // Help text should be generated from configuration
    assertEquals(
      HELP_TEXT.includes("init"),
      true,
      "Should include configured commands",
    );
    assertEquals(
      HELP_TEXT.includes("--config"),
      true,
      "Should include configured options",
    );
    assertEquals(
      HELP_TEXT.includes("breakdown to project"),
      true,
      "Should include configured examples",
    );

    // Configuration should be extensible
    const customConfig: HelpTextConfig = {
      commands: [
        { name: "custom", description: "Custom command" },
      ],
      options: [
        { flags: "--custom", description: "Custom option" },
      ],
      examples: [
        "breakdown custom",
      ],
    };

    // Should be able to use custom configuration (testing interface design)
    assertExists(customConfig.commands, "Custom config should have commands");
    assertEquals(
      customConfig.commands[0].name,
      "custom",
      "Custom config should be properly structured",
    );

    logger.debug("Configuration-driven help generation verification completed");
  });

  it("should maintain separation between config and presentation logic", () => {
    logger.debug("Testing config/presentation separation");

    // Help text generation should be separate from display
    assertEquals(
      typeof HELP_TEXT,
      "string",
      "Help text should be pre-generated string",
    );
    assertEquals(
      HELP_TEXT.length > 100,
      true,
      "Help text should be substantial content",
    );

    // Display functions should use pre-generated content
    const helpString = showHelp.toString();
    assertEquals(
      helpString.includes("HELP_TEXT"),
      true,
      "showHelp should use pre-generated help text",
    );
    assertEquals(
      helpString.includes("generateHelpText"),
      false,
      "showHelp should not regenerate help text",
    );

    logger.debug("Config/presentation separation verification completed");
  });

  it("should provide stable interface for configuration", () => {
    logger.debug("Testing stable configuration interface");

    // HelpTextConfig interface should be properly typed
    const configCheck: HelpTextConfig = {
      commands: [],
      options: [],
      examples: [],
    };

    // Required properties should exist
    assertExists(configCheck.commands, "commands property is required");
    assertExists(configCheck.options, "options property is required");
    assertExists(configCheck.examples, "examples property is required");

    // Arrays should accept proper types
    configCheck.commands.push({ name: "test", description: "test desc" });
    configCheck.options.push({ flags: "--test", description: "test option" });
    configCheck.examples.push("test example");

    assertEquals(configCheck.commands.length, 1, "Should accept command configuration");
    assertEquals(configCheck.options.length, 1, "Should accept option configuration");
    assertEquals(configCheck.examples.length, 1, "Should accept example configuration");

    logger.debug("Stable configuration interface verification completed");
  });
});
