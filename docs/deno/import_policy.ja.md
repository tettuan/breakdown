# Import Policy

## 基本方針

1. import map の使用

- `deno.json` または `deno.jsonc` で import map を設定

```jsonc
{
  "imports": {
    // プロジェクト全体で使用する標準ライブラリのバージョンを固定
    "$std/": "jsr:@std/",
    // プロジェクト固有のエイリアス
    "$lib/": "./lib/",
    "$tests/": "./tests/"
  },
  "tasks": {
    "test": "deno test --allow-env --allow-write --allow-read"
  }
}
```

2. バージョン管理

- 全てのパッケージに明示的なバージョンを指定
- バージョン指定は `@^x.y.z` の形式を使用
- プロジェクト全体で同一バージョンを使用
- `deno.lock` ファイルをバージョン管理に含める

3. セキュリティ

- 必要最小限の権限で実行
- テスト実行時は `--allow-env --allow-write --allow-read` を指定
- CI/CD では明示的な権限指定を必須とする

## Import 記述規則

1. 標準ライブラリの import

```typescript
// OK: 正しい import
import { assertEquals } from "$std/assert/assert_equals.ts";
import { join } from "$std/path/join.ts";
import { exists } from "$std/fs/exists.ts";

// NG: 避けるべき import
import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { join } from "./deps.ts"; // 直接的な再エクスポートは避ける
```

2. モジュール構造

- ファイル拡張子を必ず含める（`.ts`, `.js`, `.tsx` など）
- 相対パスを使用する場合は `./` または `../` で始める

```typescript
// OK: 正しい import
import { MyComponent } from "./components/MyComponent.ts";
import type { Config } from "../types.ts";

// NG: 避けるべき import
import { MyComponent } from "components/MyComponent"; // 拡張子なし
import type { Config } from "types"; // 相対パスが不明確
```

3. deps.ts の使用

```typescript
// deps.ts
// バージョン管理を一元化する場合のみ使用
export { assertEquals, assertExists } from "$std/assert/mod.ts";

// OK: 正しい使用
import { assertEquals } from "./deps.ts";

// NG: 避けるべき使用
import { assertEquals } from "$std/assert/mod.ts"; // バージョン管理が分散
```

## 実装時の注意点

1. Web 標準 API の優先

- `fetch`, `Request`, `Response` など Web 標準 API を優先
- Deno 固有の API は `Deno` 名前空間から import

2. Node.js 互換性 非推奨。Deno標準でいく。

```typescript
// Node.js モジュールを使用する場合
import express from "npm:express@4";
// Node.js 組み込みモジュールを使用する場合
import * as path from "node:path";
```

## 依存関係の確認手順

1. パッケージの情報確認

```bash
# パッケージ情報の確認
deno info jsr:@std/assert

# キャッシュのクリアと依存関係の再解決
rm -f deno.lock
deno cache --reload mod.ts

# 特定のファイルの依存関係を確認
deno info your_file.ts
```

2. 権限の確認

```bash
# 必要な権限のみを指定して実行
deno test --allow-read=. --allow-write=./tmp --allow-env

# 権限プロンプトを使用して必要な権限を確認
deno test
```

## トラブルシューティング

1. import エラーの解決

- `deno.json` の import map を確認
- ファイル拡張子の有無を確認
- パッケージのバージョンを確認

2. 権限エラーの解決

- 必要な権限を明示的に指定
- 最小権限の原則に従う

3. 型エラーの解決

- 型定義ファイルの存在を確認
- Web 標準の型を優先使用

## レビュー時のチェックポイント

1. セキュリティ

- 必要最小限の権限指定
- 安全な import 形式の使用

2. 依存関係

- バージョンの一貫性
- `deno.lock` の更新確認

3. コード品質

- Web 標準 API の使用
- 明示的な型定義
- ファイル拡張子の指定
