/**
 * The default structure for the Breakdown workspace.
 * Defines the root and subdirectories used by the CLI.
 */
export const DEFAULT_WORKSPACE_STRUCTURE = {
  root: ".agent/breakdown",
  directories: {
    issues: "issues",
    tasks: "tasks",
    projects: "projects",
  },
} as const;

/**
 * The type representing valid directory keys in the default workspace structure.
 */
export type DirectoryType = keyof typeof DEFAULT_WORKSPACE_STRUCTURE.directories;

// Default constants for Breakdown configuration
/**
 * The default base directory for prompt templates, used if app_prompt.base_dir is missing or empty.
 * This should match the documented default in docs/breakdown/app_config.ja.md.
 */
export const DEFAULT_PROMPT_BASE_DIR = ".agent/breakdown/prompts";
