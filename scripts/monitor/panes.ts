import { Result, ValidationError, createError } from "./types.ts";
import { Pane, PaneDetail, WorkerStatus, WorkerStatusParser } from "./models.ts";
import { CommandExecutor, Logger } from "./services.ts";
import { WORKER_STATUS_TYPES } from "./config.ts";

// =============================================================================
// Pane Processing and Management
// =============================================================================

export class PaneDataProcessor {
  constructor(private commandExecutor: CommandExecutor) {}

  parsePaneInfo(line: string): Result<Pane, ValidationError & { message: string }> {
    if (!line || line.trim() === "") {
      return { ok: false, error: createError({ kind: "EmptyInput" }) };
    }

    const parts = line.split(" ");
    if (parts.length < 2) {
      return { ok: false, error: createError({ kind: "InvalidFormat", input: line, expected: "pane_id active_flag [command] [title]" }) };
    }

    const paneId = parts[0];
    const activeStr = parts[1];
    const command = parts.length > 2 ? parts[2] : undefined;
    const title = parts.length > 3 ? parts.slice(3).join(" ") : undefined;

    const active = activeStr === "1";
    return Pane.create(paneId, active, command, title);
  }

  async getPaneDetail(paneId: string, logger: Logger): Promise<Result<PaneDetail, ValidationError & { message: string }>> {
    const commandResult = await this.commandExecutor.executeTmuxCommand(
      `tmux display -p -t "${paneId}" -F 'Session: #{session_name}
Window: #{window_index} #{window_name}
Pane ID: #{pane_id}
Pane Index: #{pane_index}
TTY: #{pane_tty}
PID: #{pane_pid}
Current Command: #{pane_current_command}
Current Path: #{pane_current_path}
Title: #{pane_title}
Active: #{pane_active}
Zoomed: #{window_zoomed_flag}
Pane Width: #{pane_width}
Pane Height: #{pane_height}
Start Command: #{pane_start_command}'`,
    );

    if (!commandResult.ok) {
      return { ok: false, error: commandResult.error };
    }

    const lines = commandResult.data.split("\n");
    const rawData = {
      sessionName: "",
      windowIndex: "",
      windowName: "",
      paneId: "",
      paneIndex: "",
      tty: "",
      pid: "",
      currentCommand: "",
      currentPath: "",
      title: "",
      active: "",
      zoomed: "",
      width: "",
      height: "",
      startCommand: ""
    };

    for (const line of lines) {
      const [key, ...valueParts] = line.split(": ");
      const value = valueParts.join(": ");
      
      switch (key) {
        case "Session":
          rawData.sessionName = value;
          break;
        case "Window":
          const windowParts = value.split(" ");
          rawData.windowIndex = windowParts[0];
          rawData.windowName = windowParts.slice(1).join(" ");
          break;
        case "Pane ID":
          rawData.paneId = value;
          break;
        case "Pane Index":
          rawData.paneIndex = value;
          break;
        case "TTY":
          rawData.tty = value;
          break;
        case "PID":
          rawData.pid = value;
          break;
        case "Current Command":
          rawData.currentCommand = value;
          break;
        case "Current Path":
          rawData.currentPath = value;
          break;
        case "Title":
          rawData.title = value;
          break;
        case "Active":
          rawData.active = value;
          break;
        case "Zoomed":
          rawData.zoomed = value;
          break;
        case "Pane Width":
          rawData.width = value;
          break;
        case "Pane Height":
          rawData.height = value;
          break;
        case "Start Command":
          rawData.startCommand = value;
          break;
      }
    }

    return PaneDetail.create(
      rawData.sessionName,
      rawData.windowIndex,
      rawData.windowName,
      rawData.paneId,
      rawData.paneIndex,
      rawData.tty,
      rawData.pid,
      rawData.currentCommand,
      rawData.currentPath,
      rawData.title,
      rawData.active,
      rawData.zoomed,
      rawData.width,
      rawData.height,
      rawData.startCommand
    );
  }

  countSessionOccurrences(sessionNames: string[]): Map<string, number> {
    const sessionCounts = new Map<string, number>();
    for (const session of sessionNames) {
      sessionCounts.set(session, (sessionCounts.get(session) || 0) + 1);
    }
    return sessionCounts;
  }

  findMostFrequentSession(sessionCounts: Map<string, number>): string {
    let maxCount = 0;
    let mostActiveSession = "";
    for (const [session, count] of sessionCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostActiveSession = session;
      }
    }
    return mostActiveSession;
  }
}

export class StatusAnalyzer {
  constructor(private logger: Logger) {}

  isNodeCommand(command: string): boolean {
    // Edge case handling: null, undefined, or empty command
    if (!command || typeof command !== "string") {
      return false;
    }

    // Normalize command string (trim and lowercase for comparison)
    const normalizedCommand = command.trim().toLowerCase();
    if (normalizedCommand === "") {
      return false;
    }

    // Node.js runtime and package managers
    const nodePatterns = [
      "node",
      "nodejs",
      "npm",
      "npx",
      "yarn",
      "pnpm",
      "deno",
      "bun",
    ];

    // Framework and build tools
    const frameworkPatterns = [
      "next",
      "nuxt",
      "vite",
      "webpack",
      "rollup",
      "tsc",
      "typescript",
      "ts-node",
      "jest",
      "vitest",
      "mocha",
      "cypress",
      "eslint",
      "prettier",
      "nodemon",
    ];

    // Test for exact matches or as part of commands
    const allPatterns = [...nodePatterns, ...frameworkPatterns];

    try {
      return allPatterns.some((pattern) => {
        return normalizedCommand === pattern || 
               normalizedCommand.includes(`${pattern} `) ||
               normalizedCommand.includes(`/${pattern}`);
      });
    } catch (error) {
      this.logger.error(`Error in isNodeCommand for command "${command}":`, error);
      return false;
    }
  }

  extractStatusFromTitle(title: string): WorkerStatus {
    if (!title || typeof title !== "string") {
      return WorkerStatusParser.parse("UNKNOWN");
    }

    const normalizedTitle = title.trim().toUpperCase();

    for (const status of WORKER_STATUS_TYPES) {
      if (normalizedTitle.includes(status)) {
        return WorkerStatusParser.parse(status);
      }
    }

    return WorkerStatusParser.parse("UNKNOWN");
  }

  determineStatus(paneDetail: PaneDetail): WorkerStatus {
    try {
      const command = paneDetail.currentCommand || "";
      const title = paneDetail.title || "";
      const pid = paneDetail.pid || "";

      // Strategy 1: First check if status is already explicitly in title
      const existingStatus = this.extractStatusFromTitle(title);
      if (existingStatus.kind !== "UNKNOWN") {
        return existingStatus;
      }

      // Strategy 2: Determine status based on command patterns with priority

      // Check for terminated/dead processes (pid might indicate this)
      if (pid === "0" || pid === "" || command === "") {
        return WorkerStatusParser.parse("TERMINATED");
      }

      // Check for shell commands (typically idle)
      const shellCommands = ["zsh", "bash", "sh", "fish", "tcsh", "csh"];
      if (shellCommands.includes(command)) {
        return WorkerStatusParser.parse("IDLE");
      }

      // Check for active development tools and processes
      const activeCommands = [
        "claude",
        "cld",
        "vi",
        "vim",
        "nvim",
        "nano",
        "emacs",
        "code",
        "cursor",
      ];
      if (activeCommands.some((cmd) => command.includes(cmd))) {
        return WorkerStatusParser.parse("WORKING");
      }

      // Check for build/test processes (working state)
      const buildTestPatterns = [
        "test",
        "build",
        "compile",
        "bundle",
        "jest",
        "vitest",
        "mocha",
        "cypress",
        "webpack",
        "vite",
        "rollup",
        "esbuild",
        "tsc",
        "typescript",
      ];
      if (buildTestPatterns.some((pattern) => command.includes(pattern))) {
        return WorkerStatusParser.parse("WORKING");
      }

      // Check for Node.js related processes
      if (this.isNodeCommand(command)) {
        // Check for specific Node.js states
        if (command.includes("watch") || command.includes("dev") || command.includes("start")) {
          return WorkerStatusParser.parse("WORKING");
        }
        if (command.includes("install") || command.includes("update")) {
          return WorkerStatusParser.parse("WORKING");
        }
        return WorkerStatusParser.parse("WORKING"); // Default for Node commands
      }

      // Default to WORKING for any other active process
      return WorkerStatusParser.parse("WORKING");
    } catch (error) {
      this.logger.error("Error in determineStatus:", error);
      return WorkerStatusParser.parse("UNKNOWN");
    }
  }
}

export class PaneManager {
  private mainPane: Pane | null = null;
  private panes: Pane[] = [];

  constructor(private logger: Logger) {}

  separate(allPanes: Pane[]): Result<void, ValidationError & { message: string }> {
    if (allPanes.length === 0) {
      return { ok: false, error: createError({ kind: "InvalidState", current: "no_panes", expected: "at_least_one_pane" }) };
    }

    this.mainPane = allPanes.find((pane) => pane.isActive()) || null;
    this.panes = allPanes.filter((pane) => !pane.isActive());

    this.logger.info(`Main pane: ${this.mainPane?.id || "none"}`);
    this.logger.info(`Target panes: ${this.panes.map((p) => p.id).join(", ")}`);

    return { ok: true, data: undefined };
  }

  getMainPane(): Pane | null {
    return this.mainPane;
  }

  getTargetPanes(): Pane[] {
    return this.panes;
  }

  getTargetPaneIds(): string[] {
    return this.panes.map((p) => p.id);
  }
}

export class PaneStatusManager {
  private statusMap: Map<string, { current: WorkerStatus; previous?: WorkerStatus }> = new Map();

  updateStatus(paneId: string, newStatus: WorkerStatus): boolean {
    const existing = this.statusMap.get(paneId);

    if (!existing) {
      this.statusMap.set(paneId, { current: newStatus });
      return true; // New pane is a change
    }

    if (!WorkerStatusParser.isEqual(existing.current, newStatus)) {
      this.statusMap.set(paneId, {
        current: newStatus,
        previous: existing.current,
      });
      return true; // Status changed
    }

    return false; // No change
  }

  getChangedPanes(): Array<{ paneId: string; status: WorkerStatus }> {
    const result: Array<{ paneId: string; status: WorkerStatus }> = [];

    for (const [paneId, info] of this.statusMap.entries()) {
      if (info.previous !== undefined) {
        result.push({ paneId, status: info.current });
      }
    }

    return result;
  }

  clearChangeFlags(): void {
    for (const [paneId, info] of this.statusMap.entries()) {
      this.statusMap.set(paneId, { current: info.current });
    }
  }

  getDonePanes(): string[] {
    const result: string[] = [];
    for (const [paneId, info] of this.statusMap.entries()) {
      if (info.current.kind === "DONE") {
        result.push(paneId);
      }
    }
    return result;
  }

  getDoneAndIdlePanes(): string[] {
    const result: string[] = [];
    for (const [paneId, info] of this.statusMap.entries()) {
      if (info.current.kind === "DONE" || info.current.kind === "IDLE") {
        result.push(paneId);
      }
    }
    return result;
  }
}
