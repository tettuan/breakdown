import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();

/**
 * Asserts that a configuration object is valid
 */
export function assertValidConfig(config: unknown): void {
  logger.debug("Validating config", { config });
  assertExists(config, "Config should not be null or undefined");

  const configObj = config as Record<string, unknown>;
  assertExists(configObj.working_dir, "Config should have working_dir");
  assertExists(configObj.app_prompt, "Config should have app_prompt");
  assertExists(configObj.app_schema, "Config should have app_schema");
}

/**
 * Asserts that two configs are equal
 */
export function assertConfigEquals(actual: unknown, expected: unknown): void {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `Configs are not equal:\nActual: ${JSON.stringify(actual)}\nExpected: ${
      JSON.stringify(expected)
    }`,
  );
}

/**
 * Asserts that a prompt is valid
 */
export function assertValidPrompt(prompt: unknown): void {
  assert(typeof prompt === "string", "Prompt must be a string");
  const promptStr = prompt as string;
  assert(promptStr.length > 0, "Prompt cannot be empty");
}

/**
 * Asserts that a prompt contains expected content
 */
export function assertPromptContains(prompt: string, expected: string): void {
  assert(
    prompt.includes(expected),
    `Prompt does not contain expected content:\nPrompt: ${prompt}\nExpected: ${expected}`,
  );
}

/**
 * Asserts that a directory exists
 */
export async function assertDirectoryExists(path: string): Promise<void> {
  logger.debug("Checking directory exists", { path });
  const exists = await Deno.stat(path).then(
    (stat) => stat.isDirectory,
    () => false,
  );
  assertEquals(exists, true, `Directory does not exist: ${path}`);
}

/**
 * Asserts that a file exists
 */
export async function assertFileExists(path: string): Promise<void> {
  logger.debug("Checking file exists", { path });
  const exists = await Deno.stat(path).then(
    (stat) => stat.isFile,
    () => false,
  );
  assertEquals(exists, true, `File does not exist: ${path}`);
}

/**
 * Asserts that a command was successful
 */
export function assertCommandSuccess(result: { output: string; error: string }): void {
  logger.debug("Checking command success", { result });
  assertEquals(result.error, "", "Command should not have error output");
}

/**
 * Asserts that command output matches expected values
 */
export function assertCommandOutput(
  result: { output: string; error: string },
  expected: { output?: string; error?: string },
): void {
  logger.debug("Checking command output", { result, expected });

  if (expected.output !== undefined) {
    assert(
      result.output.includes(expected.output),
      `Command output does not contain expected: ${expected.output}\nActual output: ${result.output}`,
    );
  }

  if (expected.error !== undefined) {
    assert(
      result.error.includes(expected.error),
      `Command error does not contain expected: ${expected.error}\nActual error: ${result.error}`,
    );
  }
}
