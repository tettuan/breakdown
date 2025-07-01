/**
 * @fileoverview Integration tests for TemplateErrorHandler
 * 
 * Tests end-to-end integration scenarios:
 * - Real file system error handling
 * - Integration with template loading workflow
 * - Error recovery mechanisms
 * - Complex error scenarios
 * - Logging integration
 * 
 * @module helpers/3_integration_template_error_handler_test
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import {
  TemplateError,
  TemplateErrorType,
  TemplateErrorHandler,
  withTemplateErrorHandling
} from "./template_error_handler.ts";
import { join, dirname } from "@std/path";
import { ensureDirSync } from "@std/fs";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("template-error-handler-integration-test");

Deno.test("Integration: TemplateErrorHandler with real file system errors", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_error_test_" });
  
  try {
    // Setup test structure
    const promptDir = join(tempDir, "prompts");
    const schemaDir = join(tempDir, "schema");
    ensureDirSync(promptDir);
    ensureDirSync(schemaDir);
    
    // Create some existing templates
    const summaryDir = join(promptDir, "summary", "issue");
    ensureDirSync(summaryDir);
    await Deno.writeTextFile(
      join(summaryDir, "f_issue.md"),
      "# Issue Summary\n{{content}}"
    );
    
    // Attempt to access non-existent template
    const attemptedPath = join(promptDir, "sumary", "isue", "f_isue.md"); // Typos
    
    try {
      await Deno.readTextFile(attemptedPath);
      assertEquals(false, true, "Should not be able to read non-existent file");
    } catch (fsError) {
      const templateError = TemplateErrorHandler.detectTemplateError(
        fsError as Error,
        { templatePath: attemptedPath }
      );
      
      logger.debug("File system error handled", {
        originalError: (fsError as Error).message,
        templateError: templateError?.message,
        suggestions: templateError?.suggestions.length
      });
      
      // Should wrap file system error
      assertExists(templateError, "Should detect file system error as template error");
      assertEquals(templateError.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
      assertEquals(templateError.cause, fsError);
      assertEquals(templateError.templatePath, attemptedPath);
      
      // Should provide helpful suggestions
      assertExists(templateError.suggestions);
      assertEquals(templateError.suggestions.length > 0, true);
      
      // Should suggest automatic resolution
      assertEquals(templateError.canAutoResolve, true, "File not found should be auto-resolvable");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Integration: Template permission error handling", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_permission_test_" });
  
  try {
    const templatePath = join(tempDir, "restricted.md");
    await Deno.writeTextFile(templatePath, "# Restricted Template");
    
    // Make file unreadable (platform-dependent, may not work everywhere)
    try {
      await Deno.chmod(templatePath, 0o000);
      
      try {
        await Deno.readTextFile(templatePath);
        // If no error, skip this test (platform doesn't support chmod)
        return;
      } catch (permError) {
        const templateError = TemplateErrorHandler.detectTemplateError(
          permError as Error,
          { templatePath }
        );
        
        if (templateError) {
          assertEquals(templateError.errorType, TemplateErrorType.TEMPLATE_PERMISSION_DENIED);
          assertEquals(templateError.canAutoResolve, false, "Permission errors cannot be auto-resolved");
          
          // Should suggest permission fixes
          const suggestsPermissionFix = templateError.suggestions.some(s =>
            s.includes("permission") || 
            s.includes("privileges") || 
            s.includes("ownership")
          );
          assertEquals(suggestsPermissionFix, true, "Should suggest permission fixes");
        }
      }
    } finally {
      // Restore permissions for cleanup
      try {
        await Deno.chmod(templatePath, 0o644);
      } catch {
        // Ignore if chmod not supported
      }
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Integration: withTemplateErrorHandling wrapper with real operations", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_wrapper_test_" });
  
  try {
    // Test successful operation
    const successfulFileRead = async () => {
      const testFile = join(tempDir, "success.md");
      await Deno.writeTextFile(testFile, "Success content");
      return await Deno.readTextFile(testFile);
    };
    
    const result1 = await withTemplateErrorHandling(successfulFileRead, {
      templatePath: join(tempDir, "success.md"),
      operation: "read_template"
    });
    
    assertEquals(result1, "Success content", "Should return successful operation result");
    
    // Test operation that fails with template error
    const failingFileRead = async () => {
      return await Deno.readTextFile(join(tempDir, "nonexistent.md"));
    };
    
    try {
      await withTemplateErrorHandling(failingFileRead, {
        templatePath: join(tempDir, "nonexistent.md"),
        operation: "read_missing_template",
        autoResolve: false // Disable auto-resolve for test
      });
      assertEquals(false, true, "Should throw template error");
    } catch (error) {
      assertEquals(error instanceof TemplateError, true, "Should throw TemplateError");
      assertEquals((error as TemplateError).errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
      
      // Error should have helpful context
      assertExists((error as TemplateError).suggestions);
      assertEquals((error as TemplateError).suggestions.length > 0, true);
    }
    
    // Test non-template error pass-through
    const networkError = async () => {
      throw new Error("Network connection failed");
    };
    
    try {
      await withTemplateErrorHandling(networkError);
      assertEquals(false, true, "Should throw non-template errors");
    } catch (error) {
      assertEquals((error as Error).message, "Network connection failed", "Should preserve non-template errors");
      assertEquals(error instanceof TemplateError, false, "Should not wrap non-template errors");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Integration: Complex error scenario with multiple template types", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_complex_test_" });
  
  try {
    // Create a complex directory structure
    const dirs = [
      "prompts/to/project",
      "prompts/to/task",
      "prompts/summary/issue",
      "prompts/find/bugs",
      "templates/to/project",
      "custom/prompts/to/project"
    ];
    
    for (const dir of dirs) {
      ensureDirSync(join(tempDir, dir));
    }
    
    // Create templates with various issues
    const brokenTemplate = join(tempDir, "prompts/to/project/f_broken.md");
    await Deno.writeTextFile(brokenTemplate, "{{#if condition}}Unclosed if template");
    
    const validTemplate = join(tempDir, "prompts/summary/issue/f_issue.md");
    await Deno.writeTextFile(validTemplate, "# Issue {{title}}\n{{description}}");
    
    // Scenario 1: Test invalid template detection
    try {
      // Simulate template compilation error
      throw new Error("Invalid template syntax: Unclosed if block");
    } catch (error) {
      const templateError = TemplateErrorHandler.detectTemplateError(
        error as Error,
        { templatePath: brokenTemplate, operation: "compile_template" }
      );
      
      assertExists(templateError, "Should detect template syntax error");
      assertEquals(templateError.errorType, TemplateErrorType.TEMPLATE_INVALID);
      assertEquals(templateError.templatePath, brokenTemplate);
      assertEquals(templateError.canAutoResolve, true, "Invalid templates should be auto-resolvable");
      
      // Should suggest template fixes
      assertExists(templateError.suggestions.find(s => 
        s.includes("syntax") || s.includes("template") || s.includes("structure")
      ));
    }
    
    // Scenario 2: Test file not found with available alternatives
    const missingPath = join(tempDir, "prompts/custom/special.md");
    
    try {
      await Deno.readTextFile(missingPath);
    } catch (error) {
      const templateError = TemplateErrorHandler.detectTemplateError(
        error as Error,
        { templatePath: missingPath }
      );
      
      assertExists(templateError, "Should detect missing template");
      assertEquals(templateError.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
      
      // Should provide recovery suggestions
      const detailedMessage = templateError.getDetailedMessage();
      assertStringIncludes(detailedMessage, "❌", "Should have error marker");
      assertStringIncludes(detailedMessage, "💡", "Should have suggestions");
      
      const commands = templateError.getRecoveryCommands();
      assertEquals(commands.length > 0, true, "Should provide recovery commands");
      assertEquals(
        commands.some(cmd => cmd.includes("template_generator")),
        true,
        "Should suggest template generator"
      );
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Integration: Error handler with logger integration", async () => {
  const testLogger = new BreakdownLogger("test-error-handler");
  
  // Create error with detailed context
  const templateError = new TemplateError(
    "Integration test error",
    TemplateErrorType.TEMPLATE_NOT_FOUND,
    {
      templatePath: "/prompts/test/missing.md",
      suggestions: ["Create template", "Check path"],
      canAutoResolve: true
    }
  );
  
  // Test error handling with logging
  const result = await TemplateErrorHandler.handleTemplateError(templateError, {
    autoResolve: false // Don't actually try to run scripts in test
  });
  
  // Verify error handling result
  assertEquals(result.resolved, false, "Should not resolve in test mode");
  assertEquals(result.message, "Manual intervention required");
  assertExists(result.commands, "Should provide recovery commands");
  
  // Verify error structure is logging-friendly
  const errorData = {
    type: templateError.errorType,
    message: templateError.message,
    templatePath: templateError.templatePath,
    suggestions: templateError.suggestions,
    canAutoResolve: templateError.canAutoResolve,
    detailedMessage: templateError.getDetailedMessage()
  };
  
  assertEquals(typeof errorData.type, "string");
  assertEquals(typeof errorData.message, "string");
  assertEquals(typeof errorData.templatePath, "string");
  assertEquals(Array.isArray(errorData.suggestions), true);
  assertEquals(typeof errorData.canAutoResolve, "boolean");
  assertEquals(typeof errorData.detailedMessage, "string");
  
  // Log the error (would be captured by BreakdownLogger)
  testLogger.error("Template error occurred in integration test", errorData);
});

Deno.test("Integration: Template error recovery workflow simulation", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_recovery_test_" });
  
  try {
    // Simulate a recovery workflow
    const promptDir = join(tempDir, "prompts");
    ensureDirSync(promptDir);
    
    // Step 1: Initial error - missing template
    const missingPath = join(promptDir, "to/project/f_project.md");
    
    let templateError: TemplateError | null = null;
    try {
      await Deno.readTextFile(missingPath);
    } catch (error) {
      templateError = TemplateErrorHandler.detectTemplateError(
        error as Error,
        { templatePath: missingPath }
      );
    }
    
    assertExists(templateError, "Should detect missing template");
    assertEquals(templateError.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
    assertEquals(templateError.suggestions.length > 0, true, "Should have suggestions");
    
    // Step 2: Follow suggestion to create template structure
    const suggestedAction = templateError.suggestions.find(s => 
      s.includes("generator") || s.includes("create") || s.includes("missing")
    );
    assertExists(suggestedAction, "Should suggest creating template");
    
    // Step 3: Simulate creating the missing structure
    const templateDir = dirname(missingPath);
    ensureDirSync(templateDir);
    await Deno.writeTextFile(missingPath, "# Project Template\n{{content}}\n{{author}}");
    
    // Step 4: Verify recovery - template now exists
    const content = await Deno.readTextFile(missingPath);
    assertExists(content);
    assertEquals(content.includes("Project Template"), true);
    
    // Step 5: Test that error no longer occurs
    const fileExists = await Deno.stat(missingPath);
    assertEquals(fileExists.isFile, true, "Template file should now exist");
    
    logger.debug("Recovery workflow completed", {
      initialError: templateError.errorType,
      recovered: true,
      templateCreated: missingPath
    });
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Integration: Concurrent error handling with real operations", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_concurrent_test_" });
  
  try {
    // Simulate concurrent template operations that fail
    const operations = [
      () => Deno.readTextFile(join(tempDir, "missing1.md")),
      () => Deno.readTextFile(join(tempDir, "missing2.md")),
      () => Deno.readTextFile(join(tempDir, "missing3.md"))
    ];
    
    const errorResults = await Promise.allSettled(
      operations.map(async (op, index) => {
        try {
          return await withTemplateErrorHandling(op, {
            templatePath: join(tempDir, `missing${index + 1}.md`),
            autoResolve: false
          });
        } catch (error) {
          return error;
        }
      })
    );
    
    // All operations should fail with template errors
    assertEquals(errorResults.length, 3);
    
    for (const result of errorResults) {
      assertEquals(result.status, "fulfilled", "Should handle errors gracefully");
      
      if (result.status === "fulfilled") {
        const error = result.value;
        assertEquals(error instanceof TemplateError, true, "Should be TemplateError");
        assertEquals((error as TemplateError).errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
        assertExists((error as TemplateError).suggestions);
      }
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("Integration: Error handling with different file system scenarios", async () => {
  const tempDir = await Deno.makeTempDir({ prefix: "template_fs_test_" });
  
  try {
    // Scenario 1: Directory exists but file doesn't
    const templateDir = join(tempDir, "prompts", "to", "project");
    ensureDirSync(templateDir);
    
    try {
      await Deno.readTextFile(join(templateDir, "f_project.md"));
    } catch (error) {
      const templateError = TemplateErrorHandler.detectTemplateError(error as Error);
      assertExists(templateError, "Should detect missing file in existing directory");
      assertEquals(templateError.errorType, TemplateErrorType.TEMPLATE_NOT_FOUND);
    }
    
    // Scenario 2: File exists but is empty
    const emptyTemplate = join(templateDir, "f_empty.md");
    await Deno.writeTextFile(emptyTemplate, "");
    
    const emptyContent = await Deno.readTextFile(emptyTemplate);
    assertEquals(emptyContent, "", "Should read empty file without error");
    
    // Scenario 3: File exists with valid content
    const validTemplate = join(templateDir, "f_valid.md");
    await Deno.writeTextFile(validTemplate, "# Valid Template\n{{content}}");
    
    const validContent = await Deno.readTextFile(validTemplate);
    assertEquals(validContent.includes("Valid Template"), true);
    
    // Scenario 4: Deeply nested path that doesn't exist
    try {
      await Deno.readTextFile(join(tempDir, "deep", "nested", "path", "template.md"));
    } catch (error) {
      const templateError = TemplateErrorHandler.detectTemplateError(
        error as Error,
        { templatePath: join(tempDir, "deep", "nested", "path", "template.md") }
      );
      
      assertExists(templateError, "Should detect deeply nested missing file");
      assertEquals(templateError.canAutoResolve, true, "Should be auto-resolvable");
    }
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});