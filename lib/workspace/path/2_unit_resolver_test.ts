import { assertEquals, assertRejects } from "jsr:@std/assert";
import { WorkspacePathResolverImpl } from "./resolver.ts";
import { PlatformAgnosticPathStrategy } from "./strategies.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("WorkspacePathResolver", async (t) => {
  // Pre-processing and Preparing Part
  const baseDir = "/workspace";
  const strategy = new PlatformAgnosticPathStrategy(baseDir);
  const resolver = new WorkspacePathResolverImpl(strategy);
  const logger = new BreakdownLogger();

  // Main Test
  await t.step("should handle path resolution and normalization", async () => {
    logger.debug("Testing path resolution and normalization");

    // Test path resolution
    assertEquals(await resolver.resolve("test"), "/workspace/test");
    assertEquals(await resolver.resolve("dir/subdir"), "/workspace/dir/subdir");

    // Test path normalization
    assertEquals(await resolver.normalize("dir//subdir"), "dir/subdir");
    assertEquals(await resolver.normalize("dir\\subdir"), "dir/subdir");
  });

  await t.step("should validate paths", async () => {
    logger.debug("Testing path validation");
    // Valid paths
    const normValidPath = await resolver.normalize("valid/path");
    const normValidBackslash = await resolver.normalize("valid\\path");
    const validPathResult = await resolver.validate("valid/path");
    const validBackslashResult = await resolver.validate("valid\\path");
    logger.debug(`normalize('valid/path') = ${normValidPath}`);
    logger.debug(`normalize('valid\\path') = ${normValidBackslash}`);
    logger.debug(`validate('valid/path') = ${validPathResult}`);
    logger.debug(`validate('valid\\path') = ${validBackslashResult}`);
    assertEquals(validPathResult, true);
    assertEquals(validBackslashResult, true);
    // Invalid paths
    const normInvalidDoubleSlash = await resolver.normalize("invalid//path");
    const normInvalidDoubleBackslash = await resolver.normalize("invalid\\\\path");
    const invalidDoubleSlashResult = await resolver.validate("invalid//path");
    const invalidDoubleBackslashResult = await resolver.validate("invalid\\\\path");
    logger.debug(`normalize('invalid//path') = ${normInvalidDoubleSlash}`);
    logger.debug(`normalize('invalid\\\\path') = ${normInvalidDoubleBackslash}`);
    logger.debug(`validate('invalid//path') = ${invalidDoubleSlashResult}`);
    logger.debug(`validate('invalid\\\\path') = ${invalidDoubleBackslashResult}`);
    assertEquals(invalidDoubleSlashResult, false);
    assertEquals(invalidDoubleBackslashResult, false);
  });

  await t.step("should handle invalid paths", async () => {
    logger.debug("Testing invalid path handling");
    await assertRejects(
      () => resolver.resolve("invalid//path"),
      Error,
      "Invalid path: invalid//path",
    );
  });

  await t.step("should support strategy updates", async () => {
    logger.debug("Testing strategy updates");
    const newStrategy = new PlatformAgnosticPathStrategy(baseDir);
    resolver.updateStrategy(newStrategy);
    assertEquals(await resolver.resolve("test"), "/workspace/test");
  });
});
