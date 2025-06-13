# Breakdown Argument Specification

> **For parameter to path resolution flow and implementation examples, also refer to [app_factory.md](./app_factory.md).**

## Parameter Processing Implementation

Uses https://jsr.io/@tettuan/breakdownparams. Check JSR for the latest version. Read and understand the README
at https://github.com/tettuan/breakdownparams. Option details are documented at
https://github.com/tettuan/breakdownparams/blob/HEAD/docs/options.md.

```ts
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^0.1.10";

const parser = new ParamsParser();

// Parse arguments
const result = parser.parse(Deno.args);

// Handle different result types
switch (result.type) {
  case "no-params":
    if (result.help) {
      console.log("Show help message");
    }
    if (result.version) {
      console.log("Show version");
    }
    break;

  case "single":
    if (result.command === "init") {
      console.log("Initialize project");
    }
    break;

  case "double":
    console.log(`Demonstrative: ${result.demonstrativeType}`);
    console.log(`Layer: ${result.layerType}`);
    if (result.options.fromFile) {
      console.log(`From file: ${result.options.fromFile}`);
    }
    break;
}
```

## Basic Command

```bash
./.deno/bin/breakdown
```

## Arguments

Processing varies based on the number of arguments.

### Result Types from breakdownparams

```
NoParamsResult: For commands with no parameters or help/version flags
SingleParamResult: For single commands like "init"
DoubleParamsResult: For commands with demonstrative and layer type
```

### NoParamsResult = Help and Version Check:

ex.

```bash
./.deno/bin/breakdown --help
```

#### SingleParamResult = Initialization and Application Changes

- `init` : Perform initial setup.

### DoubleParamsResult = Breakdown Processing

ex.

```bash
./.deno/bin/breakdown `<DemonstrativeType>` `<layerType>` \
  --from `<file>` \
  --destination `<output_file>` \
  --input `<from_layer_type>` \
  --adaptation `<adaptation_type>` \
```

ex.

```bash
./.deno/bin/breakdown to issue \
  --from project.md \
  --destination issue_details \
  --input project \
  --adaptation strict \
```

### Option List

- Used for prompt specification
  - `-a, --adaptation <adaptation_type>`: Specify prompt type (e.g., strict, a, etc.)
  - `-i, --input <from_layer_type>`: usecase: specify input layer type, system: override fromLayerType
- Used for template variable values (see `BreakdownPrompt` documents)
  - `-f, --from <file>`: usecase: specify input file, system: replace `{input_text_file}`
  - `-o, --destination <output_file>`: usecase: specify output destination, system: replace `{destination_path}`

- STDIN 
  - Used for template variable values. Replaces `{input_text}`

# Double Command Parameter Validation Specification

## About Validation Responsibility
- Breakdown CLI parameter validation is **not the Factory's responsibility, but the Validator's responsibility**.
- Factory focuses on "path/parameter construction", while Validator handles input validity checks (existence confirmation, requirement determination, type checking, etc.).

1. **Principle of Separation of Concerns**
2. **Centralization of Validation**

## Overview
- Breakdown CLI parameters (-f, --input, -o, stdin) have defined requirements/optionality, value presence, and error conditions for each combination.
- Factory validates input values according to the validation specifications below during path/parameter construction.

## Decision Flowchart

```mermaid
flowchart TD
    A[CLI Start] --> B{ -f (--from) specified? }
    B -- Yes --> C[File existence check]
    C -- Exists --> D[Set file content to input_text_file]
    C -- Not exists --> E[Error: No such file]
    B -- No --> F{ stdin available? }
    F -- Yes --> G[Set STDIN content to input_text]
    F -- No --> H[Error: No input provided via stdin or -f/--from option]
    D & G --> I{ --input specified? }
    I -- Yes --> J[Override input layer type to fromLayerType]
    I -- No --> K[Use default fromLayerType]
    J & K --> L{ --destination (-o) specified? }
    L -- Yes --> M[Set output file path]
    L -- No --> N[Output file path not specified (default/stdout)]
```

## Parameter Combination Table

| -f (--from) | stdin | --input (-i) | --destination (-o) | Combinations | Notes |
|:-----------:|:-----:|:------------:|:-----------------:|:------------:|:------|
| Required/Optional | Optional | Optional | Optional | 2x2x2=8 | Either -f or stdin required |
| Value required when specified | Value optional | Value required when specified | Value optional when specified | | |

- -f (--from): Value required when specified, file must exist
- stdin: Use value if present, otherwise don't use
- --input: Optional, value required when specified (for overriding fromLayerType)
- --destination: Optional, value optional when specified (key only is OK)

## Summary
- Either [ -f or stdin ] is required (error if both missing)
- When -f is specified, file must exist and value is required
- stdin uses value if present, otherwise doesn't use
- --input is only for overriding fromLayerType
- --destination specifies output destination (optional)

## Validator Design
- Breakdown CLI parameter validation is designed using the Strategy pattern.
- Strategies (validator classes) are separated for each BreakdownParams result type (NoParams, Single, Double).
- Each Strategy has validation responsibilities only for its command type.
- In subdirectory `lib/cli/validators/`:
  - `base_validator.ts` (Strategy interface)
  - `single_command_validator.ts` (for SingleParamResult)
  - `double_command_validator.ts` (for DoubleParamsResult)
  - `no_params_command_validator.ts` (for NoParamsResult)
  - `command_options_validator.ts` (Facade for Strategy selection/execution)
  These enhance separation of concerns, extensibility, and testability.
- This makes it easy to add/modify validation specifications for each command type.