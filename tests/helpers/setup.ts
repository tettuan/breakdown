import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { join } from "@std/path/join";

/**
 * Parses log level string to LogLevel enum
 */
function parseLogLevel(level: string | undefined): LogLevel | undefined {
  if (!level) return undefined;

  switch (level.toLowerCase()) {
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    default:
      return undefined;
  }
}

/**
 * Sets LOG_LEVEL environment variable based on LogLevel enum
 */
function setLogLevel(level: LogLevel): void {
  let envValue: string;
  switch (level) {
    case LogLevel.DEBUG:
      envValue = "debug";
      break;
    case LogLevel.INFO:
      envValue = "info";
      break;
    case LogLevel.WARN:
      envValue = "warn";
      break;
    case LogLevel.ERROR:
      envValue = "error";
      break;
    default:
      envValue = "info";
  }
  Deno.env.set("LOG_LEVEL", envValue);
}

export interface TestEnvironmentOptions {
  workingDir?: string;
  logLevel?: LogLevel;
  skipDefaultConfig?: boolean;
  skipDirectorySetup?: boolean;
  configSetName?: string;
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
export async function setupTestEnvironment(
  options: TestEnvironmentOptions = {},
): Promise<TestEnvironment> {
  const workingDir = options.workingDir || "./tmp/test";

  // Set up logger early so it can be used throughout the function
  const logger = new BreakdownLogger("setup");

  // Save original LOG_LEVEL to restore later
  const originalLogLevel = Deno.env.get("LOG_LEVEL");

  // Determine log level from options or environment variable
  let logLevel: LogLevel;
  if (options.logLevel !== undefined) {
    logLevel = options.logLevel;
    // Set environment variable to match the requested log level
    setLogLevel(logLevel);
  } else {
    // Get from environment variable or default to INFO
    const envLogLevel = Deno.env.get("LOG_LEVEL");
    logLevel = parseLogLevel(envLogLevel) || LogLevel.INFO;
  }

  // Create test directories only if not skipped
  if (!options.skipDirectorySetup) {
    // Create test directories with proper permissions
    await Deno.mkdir(workingDir, { recursive: true, mode: 0o777 });

    // Create required directory structure
    const configDir = join(workingDir, ".agent", "breakdown", "config");
    const promptsDir = join(workingDir, "prompts");
    const schemaDir = join(workingDir, "schema");

    await Deno.mkdir(configDir, { recursive: true, mode: 0o777 });
    await Deno.mkdir(promptsDir, { recursive: true, mode: 0o777 });
    await Deno.mkdir(schemaDir, { recursive: true, mode: 0o777 });

    // Create find bugs prompt directories and files
    const findBugsDir = join(promptsDir, "find", "bugs");
    await Deno.mkdir(findBugsDir, { recursive: true, mode: 0o777 });

    // Create base find bugs prompt
    const findBugsPrompt = `# Find Bugs Analysis

Analyze the provided code to identify potential bugs and issues.

## Code to Analyze
{CODE}

## Analysis Output
Provide a detailed analysis of bugs found.`;
    await Deno.writeTextFile(join(findBugsDir, "base.md"), findBugsPrompt);

    // Create config files based on configSetName or default
    if (!options.skipDefaultConfig) {
      if (options.configSetName) {
        // Create config files with the specified name
        const appConfigPath = join(configDir, `${options.configSetName}-app.yml`);
        const userConfigPath = join(configDir, `${options.configSetName}-user.yml`);

        const appConfigContent =
          `working_dir: ${workingDir}\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`;
        const userConfigContent = `# User configuration for ${options.configSetName}\n`;

        await Deno.writeTextFile(appConfigPath, appConfigContent);
        await Deno.writeTextFile(userConfigPath, userConfigContent);

        logger.debug("Created config files", {
          configSetName: options.configSetName,
          appConfig: appConfigPath,
          userConfig: userConfigPath,
        });
      } else {
        // Create default app.yml
        const configPath = join(configDir, "app.yml");
        const configContent =
          `working_dir: ${workingDir}\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`;
        await Deno.writeTextFile(configPath, configContent);
      }
    }
  } else {
    // Only create the base working directory
    await Deno.mkdir(workingDir, { recursive: true, mode: 0o777 });
  }

  // BreakdownLogger v1.0.0 uses LOG_LEVEL environment variable automatically

  return {
    workingDir,
    logLevel,
    logger,
    originalLogLevel,
  };
}

/**
 * Recursively restores write permissions to a directory and its contents
 * @param path The path to restore permissions for
 */
async function restoreWritePermissions(path: string): Promise<void> {
  const logger = new BreakdownLogger("setup-permissions");
  try {
    const info = await Deno.stat(path);
    if (info.isDirectory) {
      await Deno.chmod(path, 0o755); // rwxr-xr-x
      for await (const entry of Deno.readDir(path)) {
        await restoreWritePermissions(join(path, entry.name));
      }
    } else {
      await Deno.chmod(path, 0o644); // rw-r--r--
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      logger.error("Permission restore failed", { path, error });
    }
  }
}

/**
 * Cleans up test environment and restores original settings
 */
export async function cleanupTestEnvironment(env: TestEnvironment): Promise<void> {
  const logger = new BreakdownLogger("setup-cleanup");
  try {
    // Restore original log level if it exists
    if (env.originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", env.originalLogLevel);
    } else {
      Deno.env.delete("LOG_LEVEL");
    }

    // Clean up test directory
    try {
      // First restore write permissions to all files and directories
      await restoreWritePermissions(env.workingDir);
      // Then remove the directory
      await Deno.remove(env.workingDir, { recursive: true });
    } catch (error) {
      logger.error("Error cleaning up test directory", { workingDir: env.workingDir, error });
    }
  } catch (error) {
    logger.error("Error during test environment cleanup", { error });
  }
}

/**
 * Global cleanup for all temporary test artifacts
 * Automatically removes all remaining test files in tmp/ directory
 * Should be called at the end of test suites to prevent accumulation
 */
export async function globalTestCleanup(): Promise<void> {
  const logger = new BreakdownLogger("global-cleanup");
  const tmpDir = "tmp";

  try {
    const stat = await Deno.stat(tmpDir);
    if (stat.isDirectory) {
      const size = await getTmpDirectorySize(tmpDir);
      logger.debug("Starting global test cleanup", {
        tmpDir,
        sizeKB: Math.round(size / 1024),
      });

      // Restore write permissions recursively
      await restoreWritePermissions(tmpDir);

      // Remove all contents but keep the directory
      // Skip example_results directory to preserve example outputs
      for await (const entry of Deno.readDir(tmpDir)) {
        if (entry.name === "example_results") {
          logger.debug("Skipping example_results directory", { path: join(tmpDir, entry.name) });
          continue;
        }
        
        const entryPath = join(tmpDir, entry.name);
        try {
          await Deno.remove(entryPath, { recursive: true });
          logger.debug("Removed test artifact", { path: entryPath });
        } catch (error) {
          logger.warn("Failed to remove test artifact", { path: entryPath, error });
        }
      }

      const finalSize = await getTmpDirectorySize(tmpDir);
      logger.info("Global test cleanup completed", {
        tmpDir,
        removedKB: Math.round((size - finalSize) / 1024),
        remainingKB: Math.round(finalSize / 1024),
      });
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      logger.debug("No tmp directory to clean up");
    } else {
      logger.error("Error during global test cleanup", { error });
    }
  }
}

/**
 * Calculate directory size in bytes
 */
async function getTmpDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    for await (const entry of Deno.readDir(dirPath)) {
      const entryPath = join(dirPath, entry.name);
      const stat = await Deno.stat(entryPath);

      if (stat.isFile) {
        totalSize += stat.size;
      } else if (stat.isDirectory) {
        totalSize += await getTmpDirectorySize(entryPath);
      }
    }
  } catch (_error) {
    // Ignore errors for individual files/directories
  }

  return totalSize;
}

/**
 * Runs a command and returns the result
 */
export async function runCommand(
  args: string[],
  stdin?: string,
  cwd?: string,
  options?: { env?: Record<string, string> },
): Promise<CommandResult> {
  const logger = new BreakdownLogger();
  const breakdownPath = new URL("../../cli/breakdown.ts", import.meta.url).pathname;
  // Use cwd directly if it's already absolute, otherwise join with Deno.cwd()
  const absoluteCwd = cwd ? (cwd.startsWith("/") ? cwd : join(Deno.cwd(), cwd)) : undefined;
  logger.debug("[runCommand] invoked", {
    cwd: Deno.cwd(),
    args,
    breakdownPath,
    runCwd: absoluteCwd,
    env: options?.env,
  });
  const mergedEnv = { ...Deno.env.toObject(), ...(options?.env ?? {}) };
  const command = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-all", breakdownPath, ...args],
    stdout: "piped",
    stderr: "piped",
    stdin: stdin ? "piped" : undefined,
    cwd: absoluteCwd,
    env: mergedEnv,
  });

  try {
    let process;
    if (stdin) {
      // Spawn the process with stdin
      process = command.spawn();
      const writer = process.stdin.getWriter();
      await writer.write(new TextEncoder().encode(stdin));
      await writer.close();

      const { code, stdout, stderr } = await process.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);

      logger.debug("[runCommand] process output (with stdin)", { code, output, error });
      return {
        success: code === 0,
        output: output.trim(),
        error: error.trim(),
      };
    } else {
      const { code, stdout, stderr } = await command.output();
      const output = new TextDecoder().decode(stdout);
      const error = new TextDecoder().decode(stderr);
      logger.debug("[runCommand] process output", { code, output, error });
      return {
        success: code === 0,
        output: output.trim(),
        error: error.trim(),
      };
    }
  } catch (err: unknown) {
    logger.error("[runCommand] error", {
      err,
      cwd: Deno.cwd(),
      args,
      breakdownPath,
      runCwd: absoluteCwd,
    });
    return {
      success: false,
      output: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
