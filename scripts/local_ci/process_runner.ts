/**
 * @file process_runner.ts
 * @description Process execution utilities for the CI system
 */

import type { ProcessResult } from "./types.ts";

export class ProcessRunner {
  /**
   * Execute a command and return the result
   */
  static async run(
    command: string,
    args: string[] = [],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    } = {},
  ): Promise<ProcessResult> {
    const { cwd = Deno.cwd(), env = {}, timeout } = options;

    const cmd = new Deno.Command(command, {
      args,
      cwd,
      env: { ...Deno.env.toObject(), ...env },
      stdout: "piped",
      stderr: "piped",
    });

    let process: Deno.ChildProcess;
    let timeoutId: number | undefined;

    try {
      process = cmd.spawn();

      // Set up timeout if specified
      if (timeout) {
        timeoutId = setTimeout(() => {
          process.kill("SIGTERM");
        }, timeout);
      }

      const { code, stdout, stderr } = await process.output();

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const stdoutText = new TextDecoder().decode(stdout);
      const stderrText = new TextDecoder().decode(stderr);

      return {
        code,
        stdout: stdoutText,
        stderr: stderrText,
        success: code === 0,
      };
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to execute command: ${command} ${args.join(" ")}: ${errorMessage}`);
    }
  }

  /**
   * Execute a Deno command
   */
  static async runDeno(
    subcommand: string,
    args: string[] = [],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    } = {},
  ): Promise<ProcessResult> {
    return await this.run("deno", [subcommand, ...args], options);
  }

  /**
   * Execute a command with real-time output
   */
  static async runWithOutput(
    command: string,
    args: string[] = [],
    options: {
      cwd?: string;
      env?: Record<string, string>;
      prefix?: string;
    } = {},
  ): Promise<ProcessResult> {
    const { cwd = Deno.cwd(), env = {}, prefix = "" } = options;

    const cmd = new Deno.Command(command, {
      args,
      cwd,
      env: { ...Deno.env.toObject(), ...env },
      stdout: "piped",
      stderr: "piped",
    });

    const process = cmd.spawn();

    // Read stdout and stderr streams
    const stdoutReader = process.stdout.getReader();
    const stderrReader = process.stderr.getReader();

    let stdout = "";
    let stderr = "";

    // Function to read stream and optionally output to console
    const readStream = async (
      reader: ReadableStreamDefaultReader<Uint8Array>,
      isStderr = false,
    ) => {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          if (isStderr) {
            stderr += chunk;
          } else {
            stdout += chunk;
          }

          // Output to console if prefix is provided
          if (prefix) {
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.trim()) {
                console.log(`${prefix}${line}`);
              }
            }
          }
        }

        // Handle remaining buffer
        if (buffer.trim() && prefix) {
          console.log(`${prefix}${buffer}`);
        }
      } finally {
        reader.releaseLock();
      }
    };

    // Start reading both streams
    const [, , { code }] = await Promise.all([
      readStream(stdoutReader),
      readStream(stderrReader, true),
      process.output(),
    ]);

    return {
      code,
      stdout,
      stderr,
      success: code === 0,
    };
  }

  /**
   * Check if a command is available
   */
  static async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const result = await this.run("which", [command]);
      return result.success;
    } catch {
      return false;
    }
  }

  /**
   * Get system CPU count
   */
  static async getCpuCount(): Promise<number> {
    try {
      // Try nproc first (Linux)
      if (await this.isCommandAvailable("nproc")) {
        const result = await this.run("nproc");
        if (result.success) {
          const count = parseInt(result.stdout.trim(), 10);
          if (!isNaN(count) && count > 0) {
            return count;
          }
        }
      }

      // Try sysctl (macOS)
      if (await this.isCommandAvailable("sysctl")) {
        const result = await this.run("sysctl", ["-n", "hw.ncpu"]);
        if (result.success) {
          const count = parseInt(result.stdout.trim(), 10);
          if (!isNaN(count) && count > 0) {
            return count;
          }
        }
      }

      // Fallback to navigator.hardwareConcurrency if available
      if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        return navigator.hardwareConcurrency;
      }

      // Default fallback
      return 4;
    } catch {
      return 4;
    }
  }

  /**
   * Get optimal job count (CPU count - 1, minimum 1)
   */
  static async getOptimalJobCount(): Promise<number> {
    const cpuCount = await this.getCpuCount();
    return Math.max(1, cpuCount - 1);
  }
}
