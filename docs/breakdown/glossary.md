# Domain Glossary

## 1. Directory Structure and Paths

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| working_dir | app_config.md, init.md | Application's working directory. Default is set to `.agent/breakdown/`. Used for resolving input file (-i) and output file (-o) paths. Not used for resolving prompt or schema directories. Managed in `.agent/breakdown/config/app.yml`. | base_dir, app_prompt.base_dir, app_schema.base_dir |
| base_dir | app_prompt.md, app_schema.md | Base directory for prompts and schemas. Default is `prompts/` for prompts and `schemas/` for schemas. These directories are copied from template files under `lib`. | working_dir, prompts/, schemas/ |
| prompts/ | init.md, app_prompt.md | Directory for storing prompt files. Default is `prompts/` but can be changed with `app_prompt.base_dir`. Allows flexible placement of prompt files. | base_dir, app_prompt.base_dir |
| schemas/ | app_schema.md | Directory for storing schema files. Default is `schemas/` but can be changed with `app_schema.base_dir`. Allows flexible placement of schema files. | base_dir, app_schema.base_dir |
| lib/ | init.md | Directory for storing system standard files. Contains template files for prompts and schemas that are copied during initialization. | prompts/, schemas/ |

## 2. Configuration and Initialization

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| app.yml | init.md, app_config.md | Application configuration file. Located at `.agent/breakdown/config/app.yml`. Manages working directory and other basic settings. Existing files are not overwritten. Settings are managed hierarchically with two layers: application settings and user settings. | working_dir, config/ |
| config/ | init.md, app_config.md | Directory for storing configuration files. Located at `.agent/breakdown/config/` and manages various application settings. | app.yml, working_dir |
| user.yml | app_config.md | User-specific configuration file. Exists in the application settings hierarchy and overrides application settings. | app.yml, config/ |

## 3. Testing and Debugging

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| tests/ | testing.md | Directory for storing test files. Foundation tests are located under `0_foundation/`. Has subdirectories `0_env/`, `1_config/`, `2_commands/` in Japanese version. Files like `config_test.ts`, `logger_test.ts` are directly placed in English version. | 0_foundation/, config_test.ts, logger_test.ts |
| DEBUG | debug.md, testing.md | Environment variable for controlling temporary debug output. Can be used in code other than tests and is used for problem investigation during development. Treated as temporary debug code that should eventually be removed. | LOG_LEVEL, debug mode |
| LOG_LEVEL | logging.md, testing.md | Environment variable for controlling log output detail in test code. Can be controlled in 4 levels: `debug`, `info`, `warn`, `error`. Default is `info`. Used by BreakdownLogger to provide permanent debug output as part of tests. | DEBUG, logging |
| fixtures/ | testing.md | Directory for storing test data. Contains fixed data and sample files used during test execution. | tests/, helpers/ |
| helpers/ | testing.md | Directory for storing test helpers. Contains utility functions and common processes that assist test execution. | tests/, fixtures/ |

## 4. Input Processing

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| input source | app_factory.md, cli.md | Source of input data for the application. Either file (-i) or standard input is required. Error occurs if neither is specified. Input data is processed through the prompt manager. | -i, stdin, promptmanager |
| stdin | app_factory.md, cli.md | Data reading from standard input. Functions as one input source and is used exclusively with file input. Implements input data detection and reading processes. | input source, -i, promptmanager |
| fromFile | options.md, path.md | Parameter for specifying input file (-f, --from). Specifies file path and uses its content as input data. Used exclusively with standard input. | -f, --from, input source |
| destinationFile | options.md, path.md | Parameter for specifying output destination (-o, --destination). Specifies file path or directory path to determine the output destination for generated prompts. | -o, --destination, output destination |

## 5. Prompt Processing

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| promptmanager | app_prompt.md | Module responsible for prompt generation and management. Performs variable substitution and schema information embedding to generate final prompts. | BreakdownPrompt, prompt generation |
| demonstrativeType | options.md, path.md | Parameter for specifying conversion or summary type. Takes values like `to`, `summary`, `defect`, `init` to determine processing type. | layerType, command |
| layerType | options.md, path.md | Parameter for specifying processing target layer. Specifies one of `project`, `issue`, `task` to determine processing granularity. | demonstrativeType, command |
| adaptationType | options.md, path.md | Parameter for specifying prompt type (-a, --adaptation). Takes values like `strict`, `a` and is used as suffix for prompt filenames. | -a, --adaptation, prompt type |

## 6. Module Structure

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| BreakdownConfig | app_config.md | Module responsible for configuration management. Handles loading and management of application and user settings. | app.yml, user.yml |
| BreakdownParams | options.md | Module responsible for parameter processing. Handles command-line argument parsing and validation. | NoParamsResult, SingleParamResult, DoubleParamsResult |
| BreakdownPrompt | app_prompt.md | Module responsible for prompt generation. Performs variable substitution and schema information embedding to generate prompts. | promptmanager, prompt generation |
| BreakdownLogger | logging.md | Module responsible for logging functionality. Handles debug information output and error processing. | LOG_LEVEL, DEBUG |

## 7. Types and Interfaces

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| PromptCliParams | app_factory.md | Interface defining CLI parameters needed for prompt generation. Has properties like demonstrativeType, layerType, options. | demonstrativeType, layerType, options |
| PromptVariablesFactoryOptions | app_factory.md | Interface defining initialization options for prompt variable factory. Requires config and cliParams. | config, cliParams |
| DoubleParamsResult | options.md | Type representing result of command with two parameters. Requires demonstrativeType and layerType. | demonstrativeType, layerType |
| SingleParamResult | options.md | Type representing result of command with one parameter. Used for init command etc. | init, command |
| NoParamsResult | options.md | Type representing result of command with no parameters. Used for help and version checks. | help, version |

## 8. Error Handling

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| PromptFileErrorType | app_factory.md | Enumeration defining error types during prompt file generation. Represents error states like InputFileNotFound, PromptDirNotFound, PromptFileNotFound. | error handling, validation |
| CommandResult | cli.md | Type representing command execution result. Includes success flag and error information. | error handling, command execution |
| ValidationError | app_factory.md | Type representing validation error. Includes error message and error type. | validation, error handling |

## 9. Command Line Options

| Term | Usage Location | Description | Related Terms |
|------|----------------|-------------|---------------|
| -f, --from | [options.md](./docs/breakdown/options.md) | Option for specifying input file. Specifies file path and uses its content as `input_text_file`. Works independently of standard input and can be used simultaneously. | stdin, input_text_file |
| -o, --destination | [options.md](./docs/breakdown/options.md) | Option for specifying output destination. Specifies file path or directory path and uses its value as `destination_path`. Automatically generates filename if directory is specified. | destination_path, output destination |
| -i, --input | [options.md](./docs/breakdown/options.md) | Option for specifying input layer type. Overwrites `fromLayerType` with specified value. Inferred from fromFile if not specified. | fromLayerType, layerType |
| -a, --adaptation | [options.md](./docs/breakdown/options.md) | Option for specifying prompt type. Sets `adaptationType` with specified value and uses it as suffix for prompt filenames. | adaptationType, prompt type |
| --help | [options.md](./docs/breakdown/options.md) | Option for displaying help message. Shows command usage and option descriptions. | NoParamsResult, help |
| --version | [options.md](./docs/breakdown/options.md) | Option for displaying version information. Shows application version number. | NoParamsResult, version |
| stdin | [app_factory.md](./docs/breakdown/app_factory.md) | Data reading from standard input. Uses pipes (\|) or redirects (<) to pass input data and uses its content as `input_text`. Works independently of file input (-f) and can be used simultaneously. | input_text, input source |
| stdin | [app_factory.md](./docs/breakdown/app_factory.md) | Data reading from standard input. Uses pipe (|) or redirect (<) to pass input data and uses its content as `input_text`. Works independently of file input (-f) and can be used simultaneously. | input_text, input source | 