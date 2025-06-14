import { assertEquals, assertThrows } from "@std/assert";
import { getOptionValue, parseArgs, validateCommandOptions } from "../../../lib/cli/args.ts";

Deno.test("parseArgs: parses required --from and --destination", () => {
  const args = ["--from", "input.md", "--destination", "output.md"];
  const result = parseArgs(args);
  assertEquals(result.from, "input.md");
  assertEquals(result.destination, "output.md");
});

Deno.test("parseArgs: throws on missing required options", () => {
  assertThrows(() => parseArgs([]), Error, "missing --from or --input");
});

Deno.test("parseArgs: throws on conflicting --from and --input", () => {
  assertThrows(
    () => parseArgs(["--from", "a.md", "--input", "project"]),
    Error,
    "Cannot use --from and --input together",
  );
});

Deno.test("parseArgs: throws on duplicate option", () => {
  assertThrows(
    () => parseArgs(["--from", "a.md", "--from", "b.md", "--destination", "out.md"]),
    Error,
    "Duplicate option: --from",
  );
});

Deno.test("parseArgs: throws on invalid input type", () => {
  assertThrows(() => parseArgs(["--input", "invalid"]), Error, "Invalid input layer type");
});

Deno.test("parseArgs: parses adaptation and promptDir", () => {
  const args = [
    "--from",
    "a.md",
    "--destination",
    "b.md",
    "--adaptation",
    "strict",
    "--prompt-dir",
    "prompts",
  ];
  const result = parseArgs(args);
  assertEquals(result.adaptation, "strict");
  assertEquals(result.promptDir, "prompts");
});

Deno.test("validateCommandOptions: parses short and long options", () => {
  const args = ["-f", "a.md", "-o", "b.md", "-a", "strict", "--prompt-dir", "prompts"];
  const result = validateCommandOptions(args);
  assertEquals(result.from, "a.md");
  assertEquals(result.destination, "b.md");
  assertEquals(result.adaptation, "strict");
  assertEquals(result.promptDir, "prompts");
});

Deno.test("validateCommandOptions: throws on duplicate", () => {
  assertThrows(
    () => validateCommandOptions(["--from", "a.md", "--from", "b.md"]),
    Error,
    "Duplicate option: --from",
  );
});

Deno.test("validateCommandOptions: throws on conflicting", () => {
  assertThrows(
    () => validateCommandOptions(["--from", "a.md", "--input", "project"]),
    Error,
    "Cannot use --from and --input together",
  );
});

Deno.test("getOptionValue: returns value for long and short", () => {
  const args = ["--from", "a.md", "-o", "b.md"];
  assertEquals(getOptionValue(args, "--from"), "a.md");
  assertEquals(getOptionValue(args, "--destination"), "b.md");
});

Deno.test("getOptionValue: returns undefined if not found", () => {
  const args = ["--from", "a.md"];
  assertEquals(getOptionValue(args, "--destination"), undefined);
});
