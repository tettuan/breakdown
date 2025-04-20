import { assertEquals, assertRejects } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";
import { exists } from "jsr:@std/fs/exists";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";
import { Workspace } from "../../../lib/workspace/workspace.ts";

const logger = new BreakdownLogger();

interface TestOptions extends TestEnvironment {
  debug?: boolean;
}

Deno.test({
  name: "init - new environment",
  async fn() {
    const options: TestOptions = { workingDir: "tmp/test/init", logger };
    await setupTestEnvironment(options);
    const workspace = new Workspace({ workingDir: options.workingDir });
    await workspace.initialize();

    // Verify directories are created
    assertEquals(await exists(join(options.workingDir, "prompts")), true);
    assertEquals(await exists(join(options.workingDir, "schemas")), true);

    await cleanupTestEnvironment(options);
  },
});

Deno.test({
  name: "init - existing environment",
  async fn() {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test/init-existing" });
    try {
      // Create existing environment
      const workspace = new Workspace({ workingDir: env.workingDir });
      await workspace.initialize();

      // Modify a file to check if it's preserved
      const configFile = join(env.workingDir, "prompts", "app.yml");
      await Deno.writeTextFile(configFile, "modified: true");

      // Initialize again
      const workspace2 = new Workspace({ workingDir: env.workingDir });
      await workspace2.initialize();

      // Verify file is preserved
      const content = await Deno.readTextFile(configFile);
      assertEquals(content, "modified: true");
    } finally {
      await cleanupTestEnvironment(env);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "init - with custom working directory",
  async fn() {
    const options: TestOptions = { workingDir: "tmp/test/init-custom", logger };
    await setupTestEnvironment(options);
    const customDir = join(options.workingDir, "custom");
    const workspace = new Workspace({ workingDir: customDir });
    await workspace.initialize();

    // Verify directories are created in custom location
    assertEquals(await exists(join(customDir, "prompts")), true);
    assertEquals(await exists(join(customDir, "schemas")), true);

    await cleanupTestEnvironment(options);
  },
});

Deno.test({
  name: "init - with debug output",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-debug",
      debug: true,
      logger,
    };

    // Set debug log level
    const originalLogLevel = Deno.env.get("LOG_LEVEL");
    Deno.env.set("LOG_LEVEL", "debug");

    try {
      // Capture console output
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = (message: string) => {
        logs.push(message);
        originalConsoleLog(message);
      };

      try {
        await setupTestEnvironment(options);
        const workspace = new Workspace({ workingDir: options.workingDir });
        await workspace.initialize();

        // Check if we got debug output
        const debugLogs = logs.filter((log) => log.includes("[DEBUG]"));
        assertEquals(debugLogs.length > 0, true, "Expected debug output in test environment setup");
      } finally {
        console.log = originalConsoleLog;
      }
    } finally {
      // Restore original log level
      if (originalLogLevel) {
        Deno.env.set("LOG_LEVEL", originalLogLevel);
      } else {
        Deno.env.delete("LOG_LEVEL");
      }
      await cleanupTestEnvironment(options);
    }
  },
});

Deno.test({
  name: "init - error handling",
  async fn() {
    const options: TestOptions = { workingDir: "tmp/test/init-error", logger };
    await setupTestEnvironment(options);

    // Create a file where we expect a directory
    await Deno.writeTextFile(join(options.workingDir, "prompts"), "");

    await assertRejects(
      async () => {
        const workspace = new Workspace({ workingDir: options.workingDir });
        await workspace.initialize();
      },
      Error,
      "Failed to create workspace directories",
    );

    await cleanupTestEnvironment(options);
  },
});
