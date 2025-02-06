export const DEFAULT_WORKSPACE_STRUCTURE = {
  root: ".agent/breakdown",
  directories: {
    issues: "issues",
    tasks: "tasks",
    projects: "projects"
  }
} as const;

export type DirectoryType = keyof typeof DEFAULT_WORKSPACE_STRUCTURE.directories; 