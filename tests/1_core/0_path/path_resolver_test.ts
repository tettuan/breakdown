/*
 * Tests for path resolution functionality according to docs/breakdown/path.ja.md
 *
 * IMPORTANT: All path resolution is based on config/app_prompt.base_dir (and app_schema.base_dir).
 * - Each test sets up a config file with app_prompt.base_dir and app_schema.base_dir in the test working directory.
 * - No promptDir or baseDir override is supported; config is the only source of truth.
 * - All expected paths are based on the config's baseDir ("prompts"), not hardcoded or empty/undefined.
 * - Tests expecting empty or undefined path as a valid result are now considered error cases.
 * - Directory structure is always created under the configured baseDir.
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  // TestEnvironment,
} from "../../helpers/setup.ts";
import { ensureDir } from "jsr:@std/fs@0.224.0";
// import { resolve } from "@std/path/resolve";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import * as path from "@std/path";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";

function makeCliParams(
  { demonstrativeType, layerType, fromFile, destinationFile, fromLayerType, adaptation }: {
    demonstrativeType: DemonstrativeType;
    layerType: LayerType;
    fromFile?: string;
    destinationFile?: string;
    fromLayerType?: string;
    adaptation?: string;
  },
  _testDir: string,
) {
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

// All tests below assume config/app_prompt.base_dir = "prompts" and app_schema.base_dir = "schemas" in the test working directory.
// Directory structure is always created under the configured baseDir.

describe("Input Path: fromFile hierarchy", () => {
  it("should resolve relative path correctly", async () => {
    const logger = new BreakdownLogger();
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    // --- Config setup ---
    const configDir = join(".agent", "breakdown", "config");
    await ensureDir(configDir);
    const configPath = join(configDir, "app.yml");
    await Deno.writeTextFile(
      configPath,
      `working_dir: ${_testDir}\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`,
    );
    // Ensure config file exists before continuing
    const configExistsAfterWrite = await Deno.stat(configPath).then(() => true).catch(() => false);
    if (!configExistsAfterWrite) {
      throw new Error(`Config file was not found after write at: ${configPath}`);
    }
    logger.debug(`Checking config file at: ${configPath}`);
    const configExists = await Deno.stat(configPath).then(() => true).catch(() => false);
    logger.debug(`Config exists: ${configExists}`);
    if (!configExists) {
      throw new Error(`Config file not found at: ${configPath}`);
    }
    try {
      const fromFile = join("path", "to", "file.md");
      logger.debug(`Deno.cwd() before: ${originalCwd}`);
      logger.debug(`Deno.cwd() after: ${Deno.cwd()}`);
      logger.debug(`fromFile param: ${fromFile}`);
      const cliParams = makeCliParams(
        { demonstrativeType: "to" as DemonstrativeType, layerType: "issue" as LayerType, fromFile },
        _testDir,
      );
      const factory = await PromptVariablesFactory.create(cliParams);
      const resolved = factory.inputFilePath;
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
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        fromFile: "file.md",
        fromLayerType: "project",
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.inputFilePath, path.resolve("file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve with layerType when fromLayerType not provided", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        fromFile: "file.md",
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.inputFilePath, path.resolve("file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Input Path: fromFile edge cases", () => {
  it("should return empty string if fromFile not provided", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.inputFilePath, "");
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve Windows-style path", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        fromFile: "path\\to\\file.md",
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.inputFilePath, path.resolve("path/to/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Output Path: destinationFile patterns", () => {
  it("should resolve default path pattern", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      const pathVal = factory.outputFilePath;
      const expectedDir = path.resolve("issue");
      const pattern = new RegExp(`^${expectedDir.replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`);
      const normalizedPath = pathVal.replace(/\\/g, "/");
      assertEquals(pattern.test(normalizedPath), true);
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve path hierarchy and extension", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const destinationFile = join("path", "to", "file.md");
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        destinationFile,
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.outputFilePath, path.resolve("path/to/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve filename only", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        destinationFile: "file.md",
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.outputFilePath, path.resolve("issue/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});

describe("Output Path: Directory vs File Ambiguity and Hash", () => {
  it("should resolve directory destinationFile", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const destinationDir = join("path", "to", "dir");
      await Deno.mkdir(join(_testDir, destinationDir), { recursive: true });
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        destinationFile: destinationDir,
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      const pathVal = factory.outputFilePath;
      const pattern = new RegExp(
        `^${path.resolve("path/to/dir").replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`,
      );
      assertEquals(pattern.test(pathVal.replace(/\\/g, "/")), true);
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve ambiguous directory vs file", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const ambiguousPath = "test.md";
      await Deno.mkdir(ambiguousPath);
      const cliParams = makeCliParams({
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        destinationFile: ambiguousPath,
      }, _testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      const pathVal = factory.outputFilePath;
      const pattern = new RegExp(
        `^${path.resolve(ambiguousPath).replace(/\\/g, "/")}/\\d{8}_[a-f0-9]{7}\\.md$`,
      );
      assertEquals(pattern.test(pathVal.replace(/\\/g, "/")), true);
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should generate unique paths for hash collisions", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const realNow = Date.now;
      Date.now = () => new Date("2025-01-01").getTime();
      try {
        const paths = new Set();
        for (let i = 0; i < 10; i++) {
          const cliParams = makeCliParams({
            demonstrativeType: "to" as DemonstrativeType,
            layerType: "issue" as LayerType,
          }, _testDir);
          cliParams.demonstrativeType = "to" as DemonstrativeType;
          cliParams.layerType = "issue" as LayerType;
          const factory = await PromptVariablesFactory.create(cliParams);
          paths.add(factory.outputFilePath);
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
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const _ = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      const cliParams = {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {
          fromFile: "project.md",
          destinationFile: "issue.md",
          fromLayerType: "project",
          adaptation: "strict",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.promptFilePath, path.resolve("prompts/to/issue/f_project_strict.md"));
      assertEquals(factory.inputFilePath, path.resolve("project.md"));
      assertEquals(factory.outputFilePath, path.resolve("issue/issue.md"));
      assertEquals(factory.schemaFilePath, path.resolve("schemas/to/issue/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve all subclass paths for summary/project", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const _ = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      const cliParams = {
        demonstrativeType: "summary" as DemonstrativeType,
        layerType: "project" as LayerType,
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
          fromLayerType: "",
          adaptation: "",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.promptFilePath, path.resolve("prompts/summary/project/f_project.md"));
      assertEquals(factory.inputFilePath, path.resolve("input.md"));
      assertEquals(factory.outputFilePath, path.resolve("project/output.md"));
      assertEquals(factory.schemaFilePath, path.resolve("schemas/summary/project/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve all subclass paths for defect/task with absolute destinationFile", async () => {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test_path_resolver" });
    const _testDir = env.workingDir;
    const originalCwd = Deno.cwd();
    Deno.chdir(_testDir);
    try {
      const _ = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schemas" },
      };
      const absDest = path.resolve("tmp/defect_task.md");
      const cliParams = {
        demonstrativeType: "defect" as DemonstrativeType,
        layerType: "task" as LayerType,
        options: {
          fromFile: "task_input.md",
          destinationFile: absDest,
          fromLayerType: "",
          adaptation: "",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.promptFilePath, path.resolve("prompts/defect/task/f_task.md"));
      assertEquals(factory.inputFilePath, path.resolve("task_input.md"));
      assertEquals(factory.outputFilePath, absDest);
      assertEquals(factory.schemaFilePath, path.resolve("schemas/defect/task/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});
