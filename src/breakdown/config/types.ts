export interface WorkspaceStructure {
  root: string;
  directories: {
    [key: string]: string;
  };
}

export interface BreakdownConfig {
  root: string;
  working_directory: string;
  output_directory: string;
  workspace_structure: WorkspaceStructure;
  working_dir?: string;
  app_prompt?: {
    base_dir: string;
  };
}

export interface ConfigOptions {
  configPath?: string;
  workingDir?: string;
  outputDir?: string;
}

export interface CliOptions {
  input: string;
  output?: string;
  config?: string;
  workingDir?: string;
} 