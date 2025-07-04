# オプション型のドメインストーリー

## プロローグ：Breakdown CLIの本質

Breakdown CLIは、**3つの異なるドメイン**を持つアプリケーションです：

1. **情報表示ドメイン** - システム情報を提供する
2. **管理操作ドメイン** - アプリケーション状態を管理する  
3. **プロンプト生成ドメイン** - 文書をプロンプトに変換する

この3つのドメインは、それぞれ異なる責務、異なるユーザー体験、異なる複雑さを持っています。

## 第1章：ドメインの発見

### ドメインの分離原則

```typescript
// ドメインの境界を明確に定義
type BreakdownDomain = 
  | "information-display"    // 情報表示：単純・即時
  | "management-operation"   // 管理操作：状態変更・設定
  | "prompt-generation";     // プロンプト生成：複雑・変換
```

### 各ドメインの特徴

#### 情報表示ドメイン
- **責務**: ユーザーにシステム情報を提供
- **複雑さ**: 最小限（フラグの判定のみ）
- **変換**: なし（即座に結果を返す）
- **典型例**: `breakdown --help`, `breakdown --version`

#### 管理操作ドメイン  
- **責務**: アプリケーション状態・設定の管理
- **複雑さ**: 中程度（設定の読み書き）
- **変換**: 限定的（設定ファイルとの相互作用）
- **典型例**: `breakdown init`, `breakdown copy`, `breakdown delete`

#### プロンプト生成ドメイン
- **責務**: 文書をプロンプトに変換・生成
- **複雑さ**: 最大（多段階変換処理）
- **変換**: 完全（ファイル→変数→プロンプト→出力）
- **典型例**: `breakdown to issue`, `breakdown summary project`

## 第2章：コマンド構造の設計

### パラメータ数による自然な分類

```typescript
// CLIの自然な構造がドメインを反映
type CommandStructure = 
  | ZeroParamsResult    // オプションのみ → 情報表示
  | OneParamsResult     // 単一動詞 → 管理操作
  | TwoParamsResult;    // 動詞+目的語 → プロンプト生成
```

この分類は**偶然ではありません**。コマンドの自然な構造が、そのまま**ドメインの境界**を表しています。

### 設計の意図

- **Zero**: `--help`, `--version` → システムへの問い合わせ
- **One**: `init`, `copy`, `delete` → アプリケーションへの指示
- **Two**: `to issue`, `summary project` → 変換処理の指定

## 第3章：オプション型の責務分離

### ドメイン専用オプション型

```typescript
// 各ドメインは専用のオプション型を持つ
type Options = 
  | SystemOptions        // 情報表示専用
  | ManagementOptions    // 管理操作専用
  | PromptVariableSource // プロンプト生成専用（統合型）
```

### 責務分離の理由

#### SystemOptions: 情報表示の単純性
```typescript
interface SystemOptions {
  help?: boolean;     // ヘルプ表示
  version?: boolean;  // バージョン表示
}
```
- **単純性**: 2つのブール値のみ
- **即時性**: 変換処理なし
- **独立性**: 他のドメインと干渉しない

#### ManagementOptions: 管理操作の柔軟性
```typescript
interface ManagementOptions {
  config?: string;    // 設定接頭詞（全コマンド共通）
  force?: boolean;    // 強制実行フラグ
  backup?: boolean;   // バックアップ作成
  target?: string;    // 操作対象の指定
  message?: string;   // コミットメッセージ
  // 将来の拡張に対応
}
```
- **共通性**: `config`は全コマンドで共有
- **拡張性**: 新しい管理コマンドに対応
- **型安全性**: コマンドごとに必要なオプションを選択

#### PromptVariableSource: プロンプト生成の複雑性
```typescript
interface PromptVariableSource {
  // 3つのオプション型を統合
  fromFile?: string;              // PromptVariableOption
  destinationFile?: string;       // PromptVariableOption
  stdinContent?: string;          // PromptVariableOption
  adaptation?: string;            // ProcessingDirectiveOption
  useSchema?: boolean;            // ProcessingDirectiveOption
  customVariables?: Record<string, string>; // DynamicVariableOption
}
```
- **統合性**: 3つのオプション型を統合
- **変換性**: 複雑な変換処理に対応
- **専用性**: TwoParamsResultでのみ使用

## 第4章：プロンプト生成ドメインの内部構造

### 3つのオプション型の役割

#### PromptVariableOption: データの流入
```typescript
interface PromptVariableOption {
  fromFile?: string;       // ファイルからのデータ
  destinationFile?: string;// 出力先の指定
  stdinContent?: string;   // パイプからのデータ
}
```
- **役割**: プロンプト生成の**材料**を提供
- **変換**: ファイル内容 → プロンプト変数

#### ProcessingDirectiveOption: 処理の制御
```typescript
interface ProcessingDirectiveOption {
  adaptation?: string;     // プロンプト種別の選択
  useSchema?: boolean;     // スキーマ使用の制御
}
```
- **役割**: プロンプト生成の**方法**を制御
- **変換**: 設定 → 処理ロジックの分岐

#### DynamicVariableOption: 動的な拡張
```typescript
interface DynamicVariableOption {
  customVariables?: Record<string, string>; // ユーザー定義変数
}
```
- **役割**: プロンプト生成の**カスタマイズ**
- **変換**: CLI引数 → プロンプト変数

### 統合の必然性

これら3つのオプション型が**統合される理由**：

1. **協調動作**: 単独では意味を成さない
2. **変換統一**: 同じ変換エンジンで処理される
3. **ドメイン境界**: プロンプト生成という単一のドメイン

## 第5章：変換処理の段階的設計

### ドメイン別の変換戦略

```typescript
// 各ドメインの変換戦略
type TransformationStrategy = 
  | "none"        // 情報表示：変換なし
  | "limited"     // 管理操作：限定的変換
  | "full";       // プロンプト生成：完全変換
```

### 変換処理の詳細

#### 情報表示ドメイン: 即時応答
```typescript
// 変換処理なし
function handleSystemOptions(options: SystemOptions): string {
  if (options.help) return generateHelp();
  if (options.version) return generateVersion();
  return "";
}
```

#### 管理操作ドメイン: 設定変更
```typescript
// 限定的変換
function handleManagementOptions(command: string, options: ManagementOptions) {
  const config = loadConfig(options.config);
  switch (command) {
    case "init": return initializeApp(config);
    case "copy": return copyResource(options.target, config);
    // ...
  }
}
```

#### プロンプト生成ドメイン: 完全変換
```typescript
// 完全変換パイプライン
function handlePromptGeneration(source: PromptVariableSource): PromptVariables {
  const variables = {};
  
  // Stage 1: データの取得
  if (source.fromFile) {
    variables.inputContent = readFile(source.fromFile);
    variables.inputFilePath = resolve(source.fromFile);
  }
  
  // Stage 2: 処理制御
  if (source.adaptation) {
    variables.promptTemplate = selectTemplate(source.adaptation);
  }
  
  // Stage 3: 動的拡張
  if (source.customVariables) {
    variables.uv = source.customVariables;
  }
  
  return variables;
}
```

## 第6章：拡張性の設計

### 管理操作ドメインの拡張戦略

#### 現在の設計思想
```typescript
interface ManagementOptions {
  config?: string;    // 全コマンド共通の基盤
  // コマンド固有オプションは共存
}
```

#### 拡張の原則
1. **共通基盤**: `config`は全コマンドで共有
2. **個別特化**: コマンド固有のオプションを追加
3. **型安全性**: 不要なオプションは使用不可
4. **一貫性**: 似た概念は同じ命名

#### 拡張シナリオ
```typescript
// 将来の拡張例
interface ManagementOptions {
  config?: string;      // 基盤（全コマンド）
  force?: boolean;      // 強制実行（delete, destroy）
  backup?: boolean;     // バックアップ（copy, delete）
  target?: string;      // 対象指定（copy, delete）
  message?: string;     // メッセージ（commit）
  recursive?: boolean;  // 再帰処理（copy, delete）
  dryRun?: boolean;     // 事前確認（delete, destroy）
}
```

### プロンプト生成ドメインの拡張戦略

#### 統合型の利点
```typescript
// 新しいオプション型の追加
type PromptGenerationOptions = 
  | PromptVariableOption 
  | ProcessingDirectiveOption 
  | DynamicVariableOption
  | OutputFormatOption        // 新しいオプション型
  | ValidationOption;         // 新しいオプション型
```

#### 拡張時の影響
- **統合型**: `PromptVariableSource`に新しいプロパティを追加
- **変換処理**: 新しいオプション型の変換ロジックを追加
- **既存機能**: 影響なし（後方互換性保持）

## 第7章：実装ガイドライン

### 型安全な実装パターン

#### パラメータ型による分岐
```typescript
// ドメイン境界を明確に分離
function processCommand(result: ParameterResult) {
  switch (result.type) {
    case "zero-params":
      return handleInformationDisplay(result.options);
    case "one":
      return handleManagementOperation(result.command, result.options);
    case "two":
      return handlePromptGeneration(result.demonstrativeType, result.layerType, result.options);
  }
}
```

#### オプション型の使い分け
```typescript
// 各ドメインで専用のオプション型を使用
function handleManagementOperation(command: string, options: ManagementOptions) {
  // ManagementOptionsの型安全な使用
  const { config, force, backup, target } = options;
  
  // コマンドごとの実装
  switch (command) {
    case "init":
      return initializeApp(config);
    case "copy":
      if (!target) throw new Error("target is required for copy");
      return copyResource(target, { backup, force });
  }
}
```

### エラーハンドリングの戦略

#### ドメイン別のエラー処理
```typescript
// 各ドメインの特性に応じたエラー処理
class BreakdownError extends Error {
  constructor(domain: BreakdownDomain, message: string) {
    super(`[${domain}] ${message}`);
  }
}

// 使用例
throw new BreakdownError("management-operation", "Target file not found");
throw new BreakdownError("prompt-generation", "Invalid template adaptation");
```

## 第8章：設計の振り返り

### 成功した設計原則

1. **ドメイン分離**: 3つの明確なドメイン境界
2. **責務分離**: 各ドメインに専用のオプション型
3. **拡張性**: 将来の機能追加に対応
4. **型安全性**: TypeScriptの型システムを活用
5. **一貫性**: 統一されたドメイン用語と設計方針

### 設計の意図

- **理解しやすさ**: ドメインストーリーによる文脈の提供
- **実装しやすさ**: 明確な責務分離と型安全性
- **保守しやすさ**: 拡張性と一貫性の両立
- **誤解の防止**: 各ドメインの境界と責務の明確化

## エピローグ：ドメインモデルの価値

このオプション型設計は、単なる技術的な型定義ではありません。**Breakdown CLIのドメインモデル**そのものです。

- **情報表示ドメイン**: シンプルで即座に応答
- **管理操作ドメイン**: 柔軟で拡張可能
- **プロンプト生成ドメイン**: 複雑で強力

この3つのドメインが調和することで、Breakdown CLIは**一貫性のある**、**理解しやすい**、**拡張しやすい**アプリケーションとなっています。

## 参考資料

### 関連ドキュメント
- [prompt_variables.ja.md](./prompt_variables.ja.md): プロンプト変数の詳細
- [two_params_types.ja.md](./two_params_types.ja.md): TwoParamsResultの内部構造  
- [processing-flow.ja.md](../overview/processing-flow.ja.md): 処理フローの全体像

### 実装参考
- [options.ja.md](../parameters/options.ja.md): CLIオプションの実装詳細
- [glossary.ja.md](../overview/glossary.ja.md): ドメイン用語の定義

---

**ドメインストーリー設計**: 2025年1月  
**設計思想**: ドメイン駆動設計による責務分離と型安全性の両立
