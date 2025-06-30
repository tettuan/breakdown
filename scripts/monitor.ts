#!/usr/bin/env deno run --allow-run --allow-net

/**
 * tmux Monitor Tool
 * 
 * Monitor tmux session pane status and perform state management
 * Design Policy: Object-Oriented + Global Functions
 * 
 * Usage:
 *   # Single monitoring cycle
 *   deno run --allow-run --allow-net scripts/monitor.ts
 * 
 *   # Continuous monitoring mode
 *   deno run --allow-run --allow-net scripts/monitor.ts --continuous
 *   deno run --allow-run --allow-net scripts/monitor.ts -c
 * 
 *   # Scheduled execution (wait until specified time, then start normal monitoring)
 *   deno run --allow-run --allow-net scripts/monitor.ts --time=4:00
 *   deno run --allow-run --allow-net scripts/monitor.ts -t 14:30
 * 
 *   # Scheduled + continuous mode (waits until scheduled time, then runs continuous monitoring)
 *   deno run --allow-run --allow-net scripts/monitor.ts -c --time=4:00
 *   deno run --allow-run --allow-net scripts/monitor.ts -c -t 4:00
 * 
 *   # Instruction file option (sends instruction file to main pane at startup)
 *   deno run --allow-run --allow-net scripts/monitor.ts --instruction=draft/2025/06/20250629-14-fix-tests.ja.md
 *   deno run --allow-run --allow-net scripts/monitor.ts -i draft/2025/06/20250629-14-fix-tests.ja.md
 * 
 *   # Combined options
 *   deno run --allow-run --allow-net scripts/monitor.ts -c --time=4:00 --instruction=draft/file.md
 * 
 * Features:
 *   - Discovers the most active tmux session automatically
 *   - Separates main pane (active) from target panes (inactive)
 *   - Sends status update instructions to target panes
 *   - Reports pane status to main pane
 *   - Displays comprehensive pane list
 *   - Supports both single-run and continuous monitoring modes
 *   - Scheduled execution with keyboard interrupt capability
 *   - Instruction file option for sending startup commands to main pane
 */

// =============================================================================
// Type Definitions
// =============================================================================

interface Pane {
  id: string;
  active: boolean;
  command?: string;
  title?: string;
}

interface PaneDetail {
  sessionName: string;
  windowIndex: string;
  windowName: string;
  paneId: string;
  paneIndex: string;
  tty: string;
  pid: string;
  currentCommand: string;
  currentPath: string;
  title: string;
  active: string;
  zoomed: string;
  width: string;
  height: string;
  startCommand: string;
}

interface PaneStatusInfo {
  paneId: string;
  currentStatus: StatusKey;
  previousStatus?: StatusKey;
  lastUpdated: Date;
}

type StatusKey = 'IDLE' | 'WORKING' | 'BLOCKED' | 'DONE' | 'TERMINATED' | 'UNKNOWN';

// =============================================================================
// Constants
// =============================================================================

const WORKER_STATUS: StatusKey[] = [
  'IDLE',
  'WORKING', 
  'BLOCKED',
  'DONE',
  'TERMINATED',
  'UNKNOWN'
];

const TIMING = {
  INSTRUCTION_DELAY: 200,        // 0.2 seconds - delay after sending instruction
  ENTER_KEY_DELAY: 300,          // 0.3 seconds - delay before sending additional Enter (updated per requirements)
  PANE_PROCESSING_DELAY: 1000,   // 1 second - delay after processing each pane
  MONITORING_CYCLE_DELAY: 300000, // 5*60 seconds (300 seconds) - delay between monitoring cycles (updated per requirements)
  CLD_COMMAND_DELAY: 200         // 0.2 seconds - delay for cld command (from requirements)
} as const;

// =============================================================================
// Global Functions (Utilities)
// =============================================================================

/**
 * Global function to execute tmux commands
 */
async function executeTmuxCommand(command: string): Promise<string> {
  const process = new Deno.Command("bash", {
    args: ["-c", command],
    stdout: "piped",
    stderr: "piped"
  });

  const result = await process.output();
  
  if (!result.success) {
    const error = new TextDecoder().decode(result.stderr);
    throw new Error(`Command failed: ${command}\nError: ${error}`);
  }

  return new TextDecoder().decode(result.stdout).trim();
}

/**
 * Global function to wait for a specified time
 */
async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Global function to parse time string (HH:MM format) and get next occurrence
 */
function getNextScheduledTime(timeStr: string): Date | null {
  const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) {
    return null;
  }
  
  const hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  // If the scheduled time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  return scheduledTime;
}

/**
 * Global function to wait with keyboard interrupt capability
 */
async function sleepWithKeyboardInterrupt(ms: number): Promise<boolean> {
  logInfo(`Waiting for ${ms/1000} seconds... Press any key to cancel and exit.`);
  
  // Set up stdin to read key presses
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
    
    // Restore stdin to normal mode
    stdin.setRaw(false);
    
    if (interrupted) {
      logInfo("Keyboard input detected. Exiting monitoring...");
      return true; // Interrupted
    }
    
    return false; // Not interrupted
  } catch (error) {
    // Restore stdin to normal mode on error
    stdin.setRaw(false);
    logError("Error during sleep with keyboard interrupt:", error);
    return false;
  }
}

/**
 * Global function to wait until scheduled time with keyboard interrupt capability
 */
async function waitUntilScheduledTime(scheduledTime: Date): Promise<boolean> {
  const now = new Date();
  const msUntilScheduled = scheduledTime.getTime() - now.getTime();
  
  if (msUntilScheduled <= 0) {
    logInfo("Scheduled time has already passed. Proceeding immediately.");
    return false;
  }
  
  const scheduledTimeStr = scheduledTime.toLocaleString('ja-JP', { 
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit'
  });
  
  logInfo(`Waiting until scheduled time: ${scheduledTimeStr} (Asia/Tokyo)`);
  logInfo(`Time remaining: ${Math.round(msUntilScheduled/1000/60)} minutes. Press any key to cancel and exit.`);
  
  // Set up stdin to read key presses
  const stdin = Deno.stdin;
  stdin.setRaw(true);
  
  const timeoutPromise = new Promise<boolean>((resolve) => {
    setTimeout(() => resolve(false), msUntilScheduled);
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
    
    // Restore stdin to normal mode
    stdin.setRaw(false);
    
    if (interrupted) {
      logInfo("Keyboard input detected. Exiting monitoring...");
      return true; // Interrupted
    }
    
    logInfo("Scheduled time reached. Resuming monitoring...");
    return false; // Not interrupted
  } catch (error) {
    // Restore stdin to normal mode on error
    stdin.setRaw(false);
    logError("Error during scheduled wait:", error);
    return false;
  }
}

/**
 * Global function for log output
 */
function logInfo(message: string): void {
  console.log(`[INFO] ${message}`);
}

function logError(message: string, error?: unknown): void {
  console.error(`[ERROR] ${message}`, error || "");
}

/**
 * Global function to count session name occurrences
 */
function countSessionOccurrences(sessionNames: string[]): Map<string, number> {
  const sessionCounts = new Map<string, number>();
  for (const session of sessionNames) {
    sessionCounts.set(session, (sessionCounts.get(session) || 0) + 1);
  }
  return sessionCounts;
}

/**
 * Global function to find the most frequent session name
 */
function findMostFrequentSession(sessionCounts: Map<string, number>): string {
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

/**
 * Global function to parse pane information
 */
function parsePane(line: string): Pane | null {
  const parts = line.split(' ');
  if (parts.length >= 2) {
    const [id, activeStr] = parts;
    return {
      id: id,
      active: activeStr === '1'
    };
  }
  return null;
}

/**
 * Global function to get detailed pane information
 */
async function getPaneDetail(paneId: string): Promise<PaneDetail | null> {
  try {
    const output = await executeTmuxCommand(`tmux display -p -t "${paneId}" -F 'Session: #{session_name}
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
Start Command: #{pane_start_command}'`);

    const lines = output.split('\n');
    const detail: Partial<PaneDetail> = {};
    
    for (const line of lines) {
      const [key, ...valueParts] = line.split(': ');
      const value = valueParts.join(': ').trim();
      
      switch (key) {
        case 'Session':
          detail.sessionName = value;
          break;
        case 'Window':
          const [index, name] = value.split(' ', 2);
          detail.windowIndex = index;
          detail.windowName = name || '';
          break;
        case 'Pane ID':
          detail.paneId = value;
          break;
        case 'Pane Index':
          detail.paneIndex = value;
          break;
        case 'TTY':
          detail.tty = value;
          break;
        case 'PID':
          detail.pid = value;
          break;
        case 'Current Command':
          detail.currentCommand = value;
          break;
        case 'Current Path':
          detail.currentPath = value;
          break;
        case 'Title':
          detail.title = value;
          break;
        case 'Active':
          detail.active = value;
          break;
        case 'Zoomed':
          detail.zoomed = value;
          break;
        case 'Pane Width':
          detail.width = value;
          break;
        case 'Pane Height':
          detail.height = value;
          break;
        case 'Start Command':
          detail.startCommand = value;
          break;
      }
    }
    
    return detail as PaneDetail;
  } catch (error) {
    logError(`Failed to get pane detail for ${paneId}:`, error);
    return null;
  }
}

/**
 * Global function to generate instruction messages
 */
function generateInstructionMessage(): string {
  return `Script detection and Status determination: Update pane_title with Script(Node/Other) + Status(${WORKER_STATUS.join('/')})`;
}

/**
 * Global function to check if command is node-related
 */
function isNodeCommand(command: string): boolean {
  return command === 'node';
}

/**
 * Global function to extract status from pane title
 */
function extractStatusFromTitle(title: string): StatusKey {
  // Look for exact status patterns in the title
  // Check for Status(STATUSNAME) format first (most specific)
  const statusParenMatch = title.match(/Status\(([^)]+)\)/);
  if (statusParenMatch) {
    const statusCandidate = statusParenMatch[1];
    if (WORKER_STATUS.includes(statusCandidate as StatusKey)) {
      return statusCandidate as StatusKey;
    }
  }
  
  // Check for word boundary matches to avoid partial matches
  for (const status of WORKER_STATUS) {
    // Use word boundary regex to match complete status words
    const regex = new RegExp(`\\b${status}\\b`, 'i');
    if (regex.test(title)) {
      return status;
    }
  }
  
  return 'UNKNOWN';
}

/**
 * Global function to generate status report messages
 */
function generateStatusReport(sessionName: string, mainPaneId: string, paneIds: string[]): string {
  return `
=== Pane Status Report ===
Monitoring panes: ${paneIds.length}
Session: ${sessionName}
Main pane: ${mainPaneId}
Target panes: ${paneIds.join(', ')}
========================
`.trim();
}

// =============================================================================
// Object-Oriented Classes
// =============================================================================

/**
 * Tmux Session Management Class
 */
class TmuxSession {
  private sessionName: string = "";
  
  constructor() {}
  
  /**
   * Discover the latest tmux session (Result A)
   */
  async discover(): Promise<string> {
    const output = await executeTmuxCommand('tmux list-panes -a -F "#{session_name}"');
    const sessionNames = output.split('\n').filter(name => name.trim() !== '');
    
    const sessionCounts = countSessionOccurrences(sessionNames);
    this.sessionName = findMostFrequentSession(sessionCounts);
    
    const maxCount = sessionCounts.get(this.sessionName) || 0;
    logInfo(`Latest session: ${this.sessionName} (${maxCount} panes)`);
    
    return this.sessionName;
  }
  
  /**
   * Get session name
   */
  getName(): string {
    return this.sessionName;
  }
  
  /**
   * Get pane list for the session (Result B)
   */
  async getPanes(): Promise<Pane[]> {
    if (!this.sessionName) {
      throw new Error("Session not identified");
    }
    
    const output = await executeTmuxCommand(`tmux list-panes -t "${this.sessionName}" -F "#{pane_id} #{pane_active}"`);
    const lines = output.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => parsePane(line)).filter((pane): pane is Pane => pane !== null);
  }
}

/**
 * Pane Management Class
 */
class PaneManager {
  private mainPane: Pane | null = null;
  private panes: Pane[] = [];
  
  constructor() {}
  
  /**
   * Separate main pane from other panes
   */
  separate(allPanes: Pane[]): void {
    this.mainPane = allPanes.find(pane => pane.active) || null;
    this.panes = allPanes.filter(pane => !pane.active);
    
    logInfo(`Main pane: ${this.mainPane?.id || 'none'}`);
    logInfo(`Target panes: ${this.panes.map(p => p.id).join(', ')}`);
  }
  
  /**
   * Get main pane
   */
  getMainPane(): Pane | null {
    return this.mainPane;
  }
  
  /**
   * Get target panes for monitoring
   */
  getTargetPanes(): Pane[] {
    return this.panes;
  }
  
  /**
   * Get target pane ID list
   */
  getTargetPaneIds(): string[] {
    return this.panes.map(p => p.id);
  }
}

/**
 * Pane Status Tracker Class
 */
class PaneStatusTracker {
  private statusMap: Map<string, PaneStatusInfo> = new Map();
  
  constructor() {}
  
  /**
   * Update pane status and return true if status changed
   */
  updateStatus(paneId: string, newStatus: StatusKey): boolean {
    const existing = this.statusMap.get(paneId);
    
    if (!existing) {
      // First time tracking this pane
      this.statusMap.set(paneId, {
        paneId,
        currentStatus: newStatus,
        lastUpdated: new Date()
      });
      return true; // New pane is considered a change
    }
    
    if (existing.currentStatus !== newStatus) {
      // Status changed
      this.statusMap.set(paneId, {
        paneId,
        currentStatus: newStatus,
        previousStatus: existing.currentStatus,
        lastUpdated: new Date()
      });
      return true;
    }
    
    return false; // No change
  }
  
  /**
   * Get panes that had status changes
   */
  getChangedPanes(): PaneStatusInfo[] {
    const result: PaneStatusInfo[] = [];
    
    for (const [paneId, info] of this.statusMap.entries()) {
      // Only include panes that have a previous status (indicating a change occurred)
      if (info.previousStatus) {
        result.push(info);
      }
    }
    
    return result;
  }
  
  /**
   * Get current status for a pane
   */
  getCurrentStatus(paneId: string): StatusKey | undefined {
    return this.statusMap.get(paneId)?.currentStatus;
  }
  
  /**
   * Clear change flags (call after reporting)
   */
  clearChangeFlags(): void {
    for (const [paneId, info] of this.statusMap.entries()) {
      if (info.previousStatus) {
        this.statusMap.set(paneId, {
          ...info,
          previousStatus: undefined
        });
      }
    }
  }
}
class PaneCommunicator {
  constructor() {}
  
  /**
   * Send instructions to pane based on command type
   */
  async sendInstruction(paneId: string): Promise<void> {
    // Get detailed pane information
    const paneDetail = await getPaneDetail(paneId);
    if (!paneDetail) {
      logError(`Cannot get pane detail for ${paneId}`);
      return;
    }

    if (isNodeCommand(paneDetail.currentCommand)) {
      // Case: Node command - send script and status detection instructions
      logInfo(`Pane ${paneId} node, sending`);
      await this.sendNodeInstruction(paneId);
    } else {
      // Case: Non-node command - send "cld" command
      logInfo(`Pane ${paneId} ${paneDetail.currentCommand}, sending cld`);
      await this.sendNonNodeInstruction(paneId);
    }
  }

  /**
   * Send instructions for node panes
   */
  private async sendNodeInstruction(paneId: string): Promise<void> {
    const instruction = generateInstructionMessage();
    
    // Send according to instruction template format (updated to 0.3 seconds per requirements)
    const escapedInstruction = instruction.replace(/'/g, "'\"'\"'");
    await executeTmuxCommand(`tmux send-keys -t ${paneId} '${escapedInstruction}' && sleep 0.3 && tmux send-keys -t ${paneId} Enter`);
    
    // Send additional Enter as specified in requirements (sleep 0.3 && tmux send-keys Enter)
    await sleep(TIMING.ENTER_KEY_DELAY);
    await executeTmuxCommand(`tmux send-keys -t ${paneId} Enter`);
    
    // Wait for pane processing
    await sleep(TIMING.PANE_PROCESSING_DELAY);
  }

  /**
   * Send instructions for non-node panes
   */
  private async sendNonNodeInstruction(paneId: string): Promise<void> {
    // Send "cld" command as specified in requirements
    await executeTmuxCommand(`tmux send-keys -t ${paneId} "cld" && sleep ${TIMING.CLD_COMMAND_DELAY/1000} && tmux send-keys -t ${paneId} Enter`);
    
    // Wait for pane processing
    await sleep(TIMING.PANE_PROCESSING_DELAY);
  }
  
  /**
   * Send status change report to main pane
   */
  async sendStatusChangeReport(mainPaneId: string, changedPanes: PaneStatusInfo[]): Promise<void> {
    if (changedPanes.length === 0) {
      logInfo("No status changes to report");
      return;
    }

    // Format as specified in requirements: #{pane_id} : #{status}
    const reportLines = changedPanes.map(pane => `${pane.paneId} : ${pane.currentStatus}`);
    const report = reportLines.join('\n');
    
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} '${report}'`);
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} Enter`);
    
    // Send additional Enter as specified
    await sleep(TIMING.ENTER_KEY_DELAY);
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} Enter`);
    
    logInfo(`Reported ${changedPanes.length} status changes to main pane`);
  }
  
  /**
   * Send report to main pane
   */
  async sendReport(mainPaneId: string, sessionName: string, targetPaneIds: string[]): Promise<void> {
    const report = generateStatusReport(sessionName, mainPaneId, targetPaneIds);
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} '${report}' `);
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} Enter`);
  }
}

/**
 * Pane Display Class
 */
class PaneDisplayer {
  constructor() {}
  
  /**
   * Display pane list
   */
  async display(): Promise<void> {
    logInfo("\n=== Pane List Display ===");
    const output = await executeTmuxCommand(
      'tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index} #{pane_id} [#{pane_active}] #{pane_current_command} (#{pane_title})"'
    );
    
    console.log(output);
    console.log("=====================\n");
  }
}

/**
 * Main Monitor Class (Integration of Object-Oriented + Global Functions)
 */
class TmuxMonitor {
  private session: TmuxSession;
  private paneManager: PaneManager;
  private communicator: PaneCommunicator;
  private displayer: PaneDisplayer;
  private statusTracker: PaneStatusTracker;
  private scheduledTime: Date | null = null;
  private instructionFile: string | null = null;
  
  constructor(scheduledTime?: Date | null, instructionFile?: string | null) {
    this.session = new TmuxSession();
    this.paneManager = new PaneManager();
    this.communicator = new PaneCommunicator();
    this.displayer = new PaneDisplayer();
    this.statusTracker = new PaneStatusTracker();
    this.scheduledTime = scheduledTime || null;
    this.instructionFile = instructionFile || null;
  }
  
  /**
   * Execute deno task ci and check for errors
   */
  private async executeCIAndCheckErrors(): Promise<boolean> {
    try {
      logInfo("Executing 'deno task ci' to check for errors...");
      const output = await executeTmuxCommand('deno task ci');
      
      // Check for error patterns as specified in requirements
      const errorPatterns = [
        /FAILED \| [0-9]+ passed \| [0-9]+ failed/,
        /error: Test failed/
      ];
      
      const hasError = errorPatterns.some(pattern => pattern.test(output));
      
      if (hasError) {
        logInfo("CI execution detected errors");
        return true;
      } else {
        logInfo("CI execution completed without errors");
        return false;
      }
    } catch (error) {
      logError("Failed to execute CI:", error);
      return true; // Treat execution failure as error
    }
  }

  /**
   * Send instruction file to main pane at startup
   */
  private async sendInstructionFileToMainPane(): Promise<void> {
    if (!this.instructionFile) {
      return;
    }

    const mainPane = this.paneManager.getMainPane();
    if (!mainPane) {
      logError("Main pane not found for instruction file");
      return;
    }

    const instructionMessage = `次の指示書を読んで、内容に従い実行して。 \`${this.instructionFile}\``;
    logInfo(`Sending instruction file to main pane: ${this.instructionFile}`);
    
    // Send instruction file message to main pane with exact format from requirements
    await executeTmuxCommand(`tmux send-keys -t ${mainPane.id} '${instructionMessage}' && sleep 0.3 && tmux send-keys -t ${mainPane.id} Enter`);
    
    logInfo("Instruction file sent to main pane");
  }
  private async sendCIInstructionToMainPane(): Promise<void> {
    const mainPane = this.paneManager.getMainPane();
    if (!mainPane) {
      logError("Main pane not found for CI instruction");
      return;
    }

    logInfo("Sending 'deno task ci' instruction to main pane");
    
    // Send 'deno task ci' to main pane
    await executeTmuxCommand(`tmux send-keys -t ${mainPane.id} 'deno task ci' and worki with your team.`);
    await executeTmuxCommand(`tmux send-keys -t ${mainPane.id} Enter`);
    
    // Send additional Enter as specified
    await sleep(TIMING.ENTER_KEY_DELAY);
    await executeTmuxCommand(`tmux send-keys -t ${mainPane.id} Enter`);
    
    logInfo("CI instruction sent to main pane");
  }

  /**
   * Send additional Enter to all panes as specified in requirements
   */
  private async sendAdditionalEnterToAllPanes(): Promise<void> {
    logInfo("Sending additional Enter to all panes...");
    
    const targetPanes = this.paneManager.getTargetPanes();
    for (const pane of targetPanes) {      // Send additional Enter as specified: sleep 0.3 && tmux send-keys Enter
      await sleep(TIMING.ENTER_KEY_DELAY);
      await executeTmuxCommand(`tmux send-keys -t ${pane.id} Enter`);
    }
    
    logInfo("Additional Enter sent to all panes completed");
  }
  
  /**
   * Send status report instructions to all panes
   */
  private async processAllPanes(): Promise<void> {
    logInfo("Starting status report instructions to panes...");
    
    const targetPanes = this.paneManager.getTargetPanes();
    for (const pane of targetPanes) {
      await this.communicator.sendInstruction(pane.id);
    }
    
    logInfo("All pane instructions completed");
  }
  
  /**
   * Update status tracking for all panes
   */
  private async updateStatusTracking(): Promise<void> {
    const targetPanes = this.paneManager.getTargetPanes();
    
    for (const pane of targetPanes) {
      const paneDetail = await getPaneDetail(pane.id);
      if (paneDetail) {
        const currentStatus = extractStatusFromTitle(paneDetail.title);
        const hasChanged = this.statusTracker.updateStatus(pane.id, currentStatus);
        
        if (hasChanged) {
          logInfo(`Status change detected for pane ${pane.id}: ${currentStatus}`);
        }
      }
    }
  }
  
  /**
   * Report status changes to main pane
   */
  private async reportStatusChanges(): Promise<void> {
    const mainPane = this.paneManager.getMainPane();
    if (!mainPane) {
      logError("Main pane not found for status reporting");
      return;
    }

    const changedPanes = this.statusTracker.getChangedPanes();
    await this.communicator.sendStatusChangeReport(mainPane.id, changedPanes);
    
    // Clear change flags after reporting
    this.statusTracker.clearChangeFlags();
  }
  
  /**
   * Report status of other panes to main pane (legacy method - kept for compatibility)
   */
  private async reportToMainPane(): Promise<void> {
    const mainPane = this.paneManager.getMainPane();
    if (!mainPane) {
      logError("Main pane not found");
      return;
    }

    const sessionName = this.session.getName();
    const targetPaneIds = this.paneManager.getTargetPaneIds();
    
    // Use PaneCommunicator.sendReport for consistency
    await this.communicator.sendReport(mainPane.id, sessionName, targetPaneIds);
  }

  /**
   * Main monitoring loop with CI error checking
   */
  public async monitor(): Promise<void> {
    // If scheduled time is set, wait for it first before starting monitoring (only once)
    if (this.scheduledTime) {
      const interrupted = await waitUntilScheduledTime(this.scheduledTime);
      if (interrupted) {
        logInfo("Monitoring cancelled by user input. Exiting...");
        return;
      }
      // Clear scheduled time after first execution - no more scheduling
      this.scheduledTime = null;
    }
    
    while (true) {
      try {
        logInfo("Starting tmux monitoring...");
        
        // 1. Identify latest session
        await this.session.discover();
        
        // 2. Get pane list
        const allPanes = await this.session.getPanes();
        
        // 3. Separate main pane from other panes
        this.paneManager.separate(allPanes);
        
        // 3.5. Send instruction file to main pane if specified (only on first execution)
        // For scheduled execution, this happens after the scheduled time is reached
        if (this.instructionFile) {
          await this.sendInstructionFileToMainPane();
          // Clear instruction file after first execution to prevent repeated sending
          this.instructionFile = null;
        }
        
        // 4. Update status tracking before processing
        await this.updateStatusTracking();
        
        // 5. Send status report instructions to each pane
        await this.processAllPanes();
        
        // 6. Display list
        await this.displayer.display();
        
        // 7. Send additional Enter to all panes
        await this.sendAdditionalEnterToAllPanes();
        
        // 8. Report status changes to main pane
        await this.reportStatusChanges();
        
        // 8.5. Send pane list report to main pane
        await this.reportToMainPane();
        
        // 9. Wait for 5 minutes with keyboard interrupt (no more scheduled waits)
        logInfo("Waiting for 5 minutes (300 seconds)...");
        const interrupted = await sleepWithKeyboardInterrupt(TIMING.MONITORING_CYCLE_DELAY);
        
        if (interrupted) {
          logInfo("Monitoring cancelled by user input. Exiting...");
          break;
        }
        
        // 10. Execute CI and check for errors
        const hasErrors = await this.executeCIAndCheckErrors();
        
        if (hasErrors) {
          // 11. If errors exist, send CI instruction to main pane
          await this.sendCIInstructionToMainPane();
          // Continue loop (back to step 1)
          continue;
        } else {
          // No errors, exit the process
          logInfo("No errors detected, exiting monitoring");
          break;
        }
        
      } catch (error) {
        logError("Monitoring error:", error);
        // Continue loop on error
        continue;
      }
    }
  }

  /**
   * Continuous monitoring mode
   */
  public async startContinuousMonitoring(): Promise<void> {
    logInfo("Starting continuous monitoring mode (Stop with Ctrl+C)");
    
    while (true) {
      await this.monitor();
      // After the first execution, scheduled time is cleared, so subsequent cycles use normal 5-minute intervals
      logInfo("Waiting for next cycle...\n");
    }
  }
}

// =============================================================================
// Main Execution (Global Functions)
// =============================================================================

/**
 * Global function to parse command line arguments
 */
function parseCommandLineArgs(): { continuous: boolean; scheduledTime: Date | null; instructionFile: string | null } {
  const args = Deno.args;
  let scheduledTime: Date | null = null;
  let instructionFile: string | null = null;
  
  // Look for time parameter (--time=HH:MM or -t HH:MM)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--time=')) {
      const timeStr = arg.substring(7);
      scheduledTime = getNextScheduledTime(timeStr);
      if (!scheduledTime) {
        logError(`Invalid time format: ${timeStr}. Use HH:MM format (e.g., 4:00, 14:30)`);
        Deno.exit(1);
      }
    } else if (arg === '-t' && i + 1 < args.length) {
      const timeStr = args[i + 1];
      scheduledTime = getNextScheduledTime(timeStr);
      if (!scheduledTime) {
        logError(`Invalid time format: ${timeStr}. Use HH:MM format (e.g., 4:00, 14:30)`);
        Deno.exit(1);
      }
    } else if (arg.startsWith('--instruction=')) {
      instructionFile = arg.substring(14);
    } else if (arg === '-i' && i + 1 < args.length) {
      instructionFile = args[i + 1];
    }
  }
  
  return {
    continuous: args.includes('--continuous') || args.includes('-c'),
    scheduledTime,
    instructionFile
  };
}

/**
 * Main entry point of the application
 */
async function main(): Promise<void> {
  const options = parseCommandLineArgs();
  const monitor = new TmuxMonitor(options.scheduledTime, options.instructionFile);
  
  if (options.scheduledTime) {
    const timeStr = options.scheduledTime.toLocaleString('ja-JP', { 
      timeZone: 'Asia/Tokyo',
      hour: '2-digit', 
      minute: '2-digit'
    });
    logInfo(`Scheduled execution time: ${timeStr} (Asia/Tokyo)`);
  }
  
  if (options.instructionFile) {
    logInfo(`Instruction file specified: ${options.instructionFile}`);
  }
  
  if (options.continuous) {
    await monitor.startContinuousMonitoring();
  } else {
    await monitor.monitor();
  }
}

// =============================================================================
// Application Startup
// =============================================================================

if (import.meta.main) {
  await main();
}
