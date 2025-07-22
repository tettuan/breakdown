# Deno ベストプラクティス

## 依存関係管理

### deps.tsの使用

```typescript
// deps.ts
export * as path from "jsr:@std/path@1";
export * as fs from "jsr:@std/fs@1";
export { assertEquals } from "jsr:@std/assert@1";
export { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^1.0.8";
```

### バージョン管理

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

## パス操作

### URL APIの使用

```typescript
// 非推奨
import { join } from "jsr:@std/path@1";
const filePath = join(baseDir, "subdir", "file.txt");

// 推奨
const fileUrl = new URL("file.txt", new URL("subdir/", baseDir));
const filePath = fileUrl.pathname;
```

### パスの正規化

```typescript
// 非推奨
const path = "./dir/../file.txt";

// 推奨
const url = new URL("file.txt", "file:///dir/");
const normalizedPath = url.pathname;
```

### URLPattern APIの活用

```typescript
const pattern = new URLPattern({ pathname: "/api/:version/*" });
const match = pattern.exec("https://example.com/api/v1/users");
console.log(match.pathname.groups.version); // "v1"
```

## 仕様に従う場合のPATH

仕様定義を優先する。相対パスが要求なら相対パスを使う。

## ファイルシステム操作

### ファイル読み込み

```typescript
// 推奨
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

### ファイル書き込み

```typescript
// 推奨
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

## エラー処理

### Denoビルトインエラー

```typescript
// エラー型の活用
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
    // 既存ディレクトリの処理
  } else {
    throw new FileSystemError("Failed to create directory", error);
  }
}
```

## テスト

### テストの構造化

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
      // テスト実行
    } finally {
      await ctx.cleanup();
    }
  },
  sanitizeResources: true,
  sanitizeOps: true,
});
```

### テストステップ

```typescript
Deno.test("complex test", async (t) => {
  await t.step("step 1", async () => {
    // ステップ1のテスト
  });

  await t.step("step 2", async () => {
    // ステップ2のテスト
  });
});
```

## セキュリティ

### 権限の最小化

```jsonc
// deno.json
{
  "tasks": {
    "start": "deno run --allow-read=config --allow-write=logs main.ts",
    "test": "deno test --allow-read --allow-write=./tmp"
  }
}
```

### 環境変数

```typescript
// 推奨
const env = Deno.env.get("ENV_NAME");
if (env === undefined) {
  throw new Error("Required environment variable ENV_NAME is not set");
}
```

## パフォーマンス

### 非同期処理

```typescript
// 推奨: Promise.allの活用
const [file1, file2] = await Promise.all([
  Deno.readTextFile("file1.txt"),
  Deno.readTextFile("file2.txt"),
]);

// 推奨: イテレーションの最適化
for await (const entry of Deno.readDir("./")) {
  if (entry.isFile) {
    // ファイル処理
  }
}
```

### リソース管理

```typescript
// 推奨: リソースのクリーンアップ
const file = await Deno.open("file.txt");
try {
  // ファイル操作
} finally {
  file.close();
}
```

## パッケージ公開

### JSR設定

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

### ドキュメント

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
  // 実装
}
```
