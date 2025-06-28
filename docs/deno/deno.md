# Deno Best Practices

## Dependency Management

### Using deps.ts

```typescript
// deps.ts
export * as path from "jsr:@std/path@1";
export * as fs from "jsr:@std/fs@1";
export { assertEquals } from "jsr:@std/assert@1";
export { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^1.0.0";
```

### Version Management

```jsonc
// deno.json
{
  "name": "@tettuan/breakdown",
  "version": "1.0.0",
  "exports": "./mod.ts",
  "imports": {
    "@std/": "jsr:@std/",
    "@tettuan/": "jsr:@tettuan/"
  },
  "publish": {
    "include": ["lib/", "docs/", "README.md", "LICENSE"]
  },
  "tasks": {
    "test": "deno test",
    "check": "deno check **/*.ts",
    "lint": "deno lint",
    "fmt": "deno fmt"
  }
}
```

## Path Operations

### Using URL API

```typescript
// Not recommended
import { join } from "jsr:@std/path@1";
const filePath = join(baseDir, "subdir", "file.txt");

// Recommended
const fileUrl = new URL("file.txt", new URL("subdir/", baseDir));
const filePath = fileUrl.pathname;
```

### Path Normalization

```typescript
// Not recommended
const path = "./dir/../file.txt";

// Recommended
const url = new URL("file.txt", "file:///dir/");
const normalizedPath = url.pathname;
```

### Using URLPattern API

```typescript
const pattern = new URLPattern({ pathname: "/api/:version/*" });
const match = pattern.exec("https://example.com/api/v1/users");
console.log(match.pathname.groups.version); // "v1"
```

## Following Specification for PATH

When specifications require it, follow them. Use relative paths if required by specifications.

## File System Operations

### Reading Files

```typescript
// Recommended
try {
  const content = await Deno.readTextFile("file.txt");
} catch (error) {
  if (error instanceof Deno.errors.NotFound) {
    console.error("File not found:", error);
  } else if (error instanceof Deno.errors.PermissionDenied) {
    console.error("Permission denied:", error);
  }
}
```

### Writing Files

```typescript
// Recommended
try {
  await Deno.writeTextFile("file.txt", content, {
    create: true,
    mode: 0o644,
  });
} catch (error) {
  if (error instanceof Deno.errors.PermissionDenied) {
    console.error("Permission denied:", error);
  }
}
```

## Error Handling

### Deno Built-in Errors

```typescript
// Using error types
class FileSystemError extends Error {
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "FileSystemError";
    this.cause = cause;
  }
}

try {
  await Deno.mkdir("dir");
} catch (error) {
  if (error instanceof Deno.errors.AlreadyExists) {
    // Handle existing directory
  } else {
    throw new FileSystemError("Failed to create directory", error);
  }
}
```

## Testing

### Structuring Tests

```typescript
// test_util.ts
export function createTestContext() {
  return {
    tempDir: await Deno.makeTempDir(),
    cleanup: async () => {
      await Deno.remove(tempDir, { recursive: true });
    },
  };
}

// feature_test.ts
Deno.test({
  name: "feature test",
  async fn() {
    const ctx = await createTestContext();
    try {
      // Test execution
    } finally {
      await ctx.cleanup();
    }
  },
  sanitizeResources: true,
  sanitizeOps: true,
});
```

### Test Steps

```typescript
Deno.test("complex test", async (t) => {
  await t.step("step 1", async () => {
    // Step 1 test
  });

  await t.step("step 2", async () => {
    // Step 2 test
  });
});
```

## Security

### Minimizing Permissions

```jsonc
// deno.json
{
  "tasks": {
    "start": "deno run --allow-read=config --allow-write=logs main.ts",
    "test": "deno test --allow-read --allow-write=./tmp"
  }
}
```

### Environment Variables

```typescript
// Recommended
const env = Deno.env.get("ENV_NAME");
if (env === undefined) {
  throw new Error("Required environment variable ENV_NAME is not set");
}
```

## Performance

### Asynchronous Processing

```typescript
// Recommended: Using Promise.all
const [file1, file2] = await Promise.all([
  Deno.readTextFile("file1.txt"),
  Deno.readTextFile("file2.txt"),
]);

// Recommended: Optimizing iterations
for await (const entry of Deno.readDir("./")) {
  if (entry.isFile) {
    // File processing
  }
}
```

### Resource Management

```typescript
// Recommended: Resource cleanup
const file = await Deno.open("file.txt");
try {
  // File operations
} finally {
  file.close();
}
```

## Package Publishing

### JSR Configuration

```jsonc
// deno.json
{
  "name": "@tettuan/breakdown",
  "version": "1.0.0",
  "exports": {
    ".": "./mod.ts",
    "./prompt": "./lib/core/prompt/mod.ts"
  },
  "publish": {
    "include": ["lib/", "docs/", "README.md", "LICENSE"],
    "exclude": ["**/*_test.ts", "**/*.test.ts"]
  }
}
```

### Documentation

```typescript
/**
 * Breakdown core functionality.
 * @module
 */

/**
 * Converts markdown to structured prompt.
 * @param input - The markdown input
 * @returns Structured prompt object
 */
export async function convert(input: string): Promise<Prompt> {
  // Implementation
}
```