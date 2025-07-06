import { Result, ValidationError, createError } from "./types.ts";
import { PaneDetail } from "./models.ts";

/**
 * Tmux Session Management Class - Single Responsibility: Session Discovery and Management
 */
export class TmuxSession {
  private constructor(
    private commandExecutor: any,
    private logger: any
  ) {}

  static create(commandExecutor: any, logger: any): TmuxSession {
    return new TmuxSession(commandExecutor, logger);
  }

  async findMostActiveSession(): Promise<Result<string, ValidationError & { message: string }>> {
    // Get all sessions
    const sessionsResult = await this.commandExecutor.execute([
      "tmux", "list-sessions", "-F", "#{session_name}:#{session_windows}:#{session_attached}"
    ]);

    if (!sessionsResult.ok) {
      return { ok: false, error: createError({ kind: "CommandFailed", command: "tmux list-sessions", stderr: sessionsResult.error }) };
    }

    const sessions = sessionsResult.data.split('\n').filter((line: string) => line.trim() !== '');
    if (sessions.length === 0) {
      return { ok: false, error: createError({ kind: "EmptyInput" }) };
    }

    let bestSession = '';
    let maxScore = -1;

    for (const session of sessions) {
      const [name, windows, attached] = session.split(':');
      const windowCount = parseInt(windows) || 0;
      const attachedCount = parseInt(attached) || 0;
      
      // Score: prioritize attached sessions and window count
      const score = (attachedCount * 1000) + windowCount;
      
      if (score > maxScore) {
        maxScore = score;
        bestSession = name;
      }
    }

    if (!bestSession) {
      return { ok: false, error: createError({ kind: "InvalidState", current: "no session found", expected: "at least one session" }) };
    }

    return { ok: true, data: bestSession };
  }

  async getAllPanes(sessionName: string): Promise<Result<PaneDetail[], ValidationError & { message: string }>> {
    const result = await this.commandExecutor.execute([
      "tmux", "list-panes", "-s", sessionName, "-t", sessionName, "-F",
      "#{session_name}:#{window_index}:#{window_name}:#{pane_id}:#{pane_index}:#{pane_tty}:#{pane_pid}:#{pane_current_command}:#{pane_current_path}:#{pane_title}:#{pane_active}:#{window_zoomed_flag}:#{pane_width}:#{pane_height}:#{pane_start_command}"
    ]);

    if (!result.ok) {
      return { ok: false, error: createError({ kind: "CommandFailed", command: "tmux list-panes", stderr: result.error }) };
    }

    const lines = result.data.split('\n').filter((line: string) => line.trim() !== '');
    const panes: PaneDetail[] = [];

    for (const line of lines) {
      const parts = line.split(':');
      if (parts.length >= 15) {
        const paneResult = PaneDetail.create(
          parts[0],  // sessionName
          parts[1],  // windowIndex
          parts[2],  // windowName
          parts[3],  // paneId
          parts[4],  // paneIndex
          parts[5],  // tty
          parts[6],  // pid
          parts[7],  // currentCommand
          parts[8],  // currentPath
          parts[9],  // title
          parts[10], // active
          parts[11], // zoomed
          parts[12], // width
          parts[13], // height
          parts[14]  // startCommand
        );

        if (paneResult.ok) {
          panes.push(paneResult.data);
        } else {
          this.logger.warn(`Failed to parse pane: ${line}`);
        }
      }
    }

    return { ok: true, data: panes };
  }
}
