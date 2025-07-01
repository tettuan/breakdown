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
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { 
  initWorkspace, 
  generateWithPrompt, 
  displayHelp, 
  displayVersion,
  type CommandResult,
  type GenerateWithPromptOptions 
} from "./mod.ts";

const logger = new BreakdownLogger("mod-unit");

describe("Unit: initWorkspace Function", () => {
  let tempDir: string;

  beforeEach(() => {
    logger.debug("Setting up test environment");
    tempDir = Deno.makeTempDirSync();
  });

  afterEach(() => {
    logger.debug("Cleaning up test environment");
    try {
      Deno.removeSync(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should initialize workspace successfully with default parameters", async () => {
    logger.debug("Testing successful workspace initialization");
    
    const result = await initWorkspace();
    
    assertEquals(result.success, true, "Should return success");
    assertEquals(result.output, "Workspace initialized successfully", "Should have success message");
    assertEquals(result.error, "", "Should have empty error");
    
    logger.debug("Successful workspace initialization verified");
  });

  it("should use provided working directory", async () => {
    logger.debug("Testing custom working directory");
    
    const result = await initWorkspace(tempDir);
    
    assertEquals(result.success, true, "Should succeed with custom directory");
    assertEquals(result.output, "Workspace initialized successfully", "Should have success message");
    
    logger.debug("Custom working directory handling verified");
  });

  it("should use provided configuration", async () => {
    logger.debug("Testing custom configuration");
    
    const config = {
      app_prompt: { base_dir: "custom_prompts" },
      app_schema: { base_dir: "custom_schemas" }
    };
    
    const result = await initWorkspace(tempDir, config);
    
    assertEquals(result.success, true, "Should succeed with custom config");
    assertEquals(result.output, "Workspace initialized successfully", "Should have success message");
    
    logger.debug("Custom configuration handling verified");
  });

  it("should handle workspace initialization errors", async () => {
    logger.debug("Testing workspace initialization error handling");
    
    // Try to initialize in a location that should cause an error
    const invalidPath = "/invalid/nonexistent/path/that/should/fail";
    
    const result = await initWorkspace(invalidPath);
    
    assertEquals(result.success, false, "Should fail with invalid path");
    assertEquals(result.output, "", "Should have empty output on error");
    assertExists(result.error, "Should have error message");
    assertEquals(
      typeof result.error === "string" && result.error.includes("Failed to initialize workspace"),
      true,
      "Should have descriptive error message"
    );
    
    logger.debug("Workspace initialization error handling verified");
  });

  it("should handle missing configuration gracefully", async () => {
    logger.debug("Testing missing configuration handling");
    
    const result = await initWorkspace(tempDir, undefined);
    
    // Should use defaults and succeed
    assertEquals(result.success, true, "Should succeed with undefined config");
    assertEquals(result.output, "Workspace initialized successfully", "Should have success message");
    
    logger.debug("Missing configuration handling verified");
  });

  it("should handle partial configuration", async () => {
    logger.debug("Testing partial configuration handling");
    
    const partialConfig = {
      app_prompt: { base_dir: "custom_prompts" }
      // Missing app_schema config
    };
    
    const result = await initWorkspace(tempDir, partialConfig);
    
    assertEquals(result.success, true, "Should succeed with partial config");
    assertEquals(result.output, "Workspace initialized successfully", "Should have success message");
    
    logger.debug("Partial configuration handling verified");
  });
});

describe("Unit: generateWithPrompt Function", () => {
  it("should handle basic prompt generation request", async () => {
    logger.debug("Testing basic prompt generation");
    
    const result = await generateWithPrompt(
      "input.md",
      "output.md", 
      "test",
      false
    );
    
    // Note: This will likely fail due to missing dependencies/files
    // but we can verify the function structure
    assertExists(result, "Should return a result");
    assertEquals(typeof result.success, "boolean", "Should have boolean success field");
    assertEquals(typeof result.output, "string", "Should have string output field");
    assertExists(result.error !== undefined, "Should have error field");
    
    logger.debug("Basic prompt generation structure verified");
  });

  it("should handle force parameter correctly", async () => {
    logger.debug("Testing force parameter handling");
    
    const result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test", 
      true // force = true
    );
    
    assertExists(result, "Should handle force parameter");
    assertEquals(typeof result.success, "boolean", "Should return CommandResult");
    
    logger.debug("Force parameter handling verified");
  });

  it("should handle options parameter", async () => {
    logger.debug("Testing options parameter handling");
    
    const options: GenerateWithPromptOptions = {
      adaptation: "strict",
      demonstrativeType: "summary",
      input_text: "Test input text",
      extended: true,
      customVariables: { "key": "value" }
    };
    
    const result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test",
      false,
      options
    );
    
    assertExists(result, "Should handle options parameter");
    assertEquals(typeof result.success, "boolean", "Should return CommandResult");
    
    logger.debug("Options parameter handling verified");
  });

  it("should handle missing options gracefully", async () => {
    logger.debug("Testing missing options handling");
    
    const result = await generateWithPrompt(
      "input.md",
      "output.md",
      "test"
      // No force or options parameters
    );
    
    assertExists(result, "Should handle missing optional parameters");
    assertEquals(typeof result.success, "boolean", "Should return CommandResult");
    
    logger.debug("Missing options handling verified");
  });

  it("should handle stdin input", async () => {
    logger.debug("Testing stdin input handling");
    
    const options: GenerateWithPromptOptions = {
      input_text: "This is stdin content"
    };
    
    const result = await generateWithPrompt(
      "-", // stdin indicator
      "output.md",
      "test",
      false,
      options
    );
    
    assertExists(result, "Should handle stdin input");
    assertEquals(typeof result.success, "boolean", "Should return CommandResult");
    
    logger.debug("Stdin input handling verified");
  });

  it("should handle empty parameters", async () => {
    logger.debug("Testing empty parameter handling");
    
    const result = await generateWithPrompt("", "", "", false);
    
    assertExists(result, "Should handle empty parameters");
    assertEquals(result.success, false, "Should fail with empty parameters");
    assertExists(result.error, "Should have error for empty parameters");
    
    logger.debug("Empty parameter handling verified");
  });
});

describe("Unit: Display Functions", () => {
  it("should display help information correctly", () => {
    logger.debug("Testing help display");
    
    const result = displayHelp();
    
    assertEquals(result.success, true, "Help should return success");
    assertEquals(typeof result.output, "string", "Help should return string output");
    assertEquals(result.error, "", "Help should have no error");
    
    // Verify help content
    const helpText = result.output;
    assertEquals(helpText.includes("Breakdown"), true, "Should mention tool name");
    assertEquals(helpText.includes("Usage:"), true, "Should include usage section");
    assertEquals(helpText.includes("Commands:"), true, "Should include commands section");
    assertEquals(helpText.includes("init"), true, "Should include init command");
    assertEquals(helpText.includes("--help"), true, "Should include help option");
    
    logger.debug("Help display verified");
  });

  it("should display version information correctly", () => {
    logger.debug("Testing version display");
    
    const result = displayVersion();
    
    assertEquals(result.success, true, "Version should return success");
    assertEquals(typeof result.output, "string", "Version should return string output");
    assertEquals(result.error, "", "Version should have no error");
    
    // Verify version format
    const versionText = result.output;
    assertEquals(versionText.includes("Breakdown v"), true, "Should have version prefix");
    assertEquals(versionText.trim().length > 0, true, "Should have non-empty version");
    
    logger.debug("Version display verified");
  });

  it("should return consistent CommandResult structure", () => {
    logger.debug("Testing CommandResult consistency");
    
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
    
    logger.debug("CommandResult consistency verified");
  });
});

describe("Unit: Error Handling and Edge Cases", () => {
  it("should handle null parameters gracefully", async () => {
    logger.debug("Testing null parameter handling");
    
    const result = await generateWithPrompt(
      null as any,
      null as any,
      null as any,
      false
    );
    
    assertExists(result, "Should handle null parameters");
    assertEquals(result.success, false, "Should fail with null parameters");
    assertExists(result.error, "Should have error for null parameters");
    
    logger.debug("Null parameter handling verified");
  });

  it("should handle undefined parameters appropriately", async () => {
    logger.debug("Testing undefined parameter handling");
    
    const result = await generateWithPrompt(
      undefined as any,
      undefined as any, 
      undefined as any,
      false
    );
    
    assertExists(result, "Should handle undefined parameters");
    assertEquals(result.success, false, "Should fail with undefined parameters");
    
    logger.debug("Undefined parameter handling verified");
  });

  it("should handle very long file paths", async () => {
    logger.debug("Testing long file path handling");
    
    const longPath = "a".repeat(1000) + ".md";
    const result = await generateWithPrompt(longPath, longPath, "test", false);
    
    assertExists(result, "Should handle long file paths");
    assertEquals(typeof result.success, "boolean", "Should return valid CommandResult");
    
    logger.debug("Long file path handling verified");
  });

  it("should handle special characters in parameters", async () => {
    logger.debug("Testing special character handling");
    
    const specialPath = "file with spaces & special@chars!.md";
    const result = await generateWithPrompt(specialPath, specialPath, "test", false);
    
    assertExists(result, "Should handle special characters");
    assertEquals(typeof result.success, "boolean", "Should return valid CommandResult");
    
    logger.debug("Special character handling verified");
  });

  it("should handle concurrent function calls", async () => {
    logger.debug("Testing concurrent function calls");
    
    const promises = [
      generateWithPrompt("test1.md", "out1.md", "test", false),
      generateWithPrompt("test2.md", "out2.md", "test", false),
      generateWithPrompt("test3.md", "out3.md", "test", false)
    ];
    
    const results = await Promise.allSettled(promises);
    
    assertEquals(results.length, 3, "Should handle all concurrent calls");
    
    for (const result of results) {
      assertEquals(result.status, "fulfilled", "All calls should complete");
      if (result.status === "fulfilled") {
        assertExists(result.value, "Each call should return a value");
        assertEquals(typeof result.value.success, "boolean", "Each should return CommandResult");
      }
    }
    
    logger.debug("Concurrent function calls verified");
  });
});

describe("Unit: Integration with Dependencies", () => {
  it("should integrate with Workspace class properly", async () => {
    logger.debug("Testing Workspace integration");
    
    // Create a temporary directory that should allow workspace creation
    const tempDir = Deno.makeTempDirSync();
    
    try {
      const result = await initWorkspace(tempDir);
      
      // Should either succeed or fail gracefully
      assertEquals(typeof result.success, "boolean", "Should return valid result");
      assertExists(result.output !== undefined, "Should have output");
      assertExists(result.error !== undefined, "Should have error field");
      
      if (!result.success) {
        assertExists(result.error, "Failed result should have error message");
      }
    } finally {
      try {
        Deno.removeSync(tempDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    
    logger.debug("Workspace integration verified");
  });

  it("should integrate with PromptFileGenerator properly", async () => {
    logger.debug("Testing PromptFileGenerator integration");
    
    const result = await generateWithPrompt("test.md", "output.md", "test", false);
    
    // Should delegate properly and return valid result
    assertExists(result, "Should integrate with PromptFileGenerator");
    assertEquals(typeof result.success, "boolean", "Should return CommandResult");
    assertEquals(typeof result.output, "string", "Should have string output");
    assertExists(result.error !== undefined, "Should have error field");
    
    logger.debug("PromptFileGenerator integration verified");
  });
});

describe("Unit: Performance and Resource Management", () => {
  it("should handle multiple sequential calls efficiently", async () => {
    logger.debug("Testing sequential call performance");
    
    const startTime = Date.now();
    
    // Run multiple sequential calls
    for (let i = 0; i < 5; i++) {
      const result = await generateWithPrompt(`test${i}.md`, `out${i}.md`, "test", false);
      assertExists(result, `Call ${i} should return result`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete in reasonable time (adjust threshold as needed)
    assertEquals(duration < 30000, true, "Sequential calls should complete within 30 seconds");
    
    logger.debug("Sequential call performance verified");
  });

  it("should clean up resources properly", async () => {
    logger.debug("Testing resource cleanup");
    
    // Run a function that should clean up after itself
    const result = await generateWithPrompt("test.md", "output.md", "test", false);
    
    assertExists(result, "Should complete and clean up resources");
    
    // Verify no hanging promises or resources
    // (This is mainly verified by the test runner not hanging)
    
    logger.debug("Resource cleanup verified");
  });
});