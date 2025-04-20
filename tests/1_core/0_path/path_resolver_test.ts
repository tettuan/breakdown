/**
 * Tests for path resolution functionality according to docs/breakdown/path.ja.md
 *
 * Purpose:
 * - Verify input path resolution rules
 * - Test output path resolution rules
 * - Validate path hierarchy handling
 * - Test directory vs file path detection
 */

import { assertEquals } from "jsr:@std/assert";
import { join } from "jsr:@std/path/join";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing/bdd";
import { PathResolver } from "../../../lib/path/path.ts";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  TestEnvironment,
} from "../../helpers/setup.ts";

describe("PathResolver", () => {
  let resolver: PathResolver;
  let testDir: string;
  let env: TestEnvironment;

  beforeEach(async () => {
    env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
    });
    testDir = env.workingDir;
    resolver = new PathResolver(testDir);

    // Ensure directory structure exists
    await resolver.validateDirectoryStructure();
  });

  afterEach(async () => {
    await cleanupTestEnvironment(env);
  });

  describe("resolveInputPath", () => {
    it("should use fromFile path hierarchy when provided", async () => {
      const path = await resolver.resolveInputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: join("path", "to", "file.md"),
        },
      });

      assertEquals(path, join("path", "to", "file.md"));
    });

    it("should use fromLayerType for directory when provided", async () => {
      const path = await resolver.resolveInputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: "file.md",
          fromLayerType: "project",
        },
      });

      assertEquals(path, join(testDir, "project", "file.md"));
    });

    it("should use layerType for directory when fromLayerType not provided", async () => {
      const path = await resolver.resolveInputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: "file.md",
        },
      });

      assertEquals(path, join(testDir, "issue", "file.md"));
    });

    it("should return empty path when fromFile not provided", async () => {
      const path = await resolver.resolveInputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {},
      });

      assertEquals(path, "");
    });

    it("should handle Windows-style paths", async () => {
      const path = await resolver.resolveInputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: "path\\to\\file.md",
        },
      });

      assertEquals(path, join("path", "to", "file.md"));
    });
  });

  describe("resolveOutputPath", () => {
    it("should generate default path when destinationFile not provided", async () => {
      const path = await resolver.resolveOutputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {},
      });

      // Test that path follows the pattern: {workingDir}/{layerType}/{YYYYMMDD}_{hash}.md
      const pattern = new RegExp(
        `^tmp/test_path_resolver/issue/\\d{8}_[a-f0-9]{7}\\.md$`,
      );
      const normalizedPath = path.replace(/\\/g, "/");
      console.log("Generated path:", normalizedPath);
      console.log("Expected pattern:", pattern);
      assertEquals(pattern.test(normalizedPath), true);
    });

    it("should use destinationFile as is when it has path hierarchy and extension", async () => {
      const destinationFile = join("path", "to", "file.md");
      const path = await resolver.resolveOutputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: { destinationFile },
      });

      assertEquals(path, destinationFile);
    });

    it("should use layerType directory when destinationFile is filename only", async () => {
      const path = await resolver.resolveOutputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          destinationFile: "file.md",
        },
      });

      assertEquals(path, join(testDir, "issue", "file.md"));
    });

    it("should generate filename when destinationFile is directory", async () => {
      const destinationDir = join("path", "to", "dir");
      await Deno.mkdir(join(testDir, destinationDir), { recursive: true });

      const path = await resolver.resolveOutputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: { destinationFile: destinationDir },
      });

      const pattern = new RegExp(
        `^${destinationDir.replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`,
      );
      assertEquals(pattern.test(path.replace(/\\/g, "/")), true);
    });

    it("should handle directory vs file detection correctly", async () => {
      // Create a directory with the same name as a potential file
      const ambiguousPath = "test.md";
      await Deno.mkdir(join(testDir, ambiguousPath));

      const path = await resolver.resolveOutputPath({
        demonstrativeType: "to",
        layerType: "issue",
        options: { destinationFile: ambiguousPath },
      });

      const pattern = new RegExp(
        `^${ambiguousPath.replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`,
      );
      assertEquals(pattern.test(path.replace(/\\/g, "/")), true);
    });

    it("should handle hash collisions", async () => {
      // Mock Date.now() to ensure same date
      const realNow = Date.now;
      Date.now = () => new Date("2025-01-01").getTime();

      try {
        const paths = new Set();
        for (let i = 0; i < 10; i++) {
          const path = await resolver.resolveOutputPath({
            demonstrativeType: "to",
            layerType: "issue",
            options: {},
          });
          paths.add(path);
        }

        assertEquals(paths.size, 10, "Should generate unique paths");
      } finally {
        Date.now = realNow;
      }
    });
  });
});
