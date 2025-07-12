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
# Breakdown アプリケーション構造分析
# 生成日時: 2025-07-12
# 目的: main から標準出力までの処理フローと型構造の可視化

## 骨格判定結果
# 骨格の中心: runBreakdown → ParamsParser → handleTwoParams → TwoParamsPromptGenerator → stdout
# 何度も通る経路: Result型による戻り値処理、JSRパッケージ利用
# 距離判定基準: 
#   - 横軸（意味的な違い）: JSRパッケージ境界、ドメイン境界
#   - 縦軸（内部処理の深さ）: 実行ステップ数、変換処理の階層

application_skeleton:
  
  # レベル0: エントリーポイント（骨格の中心）
  entry_point:
    name: runBreakdown
    location: cli/breakdown.ts
    initializer: "runBreakdown()"
    args:
      - "args: string[]"
    return: "Result<void, BreakdownError>"
    description: "メインエントリーポイント、JSRパッケージのオーケストレーション"
    
  # レベル1: パラメータ解析（骨格の中心）
  parameter_parsing:
    name: ParamsParser
    location: "jsr:@tettuan/breakdownparams"
    initializer: "new ParamsParser()"
    args: 
      - "undefined"
      - "customConfig: CustomConfig"
    return: "ZeroParamsResult | OneParamsResult | TwoParamsResult | ErrorResult"
    description: "CLI引数を型安全に解析、パターンマッチング"
    
  # レベル2: ハンドラー分岐（骨格の中心）
  handlers:
    zero_params:
      name: handleZeroParams
      location: lib/cli/handlers/zero_params_handler.ts
      initializer: "handleZeroParams()"
      args:
        - "args: string[]"
        - "config: Record<string, unknown>"
        - "options: Record<string, unknown>"
      return: "void"
      description: "ヘルプ、バージョン表示"
      
    one_params:
      name: handleOneParams
      location: lib/cli/handlers/one_params_handler.ts
      initializer: "handleOneParams()"
      args:
        - "params: string[]"
        - "config: Record<string, unknown>"
        - "options: Record<string, unknown>"
      return: "Promise<void>"
      description: "init等の単一コマンド処理"
      
    two_params:
      name: twoParamsHandler
      location: lib/cli/handlers/two_params_handler.ts
      initializer: "twoParamsHandler()"
      args:
        - "params: string[]"
        - "config: Record<string, unknown>"
        - "options: Record<string, unknown>"
      return: "Promise<Result<void, TwoParamsHandlerError>>"
      description: "プロンプト生成メイン処理"

  # レベル3: Two Params内部処理（距離1: 意味的に近接）
  two_params_internal:
    orchestrator:
      name: TwoParamsOrchestrator
      location: lib/cli/handlers/two_params_handler.ts
      initializer: "new TwoParamsOrchestrator()"
      args: []
      return: "TwoParamsOrchestrator"
      description: "内部オーケストレーション"
      
    validator:
      name: TwoParamsValidator
      location: lib/cli/validators/two_params_validator.ts
      initializer: "new TwoParamsValidator()"
      args: []
      return: "TwoParamsValidator"
      description: "パラメータ検証"
      
    stdin_processor:
      name: TwoParamsStdinProcessor
      location: lib/cli/processors/two_params_stdin_processor.ts
      initializer: "new TwoParamsStdinProcessor()"
      args: []
      return: "TwoParamsStdinProcessor"
      description: "STDIN読み込み処理"
      
    variable_processor:
      name: TwoParamsVariableProcessor
      location: lib/cli/processors/two_params_variable_processor.ts
      initializer: "new TwoParamsVariableProcessor()"
      args: []
      return: "TwoParamsVariableProcessor"
      description: "変数処理"
      
    prompt_generator:
      name: TwoParamsPromptGenerator
      location: lib/cli/generators/two_params_prompt_generator.ts
      initializer: "new TwoParamsPromptGenerator()"
      args: []
      return: "TwoParamsPromptGenerator"
      description: "プロンプト生成"
      
    output_processor:
      name: TwoParamsOutputProcessor
      location: lib/cli/processors/two_params_output_processor.ts
      initializer: "new TwoParamsOutputProcessor()"
      args: []
      return: "TwoParamsOutputProcessor"
      description: "標準出力書き込み"

  # レベル4: プロンプト生成内部（距離2: JSRパッケージ境界を跨ぐ）
  prompt_generation_internal:
    factory:
      name: PromptVariablesFactory
      location: lib/factory/prompt_variables_factory.ts
      initializer: "PromptVariablesFactory.createWithConfig()"
      args:
        - "config: Record<string, unknown>"
        - "cliParams: PromptCliParams"
      return: "Result<PromptVariablesFactory, FactoryError>"
      description: "プロンプト変数ファクトリー生成"
      
    variables_builder:
      name: VariablesBuilder
      location: lib/builder/variables_builder.ts
      initializer: "new VariablesBuilder()"
      args: []
      return: "VariablesBuilder"
      description: "変数構築"
      
    prompt_adapter:
      name: PromptManagerAdapter
      location: lib/prompt/prompt_manager_adapter.ts
      initializer: "new PromptManagerAdapter()"
      args: []
      return: "PromptManagerAdapter"
      description: "BreakdownPromptとの接続"
      
    jsr_prompt:
      name: BreakdownPrompt
      location: "jsr:@tettuan/breakdownprompt"
      initializer: "generatePrompt()"
      args:
        - "path: PromptPath"
        - "variables: PromptVariables"
      return: "Result<PromptResult, PromptError>"
      description: "JSRパッケージによるプロンプト生成"

# 簡易な宣言構造
core_types:
  result_types:
    - name: Result
      structure: "Result<T, E>"
      description: "Generic Result type for error handling"
      
    - name: BreakdownError
      structure: "ConfigProfileError | ConfigLoadError | ParameterParsingError | TwoParamsHandlerError | OneParamsHandlerError | ZeroParamsHandlerError | UnknownResultType"
      description: "Discriminated union for breakdown errors"
      
    - name: ParamsResult
      structure: "ZeroParamsResult | OneParamsResult | TwoParamsResult | ErrorResult"
      description: "Discriminated union for parameter parsing results"
      
    - name: TwoParamsHandlerError
      structure: "InvalidParameterCount | InvalidDemonstrativeType | InvalidLayerType | StdinReadError | FactoryCreationError | FactoryValidationError | VariablesBuilderError | PromptGenerationError | OutputWriteError"
      description: "Complete discriminated union for two params errors"

  parameter_types:
    - name: PromptCliParams
      structure: "{ demonstrativeType: string, layerType: string, options: PromptCliOptions }"
      description: "CLI parameters for prompt generation"
      
    - name: ValidatedParams
      structure: "{ demonstrativeType: string, layerType: string }"
      description: "Validated parameters from TwoParamsValidator"
      
    - name: ProcessedVariables
      structure: "{ standardVariables: StandardVariables, customVariables: Record<string, string> }"
      description: "Processed variables from TwoParamsVariableProcessor"

  prompt_types:
    - name: PromptPath
      structure: "PromptPath"
      description: "Type-safe prompt file path"
      
    - name: PromptVariables
      structure: "{ toRecord(): Record<string, string> }"
      description: "Duck-typed variable handling interface"
      
    - name: PromptResult
      structure: "{ content: string }"
      description: "Generated prompt result"

  configuration_types:
    - name: ConfigProfileName
      structure: "ConfigProfileName"
      description: "Type-safe configuration profile name"
      
    - name: ParamsCustomConfig
      structure: "ParamsCustomConfig"
      description: "Custom configuration for parameter parsing"

# 初期引数パターンテスト結果
test_patterns:
  zero_params:
    command: "breakdown --version"
    flow: "runBreakdown → ParamsParser → handleZeroParams → showVersion → stdout"
    result: "Version display successful"
    
  one_params:
    command: "breakdown init"
    flow: "runBreakdown → ParamsParser → handleOneParams → initializeBreakdownConfiguration → stdout"
    result: "Initialization successful"
    
  two_params:
    command: "echo 'test' | breakdown to project"
    flow: "runBreakdown → ParamsParser → handleTwoParams → TwoParamsOrchestrator → [validation → stdin → variables → prompt → output] → stdout"
    result: "Silent completion (no output)"

# 距離判定による階層化
hierarchy_levels:
  level_0_core:
    description: "骨格の中心 - 最短経路"
    components: ["runBreakdown", "ParamsParser", "handlers"]
    
  level_1_processing:
    description: "距離1 - 意味的に近接した処理"
    components: ["TwoParamsOrchestrator", "processors", "validators", "generators"]
    
  level_2_integration:
    description: "距離2 - JSRパッケージ境界を跨ぐ"
    components: ["PromptVariablesFactory", "PromptManagerAdapter", "BreakdownPrompt"]
    
  level_3_infrastructure:
    description: "距離3 - インフラストラクチャ層"
    components: ["Deno.stdout", "File system", "Configuration files"]

# アーキテクチャの特徴
architecture_characteristics:
  design_patterns:
    - "Result Pattern (Totality principle)"
    - "Factory Pattern (PromptVariablesFactory)"
    - "Adapter Pattern (PromptManagerAdapter)" 
    - "Orchestrator Pattern (TwoParamsOrchestrator)"
    - "Builder Pattern (VariablesBuilder)"
    
  error_handling:
    - "Complete Discriminated Union Error Types"
    - "No exceptions, all errors as values"
    - "Type-safe error propagation"
    
  jsr_packages:
    - "@tettuan/breakdownconfig: Configuration management"
    - "@tettuan/breakdownparams: Parameter parsing" 
    - "@tettuan/breakdownprompt: Prompt generation"
    - "@tettuan/breakdownlogger: Logging (debug only)"
    
  separation_of_concerns:
    - "CLI orchestration vs domain logic"
    - "JSR package delegation"
    - "Infrastructure isolation in processors"
```


# 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、仕様の理解を進め、実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
