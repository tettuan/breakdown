# Breakdown Debug Output Features

## Enabling Debug Mode

When running Breakdown CLI or library, detailed debug output is available using [@tettuan/breakdownlogger](https://jsr.io/@tettuan/breakdownlogger).

### Basic Usage

```sh
# Run with debug level
LOG_LEVEL=debug deno run -A cli/breakdown.ts ...

# Run with info level (default)
LOG_LEVEL=info deno run -A cli/breakdown.ts ...

# Show errors only
LOG_LEVEL=error deno run -A cli/breakdown.ts ...
```

### Advanced Debug Control

BreakdownLogger supports detailed control through the following environment variables:

```sh
# Debug specific modules only
LOG_KEY=processor,config LOG_LEVEL=debug deno run -A cli/breakdown.ts ...

# Control message length (up to 100 characters)
LOG_LENGTH=S LOG_LEVEL=debug deno run -A cli/breakdown.ts ...

# Complete detailed output (no limit)
LOG_LENGTH=W LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

## Output Content

Using BreakdownLogger, the following detailed information is output in a structured log format:

### Basic Information
- **current working directory**: Current directory when command is executed
- **app.yml path**: Absolute path of referenced app.yml
- **app.yml content**: Content of app.yml configuration
- **user.yml path**: Absolute path of referenced user.yml  
- **user.yml content**: Content of user.yml configuration

### Prompt Related
- **prompt template path**: Path of actually referenced prompt template
- **JSON schema path**: Path of referenced schema file
- **variables for PromptManager**: Variables passed to PromptManager (JSON format)

### Log Output Format

```
[timestamp] [LEVEL] [key] message
Data: { optional data object }
```

Example:
```
[2025-06-15T12:00:00.000Z] [DEBUG] [processor] Processing template variables
Data: { templatePath: "/path/to/template.md", variables: {...} }
```

## Environment Variables Details

### LOG_LEVEL - Log Level Control

| Level | Description | Output Content |
|--------|------|----------|
| `debug` | Most detailed | DEBUG, INFO, WARN, ERROR |
| `info` | Standard (default) | INFO, WARN, ERROR |
| `warn` | Warnings and above | WARN, ERROR |
| `error` | Errors only | ERROR |

### LOG_LENGTH - Message Length Control

| Setting | Character Limit | Use Case |
|--------|------------|------|
| Not set | 30 characters | CI/CD, quick check |
| `S` | 100 characters | Normal debugging |
| `L` | 200 characters | Detailed investigation |
| `W` | No limit | Complete debugging |

### LOG_KEY - Module Filtering

Output logs only from specific modules or components:

```sh
# Single module
LOG_KEY=processor

# Multiple modules (comma-separated)
LOG_KEY=processor,config,validator

# Hierarchical filter (colon-separated)
LOG_KEY=prompt:processor:template

# Path-style filter (slash-separated)
LOG_KEY=lib/prompt/processor
```

## Output Location and Implementation Method

### Usage in Test Code

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Create module-specific logger
const logger = new BreakdownLogger("prompt-processor");

// Output debug information
logger.debug("Starting template processing", { 
  templatePath: templatePath,
  variables: variables 
});

logger.info("Config file loaded successfully", { 
  configPath: configPath 
});

logger.error("Validation error", { 
  error: errorMessage,
  input: inputData 
});
```

### Important Notes

- Use BreakdownLogger **only in test code**
- Do not use in application code
- Set appropriate log levels for production use

## Staged Debugging Strategy

### 1. Problem Overview
```sh
LOG_LEVEL=error deno run -A cli/breakdown.ts ...
```

### 2. Warning Level Investigation
```sh
LOG_LEVEL=warn deno run -A cli/breakdown.ts ...
```

### 3. Detailed Investigation of Specific Modules
```sh
LOG_KEY=processor LOG_LENGTH=L LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

### 4. Complete Trace
```sh
LOG_LENGTH=W LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

## Usage Examples and Troubleshooting

### Investigating Configuration File Issues
```sh
LOG_KEY=config LOG_LENGTH=W LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

### Investigating Prompt Processing Issues
```sh
LOG_KEY=prompt,processor LOG_LENGTH=L LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

### Investigating Performance Issues
```sh
LOG_LEVEL=warn LOG_LENGTH=S deno run -A cli/breakdown.ts ...
```

### Minimal Logging in CI/CD Environment
```sh
LOG_LEVEL=error deno run -A cli/breakdown.ts ...
```

---

**Notes**
- Log output is sent to standard error output
- File output is not supported
- Efficient debugging is possible by combining log levels and filtering
- See [BreakdownLogger GitHub](https://github.com/tettuan/breakdownlogger) for details