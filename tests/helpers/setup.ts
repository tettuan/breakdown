import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { join } from "jsr:@std/path/join";
import { exists } from "jsr:@std/fs/exists";

export interface TestEnvironmentOptions {
  workingDir?: string;
  logLevel?: LogLevel;
  skipDefaultConfig?: boolean;
}

export interface TestEnvironment {
  workingDir: string;
  logger: BreakdownLogger;
  logLevel: LogLevel;
  originalLogLevel?: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error: string;
}

/**
 * Sets up test environment with logging and directory structure
 * Following docs/breakdown/testing.ja.md specifications:
 * - Uses LOG_LEVEL environment variable for log level control
 * - Defaults to "info" if not specified
 * - Supports debug, info, warn, and error levels
 */
export async function setupTestEnvironment(options: TestEnvironmentOptions = {}): Promise<TestEnvironment> {
  const workingDir = options.workingDir || "./tmp/test";
  const logLevel = options.logLevel || LogLevel.DEBUG;

  // Create test directories
  await Deno.mkdir(workingDir, { recursive: true });

  // Create .agent/breakdown/config directory
  const configDir = join(workingDir, ".agent", "breakdown", "config");
  await Deno.mkdir(configDir, { recursive: true });

  // Create breakdown/prompts and breakdown/schema directories
  const breakdownDir = join(workingDir, ".agent", "breakdown");
  await Deno.mkdir(join(breakdownDir, "prompts"), { recursive: true });
  await Deno.mkdir(join(breakdownDir, "schema"), { recursive: true });

  // Create default app.yml if it doesn't exist
  const appConfigPath = join(configDir, "app.yml");
  if (!options.skipDefaultConfig) {
    await Deno.writeTextFile(
      appConfigPath,
      `working_dir: ${workingDir}/.agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schema
`
    );
  }

  // Set up logger
  const logger = new BreakdownLogger();
  logger.setLogLevel(logLevel);

  return {
    workingDir,
    logLevel,
    logger,
  };
}

/**
 * Cleans up test environment and restores original settings
 */
export async function cleanupTestEnvironment(env: TestEnvironment): Promise<void> {
  try {
    // Restore original log level if it exists
    if (env.originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", env.originalLogLevel);
    } else {
      Deno.env.delete("LOG_LEVEL");
    }

    // Clean up test directory
    try {
      await Deno.remove(env.workingDir, { recursive: true });
    } catch (error) {
      console.error("Error cleaning up test directory:", error);
    }
  } catch (error) {
    console.error("Error during test environment cleanup:", error);
  }
}

/**
 * Runs a command and returns the result
 */
export async function runCommand(args: string[], stdin?: string): Promise<CommandResult> {
  const breakdownPath = new URL("../../cli/breakdown.ts", import.meta.url).pathname;
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-all", breakdownPath, ...args],
    stdout: "piped",
    stderr: "piped",
    stdin: stdin ? "piped" : undefined,
  });

  try {
    let process;
    if (stdin) {
      process = command.spawn();
      const writer = process.stdin.getWriter();
      await writer.write(new TextEncoder().encode(stdin));
      await writer.close();
      const { code, stdout, stderr } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);
      return {
        success: code === 0,
        output: output.trim(),
        error: error.trim(),
      };
    } else {
      const { code, stdout, stderr } = await command.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);
      return {
        success: code === 0,
        output: output.trim(),
        error: error.trim(),
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      output: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
