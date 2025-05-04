/**
 * Tests for path resolution functionality according to docs/breakdown/path.ja.md
 *
 * Purpose:
 * - Verify input path resolution rules
 * - Test output path resolution rules
 * - Validate path hierarchy handling
 * - Test directory vs file path detection
 * - Check all sub-class path resolutions (prompt, input, output, schema) for the same config/params
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path/join";
import { PathResolver } from "../../../lib/path/path.ts";
import { PromptVariablesFactory } from "../../../lib/factory/PromptVariablesFactory.ts";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  TestEnvironment,
} from "../../helpers/setup.ts";
import { exists, ensureDir } from "jsr:@std/fs@0.224.0";
import { resolve } from "@std/path/resolve";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import * as path from "@std/path";

function makeCliParams({ demonstrativeType, layerType, fromFile, destinationFile, fromLayerType, adaptation }: any, testDir: string) {
  return {
    demonstrativeType,
    layerType,
    options: {
      fromFile: fromFile ?? undefined,
      destinationFile: destinationFile ?? undefined,
      fromLayerType,
      adaptation,
    },
  };
}

describe("Input Path: fromFile hierarchy", () => {
  it("should resolve relative path correctly", async () => {
    const logger = new BreakdownLogger();
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const fromFile = join("path", "to", "file.md");
      logger.debug(`Deno.cwd() before: ${originalCwd}`);
      logger.debug(`Deno.cwd() after: ${Deno.cwd()}`);
      logger.debug(`fromFile param: ${fromFile}`);
      const cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", fromFile }, testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      const resolver = new PathResolver(factory);
      const resolved = resolver.getInputPath();
      logger.debug(`resolved path: ${resolved}`);
      logger.debug(`expected path: ${path.resolve("path/to/file.md")}`);
      assertEquals(resolved, path.resolve("path/to/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Input Path: fromLayerType vs layerType", () => {
  it("should resolve with fromLayerType provided", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", fromFile: "file.md", fromLayerType: "project" }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      assertEquals(resolver.getInputPath(), path.resolve("project/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve with layerType when fromLayerType not provided", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", fromFile: "file.md" }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      assertEquals(resolver.getInputPath(), path.resolve("issue/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Input Path: fromFile edge cases", () => {
  it("should return empty string if fromFile not provided", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue" }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      assertEquals(resolver.getInputPath(), "");
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve Windows-style path", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", fromFile: "path\\to\\file.md" }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      assertEquals(resolver.getInputPath(), path.resolve("path/to/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Output Path: destinationFile patterns", () => {
  it("should resolve default path pattern", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue" }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      let pathVal = resolver.getOutputPath();
      let expectedDir = path.resolve("issue");
      let pattern = new RegExp(`^${expectedDir.replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`);
      let normalizedPath = pathVal.replace(/\\/g, "/");
      assertEquals(pattern.test(normalizedPath), true);
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve path hierarchy and extension", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const destinationFile = join("path", "to", "file.md");
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", destinationFile }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      assertEquals(resolver.getOutputPath(), path.resolve("path/to/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve filename only", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", destinationFile: "file.md" }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      assertEquals(resolver.getOutputPath(), path.resolve("issue/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Output Path: Directory vs File Ambiguity and Hash", () => {
  it("should resolve directory destinationFile", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let destinationDir = join("path", "to", "dir");
      await Deno.mkdir(join(testDir, destinationDir), { recursive: true });
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", destinationFile: destinationDir }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      let pathVal = resolver.getOutputPath();
      let pattern = new RegExp(`^${path.resolve("path/to/dir").replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`);
      assertEquals(pattern.test(pathVal.replace(/\\/g, "/")), true);
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve ambiguous directory vs file", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const ambiguousPath = "test.md";
      await Deno.mkdir(ambiguousPath);
      let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue", destinationFile: ambiguousPath }, testDir);
      let factory = await PromptVariablesFactory.create(cliParams);
      let resolver = new PathResolver(factory);
      let pathVal = resolver.getOutputPath();
      let pattern = new RegExp(`^${path.resolve(ambiguousPath).replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`);
      assertEquals(pattern.test(pathVal.replace(/\\/g, "/")), true);
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should generate unique paths for hash collisions", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const realNow = Date.now;
      Date.now = () => new Date("2025-01-01").getTime();
      try {
        const paths = new Set();
        for (let i = 0; i < 10; i++) {
          let cliParams = makeCliParams({ demonstrativeType: "to", layerType: "issue" }, testDir);
          let factory = await PromptVariablesFactory.create(cliParams);
          let resolver = new PathResolver(factory);
          paths.add(resolver.getOutputPath());
        }
        assertEquals(paths.size, 10, "Should generate unique paths");
      } finally {
        Date.now = realNow;
      }
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Factory Combination: resolves all subclass paths", () => {
  it("should resolve all subclass paths for project->issue conversion", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let config = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      let cliParams = {
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: "project.md",
          destinationFile: "issue.md",
          fromLayerType: "project",
          adaptation: "strict",
        },
      };
      let factory = await PromptVariablesFactory.create(cliParams, config.app_prompt.base_dir);
      assertEquals(factory.promptFilePath, path.resolve("prompts/to/issue/f_project_strict.md"));
      assertEquals(factory.inputFilePath, path.resolve("project/project.md"));
      assertEquals(factory.outputFilePath, path.resolve("issue/issue.md"));
      assertEquals(factory.schemaFilePath, path.resolve("schemas/to/issue/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve all subclass paths for summary/project", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let config = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      let cliParams = {
        demonstrativeType: "summary",
        layerType: "project",
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
          fromLayerType: "",
          adaptation: "",
        },
      };
      let factory = await PromptVariablesFactory.create(cliParams, config.app_prompt.base_dir);
      assertEquals(factory.promptFilePath, path.resolve("prompts/summary/project/f_project.md"));
      assertEquals(factory.inputFilePath, path.resolve("project/input.md"));
      assertEquals(factory.outputFilePath, path.resolve("project/output.md"));
      assertEquals(factory.schemaFilePath, path.resolve("schemas/summary/project/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve all subclass paths for defect/task with absolute destinationFile", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      let config = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      const absDest = path.resolve("tmp/defect_task.md");
      let cliParams = {
        demonstrativeType: "defect",
        layerType: "task",
        options: {
          fromFile: "task_input.md",
          destinationFile: absDest,
          fromLayerType: "",
          adaptation: "",
        },
      };
      let factory = await PromptVariablesFactory.create(cliParams, config.app_prompt.base_dir);
      assertEquals(factory.promptFilePath, path.resolve("prompts/defect/task/f_task.md"));
      assertEquals(factory.inputFilePath, path.resolve("task/task_input.md"));
      assertEquals(factory.outputFilePath, absDest);
      assertEquals(factory.schemaFilePath, path.resolve("schemas/defect/task/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});
