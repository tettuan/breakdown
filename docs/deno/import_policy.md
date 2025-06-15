# Import Policy

## Basic Policy

1. Using import maps

- Configure import map in `deno.json` or `deno.jsonc`

```jsonc
{
  "imports": {
    // Fix version of standard libraries used throughout the project
    "$std/": "jsr:@std/",
    // Project-specific aliases
    "$lib/": "./lib/",
    "$tests/": "./tests/"
  },
  "tasks": {
    "test": "deno test --allow-env --allow-write --allow-read"
  }
}
```

2. Version Management

- Specify explicit versions for all packages
- Use `@^x.y.z` format for version specification
- Use consistent versions throughout the project
- Include `deno.lock` file in version control

3. Security

- Run with minimum required permissions
- Specify `--allow-env --allow-write --allow-read` for test execution
- Require explicit permission specification in CI/CD

## Import Writing Rules

1. Standard Library Imports

```typescript
// ✅ Correct imports
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { exists } from "$std/fs/exists.ts";

// ❌ Avoid these imports
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { join } from "./deps.ts"; // Avoid direct re-exports
```

2. Module Structure

- Always include file extensions (`.ts`, `.js`, `.tsx`, etc.)
- Use `./` or `../` for relative paths

```typescript
// ✅ Correct imports
import { MyComponent } from "./components/MyComponent.ts";
import type { Config } from "../types.ts";

// ❌ Avoid these imports
import { MyComponent } from "components/MyComponent"; // No extension
import type { Config } from "types"; // Unclear relative path
```

3. Using deps.ts

```typescript
// deps.ts
// Use only for centralized version management
export { assertEquals, assertExists } from "$std/assert/mod.ts";

// ✅ Correct usage
import { assertEquals } from "./deps.ts";

// ❌ Avoid this usage
import { assertEquals } from "$std/assert/mod.ts"; // Distributed version management
```

## Implementation Notes

1. Prioritize Web Standard APIs

- Prioritize Web standard APIs like `fetch`, `Request`, `Response`
- Import Deno-specific APIs from the `Deno` namespace

2. Node.js Compatibility Not Recommended. Use Deno Standards.

```typescript
// When using Node.js modules
import express from "npm:express@4";
// When using Node.js built-in modules
import * as path from "node:path";
```

## Dependency Verification Steps

1. Package Information Check

```bash
# Check package information
deno info jsr:@std/assert

# Clear cache and resolve dependencies
rm -f deno.lock
deno cache --reload mod.ts

# Check dependencies for specific file
deno info your_file.ts
```

2. Permission Check

```bash
# Run with only required permissions
deno test --allow-read=. --allow-write=./tmp --allow-env

# Use permission prompt to verify required permissions
deno test
```

## Troubleshooting

1. Resolving Import Errors

- Check import map in `deno.json`
- Verify file extension presence
- Check package versions

2. Resolving Permission Errors

- Explicitly specify required permissions
- Follow principle of least privilege

3. Resolving Type Errors

- Verify type definition file existence
- Prioritize Web standard types

## Review Checkpoints

1. Security

- Minimum required permission specification
- Use of secure import formats

2. Dependencies

- Version consistency
- `deno.lock` update verification

3. Code Quality

- Use of Web standard APIs
- Explicit type definitions
- File extension specification 