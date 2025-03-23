import { exists } from "$std/fs/exists.ts";
import { ensureDir } from "$std/fs/ensure_dir.ts";
import { join } from "$std/path/mod.ts";
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";

/**
 * Test environment configuration
 */
export interface TestEnvironment {
  testDir: string;
  fixturesDir: string;
  workingDir: string;
  logger: BreakdownLogger;
}

/**
 * Test environment setup options
 */
export interface TestOptions {
  workingDir?: string;
  logLevel?: LogLevel;
}

/**
 * Default test environment configuration
 */
const DEFAULT_TEST_ENV: Omit<TestEnvironment, "logger"> = {
  testDir: ".test",
  fixturesDir: "tests/fixtures",
  workingDir: ".test/working",
};

/**
 * Sets up the test environment
 * Creates necessary directories and initializes logger
 */
export async function setupTestEnvironment(options: TestOptions = {}): Promise<TestEnvironment> {
  const env: TestEnvironment = {
    ...DEFAULT_TEST_ENV,
    workingDir: options.workingDir || DEFAULT_TEST_ENV.workingDir,
    logger: new BreakdownLogger({
      initialLevel: options.logLevel || LogLevel.ERROR,
    }),
  };

  // Create test directories
  await ensureDir(env.testDir);
  await ensureDir(env.workingDir);
  await ensureDir(env.fixturesDir);

  env.logger.debug("Test environment setup completed", env);
  return env;
}

/**
 * Cleans up the test environment
 * Removes test directories and closes logger
 */
export async function cleanupTestEnvironment(env: TestEnvironment): Promise<void> {
  try {
    await Deno.remove(env.testDir, { recursive: true });
    env.logger.debug("Test environment cleanup completed");
  } catch (error) {
    env.logger.error("Error during cleanup:", error);
  }
}

/**
 * Sets up test prompt and schema files
 */
export async function setupTestPromptAndSchemaFiles(testDir: string): Promise<void> {
  const promptDir = join(testDir, "prompts");
  const schemaDir = join(testDir, "schemas");
  
  await ensureDir(promptDir);
  await ensureDir(schemaDir);
  
  // Create sample prompt file
  await Deno.writeTextFile(
    join(promptDir, "sample.md"),
    "# Sample Prompt\n\n## Description\nThis is a sample prompt for testing."
  );
  
  // Create sample schema file
  await Deno.writeTextFile(
    join(schemaDir, "sample.yml"),
    "type: object\nproperties:\n  name:\n    type: string"
  );
}

/**
 * Runs a command and returns its output
 */
export async function runCommand(args: string[]): Promise<{ output: string; error: string }> {
  const command = new Deno.Command("deno", {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  const { stdout, stderr } = await command.output();
  
  return {
    output: new TextDecoder().decode(stdout),
    error: new TextDecoder().decode(stderr),
  };
} 