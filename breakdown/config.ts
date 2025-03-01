import { exists, join } from "./deps.ts";

export interface BreakdownConfig {
  working_directory: string;
  output_directory: string;
  default_config_path: string;
}

export interface ConfigOptions {
  configPath?: string;
  workingDir?: string;
  outputDir?: string;
}

export class Config {
  // ... 既存の実装 ...
} 