/**
 * The default structure for the Breakdown workspace.
 * Defines the root and subdirectories used by the CLI.
 */
export const _DEFAULT_WORKSPACE_STRUCTURE = Object.freeze({
  root: ".agent/climpt" as const,
  config: "config" as const,
  directories: Object.freeze({
    issues: "issues" as const,
    tasks: "tasks" as const,
    projects: "projects" as const,
  }),
});

/**
 * The type representing valid directory keys in the default workspace structure.
 */
export type DirectoryType = keyof typeof _DEFAULT_WORKSPACE_STRUCTURE.directories;

// Default constants for Breakdown configuration
/**
 * The default configuration directory path.
 * This is the standard location where Breakdown looks for configuration files.
 */
export const DEFAULT_CONFIG_DIR = `${_DEFAULT_WORKSPACE_STRUCTURE.root}/config` as const;

/**
 * The default base directory for prompt templates (relative path).
 * This should only be used as a last resort fallback when no configuration is available.
 */
export const DEFAULT_PROMPT_BASE_DIR = "prompts";

/**
 * The default base directory for schema files (relative path).
 * This should only be used as a last resort fallback when no configuration is available.
 */
export const DEFAULT_SCHEMA_BASE_DIR = "schema";

/**
 * The default full path for schema files in the workspace.
 * Used by resolvers that need the complete workspace path.
 */
export const DEFAULT_SCHEMA_WORKSPACE_DIR = `${_DEFAULT_WORKSPACE_STRUCTURE.root}/schema`;

/**
 * The default working directory path (relative path).
 * This should only be used as a last resort fallback when no configuration is available.
 */
export const DEFAULT_WORKING_DIR = ".";

/**
 * The default workspace root directory.
 * This is the standard location where Breakdown creates its workspace.
 */
export const DEFAULT_WORKSPACE_ROOT = _DEFAULT_WORKSPACE_STRUCTURE.root;

/**
 * The default full working directory path including the workspace.
 * Used when full workspace path is needed.
 */
export const DEFAULT_WORKSPACE_WORKING_DIR = _DEFAULT_WORKSPACE_STRUCTURE.root;

/**
 * The default fromLayerType value when no -i option is specified.
 * Used as fallback in prompt template path resolution.
 */
export const DEFAULT_FROM_LAYER_TYPE = "default" as const;
