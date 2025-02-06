export interface ConfigStructure {
  root: string;
  working_directory: string;
  output_directory: string;
}

export interface CliOptions {
  input: string;
  output?: string;
  config?: string;
} 