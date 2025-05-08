import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import { join } from "@std/path/join";

export interface TestEnvironmentOptions {
  workingDir?: string;
  logLevel?: LogLevel;
  skipDefaultConfig?: boolean;
  skipDirectorySetup?: boolean;
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
  const logLevel = options.logLevel || LogLevel.DEBUG;

  // Create test directories only if not skipped
  if (!options.skipDirectorySetup) {
    // Create test directories with proper permissions
    await Deno.mkdir(workingDir, { recursive: true, mode: 0o777 });

    // Create .agent/breakdown/config directory
    const configDir = join(workingDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true, mode: 0o777 });

    // Create breakdown/prompts and breakdown/schemas directories
    const breakdownDir = join(workingDir, ".agent", "breakdown");
    await Deno.mkdir(join(breakdownDir, "prompts"), { recursive: true, mode: 0o777 });
    await Deno.mkdir(join(breakdownDir, "schemas"), { recursive: true, mode: 0o777 });

    // Create layer directories
    await Deno.mkdir(join(workingDir, "project"), { recursive: true, mode: 0o777 });
    await Deno.mkdir(join(workingDir, "issue"), { recursive: true, mode: 0o777 });
    await Deno.mkdir(join(workingDir, "task"), { recursive: true, mode: 0o777 });
    await Deno.mkdir(join(workingDir, "temp"), { recursive: true, mode: 0o777 });

    // Create default app.yml if it doesn't exist
    if (!options.skipDefaultConfig) {
      const appConfigPath = join(configDir, "app.yml");
      await Deno.writeTextFile(
        appConfigPath,
        `working_dir: .agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schemas
`,
        { mode: 0o666 },
      );
    }
  } else {
    // Only create the base working directory
    await Deno.mkdir(workingDir, { recursive: true, mode: 0o777 });
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
 * Recursively restores write permissions to a directory and its contents
 * @param path The path to restore permissions for
 */
async function restoreWritePermissions(path: string): Promise<void> {
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
      console.error(`Error restoring permissions for ${path}:`, error);
    }
  }
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
      // First restore write permissions to all files and directories
      await restoreWritePermissions(env.workingDir);
      // Then remove the directory
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
export async function runCommand(
  args: string[],
  stdin?: string,
  cwd?: string,
  options?: { env?: Record<string, string> },
): Promise<CommandResult> {
  const logger = new BreakdownLogger();
  const breakdownPath = new URL("../../cli/breakdown.ts", import.meta.url).pathname;
  const absoluteCwd = cwd ? join(Deno.cwd(), cwd) : undefined;
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
    logger.error("[runCommand] error", { err, cwd: Deno.cwd(), args, breakdownPath, runCwd: absoluteCwd });
    return {
      success: false,
      output: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
