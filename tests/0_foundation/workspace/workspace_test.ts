import { assertEquals } from "jsr:@std/assert";
import { WorkspaceImpl } from "../../../lib/workspace/workspace.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { join } from "@std/path/join";

Deno.test("Workspace", async (t) => {
  // Pre-processing and Preparing Part
  const tempDir = await Deno.makeTempDir();
  const logger = new BreakdownLogger();
  const workspace = new WorkspaceImpl({
    workingDir: tempDir,
    promptBaseDir: join(tempDir, "prompts"),
    schemaBaseDir: join(tempDir, "schema"),
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
    const dirPath = join(tempDir, "test/dir");
    await workspace.createDirectory(dirPath);
    const exists = await workspace.exists(dirPath);
    assertEquals(exists, true);
    await workspace.removeDirectory(dirPath);
    const removed = !(await workspace.exists(dirPath));
    assertEquals(removed, true);
  });

  // Cleanup
  await Deno.remove(tempDir, { recursive: true });
});
