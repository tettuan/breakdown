import { Result, ValidationError, createError } from "./types.ts";
import { TIMING } from "./config.ts";

// =============================================================================
// Core Infrastructure Services
// =============================================================================

export class CommandExecutor {
  async executeTmuxCommand(command: string): Promise<Result<string, ValidationError & { message: string }>> {
    if (!command || command.trim() === "") {
      return { ok: false, error: createError({ kind: "EmptyInput" }) };
    }

    try {
      const process = new Deno.Command("bash", {
        args: ["-c", command],
        stdout: "piped",
        stderr: "piped",
      });

      const result = await process.output();

      if (!result.success) {
        const stderr = new TextDecoder().decode(result.stderr);
        return { ok: false, error: createError({ kind: "CommandFailed", command, stderr }) };
      }

      const stdout = new TextDecoder().decode(result.stdout).trim();
      return { ok: true, data: stdout };
    } catch (error) {
      return { ok: false, error: createError({ kind: "CommandFailed", command, stderr: String(error) }) };
    }
  }
}

export class Logger {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error || "");
  }
}

export class TimeManager {
  async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  formatTimeForDisplay(date: Date): string {
    return date.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async waitUntilScheduledTime(
    scheduledTime: Date, 
    logger: Logger, 
    keyboardHandler: KeyboardInterruptHandler
  ): Promise<Result<void, ValidationError & { message: string }>> {
    const now = new Date();
    const msUntilScheduled = scheduledTime.getTime() - now.getTime();

    if (msUntilScheduled <= 0) {
      logger.info("Scheduled time has already passed. Proceeding immediately.");
      return { ok: true, data: undefined };
    }

    const scheduledTimeStr = this.formatTimeForDisplay(scheduledTime);
    logger.info(`Waiting until scheduled time: ${scheduledTimeStr} (Asia/Tokyo)`);
    logger.info(
      `Time remaining: ${
        Math.round(msUntilScheduled / 1000 / 60)
      } minutes. Press any key to cancel and exit.`,
    );

    const interrupted = await keyboardHandler.waitWithKeyboardInterrupt(msUntilScheduled);
    if (interrupted) {
      return { ok: false, error: createError({ kind: "CancellationRequested", operation: "scheduled_wait" }) };
    }

    return { ok: true, data: undefined };
  }
}

export class KeyboardInterruptHandler {
  private cancellationRequested = false;

  setup(): void {
    if (Deno.stdin.isTerminal()) {
      Deno.stdin.setRaw(true);

      // Set up a background listener for keyboard input
      const readKeyboardInput = async () => {
        const buffer = new Uint8Array(1);
        try {
          while (!this.cancellationRequested) {
            const bytesRead = await Deno.stdin.read(buffer);
            if (bytesRead === null) break;

            // Any key press triggers cancellation
            if (bytesRead > 0) {
              this.cancellationRequested = true;
              break;
            }
          }
        } catch (error) {
          // Ignore errors during cleanup
        }
      };

      // Start the background keyboard listener
      readKeyboardInput();
    }
  }

  cleanup(): void {
    if (Deno.stdin.isTerminal()) {
      try {
        Deno.stdin.setRaw(false);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  }

  isCancellationRequested(): boolean {
    return this.cancellationRequested;
  }

  async waitWithKeyboardInterrupt(ms: number): Promise<boolean> {
    const stdin = Deno.stdin;
    stdin.setRaw(true);

    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(false), ms);
    });

    const keyPressPromise = new Promise<boolean>((resolve) => {
      const buffer = new Uint8Array(1);
      stdin.read(buffer).then(() => {
        resolve(true);
      }).catch(() => {
        resolve(false);
      });
    });

    try {
      const interrupted = await Promise.race([timeoutPromise, keyPressPromise]);
      stdin.setRaw(false);

      if (interrupted) {
        return true;
      }

      return false;
    } catch (error) {
      stdin.setRaw(false);
      return false;
    }
  }

  async sleepWithCancellation(ms: number, timeManager: TimeManager): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    while (Date.now() - startTime < ms) {
      if (this.isCancellationRequested()) {
        return true; // Cancelled
      }

      await timeManager.sleep(Math.min(checkInterval, ms - (Date.now() - startTime)));
    }

    return false; // Not cancelled
  }
}

export class RuntimeTracker {
  private startTime: number;
  private maxRuntime: number;

  constructor(maxRuntime: number) {
    this.startTime = Date.now();
    this.maxRuntime = maxRuntime;
  }

  getStartTime(): number {
    return this.startTime;
  }

  hasExceededLimit(): Result<boolean, ValidationError & { message: string }> {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.startTime;
    const remainingTime = this.maxRuntime - elapsedTime;
    
    if (remainingTime <= 0) {
      return { ok: false, error: createError({ kind: "RuntimeLimitExceeded", maxRuntime: this.maxRuntime }) };
    }
    
    return { ok: true, data: false };
  }

  logStartupInfo(logger: Logger, timeManager: TimeManager): void {
    const startTimeStr = timeManager.formatTimeForDisplay(new Date(this.startTime));
    const autoStopTime = timeManager.formatTimeForDisplay(new Date(this.startTime + this.maxRuntime));
    
    logger.info(`Monitor started at: ${startTimeStr} (Asia/Tokyo)`);
    logger.info(`Auto-stop scheduled at: ${autoStopTime} (Asia/Tokyo)`);
  }

  getRemainingTime(): number {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.startTime;
    return Math.max(0, this.maxRuntime - elapsedTime);
  }
}
