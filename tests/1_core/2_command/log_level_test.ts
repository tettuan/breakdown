import { assertEquals } from "$std/assert/mod.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { setupTestEnvironment, cleanupTestEnvironment } from "../../helpers/setup.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Test log level configuration
Deno.test({
  name: "log level - debug mode",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("log-basic"));
    try {
      // Set log level to debug
      Deno.env.set("LOG_LEVEL", "debug");
      
      // Create a new logger instance
      const logger = new BreakdownLogger();
      
      // Capture debug output
      const originalConsoleDebug = console.debug;
      let debugOutput = "";
      console.debug = (msg: string) => {
        debugOutput += msg + "\n";
      };
      
      // Log a debug message
      logger.debug("Test debug message");
      
      // Restore console.debug
      console.debug = originalConsoleDebug;
      
      // Verify debug message was logged
      assertEquals(debugOutput.includes("Test debug message"), true);
    } finally {
      await cleanupTestEnvironment(env);
      // Reset log level
      Deno.env.delete("LOG_LEVEL");
    }
  },
});

// Test log level hierarchy
Deno.test({
  name: "log level - hierarchy",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("log-config"));
    try {
      // Set log level to info
      Deno.env.set("LOG_LEVEL", "info");
      
      const logger = new BreakdownLogger();
      
      // Capture output
      const originalConsole = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      };
      
      let output = {
        debug: "",
        info: "",
        warn: "",
        error: "",
      };
      
      console.debug = (msg: string) => output.debug += msg + "\n";
      console.info = (msg: string) => output.info += msg + "\n";
      console.warn = (msg: string) => output.warn += msg + "\n";
      console.error = (msg: string) => output.error += msg + "\n";
      
      // Log messages at different levels
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warning message");
      logger.error("Error message");
      
      // Restore console methods
      Object.assign(console, originalConsole);
      
      // Debug should not be logged when level is info
      assertEquals(output.debug, "");
      // Info and above should be logged
      assertEquals(output.info.includes("Info message"), true);
      assertEquals(output.warn.includes("Warning message"), true);
      assertEquals(output.error.includes("Error message"), true);
    } finally {
      await cleanupTestEnvironment(env);
      Deno.env.delete("LOG_LEVEL");
    }
  },
});

Deno.test({
  name: "log level - basic functionality",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("log-basic"));
    try {
      // Test implementation
    } finally {
      await cleanupTestEnvironment(env);
    }
  }
});

Deno.test({
  name: "log level - configuration",
  async fn() {
    const env = await setupTestEnvironment(getTestEnvOptions("log-config"));
    try {
      // Test implementation
    } finally {
      await cleanupTestEnvironment(env);
    }
  }
}); 