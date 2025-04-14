# Deno.land/x 対応のためのディレクトリ構造設計

## Deno ベストプラクティスとディレクトリ構造

Deno のベストプラクティスと公式ドキュメントを確認した結果、以下の点が重要です：

### Deno のベストプラクティス

1. **明示的なインポート**
   - ファイル拡張子を含める（`.ts`, `.js`, `.json` など）
   - 相対パスまたはフルURL形式を使用

2. **インポートマップの活用**
   - `deno.json` で `imports` セクションを使用してエイリアスを定義
   - 例: `"$std/": "https://deno.land/std@0.210.0/"`

3. **シンプルなプロジェクト構造**
   - エントリーポイントとなる `mod.ts` を使用
   - CLI ツールの場合は `cli.ts` または `main.ts` も使用

4. **依存関係の管理**
   - `deps.ts` ファイルで依存関係を一元管理
   - バージョン固定のためのリエクスポート

## Breakdown 仕様書の分析

Breakdown の仕様書を詳細に分析した結果、以下の重要な点が明らかになりました：

### 主要コンポーネント

1. **CLI インターフェース**
   - コマンド: `to`, `summary`, `defect`, `init`
   - レイヤー: `project`, `issue`, `task`
   - オプション: `-f/--from`, `-o/--output`

2. **設定システム**
   - アプリケーション設定
   - ワークスペース構造
   - プロンプト設定

3. **プロンプト管理**
   - レイヤーごとのプロンプトテンプレート
   - 変数置換機能

4. **スキーマ定義**
   - `rules/` 配下にスキーマファイルが配置
   - コマンドとレイヤーに応じた階層構造

### rules/ ディレクトリの役割

`rules/` ディレクトリは、プロンプトが使用するスキーマの置き場所として機能しています。スキーマは以下の階層構造になっています：

```
rules/
└── schema/
    ├── to/
    │   ├── project/
    │   ├── issue/
    │   └── task/
    ├── summary/
    │   ├── project/
    │   ├── issue/
    │   └── task/
    └── defect/
        ├── project/
        ├── issue/
        └── task/
```

各ディレクトリには、対応するコマンドとレイヤーのスキーマファイル（例: `base.schema.json`）が含まれています。

## Deno.land/x での配布とリソースファイルの扱い

Deno.land/x へ登録する際のリソースファイル（プロンプトやスキーマ）の扱いについて検討します。

### リソースファイルの読み込み方法

Deno では、TypeScript/JavaScript ファイルはコンパイルされますが、JSON や Markdown などのリソースファイルは通常、実行時にファイルシステムから読み込まれます。

#### 現在の実装

現在の実装を見ると、プロンプトやスキーマは以下のように読み込まれています：

```typescript
// プロンプトの読み込み
const promptPath = join(getConfig().workingDirectory, "prompts", demonstrativeType, layerType, "f_project.md");
const content = await Deno.readTextFile(promptPath);
```

これは実行時にファイルシステムからファイルを読み込む方式です。

### Deno.land/x での配布時の考慮点

Deno.land/x で配布する場合、以下の点を考慮する必要があります：

1. **リモートモジュールの制約**
   - Deno.land/x のモジュールは、リモートから読み込まれる
   - リモートモジュールは、デフォルトでファイルシステムにアクセスできない

2. **リソースファイルの扱い**
   - TypeScript/JavaScript ファイルはコンパイルされる
   - JSON、Markdown などのリソースファイルは、そのまま配布される

3. **ファイルの読み込み方法**
   - `Deno.readTextFile()` は、ローカルファイルシステムへのアクセス権が必要
   - リモートモジュールでは、相対パスでのファイル読み込みに制約がある

### 解決策

Deno.land/x で配布する場合、以下の解決策が考えられます：

#### 1. 埋め込みリソース方式

プロンプトやスキーマを TypeScript ファイルに埋め込む方法：

```typescript
// lib/prompts/templates.ts
export const PROMPTS = {
  to: {
    project: `## Input
{input_markdown}

## Source
{input_markdown_file}

## Schema
{schema_file}

## Output
{destination_path}`,
    // 他のプロンプト...
  },
  // 他のコマンド...
};
```

この方法では、プロンプトやスキーマがコードの一部として配布されるため、ファイルシステムへのアクセスが不要になります。

#### 2. 相対インポート方式

Deno の `import` 文を使用してリソースファイルを読み込む方法：

```typescript
// プロンプトを直接インポート
import projectPrompt from "./templates/to/project.md" assert { type: "text" };

// または動的インポート
async function loadPrompt(type, layer) {
  const module = await import(`./templates/${type}/${layer}.md`, { assert: { type: "text" } });
  return module.default;
}
```

この方法では、リソースファイルが TypeScript モジュールとして扱われ、コンパイル時に含まれます。

#### 3. ハイブリッド方式

開発時はファイルシステムから読み込み、配布時は埋め込みリソースを使用する方法：

```typescript
// 開発モードでは実際のファイルを読み込み、配布モードでは埋め込みリソースを使用
async function loadPrompt(type, layer) {
  if (Deno.env.get("DENO_DEPLOYMENT") === "production") {
    return EMBEDDED_PROMPTS[type][layer];
  } else {
    const promptPath = join(getConfig().workingDirectory, "prompts", type, layer, "f_project.md");
    return await Deno.readTextFile(promptPath);
  }
}
```

## 推奨ディレクトリ構造

上記の考慮点を踏まえ、以下のディレクトリ構造を推奨します：

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
│   │   ├── loader.ts     # プロンプトローダー
│   │   ├── templates.ts  # 埋め込みプロンプト（配布用）
│   │   └── templates/    # プロンプトテンプレート（開発用）
│   └── schemas/          # スキーマ管理
│       ├── loader.ts     # スキーマローダー
│       ├── definitions.ts # 埋め込みスキーマ（配布用）
│       └── definitions/  # スキーマ定義（開発用）
├── assets/               # 開発時に使用するリソース
│   ├── prompts/          # プロンプトテンプレート
│   └── schemas/          # スキーマ定義
├── tests/                # テスト
└── examples/             # 使用例
```

この構造では：

1. **開発時**
   - `assets/` ディレクトリのリソースファイルを使用
   - ファイルシステムからの読み込みで柔軟に編集可能

2. **配布時**
   - `lib/prompts/templates.ts` と `lib/schemas/definitions.ts` に埋め込まれたリソースを使用
   - ファイルシステムへのアクセスが不要

3. **ビルド時**
   - ビルドスクリプトで `assets/` のリソースを TypeScript ファイルに変換
   - 例: `deno task build-resources` で自動生成

この方法により、開発の柔軟性を維持しつつ、Deno.land/x での配布時の制約に対応できます。

## 移行計画

現在の構造から推奨構造への移行は、以下の手順で行います：

1. **新しいディレクトリ構造の作成**
   - `lib/` ディレクトリとサブディレクトリの作成
   - `assets/` ディレクトリの作成

2. **コードの移動**
   - `breakdown/` → `lib/`
   - `cli/` → `lib/cli/`
   - `rules/` → `assets/schemas/`

3. **リソースファイルの埋め込み**
   - プロンプトとスキーマを TypeScript ファイルに変換
   - ビルドスクリプトの作成

4. **インポートパスの更新**
   - 相対パスを `$lib/` エイリアスに変更
   - リソースの読み込み方法を更新

5. **テストの更新**
   - インポートパスの更新
   - リソースの読み込み方法の更新

6. **ドキュメントの更新**
   - 新しいディレクトリ構造の説明
   - 開発方法とビルド方法の説明

## 結論

Deno.land/x に対応したディレクトリ構造を設計することで、Breakdown プロジェクトは以下の利点を得ることができます：

1. **標準的な Deno プロジェクト構造への準拠**
   - Deno コミュニティの期待に応える
   - 新規開発者の学習コストを低減

2. **リソースファイルの効率的な管理**
   - 開発時の柔軟性を維持
   - 配布時の制約に対応

3. **インポートパスの最適化**
   - エイリアスによる相対パスの減少
   - コードの可読性と保守性の向上

4. **テストの整理**
   - テストファイルの命名規則の統一
   - テストリソースの効率的な管理

この設計により、Breakdown プロジェクトは Deno.land/x での配布に適した構造となり、ユーザーと開発者の両方にとって使いやすいプロジェクトになります。 