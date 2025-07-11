/**
 * Workspace module for Breakdown tool with Totality design applied.
 *
 * This refactored version applies the Totality principle by:
 * 1. Using Result types instead of exceptions
 * 2. Separating concerns into focused classes
 * 3. Applying Smart Constructors for type safety
 * 4. Using Discriminated Unions for state management
 *
 * @module workspace/workspace_totality_refactor
 */

import { dirname, join, resolve } from "@std/path";
import { ensureDir } from "@std/fs";
import { parse } from "@std/yaml";
import { stringify } from "@std/yaml";
import { prompts } from "../templates/prompts.ts";
import { schema } from "../templates/schema.ts";
import { DEFAULT_PROMPT_BASE_DIR, DEFAULT_SCHEMA_BASE_DIR } from "../config/constants.ts";

// ===== Result Type =====
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// ===== Error Types with Discriminated Union =====
type WorkspaceErrorKind =
  | { kind: "INIT_ERROR"; message: string; cause?: Error }
  | { kind: "CONFIG_ERROR"; message: string; path?: string }
  | { kind: "PERMISSION_ERROR"; message: string; path: string }
  | { kind: "NOT_FOUND"; message: string; path: string }
  | { kind: "IO_ERROR"; message: string; cause: Error };

// ===== Smart Constructors for Configuration =====
/**
 * WorkspaceConfig with validation and immutability
 */
export class WorkspaceConfig {
  private constructor(
    readonly workingDir: string,
    readonly promptBaseDir: string,
    readonly schemaBaseDir: string,
  ) {
    Object.freeze(this);
  }

  /**
   * Creates a validated WorkspaceConfig
   */
  static create(
    workingDir: string,
    promptBaseDir?: string,
    schemaBaseDir?: string,
  ): Result<WorkspaceConfig, WorkspaceErrorKind> {
    // Validate working directory
    if (!workingDir || workingDir.trim() === "") {
      return {
        ok: false,
        error: { kind: "CONFIG_ERROR", message: "Working directory cannot be empty" },
      };
    }

    const config = new WorkspaceConfig(
      workingDir,
      promptBaseDir ?? DEFAULT_PROMPT_BASE_DIR,
      schemaBaseDir ?? DEFAULT_SCHEMA_BASE_DIR,
    );

    return { ok: true, data: config };
  }

  /**
   * Creates a deep copy of the configuration
   */
  copy(): WorkspaceConfig {
    return new WorkspaceConfig(
      this.workingDir,
      this.promptBaseDir,
      this.schemaBaseDir,
    );
  }
}

// ===== Separated Concerns =====

/**
 * Handles workspace initialization logic
 */
export class WorkspaceInitializer {
  constructor(private config: WorkspaceConfig) {}

  /**
   * Initializes the workspace structure
   */
  async initialize(): Promise<Result<void, WorkspaceErrorKind>> {
    // Create base directories
    const baseResult = await this.createBaseDirectories();
    if (!baseResult.ok) return baseResult;

    // Create config file
    const configResult = await this.createConfigFile();
    if (!configResult.ok) return configResult;

    // Create custom directories
    const customResult = await this.createCustomDirectories();
    if (!customResult.ok) return customResult;

    // Deploy templates
    const templateResult = await this.deployTemplates();
    if (!templateResult.ok) return templateResult;

    return { ok: true, data: undefined };
  }

  private async createBaseDirectories(): Promise<Result<void, WorkspaceErrorKind>> {
    try {
      await ensureDir(this.config.workingDir);
      await ensureDir(join(this.config.workingDir, this.config.promptBaseDir));
      await ensureDir(join(this.config.workingDir, this.config.schemaBaseDir));
      return { ok: true, data: undefined };
    } catch (error) {
      if (error instanceof Deno.errors.PermissionDenied) {
        return {
          ok: false,
          error: {
            kind: "PERMISSION_ERROR",
            message: `Permission denied creating directories`,
            path: this.config.workingDir,
          },
        };
      }
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: `Failed to create base directories`,
          cause: error as Error,
        },
      };
    }
  }

  private async createConfigFile(): Promise<Result<void, WorkspaceErrorKind>> {
    const configDir = join(this.config.workingDir, ".agent", "breakdown", "config");
    const configFile = join(configDir, "default-app.yml");

    try {
      await Deno.stat(configFile);
      return { ok: true, data: undefined }; // Config already exists
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        return {
          ok: false,
          error: {
            kind: "IO_ERROR",
            message: `Failed to check config file`,
            cause: error as Error,
          },
        };
      }
    }

    // Create config file
    try {
      await ensureDir(configDir);
      const config = {
        working_dir: ".agent/breakdown",
        app_prompt: { base_dir: this.config.promptBaseDir },
        app_schema: { base_dir: this.config.schemaBaseDir },
      };
      await Deno.writeTextFile(configFile, stringify(config));
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: `Failed to create config file`,
          cause: error as Error,
        },
      };
    }
  }

  private async createCustomDirectories(): Promise<Result<void, WorkspaceErrorKind>> {
    const customPromptDir = join(
      this.config.workingDir,
      ".agent",
      "breakdown",
      this.config.promptBaseDir,
    );
    const customSchemaDir = join(
      this.config.workingDir,
      ".agent",
      "breakdown",
      this.config.schemaBaseDir,
    );

    try {
      await ensureDir(customPromptDir);
      await ensureDir(customSchemaDir);
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: `Failed to create custom directories`,
          cause: error as Error,
        },
      };
    }
  }

  private async deployTemplates(): Promise<Result<void, WorkspaceErrorKind>> {
    const customPromptDir = join(
      this.config.workingDir,
      ".agent",
      "breakdown",
      this.config.promptBaseDir,
    );
    const customSchemaDir = join(
      this.config.workingDir,
      ".agent",
      "breakdown",
      this.config.schemaBaseDir,
    );

    // Deploy prompts
    for (const [relPath, content] of Object.entries(prompts)) {
      const result = await this.deployFile(join(customPromptDir, relPath), content);
      if (!result.ok) return result;
    }

    // Deploy schemas
    for (const [relPath, content] of Object.entries(schema)) {
      const result = await this.deployFile(join(customSchemaDir, relPath), content);
      if (!result.ok) return result;
    }

    return { ok: true, data: undefined };
  }

  private async deployFile(
    destPath: string,
    content: string,
  ): Promise<Result<void, WorkspaceErrorKind>> {
    try {
      await Deno.stat(destPath);
      return { ok: true, data: undefined }; // File already exists
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        return {
          ok: false,
          error: {
            kind: "IO_ERROR",
            message: `Failed to check file: ${destPath}`,
            cause: error as Error,
          },
        };
      }
    }

    try {
      await ensureDir(dirname(destPath));
      await Deno.writeTextFile(destPath, content);
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: `Failed to write file: ${destPath}`,
          cause: error as Error,
        },
      };
    }
  }
}

/**
 * Handles configuration management
 */
export class WorkspaceConfigManager {
  constructor(private config: WorkspaceConfig) {}

  /**
   * Validates the workspace configuration
   */
  async validate(): Promise<Result<void, WorkspaceErrorKind>> {
    const exists = await this.exists(this.config.workingDir);
    if (!exists) {
      return {
        ok: false,
        error: {
          kind: "NOT_FOUND",
          message: "Working directory does not exist",
          path: this.config.workingDir,
        },
      };
    }
    return { ok: true, data: undefined };
  }

  /**
   * Reloads configuration from file
   */
  async reload(): Promise<Result<WorkspaceConfig, WorkspaceErrorKind>> {
    const configFile = join(
      this.config.workingDir,
      ".agent",
      "breakdown",
      "config",
      "default-app.yml",
    );

    try {
      const configContent = await Deno.readTextFile(configFile);
      const parsed = parse(configContent) as {
        working_dir: string;
        app_prompt: { base_dir: string };
        app_schema: { base_dir: string };
      };

      const newConfig = WorkspaceConfig.create(
        this.config.workingDir,
        parsed.app_prompt.base_dir,
        parsed.app_schema.base_dir,
      );

      return newConfig;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return {
          ok: false,
          error: {
            kind: "NOT_FOUND",
            message: "Configuration file not found",
            path: configFile,
          },
        };
      }
      return {
        ok: false,
        error: {
          kind: "IO_ERROR",
          message: "Failed to read configuration file",
          cause: error as Error,
        },
      };
    }
  }

  private async exists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Main workspace implementation with Totality design
 */
export class WorkspaceTotality {
  private initializer: WorkspaceInitializer;
  private configManager: WorkspaceConfigManager;

  constructor(private config: WorkspaceConfig) {
    this.initializer = new WorkspaceInitializer(config);
    this.configManager = new WorkspaceConfigManager(config);
  }

  /**
   * Creates a new workspace instance
   */
  static create(
    workingDir: string,
    promptBaseDir?: string,
    schemaBaseDir?: string,
  ): Result<WorkspaceTotality, WorkspaceErrorKind> {
    const configResult = WorkspaceConfig.create(workingDir, promptBaseDir, schemaBaseDir);
    if (!configResult.ok) return configResult;

    return {
      ok: true,
      data: new WorkspaceTotality(configResult.data),
    };
  }

  /**
   * Initializes the workspace
   */
  initialize(): Promise<Result<void, WorkspaceErrorKind>> {
    return this.initializer.initialize();
  }

  /**
   * Validates configuration
   */
  validateConfig(): Promise<Result<void, WorkspaceErrorKind>> {
    return this.configManager.validate();
  }

  /**
   * Reloads configuration
   */
  async reloadConfig(): Promise<Result<WorkspaceConfig, WorkspaceErrorKind>> {
    const result = await this.configManager.reload();
    if (result.ok) {
      this.config = result.data;
      this.initializer = new WorkspaceInitializer(result.data);
      this.configManager = new WorkspaceConfigManager(result.data);
    }
    return result;
  }

  /**
   * Gets workspace paths
   */
  getPaths(): {
    workingDir: string;
    promptBaseDir: string;
    schemaBaseDir: string;
    absolutePromptDir: string;
    absoluteSchemaDir: string;
  } {
    return {
      workingDir: this.config.workingDir,
      promptBaseDir: this.config.promptBaseDir,
      schemaBaseDir: this.config.schemaBaseDir,
      absolutePromptDir: resolve(this.config.workingDir, this.config.promptBaseDir),
      absoluteSchemaDir: resolve(this.config.workingDir, this.config.schemaBaseDir),
    };
  }
}

/**
 * Initialize a new Breakdown workspace with Totality design
 */
export function initWorkspaceTotality(
  workingDir = ".",
  config?: { app_prompt?: { base_dir?: string }; app_schema?: { base_dir?: string } },
): Promise<Result<void, WorkspaceErrorKind>> {
  const workspaceResult = WorkspaceTotality.create(
    workingDir,
    config?.app_prompt?.base_dir,
    config?.app_schema?.base_dir,
  );

  if (!workspaceResult.ok) return Promise.resolve(workspaceResult);

  return workspaceResult.data.initialize();
}
