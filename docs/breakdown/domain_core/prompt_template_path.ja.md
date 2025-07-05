# プロンプトパス決定ドメインのストーリー

## プロローグ：パス決定の使命と現実

Breakdown CLIにおいて、AIが理解すべきプロンプトテンプレートファイルを**正確に特定する**ことは、システムの成功を左右する重要なドメインです。このドメインは、ユーザーの意図とシステムの設定から、唯一無二のプロンプトファイルパスを導き出す責務を担います。

**重要な現実**：プロンプトテンプレートファイルが実在するかは、ユーザーの準備次第です。コマンドライン引数の付与は容易ですが、プロンプトテンプレートファイルの準備には相当な手間がかかります。この非対称性により、**パスは正確に生成されるが、実際のファイルが存在しない**という状況が頻発します。

そのため、このドメインは**100%正確なパス生成**を保証し、問題の切り分けを明確にする責務を担います。パス生成ロジックに疑念を持たれることなく、ユーザーは「ファイルの準備」という本来の問題に集中できるのです。

## 第1章：ドメインの価値提案

このドメインは、プロンプトファイルの多様性（処理目的・対象階層・適応タイプの3軸）と実行時の動的決定要求に対応するために生まれました。

### 準備の非対称性への対応

- **コマンド実行**：`breakdown to task --adaptation=strict` → 数秒で完了
- **プロンプト準備**：適切なプロンプトテンプレートファイルの作成 → 数時間から数日

この非対称性により、ユーザーは「パスが間違っているのか、ファイルが存在しないのか」という切り分けに時間を消費してしまいます。

### 価値提案：確実性による問題の明確化

- **100%正確なパス生成**：同じ入力からは必ず同じ結果
- **明確なエラーメッセージ**：パス生成の正確性を疑わせない情報提供
- **問題の切り分け支援**：「パスは正確、ファイルの準備が必要」という明確な判断材料

## 第2章：ドメインのユビキタス言語

### コアエンティティ: PromptTemplatePathResolver

このドメインの**主人公**は、プロンプトファイルの物理的位置を決定する専門家です。設定値とコマンドライン引数を統合し、ファイルシステムの現実と照らし合わせながら、適切なプロンプトテンプレートパスを算出します。パス計算・検証・フォールバック処理を担い、各プロンプト生成要求ごとに作動します。

### 値オブジェクト群: パス構成要素

**DemonstrativeType**: ユーザーの「何をしたいか」（to/summary/defect）を表現し、プロンプトディレクトリの第1階層を決定する**意図の表現**です。

**LayerType**: ユーザーの「どの粒度で作業するか」（project/issue/task）を表現し、プロンプトディレクトリの第2階層を決定する**作業範囲の表現**です。

**AdaptationType**: ユーザーの「どのような特性のプロンプトを使うか」を表現し、プロンプトファイル名のサフィックスを決定する**個性の表現**です。`--adaptation`オプションから生成され、未指定時はundefinedとなります。

**FromLayerType**: 「どの階層からの変換か」を表現し、プロンプトファイル名のプレフィックスを決定する**変換元の表現**です。`--input`オプションまたは`fromFile`からの推定により確定します。

## 第3章：ドメインサービスの協働

## 第3章：パス決定プロセスの物語

### ドメインシナリオ: 3つの幕からなる決定劇

**第1幕：基盤の構築** - 外部設定（`app_prompt.base_dir`）と内部ルール（パラメータ妥当性）を統合し、プロンプトファイルが存在すべき**論理的な場所**を決定します。

**第2幕：個性の付与** - プロンプトファイルに**唯一の身元**を与えます。起点階層と適応タイプにより、システム内での一意性を確保します。

**第3幕：現実との対峙** - **最も重要な幕**。論理的に完璧なパスが生成されても、**ファイルの実在は別問題**です。

```typescript
// 現実確認とパス生成の正確性保証
const exists = fileSystem.exists(fullPath);
if (exists) {
  return new PromptTemplatePath(fullPath, PathStatus.Found);
} else {
  const errorMessage = `パスは正確に生成されました: ${fullPath}\n` +
                      `しかし、このファイルは存在しません。\n` +
                      `プロンプトテンプレートファイルの準備が必要です。`;
  
  const fallbackPath = fallbackStrategy.resolve(directoryPath, fromLayerType);
  return new PromptTemplatePath(fallbackPath, PathStatus.Fallback, errorMessage);
}
```

**ドメインの意味**: **パス生成の正確性を疑わせない**明確なメッセージを提供し、ユーザーは本来の問題（プロンプトテンプレートファイルの準備）に集中できます。

## 第5章：ドメインのライフサイクル

### パス決定の生命周期

```
[誕生] CLI引数解析 → PathResolutionContextの生成
  ↓
[成長] 値オブジェクト群の構築 → ドメイン知識の集約  
  ↓
[活動] PromptTemplatePathResolverの実行 → 決定ロジックの実行
  ↓
[成熟] パス文字列の生成 → 他ドメインへの価値提供
  ↓
[継承] PromptVariablesFactoryでの利用 → 次のドメインへの引き継ぎ
```

### 決定材料の生態系

#### 設定材料（Configuration Ecosystem）
```typescript
interface ConfigurationContext {
  baseDirectory: string;    // app_prompt.base_dir（生息地の基盤）
  workingDirectory: string; // cwd（実行環境の現在地）
}
```
- **性質**: システム全体で共有される環境変数的存在
- **スコープ**: アプリケーション起動時から終了まで不変
- **影響範囲**: 全てのパス決定処理に影響

#### パラメータ材料（Parameter Ecosystem）  
```typescript
interface ParameterContext {
  demonstrativeType: DemonstrativeType;  // ユーザーの意図（主指令）
  layerType: LayerType;                  // ユーザーの対象（副指令）  
  adaptation?: string;                   // ユーザーの特化要求（個性）
  fromInput?: string;                    // ユーザーの起点指定（明示）
  fromFile?: string;                     // ユーザーの起点暗示（推定源）
}
```
- **性質**: コマンド実行ごとに異なる動的要素
- **スコープ**: 単一のコマンド実行ライフサイクル
- **影響範囲**: 当該実行でのパス決定のみ

#### 環境材料（Environment Ecosystem）
```typescript
interface EnvironmentContext {
  fileSystem: FileSystemService;    // 物理的現実（存在確認者）
  pathValidator: PathValidator;     // 論理的妥当性（検証者）
  fallbackStrategy: FallbackStrategy; // 代替策（救済者）
}
```
- **性質**: 実行時の外部環境に依存する不確定要素
- **スコープ**: ファイルシステムの状態に連動
- **影響範囲**: パス検証とフォールバック処理

## 第4章：実装とドメイン境界

### 確実性を保証する実装方針

**パス生成の100%確実性**を実現するため、決定論的アルゴリズム、明確なエラーメッセージ、段階的検証、詳細なログ出力を採用します。

### 他ドメインとの境界

**上流境界**: CLI引数解析ドメインから`PathResolutionContext`を受け取り、コマンドライン引数を値オブジェクトに変換します。

**下流境界**: プロンプト変数生成ドメインに`PromptTemplatePath`を提供し、テンプレートファイルの物理的位置を伝達します。

### 実用的な使用パターン

```bash
# 基本的なパス決定（ファイルが存在する場合）
breakdown to summary project
# → 成功: /prompts/to/summary/f_project.md

# 適応タイプを指定したパス決定（ファイルが存在しない場合）
breakdown to summary project --adaptation=detailed
# → エラー: パスは正確に生成されました: /prompts/to/summary/f_project_detailed.md
#          しかし、このファイルは存在しません。プロンプトテンプレートファイルの準備が必要です。
```

### エラーハンドリングの責務：確実性の保証

```typescript
enum PathResolutionErrorType {
  // パス生成ロジックの問題（発生確率：0%を目指す）
  InvalidParameterCombination = "INVALID_PARAMETER_COMBINATION",
  BaseDirectoryNotFound = "BASE_DIRECTORY_NOT_FOUND", 
  
  // ファイル準備の問題（発生確率：高い、ユーザーの責任範囲）
  TemplateFileNotFound = "TEMPLATE_FILE_NOT_FOUND",
  FallbackExhausted = "FALLBACK_EXHAUSTED"
}
```

**エラーメッセージの設計方針**：
- **パス生成の正確性を明示**：「パスは正確に生成されました」を必ず含める
- **問題の所在を明確化**：技術的問題 vs ファイル準備問題の区別
- **次のアクションを提示**：ユーザーが取るべき具体的な行動を示す

  
    const identity = this.assignIdentity(foundation, context);
    
    // 第3幕：現実対峙
    return this.checkReality(identity);
  }

  private buildFoundation(context: PathResolutionContext): FoundationResult {
    const baseDir = this.configService.getPromptBaseDirectory();
    const directory = `${baseDir}/${context.demonstrativeType}/${context.layerType}`;
    
    return {
      directoryPath: directory,
      isValid: this.validateParameterCombination(context.demonstrativeType, context.layerType)
    };
  }

  private assignIdentity(foundation: FoundationResult, context: PathResolutionContext): IdentityResult {
    // FromLayerTypeの決定ロジック
    const fromLayerType = context.inputOption 
      ? context.inputOption 
      : this.layerDetector.detectFromFile(context.fromFile);

    // ファイル名の構築ロジック  
    const baseFileName = `f_${fromLayerType}`;
    const fileName = context.adaptation
      ? `${baseFileName}_${context.adaptation}.md`
      : `${baseFileName}.md`;

    return {
      fullPath: `${foundation.directoryPath}/${fileName}`,
      fromLayerType,
      adaptation: context.adaptation
    };
  }

  private checkReality(identity: IdentityResult): PromptTemplatePathResult {
    if (this.fileSystem.exists(identity.fullPath)) {
      return {
        path: identity.fullPath,
        status: PathResolutionStatus.Found,
        metadata: { fromLayerType: identity.fromLayerType, adaptation: identity.adaptation }
      };
    }

    // フォールバック戦略の実行
    const fallbackPath = this.fallbackStrategy.resolveFallback(identity);
    return {
      path: fallbackPath,
      status: PathResolutionStatus.Fallback,
      metadata: { fromLayerType: identity.fromLayerType, adaptation: identity.adaptation }
    };
  }
}
```

### 具体的な使用シナリオ

#### シナリオ1: 標準的なパス決定
```typescript
// ユーザー入力: breakdown to task -f issue.md
const context: PathResolutionContext = {
  demonstrativeType: "to",
  layerType: "task", 
  fromFile: "issue.md",
  adaptation: undefined
};

const result = pathResolver.resolve(context);
// → "/prompts/to/task/f_issue.md"
```

#### シナリオ2: 適応タイプを含むパス決定
```typescript
// ユーザー入力: breakdown summary project --adaptation=strict
const context: PathResolutionContext = {
  demonstrativeType: "summary",
  layerType: "project",
  fromFile: undefined,
  inputOption: "project",  // --input project
  adaptation: "strict"
};

const result = pathResolver.resolve(context);
// → "/prompts/summary/project/f_project_strict.md"
```

#### シナリオ3: フォールバック発生シナリオ
```typescript
// 存在しないファイルへの要求
const context: PathResolutionContext = {
  demonstrativeType: "defect",
  layerType: "task",
  fromFile: "complex_task.md",
  adaptation: "experimental"  // 存在しない適応タイプ
};

const result = pathResolver.resolve(context);
// → "/prompts/defect/task/f_task.md" (デフォルトにフォールバック)
// → status: PathResolutionStatus.Fallback
```

## 第7章：ドメイン境界と協働関係

### アーキテクチャにおけるドメインの位置

```
[CLIパラメータ解析ドメイン]
         ↓ PathResolutionOption
[プロンプトパス決定ドメイン] ← 本ドメイン
         ↓ PromptTemplatePath
[プロンプト変数生成ドメイン]
         ↓ PromptVariables  
[プロンプト生成ドメイン]
         ↓ GeneratedPrompt
[出力処理ドメイン]
```

### 責務の明確な分離

#### 本ドメインの専管事項
- **プロンプトテンプレートファイルパスの決定**：論理的計算から物理的パスへ
- **PathResolutionOptionの解釈**：`adaptation`を含む設定の具体化
- **ファイル存在確認とフォールバック**：現実世界との整合性確保

#### 他ドメインとの協働関係

**上流ドメイン（CLIパラメータ解析）**との関係：
- **受け取るもの**: `PathResolutionOption`、コマンドライン引数
- **提供するもの**: なし（一方向の依存）
- **協働の性質**: 純粋な消費者関係

**下流ドメイン（プロンプト変数生成）**との関係：
- **受け取るもの**: なし（一方向の依存）  
- **提供するもの**: `PromptTemplatePath`文字列
- **協働の性質**: 純粋な提供者関係

**横断的サービス**との関係：
- **BreakdownConfig**: 設定値の参照（`app_prompt.base_dir`）
- **FileSystemService**: ファイル存在確認
- **LayerDetectionService**: `fromFile`からの階層推定

### ドメインの独立性保証

```typescript
// ドメイン境界の明確化
interface PathResolutionDomainService {
  // 外部ドメインからの入力インターフェース
  resolve(option: PathResolutionOption, context: CommandContext): PromptTemplatePath;
  
  // 内部実装（外部から隠蔽）
## エピローグ：確実性の守護者としての価値

このプロンプトパス決定ドメインは、Breakdown CLIにおける**確実性の守護者**です。ユーザーの意図を正確に解釈し、システムの設定と調和させ、現実のファイルシステムと整合性を保つという複雑で重要な責務を担っています。

### ドメインの核心価値：確実性による問題解決の効率化

1. **100%正確なパス生成**: 同じ入力からは必ず同じ結果を生成し、疑念を排除
2. **明確な問題の切り分け**: 技術的問題とファイル準備問題を明確に区別
3. **効率的なエラーハンドリング**: パス生成の正確性を前提とした建設的なエラーメッセージ
4. **創造的作業への集中支援**: ユーザーはプロンプトテンプレートの作成に専念可能

### 現実世界での価値：準備コストの非対称性への対応

**コマンド実行（秒）** vs **プロンプト準備（時間/日）**という現実的な制約の中で、このドメインは技術的な疑念を完全に排除することで、ユーザーの貴重な時間を創造的な作業に向けることを可能にします。

このドメインにより、Breakdown CLIは**ユーザーの意図を正確に理解し**、**適切なプロンプトテンプレートを確実に選択**し、**AIエージェントに最適な指示を提供**することができるのです。そして最も重要なのは、ユーザーが技術的な疑念を持つことなく、創造的で価値のある作業に集中できる環境を提供することです。

## 関連ドキュメント

- [option_types.ja.md](./option_types.ja.md): PathResolutionOptionの型定義とストーリー
- [prompt_variables.ja.md](./prompt_variables.ja.md): プロンプト変数生成ドメイン（本ドメインと連携）



