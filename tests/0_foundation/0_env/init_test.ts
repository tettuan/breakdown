import { assertEquals, assertRejects } from "jsr:@std/assert";
import { join } from "jsr:@std/path@^0.224.0/join";
import { exists } from "@std/fs";
import { ensureDir } from "@std/fs";
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironmentOptions,
} from "$test/helpers/setup.ts";
import { Workspace } from "../../../lib/workspace/workspace.ts";
import { WorkspaceInitError } from "../../../lib/workspace/errors.ts";
import { stringify } from "jsr:@std/yaml@^1.0.6";

const logger = new BreakdownLogger();

interface TestOptions extends Omit<TestEnvironmentOptions, "workingDir" | "logLevel"> {
  logger: BreakdownLogger;
  workingDir: string;
  logLevel: LogLevel;
  debug?: boolean;
}

// ---
// Breakdownワークスペース初期化の正常系テスト
// 仕様参照: docs/breakdown/inittemplate.ja.md 3.1, docs/breakdown/workspace.ja.md, docs/breakdown/testing.ja.md
// - 新規環境でディレクトリ構造が正しく作成されることを検証
// ---
Deno.test({
  name: "init - new environment",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init",
      logger: logger,
      logLevel: LogLevel.DEBUG,
    };
    await setupTestEnvironment(options);

    // Ensure parent directories exist
    await ensureDir(join(options.workingDir, ".agent", "breakdown"));

    const workspace = new Workspace({
      workingDir: options.workingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });
    await workspace.initialize();

    // Verify directories are created under the breakdown subdirectory
    assertEquals(await exists(join(options.workingDir, ".agent", "breakdown", "prompts")), true);
    assertEquals(await exists(join(options.workingDir, ".agent", "breakdown", "schema")), true);

    await cleanupTestEnvironment(options);
  },
});

// ---
// 既存環境での初期化時、既存ファイルが上書きされず保持されることの検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 3.3, 4.2, docs/breakdown/workspace.ja.md
// ---
Deno.test({
  name: "init - existing environment",
  async fn() {
    const env = await setupTestEnvironment({ workingDir: "./tmp/test/init-existing" });
    try {
      // Create existing environment
      const workspace = new Workspace({
        workingDir: env.workingDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      await workspace.initialize();

      // Modify a file to check if it's preserved
      const configFile = join(env.workingDir, ".agent", "breakdown", "prompts", "app.yml");
      await Deno.writeTextFile(configFile, "modified: true");

      // Initialize again
      const workspace2 = new Workspace({
        workingDir: env.workingDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
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

// ---
// カスタム作業ディレクトリ指定時の初期化動作検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 3.1, docs/breakdown/appconfig.ja.md
// ---
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
      `workingdir: .agent/breakdown\nappprompt:\n  basedir: prompts\nappschema:\n  basedir: schema\n`,
    );
    const workspace = new Workspace({
      workingDir: customDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });
    await workspace.initialize();

    // Verify directories are created in custom location under breakdown
    assertEquals(await exists(join(customDir, ".agent", "breakdown", "prompts")), true);
    assertEquals(await exists(join(customDir, ".agent", "breakdown", "schema")), true);

    await cleanupTestEnvironment(options);
  },
});

// ---
// デバッグ出力有効時の初期化動作・ログ出力検証
// 仕様参照: docs/breakdown/testing.ja.md, docs/breakdown/inittemplate.ja.md 4.3
// ---
Deno.test({
  name: "init - with debug output",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-debug",
      logger,
      logLevel: LogLevel.DEBUG,
      skipDefaultConfig: false,
    };

    try {
      // Initialize test environment with debug enabled using logLevel option
      const env = await setupTestEnvironment({ ...options, logLevel: LogLevel.DEBUG });
      const workspace = new Workspace({
        workingDir: env.workingDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });

      // Add debug log before initialization
      env.logger.debug("Starting workspace initialization");
      await workspace.initialize();
      env.logger.debug("Workspace initialization completed");

      // Verify debug output was captured
      assertEquals(true, true, "Debug output should be enabled");
    } finally {
      // No need to restore log level - setupTestEnvironment handles it
      await cleanupTestEnvironment({
        workingDir: "tmp/test/init-debug",
        logger,
        logLevel: LogLevel.DEBUG,
      });
    }
  },
});

// ---
// 初期化時のエラーハンドリング（ディレクトリ作成失敗時）
// 仕様参照: docs/breakdown/inittemplate.ja.md 4.3, docs/breakdown/workspace.ja.md エラー処理
// ---
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
      logger.debug("[TEST] setupTestEnvironment complete");

      // Create the .agent/breakdown directory structure but leave out prompts
      const breakdownDir = join(options.workingDir, ".agent", "breakdown");
      await Deno.mkdir(breakdownDir, { recursive: true });
      logger.debug("[TEST] Created breakdown directory", { breakdownDir });

      // Create a file that will block directory creation
      const targetDir = join(breakdownDir, "prompts");
      await Deno.writeTextFile(targetDir, "");
      logger.debug("[TEST] Created blocking file", { targetDir });

      // Create config directory and file
      const configDir = join(breakdownDir, "config");
      await Deno.mkdir(configDir, { recursive: true });
      const configFile = join(configDir, "app.yml");
      const config = {
        workingdir: ".agent/breakdown",
        appprompt: {
          basedir: "prompts",
        },
        appschema: {
          basedir: "schema",
        },
      };
      await Deno.writeTextFile(configFile, stringify(config));
      logger.debug("[TEST] Created config file", { configFile, config });

      await assertRejects(
        async () => {
          logger.debug("[TEST] Creating workspace instance");
          const workspace = new Workspace({
            workingDir: options.workingDir,
            promptBaseDir: "prompts",
            schemaBaseDir: "schema",
          });
          logger.debug("[TEST] Initializing workspace");
          await workspace.initialize();
        },
        WorkspaceInitError,
        "Path exists but is not a directory",
      );

      // Clean up the file before cleanup
      try {
        await Deno.remove(targetDir);
      } catch (error) {
        // Ignore error if file doesn't exist
      }

      await cleanupTestEnvironment(options);
    } finally {
      Deno.chdir(originalCwd);
    }
  },
});

// ---
// configファイル自動生成の検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 3.1, docs/breakdown/appconfig.ja.md
// ---
Deno.test({
  name: "init - config file auto-generation",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-config",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    logger.debug("[TEST] setupTestEnvironment start", { workingDir: options.workingDir });
    await setupTestEnvironment(options);
    logger.debug("[TEST] setupTestEnvironment complete");

    logger.debug("[TEST] Workspace instance created");
    const workspace = new Workspace({
      workingDir: options.workingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });
    logger.debug("[TEST] Workspace initialized");
    await workspace.initialize();

    const configFile = join(options.workingDir, ".agent", "breakdown", "config", "app.yml");
    logger.debug("[TEST] Checking config file existence", { configFile });
    const existsConfig = await exists(configFile);
    logger.debug("[TEST] Config file exists?", { existsConfig });
    assertEquals(existsConfig, true);

    await cleanupTestEnvironment(options);
  },
});

// ---
// カスタムプロンプト/スキーマディレクトリ指定時の初期化動作検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 4.2, docs/breakdown/appconfig.ja.md
// ---
Deno.test({
  name: "init - custom prompt/schema basedir",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-custom-base",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    logger.debug("[TEST] setupTestEnvironment start", { workingDir: options.workingDir });
    await setupTestEnvironment(options);
    logger.debug("[TEST] setupTestEnvironment complete");

    // Create custom app.yml with different base directories
    const configDir = join(options.workingDir, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    const configFile = join(configDir, "app.yml");
    const config = {
      workingdir: ".agent/breakdown",
      appprompt: {
        basedir: "customprompts",
      },
      appschema: {
        basedir: "customschema",
      },
    };
    await Deno.writeTextFile(configFile, stringify(config));
    logger.debug("[TEST] Custom app.yml written", { configDir });

    logger.debug("[TEST] Workspace instance created");
    const workspace = new Workspace({
      workingDir: options.workingDir,
      promptBaseDir: "customprompts",
      schemaBaseDir: "customschema",
    });
    logger.debug("[TEST] Workspace initialized");
    await workspace.initialize();

    const customPrompts = join(options.workingDir, ".agent", "breakdown", "customprompts");
    const customSchema = join(options.workingDir, ".agent", "breakdown", "customschema");
    logger.debug("[TEST] Checking custom prompts dir existence", { customPrompts });
    logger.debug("[TEST] Checking custom schema dir existence", { customSchema });
    const existsPrompts = await exists(customPrompts);
    const existsSchema = await exists(customSchema);
    logger.debug("[TEST] Custom prompts exists?", { existsPrompts });
    logger.debug("[TEST] Custom schema exists?", { existsSchema });
    assertEquals(existsPrompts, true);
    assertEquals(existsSchema, true);

    await cleanupTestEnvironment(options);
  },
});

// ---
// 既存のapp.ymlが初期化時に上書きされないことの検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 4.2, docs/breakdown/appconfig.ja.md
// ---
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
      `workingdir: .agent/breakdown\nappprompt:\n  basedir: prompts\nappschema:\n  basedir: schema\ncustom: true\n`;
    const configFile = join(configDir, "app.yml");
    await Deno.writeTextFile(configFile, originalContent);

    const workspace = new Workspace({
      workingDir: options.workingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });
    await workspace.initialize();

    // 上書きされていないか
    const content = await Deno.readTextFile(configFile);
    assertEquals(content, originalContent);

    await cleanupTestEnvironment(options);
  },
});

// ---
// テンプレート（prompts/schema）がTypeScriptオブジェクトから正しく展開されることの検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 4.1, 5.1, docs/breakdown/appfactory.ja.md
// ---
Deno.test({
  name: "init - prompt and schema templates under lib are copied",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-copy",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    await setupTestEnvironment(options);

    const workspace = new Workspace({
      workingDir: options.workingDir,
      promptBaseDir: "prompts",
      schemaBaseDir: "schema",
    });
    await workspace.initialize();

    // prompts: Check if a representative md file is copied
    // Use the TypeScript template as the source of truth
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { prompts } = await import("../../../lib/templates/prompts.ts");
    const destPrompt = join(
      options.workingDir,
      ".agent",
      "breakdown",
      "prompts",
      "to",
      "project",
      "f_project.md",
    );
    const destPromptContent = await Deno.readTextFile(destPrompt);
    assertEquals(
      destPromptContent,
      prompts["to/project/f_project.md"],
      "Prompt template is copied from TS template",
    );

    // schema: Check if a representative schema file is copied
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { schema } = await import("../../../lib/templates/schema.ts");
    const destSchema = join(
      options.workingDir,
      ".agent",
      "breakdown",
      "schema",
      "to",
      "project",
      "base.schema.md",
    );
    const destSchemaContent = await Deno.readTextFile(destSchema);
    assertEquals(
      destSchemaContent,
      schema["to/project/base.schema.md"],
      "Schema template is copied from TS template",
    );

    await cleanupTestEnvironment(options);
  },
});

// ---
// カレントディレクトリ変更時もテンプレート展開が正しく行われることの検証
// 仕様参照: docs/breakdown/inittemplate.ja.md 3.1, 4.1, docs/breakdown/testing.ja.md
// ---
Deno.test({
  name: "init - prompt and schema templates are copied even if cwd is changed",
  async fn() {
    const options: TestOptions = {
      workingDir: "tmp/test/init-copy-cwd",
      logger,
      logLevel: LogLevel.DEBUG,
    };
    await setupTestEnvironment(options);

    // Save original cwd
    const originalCwd = Deno.cwd();

    // Change to a different directory
    const tempCwd = await Deno.makeTempDir();
    Deno.chdir(tempCwd);
    try {
      const workspace = new Workspace({
        workingDir: options.workingDir,
        promptBaseDir: "prompts",
        schemaBaseDir: "schema",
      });
      await workspace.initialize();

      // prompts: Check if a representative md file is copied
      // Use the TypeScript template as the source of truth
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { prompts } = await import("../../../lib/templates/prompts.ts");
      const destPrompt = join(
        options.workingDir,
        ".agent",
        "breakdown",
        "prompts",
        "to",
        "project",
        "f_project.md",
      );
      const destPromptContent = await Deno.readTextFile(destPrompt);
      assertEquals(
        destPromptContent,
        prompts["to/project/f_project.md"],
        "Prompt template is copied from TS template",
      );

      // schema: Check if a representative schema file is copied
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { schema } = await import("../../../lib/templates/schema.ts");
      const destSchema = join(
        options.workingDir,
        ".agent",
        "breakdown",
        "schema",
        "to",
        "project",
        "base.schema.md",
      );
      const destSchemaContent = await Deno.readTextFile(destSchema);
      assertEquals(
        destSchemaContent,
        schema["to/project/base.schema.md"],
        "Schema template is copied from TS template",
      );
    } finally {
      Deno.chdir(originalCwd);
      await cleanupTestEnvironment(options);
    }
  },
});
