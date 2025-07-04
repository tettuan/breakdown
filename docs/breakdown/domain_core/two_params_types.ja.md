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
  getPromptPath(): PromptPath;
  getSchemaPath(): SchemaPath;
  
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
 * - プロンプトテンプレートの選択に使用
 */
type DirectiveType = {
  readonly value: string;
  readonly profile: ConfigProfileName;
  readonly validatedByPattern: boolean;
  
  // ドメイン操作
  isValidForProfile(profile: ConfigProfileName): boolean;
  
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
 * - DirectiveTypeと組み合わせて処理を特定
 */
type LayerType = {
  readonly value: string;
  readonly validatedByPattern: boolean;
  
  // ドメイン操作
  isValidForDirective(directive: DirectiveType): boolean;
  
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
// パターンベースバリデーションの使用例
const profile = ConfigProfileName.create("breakdown");
if (profile.ok) {
  // 1. BreakdownConfigからパターン取得
  const config = BreakdownConfig.load(profile.data);
  const patterns = config.CustomConfig.two.ParamsConfig;
  
  // 2. CLI args + パターンでBreakdownParamsバリデーション
  const args = ["to", "issue"];
  const paramsResult = BreakdownParams.validate(args, patterns);
  
  // 3. TwoParamsResultからTwoParams作成
  if (paramsResult.type === "two") {
    const twoParams = TwoParams.fromResult(paramsResult);
    const command = twoParams.data.toCommand();
    const promptPath = twoParams.data.getPromptPath();
    const schemaPath = twoParams.data.getSchemaPath();
  }
}
```

## ドメイン関係性

### TwoParamsの構造 - ConfigパターンによるValidation

TwoParamsは、BreakdownConfigから得られるパターンを用いてBreakdownParamsがCLI argsをバリデートした結果です。

```
ProfileName → BreakdownConfig → CustomConfig.two.ParamsConfig.pattern
     ↓              ↓                        ↓
CLI args + pattern → BreakdownParams → TwoParamsResult
     ↓                      ↓                ↓
[directive, layer] + validation → {directive: DirectiveType, layer: LayerType}
```

### パターンベースバリデーション

```
BreakdownConfig (ProfileNameで切り替え)
├── CustomConfig.two.ParamsConfig
│   ├── DirectivePattern (正規表現パターン)
│   └── LayerPattern (正規表現パターン)
└── ProfileName → 異なるパターンセット

バリデーション処理：
1. ProfileName → BreakdownConfig読み込み
2. CustomConfig.two.ParamsConfig.pattern取得
3. CLI args値 + pattern → BreakdownParams
4. BreakdownParams → パターンマッチング実行
5. バリデーション結果 → TwoParamsResult
```

### アプリケーションライフサイクルでの一貫性

```
TwoParams (値オブジェクト)
├── DirectiveType (パターン検証済み単一値) - "to", "summary", "defect" など
└── LayerType (パターン検証済み単一値) - "project", "issue", "task" など

両者とも：
- BreakdownConfigのパターンで検証済み
- ProfileNameによって利用可能な値が決定
- アプリケーション全体で不変
- ライフサイクル全体で一貫して使用
```

### 依存関係 - ConfigパターンDriven

```
ProfileName → BreakdownConfig → CustomConfig.two.ParamsConfig
     ↓              ↓                      ↓
CLI args → BreakdownParams (pattern validation) → TwoParamsResult
     ↓                                                    ↓
TwoParams → DirectiveType (pattern-validated)
TwoParams → LayerType (pattern-validated)
TwoParams → ConfigProfileName (設定コンテキスト)

DirectiveType ←→ LayerType (組み合わせ検証のみ)
```

このドメイン型定義により、TwoParamsがDirectiveTypeとLayerTypeの2つを持つという関係性が型安全に表現され、BreakdownConfigのパターンによるバリデーションを経た信頼性の高いドメインオブジェクトとして機能します。ProfileNameによるパターン切り替えにより、柔軟な設定管理が実現されています。


