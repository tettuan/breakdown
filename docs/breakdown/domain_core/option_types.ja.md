# オプション型のドメインストーリー

> **本ファイルの位置付け**: ドメインストーリー視点（ユーザーがどのオプションをどう使い分けるか）に特化しています。
> - 型定義の正本: [two_params_types.ja.md](./two_params_types.ja.md)（DirectiveType / LayerType / ConfigProfile / TwoParams）
> - ドメイン境界図とドメイン間データフロー: [domain_boundaries_flow.ja.md](./domain_boundaries_flow.ja.md)
> - パス解決ルール: [../interface/path_resolution.ja.md](../interface/path_resolution.ja.md)
>
> 本ファイルでは、CLI 利用者が **情報表示 / 管理操作 / プロンプト生成** の 3 つのオプション利用シナリオをどう体験するか、という観点に絞って説明します。型・境界の技術詳細は上記の権威ファイルを参照してください。

## プロローグ：Breakdown CLIの本質

Breakdown CLIをユーザー視点で見ると、**3つの異なる利用シナリオ**に分かれます：

1. **情報表示シナリオ** - システム情報を取得する（`--help`, `--version`）
2. **管理操作シナリオ** - アプリケーション状態を管理する（`init`, `copy`, `delete`）
3. **プロンプト生成シナリオ** - 文書をプロンプトに変換する（`to issue` など）

この3つのシナリオは、それぞれ異なる責務、異なるユーザー体験、異なる複雑さを持っています。なお、Breakdown CLI 全体のドメイン境界（パラメータバリデーション・パス解決・変数生成・出力など内部ドメイン）の詳細は [domain_boundaries_flow.ja.md](./domain_boundaries_flow.ja.md) を参照してください。

## 第1章：シナリオの発見

### 各シナリオの特徴

#### 情報表示シナリオ
- **責務**: ユーザーにシステム情報を提供
- **複雑さ**: 最小限（フラグの判定のみ）
- **変換**: なし（即座に結果を返す）
- **典型例**: `breakdown --help`, `breakdown --version`

#### 管理操作シナリオ
- **責務**: アプリケーション状態・設定の管理
- **複雑さ**: 中程度（設定の読み書き）
- **変換**: 限定的（設定ファイルとの相互作用）
- **典型例**: `breakdown init`, `breakdown copy`, `breakdown delete`

#### プロンプト生成シナリオ
- **責務**: 文書をプロンプトに変換・生成
- **複雑さ**: 最大（多段階変換処理）
- **変換**: 完全（ファイル→変数→プロンプト→出力）
- **典型例**: `breakdown to issue`, `breakdown summary project`

## 第2章：コマンド構造とシナリオの対応

### パラメータ数による自然な分類

CLIのパラメータ数は、そのまま利用シナリオの分岐になります。

- **Zero パラメータ**: `--help`, `--version` → 情報表示シナリオ（システムへの問い合わせ）
- **One パラメータ**: `init`, `copy`, `delete` → 管理操作シナリオ（アプリケーションへの指示）
- **Two パラメータ**: `to issue`, `summary project` → プロンプト生成シナリオ（変換処理の指定）

> パラメータ解析の型表現（`ZeroParamsResult` / `OneParamsResult` / `TwoParamsResult`）と内部ドメイン境界については [two_params_types.ja.md](./two_params_types.ja.md) と [domain_boundaries_flow.ja.md](./domain_boundaries_flow.ja.md) を参照してください。

## 第3章：オプション型の責務分離

### シナリオ専用オプション型

```typescript
// 各シナリオは専用のオプション型を持つ
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
  userVariables?: Record<string, string>; // DynamicVariableOption
}
```
- **統合性**: 3つのオプション型を統合
- **変換性**: 複雑な変換処理に対応
- **専用性**: TwoParamsResultでのみ使用

## 第4章：プロンプト生成シナリオの内部構造

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
  userVariables?: Record<string, string>; // ユーザー定義変数
}
```
- **役割**: プロンプト生成の**カスタマイズ**
- **変換**: CLI引数 → プロンプト変数

### 統合の必然性

これら3つのオプション型が**統合される理由**：

1. **協調動作**: 単独では意味を成さない
2. **変換統一**: 同じ変換エンジンで処理される
3. **シナリオの一体性**: プロンプト生成という単一の利用シナリオで完結する

## 第5章：変換処理の段階的設計

### シナリオ別の変換戦略

| シナリオ | 変換戦略 | 説明 |
|---------|---------|------|
| 情報表示 | none | 変換なし、即座に結果を返す |
| 管理操作 | limited | 設定ファイルとの限定的な相互作用 |
| プロンプト生成 | full | ファイル → 変数 → プロンプト → 出力 の多段階変換 |

### 変換処理の詳細

#### 情報表示シナリオ: 即時応答
```typescript
// 変換処理なし
function handleSystemOptions(options: SystemOptions): string {
  if (options.help) return generateHelp();
  if (options.version) return generateVersion();
  return "";
}
```

#### 管理操作シナリオ: 設定変更
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

#### プロンプト生成シナリオ: 完全変換
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
  if (source.userVariables) {
    variables.uv = source.userVariables;
  }
  
  return variables;
}
```

## 第6章：拡張性の設計

### 管理操作シナリオの拡張戦略

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

### プロンプト生成シナリオの拡張戦略

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
// シナリオごとの処理を明確に分離
function processCommand(result: ParameterResult) {
  switch (result.type) {
    case "zero-params":
      return handleInformationDisplay(result.options);
    case "one":
      return handleManagementOperation(result.command, result.options);
    case "two":
      return handlePromptGeneration(result.directiveType, result.layerType, result.options);
  }
}
```

#### オプション型の使い分け
```typescript
// 各シナリオで専用のオプション型を使用
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

シナリオごとにエラーの粒度と回復方針が異なります。情報表示は失敗が稀、管理操作は対象不在を明示、プロンプト生成は変換段階ごとに別種のエラーを返すのが基本です。エラー型の正本定義および境界でのエラー伝播は [domain_boundaries_flow.ja.md](./domain_boundaries_flow.ja.md) を参照してください。

## 第8章：設計の振り返り

### 成功した設計原則

1. **シナリオ分離**: 3つの明確な利用シナリオ
2. **責務分離**: 各シナリオに専用のオプション型
3. **拡張性**: 将来の機能追加に対応
4. **型安全性**: TypeScriptの型システムを活用
5. **一貫性**: 統一されたユビキタス言語と設計方針

### 設計の意図

- **理解しやすさ**: シナリオストーリーによる文脈の提供
- **実装しやすさ**: 明確な責務分離と型安全性
- **保守しやすさ**: 拡張性と一貫性の両立
- **誤解の防止**: 各シナリオの境界と責務の明確化

## エピローグ：シナリオ駆動オプション設計の価値

このオプション型設計は、単なる技術的な型定義ではありません。**Breakdown CLI のユーザー体験そのもの**を表現しています。

- **情報表示シナリオ**: シンプルで即座に応答
- **管理操作シナリオ**: 柔軟で拡張可能
- **プロンプト生成シナリオ**: 複雑で強力

この3つのシナリオが調和することで、Breakdown CLIは**一貫性のある**、**理解しやすい**、**拡張しやすい**アプリケーションとなっています。

## 参考資料

### 関連ドキュメント
- [prompt_variables.ja.md](./prompt_variables.ja.md): プロンプト変数の詳細
- [two_params_types.ja.md](./two_params_types.ja.md): TwoParamsResultの内部構造  
- [processing-flow.ja.md](../generic_domain/system/overview/processing-flow.ja.md): 処理フローの全体像

### 実装参考
- [CLIコマンド](../interface/cli_commands.ja.md): CLIオプションの実装詳細
- [glossary.ja.md](../generic_domain/system/overview/glossary.ja.md): ドメイン用語の定義

### 設計上の注意点
**全域関数とnull許可について**: Value Object内部でnull値を許可するよりも、Result型を使用して成功/失敗を明確に分離することを推奨します。これにより型安全性が向上し、エラー情報の詳細化が可能になります。

```typescript
// 推奨されない設計
static create(value: string): ValueObject {
  if (invalid) return new ValueObject(null); // 曖昧な状態
}

// 推奨される設計
static create(value: string): Result<ValueObject, ValidationError> {
  if (invalid) return error({ kind: "InvalidFormat", details: ... });
  return ok(new ValueObject(value));
}
```

---

**ドメインストーリー設計**: 2025年7月  
**設計思想**: ドメイン駆動設計による責務分離と型安全性の両立

---

## CHANGELOG

### 2026-04-18: 設計ドキュメント整理により重複定義を統合
- 冒頭に位置付けセクションを追加し、本ファイルをユーザー視点のシナリオストーリー専用に再定義
- `BreakdownDomain` / `CommandStructure` の型定義（[domain_boundaries_flow.ja.md](./domain_boundaries_flow.ja.md) と [two_params_types.ja.md](./two_params_types.ja.md) と重複）を散文化
- エラーハンドリングの型定義を削除し、正本である [domain_boundaries_flow.ja.md](./domain_boundaries_flow.ja.md) への参照に置換
- 用語を「ドメイン」から「シナリオ」に統一し、内部ドメインとの混同を回避
