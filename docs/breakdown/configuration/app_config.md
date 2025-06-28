# Loading the breakdownconfig module

Use https://jsr.io/@tettuan/breakdownconfig. Read and understand README
https://github.com/tettuan/breakdownconfig.

> **For implementation examples of path resolution and configuration usage, see also [app_factory.md](./app_factory.md).**

```ts
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.4";

// Create a new configuration instance
const config = new BreakdownConfig();

// Load both application and user configurations
await config.loadConfig();

// Get the merged configuration
const settings = config.getConfig();
```

# Configuration file structure

Configuration is managed in the following hierarchy:

1. Application configuration (`.agent/breakdown/config/app.yml`)
2. User configuration (`.agent/breakdown/config/user.yml`)

## When `--config` or `-c` is present

When `-c=$prefix` is specified:

1. Application configuration (`.agent/breakdown/config/$prefix-app.yml`)
2. User configuration (`.agent/breakdown/config/$prefix-user.yml`)

### Existence check for `--config` or `-c`

- Breakdown's single-responsibility ConfigPrefixDetector
  - Responsibility: Only detect `--config` or `-c` and retrieve its value
- BreakdownConfig requires $prefix and cannot be used to obtain $prefix

## Application configuration items

- `working_dir`: Working directory path (default: `.agent/breakdown`)
  - **Note: `working_dir` is NOT a prefix (parent directory) for `app_prompt.base_dir` or `app_schema.base_dir`.**
  - **`working_dir` is used only for resolving output/input files (-o, -i options, etc.) and is not used for resolving prompt or schema directories.**
- `app_prompt`: Prompt-related configuration
  - `base_dir`: Base directory for prompt files (default: `lib/breakdown/prompts`)
- `app_schema`: Schema-related configuration
  - `base_dir`: Base directory for schema files (default: `lib/breakdown/schema`)

## User configuration items

No description provided