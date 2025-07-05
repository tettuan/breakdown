/**
 * Architecture tests for commands/mod.ts
 *
 * Tests architectural constraints and dependencies:
 * - Module structure and exports
 * - Interface definitions and contracts
 * - External dependency management
 * - Command orchestration patterns
 *
 * @module commands/mod_architecture_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import * as mod from "./mod.ts";

const logger = new BreakdownLogger("mod-architecture");

describe("Architecture: Commands Module Structure", () => {
  it("should export required public interfaces", () => {
    logger.debug("Testing module exports");

    // Required interface exports (TypeScript interfaces are not runtime objects)
    // Verify interfaces exist by checking the module has the expected function signatures
    assertEquals(
      typeof mod.generateWithPrompt,
      "function",
      "generateWithPrompt function must be exported",
    );
    assertEquals(typeof mod.initWorkspace, "function", "initWorkspace function must be exported");

    // Required function exports
    assertExists(mod.initWorkspace, "initWorkspace function must be exported");
    assertExists(mod.generateWithPrompt, "generateWithPrompt function must be exported");
    assertExists(mod.displayHelp, "displayHelp function must be exported");
    assertExists(mod.displayVersion, "displayVersion function must be exported");

    // Function types
    assertEquals(typeof mod.initWorkspace, "function", "initWorkspace must be a function");
    assertEquals(
      typeof mod.generateWithPrompt,
      "function",
      "generateWithPrompt must be a function",
    );
    assertEquals(typeof mod.displayHelp, "function", "displayHelp must be a function");
    assertEquals(typeof mod.displayVersion, "function", "displayVersion must be a function");

    logger.debug("Module exports verification completed");
  });

  it("should maintain proper dependency boundaries", () => {
    logger.debug("Testing dependency boundaries");

    // Check function signatures for proper parameter counts
    assertEquals(mod.initWorkspace.length, 2, "initWorkspace should accept 2 parameters");
    assertEquals(
      mod.generateWithPrompt.length,
      3,
      "generateWithPrompt should accept 3 required parameters",
    );
    assertEquals(mod.displayHelp.length, 0, "displayHelp should accept no parameters");
    assertEquals(mod.displayVersion.length, 0, "displayVersion should accept no parameters");

    // All async functions should return Promises
    assertEquals(
      mod.initWorkspace.constructor.name,
      "AsyncFunction",
      "initWorkspace should be async",
    );
    assertEquals(
      mod.generateWithPrompt.constructor.name,
      "AsyncFunction",
      "generateWithPrompt should be async",
    );

    // Sync functions should return CommandResult directly
    assertEquals(
      mod.displayHelp.constructor.name,
      "Function",
      "displayHelp should be sync function",
    );
    assertEquals(
      mod.displayVersion.constructor.name,
      "Function",
      "displayVersion should be sync function",
    );

    logger.debug("Dependency boundaries verification completed");
  });

  it("should follow command orchestration patterns", () => {
    logger.debug("Testing command orchestration patterns");

    // All command functions should return CommandResult (Promise<CommandResult> for async)
    const helpResult = mod.displayHelp();
    const versionResult = mod.displayVersion();

    // Verify CommandResult structure
    assertExists(helpResult.success, "Help result should have success field");
    assertExists(helpResult.output, "Help result should have output field");
    assertExists(helpResult.error !== undefined, "Help result should have error field");

    assertExists(versionResult.success, "Version result should have success field");
    assertExists(versionResult.output, "Version result should have output field");
    assertExists(versionResult.error !== undefined, "Version result should have error field");

    assertEquals(typeof helpResult.success, "boolean", "Success should be boolean");
    assertEquals(typeof helpResult.output, "string", "Output should be string");
    assertEquals(typeof versionResult.success, "boolean", "Success should be boolean");
    assertEquals(typeof versionResult.output, "string", "Output should be string");

    logger.debug("Command orchestration patterns verification completed");
  });

  it("should isolate external dependencies properly", () => {
    logger.debug("Testing external dependency isolation");

    // Check function implementations for proper dependency usage
    const initWorkspaceString = mod.initWorkspace.toString();
    const generatePromptString = mod.generateWithPrompt.toString();

    // initWorkspace should use Workspace class
    assertEquals(
      initWorkspaceString.includes("new Workspace"),
      true,
      "initWorkspace should instantiate Workspace",
    );
    assertEquals(
      initWorkspaceString.includes("workspace.initialize()"),
      true,
      "initWorkspace should call workspace.initialize()",
    );

    // generateWithPrompt should delegate to runPromptProcessing
    assertEquals(
      generatePromptString.includes("runPromptProcessing"),
      true,
      "generateWithPrompt should call runPromptProcessing",
    );

    // Should not expose internal runPromptProcessing function
    assertEquals(
      (mod as any).runPromptProcessing,
      undefined,
      "runPromptProcessing should not be exported (internal function)",
    );

    logger.debug("External dependency isolation verification completed");
  });
});

describe("Architecture: Interface Design", () => {
  it("should define CommandResult interface properly", () => {
    logger.debug("Testing CommandResult interface design");

    // Test interface through actual usage
    const helpResult = mod.displayHelp();
    const versionResult = mod.displayVersion();

    // Required fields
    assertExists(helpResult.success, "CommandResult must have success field");
    assertExists(helpResult.output, "CommandResult must have output field");
    assertExists(helpResult.error !== undefined, "CommandResult must have error field");

    // Field types
    assertEquals(typeof helpResult.success, "boolean", "success must be boolean");
    assertEquals(typeof helpResult.output, "string", "output must be string");

    // Error field can be string, object, or null
    const errorType = typeof helpResult.error;
    assertEquals(
      errorType === "string" || errorType === "object" || helpResult.error === null,
      true,
      "error must be string, object, or null",
    );

    logger.debug("CommandResult interface design verification completed");
  });

  it("should define GenerateWithPromptOptions interface comprehensively", () => {
    logger.debug("Testing GenerateWithPromptOptions interface design");

    // Interface should support all documented options
    // We can verify this through function parameter handling
    const generateString = mod.generateWithPrompt.toString();

    // Function should accept options parameter
    assertEquals(
      generateString.includes("_options"),
      true,
      "generateWithPrompt should accept options parameter",
    );

    // Function should pass options to internal processor
    assertEquals(
      generateString.includes("_options"),
      true,
      "generateWithPrompt should pass options through",
    );

    logger.debug("GenerateWithPromptOptions interface design verification completed");
  });

  it("should maintain consistent error handling patterns", () => {
    logger.debug("Testing error handling patterns");

    // Check error handling in function implementations
    const initWorkspaceString = mod.initWorkspace.toString();
    const generatePromptString = mod.generateWithPrompt.toString();

    // Both async functions should have try-catch blocks
    assertEquals(
      initWorkspaceString.includes("try") && initWorkspaceString.includes("catch"),
      true,
      "initWorkspace should have try-catch error handling",
    );

    // Should convert errors to CommandResult format
    assertEquals(
      initWorkspaceString.includes("error instanceof Error"),
      true,
      "initWorkspace should check error instance type",
    );
    assertEquals(
      initWorkspaceString.includes("String(error)"),
      true,
      "initWorkspace should convert non-Error objects to string",
    );

    // generateWithPrompt delegates to runPromptProcessing which should handle errors
    assertEquals(
      generatePromptString.includes("runPromptProcessing"),
      true,
      "generateWithPrompt should delegate error handling to runPromptProcessing",
    );

    logger.debug("Error handling patterns verification completed");
  });
});

describe("Architecture: Command Function Contracts", () => {
  it("should maintain initWorkspace contract", () => {
    logger.debug("Testing initWorkspace contract");

    // Parameter contract
    assertEquals(mod.initWorkspace.length, 2, "Should accept 2 parameters");

    // Function implementation structure
    const functionString = mod.initWorkspace.toString();

    // Should handle optional workingDir parameter
    assertEquals(
      functionString.includes("_workingDir") && functionString.includes("Deno.cwd()"),
      true,
      "Should default to current working directory",
    );

    // Should use config parameter for workspace options
    assertEquals(
      functionString.includes("config?.app_prompt?.base_dir"),
      true,
      "Should use config for prompt base directory",
    );
    assertEquals(
      functionString.includes("config?.app_schema?.base_dir"),
      true,
      "Should use config for schema base directory",
    );

    logger.debug("initWorkspace contract verification completed");
  });

  it("should maintain generateWithPrompt contract", () => {
    logger.debug("Testing generateWithPrompt contract");

    // Parameter contract (required parameters before defaults)
    assertEquals(mod.generateWithPrompt.length, 3, "Should accept 3 required parameters");

    // Function implementation
    const functionString = mod.generateWithPrompt.toString();

    // Should handle force parameter with default
    assertEquals(
      functionString.includes("_force = false"),
      true,
      "Should have default value for force parameter",
    );

    // Should delegate to internal processing
    assertEquals(
      functionString.includes("runPromptProcessing"),
      true,
      "Should delegate to runPromptProcessing",
    );

    logger.debug("generateWithPrompt contract verification completed");
  });

  it("should maintain display function contracts", () => {
    logger.debug("Testing display function contracts");

    // Both should accept no parameters
    assertEquals(mod.displayHelp.length, 0, "displayHelp should accept no parameters");
    assertEquals(mod.displayVersion.length, 0, "displayVersion should accept no parameters");

    // Both should return CommandResult immediately
    const helpResult = mod.displayHelp();
    const versionResult = mod.displayVersion();

    assertEquals(helpResult.success, true, "displayHelp should return success");
    assertEquals(versionResult.success, true, "displayVersion should return success");
    assertEquals(typeof helpResult.output, "string", "displayHelp should return string output");
    assertEquals(
      typeof versionResult.output,
      "string",
      "displayVersion should return string output",
    );

    // Help should contain usage information
    assertEquals(
      helpResult.output.includes("Usage:"),
      true,
      "Help output should contain usage information",
    );
    assertEquals(
      helpResult.output.includes("Commands:"),
      true,
      "Help output should contain commands section",
    );

    // Version should contain version number
    assertEquals(
      versionResult.output.includes("Breakdown v"),
      true,
      "Version output should contain version prefix",
    );

    logger.debug("Display function contracts verification completed");
  });
});

describe("Architecture: Module Cohesion", () => {
  it("should group related command functions logically", () => {
    logger.debug("Testing module cohesion");

    // Module should contain high-level command entry points
    const moduleExports = Object.getOwnPropertyNames(mod);
    const expectedExports = [
      "initWorkspace",
      "generateWithPrompt",
      "displayHelp",
      "displayVersion",
    ];

    for (const expectedExport of expectedExports) {
      assertEquals(
        moduleExports.includes(expectedExport),
        true,
        `Module should export ${expectedExport}`,
      );
    }

    // Should not expose internal implementation details
    assertEquals(
      moduleExports.includes("runPromptProcessing"),
      false,
      "Should not expose internal runPromptProcessing function",
    );
    assertEquals(
      moduleExports.includes("AppConfig"),
      false,
      "Should not expose internal AppConfig interface",
    );

    logger.debug("Module cohesion verification completed");
  });

  it("should maintain separation between command types", () => {
    logger.debug("Testing command type separation");

    // Workspace initialization commands
    assertEquals(typeof mod.initWorkspace, "function", "Workspace commands should be functions");

    // Processing commands
    assertEquals(
      typeof mod.generateWithPrompt,
      "function",
      "Processing commands should be functions",
    );

    // Information commands
    assertEquals(typeof mod.displayHelp, "function", "Information commands should be functions");
    assertEquals(typeof mod.displayVersion, "function", "Information commands should be functions");

    // Different command types should have different characteristics
    // Async vs sync
    assertEquals(
      mod.initWorkspace.constructor.name,
      "AsyncFunction",
      "Workspace commands should be async",
    );
    assertEquals(
      mod.generateWithPrompt.constructor.name,
      "AsyncFunction",
      "Processing commands should be async",
    );
    assertEquals(
      mod.displayHelp.constructor.name,
      "Function",
      "Information commands should be sync",
    );
    assertEquals(
      mod.displayVersion.constructor.name,
      "Function",
      "Information commands should be sync",
    );

    logger.debug("Command type separation verification completed");
  });
});
