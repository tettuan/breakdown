# モジュール構成

## プロジェクト構造

```
lib/
├── deps.ts         # 依存関係の一元管理
├── mod.ts          # メインエントリーポイント
├── cli/           # CLIインターフェース
│   ├── args.ts    # 引数処理
│   └── command.ts # コマンド実行
├── core/          # コア機能
│   ├── parser/    # パース処理
│   │   ├── mod.ts   # パーサーのエントリーポイント
│   │   └── types.ts # パーサー固有の型定義
│   ├── prompt/    # プロンプト処理
│   │   ├── mod.ts   # プロンプトのエントリーポイント
│   │   └── types.ts # プロンプト固有の型定義
│   └── types.ts   # 共通型定義
└── utils/         # ユーティリティ
    ├── path.ts    # パス操作
    └── url.ts     # URL操作

tests/          # テストディレクトリ
├── cli/        # CLIテスト
├── core/       # コアロジックテスト
└── utils/      # ユーティリティテスト
```

## 依存関係管理

### deps.tsの使用

依存関係は`deps.ts`で一元管理します。これにより、バージョン管理とインポートの一貫性を保ちます。

```typescript
// deps.ts
export * as path from "jsr:@std/path@1";
export * as fs from "jsr:@std/fs@1";
export { assertEquals } from "jsr:@std/assert@1";
export { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^1.0.0";
```

### deno.jsonでの依存関係管理

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

## インターフェース定義

### Command

```typescript
interface Command {
  /**
   * コマンドを実行し、結果を返します
   * @returns 実行結果のPromise
   */
  execute(): Promise<Response>;

  /**
   * コマンドのバリデーションを行います
   * @throws {ValidationError} バリデーションエラー時
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
    // 実装
  }
}
```

### PathResolver

```typescript
interface PathResolver {
  /**
   * パスを解決します
   * @param path 解決するパス（文字列またはURL）
   * @returns 解決されたパス
   */
  resolve(path: string | URL): Promise<string>;
}
```

## エラー処理

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

## 型定義

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

## ドキュメント

### JSDoc

すべてのパブリックAPIには適切なJSDocを付与します：

```typescript
/**
 * マークダウンをプロンプトに変換します
 * @param input - 入力マークダウン
 * @returns 変換されたプロンプト
 * @throws {ValidationError} 入力が無効な場合
 */
export async function convert(input: string): Promise<Prompt> {
  // 実装
}
```

## パッケージ公開

### JSRへの公開

パッケージの公開は以下の手順で行います：

1. バージョンの更新

```bash
deno run -A scripts/bump_version.ts
```

2. 公開前のチェック

```bash
deno check **/*.ts
deno test
deno lint
```

3. JSRへの公開

```bash
deno publish
```

### バージョニング

- セマンティックバージョニングを採用
- パブリックAPIの変更は`MAJOR`バージョンを更新
- 後方互換性のある機能追加は`MINOR`バージョンを更新
- バグ修正は`PATCH`バージョンを更新

## モジュール設計原則

### エントリーポイント

各機能モジュールは`mod.ts`をエントリーポイントとして持ち、以下の原則に従います：

```typescript
// lib/core/parser/mod.ts
export * from "./types.ts";
export * from "./parser.ts";
// 内部実装の直接エクスポートは避ける
```

### 依存関係の方向

```
deps.ts ← mod.ts ← cli/ ← core/ ← utils/
```

- 依存の方向は一方向のみ
- 循環参照を防ぐため、必要に応じてインターフェースを活用

### テスト構造

```typescript
// tests/core/parser/parser_test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { describe, it } from "jsr:@std/testing@1";
import { Parser } from "../../../lib/core/parser/mod.ts";

describe("Parser", () => {
  it("should parse markdown correctly", async () => {
    const parser = new Parser();
    const result = await parser.parse("# Test");
    assertEquals(result.type, "heading");
  });
});
```

## コーディング規約

### インポート規則

```typescript
// 推奨: 明示的なインポート
import { Parser } from "./parser.ts";
import type { ParserOptions } from "./types.ts";

// 非推奨: ワイルドカードインポート
import * as parser from "./parser.ts";
```

### 型安全性

```typescript
// 推奨: 厳密な型定義
interface ParseOptions {
  readonly source: string;
  readonly strict?: boolean;
}

// 非推奨: 暗黙的な型
const options = {
  source: "input",
  strict: true,
};
```

### エラーハンドリング

```typescript
// 推奨: 具体的なエラー型の使用
try {
  await parser.parse(input);
} catch (error) {
  if (error instanceof ValidationError) {
    // バリデーションエラーの処理
  } else if (error instanceof ParseError) {
    // パースエラーの処理
  } else {
    throw error; // 未知のエラーは再スロー
  }
}
```

### 非同期処理

```typescript
// 推奨: async/awaitの一貫した使用
async function processFiles(files: string[]): Promise<Result[]> {
  return Promise.all(files.map(async (file) => {
    const content = await Deno.readTextFile(file);
    return await processContent(content);
  }));
}
```

## パッケージ管理とインポート

### バージョン指定
- パッケージのバージョン指定は `@^x.y.z` の形式を使用
  - `@`: JSRレジストリを示す
  - `^`: 互換性のある最新バージョンを使用
  - `x.y.z`: セマンティックバージョニングに従う

### パッケージレジストリ
- JSR（Deno公式パッケージレジストリ）を使用
- `deno.land` の後継として機能
- パッケージの管理と配布を一元化

### インポート設定
- `deno.json` でインポートマップを管理
- パスの一貫性を保持
- エイリアスによる簡潔なインポート
