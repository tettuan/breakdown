import { assertEquals } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";
import { exists } from "jsr:@std/fs/exists";
import { assertDirectoryExists } from "$test/helpers/assertions.ts";
import { cleanupTestEnvironment, setupTestEnvironment } from "$test/helpers/setup.ts";
import { Workspace } from "../../../lib/workspace/workspace.ts";

Deno.test("setup - environment initialization", async () => {
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/setup" });
  try {
    // Verify working directory was created
    const workingDirExists = await Deno.stat(env.workingDir).then(
      () => true,
      () => false,
    );
    assertEquals(workingDirExists, true, "Working directory should be created");

    // Initialize workspace to create directory structure
    const workspace = new Workspace({
      workingDir: env.workingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });
    await workspace.initialize();

    // Verify directory structure
    await assertDirectoryExists(join(env.workingDir, ".agent", "breakdown"));
    await assertDirectoryExists(join(env.workingDir, ".agent", "breakdown", "prompts"));
    await assertDirectoryExists(join(env.workingDir, ".agent", "breakdown", "schema"));
    await assertDirectoryExists(join(env.workingDir, ".agent", "breakdown", "config"));

    // Verify config file exists
    const configFileExists = await exists(
      join(env.workingDir, ".agent", "breakdown", "config", "app.yml"),
    );
    assertEquals(configFileExists, true, "Config file should exist");
  } finally {
    await cleanupTestEnvironment(env);
  }
});

Deno.test("setup - cleanup", async () => {
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/setup-cleanup" });
  try {
    // Create test files
    const testDir = join(env.workingDir, "test");
    await Deno.mkdir(testDir, { recursive: true });
    await Deno.writeTextFile(join(testDir, "test.txt"), "test");

    // Verify files exist
    assertEquals(await exists(testDir), true, "Test directory should exist");
    assertEquals(
      await exists(join(testDir, "test.txt")),
      true,
      "Test file should exist",
    );

    // Clean up
    await cleanupTestEnvironment(env);

    // Verify cleanup
    assertEquals(
      await exists(env.workingDir),
      false,
      "Working directory should be removed",
    );
  } finally {
    // Ensure cleanup even if test fails
    try {
      await cleanupTestEnvironment(env);
    } catch {
      // Ignore cleanup errors in finally block
    }
  }
});
