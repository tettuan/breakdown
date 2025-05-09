# PromptVariablesFactory

> **For detailed specifications of application settings (app.yml, user.yml), please refer to [app_config.md](./app_config.md).**

## Overview

A Factory class that centralizes all parameters and path resolution required for prompt replacement processing.
CLI, tests, and the main application must perform path resolution and parameter construction through this Factory.

- Settings are obtained from BreakdownConfig and combined with CLI parameters to generate all paths and parameters according to specifications
- Centralizes all path resolution, including schema file paths
- Ensures extensibility, testability, and consistency through the Factory pattern

## Responsibilities

- Construction of all paths and parameters for prompts/schemas/input-output files
- Minimizing the impact of specification changes

Note: Input validation is primarily the responsibility of the Validator, while the Factory focuses on path and parameter construction.

## Input/Output

- **Input**:  
  - BreakdownConfig (settings loaded from app.yml, user.yml, etc.)
  - CLI parameters (DoubleParamsResult, etc., all parameters passed via command line arguments or API)
- **Output**:  
  - All parameters required for prompt replacement processing, such as promptFilePath, inputFilePath, outputFilePath, schemaFilePath

## Path Resolution Rules (Key Points)

- **Prompt File**:  
  Prompt base directory (`app_prompt.base_dir`) + demonstrativeType + layerType + `f_{fromLayerType}.md`
- **Schema File**:  
  Schema base directory (`app_schema.base_dir`) + demonstrativeType + layerType + `base.schema.md`
- **Input File**:  
  Complies with the "Input File" section in [path.md](./path.md)
- **Output File**:  
  Complies with the "Output File" section in [path.md](./path.md)

## Class Design & API Example

> Note: Only public API methods are listed below. Internal private methods are omitted.

```ts
interface PromptVariablesFactoryOptions {
  config: AppConfig;
  cliParams: DoubleParamsResult;
}

class PromptVariablesFactory {
  constructor(options: PromptVariablesFactoryOptions);
  validateAll(): void;
  getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    // ... other necessary parameters
  };
  // Individual getters (can also be readonly properties)
  readonly promptFilePath: string;
  readonly inputFilePath: string;
  readonly outputFilePath: string;
  readonly schemaFilePath: string;
}
```

### Usage Example

```ts
const factory = new PromptVariablesFactory({ config, cliParams });
// Get all parameters
const { promptFilePath, inputFilePath, outputFilePath, schemaFilePath } = factory.getAllParams();
// Individual access
console.log(factory.promptFilePath);
console.log(factory.inputFilePath);
```

## References

- [docs/breakdown/path.md](./path.md)
- [docs/breakdown/options.md](./options.md)
- [docs/breakdown/testing.md](./testing.md)
- [docs/breakdown/app_config.md](./app_config.md)

# Parameter Options and Reserved Variables Correspondence Table

> This table organizes the relationship between breakdownparams parameter options (--from, -o, etc.) and breakdownprompt reserved variables.

## Correspondence Table

| Input Option          | inputFilePath         | outputFilePath        | promptFilePath        | schemaFilePath        | fromLayerType        | adaptationType      |
|------------------------|-----------------------|-----------------------|-----------------------|-----------------------|----------------------|---------------------|
| --from, -f             | Used as input file path |                       |                       |                       | Inferred from fromFile |                     |
| --destination, -o      |                       | Used as output file path |                       |                       |                      |                     |
| --input, -i            |                       |                       |                       |                       | Specifies input layer type |                     |
| --adaptation, -a       |                       |                       | Used as prompt filename suffix |                       |                      | Specifies prompt type   |
| demonstrativeType      |                       |                       | Used for path resolution | Used for path resolution |                      |                     |
| layerType              |                       |                       | Used for path resolution | Used for path resolution |                      |                     |

### Notes
- Reserved variables like inputFilePath, outputFilePath, promptFilePath, schemaFilePath are centrally constructed by PromptVariablesFactory.
- fromLayerType is explicitly specified by --input, or inferred from fromFile path or filename if not specified.
- adaptationType is used as a suffix for the prompt filename when specified by --adaptation.
- demonstrativeType and layerType are main command arguments used for directory names in various path resolutions.

---

- For detailed explanations of input options (CLI options), please refer to the [breakdownparams repository](https://github.com/tettuan/breakdownparams).
- For detailed explanations of reserved variables, please refer to [breakdownprompt's variables.md](https://github.com/tettuan/breakdownprompt/blob/main/docs/variables.md).

# STDIN, -f (--from), and input_text Specifications

## Overview
- In Breakdown CLI, standard input (STDIN) and the -f (--from) option operate **independently**.
- Each triggers different reserved variables (`input_text`, `input_text_file`).

## Detailed Specifications
- **When STDIN is present**
  - STDIN content is set to `variables.input_text`.
  - -f (--from) is **optional** and may or may not be specified.
  - If STDIN doesn't exist, `input_text` will be an empty string or undefined.
- **When -f (--from) is specified**
  - The content of the specified file is set to `variables.input_text_file`.
  - The value of `input_text_file` is determined independently of STDIN presence.
- **When both are specified**
  - STDIN is set to `input_text`, and file content is set to `input_text_file`.
  - Both can be used in templates as `{input_text}` and `{input_text_file}`.
- **No mutual interference**
  - STDIN and -f don't interfere with each other, allowing either, both, or neither case.
- **When neither is specified**
  Neither is allowed. At least one is required. Error occurs if no input is provided.

## Template Variable Reflection
- Using variables like `{input_text}` and `{input_text_file}` in prompt templates allows flexible use of STDIN or file content passed from CLI.
- Example:
  ```md
  # Project
  {input_text}
  {input_text_file}
  ```
- This enables support for various input methods like pipes, redirects, and file specifications.

## References
- For specification basis and details, also refer to `docs/breakdown/cli.md` and `docs/breakdown/path.md`. 