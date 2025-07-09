import { assertEquals } from "../deps.ts";
import { WorkspaceErrorHandlerImpl } from "./error_handler.ts";
import { createWorkspaceInitError, WorkspaceError } from "./errors.ts";
import { BreakdownLogger as _BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("WorkspaceErrorHandler", async (t) => {
  // Pre-processing and Preparing Part
  const _handler = new WorkspaceErrorHandlerImpl();
  const _logger = new _BreakdownLogger();

  // Main Test
  await t.step("should handle workspace-specific errors", () => {
    _logger.debug("Testing workspace error handling");
    const errorInterface = createWorkspaceInitError("Initialization failed");
    const error = new WorkspaceError(errorInterface.message, errorInterface.code);
    const _output = captureConsoleOutput(() => {
      _handler.handleError(error, "INIT");
    });
    assertEquals(_output, "[INIT] WorkspaceError: Initialization failed\n");
  });

  await t.step("should handle unexpected errors", () => {
    _logger.debug("Testing unexpected error handling");
    const error = new Error("Unexpected error");
    const _output = captureConsoleOutput(() => {
      _handler.handleError(error, "UNKNOWN");
    });
    assertEquals(_output, "[UNKNOWN] Unexpected error: Unexpected error\n");
  });

  await t.step("should log errors with context", () => {
    _logger.debug("Testing error logging with context");
    const error = new WorkspaceError("Test error", "TEST_ERROR");
    const context = { test: "value" };
    const _output = captureConsoleOutput(() => {
      _handler.logError(error, context);
    });
    const logged = JSON.parse(_output);
    assertEquals(logged.name, "WorkspaceError");
    assertEquals(logged.message, "Test error");
    assertEquals(logged.context, context);
  });
});

// Helper function to capture console output
function captureConsoleOutput(fn: () => void): string {
  const testLogger = new _BreakdownLogger();
  const originalConsoleError = console.error;
  let _output = "";
  console.error = (...args: unknown[]) => {
    _output += args.join(" ") + "\n";
    // Also log with BreakdownLogger for consistency
    testLogger.warn("Console error captured", { args });
  };
  fn();
  console.error = originalConsoleError;
  return _output;
}
