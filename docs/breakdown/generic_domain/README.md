# 技術基盤ドメイン（Generic Domain）

> ドメイン全体（核心／支援／汎用）の位置付けと相互関係は [index.ja.md](../index.ja.md) を参照してください。本ファイルは技術基盤ドメイン固有の責務・設計原則・JSR パッケージ責務・利用パターンを扱います。

## 概要

技術基盤ドメインは、システム全体の技術的な基盤を提供する**汎用ドメイン**です。これらのドメインは、核心ドメインと支援ドメインの両方から利用され、システムの安定性と保守性を支える重要な役割を担います。

## 技術基盤ドメインの構成

### 1. ファクトリードメイン

**責務**: ドメインオブジェクトの構築と依存関係の管理

```
factory/
└── app_factory.ja.md        # PromptVariablesFactory
```

#### 主要な機能
- ドメインオブジェクトの型安全な生成
- 依存関係の注入と管理
- パラメータ構築のルール統一
- バリデーションと変換処理の一元化

#### 設計パターン
- **ファクトリーパターン**: 複雑なオブジェクト生成の隠蔽
- **ビルダーパターン**: 段階的なオブジェクト構築
- **依存性注入**: モジュール間の結合度の低減

### 2. システムドメイン

**責務**: システム全体の基盤機能とメタ情報の管理

```
system/
├── overview/                # システム概要
│   ├── glossary.ja.md       # 用語集
│   └── processing-flow.ja.md # 処理フロー
└── ...
```

#### 主要な機能
- システムアーキテクチャの定義
- 用語集とユビキタス言語の管理
- 処理フローの文書化
- エラーハンドリングの標準化

#### 設計思想
- **単一責任の原則**: 各モジュールは明確な責務を持つ
- **開放閉鎖の原則**: 拡張に対して開放、変更に対して閉鎖
- **依存性逆転の原則**: 抽象に依存し、具象に依存しない

## 技術基盤ドメインの設計原則

### 1. 汎用性の追求

技術基盤ドメインは、特定の業務ドメインに依存しない汎用的な機能を提供します：

- **再利用可能性**: 複数のドメインから利用可能
- **拡張性**: 新しい要件への対応が容易
- **保守性**: 変更の影響範囲が明確

### 2. 技術的専門性

各技術基盤ドメインは、特定の技術領域に特化します：

- **ファクトリー**: オブジェクト生成とライフサイクル管理
- **システム**: アーキテクチャと基盤機能
- **エラーハンドリング**: 例外処理とエラー管理

### 3. 抽象化の適切なレベル

技術基盤ドメインは、適切な抽象化レベルを維持します：

- **高すぎる抽象化**: 使いにくく、理解困難
- **低すぎる抽象化**: 再利用性が低い
- **適切な抽象化**: 使いやすく、拡張可能

## ファクトリードメインの詳細

### PromptVariablesFactory

**責務**: プロンプト変数の構築と管理

```typescript
// ファクトリーの責務
class PromptVariablesFactory {
  // 1. パラメータ構築
  create(source: PromptVariableSource, config: BreakdownConfig): PromptVariables;
  
  // 2. バリデーション
  validate(variables: PromptVariables): Result<void, ValidationError>;
  
  // 3. 変換処理
  transform(variables: PromptVariables): PromptParams;
}
```

#### 設計上の利点
- **一元化**: 全てのパラメータ構築を一箇所で管理
- **一貫性**: 同じルールによる構築の保証
- **テスト容易性**: 単体テストの実装が容易
- **拡張性**: 新しい変数型の追加が容易

### 依存関係の管理

```typescript
// 依存関係の明確化
interface FactoryDependencies {
  config: BreakdownConfig;          // 設定管理ドメイン
  pathResolver: PathResolver;       // プロンプトパス決定ドメイン
  fileSystem: FileSystemService;    // ファイルシステム操作
}
```

## システムドメインの詳細

### 用語集の管理

**責務**: ドメイン固有の用語とユビキタス言語の定義

- **一貫性**: 全ドメインで統一された用語使用
- **明確性**: 曖昧さのない定義
- **進化性**: 新しい概念の追加と既存用語の更新

### 処理フローの文書化

**責務**: システム全体の処理フローの標準化

- **可視性**: 処理の流れが明確
- **トレーサビリティ**: 問題の発生箇所が特定可能
- **改善指標**: パフォーマンスの測定点

## 技術基盤ドメインの利用パターン

### 1. オブジェクト生成時

```typescript
// ファクトリーの利用
const factory = new PromptVariablesFactory(dependencies);
const variables = factory.create(source, config);
```

### 2. エラーハンドリング時

```typescript
// 標準化されたエラー処理
try {
  const result = await processCommand();
} catch (error) {
  handleError(error, context);
}
```

### 3. 設定管理時

```typescript
// 設定の統一的な管理
const config = ConfigManager.load(profile);
const settings = config.getSettings();
```

## 技術基盤ドメインの拡張

### 新しい技術基盤の追加

技術基盤ドメインは、以下の条件を満たす場合に追加できます：

1. **汎用性**: 複数のドメインから利用される
2. **技術的専門性**: 特定の技術領域に特化している
3. **独立性**: 他の技術基盤から独立して機能する

### 既存技術基盤の拡張

各技術基盤は、以下の方針で拡張できます：

- **後方互換性**: 既存のインターフェースとの互換性を保つ
- **段階的移行**: 新機能の段階的な導入
- **設定駆動**: 設定による新機能の有効化

## 品質保証

### 1. 単体テスト

```typescript
// ファクトリーの単体テスト
describe('PromptVariablesFactory', () => {
  it('should create valid variables', () => {
    const factory = new PromptVariablesFactory(mockDependencies);
    const variables = factory.create(mockSource, mockConfig);
    expect(variables).toBeDefined();
  });
});
```

### 2. 統合テスト

```typescript
// システム全体の統合テスト
describe('System Integration', () => {
  it('should process command end-to-end', async () => {
    const result = await processCommand(['to', 'task']);
    expect(result.success).toBe(true);
  });
});
```

### 3. パフォーマンステスト

```typescript
// パフォーマンスの測定
describe('Performance', () => {
  it('should complete within time limit', async () => {
    const startTime = Date.now();
    await processCommand(['to', 'task']);
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
```

## JSR パッケージ責務

技術基盤ドメインは、**ドメインの境界を明確にする設計意図** により、4 つの専用 JSR パッケージへ機能分離しています。本セクションを正本とし、index.ja.md・domain_boundaries_flow.ja.md・two_params_types.ja.md・app_factory.ja.md からは本セクションを参照してください。

### 1. [@tettuan/breakdownconfig](https://jsr.io/@tettuan/breakdownconfig) - 設定管理

**責務**: アプリケーション設定とユーザー設定の統一管理。

- `*-app.yml`（アプリケーション設定）と `*-user.yml`（ユーザー設定）の階層的読み込み
- プロファイルプレフィクス（例: `breakdown-`, `search-`）による用途別設定切り替え
- `working_dir`（SINGLE SOURCE OF TRUTH）と各種 `base_dir` の解決基盤

**他ドメインとの境界**: 設定値は `BreakdownConfig` として核心ドメインへ受け渡され、CLI 引数（`BreakdownParams` 結果）と組み合わせて Factory が利用します。設定パターンは [@tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) へ `ParamsCustomConfig` として委譲されます。

詳細フロー: [domain_boundaries_flow.ja.md](../domain_core/domain_boundaries_flow.ja.md)

### 2. [@tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) - パラメータ解析

**責務**: コマンドライン引数の型安全な解析・バリデーション。

- 設定ベースの `directivePatterns` / `layerPatterns` による検証
- `ZeroParamsResult` / `OneParamResult` / `TwoParamsResult` の生成（旧 NoParams/Single/Double）
- `ParamsCustomConfig` を介した BreakdownConfig との統合

**他ドメインとの境界**: 検証済み `TwoParamsResult` は `lib/application/breakdown_params_integration.ts` 経由で核心ドメインの `TwoParams`（DirectiveType / LayerType）へ変換されます。BreakdownParams 検証済みのため、追加の `directivePatterns` / `layerPatterns` 検証は不要です。

具体的な API 利用方法: [JSR @tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) のドキュメントを参照
詳細統合: [two_params_types.ja.md](../domain_core/two_params_types.ja.md)

### 3. [@tettuan/breakdownprompt](https://jsr.io/@tettuan/breakdownprompt) - プロンプト生成

**責務**: 特定されたプロンプトファイルに対する変数置換・スキーマ参照・プロンプト生成。

- プロンプトテンプレートファイルの読み込み
- `PromptParams`（外部 API 仕様適合の最終形態）を入力に変数置換実行
- 全変数が文字列の辞書に平坦化された状態で受領

**他ドメインとの境界**: プロンプトファイルパスの特定（`PromptTemplatePathResolver`）と変数構築（`PromptVariablesFactory`）は核心ドメインの責務であり、BreakdownPrompt は「何を使うか」の判断は行いません。`PromptParams` は契約インターフェースとして機能します。

詳細仕様: [prompt_variables.ja.md](../domain_core/prompt_variables.ja.md), [JSR PromptParams](https://jsr.io/@tettuan/breakdownprompt/doc/~/PromptParams)

### 4. [@tettuan/breakdownlogger](https://jsr.io/@tettuan/breakdownlogger) - ログ出力（テスト専用）

**責務**: 診断・デバッグ情報の出力。

- `LOG_LEVEL`（debug / info / warn / error）による出力制御
- `LOG_KEY` によるモジュール別フィルタリング
- `LOG_LENGTH` による出力長制御

**他ドメインとの境界**: **テストコードでのみ使用** が原則です。実装コード（`lib/` 配下のプロダクションコード）での使用は禁止されています。テスト実行時の動作観測専用ツールとして位置付けられています。

詳細: [docs/tests/testing.ja.md](../../tests/testing.ja.md)

### JSR パッケージとドメイン境界

| パッケージ | 対応ドメイン | 寿命 | 検証責務 |
|-----------|------------|------|---------|
| breakdownconfig | 設定管理（核心） | ConfigProfile 短寿命 → BreakdownConfig 分離後終了 | 設定スキーマ |
| breakdownparams | パラメータ解析（核心） | 1 リクエスト | DirectiveType / LayerType パターン |
| breakdownprompt | プロンプト生成（核心） | 1 リクエスト | PromptParams 契約 |
| breakdownlogger | ログ出力（汎用） | 全寿命（テスト時） | なし |

## 関連ドキュメント

### 核心ドメインとの関係
- **[ドメイン境界と協働](../domain_core/domain_boundaries_flow.ja.md)** - ドメイン間の協働関係
- **[プロンプト変数生成](../domain_core/prompt_variables.ja.md)** - ファクトリーとの関係

### 支援ドメインとの関係
- **[支援ドメイン](../supporting_domain/README.md)** - 支援ドメインとの協働

### 利用者インターフェース
- **[CLIコマンド](../interface/cli_commands.ja.md)** - コマンドラインインターフェース
- **[設定管理](../interface/configuration.ja.md)** - 設定インターフェース

---

**設計方針**: システム全体の技術的基盤の提供  
**更新日**: 2025年1月
