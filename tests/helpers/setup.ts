import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { exists } from "$std/fs/mod.ts";
import { join } from "$std/path/mod.ts";

export interface TestEnvironment {
  workingDir: string;
  logger: BreakdownLogger;
}

/**
 * Sets up test environment with logging and directory structure
 */
export async function setupTestEnvironment(options: {
  workingDir: string;
}): Promise<TestEnvironment> {
  const logger = new BreakdownLogger();
  logger.debug("Setting up test environment", { workingDir: options.workingDir });

  // Clean up existing test directory
  try {
    await Deno.remove(options.workingDir, { recursive: true });
  } catch {
    // Ignore if directory doesn't exist
  }

  // Create test directory
  await Deno.mkdir(options.workingDir, { recursive: true });
  logger.debug("Created test directory", { dir: options.workingDir });

  return {
    workingDir: options.workingDir,
    logger,
  };
}

/**
 * Cleans up test environment
 */
export async function cleanupTestEnvironment(env: TestEnvironment): Promise<void> {
  const logger = env.logger;
  logger.debug("Cleaning up test environment", { workingDir: env.workingDir });

  try {
    await Deno.remove(env.workingDir, { recursive: true });
    logger.debug("Removed test directory", { dir: env.workingDir });
  } catch (error) {
    logger.debug("Error cleaning up test directory", { error: String(error) });
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
  const command = new Deno.Command(Deno.execPath(), {
    args: args,
    stdout: "piped",
    stderr: "piped",
    stdin: stdin ? "piped" : undefined,
  });

  const process = command.spawn();
  
  if (stdin) {
    const writer = process.stdin.getWriter();
    await writer.write(new TextEncoder().encode(stdin));
    await writer.close();
  }

  const { success, stdout, stderr } = await process.output();
  
  return {
    success,
    output: new TextDecoder().decode(stdout),
    error: new TextDecoder().decode(stderr),
  };
} 