// CLIパラメータバリデーションのStrategyパターンテスト
// CommandOptionsValidator, NoParamsCommandValidator, SingleCommandValidator, DoubleCommandValidator
// - 正常系・異常系のスケルトン
// - テスト意図・対象をJSDocで明記

import { assertEquals, assertThrows } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { CommandOptionsValidator } from "../../../lib/cli/validators/command_options_validator.ts";

/**
 * Test: NoParamsCommandValidator (help/version)
 */
Deno.test("NoParams: help flag", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({ type: "no-params", help: true });
  assertEquals(result, {});
});

Deno.test("NoParams: invalid usage throws", () => {
  const validator = new CommandOptionsValidator();
  assertThrows(
    () => validator.validate({ type: "no-params" }),
    Error,
    "No command or invalid parameters",
  );
});

/**
 * Test: SingleCommandValidator (init)
 */
Deno.test("Single: init command", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({ type: "single", command: "init" });
  assertEquals(result, { demonstrative: "init" });
});

Deno.test("Single: invalid single command throws", () => {
  const validator = new CommandOptionsValidator();
  assertThrows(
    () => validator.validate({ type: "single", command: "foo" }),
    Error,
    "Invalid single command",
  );
});

/**
 * Test: DoubleCommandValidator (正常系)
 */
Deno.test("Double: --from + --destination", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { from: "foo.md", destination: "bar.md" },
    stdinAvailable: false,
  });
  assertEquals(result.from, "foo.md");
  assertEquals(result.destination, "bar.md");
});

Deno.test("Double: --inputのみ + stdin無し", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: { input: "project" },
    stdinAvailable: false,
  });
  assertEquals(result.input, "project");
});

Deno.test("Double: stdinのみ", () => {
  const validator = new CommandOptionsValidator();
  const result = validator.validate({
    type: "double",
    demonstrativeType: "to",
    layerType: "project",
    options: {},
    stdinAvailable: true,
  });
  assertEquals(result.from, undefined);
  assertEquals(result.input, undefined);
});

/**
 * Test: DoubleCommandValidator (異常系)
 */
Deno.test("Double: --fromと--input同時指定はエラー", () => {
  const validator = new CommandOptionsValidator();
  assertThrows(
    () =>
      validator.validate({
        type: "double",
        demonstrativeType: "to",
        layerType: "project",
        options: { from: "foo.md", input: "project" },
        stdinAvailable: false,
      }),
    Error,
    "Cannot use --from and --input together",
  );
});

Deno.test("Double: --from/--input/STDINいずれも無しはエラー", () => {
  const validator = new CommandOptionsValidator();
  assertThrows(
    () =>
      validator.validate({
        type: "double",
        demonstrativeType: "to",
        layerType: "project",
        options: {},
        stdinAvailable: false,
      }),
    Error,
    "missing --from, --input, or STDIN",
  );
});

Deno.test("Double: --from指定時に--destination無しはエラー", () => {
  const validator = new CommandOptionsValidator();
  assertThrows(
    () =>
      validator.validate({
        type: "double",
        demonstrativeType: "to",
        layerType: "project",
        options: { from: "foo.md" },
        stdinAvailable: false,
      }),
    Error,
    "missing --destination for --from",
  );
});

Deno.test("Double: --input型不正はエラー", () => {
  const validator = new CommandOptionsValidator();
  assertThrows(
    () =>
      validator.validate({
        type: "double",
        demonstrativeType: "to",
        layerType: "project",
        options: { input: "invalid" },
        stdinAvailable: false,
      }),
    Error,
    "Invalid input layer type",
  );
});
