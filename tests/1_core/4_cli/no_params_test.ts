import { assertEquals, assertStringIncludes } from "@std/assert";
import { HELP_TEXT as EXPECTED_HELP_TEXT } from "../../../cli/breakdown.ts"; // Adjust path as necessary
import { fromFileUrl } from "@std/path/from-file-url";

const TEST_VERSION_STRING = "Breakdown v1.0.5";

async function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  const resolvedUrl = import.meta.resolve("../../../cli/breakdown.ts");
  const cliPath = fromFileUrl(resolvedUrl);
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A", // Allow all permissions, adjust if more fine-grained control is needed for tests
      cliPath, // Use the converted system path
      ...args,
    ],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await command.output();
  return {
    code,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
  };
}

Deno.test("CLI no-params: --version flag", async () => {
  const { stdout, code } = await runCli(["--version"]);
  assertEquals(code, 0);
  assertStringIncludes(stdout, TEST_VERSION_STRING);
});

Deno.test("CLI no-params: -v flag", async () => {
  const { stdout, code } = await runCli(["-v"]);
  assertEquals(code, 0);
  assertStringIncludes(stdout, TEST_VERSION_STRING);
});

Deno.test("CLI no-params: --help flag", async () => {
  const { stdout, code } = await runCli(["--help"]);
  assertEquals(code, 0);
  // Trim both to handle potential trailing/leading whitespace differences
  assertEquals(stdout.trim(), EXPECTED_HELP_TEXT.trim());
});

Deno.test("CLI no-params: -h flag", async () => {
  const { stdout, code } = await runCli(["-h"]);
  assertEquals(code, 0);
  assertEquals(stdout.trim(), EXPECTED_HELP_TEXT.trim());
});

Deno.test("CLI no-params: no arguments", async () => {
  const { stdout, code } = await runCli([]);
  assertEquals(code, 0);
  assertEquals(stdout.trim(), EXPECTED_HELP_TEXT.trim());
});
