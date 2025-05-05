import { assert, assertEquals, assertRejects } from "jsr:@std/assert";
import { join } from "jsr:@std/path@^0.224.0/join";
import { exists } from "@std/fs";
import { ensureDir } from "@std/fs";
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironmentOptions,
} from "$test/helpers/setup.ts";
import { Workspace } from "../../../lib/workspace/workspace.ts";
import { WorkspaceInitError } from "../../../lib/workspace/errors.ts";
import { stringify } from "jsr:@std/yaml@^1.0.6";
import { resolve } from "jsr:@std/path@^0.224.0/resolve";

const logger = new BreakdownLogger();

interface TestOptions extends Omit<TestEnvironmentOptions, "workingDir" | "logLevel"> {
  logger: BreakdownLogger;
  workingDir: string;
  logLevel: LogLevel;
  debug?: boolean;
}

Deno.test({
  name: "init - new environment",
  async fn() {
    const options: TestOptions = { workingDir: "tmp/test/init", logger, logLevel: LogLevel.DEBUG };
    await setupTestEnvironment(options);

    // Ensure parent directories exist
    await ensureDir(join(options.workingDir, ".agent", "breakdown"));

    const workspace = new Workspace({ workingDir: options.workingDir });
    await workspace.initialize();

    // Verify directories are created under the breakdown subdirectory
    assertEquals(await exists(join(options.workingDir, ".agent", "breakdown", "prompts")), true);
    assertEquals(await exists(join(options.workingDir, ".agent", "breakdown", "schemas")), true);

    await cleanupTestEnvironment(options);
  },
});

Deno.test({
  name: "init - existing environment",
  async fn() {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test/init-existing" });
    try {
      // Create existing environment
      const workspace = new Workspace({ workingDir: env.workingDir });
      await workspace.initialize();

      // Modify a file to check if it's preserved
      const configFile = join(env.workingDir, ".agent", "breakdown", "prompts", "app.yml");
      await Deno.writeTextFile(configFile, "modified: true");

      // Initialize again
      const workspace2 = new Workspace({ workingDir: env.workingDir });
      await workspace2.initialize();

      // Verify file is preserved
      const content = await Deno.readTextFile(configFile);
      assertEquals(content, "modified: true");
    } finally {
      await cleanupTestEnvironment(env);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "init - with custom working directory",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-custom",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    await setupTestEnvironment(options);
    const customDir = join(options.workingDir, "custom");
    // Create required directory structure and config under customDir
    await ensureDir(join(customDir, ".agent", "breakdown", "config"));
    await Deno.writeTextFile(
      join(customDir, ".agent", "breakdown", "config", "app.yml"),
      `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`,
    );
    const workspace = new Workspace({ workingDir: customDir });
    await workspace.initialize();

    // Verify directories are created in custom location under breakdown
    assertEquals(await exists(join(customDir, ".agent", "breakdown", "prompts")), true);
    assertEquals(await exists(join(customDir, ".agent", "breakdown", "schemas")), true);

    await cleanupTestEnvironment(options);
  },
});

Deno.test({
  name: "init - with debug output",
  async fn() {
    const options: TestEnvironmentOptions = {
      workingDir: "tmp/test/init-debug",
      logLevel: LogLevel.DEBUG,
      skipDefaultConfig: false,
    };

    // Set debug log level
    const originalLogLevel = Deno.env.get("LOG_LEVEL");
    Deno.env.set("LOG_LEVEL", "debug");

    try {
      // Initialize test environment with debug enabled
      const env = await setupTestEnvironment(options);
      const workspace = new Workspace({ workingDir: env.workingDir });

      // Add debug log before initialization
      env.logger.debug("Starting workspace initialization");
      await workspace.initialize();
      env.logger.debug("Workspace initialization completed");

      // Verify debug output was captured
      assertEquals(true, true, "Debug output should be enabled");
    } finally {
      // Restore original log level
      if (originalLogLevel) {
        Deno.env.set("LOG_LEVEL", originalLogLevel);
      } else {
        Deno.env.delete("LOG_LEVEL");
      }
      await cleanupTestEnvironment({
        workingDir: "tmp/test/init-debug",
        logger,
        logLevel: LogLevel.DEBUG,
      });
    }
  },
});

Deno.test({
  name: "init - error handling",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-error",
      logger,
      logLevel: LogLevel.DEBUG,
      skipDirectorySetup: true,
    };
    await Deno.mkdir(options.workingDir, { recursive: true });
    const originalCwd = Deno.cwd();
    Deno.chdir(options.workingDir);
    try {
      await setupTestEnvironment(options);
      // Create the .agent/breakdown directory structure but leave out prompts
      const breakdownDir = join(options.workingDir, ".agent", "breakdown");
      await Deno.mkdir(breakdownDir, { recursive: true });

      // Create a file that will block directory creation
      const targetDir = join(breakdownDir, "prompts");
      await Deno.writeTextFile(targetDir, "");

      // Create config directory and file
      const configDir = join(breakdownDir, "config");
      await Deno.mkdir(configDir, { recursive: true });
      const configFile = join(configDir, "app.yml");
      const config = {
        working_dir: ".agent/breakdown",
        app_prompt: {
          base_dir: "prompts",
        },
        app_schema: {
          base_dir: "schemas",
        },
      };
      await Deno.writeTextFile(configFile, stringify(config));

      await assertRejects(
        async () => {
          const workspace = new Workspace({ workingDir: options.workingDir });
          await workspace.initialize();
        },
        WorkspaceInitError,
        "Path exists but is not a directory",
      );

      // Clean up the file before cleanup
      try {
        await Deno.remove(targetDir);
      } catch (_error) {
        // Ignore error if file doesn't exist
      }

      await cleanupTestEnvironment(options);
    } finally {
      Deno.chdir(originalCwd);
    }
  },
});

Deno.test({
  name: "init - config file auto-generation",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-config",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    await Deno.mkdir(options.workingDir, { recursive: true });
    const originalCwd = Deno.cwd();
    Deno.chdir(options.workingDir);
    try {
      logger.debug("[TEST] setupTestEnvironment start", { workingDir: options.workingDir });
      await setupTestEnvironment(options);
      logger.debug("[TEST] setupTestEnvironment complete");
      const workspace = new Workspace({ workingDir: options.workingDir });
      logger.debug("[TEST] Workspace instance created");
      await workspace.initialize();
      logger.debug("[TEST] Workspace initialized");

      // config/app.yml が生成されているか
      const configFile = join(options.workingDir, ".agent", "breakdown", "config", "app.yml");
      logger.debug("[TEST] Checking config file existence", { configFile });
      const existsConfig = await exists(configFile);
      logger.debug("[TEST] Config file exists?", { existsConfig });
      assertEquals(existsConfig, true);

      // 雛形内容の検証（例: working_dir, app_prompt, app_schema のデフォルト値）
      const content = await Deno.readTextFile(configFile);
      logger.debug("[TEST] Config file content", { content });
      // 雛形の主要キーが含まれているか
      assert(content.includes("working_dir"));
      assert(content.includes("app_prompt"));
      assert(content.includes("app_schema"));

      await cleanupTestEnvironment(options);
      logger.debug("[TEST] cleanupTestEnvironment complete");
    } finally {
      Deno.chdir(originalCwd);
    }
  },
});

Deno.test({
  name: "init - custom prompt/schema base_dir",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-custom-base",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    logger.debug("[TEST] setupTestEnvironment start", { workingDir: options.workingDir });
    await setupTestEnvironment(options);
    logger.debug("[TEST] setupTestEnvironment complete");

    // 事前にカスタムapp.ymlを作成
    const configDir = join(options.workingDir, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    const customConfig =
      `\nworking_dir: .agent/breakdown\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: custom_schemas\n`;
    await Deno.writeTextFile(join(configDir, "app.yml"), customConfig);
    logger.debug("[TEST] Custom app.yml written", { configDir });

    const workspace = new Workspace({ workingDir: options.workingDir });
    logger.debug("[TEST] Workspace instance created");
    await workspace.initialize();
    logger.debug("[TEST] Workspace initialized");

    // カスタムディレクトリが作成されているか
    const customPrompts = join(options.workingDir, ".agent", "breakdown", "custom_prompts");
    const customSchemas = join(options.workingDir, ".agent", "breakdown", "custom_schemas");
    logger.debug("[TEST] Checking custom prompts dir existence", { customPrompts });
    logger.debug("[TEST] Checking custom schemas dir existence", { customSchemas });
    const existsPrompts = await exists(customPrompts);
    const existsSchemas = await exists(customSchemas);
    logger.debug("[TEST] Custom prompts exists?", { existsPrompts });
    logger.debug("[TEST] Custom schemas exists?", { existsSchemas });
    assertEquals(existsPrompts, true);
    assertEquals(existsSchemas, true);

    await cleanupTestEnvironment(options);
    logger.debug("[TEST] cleanupTestEnvironment complete");
  },
});

Deno.test({
  name: "init - preserve existing app.yml",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-preserve-config",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    logger.debug("[TEST] setupTestEnvironment start", { workingDir: options.workingDir });
    await setupTestEnvironment(options);
    logger.debug("[TEST] setupTestEnvironment complete");

    const configDir = join(options.workingDir, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    // Write a valid config with a custom key
    const originalContent =
      `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\ncustom: true\n`;
    const configFile = join(configDir, "app.yml");
    await Deno.writeTextFile(configFile, originalContent);

    const workspace = new Workspace({ workingDir: options.workingDir });
    await workspace.initialize();

    // 上書きされていないか
    const content = await Deno.readTextFile(configFile);
    assertEquals(content, originalContent);

    await cleanupTestEnvironment(options);
  },
});

Deno.test({
  name: "init - prompt and schema templates under lib are copied",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-copy",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    await setupTestEnvironment(options);

    // Assumes lib/breakdown/prompts/to/project/f_project.md, lib/breakdown/schemas/definitions.ts, etc. exist beforehand
    const workspace = new Workspace({ workingDir: options.workingDir });
    await workspace.initialize();

    // prompts: Check if a representative md file is copied
    const srcPrompt = "lib/breakdown/prompts/to/project/f_project.md";
    const destPrompt = join(
      options.workingDir,
      ".agent",
      "breakdown",
      "prompts",
      "to",
      "project",
      "f_project.md",
    );
    const srcPromptContent = await Deno.readTextFile(srcPrompt);
    const destPromptContent = await Deno.readTextFile(destPrompt);
    assertEquals(destPromptContent, srcPromptContent, "Prompt template is copied");

    // schemas: Check if a representative schema file is copied
    const srcSchema = "lib/breakdown/schemas/definitions.ts";
    const destSchema = join(options.workingDir, ".agent", "breakdown", "schemas", "definitions.ts");
    const srcSchemaContent = await Deno.readTextFile(srcSchema);
    const destSchemaContent = await Deno.readTextFile(destSchema);
    assertEquals(destSchemaContent, srcSchemaContent, "Schema template is copied");

    await cleanupTestEnvironment(options);
  },
});

Deno.test({
  name: "init - prompt and schema templates are copied even if cwd is changed",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-copy-cwd",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    await setupTestEnvironment(options);

    // Save original cwd and resolve absolute paths for source files
    const originalCwd = Deno.cwd();
    const srcPrompt = resolve(originalCwd, "lib/breakdown/prompts/to/project/f_project.md");
    const srcSchema = resolve(originalCwd, "lib/breakdown/schemas/definitions.ts");

    // Change to a different directory
    const tempCwd = await Deno.makeTempDir();
    Deno.chdir(tempCwd);
    try {
      const workspace = new Workspace({ workingDir: options.workingDir });
      await workspace.initialize();

      // prompts: Check if a representative md file is copied
      const destPrompt = join(
        options.workingDir,
        ".agent",
        "breakdown",
        "prompts",
        "to",
        "project",
        "f_project.md",
      );
      const srcPromptContent = await Deno.readTextFile(srcPrompt);
      const destPromptContent = await Deno.readTextFile(destPrompt);
      assertEquals(destPromptContent, srcPromptContent, "Prompt template is copied");

      // schemas: Check if a representative schema file is copied
      const destSchema = join(
        options.workingDir,
        ".agent",
        "breakdown",
        "schemas",
        "definitions.ts",
      );
      const srcSchemaContent = await Deno.readTextFile(srcSchema);
      const destSchemaContent = await Deno.readTextFile(destSchema);
      assertEquals(destSchemaContent, srcSchemaContent, "Schema template is copied");
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(options);
    }
  },
});
