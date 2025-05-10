import { assertEquals } from "jsr:@std/assert";
import { WorkspaceErrorHandlerImpl } from "../../../lib/workspace/error_handler.ts";
import { WorkspaceError, WorkspaceInitError } from "../../../lib/workspace/errors.ts";
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger";

Deno.test("WorkspaceErrorHandler", async (t) => {
  // Pre-processing and Preparing Part
  const handler = new WorkspaceErrorHandlerImpl();
  const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });

  // Main Test
  await t.step("should handle workspace-specific errors", () => {
    logger.debug("Testing workspace error handling");
    const error = new WorkspaceInitError("Initialization failed");
    const output = captureConsoleOutput(() => {
      handler.handleError(error, "INIT");
    });
    assertEquals(output, "[INIT] WorkspaceInitError: Initialization failed\n");
  });

  await t.step("should handle unexpected errors", () => {
    logger.debug("Testing unexpected error handling");
    const error = new Error("Unexpected error");
    const output = captureConsoleOutput(() => {
      handler.handleError(error, "UNKNOWN");
    });
    assertEquals(output, "[UNKNOWN] Unexpected error: Unexpected error\n");
  });

  await t.step("should log errors with context", () => {
    logger.debug("Testing error logging with context");
    const error = new WorkspaceError("Test error", "TEST_ERROR");
    const context = { test: "value" };
    const output = captureConsoleOutput(() => {
      handler.logError(error, context);
    });
    const logged = JSON.parse(output);
    assertEquals(logged.name, "WorkspaceError");
    assertEquals(logged.message, "Test error");
    assertEquals(logged.context, context);
  });
});

// Helper function to capture console output
function captureConsoleOutput(fn: () => void): string {
  const originalConsoleError = console.error;
  let output = "";
  console.error = (...args: unknown[]) => {
    output += args.join(" ") + "\n";
  };
  fn();
  console.error = originalConsoleError;
  return output;
} 