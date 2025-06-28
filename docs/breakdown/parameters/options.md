# breakdown argument specifications

> **For parameter to path resolution flow and implementation examples, also see [app_factory.md](./app_factory.md).**

## Parameter Processing Implementation

Uses https://jsr.io/@tettuan/breakdownparams. Check JSR for the latest version. Read the README at
https://github.com/tettuan/breakdownparams to understand. Option details are documented at
https://github.com/tettuan/breakdownparams/blob/HEAD/docs/options.md.

```ts
import { ParamsParser } from "@tettuan/breakdownparams";

const parser = new ParamsParser();

// Parse arguments
const result = parser.parse(Deno.args);

// Handle different result types
switch (result.type) {
  case "zero-params":
    if (result.help) {
      console.log("Show help message");
    }
    if (result.version) {
      console.log("Show version");
    }
    break;

  case "one":
    if (result.command === "init") {
      console.log("Initialize project");
    }
    break;

  case "two":
    console.log(`Demonstrative: ${result.demonstrativeType}`);
    console.log(`Layer: ${result.layerType}`);
    if (result.options.fromFile) {
      console.log(`From file: ${result.options.fromFile}`);
    }
    break;
}
```

## Basic Commands

```bash
./.deno/bin/breakdown
```

## Arguments

First, processing varies depending on the number of arguments.

### Result Types from breakdownparams

```
ZeroParamsResult: For commands with no parameters or help/version flags
OneParamsResult: For single commands like "init"
TwoParamsResult: For commands with demonstrative and layer type
```

### ZeroParamsResult = Help or version checking:

ex.

```bash
./.deno/bin/breakdown --help
```

#### OneParamsResult = Application modifications like initialization

- `init` : Perform initial setup.

### TwoParamsResult = Breakdown processing

ex.

```bash
./.deno/bin/breakdown `<DemonstrativeType>` `<layerType>` \
  --from=`<file>` \
  --destination=`<output_file>` \
  --input=`<from_layer_type>` \
  --adaptation=`<adaptation_type>`
```

ex.

```bash
./.deno/bin/breakdown to issue \
  --from=project.md \
  --destination=issue_details \
  --input=project \
  --adaptation=strict
```

### Option List

#### Basic Options

- Used for prompt specification
  - `-a, --adaptation=<adaptation_type>`: Specifies the prompt type (e.g., strict, a, etc.)
  - `-i, --input=<from_layer_type>`: usecase: Specifies the input layer type, system: Overrides fromLayerType
- Used for template variable values (see `BreakdownPrompt` documents)
  - `-f, --from=<file>`: usecase: Specifies the input file, system: Replaces `{input_text_file}`
  - `-o, --destination=<output_file>`: usecase: Specifies the output destination, system: Replaces `{destination_path}`

- STDIN 
  - Used for template variable values. Replaces `{input_text}`

#### Extended Options 

##### Custom Variable Options (--uv-*)

You can set user-defined variables that can be referenced within templates.

###### Basic Usage

```bash
# Single custom variable
./.deno/bin/breakdown to issue \
  --from=project.md \
  --uv-userName=Taro

# Multiple custom variables
./.deno/bin/breakdown to issue \
  --from=project.md \
  --uv-userName=Taro \
  --uv-projectName=MyProject \
  --uv-version=1.0.0 \
  --uv-environment=production
```

###### Custom Variable Specifications

- **Format**: `--uv-variableName=value`
- **Variable Name**: Alphanumeric characters and underscores (_) are allowed
- **Value**: Any string (enclose in quotes if it contains spaces)

###### Reference Method in Templates

Within prompt templates, reference using the format `{variableName}`:

```markdown
# Prompt template example
Project Name: {projectName}
Assignee: {userName}
Version: {version}
Environment: {environment}

Input File: {input_text_file}
```

###### Execution Examples

```bash
# Issue creation with user information
./.deno/bin/breakdown to issue \
  --from=requirements.md \
  --uv-userName=Taro \
  --uv-assignee=Hanako \
  --uv-priority=high

# Document generation with project information
./.deno/bin/breakdown to documentation \
  --from=design.md \
  --uv-projectName=E-commerce \
  --uv-version=2.1.0 \
  --uv-releaseDate=2024-04-01

# Multi-language support example
./.deno/bin/breakdown to translation \
  --from=content.md \
  --uv-sourceLang=Japanese \
  --uv-targetLang=English \
  --uv-translator=Yamada-Taro
```

###### Notes

- Custom variable names are case-sensitive (`userName` and `username` are different variables)
- If the same variable name is specified multiple times, the last value is used
- If an undefined variable is referenced in the template, it remains unreplaced