# layerTypeとDirectiveType

## ドメイン駆動設計における型定義

### TwoParamsの構造

TwoParamsは、CLIのargsがBreakdownParamsを経由して得られる2つの単一値（DirectiveTypeとLayerType）の組み合わせを表すドメイン型です。両者ともアプリケーションライフサイクル全体で一貫して使用される不変の値です。

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
 * - CLI argsから取得される単一の処理方向値（to, summary, defect, web, rag, db）
 * - アプリケーションライフサイクル全体で不変
 * - プロンプトテンプレートの選択に使用
 */
type DirectiveType = {
  readonly value: string;
  readonly profile: ConfigProfileName;
  
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
 * - CLI argsから取得される単一の階層値（project, issue, task）
 * - アプリケーションライフサイクル全体で不変
 * - DirectiveTypeと組み合わせて処理を特定
 */
type LayerType = {
  readonly value: string;
  
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
  | { kind: "InvalidDirective"; directive: string; profile: ConfigProfileName; }
  | { kind: "InvalidLayer"; layer: string; }
  | { kind: "UnsupportedCombination"; directive: string; layer: string; profile: ConfigProfileName; }

/**
 * DirectiveType検証エラー
 */
type InvalidDirectiveError = {
  kind: "InvalidDirective";
  value: string;
  profile: ConfigProfileName;
  validDirectives: string[];
}

/**
 * LayerType検証エラー
 */
type InvalidLayerError = {
  kind: "InvalidLayer";
  value: string;
  validLayers: string[];
}
```

### 使用例

```typescript
// 基本的な使用例
const profile = ConfigProfileName.create("breakdown");
const twoParams = TwoParams.create("to", "issue", profile.data);

if (twoParams.ok) {
  const command = twoParams.data.toCommand();
  const promptPath = twoParams.data.getPromptPath();
  const schemaPath = twoParams.data.getSchemaPath();
}
```

## ドメイン関係性

### TwoParamsの構造 - CLIからの単一値の組み合わせ

TwoParamsは、CLIのargsがBreakdownParamsを経由して得られる2つの単一値の組み合わせです。

```
CLI args → BreakdownParams → TwoParams
  ↓              ↓            ↓
[directive, layer] → parsing → {directive: DirectiveType, layer: LayerType}
```

### アプリケーションライフサイクルでの一貫性

```
TwoParams (値オブジェクト)
├── DirectiveType (単一値) - "to", "summary", "defect" など
└── LayerType (単一値) - "project", "issue", "task" など

両者とも：
- CLIから取得される単一の文字列値
- アプリケーション全体で不変
- ライフサイクル全体で一貫して使用
- 階層構造は持たない
```

### 依存関係 - フラットな構造

```
TwoParams → DirectiveType (単一値)
TwoParams → LayerType (単一値)
TwoParams → ConfigProfileName (設定コンテキスト)

DirectiveType ←→ LayerType (組み合わせ検証のみ)
```

このドメイン型定義により、TwoParamsがDirectiveTypeとLayerTypeの2つを持つという関係性が型安全に表現され、ドメインの不変条件が型システムによって保証されます。


