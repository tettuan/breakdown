# ディレクトリ構造

Breakdown プロジェクトは、Deno.land/x での配布に適した標準的なディレクトリ構造を採用しています。

## 基本構造

```
/
├── deno.json             # プロジェクト設定と依存関係マッピング
├── mod.ts                # メインライブラリエントリーポイント
├── cli.ts                # CLI エントリーポイント
├── deps.ts               # 依存関係の一元管理
├── lib/                  # コアライブラリコード
│   ├── config/           # 設定関連
│   ├── core/             # コア機能
│   ├── cli/              # CLI 関連
│   ├── prompts/          # プロンプト管理
│   └── schemas/          # スキーマ管理
├── assets/               # 開発時に使用するリソース
│   ├── prompts/          # プロンプトテンプレート
│   └── schemas/          # スキーマ定義
├── tests/                # テスト
└── examples/             # 使用例
```

## リソースファイルの扱い

Breakdown では、プロンプトテンプレートやスキーマ定義などのリソースファイルを以下のように管理しています：

### 開発時

開発時には、`assets/` ディレクトリ内のリソースファイルを使用します：

- プロンプトテンプレート: `assets/prompts/`
- スキーマ定義: `assets/schemas/`

これにより、リソースファイルの編集が容易になります。

### 配布時

配布時には、リソースファイルを TypeScript ファイルに埋め込みます：

- プロンプトテンプレート: `lib/prompts/templates.ts`
- スキーマ定義: `lib/schemas/definitions.ts`

これにより、Deno.land/x での配布時にファイルシステムへのアクセスが不要になります。

### ビルドプロセス

リソースファイルを TypeScript ファイルに変換するには、以下のコマンドを実行します：

```bash
deno task build-resources
```

このコマンドは、`assets/` ディレクトリ内のリソースファイルを読み込み、対応する TypeScript ファイルを生成します。

## インポートパス

Breakdown では、`deno.json` の `imports` セクションを使用してエイリアスを定義しています：

```json
{
  "imports": {
    "$std/": "https://deno.land/std@0.210.0/",
    "$lib/": "./lib/"
  }
}
```

これにより、以下のようなインポートが可能になります：

```typescript
// 標準ライブラリのインポート
import { exists } from "$std/fs/mod.ts";

// ライブラリコードのインポート
import { Config } from "$lib/config/config.ts";
```

## テスト

テストファイルは `tests/` ディレクトリに配置され、`*_test.ts` の命名規則に従います。テストを実行するには、以下のコマンドを使用します：

```bash
deno test -A
``` 