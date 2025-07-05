import { assertEquals, assertRejects } from "../../deps.ts";
import { WorkspacePathResolverImpl } from "./resolver.ts";
import { PlatformAgnosticPathStrategy } from "./strategies.ts";
import { BreakdownLogger as _BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("WorkspacePathResolver", async (t) => {
  // Pre-processing and Preparing Part
  const _baseDir = "/workspace";
  const strategy = new PlatformAgnosticPathStrategy(_baseDir);
  const resolver = new WorkspacePathResolverImpl(strategy);
  const _logger = new _BreakdownLogger();

  // Main Test
  await t.step("should handle path resolution and normalization", async () => {
    _logger.debug("Testing path resolution and normalization");

    // Test path resolution
    assertEquals(await resolver.resolve("test"), "/workspace/test");
    assertEquals(await resolver.resolve("dir/subdir"), "/workspace/dir/subdir");

    // Test path normalization
    assertEquals(await resolver.normalize("dir//subdir"), "dir/subdir");
    assertEquals(await resolver.normalize("dir\\subdir"), "dir/subdir");
  });

  await t.step("should validate paths", async () => {
    _logger.debug("Testing path validation");
    // Valid paths
    const normValidPath = await resolver.normalize("valid/path");
    const normValidBackslash = await resolver.normalize("valid\\path");
    const validPathResult = await resolver.validate("valid/path");
    const validBackslashResult = await resolver.validate("valid\\path");
    _logger.debug(`normalize('valid/path') = ${normValidPath}`);
    _logger.debug(`normalize('valid\\path') = ${normValidBackslash}`);
    _logger.debug(`validate('valid/path') = ${validPathResult}`);
    _logger.debug(`validate('valid\\path') = ${validBackslashResult}`);
    assertEquals(validPathResult, true);
    assertEquals(validBackslashResult, true);
    // Invalid paths
    const normInvalidDoubleSlash = await resolver.normalize("invalid//path");
    const normInvalidDoubleBackslash = await resolver.normalize("invalid\\\\path");
    const invalidDoubleSlashResult = await resolver.validate("invalid//path");
    const invalidDoubleBackslashResult = await resolver.validate("invalid\\\\path");
    _logger.debug(`normalize('invalid//path') = ${normInvalidDoubleSlash}`);
    _logger.debug(`normalize('invalid\\\\path') = ${normInvalidDoubleBackslash}`);
    _logger.debug(`validate('invalid//path') = ${invalidDoubleSlashResult}`);
    _logger.debug(`validate('invalid\\\\path') = ${invalidDoubleBackslashResult}`);
    assertEquals(invalidDoubleSlashResult, false);
    assertEquals(invalidDoubleBackslashResult, false);
  });

  await t.step("should handle invalid paths", async () => {
    _logger.debug("Testing invalid path handling");
    await assertRejects(
      () => resolver.resolve("invalid//path"),
      Error,
      "Invalid path: invalid//path",
    );
  });

  await t.step("should support strategy updates", async () => {
    _logger.debug("Testing strategy updates");
    const newStrategy = new PlatformAgnosticPathStrategy(_baseDir);
    resolver.updateStrategy(newStrategy);
    assertEquals(await resolver.resolve("test"), "/workspace/test");
  });
});
