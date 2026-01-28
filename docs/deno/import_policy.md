# Import Policy

## Basic Policy

1. Using import map

- Set import map in `deno.json` or `deno.jsonc`

```jsonc
{
  "imports": {
    // Fix standard library versions used across the project
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
- Use the same version throughout the project
- Include `deno.lock` file in version control

3. Security

- Execute with minimum necessary permissions
- Specify `--allow-env --allow-write --allow-read` when running tests
- Require explicit permission specifications in CI/CD

## Import Writing Rules

1. Standard Library Imports

```typescript
// OK: Correct import
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { exists } from "$std/fs/exists.ts";

// NG: Avoid these imports
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { join } from "./deps.ts"; // Avoid direct re-exports
```

2. Module Structure

- Always include file extensions (`.ts`, `.js`, `.tsx`, etc.)
- Use `./` or `../` for relative paths

```typescript
// OK: Correct import
import { MyComponent } from "./components/MyComponent.ts";
import type { Config } from "../types.ts";

// NG: Avoid these imports
import { MyComponent } from "components/MyComponent"; // No extension
import type { Config } from "types"; // Unclear relative path
```

3. Using deps.ts

```typescript
// deps.ts
// Use only for centralizing version management
export { assertEquals, assertExists } from "$std/assert/mod.ts";

// OK: Correct usage
import { assertEquals } from "./deps.ts";

// NG: Avoid this usage
import { assertEquals } from "$std/assert/mod.ts"; // Decentralized version management
```

## Implementation Notes

1. Prioritizing Web Standard APIs

- Prioritize Web Standard APIs like `fetch`, `Request`, `Response`
- Import Deno-specific APIs from `Deno` namespace

2. Node.js Compatibility Not Recommended. Use Deno Standards.

```typescript
// When using Node.js modules
import express from "npm:express@4";
// When using Node.js built-in modules
import * as path from "node:path";
```

## Dependency Verification Steps

1. Package Information Verification

```bash
# Check package information
deno info jsr:@std/assert

# Clear cache and re-resolve dependencies
rm -f deno.lock
deno cache --reload mod.ts

# Check dependencies of specific file
deno info your_file.ts
```

2. Permission Verification

```bash
# Execute with only necessary permissions
deno test --allow-read=. --allow-write=./tmp --allow-env

# Use permission prompts to verify required permissions
deno test
```

## Troubleshooting

1. Resolving Import Errors

- Check import map in `deno.json`
- Check file extension presence
- Check package version

2. Resolving Permission Errors

- Explicitly specify required permissions
- Follow principle of least privilege

3. Resolving Type Errors

- Check existence of type definition files
- Prioritize using Web Standard types

## Review Checklist

1. Security

- Minimum necessary permission specifications
- Use of secure import format

2. Dependencies

- Version consistency
- Check `deno.lock` updates

3. Code Quality

- Use of Web Standard APIs
- Explicit type definitions
- File extension specifications