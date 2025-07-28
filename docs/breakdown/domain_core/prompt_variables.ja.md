# プロンプト変数のドメインストーリー

## プロローグ：データの変容の物語

Breakdown CLIにおいて、ユーザーが入力したデータは**3段階の変容**を経てプロンプトとして生まれ変わります：

1. **PromptVariableSource** - CLI引数・STDINからの「生の材料」
2. **PromptVariables** - アプリケーション内部での「完成品」  
3. **PromptParams** - 外部API向けの「最終形態」

この変容プロセスは、ドメイン駆動設計における**変換責務の分離**と**型安全性**を実現する核心的な仕組みです。

## 第1章：変数の起源 - PromptVariableSource

### ドメインの定義
**PromptVariableSource**は、プロンプト生成ドメインにおける**材料倉庫**です。

```typescript
// プロンプト生成の材料を統合した源泉
interface PromptVariableSource {
  // データ系: 実際の情報源
  fromFile?: string;              // ファイルパス
  destinationFile?: string;       // 出力先パス
  stdinContent?: string;          // パイプからの内容
  
  // 制御系: 処理方法の指定
  adaptation?: string;            // プロンプト種別
  useSchema?: boolean;            // スキーマ使用フラグ
  
  // 拡張系: ユーザー定義の情報
  userVariables?: Record<string, string>; // 動的変数
}
```

### 責務と特徴
- **状態**: 未加工の変数源（Raw Variable Source）
- **責務**: CLI引数とSTDINから得た情報の一時保管
- **使用場所**: `TwoParamsResult.options`として利用
- **変換前**: ファイルパスや設定名など、まだ解決されていない状態

### 生成プロセス
```typescript
// CLI引数の解析結果として生成
const source: PromptVariableSource = {
  fromFile: "input.md",           // -f, --from
  adaptation: "strict",           // -a, --adaptation  
  userVariables: {              // --uv-*
    userName: "太郎",
    priority: "高"
  }
};
```

## 第2章：変数の完成 - PromptVariables

### ドメインの定義
**PromptVariables**は、プロンプトテンプレートで**直接使用可能**な完成された変数群です。

```typescript
// プロンプトテンプレートで直接利用可能な変数群
interface PromptVariables {
  // 解決済みデータ変数
  inputContent: string;           // 読み込み済みファイル内容またはSTDIN
  inputFilePath?: string;         // 絶対パス化されたファイルパス
  outputFilePath?: string;        // 絶対パス化された出力先
  
  // 解決済みメタ変数  
  schemaContent: string;          // 読み込み済みスキーマファイル内容
  promptFilePath: string;         // 決定されたプロンプトテンプレートパス
  inputSource: 'file' | 'stdin' | 'both'; // 入力源の種類
  
  // 構造化済み動的変数
  uv: Record<string, string>;     // ユーザー変数辞書
}
```

### 責務と特徴
- **状態**: 加工済みの変数群（Processed Variables）
- **責務**: プロンプトテンプレート内で直接参照可能な形式での変数提供
- **生成者**: `PromptVariablesFactory`
- **消費者**: プロンプトテンプレートエンジン

### 変換プロセス
```typescript
// PromptVariableSource → PromptVariables
function createPromptVariables(source: PromptVariableSource): PromptVariables {
  return {
    // データの実体化
    inputContent: source.fromFile ? readFile(source.fromFile) : source.stdinContent,
    inputFilePath: source.fromFile ? resolve(source.fromFile) : undefined,
    
    // 制御による分岐処理
    promptFilePath: selectPromptTemplate(source.adaptation),
    schemaContent: source.useSchema ? readSchemaFile() : "",
    
    // 動的変数の構造化
    uv: source.userVariables || {}
  };
}
```

## 第3章：外部連携の形態 - PromptParams

### ドメインの定義
**PromptParams**は、外部プロンプト生成エンジン`@tettuan/breakdownprompt`との**契約インターフェース**です。

```typescript
// 外部API仕様に適合した最終形態
interface PromptParams {
  template_file: string;                    // テンプレートファイルパス
  variables: Record<string, string>;       // フラット化された変数辞書
  debug?: boolean;                         // デバッグフラグ
}
```

### 責務と特徴
- **状態**: 外部API適合形式（External API Format）
- **責務**: 外部プロンプト生成エンジンとの橋渡し
- **特徴**: すべての変数が文字列の辞書に平坦化される
- **仕様**: [JSR @tettuan/breakdownprompt](https://jsr.io/@tettuan/breakdownprompt/doc/~/PromptParams)

### 変換プロセス
```typescript
// PromptVariables → PromptParams
function createPromptParams(variables: PromptVariables): PromptParams {
  return {
    template_file: variables.promptFilePath,
    variables: {
      // 基本変数の展開
      inputContent: variables.inputContent,
      inputFilePath: variables.inputFilePath || "",
      outputFilePath: variables.outputFilePath || "",
      schemaContent: variables.schemaContent,
      inputSource: variables.inputSource,
      
      // 動的変数の直接展開
      ...variables.uv
    }
  };
}
```

## 第4章：変容の段階とパターン

### 変容の全体像

```
[入力段階]           [変換段階]              [出力段階]
CLI引数・STDIN  →  PromptVariableSource  →  PromptVariables  →  PromptParams  →  プロンプト
   (生データ)         (材料倉庫)            (完成品)        (外部API形式)    (最終成果)
```

### 変容パターンの分類

#### パターン1: ファイル入力の変容
```typescript
// 入力: CLI引数
fromFile: "input.md"

// 変容1: 材料として保管
PromptVariableSource { fromFile: "input.md" }

// 変容2: 実体化して完成
PromptVariables { 
  inputContent: "ファイルの内容...",
  inputFilePath: "/absolute/path/to/input.md",
  inputSource: "file"
}

// 変容3: 外部API形式へ平坦化  
PromptParams {
  variables: {
    inputContent: "ファイルの内容...",
    inputFilePath: "/absolute/path/to/input.md",
    inputSource: "file"
  }
}
```

#### パターン2: 動的変数の変容
```typescript
// 入力: CLI引数
--uv-userName=太郎 --uv-priority=高

// 変容1: 辞書として保管
PromptVariableSource { 
  userVariables: { userName: "太郎", priority: "高" } 
}

// 変容2: 構造化して完成
PromptVariables { 
  uv: { userName: "太郎", priority: "高" } 
}

// 変容3: 直接展開して平坦化
PromptParams {
  variables: {
    userName: "太郎",    // uvから直接展開
    priority: "高"       // uvから直接展開
  }
}
```

#### パターン3: 処理制御の変容
```typescript
// 入力: CLI引数
--adaptation=strict

// 変容1: 設定として保管
PromptVariableSource { adaptation: "strict" }

// 変容2: パス解決して完成
PromptVariables { 
  promptFilePath: "/templates/f_task_strict.md" 
}

// 変容3: テンプレートファイルとして指定
PromptParams {
  template_file: "/templates/f_task_strict.md"
}
```

## 第5章：実践的な使用例

### シナリオ1: 基本的なファイル処理
```bash
breakdown to issue -f input.md -o output.json
```

**変容プロセス**:
1. **PromptVariableSource**: `{ fromFile: "input.md", destinationFile: "output.json" }`
2. **PromptVariables**: ファイル読み込み・パス解決・デフォルト設定適用
3. **PromptParams**: 外部API形式への変換

**最終的なプロンプト変数**:
```typescript
{
  inputContent: "# Issue Title\n...",
  inputFilePath: "/project/input.md", 
  outputFilePath: "/project/output.json",
  schemaContent: "...",
  inputSource: "file"
}
```

### シナリオ2: 動的変数とSTDINの組み合わせ
```bash
echo "緊急対応が必要" | breakdown to task --uv-priority=緊急 --uv-assignee=田中
```

**変容プロセス**:
1. **PromptVariableSource**: STDIN内容と動的変数を統合
2. **PromptVariables**: STDIN内容の取得と動的変数の構造化
3. **PromptParams**: 全変数の平坦化

**最終的なプロンプト変数**:
```typescript
{
  inputContent: "緊急対応が必要",
  inputSource: "stdin",
  priority: "緊急",        // uvから展開
  assignee: "田中"         // uvから展開
}
```

### シナリオ3: 複合入力と処理制御
```bash
breakdown to project -f requirements.md --adaptation=detailed --use-schema --uv-version=2.0
```

**変容プロセス**:
1. **PromptVariableSource**: ファイル・処理制御・動的変数の統合
2. **PromptVariables**: 全要素の解決と構造化
3. **PromptParams**: 統合された変数の平坦化

**最終的なプロンプト変数**:
```typescript
{
  inputContent: "要件定義の内容...",
  inputFilePath: "/project/requirements.md",
  promptFilePath: "/templates/f_project_detailed.md",
  schemaContent: "スキーマの内容...",
  inputSource: "file",
  version: "2.0"          // uvから展開
}
```

## 第6章：設計原則と責務分離

### 変容における責務分離

#### PromptVariableSource の責務
- **データ収集**: CLI引数とSTDINの統合
- **型付け**: 未加工データの構造化  
- **一時保管**: 変換処理までの材料保持

#### PromptVariables の責務
- **実体化**: ファイル読み込みとパス解決
- **構造化**: 動的変数の辞書構成
- **統合**: すべての変数の内部形式での統一

#### PromptParams の責務
- **変換**: 内部形式から外部API形式への変換
- **平坦化**: 複雑な構造の辞書への展開
- **契約**: 外部エンジンとの仕様遵守

### 型安全性の保証

```typescript
// 各段階での型による制約
type VariableTransformation = {
  input: PromptVariableSource;    // 未解決の材料
  process: PromptVariables;       // 解決済みの完成品
  output: PromptParams;           // 外部API適合形式
};

// 変換関数の型安全性
function transform(source: PromptVariableSource): PromptParams {
  const variables = createPromptVariables(source);  // Stage 1
  return createPromptParams(variables);             // Stage 2
}
```

### 拡張性の設計

#### 新しい変数型の追加
```typescript
// 新しいオプション型の追加例
interface ValidationOption {
  validateSchema?: boolean;
  strictMode?: boolean;
}

// 統合型への追加
interface PromptVariableSource {
  // ...existing options...
  
  // 新しいオプション型
  validateSchema?: boolean;
  strictMode?: boolean;
}
```

#### 変換ロジックの拡張
```typescript
// 新しい変換ロジックの追加
function createPromptVariables(source: PromptVariableSource): PromptVariables {
  return {
    // ...existing transformations...
    
    // 新しい変換ロジック
    validationLevel: source.validateSchema ? "strict" : "loose",
    processingMode: source.strictMode ? "strict" : "flexible"
  };
}
```

## 第7章：実装とアーキテクチャ

### 変容を支える要素

#### PromptVariablesFactory
```typescript
// 変容処理の中核クラス
class PromptVariablesFactory {
  create(source: PromptVariableSource, config: BreakdownConfig): PromptVariables {
    return {
      // ファイル処理
      ...this.processFileOptions(source),
      
      // パス解決
      ...this.resolvePathOptions(source, config),
      
      // 動的変数処理
      ...this.processDynamicVariables(source),
      
      // メタ情報生成
      ...this.generateMetaVariables(source, config)
    };
  }
}
```

#### 変換パイプライン
```typescript
// 段階的変換の実装
class VariableTransformationPipeline {
  transform(source: PromptVariableSource): PromptParams {
    // Stage 1: 材料 → 完成品
    const variables = this.factory.create(source, this.config);
    
    // Stage 2: 完成品 → 外部API形式
    return this.converter.toPromptParams(variables);
  }
}
```

### エラーハンドリング戦略

```typescript
// 段階別エラーハンドリング
class VariableTransformationError extends Error {
  constructor(
    public stage: 'source' | 'variables' | 'params',
    public reason: string,
    public context?: unknown
  ) {
    super(`[${stage}] ${reason}`);
  }
}

// 使用例
if (!source.fromFile && !source.stdinContent) {
  throw new VariableTransformationError(
    'source', 
    'No input source specified',
    { source }
  );
}
```

## エピローグ：変容の価値

この3段階の変容プロセスは、単なる技術的な変換ではありません。それぞれが**明確な責務**と**ドメインの意味**を持っています。

- **PromptVariableSource**: ユーザーの意図を受け取る「受信機」
- **PromptVariables**: アプリケーションの知識で補完する「加工場」  
- **PromptParams**: 外部世界との約束を守る「出荷場」

この設計により、Breakdown CLIは：
- **理解しやすい**: 各段階の責務が明確
- **拡張しやすい**: 新しい変数型や変換ロジックを容易に追加
- **保守しやすい**: 型安全性によるバグの早期発見
- **テストしやすい**: 各段階を独立してテスト可能

## 関連ドキュメント

### ドメイン設計
- [option_types.ja.md](./option_types.ja.md): オプション型のドメインストーリー
- [two_params_types.ja.md](./two_params_types.ja.md): DirectiveTypeとLayerTypeの詳細

### 実装詳細
- [app_factory.ja.md](../generic_domain/factory/app_factory.ja.md): PromptVariablesFactoryの実装
- [app_prompt.ja.md](../supporting_domain/template_management/app_prompt.ja.md): BreakdownPromptの使用方法

### 仕様参考
- [CLIコマンド](../interface/cli_commands.ja.md): コマンドライン引数の詳細仕様
- [processing-flow.ja.md](../generic_domain/system/overview/processing-flow.ja.md): 全体の処理フロー

---

**変容ストーリー設計**: 2025年1月  
**設計思想**: データの段階的変容による責務分離と型安全性の実現
