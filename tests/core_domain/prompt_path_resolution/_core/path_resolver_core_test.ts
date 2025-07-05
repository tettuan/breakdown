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

import { assertEquals } from "../../../lib/deps.ts";
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

function makeCliParams(
  { demonstrativeType, layerType, fromFile, destinationFile, fromLayerType, adaptation, config }: {
    demonstrativeType: string;
    layerType: string;
    fromFile?: string;
    destinationFile?: string;
    fromLayerType?: string;
    adaptation?: string;
    config?: string;
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
      config,
    },
  };
}

// All tests below assume config/app_prompt.base_dir = "prompts" and app_schema.base_dir = "schema" in the test working directory.
// Directory structure is always created under the configured baseDir.

describe("Input Path: fromFile hierarchy", () => {
  it("should resolve relative path correctly", async () => {
    const logger = new BreakdownLogger();
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "prompts", "summary", "project"));
    await ensureDir(join(testDir, "prompts", "defect", "task"));
    await ensureDir(join(testDir, "schema", "to", "issue"));
    await ensureDir(join(testDir, "schema", "summary", "project"));
    await ensureDir(join(testDir, "schema", "defect", "task"));

    // Create required prompt files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_project_strict.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "prompts", "summary", "project", "f_project.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "prompts", "defect", "task", "f_task.md"),
      "# Test prompt",
    );

    // Create required schema files
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "summary", "project", "base.schema.md"),
      "# Test schema",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "defect", "task", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const fromFile = join("path", "to", "file.md");
      logger.debug(`Deno.cwd() before: ${originalCwd}`);
      logger.debug(`Deno.cwd() after: ${Deno.cwd()}`);
      logger.debug(`fromFile param: ${fromFile}`);
      const cliParams = makeCliParams(
        {
          demonstrativeType: "to",
          layerType: "issue",
          fromFile,
          config: "test-path-resolver",
        },
        testDir,
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_project.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        fromFile: "file.md",
        fromLayerType: "project",
        config: "test-path-resolver",
      }, testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.inputFilePath, path.resolve("file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve with layerType when fromLayerType not provided", async () => {
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        fromFile: "file.md",
        config: "test-path-resolver",
      }, testDir);
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        config: "test-path-resolver",
      }, testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.inputFilePath, "");
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve Windows-style path", async () => {
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        fromFile: "path\\to\\file.md",
        config: "test-path-resolver",
      }, testDir);
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        config: "test-path-resolver",
      }, testDir);
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const destinationFile = join("path", "to", "file.md");
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        destinationFile,
        config: "test-path-resolver",
      }, testDir);
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.outputFilePath, path.resolve("path/to/file.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve filename only", async () => {
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        destinationFile: "file.md",
        config: "test-path-resolver",
      }, testDir);
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const destinationDir = join("path", "to", "dir");
      await Deno.mkdir(join(testDir, destinationDir), { recursive: true });
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        destinationFile: destinationDir,
        config: "test-path-resolver",
      }, testDir);
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const ambiguousPath = "test.md";
      await Deno.mkdir(ambiguousPath);
      const cliParams = makeCliParams({
        demonstrativeType: "to",
        layerType: "issue",
        destinationFile: ambiguousPath,
        config: "test-path-resolver",
      }, testDir);
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_issue.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const realNow = Date.now;
      Date.now = () => new Date("2025-01-01").getTime();
      try {
        const paths = new Set();
        for (let i = 0; i < 10; i++) {
          const cliParams = makeCliParams({
            demonstrativeType: "to",
            layerType: "issue",
            config: "test-path-resolver",
          }, testDir);
          cliParams.demonstrativeType = "to";
          cliParams.layerType = "issue";
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
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "to", "issue"));
    await ensureDir(join(testDir, "schema", "to", "issue"));
    await ensureDir(join(testDir, "issue")); // output directory

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "to", "issue", "f_project_strict.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "to", "issue", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const _ = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schema" },
      };
      const cliParams = {
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: "project.md",
          destinationFile: "issue.md",
          fromLayerType: "project",
          adaptation: "strict",
          config: "test-path-resolver",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.promptFilePath, path.resolve("prompts/to/issue/f_project_strict.md"));
      assertEquals(factory.inputFilePath, path.resolve("project.md"));
      assertEquals(factory.outputFilePath, path.resolve("issue/issue.md"));
      assertEquals(factory.schemaFilePath, path.resolve("schema/to/issue/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve all subclass paths for summary/project", async () => {
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "summary", "project"));
    await ensureDir(join(testDir, "schema", "summary", "project"));
    await ensureDir(join(testDir, "project")); // output directory

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "summary", "project", "f_project.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "summary", "project", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const _ = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schema" },
      };
      const cliParams = {
        demonstrativeType: "summary",
        layerType: "project",
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
          fromLayerType: "",
          adaptation: "",
          config: "test-path-resolver",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.promptFilePath, path.resolve("prompts/summary/project/f_project.md"));
      assertEquals(factory.inputFilePath, path.resolve("input.md"));
      assertEquals(factory.outputFilePath, path.resolve("project/output.md"));
      assertEquals(factory.schemaFilePath, path.resolve("schema/summary/project/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
  it("should resolve all subclass paths for defect/task with absolute destinationFile", async () => {
    const env = await setupTestEnvironment({
      workingDir: "./tmp/test_path_resolver",
      configSetName: "test-path-resolver",
    });
    const testDir = env.workingDir;

    // Create required prompt and schema directory structure
    await ensureDir(join(testDir, "prompts", "defect", "task"));
    await ensureDir(join(testDir, "schema", "defect", "task"));
    await ensureDir(join(testDir, "tmp")); // for absolute destination

    // Create required files
    await Deno.writeTextFile(
      join(testDir, "prompts", "defect", "task", "f_task.md"),
      "# Test prompt",
    );
    await Deno.writeTextFile(
      join(testDir, "schema", "defect", "task", "base.schema.md"),
      "# Test schema",
    );

    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const _ = {
        app_prompt: { base_dir: "prompts" },
        app_schema: { base_dir: "schema" },
      };
      const absDest = path.resolve("tmp/defect_task.md");
      const cliParams = {
        demonstrativeType: "defect",
        layerType: "task",
        options: {
          fromFile: "task_input.md",
          destinationFile: absDest,
          fromLayerType: "",
          adaptation: "",
          config: "test-path-resolver",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      assertEquals(factory.promptFilePath, path.resolve("prompts/defect/task/f_task.md"));
      assertEquals(factory.inputFilePath, path.resolve("task_input.md"));
      assertEquals(factory.outputFilePath, absDest);
      assertEquals(factory.schemaFilePath, path.resolve("schema/defect/task/base.schema.md"));
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(env);
    }
  });
});
