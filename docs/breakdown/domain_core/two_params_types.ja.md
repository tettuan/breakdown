# layerTypeとDirectiveType

## ドメインストーリー - CLIからファイルシステムへの変換

### 具体例で理解する処理の流れ

ユーザーがコマンドラインで `breakdown to issue` を実行したとき、システムは以下の処理を行います：

1. **CLI引数の受信**: `["to", "issue"]`
2. **設定読み込み**: ProfileNameに基づくBreakdownConfig取得
3. **パターンマッチング**: 設定のパターンで引数をバリデーション
4. **ドメインオブジェクト生成**: 検証済みのTwoParams作成
5. **ファイルパス解決**: プロンプトテンプレートとスキーマファイルの特定
6. **実行**: `prompts/to/issue/f_issue.md` と `schemas/to/issue/base.schema.json` を使用

この一連の流れにおいて、**DirectiveType（"to"）とLayerType（"issue"）** は、単なる文字列から**型安全で信頼性の高いドメイン値**へと変換され、最終的に**ファイルシステム上の具体的なリソース**を特定する役割を担います。

### なぜ「2つのパラメータ」なのか

Breakdownにおいて、**処理方向（DirectiveType）** と **階層（LayerType）** の組み合わせは、AI開発支援の中核的な概念です：

- **DirectiveType**: 「何をするか」（to=変換, summary=要約, defect=欠陥検出）
- **LayerType**: 「どのレベルで」（project=プロジェクト全体, issue=課題単位, task=タスク単位）

この2つの軸が交差することで、具体的な処理内容が決定され、適切なプロンプトテンプレートとスキーマファイルが特定されます。

## 中核概念 - TwoParams

### ドメインオブジェクトとしてのTwoParams

TwoParamsは、CLIのargsがBreakdownConfigとBreakdownParamsを経由して得られる2つの単一値（DirectiveTypeとLayerType）の組み合わせを表すドメイン型です。両者ともパターンマッチングによってバリデートされ、アプリケーションライフサイクル全体で一貫して使用される不変の値です。

### 型定義 - ドメインの表現

```typescript
// =============================================================================
// TwoParams - 2パラメータ処理のドメイン型
// =============================================================================

/**
 * TwoParams - DirectiveTypeとLayerTypeの組み合わせを表すドメイン型
 * 
 * ドメイン概念:
 * - Breakdownコマンドの中核的な処理単位
 * - 処理方向（DirectiveType）と階層（LayerType）の組み合わせ
 * - プロンプト生成とスキーマ解決のコンテキスト
 * 
 * 設計理念:
 * - CLI引数からファイルシステムリソースへの橋渡し
 * - パターンバリデーションによる信頼性保証
 * - 型安全なパス解決の実現
 */
type TwoParams = {
  readonly directive: DirectiveType;
  readonly layer: LayerType;
  readonly profile: ConfigProfileName;
  
  // ドメイン操作
  toCommand(): BreakdownCommand;
  validate(): Result<void, TwoParamsValidationError>;
  
  // パス解決機能（プロンプト・スキーマファイル）
  getPromptPath(fromLayerType?: string, adaptation?: string): PromptPath;
  getSchemaPath(): SchemaPath;
  resolvePromptFilePath(baseDir: string, fromLayerType?: string, adaptation?: string): string;
  resolveSchemaFilePath(baseDir: string): string;
  
  // 型安全な比較
  equals(other: TwoParams): boolean;
  toString(): string;
}
```

### DirectiveTypeとLayerType - 構成要素の詳細

```typescript
/**
 * DirectiveType - 処理方向を表すドメイン型
 * 
 * 役割: 「何をするか」を決定
 * 例: "to"(変換), "summary"(要約), "defect"(欠陥検出)
 */
type DirectiveType = {
  readonly value: string;
  readonly profile: ConfigProfileName;
  readonly validatedByPattern: boolean;
  
  // ドメイン操作
  isValidForProfile(profile: ConfigProfileName): boolean;
  
  // パス解決専用ドメイン操作
  getPromptDirectory(baseDir: string, layer: LayerType): string;
  getSchemaDirectory(baseDir: string, layer: LayerType): string;
  isValidForResourcePath(): boolean;
  
  // 型安全な比較
  equals(other: DirectiveType): boolean;
  toString(): string;
}

/**
 * LayerType - 階層を表すドメイン型
 * 
 * 役割: 「どのレベルで」を決定
 * 例: "project"(プロジェクト), "issue"(課題), "task"(タスク)
 */
type LayerType = {
  readonly value: string;
  readonly validatedByPattern: boolean;
  
  // ドメイン操作
  isValidForDirective(directive: DirectiveType): boolean;
  
  // パス解決専用ドメイン操作
  getPromptFilename(fromLayerType: string, adaptation?: string): string;
  getSchemaFilename(): string;
  isValidForResourcePath(): boolean;
  
  // 型安全な比較
  equals(other: LayerType): boolean;
  toString(): string;
}

/**
 * ConfigProfileName - 設定プロファイル名を表すドメイン型
 * 
 * 役割: 設定の切り替えコンテキスト
 * 例: "breakdown"(標準), "search"(検索), "custom"(カスタム)
 * 
 * 重要: ConfigProfileNameは必須オプションではない
 * - CLIから未指定時は自動的に "default" が適用される
 * - 型システム上は常にConfigProfileNameとして扱われる
 * - デフォルト値の適用により、型安全性を保持
 */
type ConfigProfileName = {
  readonly value: string;
  readonly isDefault: boolean;
  readonly prefix: string | null;
  
  // ドメイン操作
  getConfigPath(): string;
  getDirectiveTypes(): readonly DirectiveType[];
  getLayerTypes(): readonly LayerType[];
  
  // デフォルト値関連の操作
  static createDefault(): ConfigProfileName;
  static fromCliOption(option: string | null | undefined): ConfigProfileName;
  
  // 型安全な比較
  equals(other: ConfigProfileName): boolean;
  toString(): string;
}
```

## 信頼性の確保 - パターンベースバリデーション

### バリデーション戦略

Breakdownでは、CLI引数をそのまま使用するのではなく、**パターンベースバリデーション**により信頼性を確保しています：

```
CLI args → ConfigProfileName.fromCliOption("default") → BreakdownConfig → CustomConfig.two.ParamsConfig
     ↓                           ↓                           ↓                      ↓
CLI args → BreakdownParams (pattern validation) → TwoParamsResult
     ↓                                                    ↓
TwoParams → DirectiveType + LayerType (pattern-validated)

注意: ProfileNameが未指定時は自動的に "default" が適用される
```

### なぜパターンバリデーションが必要なのか

1. **設定の柔軟性**: 環境やプロジェクトごとに異なる値を許可
2. **品質保証**: 不正な値によるエラーを事前に防止
3. **拡張性**: 新しいDirectiveTypeやLayerTypeを設定で追加可能
4. **一貫性**: ConfigProfileNameによる設定切り替えで環境別対応
5. **シンプルさ**: 未指定時のデフォルト値適用で利用しやすさを向上

### エラーハンドリング戦略

```typescript
/**
 * TwoParams検証エラー - パターンコンテキスト付きエラー情報
 */
type TwoParamsValidationError = 
  | { kind: "InvalidDirective"; directive: string; profile: ConfigProfileName; pattern: string; }
  | { kind: "InvalidLayer"; layer: string; pattern: string; }
  | { kind: "UnsupportedCombination"; directive: string; layer: string; profile: ConfigProfileName; }
  | { kind: "PatternNotFound"; profile: ConfigProfileName; configPath: string; }

/**
 * DirectiveType検証エラー
 */
type InvalidDirectiveError = {
  kind: "InvalidDirective";
  value: string;
  profile: ConfigProfileName;
  pattern: string;
  validDirectives: string[];
}

/**
 * LayerType検証エラー
 */
type InvalidLayerError = {
  kind: "InvalidLayer";
  value: string;
  pattern: string;
  validLayers: string[];
}
```

## 実用性の実現 - パス解決システム

### DirectiveTypeとLayerTypeの実際の活用

バリデーション済みのDirectiveTypeとLayerTypeは、**ファイルシステム上のリソース配置と密接に関連したドメイン概念**として機能します。これらの値は、プロンプトテンプレートやスキーマファイルの**パス解決において重要なドメイン用語**として使用されます。

### パス解決の仕組み

パス解決は以下の4つの変数の組み合わせで決定されます：

1. **設定値（base_dir）** - `app_prompt.base_dir` または `app_schema.base_dir`
2. **DirectiveType** - 処理方向（to, summary, defect など）
3. **LayerType** - 階層レベル（project, issue, task など）
4. **その他の修飾子** - fromLayerType, adaptation など

```typescript
// パス解決専用型定義
type PromptPath = {
  readonly baseDir: string;           // app_prompt.base_dir (cwd起点)
  readonly directive: DirectiveType;  // "to", "summary", "defect" など
  readonly layer: LayerType;          // "project", "issue", "task" など
  readonly fromLayer: string;         // fromLayerType
  readonly adaptation?: string;       // adaptation修飾子（オプション）
  resolve(): string;
  resolveWithAdaptation(adaptation: string): string;
}

type SchemaPath = {
  readonly baseDir: string;           // app_schema.base_dir (cwd起点)
  readonly directive: DirectiveType;  // "to", "summary", "defect" など
  readonly layer: LayerType;          // "project", "issue", "task" など
  readonly schemaFile: string;        // デフォルト: "base.schema.json"
  resolve(): string;
}
```

### ディレクトリ構造との対応

```
TwoParams (pattern-validated) → {base_dir}/{directive}/{layer}/filename

プロジェクトルート/
├── prompts/           # app_prompt.base_dir
│   ├── to/           # DirectiveType
│   │   ├── project/  # LayerType
│   │   ├── issue/    # LayerType
│   │   └── task/     # LayerType
│   ├── summary/      # DirectiveType
│   └── defect/       # DirectiveType
└── schemas/          # app_schema.base_dir
    ├── to/           # DirectiveType
    │   ├── project/  # LayerType
    │   ├── issue/    # LayerType
    │   └── task/     # LayerType
    ├── summary/      # DirectiveType
    └── defect/       # DirectiveType
```

## 実装ガイド

### Smart Constructors（型安全な生成）

```typescript
/**
 * Smart Constructors - 型安全な生成パターン（デフォルト値自動適用）
 */
namespace TwoParams {
  export function create(
    directive: string,
    layer: string,
    profile: ConfigProfileName
  ): Result<TwoParams, TwoParamsValidationError>;
  
  export function createWithCliOption(
    directive: string,
    layer: string,
    profileOption: string | null | undefined
  ): Result<TwoParams, TwoParamsValidationError>;
}

namespace DirectiveType {
  export function create(
    value: string,
    profile: ConfigProfileName
  ): Result<DirectiveType, InvalidDirectiveError>;
}

namespace LayerType {
  export function create(value: string): Result<LayerType, InvalidLayerError>;
}

namespace ConfigProfileName {
  export function create(value: string): ConfigProfileName;
  export function createDefault(): ConfigProfileName;
  export function fromCliOption(option: string | null | undefined): ConfigProfileName;
}
```

### 統合使用例 - CLI実行からファイル特定まで

```typescript
// バリデーション → パス解決の完全なフロー（デフォルト値自動適用）
const cliProfileOption: string | null | undefined = extractConfigFromCLI(); // null, "breakdown", "custom", etc.
const profile = ConfigProfileName.fromCliOption(cliProfileOption); // 自動的に "default" が適用
const config = BreakdownConfig.load(profile);

if (config.ok) {
  const paramsResult = BreakdownParams.validate(["to", "issue"], config.data.customConfig.two.ParamsConfig);
  
  if (paramsResult.type === "two") {
    const twoParams = TwoParams.fromResult(paramsResult);
    
    // プロンプトテンプレートパス解決
    const promptPath = twoParams.data.resolvePromptFilePath("prompts", "issue");
    // 結果: "prompts/to/issue/f_issue.md"
    
    const adaptedPrompt = twoParams.data.resolvePromptFilePath("prompts", "issue", "strict");
    // 結果: "prompts/to/issue/f_issue_strict.md"
    
    // スキーマファイルパス解決
    const schemaPath = twoParams.data.resolveSchemaFilePath("schemas");
    // 結果: "schemas/to/issue/base.schema.json"
  }
}

// より簡潔な使用例
const twoParamsResult = TwoParams.createWithCliOption("to", "issue", null); // nullは自動的にデフォルト値を適用
if (twoParamsResult.ok) {
  console.log(twoParamsResult.data.profile.value); // "default"
  console.log(twoParamsResult.data.profile.isDefault); // true
}
```

### エラーハンドリング例

```typescript
// パターンマッチング失敗時の対応
const result = BreakdownParams.validate(["invalid", "layer"], patterns);
if (!result.ok) {
  switch (result.error.kind) {
    case "InvalidDirective":
      console.error(`無効な処理方向: ${result.error.directive}`);
      console.error(`有効な値: ${result.error.validDirectives.join(", ")}`);
      break;
    case "InvalidLayer":
      console.error(`無効な階層: ${result.error.layer}`);
      console.error(`有効な値: ${result.error.validLayers.join(", ")}`);
      break;
    case "UnsupportedCombination":
      console.error(`サポートされていない組み合わせ: ${result.error.directive} + ${result.error.layer}`);
      break;
  }
}
```

## アプリケーションライフサイクルでの一貫性

```
TwoParams (値オブジェクト)
├── DirectiveType (パターン検証済み単一値) - "to", "summary", "defect" など
└── LayerType (パターン検証済み単一値) - "project", "issue", "task" など

特徴：
- BreakdownConfigのパターンで検証済み
- ProfileNameによって利用可能な値が決定
- アプリケーション全体で不変
- ファイルシステムリソースへの確実なアクセス
```

このドメイン型定義により、TwoParamsがDirectiveTypeとLayerTypeの2つを持つという関係性が型安全に表現され、BreakdownConfigのパターンによるバリデーションを経た信頼性の高いドメインオブジェクトとして機能します。さらに、これらの型はプロンプトテンプレートとスキーマファイルの物理的な配置を決定する重要な役割を担い、ファイルシステム上のリソースへの確実なアクセスを可能にします。ProfileNameによるパターン切り替えにより、柔軟な設定管理とリソース配置の両方が実現されています。


