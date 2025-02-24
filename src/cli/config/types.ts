export interface BreakdownConfig {
  working_directory: string;
  output_directory: string;
  default_config_path: string;
  // 他の設定項目...
}

export interface ConfigOptions {
  configPath?: string;
  workingDir?: string;
  outputDir?: string;
} 