// CLI parameter validation Strategy pattern tests
// CommandOptionsValidator, NoParamsCommandValidator, SingleCommandValidator, DoubleCommandValidator
// - Normal and error case skeletons
// - State test intent and target in JSDoc

import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { CommandOptionsValidator } from "../../../lib/cli/validators/command_options_validator.ts";
import {
  DoubleParamValidationErrorCode,
  DoubleParamValidationStep,
} from "../../../lib/cli/validators/double_command_validator.ts";

/**
 * Test: NoParamsCommandValidator (help/version)
 */
Deno.test("NoParams: help flag", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({ type: "no-params", help: true });
  assertEquals(result.success, true);
  assertEquals(result.step, DoubleParamValidationStep.COMPLETE);
});

Deno.test("NoParams: error on invalid usage", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({ type: "no-params" });
  assertEquals(result.success, false);
  assertEquals(
    result.errorMessage,
    "No command or invalid parameters provided. Use --help for usage.",
  );
  assertEquals(result.errorCode, DoubleParamValidationErrorCode.UNKNOWN);
});

/**
 * Test: SingleCommandValidator (init)
 */
Deno.test("Single: init command", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({ type: "single", command: "init" });
  assertEquals(result.success, true);
  assertEquals(result.step, DoubleParamValidationStep.COMPLETE);
  assertEquals(result.values.command, "init");
});

Deno.test("Single: error on invalid single command", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({ type: "single", command: "foo" });
  assertEquals(result.success, false);
  assertEquals(result.errorCode, DoubleParamValidationErrorCode.INVALID_INPUT_TYPE);
  assertEquals(result.errorMessage, "Invalid single command. Only 'init' is supported.");
});

/**
 * Test: DoubleCommandValidator (normal cases)
 */
Deno.test("Double: --from and --destination", async () => {
  const validator = new CommandOptionsValidator();
  // Create a temporary file for --from
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, "dummy");
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { from: tempFile, destination: "out.txt" },
    stdinAvailable: false,
  });
  assertEquals(result.success, true);
  await Deno.remove(tempFile);
});

Deno.test("Double: only --input, no stdin", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { input: "project" },
    stdinAvailable: false,
  });
  assertEquals(result.success, true);
  assertEquals(result.step, DoubleParamValidationStep.COMPLETE);
  assertEquals(result.values.input, "project");
});

Deno.test("Double: only stdin", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    stdinAvailable: true,
  });
  assertEquals(result.success, true);
  assertEquals(result.step, DoubleParamValidationStep.COMPLETE);
  assertEquals(result.values.from, undefined);
  assertEquals(result.values.input, undefined);
});

/**
 * Test: DoubleCommandValidator (error cases)
 */
Deno.test("Double: error on both --from and --input", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { from: "foo.md", input: "project" },
    stdinAvailable: false,
  });
  assertEquals(result.success, false);
  assertEquals(result.errorCode, DoubleParamValidationErrorCode.CONFLICTING_OPTIONS);
  assertEquals(result.errorMessage, "Cannot use --from and --input together");
});

Deno.test("Double: error on missing --from, --input, and stdin", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    stdinAvailable: false,
  });
  assertEquals(result.success, false);
  assertEquals(result.errorCode, DoubleParamValidationErrorCode.MISSING_INPUT);
  assertEquals(result.errorMessage, "Invalid input parameters: missing --from, --input, or STDIN");
});

Deno.test("Double: error on --from without --destination", async () => {
  const validator = new CommandOptionsValidator();
  // Create a temporary file for --from
  const tempFile = await Deno.makeTempFile();
  await Deno.writeTextFile(tempFile, "dummy");
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { from: tempFile },
    stdinAvailable: false,
  });
  assertEquals(result.success, false);
  assertEquals(result.errorCode, DoubleParamValidationErrorCode.MISSING_DESTINATION);
  await Deno.remove(tempFile);
});

Deno.test("Double: error on invalid --input type", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { input: "invalid" },
    stdinAvailable: false,
  });
  assertEquals(result.success, false);
  assertEquals(result.errorCode, DoubleParamValidationErrorCode.INVALID_INPUT_TYPE);
  assertEquals(result.errorMessage, "Invalid input layer type: invalid");
});
