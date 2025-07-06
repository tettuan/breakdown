import { Result, ValidationError, createError } from "./types.ts";
import { PaneDetail } from "./models.ts";

/**
 * Message Generator Class - Single Responsibility: Message Generation
 */
export class MessageGenerator {
  static generateStatusMessage(
    activePanes: PaneDetail[],
    inactivePanes: PaneDetail[],
    statusResults: Array<{ pane: PaneDetail; status: string }>
  ): string {
    const now = new Date().toISOString();
    let message = `[${now}] Pane Status Report\n\n`;

    message += `Active Panes (${activePanes.length}):\n`;
    activePanes.forEach((pane, index) => {
      message += `  ${index + 1}. [${pane.paneId}] ${pane.title} - ${pane.currentCommand}\n`;
    });

    message += `\nInactive Panes (${inactivePanes.length}):\n`;
    inactivePanes.forEach((pane, index) => {
      const statusResult = statusResults.find(r => r.pane.paneId === pane.paneId);
      const status = statusResult ? statusResult.status : 'UNKNOWN';
      message += `  ${index + 1}. [${pane.paneId}] ${pane.title} - ${pane.currentCommand} (Status: ${status})\n`;
    });

    return message;
  }

  static generatePaneListMessage(panes: PaneDetail[]): string {
    const now = new Date().toISOString();
    let message = `[${now}] Complete Pane List\n\n`;

    panes.forEach((pane, index) => {
      const activeStatus = pane.active === '1' ? 'ACTIVE' : 'INACTIVE';
      message += `${index + 1}. [${pane.paneId}] ${pane.title}\n`;
      message += `   Command: ${pane.currentCommand}\n`;
      message += `   Path: ${pane.currentPath}\n`;
      message += `   Status: ${activeStatus}\n`;
      message += `   Size: ${pane.width}x${pane.height}\n\n`;
    });

    return message;
  }
}

/**
 * Pane Communication Class - Single Responsibility: Pane Communication
 */
export class PaneCommunicator {
  private constructor(
    private commandExecutor: any,
    private logger: any
  ) {}

  static create(commandExecutor: any, logger: any): PaneCommunicator {
    return new PaneCommunicator(commandExecutor, logger);
  }

  async sendStatusUpdateToPane(paneId: string): Promise<Result<void, ValidationError & { message: string }>> {
    const command = "echo '=== STATUS UPDATE REQUEST ===' && echo 'Current Status: ' && echo 'WORKING' && echo";
    const result = await this.commandExecutor.execute([
      "tmux", "send-keys", "-t", paneId, command, "Enter"
    ]);

    if (!result.ok) {
      return { ok: false, error: createError({ kind: "CommandFailed", command: `tmux send-keys to ${paneId}`, stderr: result.error }) };
    }

    return { ok: true, data: undefined };
  }

  async sendToPane(paneId: string, message: string): Promise<Result<void, ValidationError & { message: string }>> {
    const result = await this.commandExecutor.execute([
      "tmux", "send-keys", "-t", paneId, message, "Enter"
    ]);

    if (!result.ok) {
      return { ok: false, error: createError({ kind: "CommandFailed", command: `tmux send-keys to ${paneId}`, stderr: result.error }) };
    }

    return { ok: true, data: undefined };
  }

  async sendInstructionFile(paneId: string, filePath: string): Promise<Result<void, ValidationError & { message: string }>> {
    this.logger.info(`Sending instruction file to pane ${paneId}: ${filePath}`);
    
    // Check if file exists
    try {
      await Deno.stat(filePath);
    } catch (error) {
      return { ok: false, error: createError({ kind: "FileNotFound", path: filePath }) };
    }

    const command = `cat "${filePath}"`;
    const result = await this.commandExecutor.execute([
      "tmux", "send-keys", "-t", paneId, command, "Enter"
    ]);

    if (!result.ok) {
      return { ok: false, error: createError({ kind: "CommandFailed", command: `tmux send instruction file to ${paneId}`, stderr: result.error }) };
    }

    return { ok: true, data: undefined };
  }

  async sendRegularEnterToInactivePanes(inactivePanes: PaneDetail[]): Promise<void> {
    for (const pane of inactivePanes) {
      const result = await this.commandExecutor.execute([
        "tmux", "send-keys", "-t", pane.paneId, "Enter"
      ]);
      
      if (!result.ok) {
        this.logger.warn(`Failed to send Enter to pane ${pane.paneId}: ${result.error}`);
      }
    }
  }

  async sendMainReport(mainPaneId: string, message: string): Promise<Result<void, ValidationError & { message: string }>> {
    this.logger.info(`Sending main report to pane ${mainPaneId}`);
    
    const result = await this.commandExecutor.execute([
      "tmux", "send-keys", "-t", mainPaneId, message, "Enter"
    ]);

    if (!result.ok) {
      return { ok: false, error: createError({ kind: "CommandFailed", command: `tmux send main report to ${mainPaneId}`, stderr: result.error }) };
    }

    return { ok: true, data: undefined };
  }
}
