import { Result, ValidationError, createError } from "./types.ts";
import { MonitoringOptions, ValidatedTime } from "./models.ts";
import { TimeManager, Logger } from "./services.ts";

// =============================================================================
// Command Line Argument Processing
// =============================================================================

export class ArgumentParser {
  constructor(
    private timeManager: TimeManager,
    private logger: Logger
  ) {}

  parse(): Result<MonitoringOptions, ValidationError & { message: string }> {
    const args = Deno.args;
    let scheduledTime: Date | null = null;
    let instructionFile: string | null = null;

    // Look for time parameter (--time=HH:MM or -t HH:MM)
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith("--time=")) {
        const timeStr = arg.substring(7);
        const parseResult = ValidatedTime.create(timeStr);
        if (!parseResult.ok) {
          return { ok: false, error: parseResult.error };
        }
        scheduledTime = parseResult.data.getDate();
      } else if (arg === "-t" && i + 1 < args.length) {
        const timeStr = args[i + 1];
        const parseResult = ValidatedTime.create(timeStr);
        if (!parseResult.ok) {
          return { ok: false, error: parseResult.error };
        }
        scheduledTime = parseResult.data.getDate();
      } else if (arg.startsWith("--instruction=")) {
        instructionFile = arg.substring(14);
      } else if (arg === "-i" && i + 1 < args.length) {
        instructionFile = args[i + 1];
      }
    }

    const continuous = args.includes("--continuous") || args.includes("-c");
    const options = MonitoringOptions.create(continuous, scheduledTime, instructionFile);
    
    return { ok: true, data: options };
  }
}
