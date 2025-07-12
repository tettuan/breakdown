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
# Breakdown Application Skeleton Analysis 20250712
# アプリケーションの重要なTYPE宣言と重要なフローのYAML化

# 骨格判断結果
skeleton_analysis:
  central_backbone:
    description: "最短で最後まで通る経路（骨格の中心）"
    path: "runBreakdown → handleTwoParams → TwoParamsOrchestrator → PromptManagerAdapter → stdout"
    
  frequent_paths:
    description: "何度も通る経路（骨格）"
    paths:
      - "ConfigProfileName.create → BreakdownConfig loading"
      - "ParamsParser.parse → parameter validation"
      - "Result type pattern matching"
      - "Error handling through Result<T, E>"

# 距離判定
distance_analysis:
  horizontal_axis:
    description: "意味的な違いによる近接距離"
    core_distance_0:
      - "runBreakdown"
      - "handleTwoParams" 
      - "TwoParamsOrchestrator"
      - "PromptManagerAdapter"
    supporting_distance_1:
      - "ConfigProfileName"
      - "ParamsParser"
      - "DirectiveType"
      - "LayerType"
    infrastructure_distance_2:
      - "Result types"
      - "Error handling"
      - "File system operations"
      - "STDIN processing"

  vertical_axis:
    description: "実行ステップ数による内部処理の深さ"
    layer_1_surface: ["Entry points", "Handler delegation"]
    layer_2_orchestration: ["Parameter processing", "Factory creation"]
    layer_3_domain: ["Type validation", "Path resolution", "Variable processing"]

# 3階層YAML構造
application_skeleton:

  # 階層1: 表面層（Entry Points & Handler Delegation）
  layer_1_entry_points:
    
    # 距離0: 中心骨格
    core_entry:
      - name: runBreakdown
        initializer: runBreakdown()
        args: "args: string[]"
        return: "Result<void, BreakdownError>"
        description: "メインエントリーポイント - 全体のオーケストレーション"
        
      - name: handleTwoParams  
        initializer: handleTwoParams()
        args: "params: string[], config: Record<string, unknown>, options: Record<string, unknown>"
        return: "Result<void, TwoParamsHandlerError>"
        description: "2パラメータケースのハンドラー"

    # 距離1: 支援的エントリー
    supporting_entry:
      - name: handleOneParams
        initializer: handleOneParams()
        args: "params: string[], config: Record<string, unknown>, options: Record<string, unknown>"
        return: "Promise<void>"
        description: "1パラメータケース（主にinit）"
        
      - name: handleZeroParams
        initializer: handleZeroParams()
        args: "args: string[], config: Record<string, unknown>, options: Record<string, unknown>"
        return: "void"
        description: "0パラメータケース（help, version）"

  # 階層2: オーケストレーション層（Parameter Processing & Factory Creation）
  layer_2_orchestration:
    
    # 距離0: 中心骨格
    core_orchestration:
      - name: TwoParamsOrchestrator
        initializer: "new TwoParamsOrchestrator()"
        args: "outputProcessor?: TwoParamsOutputProcessor"
        return: "TwoParamsOrchestrator"
        description: "2パラメータ処理の内部オーケストレーター"
        
      - name: ParamsParser
        initializer: "new ParamsParser()"
        args: "undefined, customConfig: ParamsCustomConfig | undefined"
        return: "ParamsParser"
        description: "コマンドライン引数の解析"

      - name: PromptVariablesFactory
        initializer: "createWithConfig()"
        args: "config: Record<string, unknown>, cliParams: PromptCliParams"
        return: "Result<PromptVariablesFactory, PromptVariablesFactoryError>"
        description: "プロンプト変数の3段階変容を管理するファクトリー"

    # 距離1: 支援的オーケストレーション  
    supporting_orchestration:
      - name: ConfigPrefixDetector
        initializer: "ConfigPrefixDetector.detect()"
        args: "args: string[]"
        return: "string | null"
        description: "設定プレフィックスの検出"
        
      - name: ParamsCustomConfig
        initializer: "ParamsCustomConfig.create()"
        args: "config: Record<string, unknown>"
        return: "EnumResult<ParamsCustomConfig>"
        description: "カスタム設定の作成と検証"

  # 階層3: ドメイン層（Type Validation & Path Resolution & Variable Processing）
  layer_3_domain:
    
    # 距離0: 中心骨格
    core_domain:
      - name: DirectiveType
        initializer: "DirectiveType.create()"
        args: "result: TwoParams_Result, profile?: ConfigProfileName"
        return: "DirectiveType"
        description: "処理方向型（to, summary, defect等）"
        
      - name: LayerType
        initializer: "LayerType.create()" 
        args: "result: TwoParams_Result, pattern?: TwoParamsLayerTypePattern"
        return: "LayerType"
        description: "階層型（project, issue, task等）"

      - name: PromptManagerAdapter
        initializer: "generatePrompt()"
        args: "template: PromptPath, variables: PromptVariables"
        return: "Result<PromptResult, ProcessingError>"
        description: "@tettuan/breakdownpromptパッケージへのアダプター"

      - name: VariablesBuilder
        initializer: "new VariablesBuilder()"
        args: "なし"
        return: "VariablesBuilder"
        description: "プロンプト変数のビルダー"

    # 距離1: 支援的ドメイン
    supporting_domain:
      - name: ConfigProfileName
        initializer: "ConfigProfileName.create()"
        args: "name: string"
        return: "Result<ConfigProfileName, ValidationError>"
        description: "設定プロファイル名の型安全な管理"
        
      - name: TwoParamsValidator
        initializer: "validate()"
        args: "params: string[]"
        return: "Result<ValidatedParams, unknown>"
        description: "2パラメータのバリデーション"

      - name: TwoParamsStdinProcessor
        initializer: "process()"
        args: "config: BreakdownConfigCompatible, options: Record<string, unknown>"
        return: "Result<string, ProcessingError>"
        description: "STDIN入力の処理"

      - name: TwoParamsVariableProcessor
        initializer: "processVariables()"
        args: "options: Record<string, unknown>, stdinData: string"
        return: "Result<PromptVariables, VariableError[]>"
        description: "変数の処理と変換"

    # 距離2: インフラストラクチャー
    infrastructure_domain:
      - name: Result
        initializer: "ok() / error()"
        args: "data: T / error: E"
        return: "Result<T, E>"
        description: "Totality原則に基づくエラーハンドリング"
        
      - name: TwoParamsOutputProcessor
        initializer: "writeOutput()"
        args: "data: unknown"
        return: "Result<void, OutputWriteError>"
        description: "標準出力への書き込み処理"

# 初期引数別のフロー分析
parameter_flow_analysis:
  
  zero_params:
    pattern: "breakdown --version"
    flow:
      - "runBreakdown(args)"
      - "ParamsParser.parse(args) → ZeroParamsResult"
      - "handleZeroParams(args, config, options)"
      - "showVersion() → stdout"
    skeleton_components: ["runBreakdown", "ParamsParser", "handleZeroParams"]
    
  one_param:
    pattern: "breakdown init"
    flow:
      - "runBreakdown(args)"
      - "ParamsParser.parse(args) → OneParamsResult"
      - "handleOneParams(params, config, options)"
      - "initializeBreakdownConfiguration()"
    skeleton_components: ["runBreakdown", "ParamsParser", "handleOneParams"]
    
  two_params:
    pattern: "breakdown to project"
    flow:
      - "runBreakdown(args)"
      - "ConfigPrefixDetector.detect(args)"
      - "ConfigProfileName.create(prefix)"
      - "loadBreakdownConfig(profile, cwd)"
      - "ParamsCustomConfig.create(config)"
      - "ParamsParser.parse(args) → TwoParamsResult"
      - "handleTwoParams(params, config, options)"
      - "TwoParamsOrchestrator.execute()"
      - "  ├─ TwoParamsValidator.validate()"
      - "  ├─ TwoParamsStdinProcessor.process()"
      - "  ├─ TwoParamsVariableProcessor.processVariables()"
      - "  ├─ TwoParamsPromptGenerator.generatePrompt()"
      - "  │   ├─ PromptVariablesFactory.createWithConfig()"
      - "  │   ├─ VariablesBuilder.build()"
      - "  │   └─ PromptManagerAdapter.generatePrompt()"
      - "  └─ TwoParamsOutputProcessor.writeOutput() → stdout"
    skeleton_components:
      core: ["runBreakdown", "handleTwoParams", "TwoParamsOrchestrator", "PromptManagerAdapter"]
      supporting: ["ConfigProfileName", "ParamsParser", "DirectiveType", "LayerType"]

# 異常系フロー
error_flow_analysis:
  
  config_error:
    trigger: "Invalid configuration"
    flow:
      - "ConfigProfileName.create() → Result.error"
      - "Return BreakdownError"
    termination: "Early termination with error message"
    
  validation_error:
    trigger: "Invalid parameters"
    flow:
      - "ParamsParser.parse() → ErrorResult"
      - "Return ParameterParsingError"
    termination: "Early termination with validation message"
    
  prompt_generation_error:
    trigger: "Template not found or variable error"
    flow:
      - "PromptManagerAdapter.generatePrompt() → Result.error"
      - "Map to PromptGenerationError"
      - "Return TwoParamsHandlerError"
    termination: "Error handling with context"

# 簡易な宣言構造まとめ
simplified_type_structures:
  
  result_types:
    - name: "Result"
      structure: "Result<T, E>"
      description: "Generic Result type for error handling"
      
    - name: "ParamsResult"
      structure: "ZeroParamsResult | OneParamsResult | TwoParamsResult | ErrorResult"
      description: "Discriminated union for parameter parsing results"
      
    - name: "BreakdownError"
      structure: "ConfigProfileError | ConfigLoadError | ParameterParsingError | TwoParamsHandlerError | OneParamsHandlerError | ZeroParamsHandlerError | UnknownResultType"
      description: "Complete error types following Totality principle"

  core_value_objects:
    - name: "DirectiveType"
      structure: "class DirectiveType { private constructor(result: TwoParams_Result) }"
      description: "Smart Constructor for processing direction (to, summary, defect)"
      
    - name: "LayerType"
      structure: "class LayerType { private constructor(result: TwoParams_Result) }"
      description: "Smart Constructor for hierarchy layer (project, issue, task)"
      
    - name: "ConfigProfileName"
      structure: "class ConfigProfileName { private constructor(name: string) }"
      description: "Smart Constructor for configuration profile name"

  factory_types:
    - name: "PromptVariablesFactory"
      structure: "PromptVariableSource → PromptVariables → PromptParams"
      description: "3-stage transformation factory for prompt variables"
      
    - name: "VariablesBuilder"
      structure: "Builder pattern for PromptVariables collection construction"
      description: "Builder for constructing PromptVariables collections"

  adapter_types:
    - name: "PromptManagerAdapter"
      structure: "Duck Typing adapter for @tettuan/breakdownprompt package"
      description: "Adapter for external prompt generation package"

  processing_types:
    - name: "TwoParamsOrchestrator"
      structure: "Internal orchestrator with composition pattern"
      description: "Orchestrates the complete two-params processing flow"
      
    - name: "TwoParamsVariableProcessor"
      structure: "Domain service for variable processing"
      description: "Handles variable processing and transformation"

# まとめ
summary:
  skeleton_identification:
    description: "What is repeated frequently and what goes through to the end in the shortest path"
    core_backbone: "runBreakdown → handleTwoParams → TwoParamsOrchestrator → PromptManagerAdapter → stdout"
    frequent_components: ["Result type handling", "ConfigProfileName", "ParamsParser", "DirectiveType/LayerType"]
    
  distance_classification:
    core_distance_0: "Main flow components that are always used"
    supporting_distance_1: "Supporting components used frequently" 
    infrastructure_distance_2: "Infrastructure components used as foundation"
    
  totality_principle:
    description: "All error cases handled explicitly through Result types"
    implementation: "No exceptions thrown, all failures represented as values"
    benefit: "Type-safe error handling throughout the application"
```


# 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、仕様の理解を進め、実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
