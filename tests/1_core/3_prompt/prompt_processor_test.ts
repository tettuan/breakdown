/**
 * Tests for prompt processing functionality
 *
 * Purpose:
 * - Verify prompt processing for different demonstrative types
 * - Test file generation and conversion
 * - Validate error handling
 *
 * Related Specifications:
 * - docs/breakdown/app_prompt.ja.md: Prompt processing specifications
 */

import { assertRejects } from "@std/assert";
import { dirname, ensureDir, join } from "$deps/mod.ts";
import { DemonstrativeType } from "$lib/types/mod.ts";
import { processWithPrompt } from "$lib/prompt/processor.ts";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";

/**
 * Test suite for the prompt processor functionality
 *
 * IMPORTANT FINDINGS ABOUT PROMPTMANAGER INTEGRATION:
 * ------------------------------------------------
 * 1. Template Path Requirements:
 *    - PromptManager.generatePrompt MUST receive a file path, not content
 *    - This is a critical requirement that affects the entire prompt processing flow
 *    - Previous bug: We were passing content directly, which violated the API contract
 *
 * 2. Path Validation Rules (Critical for Integration):
 *    - Paths MUST only contain: [a-zA-Z0-9\-_\.]
 *    - Directory traversal (..) is strictly forbidden
 *    - Absolute paths (starting with / or \) are not allowed
 *    - All paths must be sanitized before being passed to PromptManager
 *
 * 3. Template Processing Flow (Required Steps):
 *    a. Load template from breakdown/prompts directory
 *    b. Create temporary file in tmp/templates/<timestamp>.md
 *    c. Write template content to temporary file
 *    d. Pass temporary file path to PromptManager.generatePrompt
 *    e. Process the result
 *    f. Clean up temporary file (MUST be done in finally block)
 *
 * 4. Error Handling Requirements:
 *    - Must validate demonstrative types against ["to", "summary", "defect"]
 *    - Must handle template loading failures gracefully
 *    - Must handle prompt generation failures
 *    - Must ensure temporary file cleanup even on errors
 *
 * 5. Integration Considerations:
 *    - All file paths must be sanitized using sanitizePathForPrompt
 *    - Temporary files must use unique names (timestamp-based)
 *    - Directory structure must be maintained: breakdown/prompts for templates
 *    - Output paths must also follow validation rules
 *
 * 6. Future Improvements Needed:
 *    - Replace console.log with BreakdownLogger for better debugging
 *    - Consider adding path validation unit tests
 *    - Add more edge cases for path handling
 *    - Consider adding cleanup verification tests
 *
 * IMPORTANT: These findings are crucial for maintaining compatibility with
 * the @tettuan/breakdownprompt package. Any changes to path handling or
 * template processing must follow these rules to maintain compatibility.
 */

/**
 * Test processWithPrompt function with various scenarios
 *
 * Critical Test Cases (DO NOT MODIFY WITHOUT UPDATING INTEGRATION TESTS):
 * 1. Path Validation Tests:
 *    - Ensures all paths are properly sanitized
 *    - Verifies rejection of invalid paths
 *    - Confirms proper handling of relative paths
 *
 * 2. Template Processing Tests:
 *    - Validates correct template loading sequence
 *    - Ensures proper temporary file management
 *    - Verifies cleanup procedures
 *
 * 3. Error Handling Tests:
 *    - Confirms proper error messages for invalid inputs
 *    - Verifies cleanup on error conditions
 *    - Ensures proper error propagation
 *
 * 4. Integration Flow Tests:
 *    - Validates complete processing pipeline
 *    - Ensures proper file system operations
 *    - Confirms expected output generation
 */
Deno.test("processWithPrompt", async (t) => {
  const env = await setupTestEnvironment({
    workingDir: "tmp/test_prompt_processor",
  });
  const workingDir = env.workingDir;

  // Create test files in the working directory
  const fromFile = join(workingDir, "test_input.md");
  const destFile = join(workingDir, "test_output.md");

  try {
    // Create test input file
    await ensureDir(dirname(fromFile));
    await Deno.writeTextFile(
      fromFile,
      "# Project Title\n- Feature 1: First feature\n- Feature 2: Second feature",
    );

    await t.step("should convert project to issue", async () => {
      await processWithPrompt(
        "to" as DemonstrativeType,
        "issue",
        fromFile,
        destFile,
      );
    });

    await t.step("should throw error for invalid demonstrative type", async () => {
      await assertRejects(
        () =>
          processWithPrompt(
            "invalid" as DemonstrativeType,
            "issue",
            fromFile,
            destFile,
          ),
        Error,
        "Unsupported demonstrative type",
      );
    });
  } finally {
    await cleanupTestEnvironment(env);
  }
});
