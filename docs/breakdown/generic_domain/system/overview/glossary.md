# Domain Glossary

## 1. Directory Structure and Path Related

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| working_dir | app_config.ja.md, init.ja.md | Application working directory. Default is set to `.agent/breakdown/`. Used for path resolution of input files (-i) and output files (-o). Not used for prompt or schema directory resolution. Settings are managed in `.agent/breakdown/config/app.yml`. | base_dir, app_prompt.base_dir, app_schema.base_dir |
| base_dir | app_prompt.ja.md, app_schema.ja.md | Base directory for prompts and schemas. For prompts, default is `prompts/`. For schemas, default is `schemas/`. These directories are copied from template files under `lib`. | working_dir, prompts/, schemas/ |
| prompts/ | init.ja.md, app_prompt.ja.md | Directory for storing prompt files. Default is `prompts/`, but can be changed with `app_prompt.base_dir`. Allows flexible placement of prompt files. | base_dir, app_prompt.base_dir |
| schemas/ | app_schema.ja.md | Directory for storing schema files. Default is `schemas/`, but can be changed with `app_schema.base_dir`. Allows flexible placement of schema files. | base_dir, app_schema.base_dir |
| lib/ | init.ja.md | Directory containing system standard files. Template files for prompts and schemas are placed here and copied during initialization. | prompts/, schemas/ |

## 2. Configuration and Initialization

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| app.yml | init.ja.md, app_config.ja.md | Application configuration file. Located at `.agent/breakdown/config/app.yml`. Manages working directory and other basic settings. Existing files are not overwritten. Settings are hierarchically managed with two-layer structure of application settings and user settings. | working_dir, config/ |
| config/ | init.ja.md, app_config.ja.md | Directory for storing configuration files. Located at `.agent/breakdown/config/`, manages various application settings. | app.yml, working_dir |
| user.yml | app_config.ja.md | User-specific configuration file. Exists in the application configuration hierarchy and overrides application settings. | app.yml, config/ |

## 3. Testing and Debugging

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| tests/ | testing.md, testing.ja.md | Directory for storing test files. Foundation function tests are placed under `0_foundation/`. In Japanese version, has subdirectory structure of `0_env/`, `1_config/`, `2_commands/`. In English version, files like `config_test.ts`, `logger_test.ts` are placed directly. | 0_foundation/, config_test.ts, logger_test.ts |
| LOG_LEVEL | logging.ja.md, testing.ja.md | Environment variable controlling log output detail level in test code. Can be controlled in 4 levels: `debug`, `info`, `warn`, `error`. Default is `info`. Used with BreakdownLogger to provide permanent debug output as part of testing. | DEBUG, logging |
| fixtures/ | testing.md, testing.ja.md | Directory for storing test data. Fixed data and sample files used during test execution are placed here. | tests/, helpers/ |
| helpers/ | testing.md, testing.ja.md | Directory for storing test helpers. Utility functions and common processes that assist test execution are placed here. | tests/, fixtures/ |

## 4. Input Processing

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| input source | app_factory.ja.md, cli.ja.md | Source of input data to the application. Either file (-i) or stdin is required. Error occurs if neither is specified. Input data is processed through prompt manager. | -i, stdin, promptmanager |
| stdin | app_factory.ja.md, cli.ja.md | Data reading from standard input. Functions as one of the input sources, used exclusively with file input. Implementation includes input data detection and reading processing. | input source, -i, promptmanager |
| fromFile | options.ja.md, path.ja.md | Parameter specifying input file (-f, --from). Specifies file path and uses its content as input data. Used exclusively with standard input. | -f, --from, input source |
| destinationFile | options.ja.md, path.ja.md | Parameter specifying output destination (-o, --destination). Specifies file path or directory path and determines output destination for generated prompt. | -o, --destination, destination_path |

## 5. Prompt Processing

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| promptmanager | app_prompt.ja.md | Module responsible for prompt generation and management. Performs variable substitution and schema information embedding to generate final prompt. | BreakdownPrompt, prompt generation |
| directiveType | options.ja.md, path.ja.md | Parameter specifying type of conversion or summary. Takes values like `to`, `summary`, `defect`, `init` and determines processing type. | layerType, command |
| layerType | options.ja.md, path.ja.md | Parameter specifying target hierarchy. Specifies one of `project`, `issue`, `task` and determines processing granularity. | directiveType, command |
| adaptationType | options.ja.md, path.ja.md | Parameter specifying prompt type (-a, --adaptation). Takes values like `strict`, `a` and is used as suffix for prompt filename. | -a, --adaptation, prompt type |

## 6. Module Configuration

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| BreakdownConfig | app_config.ja.md | Module responsible for configuration management. Handles loading and management of application and user settings. | app.yml, user.yml |
| BreakdownParams | options.ja.md | Module responsible for parameter processing. Handles command line argument parsing and validation. | NoParamsResult, SingleParamResult, DoubleParamsResult |
| BreakdownPrompt | app_prompt.ja.md | Module responsible for prompt generation. Performs variable substitution and schema information embedding to generate prompts. | promptmanager, prompt generation |
| BreakdownLogger | logging.ja.md | Module responsible for logging functionality. Handles debug information output and error processing. | LOG_LEVEL, DEBUG |

## 7. Types and Interfaces

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| PromptCliParams | app_factory.ja.md | Interface defining CLI parameters required for prompt generation. Has properties like directiveType, layerType, options. | directiveType, layerType, options |
| PromptVariablesFactoryOptions | app_factory.ja.md | Interface defining initialization options for prompt variables factory. Requires config and cliParams. | config, cliParams |
| DoubleParamsResult | options.ja.md | Type representing result of command with two parameters. Requires directiveType and layerType. | directiveType, layerType |
| SingleParamResult | options.ja.md | Type representing result of command with one parameter. Used for init command and others. | init, command |
| NoParamsResult | options.ja.md | Type representing result of command with no parameters. Used for help and version checking. | help, version |

## 8. Error Handling

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| PromptFileErrorType | app_factory.ja.md | Enumeration defining error types during prompt file generation. Represents error states like InputFileNotFound, PromptDirNotFound, PromptFileNotFound. | error handling, validation |
| CommandResult | cli.ja.md | Type representing command execution result. Contains success flag and error information. | error handling, command execution |
| ValidationError | app_factory.ja.md | Type representing validation error. Contains error message and error type. | validation, error handling |

## 9. Command Line Options

| Term | Used in | Description | Related Words |
|------|----------|------|------------|
| -f, --from | [options.ja.md](./docs/breakdown/options.ja.md) | Option to specify input file. Specifies file path and uses its content as `input_text_file`. Works independently from stdin, both can be used simultaneously. | stdin, input_text_file |
| -o, --destination | [options.ja.md](./docs/breakdown/options.ja.md) | Option to specify output destination. Specifies file path or directory path and uses that value as `destination_path`. Filename is automatically generated for directories. | destination_path, destinationFile |
| -i, --input | [options.ja.md](./docs/breakdown/options.ja.md) | Option to specify input layer type. Sets `fromLayerType` with specified value. If not specified, uses "default". | fromLayerType, layerType |
| -a, --adaptation | [options.ja.md](./docs/breakdown/options.ja.md) | Option to specify prompt type. Sets `adaptationType` with specified value and is used as suffix for prompt filename. | adaptationType, prompt type |
| --help | [options.ja.md](./docs/breakdown/options.ja.md) | Option to display help message. Shows command usage and option descriptions. | NoParamsResult, help |
| --version | [options.ja.md](./docs/breakdown/options.ja.md) | Option to display version information. Shows application version number. | NoParamsResult, version |
| stdin | [app_factory.ja.md](./docs/breakdown/app_factory.ja.md) | Data reading from standard input. Passes input data using pipe (|) or redirect (<) and uses its content as `input_text`. Works independently from file input (-f), both can be used simultaneously. | input_text, input source |