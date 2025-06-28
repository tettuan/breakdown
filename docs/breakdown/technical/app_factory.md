# PromptVariablesFactory

> **For detailed specifications of application configuration (app.yml, user.yml), see [app_config.md](./app_config.md).**

## Overview

A Factory class that centralizes all parameter and path resolution required for prompt substitution processing.
CLI, tests, and the application itself must always perform path resolution and parameter construction through this Factory.

- Configuration values are obtained from BreakdownConfig and combined with CLI parameters to generate all paths and parameters according to specifications
- All path resolution, including schema file paths, is centralized
- The Factory pattern ensures extensibility, testability, and consistency

## Purpose Hierarchy

Lower-level purposes exist to serve higher-level purposes.
Decisions prioritize higher-level purposes. (1 is highest, 2, 3, 4 become lower)

### Purpose 1
Centralize all parameter and path resolution required for prompt substitution processing.
Always perform path resolution and parameter construction through this Factory.
Eliminate the inconvenience of interpretation scattered throughout various places.

### Purpose 2
Clarify the responsibilities of each parameter, option, and configuration.
Improve readability and testability by implementing single responsibility and responsibility decomposition according to roles.

### Purpose 3
Hide processing details. Do not mix large processes for large purposes with detailed processing.
Perform high-level abstract processing in large processes, allowing internal optimization.
Aim for a loosely coupled system connected through Interface definitions by not being concerned with external events.

## PromptVariablesFactory Responsibilities

- Construction of all paths and parameters including prompts/schemas/input-output files
- Minimizing impact when specifications change

※ Input validation is primarily the responsibility of Validators; Factory focuses on path and parameter construction.

## Input/Output

- **Input**:  
  - BreakdownConfig (configuration values loaded from app.yml, user.yml, etc.)
  - CLI parameters (TwoParamsResult, etc., all parameters passed via command line arguments or API)
  - Custom variables (user-defined variables specified with --* options)
- **Output**:  
  - All parameters required for prompt substitution processing, such as promptFilePath, inputFilePath, outputFilePath, schemaFilePath
  - Custom variable map (accessible by variable name)

## Path Resolution Rules (Key Points Only)

- **Prompt File**:  
  Prompt base directory (`app_prompt.base_dir`) + demonstrativeType + layerType + `f_{fromLayerType}.md`
- **Schema File**:  
  Schema base directory (`app_schema.base_dir`) + demonstrativeType + layerType + `base.schema.md`
- **Input File**:  
  Follows [path.md](./path.md) "Input File" section
- **Output File**:  
  Follows [path.md](./path.md) "Output File" section

## Class Design & API Examples

> ※ Only public API methods are shown below. Internal private methods are omitted.

```ts
interface PromptVariablesFactoryOptions {
  config: AppConfig;
  cliParams: TwoParamsResult; // v1.0.1: DoubleParamsResult → TwoParamsResult
}

class PromptVariablesFactory {
  constructor(options: PromptVariablesFactoryOptions);
  validateAll(): void;
  getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables?: Record<string, string>; // v1.0.1: Custom variable support
    // ...other necessary parameters
  };
  // Individual getters (can also be readonly properties)
  readonly promptFilePath: string;
  readonly inputFilePath: string;
  readonly outputFilePath: string;
  readonly schemaFilePath: string;
  readonly customVariables: Record<string, string>; // v1.0.1: Custom variables
}
```

### Usage Examples

```ts
const factory = new PromptVariablesFactory({ config, cliParams });
// Batch retrieval
const { promptFilePath, inputFilePath, outputFilePath, schemaFilePath, customVariables } = factory.getAllParams();
// Individual access
console.log(factory.promptFilePath);
console.log(factory.inputFilePath);
// v1.0.1: Access to custom variables
console.log(factory.customVariables['projectName']); // Value specified with --projectName=value
```

## References

- [docs/breakdown/path.md](./path.md)
- [docs/breakdown/options.md](./options.md)
- [docs/breakdown/testing.md](./testing.md)
- [docs/breakdown/app_config.md](./app_config.md)

# Custom Variable (--*) Support

User-defined custom variables can be specified from the CLI and used within templates.

## Implementation Method

```ts
// Extract custom variables from cliParams of TwoParamsResult type
const customVariables = tpr.options.customVariables || {};
```

### Usage Example

```bash
# CLI execution
breakdown to issue --from=project.md \
  --projectName=MyProject \
  --author=Taro \
  --version=1.0.0

# Reference within template -> `` is removed when passed
Project: {projectName}
Author: {author}
Version: {version}
```

# Parameter Options and Reserved Variables Correspondence Table

> This organizes the relationship between breakdownparams parameter options (--from, -o, etc.) and breakdownprompt reserved variables.

## Correspondence Table

| Input Option           | inputFilePath         | outputFilePath        | promptFilePath        | schemaFilePath        | fromLayerType        | adaptationType      | customVariables |
|------------------------|-----------------------|-----------------------|-----------------------|-----------------------|----------------------|---------------------|--------------------------|
| --from, -f             | Used as input file path |                       |                       |                       | Inferred from fromFile |                     |                          |
| --destination, -o      |                       | Used as output file path |                       |                       |                      |                     |                          |
| --input, -i            |                       |                       |                       |                       | Specifies input layer type |                     |                          |
| --adaptation, -a       |                       |                       | Used as prompt filename suffix |                       |                      | Specifies prompt type |                          |
| --* (v1.0.1)        |                       |                       |                       |                       |                      |                     | Stored as custom variables |
| demonstrativeType      |                       |                       | Used for path resolution | Used for path resolution |                      |                     |                          |
| layerType              |                       |                       | Used for path resolution | Used for path resolution |                      |                     |                          |

### Notes
- Reserved variables such as inputFilePath, outputFilePath, promptFilePath, schemaFilePath are constructed centrally by PromptVariablesFactory.
- fromLayerType is inferred from the path or filename of fromFile if not explicitly specified with --input.
- adaptationType is used as a suffix for the prompt filename when specified with --adaptation.
- demonstrativeType and layerType are primary command arguments used for directory names in various path resolutions.
- Custom variables (--*) are stored in the customVariables object and can be referenced in templates as `{variableName}`.
---

- For detailed descriptions of input options (CLI options), see the [breakdownparams repository](https://github.com/tettuan/breakdownparams).
- For detailed descriptions of reserved variables, see [variables.md in breakdownprompt](https://github.com/tettuan/breakdownprompt/blob/main/docs/variables.md).

# STDIN・-f (--from)・input_text Specifications

## Overview
- In Breakdown CLI, standard input (STDIN) and the -f (--from) option **operate independently**.
- Each triggers different reserved variables (`input_text`, `input_text_file`).

## Detailed Specifications
- **When STDIN is present**
  - STDIN content is set to `variables.input_text`.
  - -f (--from) is **optional** and may or may not be specified.
  - If STDIN does not exist, `input_text` will be an empty string or undefined.
- **When -f (--from) is specified**
  - The specified file's content is set to `variables.input_text_file`.
  - The value of `input_text_file` is determined independently regardless of STDIN presence.
- **When both are specified**
  - STDIN goes to `input_text`, file content goes to `input_text_file`.
  - Both can be used in templates as `{input_text}` `{input_text_file}`.
- **No mutual interference**
  - STDIN and -f do not interfere with each other; either one, both, or any case is allowed.
- **When neither is specified**
  Neither being absent is not allowed. At least one is required. If there is no input, an error occurs.

## Reflection to Template Variables
- By using variables like `{input_text}` `{input_text_file}` in prompt templates,
  STDIN and file content passed from CLI can be flexibly utilized.
- Example:
  ```md
  # Project
  {input_text}
  {input_text_file}
  ```
- This supports various input methods such as pipes, redirects, and file specification.

## References
- For specifications and details, also see `docs/breakdown/cli.md` and `docs/breakdown/path.md`.