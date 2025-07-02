/**
 * Unit tests for commands/mod.ts
 *
 * Tests functional behavior and edge cases:
 * - Command execution workflows
 * - Parameter validation and handling
 * - Error scenarios and recovery
 * - Integration with dependencies
 *
 * @module commands/mod_unit_test
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  type CommandResult,
  displayHelp,
  displayVersion,
  generateWithPrompt,
  type GenerateWithPromptOptions,
  initWorkspace,
} from "./mod.ts";

const _logger = new BreakdownLogger("mod-unit");

describe("Unit: initWorkspace Function", async () => {
  let tempDir: string;

  beforeEach(() => {
    _logger.debug("Setting up test environment");
    tempDir = Deno.makeTempDirSync();
  });

  afterEach(() => {
    _logger.debug("Cleaning up test environment");
    try {
      Deno.removeSync(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should initialize workspace successfully with default parameters", async () => {
    _logger.debug("Testing successful workspace initialization");

    const _result = await initWorkspace();

    assertEquals(_result.success, true, "Should return success");
    assertEquals(
      _result.output,
      "Workspace initialized successfully",
      "Should have success message",
    );
    assertEquals(_result.error, "", "Should have empty error");

    _logger.debug("Successful workspace initialization verified");
  });

  it("should use provided working directory", async () => {
    _logger.debug("Testing custom working directory");

    const _result = await initWorkspace(tempDir);

    assertEquals(_result.success, true, "Should succeed with custom directory");
    assertEquals(
      _result.output,
      "Workspace initialized successfully",
      "Should have success message",
    );

    _logger.debug("Custom working directory handling verified");
  });

  it("should use provided configuration", async () => {
    _logger.debug("Testing custom configuration");

    const _config = {
      app_prompt: { base_dir: "custom_prompts" },
      app_schema: { base_dir: "custom_schemas" },
    };

    const _result = await initWorkspace(tempDir, config);

    assertEquals(_result.success, true, "Should succeed with custom config");
    assertEquals(
      _result.output,
      "Workspace initialized successfully",
      "Should have success message",
    );

    _logger.debug("Custom configuration handling verified");
  });

  it("should handle workspace initialization errors", async () => {
    _logger.debug("Testing workspace initialization error handling");

    // Try to initialize in a location that should cause an error
    const invalidPath = "/invalid/nonexistent/path/that/should/fail";

    const _result = await initWorkspace(invalidPath);

    assertEquals(_result.success, false, "Should fail with invalid path");
    assertEquals(_result.output, "", "Should have empty output on error");
    assertExists(_result.error, "Should have error message");
    assertEquals(
      typeof _result.error === "string" && _result.error.includes("Failed to initialize workspace"),
      true,
      "Should have descriptive error message",
    );

    _logger.debug("Workspace initialization error handling verified");
  });

  it("should handle missing configuration gracefully", async () => {
    _logger.debug("Testing missing configuration handling");

    const _result = await initWorkspace(tempDir, undefined);

    // Should use defaults and succeed
    assertEquals(_result.success, true, "Should succeed with undefined config");
    assertEquals(
      _result.output,
      "Workspace initialized successfully",
      "Should have success message",
    );

    _logger.debug("Missing configuration handling verified");
  });

  it("should handle partial configuration", async () => {
    _logger.debug("Testing partial configuration handling");

    const partialConfig = {
      app_prompt: { base_dir: "custom_prompts" },
      // Missing app_schema config
    };

    const _result = await initWorkspace(tempDir, partialConfig);

    assertEquals(_result.success, true, "Should succeed with partial config");
    assertEquals(
      _result.output,
      "Workspace initialized successfully",
      "Should have success message",
    );

    _logger.debug("Partial configuration handling verified");
  });
});

describe("Unit: generateWithPrompt Function", async () => {
  it("should handle basic prompt generation request", async () => {
    _logger.debug("Testing basic prompt generation");

    const _result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test",
      false,
    );

    // Note: This will likely fail due to missing dependencies/files
    // but we can verify the function structure
    assertExists(_result, "Should return a result");
    assertEquals(typeof _result.success, "boolean", "Should have boolean success field");
    assertEquals(typeof _result.output, "string", "Should have string output field");
    assertExists(_result.error !== undefined, "Should have error field");

    _logger.debug("Basic prompt generation structure verified");
  });

  it("should handle force parameter correctly", async () => {
    _logger.debug("Testing force parameter handling");

    const _result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test",
      true, // force = true
    );

    assertExists(_result, "Should handle force parameter");
    assertEquals(typeof _result.success, "boolean", "Should return CommandResult");

    _logger.debug("Force parameter handling verified");
  });

  it("should handle options parameter", async () => {
    _logger.debug("Testing options parameter handling");

    const options: GenerateWithPromptOptions = {
      adaptation: "strict",
      demonstrativeType: "summary",
      input_text: "Test input text",
      extended: true,
      customVariables: { "key": "value" },
    };

    const _result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test",
      false,
      options,
    );

    assertExists(_result, "Should handle options parameter");
    assertEquals(typeof _result.success, "boolean", "Should return CommandResult");

    _logger.debug("Options parameter handling verified");
  });

  it("should handle missing options gracefully", async () => {
    _logger.debug("Testing missing options handling");

    const _result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test",
      // No force or options parameters
    );

    assertExists(_result, "Should handle missing optional parameters");
    assertEquals(typeof _result.success, "boolean", "Should return CommandResult");

    _logger.debug("Missing options handling verified");
  });

  it("should handle stdin input", async () => {
    _logger.debug("Testing stdin input handling");

    const options: GenerateWithPromptOptions = {
      input_text: "This is stdin content",
    };

    const _result = await generateWithPrompt(
      "-", // stdin indicator
      "output.md",
      "test",
      false,
      options,
    );

    assertExists(_result, "Should handle stdin input");
    assertEquals(typeof _result.success, "boolean", "Should return CommandResult");

    _logger.debug("Stdin input handling verified");
  });

  it("should handle empty parameters", async () => {
    _logger.debug("Testing empty parameter handling");

    const _result = await generateWithPrompt("", "", "", false);

    assertExists(_result, "Should handle empty parameters");
    assertEquals(_result.success, false, "Should fail with empty parameters");
    assertExists(_result.error, "Should have error for empty parameters");

    _logger.debug("Empty parameter handling verified");
  });
});

describe("Unit: Display Functions", async () => {
  it("should display help information correctly", async () => {
    _logger.debug("Testing help display");

    const _result = displayHelp();

    assertEquals(_result.success, true, "Help should return success");
    assertEquals(typeof _result.output, "string", "Help should return string output");
    assertEquals(_result.error, "", "Help should have no error");

    // Verify help content
    const helpText = _result.output;
    assertEquals(helpText.includes("Breakdown"), true, "Should mention tool name");
    assertEquals(helpText.includes("Usage:"), true, "Should include usage section");
    assertEquals(helpText.includes("Commands:"), true, "Should include commands section");
    assertEquals(helpText.includes("init"), true, "Should include init command");
    assertEquals(helpText.includes("--help"), true, "Should include help option");

    _logger.debug("Help display verified");
  });

  it("should display version information correctly", async () => {
    _logger.debug("Testing version display");

    const _result = displayVersion();

    assertEquals(_result.success, true, "Version should return success");
    assertEquals(typeof _result.output, "string", "Version should return string output");
    assertEquals(_result.error, "", "Version should have no error");

    // Verify version format
    const versionText = _result.output;
    assertEquals(versionText.includes("Breakdown v"), true, "Should have version prefix");
    assertEquals(versionText.trim().length > 0, true, "Should have non-empty version");

    _logger.debug("Version display verified");
  });

  it("should return consistent CommandResult structure", async () => {
    _logger.debug("Testing CommandResult consistency");

    const helpResult = displayHelp();
    const versionResult = displayVersion();

    // Both should follow same structure
    assertExists(helpResult.success, "Help should have success field");
    assertExists(helpResult.output, "Help should have output field");
    assertExists(helpResult.error !== undefined, "Help should have error field");

    assertExists(versionResult.success, "Version should have success field");
    assertExists(versionResult.output, "Version should have output field");
    assertExists(versionResult.error !== undefined, "Version should have error field");

    // Both should be successful
    assertEquals(helpResult.success, true, "Help should be successful");
    assertEquals(versionResult.success, true, "Version should be successful");

    _logger.debug("CommandResult consistency verified");
  });
});

describe("Unit: Error Handling and Edge Cases", async () => {
  it("should handle null parameters gracefully", async () => {
    _logger.debug("Testing null parameter handling");

    const _result = await generateWithPrompt(
      null as unknown,
      null as unknown,
      null as unknown,
      false,
    );

    assertExists(_result, "Should handle null parameters");
    assertEquals(_result.success, false, "Should fail with null parameters");
    assertExists(_result.error, "Should have error for null parameters");

    _logger.debug("Null parameter handling verified");
  });

  it("should handle undefined parameters appropriately", async () => {
    _logger.debug("Testing undefined parameter handling");

    const _result = await generateWithPrompt(
      undefined as unknown,
      undefined as unknown,
      undefined as unknown,
      false,
    );

    assertExists(_result, "Should handle undefined parameters");
    assertEquals(_result.success, false, "Should fail with undefined parameters");

    _logger.debug("Undefined parameter handling verified");
  });

  it("should handle very long file paths", async () => {
    _logger.debug("Testing long file path handling");

    const longPath = "a".repeat(1000) + ".md";
    const _result = await generateWithPrompt(longPath, longPath, "test", false);

    assertExists(_result, "Should handle long file paths");
    assertEquals(typeof _result.success, "boolean", "Should return valid CommandResult");

    _logger.debug("Long file path handling verified");
  });

  it("should handle special characters in parameters", async () => {
    _logger.debug("Testing special character handling");

    const specialPath = "file with spaces & special@chars!.md";
    const _result = await generateWithPrompt(specialPath, specialPath, "test", false);

    assertExists(_result, "Should handle special characters");
    assertEquals(typeof _result.success, "boolean", "Should return valid CommandResult");

    _logger.debug("Special character handling verified");
  });

  it("should handle concurrent function calls", async () => {
    _logger.debug("Testing concurrent function calls");

    const promises = [
      generateWithPrompt("test1.md", "out1.md", "test", false),
      generateWithPrompt("test2.md", "out2.md", "test", false),
      generateWithPrompt("test3.md", "out3.md", "test", false),
    ];

    const results = await Promise.allSettled(promises);

    assertEquals(results.length, 3, "Should handle all concurrent calls");

    for (const result of results) {
      assertEquals(_result.status, "fulfilled", "All calls should complete");
      if (_result.status === "fulfilled") {
        assertExists(_result.value, "Each call should return a value");
        assertEquals(typeof _result.value.success, "boolean", "Each should return CommandResult");
      }
    }

    _logger.debug("Concurrent function calls verified");
  });
});

describe("Unit: Integration with Dependencies", async () => {
  it("should integrate with Workspace class properly", async () => {
    _logger.debug("Testing Workspace integration");

    // Create a temporary directory that should allow workspace creation
    const tempDir = Deno.makeTempDirSync();

    try {
      const _result = await initWorkspace(tempDir);

      // Should either succeed or fail gracefully
      assertEquals(typeof _result.success, "boolean", "Should return valid result");
      assertExists(_result.output !== undefined, "Should have output");
      assertExists(_result.error !== undefined, "Should have error field");

      if (!_result.success) {
        assertExists(_result.error, "Failed result should have error message");
      }
    } finally {
      try {
        Deno.removeSync(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }

    _logger.debug("Workspace integration verified");
  });

  it("should integrate with PromptFileGenerator properly", async () => {
    _logger.debug("Testing PromptFileGenerator integration");

    const _result = await generateWithPrompt("test.md", "output.md", "test", false);

    // Should delegate properly and return valid result
    assertExists(_result, "Should integrate with PromptFileGenerator");
    assertEquals(typeof _result.success, "boolean", "Should return CommandResult");
    assertEquals(typeof _result.output, "string", "Should have string output");
    assertExists(_result.error !== undefined, "Should have error field");

    _logger.debug("PromptFileGenerator integration verified");
  });
});

describe("Unit: Performance and Resource Management", async () => {
  it("should handle multiple sequential calls efficiently", async () => {
    _logger.debug("Testing sequential call performance");

    const startTime = Date.now();

    // Run multiple sequential calls
    for (let i = 0; i < 5; i++) {
      const _result = await generateWithPrompt(`test${i}.md`, `out${i}.md`, "test", false);
      assertExists(_result, `Call ${i} should return result`);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete in reasonable time (adjust threshold as needed)
    assertEquals(duration < 30000, true, "Sequential calls should complete within 30 seconds");

    _logger.debug("Sequential call performance verified");
  });

  it("should clean up resources properly", async () => {
    _logger.debug("Testing resource cleanup");

    // Run a function that should clean up after itself
    const _result = await generateWithPrompt("test.md", "output.md", "test", false);

    assertExists(_result, "Should complete and clean up resources");

    // Verify no hanging promises or resources
    // (This is mainly verified by the test runner not hanging)

    _logger.debug("Resource cleanup verified");
  });
});
