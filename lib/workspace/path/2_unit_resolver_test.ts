import { assertEquals, assertRejects } from "@std/assert";
import { WorkspacePathResolverImpl } from "./_resolver.ts";
import { PlatformAgnosticPathStrategy } from "./strategies.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("WorkspacePathResolver", async (t) => {
  // Pre-processing and Preparing Part
  const _baseDir = "/workspace";
  const strategy = new PlatformAgnosticPathStrategy(baseDir);
  const _resolver = new WorkspacePathResolverImpl(strategy);
  const _logger = new BreakdownLogger();

  // Main Test
  await t.step("should handle path resolution and normalization", async () => {
    _logger.debug("Testing path resolution and normalization");

    // Test path resolution
    assertEquals(await _resolver.resolve("test"), "/workspace/test");
    assertEquals(await _resolver.resolve("dir/subdir"), "/workspace/dir/subdir");

    // Test path normalization
    assertEquals(await _resolver.normalize("dir//subdir"), "dir/subdir");
    assertEquals(await _resolver.normalize("dir\\subdir"), "dir/subdir");
  });

  await t.step("should validate paths", async () => {
    _logger.debug("Testing path validation");
    // Valid paths
    const normValidPath = await _resolver.normalize("valid/path");
    const normValidBackslash = await _resolver.normalize("valid\\path");
    const validPathResult = await _resolver.validate("valid/path");
    const validBackslashResult = await _resolver.validate("valid\\path");
    _logger.debug(`normalize('valid/path') = ${normValidPath}`);
    _logger.debug(`normalize('valid\\path') = ${normValidBackslash}`);
    _logger.debug(`validate('valid/path') = ${validPathResult}`);
    _logger.debug(`validate('valid\\path') = ${validBackslashResult}`);
    assertEquals(validPathResult, true);
    assertEquals(validBackslashResult, true);
    // Invalid paths
    const normInvalidDoubleSlash = await _resolver.normalize("invalid//path");
    const normInvalidDoubleBackslash = await _resolver.normalize("invalid\\\\path");
    const invalidDoubleSlashResult = await _resolver.validate("invalid//path");
    const invalidDoubleBackslashResult = await _resolver.validate("invalid\\\\path");
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
      () => _resolver.resolve("invalid//path"),
      Error,
      "Invalid path: invalid//path",
    );
  });

  await t.step("should support strategy updates", async () => {
    _logger.debug("Testing strategy updates");
    const newStrategy = new PlatformAgnosticPathStrategy(baseDir);
    _resolver.updateStrategy(newStrategy);
    assertEquals(await _resolver.resolve("test"), "/workspace/test");
  });
});
