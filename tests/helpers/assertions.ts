import { assert, assertExists } from "$std/testing/asserts.ts";
import { exists } from "$std/fs/exists.ts";
import { join } from "$std/path/mod.ts";

/**
 * Asserts that a configuration object is valid
 */
export function assertValidConfig(config: unknown): void {
  assert(config !== null && typeof config === "object", "Config must be an object");
  const conf = config as Record<string, unknown>;
  
  // Check required fields
  assertExists(conf.working_dir, "Config must have working_dir");
  assertExists(conf.prompt_dir, "Config must have prompt_dir");
  assertExists(conf.schema_dir, "Config must have schema_dir");
}

/**
 * Asserts that two configs are equal
 */
export function assertConfigEquals(actual: unknown, expected: unknown): void {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `Configs are not equal:\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`
  );
}

/**
 * Asserts that a prompt is valid
 */
export function assertValidPrompt(prompt: unknown): void {
  assert(typeof prompt === "string", "Prompt must be a string");
  assert(prompt.length > 0, "Prompt cannot be empty");
}

/**
 * Asserts that a prompt contains expected content
 */
export function assertPromptContains(prompt: string, expected: string): void {
  assert(
    prompt.includes(expected),
    `Prompt does not contain expected content:\nPrompt: ${prompt}\nExpected: ${expected}`
  );
}

/**
 * Asserts that a path exists
 */
export async function assertFileExists(filePath: string): Promise<void> {
  assert(
    await exists(filePath),
    `File does not exist: ${filePath}`
  );
}

/**
 * Asserts that a directory exists
 */
export async function assertDirectoryExists(dirPath: string): Promise<void> {
  assert(
    await exists(dirPath),
    `Directory does not exist: ${dirPath}`
  );
}

/**
 * Asserts that a command output matches expectations
 */
export function assertCommandOutput(
  actual: { output: string; error: string },
  expected: { output?: string; error?: string }
): void {
  if (expected.output !== undefined) {
    assert(
      actual.output.includes(expected.output),
      `Command output does not match:\nActual: ${actual.output}\nExpected to include: ${expected.output}`
    );
  }
  
  if (expected.error !== undefined) {
    assert(
      actual.error.includes(expected.error),
      `Command error does not match:\nActual: ${actual.error}\nExpected to include: ${expected.error}`
    );
  }
} 