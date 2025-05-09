# Module Structure

## Project Structure

```
lib/
├── deps.ts         # Centralized dependency management
├── mod.ts          # Main entry point
├── cli/           # CLI interface
│   ├── args.ts    # Argument processing
│   └── command.ts # Command execution
├── core/          # Core functionality
│   ├── parser/    # Parsing processing
│   │   ├── mod.ts   # Parser entry point
│   │   └── types.ts # Parser-specific type definitions
│   ├── prompt/    # Prompt processing
│   │   ├── mod.ts   # Prompt entry point
│   │   └── types.ts # Prompt-specific type definitions
│   └── types.ts   # Common type definitions
└── utils/         # Utilities
    ├── path.ts    # Path operations
    └── url.ts     # URL operations

tests/          # Test directory
├── cli/        # CLI tests
├── core/       # Core logic tests
└── utils/      # Utility tests
```

## Dependency Management

### Using deps.ts

Dependencies are centrally managed in `deps.ts`. This ensures version management and import consistency.

```typescript
// deps.ts
export * as path from "jsr:@std/path@1";
export * as fs from "jsr:@std/fs@1";
export { assertEquals } from "jsr:@std/assert@1";
export { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^1.0.0";
```

### Dependency Management in deno.json

```jsonc
{
  "name": "@tettuan/breakdown",
  "version": "1.0.0",
  "exports": {
    ".": "./mod.ts",
    "./prompt": "./lib/core/prompt/mod.ts"
  },
  "imports": {
    "@std/": "jsr:@std/",
    "@tettuan/": "jsr:@tettuan/"
  },
  "publish": {
    "include": ["lib/", "docs/", "README.md", "LICENSE"],
    "exclude": ["**/*_test.ts", "**/*.test.ts"]
  }
}
```

## Interface Definitions

### Command

```typescript
interface Command {
  /**
   * Executes the command and returns the result
   * @returns Promise of execution result
   */
  execute(): Promise<Response>;

  /**
   * Validates the command
   * @throws {ValidationError} When validation fails
   */
  validate(): Promise<void>;
}
```

### ProjectPrompt

```typescript
class ProjectPrompt {
  #config: Config;

  constructor(config: Config) {
    this.#config = config;
  }

  async load(): Promise<void> {
    // Implementation
  }
}
```

### PathResolver

```typescript
interface PathResolver {
  /**
   * Resolves a path
   * @param path Path to resolve (string or URL)
   * @returns Resolved path
   */
  resolve(path: string | URL): Promise<string>;
}
```

## Error Handling

### BreakdownError

```typescript
class BreakdownError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "BreakdownError";
    this.code = code;
  }
}
```

### ValidationError

```typescript
class ValidationError extends BreakdownError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}
```

## Type Definitions

### Config

```typescript
interface Config {
  from: string | URL;
  destination: string | URL;
  options?: {
    dryRun?: boolean;
    force?: boolean;
  };
}
```

## Documentation

### JSDoc

All public APIs should have appropriate JSDoc:

```typescript
/**
 * Converts markdown to prompt
 * @param input - Input markdown
 * @returns Converted prompt
 * @throws {ValidationError} When input is invalid
 */
export async function convert(input: string): Promise<Prompt> {
  // Implementation
}
```

## Package Publishing

### Publishing to JSR

Package publishing follows these steps:

1. Version update

```bash
deno run -A scripts/bump_version.ts
```

2. Pre-publish checks

```bash
deno check **/*.ts
deno test
deno lint
```

3. Publish to JSR

```bash
deno publish
```

### Versioning 