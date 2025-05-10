import { assertEquals } from "jsr:@std/assert";
import { WorkspaceImpl } from "../../../lib/workspace/workspace.ts";
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger";

Deno.test("Workspace", async (t) => {
  // Pre-processing and Preparing Part
  const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
  const workspace = new WorkspaceImpl({
    workingDir: ".",
    promptBaseDir: "prompts",
    schemaBaseDir: "schema",
  });

  // Main Test
  await t.step("should initialize workspace", async () => {
    logger.debug("Testing workspace initialization");
    await workspace.initialize();
    const exists = await workspace.exists();
    assertEquals(exists, true);
  });

  await t.step("should resolve paths correctly", async () => {
    logger.debug("Testing path resolution");
    const path = await workspace.resolvePath("test/path");
    assertEquals(path, ".agent/breakdown/test/path");
  });

  await t.step("should handle directory operations", async () => {
    logger.debug("Testing directory operations");
    const dirPath = "test/dir";
    await workspace.createDirectory(dirPath);
    const exists = await workspace.exists(dirPath);
    assertEquals(exists, true);
    await workspace.removeDirectory(dirPath);
    const removed = !(await workspace.exists(dirPath));
    assertEquals(removed, true);
  });

  // Cleanup
  await Deno.remove(".agent/breakdown", { recursive: true });
});
