# テスト仕様 - ドメイン駆動設計移行版

> **重要**: このテスト仕様は**ドメイン駆動設計（DDD）**への移行中です。新しいテスト戦略については [../../tests/domain_driven/README.md](../../tests/domain_driven/README.md) を参照してください。

## 現在の状況

### 新しいテスト戦略（推奨）

**ドメイン駆動設計**に基づく新しいテスト戦略を採用しています：

- **完全なテスト戦略**: [../../tests/domain_driven/README.md](../../tests/domain_driven/README.md)
- **テスト配置**: `tests/domain_driven/` 配下
- **設計原則**: 核心ドメインの価値創出を中心とした検証

### 新しいテスト設計原則

1. **ドメイン中心の価値検証**
   - 各ドメインの存在価値を正確に検証
   - 核心ドメイン（プロンプト生成）の価値創出を最優先
   - 支援ドメイン（環境構築）による核心ドメイン支援の検証

2. **境界コンテキストの尊重**
   - ドメイン間の境界を明確に保持
   - 各ドメインの独立性を検証
   - 責務分離の原則に基づく検証

3. **階層的な価値検証**
   - ドメインユニットテスト：単一ドメイン内の純粋な機能
   - ドメイン統合テスト：ドメイン内のサービス連携
   - インターフェース統合テスト：ユーザーインターフェースの品質
   - クロスドメイン統合テスト：システム全体の価値創出

## 新しいテストディレクトリ構造

```
tests/domain_driven/
├── core_domain/              # 核心ドメインテスト
│   ├── prompt_path_resolution/    # プロンプトパス決定ドメイン
│   ├── prompt_variable_generation/ # プロンプト変数生成ドメイン
│   ├── parameter_parsing/         # パラメータ解析ドメイン
│   └── configuration_management/  # 設定管理ドメイン
├── supporting_domain/        # 支援ドメインテスト
│   ├── template_management/       # テンプレート管理
│   ├── workspace_management/      # ワークスペース管理
│   └── initialization/           # 初期化サービス
├── generic_domain/           # 技術基盤ドメインテスト
│   ├── factory/                  # ファクトリードメイン
│   └── system/                   # システムドメイン
├── interface_layer/          # インターフェース層テスト
│   ├── cli/                      # CLIインターフェース
│   ├── configuration/            # 設定インターフェース
│   └── path_resolution/          # パス解決インターフェース
└── cross_domain/             # ドメイン間統合テスト
    ├── e2e/                      # エンドツーエンドシナリオ
    └── collaboration/            # ドメイン間協働
```

## テスト実行方法

### 新しいドメイン駆動テスト（推奨）

```bash
# 全ドメインテスト実行
deno test tests/domain_driven/

# ドメイン別実行
deno test tests/domain_driven/core_domain/          # 核心ドメイン
deno test tests/domain_driven/supporting_domain/   # 支援ドメイン
deno test tests/domain_driven/generic_domain/      # 技術基盤
deno test tests/domain_driven/interface_layer/     # インターフェース層
deno test tests/domain_driven/cross_domain/        # 統合テスト

# デバッグ出力付き実行
LOG_LEVEL=debug deno test tests/domain_driven/core_domain/
```

### 既存テスト（移行作業中）

```bash
# 従来のテスト実行（移行完了までは並行実行）
bash scripts/local_ci.sh

# 特定階層のテスト実行
deno test tests/0_foundation/
deno test tests/1_core/
deno test tests/2_integration/
deno test tests/3_scenarios/
deno test tests/4_e2e/
```

## 価値創出の検証原則

### 核心ドメインテスト

**プロンプト生成の核心価値を検証**：

1. **プロンプトパス決定ドメイン**
   - パス決定の100%確実性
   - 準備コストの非対称性への対応
   - 明確なエラーメッセージによる問題切り分け

2. **プロンプト変数生成ドメイン**
   - 入力データの3段階変容の正確性
   - 型安全な変換処理
   - 変数置換の完全性

3. **パラメータ解析ドメイン**
   - CLI引数から型安全なドメインオブジェクトへの変換
   - パターンベースバリデーション
   - Smart Constructorsによる型安全性

4. **設定管理ドメイン**
   - 環境固有設定の統一的管理
   - プロファイル切り替えの正確性
   - 設定階層の適切なマージ

### 支援ドメインテスト

**環境構築による核心ドメイン支援を検証**：

1. **テンプレート管理ドメイン**
   - プロンプトテンプレートとスキーマファイルの適切な配置
   - ファイル命名規則の遵守
   - バリデーション設定の正確性

2. **ワークスペース管理ドメイン**
   - プロジェクト環境の設定と管理
   - ディレクトリ構造の整合性
   - 環境固有設定の適用

3. **初期化ドメイン**
   - プロジェクトの初期セットアップ
   - 必要なディレクトリとファイルの生成
   - 設定ファイルの適切な生成

### 技術基盤ドメインテスト

**システム基盤の安定性を検証**：

1. **ファクトリードメイン**
   - ドメインオブジェクトの適切な構築
   - 依存関係の正確な注入
   - パラメータ構築の一元化

2. **システムドメイン**
   - エラーハンドリングの一貫性
   - ログ出力の標準化
   - ファイルシステム操作の安全性

### インターフェース層テスト

**ユーザー体験の品質を検証**：

1. **CLIインターフェース**
   - コマンドライン引数の正確な解析
   - エラーメッセージの明確性
   - ヘルプメッセージの適切性

2. **設定インターフェース**
   - 設定ファイルの読み込み正確性
   - 設定値のバリデーション
   - 設定エラーの適切な報告

3. **パス解決インターフェース**
   - ファイルパス解決の確実性
   - 相対パス・絶対パスの適切な処理
   - パス関連エラーの明確な報告

## テストヘルパーとユーティリティ

### 共通テストヘルパー

新旧両方のテスト構造で共有されます：

- **setup.ts** - テスト環境の初期化、一時ディレクトリの作成
- **assertions.ts** - プロンプト検証、ファイル内容検証、エラー状態検証
- **test_utils.ts** - テストユーティリティ

### デバッグ出力（重要）

BreakdownLoggerは**テストコードでのみ使用**してください：

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("domain-test");
logger.debug("ドメインテスト実行開始", { 
  domain: "core_domain",
  testCase: "prompt_path_resolution" 
});
```

### ログレベルとフィルタリング

- `LOG_LEVEL`: debug, info, warn, error
- `LOG_KEY`: 特定モジュールのフィルタリング
- `LOG_LENGTH`: メッセージ長制御

詳細は [debug.ja.md](./debug.ja.md) を参照してください。

## 移行戦略と併用期間

### 現在の移行状況

- **新しいテスト戦略**: 確立完了（`tests/domain_driven/README.md`）
- **既存テスト**: 移行作業中（`tests/0_foundation/`, `tests/1_core/`等）
- **CI/CD**: 新旧両方のテストを並行実行

### 移行作業の進め方

1. **新規テスト作成**: 必ず`tests/domain_driven/`配下に作成
2. **既存テスト修正**: 可能な限り新構造への移行を検討
3. **テスト実行**: 移行完了まで両方のテスト構造を並行実行
4. **コードレビュー**: ドメイン駆動設計の観点から検証

### 段階的移行計画

1. **Phase 1**: 新しいテスト戦略の確立（完了）
2. **Phase 2**: 核心ドメインテストの移行（進行中）
3. **Phase 3**: 支援・技術基盤ドメインテストの移行（予定）
4. **Phase 4**: 統合テストの移行（予定）

## 参考情報

### 詳細なテスト戦略

- **[ドメイン駆動テスト戦略](../../tests/domain_driven/README.md)** - 完全なテスト戦略
- **[テスト実行方法](../../tests/README.md)** - 実行方法と移行状況

### デバッグとログ

- **[デバッグ機能](./debug.ja.md)** - BreakdownLoggerの詳細な使用方法
- **[ログ仕様](./logging.ja.md)** - ログレベルとフィルタリング

---

**重要**: このファイルは従来のテスト仕様の参考資料です。新しいテスト作成時は必ず[ドメイン駆動テスト戦略](../../tests/domain_driven/README.md)に従ってください。

---

## 従来のテスト仕様（参考情報）

以下は既存テストファイルの理解と移行作業のための参考情報です：

### 従来の階層的テスト構造

- **0_foundation/**: 基盤テスト → **generic_domain/** & **interface_layer/**
- **1_core/**: コア機能テスト → **core_domain/** & **supporting_domain/**
- **2_integration/**: 統合テスト → **cross_domain/collaboration/**
- **3_scenarios/**: シナリオテスト → **cross_domain/e2e/**
- **4_e2e/**: E2Eテスト → **cross_domain/e2e/**

### 従来のテストファイル命名規則

- `0_architecture_<実装ファイル名>.ts`: アーキテクチャテスト
- `1_structure_<実装ファイル名>.ts`: 構造テスト
- `2_unit_<実装ファイル名>.ts`: 単体テスト
- `3_integration_<機能名>.ts`: 結合テスト
- `4_e2e_<機能名>.ts`: E2Eテスト

### 移行完了までの併用期間

現在、新旧両方のテスト構造が併用されています。新規テスト作成時は必ず新しいドメイン駆動構造を使用してください。

---

**移行状況**: ドメイン駆動テスト戦略への移行中  
**推奨**: 新規テストは`tests/domain_driven/`配下に作成  
**詳細**: [ドメイン駆動テスト戦略](../../tests/domain_driven/README.md)を参照

### テストコードでの使用

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger();
logger.debug("テスト実行開始", { testName: "example" });
```

### ログレベル

- `debug`: 詳細なデバッグ情報
- `info`: 重要な処理の開始/終了
- `warn`: 警告（回復可能なエラー）
- `error`: エラー（処理中断）

### テスト実行時のログ制御

BreakdownLoggerは、テスト実行時に特に有用な環境変数による詳細なログ制御機能を提供します：

#### LOG_KEY による特定ログの抽出

特定のキーワードを含むログメッセージのみを出力することで、テスト時のノイズを削減できます：

```bash
# 特定の機能に関連するログのみ表示
LOG_KEY="parser" deno test --allow-env --allow-write --allow-read

# 複数のキーワードでフィルタリング（カンマ区切り）
LOG_KEY="parser,validation" deno test --allow-env --allow-write --allow-read

# エラー関連のログのみ表示
LOG_KEY="error,fail" deno test --allow-env --allow-write --allow-read
```

#### LOG_LENGTH による出力制御

ログメッセージの長さを制限することで、大量データのテスト時でも読みやすい出力を得られます：

```bash
# ログメッセージを100文字に制限
LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# 長いメッセージ（200文字）で詳細表示
LOG_LENGTH=L deno test --allow-env --allow-write --allow-read

# 制限なしで完全な詳細表示
LOG_LENGTH=W deno test --allow-env --allow-write --allow-read

# デフォルト（30文字）短縮表示
deno test --allow-env --allow-write --allow-read
```

#### 組み合わせた高度なログ制御

テスト状況に応じて、両方の機能を組み合わせて使用できます：

```bash
# パーサー関連の短いログのみ表示
LOG_KEY="parser" LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# エラー系の詳細ログを表示
LOG_KEY="error" LOG_LENGTH=W LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### テスト段階別のログ設定推奨例

1. **開発初期・デバッグ時**
   ```bash
   LOG_LEVEL=debug LOG_LENGTH=W deno test
   ```

2. **特定機能のテスト時**
   ```bash
   LOG_KEY="target_function" LOG_LEVEL=debug deno test
   ```

3. **CI実行時・本番確認**
   ```bash
   LOG_LEVEL=info LOG_LENGTH=S deno test
   ```

4. **エラー調査時**
   ```bash
   LOG_KEY="error,fail,exception" LOG_LEVEL=debug LOG_LENGTH=W deno test
   ```

### テストコード内でのログ活用

```typescript
// テスト対象を明確にするためのログ
const logger = new BreakdownLogger("test-parser");
logger.debug("テスト開始: パラメータバリデーション", { 
  testCase: "invalid_input",
  input: inputData 
});

// テスト中の状態確認用ログ
const processLogger = new BreakdownLogger("preprocessing");
processLogger.info("中間処理完了", { 
  step: "preprocessing",
  result: processedData 
});

// エラー再現時の詳細ログ
const errorLogger = new BreakdownLogger("validation-error");
errorLogger.error("期待されるエラーが発生", { 
  expected: true,
  errorType: "ValidationError",
  details: errorDetails 
});
```

## エラー処理とデバッグ

### エラー発生時の調査手順

1. デバッグログの確認
2. テスト環境の状態確認
3. 関連するテストケースの実行
4. エラー再現手順の文書化

### テスト失敗時の対応

1. エラーメッセージの確認
2. デバッグモードでの再実行
3. 関連する実装の確認
4. テスト失敗の前処理判定
5. 修正と再テスト

### テスト失敗の前処理判定

- テストの目的ではない前処理で失敗した場合、別の処理前のテストが必要。
- 前処理のテストは local_ci.sh で先に実行済みとなるように、実行順を前段階で配置する。
- 前処理の例：
  - 設定判定のテストだが設定ファイルの読み込みに失敗する
    - 設定ファイルの読み込みテストを作る
- 前処理ではない例:
  - 設定判定のテストで設定値が一致しないため失敗する
- テストの前処理は、該当テストより前に実施された確認済みプロセスを利用すること。後工程のテストが独自実装しないことが重要。

# スケルトンコードの構築順序(テスト駆動)

- 「テストディレクトリ構造」に従い、テストファイルを作成する
- スケルトンの作成：テスト項目を、先にテスト対象として記述する（まだテストの内容は書かない）
- スケルトンには、テストが失敗する記述を入れておく
- コメントを記載する
  - あなたが他人のコードを読んだときに「知りたい」と思うことを記載する
  - テストの意図や目的、テストした方が良いと考えた理由を記述する
  - テストが扱う対象を明記する
