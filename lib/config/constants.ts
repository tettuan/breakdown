/**
 * The default structure for the Breakdown workspace.
 * Defines the root and subdirectories used by the CLI.
 */
export const _DEFAULT_WORKSPACE_STRUCTURE = Object.freeze({
  root: ".agent/breakdown" as const,
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
 * The default base directory for prompt templates (relative path).
 */
export const DEFAULT_PROMPT_BASE_DIR = "lib/breakdown/prompts";

/**
 * The default base directory for schema files (relative path).
 */
export const DEFAULT_SCHEMA_BASE_DIR = "lib/breakdown/schema";
