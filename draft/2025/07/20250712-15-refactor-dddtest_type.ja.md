# プロジェクト: Breakdown全体のドメイン駆動設計と全域性（Totality）の融合完成

実装方針:
現在の`lib/`配下の実装をドメイン駆動設計と全域性（Totality）による設計で、大幅にリファクタリングする。ドメイン領域の明確な理解に基づき、型安全性を強化して、骨格が通った芯の強いコード設計を実現する。

`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/two_params_types.ja.md.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。

テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
他の`docs/breakdown/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

## 実施内容


## 実施内容

1. 資料を読んで、ドメイン設計と Totality を理解する。
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する。
2-1. `two_params_types.ja.md` について入念に理解する
3. 「main処理」から順次実装を調べ、修正が必要なファイルをリスト化する。 （`「修正対象」を参考にする`）
4. リストに基づき、実装をドメイン設計とTotalityに基づいて完成させる
4-1. 不要な実装は削除し、重複コードを排除する
4-2. 隣接するファイルが使われているか調べる。特に類似名称のファイルは疑う。
4-3. メイン処理のプロスをたどっても呼びだされていない実装は、削除する。
5. 旧式の実装は全て取り除き、ドメイン駆動設計と全域性の似合わせて全面的に柿生庵そ
6. 変更した実装に合わせてテストファイルを改修する
7. `deno test  <task>` で、作成したファイルをテストする （allowフラグつけて）
8. 3で作成したリストの全てが完了するまで、再び4に戻り、実装修正を行う

### 全ての変更が完了した後

1. `deno task ci:dirty` を通して、passするまでテストを完成させる

## 完了条件

1. ドメイン駆動設計とTotalityに基づいた改修が完了した
2. `deno task ci:dirty` がエラー0件で通った


# タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。


## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。


## 修正対象
```
# Breakdown Application Skeleton Analysis
# Generated: 2025-07-12
# Purpose: アプリケーション全体の骨格と重要なTYPE宣言をYAML化

application:
  name: breakdown
  type: CLI_tool
  architecture: domain_driven_design
  principle: totality_principle

# メインフロー（骨格の中心）
main_flow:
  entry_point: mod.ts
  
  # 骨格の中心経路（最短距離）
  core_path:
    - mod.ts:16 → cli/breakdown.ts:runBreakdown()
    - ConfigPrefixDetector.detect() → ConfigProfileName.create()
    - ConfigLoader.loadBreakdownConfig() → ParamsCustomConfig.create()
    - ParamsParser.parse() → result分岐
    - handleTwoParams/OneParams/ZeroParams → プロンプト出力

  # 分岐パターン（異常系含む）
  branches:
    zero_params:
      handler: handleZeroParams
      flow: args → options解析 → help/version/usage表示
      end_point: showHelp/showVersion/showUsage
      
    one_params:
      handler: handleOneParams
      flow: params → "init"判定 → initializeBreakdownConfiguration
      end_point: workspace初期化完了
      
    two_params:
      handler: handleTwoParams
      flow: params → TwoParamsOrchestrator → プロンプト生成 → 標準出力
      end_point: プロンプトテンプレート標準出力
      
    error:
      handler: error分岐
      flow: result.error → error message → エラー終了
      end_point: エラーメッセージ出力

# 距離判定による階層構造（3階層）
hierarchy:
  # 第1階層：骨格の中心（横軸距離：0）
  layer1_core:
    components:
      - name: runBreakdown
        type: function
        args: "args: string[]"
        return: "Promise<Result<void, BreakdownError>>"
        role: メインエントリーポイント
        
      - name: ConfigPrefixDetector
        type: class
        initializer: detect()
        args: "args: string[]"
        return: "string | null"
        role: 設定プロファイル検出
        
      - name: ParamsParser
        type: class
        initializer: "new ParamsParser()"
        args: "customConfig: undefined | CustomConfig"
        return: ParamsParser
        role: CLI引数解析
        
      - name: Result
        type: "type alias"
        structure: "Result<T, E> = { ok: true; data: T } | { ok: false; error: E }"
        role: エラーハンドリング基盤

  # 第2階層：主要処理（横軸距離：1）
  layer2_main_processors:
    components:
      - name: TwoParamsOrchestrator
        type: class
        initializer: execute()
        args: "params: string[], config: Record<string, unknown>, options: Record<string, unknown>"
        return: "Promise<Result<void, TwoParamsHandlerError>>"
        role: 2パラメータ処理オーケストレーション
        
      - name: ConfigProfileName
        type: class
        initializer: create()
        args: "value: string | null | undefined"
        return: "Result<ConfigProfileName, ConfigProfileNameError>"
        role: 設定プロファイル名管理
        
      - name: ConfigLoader
        type: class
        initializer: loadBreakdownConfig()
        args: "profileName: string, workingDir: string"
        return: "Promise<Result<Record<string, unknown>, Error>>"
        role: 設定ファイル読み込み
        
      - name: DirectiveType
        type: class
        initializer: create()
        args: "result: TwoParams_Result, profile?: ConfigProfileName"
        return: DirectiveType
        role: 処理方向型（to/summary/defect）
        
      - name: LayerType
        type: class
        initializer: create()
        args: "result: TwoParams_Result, pattern?: TwoParamsLayerTypePattern"
        return: LayerType
        role: 階層型（project/issue/task）

  # 第3階層：詳細処理（横軸距離：2）
  layer3_detail_processors:
    components:
      - name: TwoParamsValidator
        type: class
        initializer: validate()
        args: "params: string[]"
        return: "Promise<Result<ValidationResult, unknown>>"
        role: 2パラメータバリデーション
        
      - name: TwoParamsStdinProcessor
        type: class
        initializer: process()
        args: "config: BreakdownConfigCompatible, options: Record<string, unknown>"
        return: "Promise<Result<string, StdinError>>"
        role: STDIN処理
        
      - name: TwoParamsVariableProcessor
        type: class
        initializer: processVariables()
        args: "options: Record<string, unknown>, stdinContent: string"
        return: "Result<PromptVariables, VariableError[]>"
        role: プロンプト変数処理
        
      - name: TwoParamsPromptGenerator
        type: class
        initializer: generatePrompt()
        args: "config: Record<string, unknown>, params: ValidatedParams, options: Record<string, unknown>, variables: PromptVariables"
        return: "Promise<Result<string, PromptError>>"
        role: プロンプト生成
        
      - name: TwoParamsOutputProcessor
        type: class
        initializer: writeOutput()
        args: "content: string"
        return: "Promise<Result<void, TwoParamsHandlerError>>"
        role: 出力処理（標準出力のみ）

# 重要な型宣言の簡易構造
type_declarations:
  result_types:
    - name: Result
      structure: "Result<T, E> = { ok: true; data: T } | { ok: false; error: E }"
      description: "Generic Result type for totality principle"
      
    - name: ParamsResult
      structure: "TwoParamsResult | OneParamsResult | ZeroParamsResult | ErrorResult"
      description: "Discriminated union for parameter parsing results"
      
    - name: BreakdownError
      structure: "ConfigProfileError | ConfigLoadError | ParameterParsingError | TwoParamsHandlerError | OneParamsHandlerError | ZeroParamsHandlerError | UnknownResultType"
      description: "Main application error types"

  parameter_types:
    - name: TwoParams_Result
      structure: "{ type: 'two'; demonstrativeType: string; layerType: string; options: Record<string, unknown> }"
      description: "Two parameter parsing result from BreakdownParams"
      
    - name: OneParamsResult
      structure: "{ type: 'one'; params: string[]; options: Record<string, unknown> }"
      description: "One parameter parsing result"
      
    - name: ZeroParamsResult
      structure: "{ type: 'zero'; options: Record<string, unknown> }"
      description: "Zero parameter parsing result"

  domain_types:
    - name: DirectiveType
      structure: "Smart constructor class with value: string, profile: ConfigProfileName"
      description: "Processing direction (to/summary/defect)"
      
    - name: LayerType
      structure: "Smart constructor class with value: string, validatedByPattern: TwoParamsLayerTypePattern"
      description: "Hierarchical layer (project/issue/task)"
      
    - name: ConfigProfileName
      structure: "Smart constructor class with value: string, isDefault: boolean"
      description: "Configuration profile management"

  variable_types:
    - name: PromptVariableSource
      structure: "{ directive?: string; layer?: string; inputFile?: string; destinationPath?: string; schemaFile?: string; stdinContent?: string; userVariables?: Record<string, string>; metadata?: SourceMetadata }"
      description: "Stage 1: Raw materials for prompt variables"
      
    - name: PromptVariablesVO
      structure: "Smart constructor class with readonly variables: PromptVariable[]"
      description: "Stage 2: Validated prompt variables"
      
    - name: PromptVariables
      structure: "{ toRecord(): Record<string, string> }"
      description: "Interface for prompt variables duck typing"

  error_types:
    - name: ValidationError
      structure: "Discriminated union with kind-based error types"
      description: "Validation specific errors"
      
    - name: PathError
      structure: "InvalidPath | PathNotFound | DirectoryNotFound | PermissionDenied | PathTooLong"
      description: "Path operation errors"
      
    - name: TwoParamsHandlerError
      structure: "InvalidParameterCount | InvalidDemonstrativeType | InvalidLayerType | StdinReadError | FactoryCreationError | FactoryValidationError | VariablesBuilderError | PromptGenerationError | OutputWriteError"
      description: "Two parameters handler specific errors"

# 初期引数パターンと処理経路
argument_patterns:
  zero_args:
    examples:
      - "breakdown --version"
      - "breakdown --help"
    flow: "args → ParamsParser → ZeroParamsResult → handleZeroParams → showVersion/showHelp"
    end_goal: "ヘルプ・バージョン情報表示"
    
  one_arg:
    examples:
      - "breakdown init"
    flow: "args → ParamsParser → OneParamsResult → handleOneParams → initializeBreakdownConfiguration"
    end_goal: "ワークスペース初期化"
    
  two_args:
    examples:
      - "echo '<messy_something>' | breakdown summary project -o=<project_summary.md>"
      - "breakdown to project -i=<project_summary.md> -o=<project_dir>"
      - "breakdown to issue -i=<project_summary.md> -o=<issue_dir>"
      - "breakdown to task -i=<issue.md> -o=<tasks_dir>"
      - "tail -100 '<error_log_file>' | breakdown defect project -o=<project_defect.md>"
    flow: "args → ParamsParser → TwoParamsResult → handleTwoParams → TwoParamsOrchestrator → プロンプト生成"
    end_goal: "プロンプトテンプレート標準出力"

# JSRパッケージ依存関係
jsr_packages:
  - name: "@tettuan/breakdownconfig"
    version: "^1.1.4"
    role: "設定管理ドメイン"
    exports: "BreakdownConfig, ConfigLoader"
    
  - name: "@tettuan/breakdownparams"
    version: "^1.0.7"
    role: "パラメータ解析ドメイン"
    exports: "ParamsParser, TwoParams_Result, OneParamsResult, ZeroParamsResult"
    
  - name: "@tettuan/breakdownprompt"
    role: "プロンプト生成ドメイン"
    exports: "PromptGenerator, PromptParams, PromptVariables"
    
  - name: "@tettuan/breakdownlogger"
    role: "技術基盤ドメイン（デバッグ専用）"
    exports: "BreakdownLogger"
    usage_restriction: "テストファイルでのみ使用"

# 設計原則
design_principles:
  totality_principle: "全ての関数は全域関数（例外を投げない）"
  result_pattern: "明示的エラーハンドリングにResult<T, E>を使用"
  smart_constructors: "型安全性を保証するSmart Constructorパターン"
  discriminated_unions: "型安全なパターンマッチングのため識別可能合併型を使用"
  immutability: "構築後の値オブジェクトは不変"
  domain_driven_design: "コアドメインと支援ドメインの明確な分離"
  orchestration_pattern: "パッケージ間のオーケストレーションに責務を限定"
  
# ゴール地点
goal:
  description: "プロンプトテンプレートを標準出力するまで"
  output_destination: "stdout（標準出力）"
  output_format: "プロンプトテンプレート（Markdown）"
  file_write_policy: "禁止（CLI実行者が > でリダイレクト）"
```


# 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、仕様の理解を進め、実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
