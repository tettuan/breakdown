# Loading the breakdownconfig Module

Use https://jsr.io/@tettuan/breakdownconfig. Read and understand the README at
https://github.com/tettuan/breakdownconfig.

> **For implementation examples of configuration path resolution and usage, see also [app_factory.md](./app_factory.md).**

```ts
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.6";

// Create a new configuration instance
const config = new BreakdownConfig();

// Load both application and user configurations
await config.loadConfig();

// Get the merged configuration
const settings = config.getConfig();
```

# Configuration File Structure

Settings are managed in the following hierarchy:

1. Application settings (`.agent/breakdown/config/app.yml`)
2. User settings (`.agent/breakdown/config/user.yml`)

## When `--config` or `-c` is specified

When `-c=$prefix` is specified:

1. Application settings (`.agent/breakdown/config/$prefix-app.yml`)
2. User settings (`.agent/breakdown/config/$prefix-user.yml`)

### Existence Check for `--config` or `-c`

- Breakdown's single-responsibility ConfigPrefixDetector
  - Responsibility: Only detects `--config` or `-c` and retrieves the value
- BreakdownConfig requires $prefix, but cannot be used to retrieve $prefix

## Application Settings

- `working_dir`: Path to the working directory (default: `.agent/breakdown`)
  - **Note: `working_dir` is not a prefix (parent directory) for `app_prompt.base_dir` or `app_schema.base_dir`.**
  - **`working_dir` is only used for resolving output and input files (-o, -i options, etc.) and is not used for resolving prompt or schema directories.**
- `app_prompt`: Prompt-related settings
  - `base_dir`: Base directory for prompt files (default: `lib/breakdown/prompts`)
- `app_schema`: Schema-related settings
  - `base_dir`: Base directory for schema files (default: `lib/breakdown/schema`)

## User Settings

None