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
 * Features:
 *   - Discovers the most active tmux session automatically
 *   - Separates main pane (active) from target panes (inactive)
 *   - Sends status update instructions to target panes
 *   - Reports pane status to main pane
 *   - Displays comprehensive pane list
 *   - Supports both single-run and continuous monitoring modes
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
  // Look for status patterns in the title
  for (const status of WORKER_STATUS) {
    if (title.includes(status)) {
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
    
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} '${report}' Enter`);
    
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
    await executeTmuxCommand(`tmux send-keys -t ${mainPaneId} '${report}' Enter`);
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
  
  constructor() {
    this.session = new TmuxSession();
    this.paneManager = new PaneManager();
    this.communicator = new PaneCommunicator();
    this.displayer = new PaneDisplayer();
    this.statusTracker = new PaneStatusTracker();
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
   * Send CI instruction to main pane
   */
  private async sendCIInstructionToMainPane(): Promise<void> {
    const mainPane = this.paneManager.getMainPane();
    if (!mainPane) {
      logError("Main pane not found for CI instruction");
      return;
    }

    logInfo("Sending 'deno task ci' instruction to main pane");
    
    // Send 'deno task ci' to main pane
    await executeTmuxCommand(`tmux send-keys -t ${mainPane.id} 'deno task ci' Enter`);
    
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
    
    const report = generateStatusReport(sessionName, mainPane.id, targetPaneIds);
    await executeTmuxCommand(`tmux send-keys -t ${mainPane.id} '${report}' Enter`);
  }

  /**
   * Main monitoring loop with CI error checking
   */
  public async monitor(): Promise<void> {
    while (true) {
      try {
        logInfo("Starting tmux monitoring...");
        
        // 1. Identify latest session
        await this.session.discover();
        
        // 2. Get pane list
        const allPanes = await this.session.getPanes();
        
        // 3. Separate main pane from other panes
        this.paneManager.separate(allPanes);
        
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
        
        // 9. Wait for 5 minutes
        logInfo("Waiting for 5 minutes (300 seconds)...");
        await sleep(TIMING.MONITORING_CYCLE_DELAY);
        
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
function parseCommandLineArgs(): { continuous: boolean } {
  const args = Deno.args;
  return {
    continuous: args.includes('--continuous') || args.includes('-c')
  };
}

/**
 * Main entry point of the application
 */
async function main(): Promise<void> {
  const monitor = new TmuxMonitor();
  const options = parseCommandLineArgs();
  
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
