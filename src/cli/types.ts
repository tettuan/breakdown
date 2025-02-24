export interface Args {
  command: string;
  layerType?: string;
  fromFile?: string;
  destination?: string;
  destinationFile?: string;
  inputLayerType?: string;
  workingDir?: string;
  error?: string;
  _: (string | number)[];
  from?: string;
  output?: string;
  help?: boolean;
  version?: boolean;
}

export interface CliResult {
  success: boolean;
  message?: string;
  data?: unknown;
}

export interface CommandOptions {
  input?: string;
  output?: string;
  from?: string;
  format?: "json" | "md";
  help?: boolean;
  version?: boolean;
  _: string[];
  [key: string]: unknown;
}

export interface CommandResult extends CommandOptions {
  command: string;
  error?: string;
}

export interface PromptVariables {
  input_markdown_file?: string;
  input_markdown?: string;
  destination_path?: string;
  schema_file?: string;
}

export interface Prompt {
  path: string;
  content: string;
}

export interface ProcessResult {
  success: boolean;
  message?: string;
  data?: unknown;
  code: number;
}

export enum ExitCode {
  Success = 0,
  Error = 1
}

export type CommandRecord = Record<string, string | boolean | string[]>;

export type CommandTypes = {
  options: CommandOptions;
  args: string[];
  globalOptions: Record<string, unknown>;
};

export interface ParseResult {
  options: {
    help?: boolean;
    version?: boolean;
    [key: string]: unknown;
  };
  args: string[];
  literal: string[];
} 