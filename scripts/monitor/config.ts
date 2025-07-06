// =============================================================================
// Configuration and Constants
// =============================================================================

export interface TimingConfig {
  readonly INSTRUCTION_DELAY: number;
  readonly ENTER_KEY_DELAY: number;
  readonly PANE_PROCESSING_DELAY: number;
  readonly MONITORING_CYCLE_DELAY: number;
  readonly CLD_COMMAND_DELAY: number;
  readonly ENTER_SEND_CYCLE_DELAY: number;
  readonly MAX_RUNTIME: number;
}

export const TIMING: TimingConfig = {
  INSTRUCTION_DELAY: 200, // 0.2 seconds - delay after sending instruction
  ENTER_KEY_DELAY: 300, // 0.3 seconds - delay before sending additional Enter
  PANE_PROCESSING_DELAY: 1000, // 1 second - delay after processing each pane
  MONITORING_CYCLE_DELAY: 300000, // 5*60 seconds (300 seconds) - delay between monitoring cycles
  CLD_COMMAND_DELAY: 200, // 0.2 seconds - delay for cld command
  ENTER_SEND_CYCLE_DELAY: 30000, // 30 seconds - delay between sending ENTER to all panes
  MAX_RUNTIME: 14400000, // 4 hours in milliseconds (4 * 60 * 60 * 1000)
} as const;

export const WORKER_STATUS_TYPES = [
  "IDLE",
  "WORKING",
  "BLOCKED",
  "DONE",
  "TERMINATED",
  "UNKNOWN",
] as const;
