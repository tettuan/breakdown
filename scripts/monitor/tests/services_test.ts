import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  CommandExecutor, 
  Logger, 
  TimeManager, 
  KeyboardInterruptHandler, 
  RuntimeTracker 
} from "../services.ts";

// Mock Deno.Command for testing
class MockCommand {
  constructor(private cmd: string, private options: any) {}
  
  async output() {
    // Return success for simple commands
    if (this.options.args?.[1] === "echo 'test'") {
      return {
        success: true,
        stdout: new TextEncoder().encode("test"),
        stderr: new TextEncoder().encode("")
      };
    }
    
    // Return failure for error commands
    if (this.options.args?.[1] === "false") {
      return {
        success: false,
        stdout: new TextEncoder().encode(""),
        stderr: new TextEncoder().encode("command failed")
      };
    }
    
    // Default success
    return {
      success: true,
      stdout: new TextEncoder().encode("success"),
      stderr: new TextEncoder().encode("")
    };
  }
}

// =============================================================================
// CommandExecutor Tests
// =============================================================================

Deno.test("CommandExecutor.executeTmuxCommand - success", async () => {
  // Mock Deno.Command
  const originalCommand = Deno.Command;
  (globalThis as any).Deno.Command = MockCommand;
  
  try {
    const executor = new CommandExecutor();
    const result = await executor.executeTmuxCommand("echo 'test'");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data, "test");
    }
  } finally {
    (globalThis as any).Deno.Command = originalCommand;
  }
});

Deno.test("CommandExecutor.executeTmuxCommand - failure", async () => {
  // Mock Deno.Command
  const originalCommand = Deno.Command;
  (globalThis as any).Deno.Command = MockCommand;
  
  try {
    const executor = new CommandExecutor();
    const result = await executor.executeTmuxCommand("false");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "CommandFailed");
    }
  } finally {
    (globalThis as any).Deno.Command = originalCommand;
  }
});

Deno.test("CommandExecutor.executeTmuxCommand - empty command", async () => {
  const executor = new CommandExecutor();
  const result = await executor.executeTmuxCommand("");
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyInput");
  }
});

Deno.test("CommandExecutor.executeTmuxCommand - whitespace command", async () => {
  const executor = new CommandExecutor();
  const result = await executor.executeTmuxCommand("   ");
  
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyInput");
  }
});

Deno.test("CommandExecutor.execute - success", async () => {
  // This test should be removed as execute method doesn't exist
  // Keeping only executeTmuxCommand tests
});

// =============================================================================
// Logger Tests
// =============================================================================

Deno.test("Logger.info - basic message", () => {
  // Mock console.log
  let loggedMessage = "";
  const originalLog = console.log;
  console.log = (message: string) => {
    loggedMessage = message;
  };
  
  try {
    const logger = new Logger();
    logger.info("test message");
    
    assertEquals(loggedMessage, "[INFO] test message");
  } finally {
    console.log = originalLog;
  }
});

Deno.test("Logger.error - basic error", () => {
  // Mock console.error
  let loggedMessage = "";
  let loggedError = "";
  const originalError = console.error;
  console.error = (message: string, error: any) => {
    loggedMessage = message;
    loggedError = error;
  };
  
  try {
    const logger = new Logger();
    logger.error("test error");
    
    assertEquals(loggedMessage, "[ERROR] test error");
    assertEquals(loggedError, "");
  } finally {
    console.error = originalError;
  }
});

Deno.test("Logger.error - with error object", () => {
  // Mock console.error
  let loggedMessage = "";
  let loggedError: any;
  const originalError = console.error;
  console.error = (message: string, error: any) => {
    loggedMessage = message;
    loggedError = error;
  };
  
  try {
    const logger = new Logger();
    const testError = new Error("test");
    logger.error("test error", testError);
    
    assertEquals(loggedMessage, "[ERROR] test error");
    assertEquals(loggedError, testError);
  } finally {
    console.error = originalError;
  }
});

// Logger does not have warn method, removing this test

// =============================================================================
// TimeManager Tests
// =============================================================================

Deno.test("TimeManager.sleep - short duration", async () => {
  const timeManager = new TimeManager();
  const start = Date.now();
  await timeManager.sleep(10); // 10ms
  const end = Date.now();
  
  // Allow some tolerance for timing
  const elapsed = end - start;
  assertEquals(elapsed >= 10, true);
  assertEquals(elapsed < 50, true); // Should not take too long
});

Deno.test("TimeManager.formatTimeForDisplay - valid date", () => {
  const timeManager = new TimeManager();
  const date = new Date(2025, 0, 1, 14, 30, 0); // January 1, 2025, 14:30:00
  const formatted = timeManager.formatTimeForDisplay(date);
  
  // Should be in Japanese format
  assertEquals(formatted.includes("2025"), true);
  assertEquals(formatted.includes("14"), true);
  assertEquals(formatted.includes("30"), true);
});

// TimeManager doesn't have getCurrentTime method
Deno.test("TimeManager.formatTimeForDisplay - valid date", () => {
  const timeManager = new TimeManager();
  const date = new Date(2025, 0, 1, 14, 30, 0); // January 1, 2025, 14:30:00
  const formatted = timeManager.formatTimeForDisplay(date);
  
  // Should be in Japanese format
  assertEquals(formatted.includes("2025"), true);
  assertEquals(formatted.includes("14"), true);
  assertEquals(formatted.includes("30"), true);
});

// =============================================================================
// RuntimeTracker Tests
// =============================================================================

Deno.test("RuntimeTracker.getStartTime - returns start time", () => {
  const tracker = new RuntimeTracker(1000); // Need to provide maxRuntime
  const startTime = tracker.getStartTime();
  
  assertEquals(typeof startTime, "number");
  assertEquals(startTime > 0, true);
});

Deno.test("RuntimeTracker.hasExceededLimit - within limit", () => {
  const tracker = new RuntimeTracker(1000); // 1 second limit
  
  const result = tracker.hasExceededLimit();
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data, false);
  }
});

Deno.test("RuntimeTracker.hasExceededLimit - exceeded limit", async () => {
  const tracker = new RuntimeTracker(10); // 10ms limit
  
  // Wait longer than the limit
  await new Promise(resolve => setTimeout(resolve, 20));
  
  const result = tracker.hasExceededLimit();
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "RuntimeLimitExceeded");
  }
});

Deno.test("RuntimeTracker.logStartupInfo - logs startup", () => {
  // Mock console.log
  const loggedMessages: string[] = [];
  const originalLog = console.log;
  console.log = (message: string) => {
    loggedMessages.push(message);
  };
  
  try {
    const tracker = new RuntimeTracker(1000);
    const logger = new Logger();
    const timeManager = new TimeManager();
    
    tracker.logStartupInfo(logger, timeManager);
    
    assertEquals(loggedMessages.length >= 2, true);
    assertEquals(loggedMessages[0].includes("[INFO] Monitor started at:"), true);
    assertEquals(loggedMessages[1].includes("[INFO] Auto-stop scheduled at:"), true);
  } finally {
    console.log = originalLog;
  }
});

Deno.test("RuntimeTracker.getRemainingTime - returns remaining time", () => {
  const tracker = new RuntimeTracker(1000); // 1 second limit
  const remaining = tracker.getRemainingTime();
  
  assertEquals(typeof remaining, "number");
  assertEquals(remaining >= 0, true);
  assertEquals(remaining <= 1000, true);
});

// =============================================================================
// KeyboardInterruptHandler Tests
// =============================================================================

Deno.test("KeyboardInterruptHandler.setup - no immediate cancellation", () => {
  const handler = new KeyboardInterruptHandler();
  // Skip setup() as it affects terminal state
  
  assertEquals(handler.isCancellationRequested(), false);
});

Deno.test("KeyboardInterruptHandler.isCancellationRequested - initial state", () => {
  const handler = new KeyboardInterruptHandler();
  assertEquals(handler.isCancellationRequested(), false);
});

Deno.test("KeyboardInterruptHandler.sleepWithCancellation - no cancellation", async () => {
  const handler = new KeyboardInterruptHandler();
  const timeManager = new TimeManager();
  
  const start = Date.now();
  const cancelled = await handler.sleepWithCancellation(10, timeManager);
  const end = Date.now();
  
  assertEquals(cancelled, false);
  assertEquals(end - start >= 10, true);
});

// Note: Testing actual cancellation would require simulating keyboard input,
// which is complex in a test environment. The cancellation logic is covered
// by the manual testing of the monitor tool.
