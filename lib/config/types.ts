export interface Config {
  working_dir: string;
  workingDirectory: string;
  workspaceStructure: {
    root: string;
    directories: {
      prompt: string;
      schema: string;
      output: string;
      temp: string;
      [key: string]: string;
    };
  };
  app_prompt: {
    base_dir: string;
    debug: boolean;
  };
  app_schema: {
    base_dir: string;
  };
  [key: string]: unknown;
}

export type PartialConfig = Partial<Config>;

export const DEFAULT_CONFIG: Config = {
  working_dir: "",
  workingDirectory: "",
  workspaceStructure: {
    root: "",
    directories: {
      prompt: "prompts",
      schema: "schemas",
      output: "output",
      temp: "temp",
    },
  },
  app_prompt: {
    base_dir: "",
    debug: false,
  },
  app_schema: {
    base_dir: "",
  },
};
