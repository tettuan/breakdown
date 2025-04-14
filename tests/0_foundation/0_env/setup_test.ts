import { assertEquals } from "$std/testing/asserts.ts";
import { join } from "$std/path/mod.ts";
import { exists } from "$std/fs/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  assertDirectoryExists,
  assertFileExists,
} from "$test/helpers/assertions.ts";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";

Deno.test("setup - environment initialization", async () => {
  const env = await setupTestEnvironment({ workingDir: "./tmp/test/setup" });
  try {
    // Verify working directory was created
    const exists = await Deno.stat(env.workingDir).then(
      () => true,
      () => false
    );
    assertEquals(exists, true, "Working directory should be created");

    // Verify directory structure
    await assertDirectoryExists(join(env.workingDir, "breakdown"));
    await assertDirectoryExists(join(env.workingDir, "breakdown", "prompts"));
    await assertDirectoryExists(join(env.workingDir, "breakdown", "schema"));
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
      "Test file should exist"
    );

    // Clean up
    await cleanupTestEnvironment(env);

    // Verify cleanup
    assertEquals(
      await exists(env.workingDir),
      false,
      "Working directory should be removed"
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