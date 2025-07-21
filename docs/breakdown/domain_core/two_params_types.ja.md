# layerTypeとDirectiveType

## ドメインストーリー - JSR検証済み値からファイルシステムへの変換

### 具体例で理解する処理の流れ

ユーザーがコマンドラインで `breakdown to issue` を実行したとき、システムは以下の処理を行います：

1. **CLI引数の受信**: `["to", "issue"]`
2. **設定読み込み**: ConfigProfile（短寿命）に基づくBreakdownConfig取得
3. **JSRパラメータ検証**: JSR @tettuan/breakdownparams による検証実行
4. **検証済み値生成**: BreakdownParams検証結果から DirectiveType, LayerType を直接取得
5. **ファイルパス解決**: プロンプトテンプレートとスキーマファイルの特定
6. **プロンプト実行**: `prompts/to/issue/f_issue.md` と `schemas/to/issue/base.schema.json` を使用

このドメイン型定義により、TwoParamsがDirectiveTypeとLayerTypeの2つを持つという関係性が型安全に表現され、**BreakdownParams による外部検証システム**を活用した信頼性の高いドメイン値として機能します。これらの値は**プロンプトパス決定ドメイン**で使用され、適切なパス解決の実現に貢献します。ConfigProfileの短寿命化により、責務の明確化と処理効率の向上が実現されています。

この一連の流れにおいて、**DirectiveType（"to"）とLayerType（"issue"）** は、**BreakdownParams検証済みの信頼性の高いドメイン値**として提供され、最終的に**ファイルシステム上の具体的なリソース**を特定する役割を担います。

### なぜ「2つのパラメータ」なのか

Breakdownにおいて、**処理方向（DirectiveType）** と **階層（LayerType）** の組み合わせは、AI開発支援の中核的な概念です：

- **DirectiveType**: 「何をするか」（to=変換, summary=要約, defect=欠陥検出）
- **LayerType**: 「どのレベルで」（project=プロジェクト全体, issue=課題単位, task=タスク単位）

この2つの軸が交差することで、具体的な処理内容が決定され、適切なプロンプトテンプレートとスキーマファイルが特定されます。

**重要**: DirectiveTypeとLayerTypeは **BreakdownParams** で事前検証済みのため、Breakdown CLI内での追加バリデーションは不要です。BreakdownParamsには設定値から生成された`ParamsCustomConfig`が渡され、`directivePatterns`と`layerPatterns`に基づいてパターンマッチング検証が実行されます。

**注意**: BreakdownParamsパッケージの具体的な使用方法は [JSR @tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) のドキュメントを参照してください。

## 中核概念 - TwoParams

### ドメインオブジェクトとしてのTwoParams

TwoParamsは、BreakdownParams で検証済みのTwoParamsResultから生成される2つの単一値（DirectiveTypeとLayerType）の組み合わせを表すドメイン型です。BreakdownParams検証により信頼性が保証されており、アプリケーションライフサイクル全体で一貫して使用される不変の値です。

### 型定義 - ドメインの表現

```typescript
// =============================================================================
// TwoParams - 2パラメータ処理のドメイン型（BreakdownParams検証済み値ベース）
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
 * - BreakdownParams検証済み値からファイルシステムリソースへの橋渡し
 * - 追加バリデーション不要による信頼性保証
 * - 型安全なパス解決の実現
 */
type TwoParams = {
  readonly directive: DirectiveType;
  readonly layer: LayerType;
  
  // 型安全な比較
  equals(other: TwoParams): boolean;
  toString(): string;
}
```

### DirectiveTypeとLayerType - 構成要素の詳細

```typescript
/**
 * DirectiveType - 処理方向を表すドメイン型（BreakdownParams検証済み）
 * 
 * 役割: 「何をするか」を決定
 * 例: "to"(変換), "summary"(要約), "defect"(欠陥検出)
 * 
 * 注意: BreakdownParams で事前検証済みのため追加検証不要
 */
class DirectiveType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  
  constructor(readonly value: string) {}
  
  // 型安全な比較
  equals(other: DirectiveType): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}

/**
 * LayerType - 階層を表すドメイン型（BreakdownParams検証済み）
 * 
 * 役割: 「どのレベルで」を決定
 * 例: "project"(プロジェクト), "issue"(課題), "task"(タスク)
 * 
 * 注意: BreakdownParams で事前検証済みのため追加検証不要
 */
class LayerType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  
  constructor(readonly value: string) {}
  
  // 型安全な比較
  equals(other: LayerType): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}

/**
 * ConfigProfile - 設定プロファイル名を表すドメイン型（短寿命）
 * 
 * 役割: 設定の切り替えコンテキスト（設定ファイル読み込み専用）
 * 例: "default"(デフォルト), "production"(本番), "custom"(カスタム)
 * 
 * 寿命管理:
 * - 非常に短寿命（設定ファイル読み込み後すぐに役割終了）
 * - CLIから未指定時は自動的に "default" が適用される
 * - BreakdownConfig取得後は参照されない
 * - DirectiveType/LayerType提供責務は削除（BreakdownParams検証に移譲）
 */
class ConfigProfile {
  readonly isDefault: boolean;
  
  private constructor(readonly value: string, isDefault: boolean) {
    this.isDefault = isDefault;
  }
  
  // デフォルト値関連の操作
  static createDefault(): ConfigProfile {
    return new ConfigProfile("default", true);
  }
  
  static fromCliOption(option?: string): ConfigProfile {
    return option 
      ? new ConfigProfile(option, false) 
      : this.createDefault();
  }
  
  // 設定ファイル読み込み用
  getConfigPath(): string {
    return `config/${this.value}.yml`;
  }
  
  // 型安全な比較
  equals(other: ConfigProfile): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}
```

## BreakdownParams統合による検証システム

### BreakdownParams検証済み値の活用戦略

Breakdownでは、**BreakdownParams** による外部検証システムを活用し、CLI引数の信頼性を確保しています：

```
CLI args → ConfigProfile.fromCliOption("default") → BreakdownConfig
     ↓                                                         ↓
CLI args → BreakdownParams (external validation) → TwoParamsResult
     ↓        ↑ ParamsCustomConfig(directivePatterns,layerPatterns)
TwoParams → new DirectiveType() + new LayerType() (pre-validated)

検証フロー詳細:
1. BreakdownConfigから directivePatterns, layerPatterns を抽出
2. ParamsCustomConfigとしてBreakdownParamsに渡す
3. BreakdownParamsが設定パターンに基づいて検証実行
4. 検証済みTwoParamsResultから DirectiveType, LayerType を生成

注意: 
- ConfigProfileは設定ファイル読み込み後すぐに寿命終了
- DirectiveType/LayerTypeは BreakdownParams検証済みのため追加検証不要
- 冗長なパターンマッチング処理を削除
```
### なぜBreakdownParams統合が必要なのか

1. **外部検証による信頼性**: BreakdownParamsパッケージによる事前検証で品質保証
2. **設定値ベース検証**: `ParamsCustomConfig`として設定パターン（directivePatterns/layerPatterns）を渡し、設定値に基づいた柔軟な検証を実現
3. **検証ロジック分離**: Breakdown CLI本体から検証責務を分離
4. **冗長性排除**: 重複するパターンマッチング処理を削除
5. **一貫性保証**: 複数のアプリケーション間で共通の検証基準
6. **ConfigProfileの責務簡素化**: 設定ファイル読み込み専用の短寿命オブジェクトに変更

### エラーハンドリング戦略

```typescript
/**
 * BreakdownParams統合後の簡略化されたエラー型
 * 
 * 注意: DirectiveType/LayerTypeのバリデーションエラーは
 * BreakdownParams で処理されるため、
 * Breakdown CLI内では以下の限定的なエラーのみ扱う
 * 
 * BreakdownParamsでの検証:
 * - ParamsCustomConfigのdirectivePatternsによるDirectiveType検証
 * - ParamsCustomConfigのlayerPatternsによるLayerType検証
 * - パターンマッチ失敗時のエラーはBreakdownParamsが処理
 */
type TwoParamsError = 
  | { kind: "BreakdownParamsValidationFailed"; breakdownParamsError: BreakdownParamsError; }
  | { kind: "ConfigProfileNotFound"; profile: ConfigProfile; configPath: string; }
  | { kind: "PathResolutionFailed"; directive: string; layer: string; baseDir: string; }
```


## 実用性の実現 - パス解決システム

### DirectiveTypeとLayerTypeの実際の活用

**BreakdownParams検証済み**のDirectiveTypeとLayerTypeは、**単純な文字列値を保持するドメイン型**として機能します。これらの値は、**プロンプトパス決定ドメイン**において**パス解決の一部として**使用されます。

### パス解決の仕組み（プロンプトパス決定ドメインの責務）

パス解決は**プロンプトパス決定ドメイン**で行われ、以下の3つの変数の組み合わせで決定されます：

1. **設定値（base_dir）** - `app_prompt.base_dir` または `app_schema.base_dir`
2. **DirectiveType（BreakdownParams検証済み）** - 処理方向（to, summary, defect など）
3. **LayerType（BreakdownParams検証済み）** - 階層レベル（project, issue, task など）

**重要**: TwoParamsはこれらの値を提供するのみで、パス解決自体は行いません。

```typescript
// パス解決専用型定義（BreakdownParams統合版）
// 注意: パス解決は「プロンプトパス決定ドメイン」の責務
// TwoParamsは値の提供のみ行う
type PromptPath = {
  readonly baseDir: string;           // app_prompt.base_dir (cwd起点)
  readonly directive: DirectiveType;  // BreakdownParams検証済み "to", "summary", "defect" など
  readonly layer: LayerType;          // BreakdownParams検証済み "project", "issue", "task" など
  readonly fromLayer: string;         // fromLayerType
  readonly adaptation?: string;       // adaptation修飾子（オプション）
  resolve(): string;
  resolveWithAdaptation(adaptation: string): string;
}

type SchemaPath = {
  readonly baseDir: string;           // app_schema.base_dir (cwd起点)
  readonly directive: DirectiveType;  // BreakdownParams検証済み "to", "summary", "defect" など
  readonly layer: LayerType;          // BreakdownParams検証済み "project", "issue", "task" など
  readonly schemaFile: string;        // デフォルト: "base.schema.json"
  resolve(): string;
}
```

### ディレクトリ構造との対応

```
プロンプトパス決定ドメインが実行: {base_dir}/{directive.value}/{layer.value}/filename
TwoParamsは: directive.value, layer.value を提供するのみ

プロジェクトルート/
├── prompts/           # app_prompt.base_dir
│   ├── to/           # DirectiveType.value
│   │   ├── project/  # LayerType.value
│   │   ├── issue/    # LayerType.value
│   │   └── task/     # LayerType.value
│   ├── summary/      # DirectiveType.value
│   └── defect/       # DirectiveType.value
└── schemas/          # app_schema.base_dir
    ├── to/           # DirectiveType.value
    │   ├── project/  # LayerType.value
    │   ├── issue/    # LayerType.value
    │   └── task/     # LayerType.value
    ├── summary/      # DirectiveType.value
    └── defect/       # DirectiveType.value
```

## 実装ガイド

### Smart Constructors（BreakdownParams統合版）

```typescript
/**
 * Smart Constructors - BreakdownParams検証済み値からの型安全な生成
 */
namespace TwoParams {
  // BreakdownParams TwoParamsResultから直接生成
  export function create(twoParamsResult: TwoParamsResult): TwoParams {
    return {
      directive: new DirectiveType(twoParamsResult.directiveType),
      layer: new LayerType(twoParamsResult.layerType)
    };
  }
}

namespace DirectiveType {
  // BreakdownParams検証済み値から直接生成（追加検証不要）
  export function create(value: string): DirectiveType {
    return new DirectiveType(value);
  }
}

namespace LayerType {
  // BreakdownParams検証済み値から直接生成（追加検証不要）
  export function create(value: string): LayerType {
    return new LayerType(value);
  }
}

namespace ConfigProfile {
  export function createDefault(): ConfigProfile {
    return new ConfigProfile("default", true);
  }
  
  export function fromCliOption(option?: string): ConfigProfile {
    return option 
      ? new ConfigProfile(option, false) 
      : this.createDefault();
  }
}
```
### 統合使用例 - ドメインライフサイクル

```typescript
// ConfigProfile（短寿命）→ BreakdownParams検証 → TwoParams（長寿命）
async function domainLifecycleExample() {
  // 1. ConfigProfile: 短寿命（設定読み込み専用）
  const profile = ConfigProfile.fromCliOption(null); // "default"適用
  const config = await loadBreakdownConfig(profile);
  // ConfigProfileの役割終了
  
  // 2. BreakdownParams: 設定パターンベース検証
  // 具体的な呼び出し方法は JSR @tettuan/breakdownparams のドキュメントを参照
  const breakdownParamsResult = await validateWithBreakdownParams(["to", "issue"]);
  const twoParams = TwoParams.create(breakdownParamsResult);
  
  // 3. TwoParams: 長寿命（アプリケーション全体で使用）
  return {
    directive: twoParams.directive.value, // "to"
    layer: twoParams.layer.value,         // "issue"
    source: twoParams.directive.source    // "BREAKDOWN_PARAMS_VALIDATED"
  };
}
```

### エラーハンドリング例

```typescript
// BreakdownParams検証エラーの処理（概念例）
// 具体的な呼び出し方法は JSR @tettuan/breakdownparams のドキュメントを参照
if (!breakdownParamsResult.ok) {
  switch (breakdownParamsResult.error.kind) {
    case "BreakdownParamsValidationFailed":
      // BreakdownParamsでの設定パターンベース検証失敗
      break;
    case "ConfigProfileNotFound":
      // 設定プロファイルが見つからない
      break;
    case "PathResolutionFailed":
      // プロンプトパス決定ドメインでのパス解決失敗
      break;
  }
}
```

## アプリケーションライフサイクルでの一貫性

```
TwoParams (純粋な値オブジェクト)
├── DirectiveType (BreakdownParams検証済み文字列値) - "to", "summary", "defect" など
└── LayerType (BreakdownParams検証済み文字列値) - "project", "issue", "task" など

特徴：
- BreakdownParams で事前検証済み
- ConfigProfileは設定読み込み後すぐに寿命終了
- 追加バリデーション不要
- アプリケーション全体で不変
- パス解決はプロンプトパス決定ドメインが担当

寿命管理:
1. ConfigProfile: 短寿命（設定ファイル読み込み専用）
2. DirectiveType/LayerType: 長寿命（BreakdownParams検証済み、アプリケーション全体で使用）
3. TwoParams: 長寿命（プロンプト生成まで継続使用）
```

このドメイン型定義により、TwoParamsがDirectiveTypeとLayerTypeの2つを持つという関係性が型安全に表現され、**BreakdownParams による外部検証システム**を活用した信頼性の高いドメインオブジェクトとして機能します。さらに、これらの型はプロンプトテンプレートとスキーマファイルの物理的な配置を決定する重要な役割を担い、ファイルシステム上のリソースへの確実なアクセスを可能にします。ConfigProfileの短寿命化により、責務の明確化と処理効率の向上が実現されています。


