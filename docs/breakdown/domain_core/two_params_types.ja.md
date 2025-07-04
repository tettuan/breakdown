# layerTypeとDirectiveType

## ドメイン駆動設計における型定義

### TwoParamsの構造

TwoParamsは、CLIのargsがBreakdownConfigとBreakdownParamsを経由して得られる2つの単一値（DirectiveTypeとLayerType）の組み合わせを表すドメイン型です。両者ともパターンマッチングによってバリデートされ、アプリケーションライフサイクル全体で一貫して使用される不変の値です。

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

/**
 * DirectiveType - 処理方向を表すドメイン型
 * 
 * ドメイン概念:
 * - BreakdownConfigのパターンで検証されたCLI args値（to, summary, defect, web, rag, db）
 * - ProfileNameによってパターンが決定される
 * - アプリケーションライフサイクル全体で不変
 * - プロンプトテンプレートとスキーマファイルのディレクトリ階層決定に使用
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
 * ドメイン概念:
 * - BreakdownConfigのパターンで検証されたCLI args値（project, issue, task）
 * - ProfileNameによってパターンが決定される
 * - アプリケーションライフサイクル全体で不変
 * - DirectiveTypeと組み合わせてプロンプトテンプレートとスキーマファイルのパス特定に使用
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
 * ドメイン概念:
 * - 設定の切り替えコンテキスト（breakdown, search, custom）
 * - 利用可能なDirectiveTypeとLayerTypeを決定
 * - 環境固有の設定を管理
 */
type ConfigProfileName = {
  readonly value: string;
  readonly isDefault: boolean;
  readonly prefix: string | null;
  
  // ドメイン操作
  getConfigPath(): string;
  getDirectiveTypes(): readonly DirectiveType[];
  getLayerTypes(): readonly LayerType[];
  
  // 型安全な比較
  equals(other: ConfigProfileName): boolean;
  toString(): string;
}
```

### Smart Constructors（スマートコンストラクタ）

```typescript
// =============================================================================
// Smart Constructors - 型安全な生成パターン
// =============================================================================

/**
 * Smart Constructors - 型安全な生成パターン
 */
namespace TwoParams {
  export function create(
    directive: string,
    layer: string,
    profile: ConfigProfileName
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
```

### エラー型定義

```typescript
/**
 * TwoParams検証エラー
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

### 使用例

```typescript
// バリデーション → パス解決の統合使用例
const profile = ConfigProfileName.create("breakdown");
if (profile.ok) {
  const config = BreakdownConfig.load(profile.data);
  const paramsResult = BreakdownParams.validate(["to", "issue"], config.CustomConfig.two.ParamsConfig);
  
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
```

## プロンプトテンプレートとスキーマファイルのパス解決

### DirectiveTypeとLayerTypeの役割

LayerTypeとDirectiveTypeは、プロンプトテンプレートやスキーマファイルの**パス解決において重要なドメイン用語**です。これらの値は、バリデーションを経た後に、ファイルシステム上の具体的なリソースへのパスを特定するために使用されます。

### パス解決の構造とドメイン操作

DirectiveTypeとLayerTypeは、**ファイルシステム上のリソース配置と密接に関連したドメイン概念**です。パス解決は以下の4つの変数の組み合わせで決定されます：

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

### パス解決フローとディレクトリ構造

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

## ドメイン関係性とバリデーション

### 統合フロー - パターンベースバリデーション + パス解決

```
ProfileName → BreakdownConfig → CustomConfig.two.ParamsConfig
     ↓              ↓                      ↓
CLI args → BreakdownParams (pattern validation) → TwoParamsResult
     ↓                                                    ↓
TwoParams → DirectiveType + LayerType (pattern-validated)
     ↓                            ↓
パス解決システム → ファイルシステム上の物理リソース
├── PromptPath: {base_dir}/{directive}/{layer}/f_{fromLayer}.md
├── SchemaPath: {base_dir}/{directive}/{layer}/base.schema.json
└── ConfigProfileName (設定コンテキスト)
```

### アプリケーションライフサイクル

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


