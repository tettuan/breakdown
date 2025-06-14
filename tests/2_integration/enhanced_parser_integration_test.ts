/**
 * Integration tests for EnhancedParamsParser with CommandOptionsValidator
 *
 * Tests the integration between the enhanced parser and the validation system
 * to ensure three-word commands work end-to-end.
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { EnhancedParamsParser } from "../../lib/cli/parser/enhanced_params_parser.ts";
import { CommandOptionsValidator } from "../../lib/cli/validators/command_options_validator.ts";
import type { ThreeParamsResult } from "../../lib/cli/validators/three_command_validator.ts";

Deno.test("EnhancedParamsParser Integration - Three Word Command Validation", async (t) => {
  const parser = new EnhancedParamsParser();
  const validator = new CommandOptionsValidator();

  await t.step("should integrate with ThreeCommandValidator successfully", () => {
    // Use a real test file that exists
    const testFile = "tests/fixtures/test_input.js";
    const result = parser.parse(["find", "bugs", "--from", testFile, "--destination", "output.md"]);

    assertEquals(result.type, "three");

    const threeResult = result as ThreeParamsResult;

    // Add stdin availability for validation
    const paramsWithStdin = {
      ...threeResult,
      stdinAvailable: false,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, true);
    assertEquals(validationResult.values.command, "find bugs");
    assertEquals(validationResult.values.from, testFile);
    assertEquals(validationResult.values.destination, "output.md");
  });

  await t.step("should handle validation failure for missing destination", () => {
    const testFile = "tests/fixtures/test_input.js";
    const result = parser.parse(["find", "bugs", "--from", testFile]);

    assertEquals(result.type, "three");

    const threeResult = result as ThreeParamsResult;

    const paramsWithStdin = {
      ...threeResult,
      stdinAvailable: false,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, false);
    assertExists(validationResult.errorMessage);
    assertEquals(validationResult.errorMessage?.includes("requires --destination"), true);
  });

  await t.step("should handle stdin input scenario", () => {
    const result = parser.parse(["find", "bugs"]);

    assertEquals(result.type, "three");

    const threeResult = result as ThreeParamsResult;

    // Simulate stdin availability
    const paramsWithStdin = {
      ...threeResult,
      stdinAvailable: true,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, true);
    assertEquals(validationResult.values.command, "find bugs");
    assertEquals(validationResult.values.stdinAvailable, true);
  });

  await t.step("should handle input option scenario", () => {
    const result = parser.parse(["find", "bugs", "--input", "project"]);

    assertEquals(result.type, "three");

    const threeResult = result as ThreeParamsResult;

    const paramsWithStdin = {
      ...threeResult,
      stdinAvailable: false,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, true);
    assertEquals(validationResult.values.command, "find bugs");
    assertEquals(validationResult.values.input, "project");
  });

  await t.step("should handle conflicting options properly", () => {
    const testFile = "tests/fixtures/test_input.js";
    const result = parser.parse(["find", "bugs", "--from", testFile, "--input", "project"]);

    assertEquals(result.type, "three");

    const threeResult = result as ThreeParamsResult;

    const paramsWithStdin = {
      ...threeResult,
      stdinAvailable: false,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, false);
    assertExists(validationResult.errorMessage);
    assertEquals(
      validationResult.errorMessage?.includes("Cannot use --from and --input together"),
      true,
    );
  });
});

Deno.test("EnhancedParamsParser Integration - Compatibility", async (t) => {
  const parser = new EnhancedParamsParser();
  const validator = new CommandOptionsValidator();

  await t.step("should work with existing two-word commands", () => {
    const result = parser.parse(["to", "project"]);

    assertEquals(result.type, "two");

    // Standard validation should still work
    const paramsWithStdin = {
      ...result,
      stdinAvailable: true,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, true);
  });

  await t.step("should work with one-word commands", () => {
    const result = parser.parse(["init"]);

    assertEquals(result.type, "one");

    const paramsWithStdin = {
      ...result,
      stdinAvailable: false,
    };

    const validationResult = validator.validate(paramsWithStdin);

    assertEquals(validationResult.success, true);
  });

  await t.step("should work with zero-word commands (help/version)", () => {
    const result = parser.parse(["--help"]);

    assertEquals(result.type, "zero");
    // Zero commands typically bypass validation
  });
});

Deno.test("EnhancedParamsParser Integration - Error Handling", async (t) => {
  const parser = new EnhancedParamsParser();

  await t.step("should handle unknown commands gracefully", () => {
    const result = parser.parse(["unknown", "command", "here"]);

    // Should be handled by base parser, likely returning an error
    assertEquals(result.type === "error" || result.type !== "three", true);
  });

  await t.step("should handle malformed arguments", () => {
    const result = parser.parse(["find"]);

    // Single "find" should not match three-word pattern
    assertEquals(result.type !== "three", true);
  });
});
