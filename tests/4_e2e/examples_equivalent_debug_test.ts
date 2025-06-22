/**
 * Debug Test for Examples Equivalent
 *
 * 実際のエラーメッセージを確認するためのデバッグテスト
 */

import { assertEquals } from "jsr:@std/assert";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^1.0.0";

const debugLogger = new BreakdownLogger("debug");

interface CommandResult {
  success: boolean;
  output: string;
  error: string;
}

async function runBreakdownCommand(
  args: string[],
  input?: string,
): Promise<CommandResult> {
  const breakdownPath = new URL("../../cli/breakdown.ts", import.meta.url).pathname;

  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-all", breakdownPath, ...args],
    stdout: "piped",
    stderr: "piped",
    stdin: input ? "piped" : "null",
  });

  try {
    const process = command.spawn();

    if (input && process.stdin) {
      const writer = process.stdin.getWriter();
      await writer.write(new TextEncoder().encode(input));
      await writer.close();
    }

    const result = await process.output();
    const { code, stdout, stderr } = result;
    const output = new TextDecoder().decode(stdout);
    const error = new TextDecoder().decode(stderr);

    return {
      success: code === 0,
      output: output.trim(),
      error: error.trim(),
    };
  } catch (err) {
    return {
      success: false,
      output: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

Deno.test("Debug: 実際のエラーメッセージ確認", async () => {
  debugLogger.info("実際のエラーメッセージを確認", {
    purpose: "どのようなエラーメッセージが出力されるかを確認",
  });

  const result = await runBreakdownCommand(
    ["to", "issue"],
    "# Test Project\nSample project for testing",
  );

  debugLogger.info("実際の結果", {
    success: result.success,
    outputLength: result.output.length,
    errorLength: result.error.length,
    output: result.output.substring(0, 200),
    error: result.error.substring(0, 500),
  });

  debugLogger.debug("=== FULL OUTPUT ===", { output: result.output });
  debugLogger.debug("=== FULL ERROR ===", { error: result.error });
  debugLogger.debug("=== END ===");

  // 何らかの結果が返ることを確認
  assertEquals(typeof result.success, "boolean");
});
