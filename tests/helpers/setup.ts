import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { exists, join } from "$deps/mod.ts";

export interface TestEnvironment {
  workingDir: string;
  logger: BreakdownLogger;
  originalLogLevel?: string;
}

/**
 * Sets up test environment with logging and directory structure
 * Following docs/breakdown/testing.ja.md specifications:
 * - Uses LOG_LEVEL environment variable for log level control
 * - Defaults to "info" if not specified
 * - Supports debug, info, warn, and error levels
 */
export async function setupTestEnvironment(options: {
  workingDir: string;
}): Promise<TestEnvironment> {
  // Store original log level
  const originalLogLevel = Deno.env.get("LOG_LEVEL");

  // Initialize logger with environment-controlled log level
  // Default to "info" unless explicitly set to "debug"
  const logLevel = Deno.env.get("LOG_LEVEL") === "debug" ? LogLevel.DEBUG : LogLevel.INFO;
  const logger = new BreakdownLogger({ initialLevel: logLevel });

  // Only output setup logs if in debug mode
  if (logLevel === LogLevel.DEBUG) {
    logger.debug("Setting up test environment", { workingDir: options.workingDir, logLevel });
  }

  // Clean up existing test directory
  try {
    if (await exists(options.workingDir)) {
      await Deno.remove(options.workingDir, { recursive: true });
      if (logLevel === LogLevel.DEBUG) {
        logger.debug("Removed existing test directory", { dir: options.workingDir });
      }
    }
  } catch (error) {
    if (logLevel === LogLevel.DEBUG) {
      logger.debug("Error removing existing directory", { error: String(error) });
    }
  }

  // Create test directory and required subdirectories
  const requiredDirs = [
    options.workingDir,
    join(options.workingDir, "breakdown"),
    join(options.workingDir, "breakdown", "projects"),
    join(options.workingDir, "breakdown", "issues"),
    join(options.workingDir, "breakdown", "tasks"),
    join(options.workingDir, "breakdown", "temp"),
    join(options.workingDir, "breakdown", "config"),
    join(options.workingDir, "breakdown", "prompts"),
    join(options.workingDir, "breakdown", "schema"),
    "tmp/test/commands-init/breakdown",
    "tmp/test/commands-custom/custom",
    "tmp/test/commands-project/output",
    "tmp/test/commands-issue",
    "tmp/test/config/breakdown/config",
    "tmp/test/config-custom/breakdown/config",
    "tmp/test_path_resolver/project",
    "tmp/test_path_resolver/issue",
    "tmp/test/setup/breakdown",
    "tmp/test/init-custom/custom/breakdown",
    "tmp/test_prompt_processor/invalid/type",
    "tmp/test/logger",
  ];

  for (const dir of requiredDirs) {
    try {
      await Deno.mkdir(dir, { recursive: true });
      // Verify directory was created
      const exists = await Deno.stat(dir).then(
        (stat) => stat.isDirectory,
        () => false,
      );
      if (!exists) {
        throw new Error(`Failed to create directory: ${dir}`);
      }
      if (logLevel === LogLevel.DEBUG) {
        logger.debug("Created directory", { dir });
      }
    } catch (error) {
      if (logLevel === LogLevel.DEBUG) {
        logger.debug("Error creating directory", { dir, error: String(error) });
      }
      throw error;
    }
  }

  return { workingDir: options.workingDir, logger, originalLogLevel };
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
export async function runCommand(args: string[], stdin?: string): Promise<{
  success: boolean;
  output: string;
  error: string;
}> {
  const timeout = parseInt(Deno.env.get("TEST_TIMEOUT") || "5000");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        "run",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-run",
        "--allow-net",
        join(Deno.cwd(), "cli/breakdown.ts"),
        ...args,
      ],
      stdout: "piped",
      stderr: "piped",
      stdin: stdin ? "piped" : undefined,
      cwd: Deno.cwd(),
      env: {
        ...Deno.env.toObject(),
        NO_COLOR: "1", // Disable color output for consistent test results
        DENO_DIR: join(Deno.cwd(), ".deno"), // Use local deno directory
      },
      signal: controller.signal,
    });

    const childProcess = command.spawn();

    if (stdin) {
      const writer = childProcess.stdin.getWriter();
      await writer.write(new TextEncoder().encode(stdin));
      await writer.close();
    }

    const { success, stdout, stderr } = await childProcess.output();
    clearTimeout(timeoutId);

    return {
      success,
      output: new TextDecoder().decode(stdout).trim(),
      error: new TextDecoder().decode(stderr).trim(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        success: false,
        output: "",
        error: `Command timed out after ${timeout}ms`,
      };
    }
    throw error;
  }
}
