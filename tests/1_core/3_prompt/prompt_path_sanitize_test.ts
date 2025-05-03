/**
 * Tests for prompt path sanitization functionality
 *
 * Purpose:
 * - Verify path sanitization for various input formats
 * - Test handling of special characters
 * - Test directory traversal handling
 * - Test absolute path handling
 * - Test edge cases and invalid inputs
 */

import { assertEquals } from "jsr:@std/assert@^0.224.0";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { sanitizePathForPrompt } from "$lib/prompt/processor.ts";

const logger = new BreakdownLogger();

// Preparing Part
interface PathTestCase {
  input: string;
  expected: string;
  description: string;
}

function setupPathTestCases(): PathTestCase[] {
  return [
    {
      input: "path/to/file.md",
      expected: "path/to/file.md",
      description: "Should keep valid relative paths unchanged"
    },
    {
      input: "/absolute/path/file.md",
      expected: "absolute/path/file.md",
      description: "Should remove leading slash from absolute paths"
    },
    {
      input: "path/../file.md",
      expected: "file.md",
      description: "Should resolve directory traversal"
    },
    {
      input: "path/../../file.md",
      expected: "file.md",
      description: "Should handle multiple directory traversals"
    },
    {
      input: "path/with spaces/file.md",
      expected: "path/with_spaces/file.md",
      description: "Should replace spaces with underscores"
    },
    {
      input: "path/with@special#chars/file.md",
      expected: "path/with_special_chars/file.md",
      description: "Should replace special characters with underscores"
    },
    {
      input: "./current/dir/file.md",
      expected: "current/dir/file.md",
      description: "Should handle current directory notation"
    },
    {
      input: "path//with///multiple////slashes.md",
      expected: "path/with/multiple/slashes.md",
      description: "Should normalize multiple slashes"
    },
    {
      input: "path/with/trailing/slash/",
      expected: "path/with/trailing/slash",
      description: "Should remove trailing slash"
    },
    {
      input: "path/with/日本語/file.md",
      expected: "path/with/_/file.md",
      description: "Should handle non-ASCII characters"
    }
  ];
}

// Main Test
Deno.test("Path Sanitization", async (t) => {
  const testCases = setupPathTestCases();

  for (const testCase of testCases) {
    await t.step(testCase.description, () => {
      logger.debug("Testing path sanitization", {
        input: testCase.input,
        expected: testCase.expected
      });

      const result = sanitizePathForPrompt(testCase.input);
      assertEquals(
        result,
        testCase.expected,
        `Failed to sanitize path correctly.\nInput: ${testCase.input}\nExpected: ${testCase.expected}\nGot: ${result}`
      );
    });
  }

  await t.step("should handle empty input", () => {
    const result = sanitizePathForPrompt("");
    assertEquals(result, "", "Should return empty string for empty input");
  });

  await t.step("should handle null or undefined input", () => {
    // @ts-ignore: Testing invalid input
    const result = sanitizePathForPrompt(null);
    assertEquals(result, "", "Should handle null input gracefully");
  });

  await t.step("should handle complex directory traversal", () => {
    const input = "a/b/c/../d/../../e/f/../g";
    const expected = "a/e/g";
    const result = sanitizePathForPrompt(input);
    assertEquals(
      result,
      expected,
      "Should correctly resolve complex directory traversal"
    );
  });

  await t.step("should preserve valid file extensions", () => {
    const input = "path/to/file.test.md";
    const result = sanitizePathForPrompt(input);
    assertEquals(
      result,
      input,
      "Should preserve multiple dots in filename"
    );
  });

  await t.step("should handle Windows-style paths", () => {
    const input = "path\\to\\file.md";
    const expected = "path/to/file.md";
    const result = sanitizePathForPrompt(input);
    assertEquals(
      result,
      expected,
      "Should convert backslashes to forward slashes"
    );
  });
}); 