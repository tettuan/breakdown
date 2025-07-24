# 緊急修正指示書 - local成功、remote github action エラー問題の修正

## 実装方針

ローカルのテストは全成功するが、GitHub Actionでエラーになるケースが増えた。
`--allow-net`で解消したものもあるが、残存するものもある。
考えられる原因をMac/Linux環境以外に求め、
・ .agent/ 配下が .gitignore されていることに起因
・ 作成順序ミス、前の実行で消えていない
といったプロセスに原因を求めて調査する。エラーテストへデバッグ出力を増やし、値やファイル存在の推移を追うこと。

作業着手前に、設計思想を理解する。
`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。
実装のAI複雑性制御は `docs/breakdown/domain_core/ai-complexity-control_compact.ja.md` の原則に従い、最小限の修正で最大の効果を得ること。


テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
他の`docs/breakdown/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

### 問題の背景

examples/実行結果より、以下の問題が確認された：
1. 全スクリプトは成功したが、リモートのGithubActionでエラーが生じた

[TwoParams型システム](docs/breakdown/domain_core/two_params_types.ja.md)の設計に従い、DirectiveTypeとLayerTypeの組み合わせによるパス解決を正しく機能させる必要がある。


### 最新のエラー

```
 deno test --allow-env --allow-write --allow-read --allow-run --allow-net
  shell: /usr/bin/bash -e {0}
Download https://jsr.io/@std/testing/meta.json
Download https://jsr.io/@std/testing/0.224.0_meta.json
Download https://jsr.io/@std/testing/0.224.0/bdd.ts
Download https://jsr.io/@std/testing/0.224.0/_test_suite.ts
Check file:///home/runner/work/breakdown/breakdown/lib/config/jsr_pattern_adapter.test.ts
Check file:///home/runner/work/breakdown/breakdown/lib/config/jsr_pattern_adapter_simple.test.ts
Check file:///home/runner/work/breakdown/breakdown/lib/domain/core/value_objects/directive_type_fromjsr.test.ts
Check file:///home/runner/work/breakdown/breakdown/lib/domain/core/value_objects/layer_type_fromjsr.test.ts
Check file:///home/runner/work/breakdown/breakdown/lib/factory/prompt_template_path_resolver_totality.test.ts
Check file:///home/runner/work/breakdown/breakdown/lib/types/type_factory_createfromjsr.test.ts
Check file:///home/runner/work/breakdown/breakdown/lib/types/type_factory_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/4_cross_domain/dynamic_pattern_generation_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/4_cross_domain/e2e/two_params_error_edge_cases_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/4_cross_domain/e2e/two_params_result_e2e_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/4_cross_domain/e2e/two_params_stdin_integration_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/integration/config_profile_switching_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/integration/directive_layer_types/tests/01_basic_integration_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/integration/jsr_integration/breakdown_config_params_integration_test.ts
Check file:///home/runner/work/breakdown/breakdown/tests/integration/jsr_integration/hardcode_elimination_test.ts
running 7 tests from ./lib/config/jsr_pattern_adapter.test.ts
JSRPatternAdapter - Basic creation and TypePatternProvider implementation ... ok (1ms)
JSRPatternAdapter - Valid value retrieval ... ok (0ms)
JSRPatternAdapter - Pattern object retrieval ... ok (0ms)
JSRPatternAdapter - AsyncConfigPatternProvider compatibility function ... ok (0ms)
JSRPatternAdapter - Factory function ... ok (0ms)
JSRPatternAdapter - DEFAULT_CUSTOM_CONFIG usage ... ok (0ms)
JSRPatternAdapter - Error handling ... ok (0ms)
running 2 tests from ./lib/config/jsr_pattern_adapter_simple.test.ts
JSRPatternAdapter - Basic operation with DEFAULT_CUSTOM_CONFIG ...
------- post-test output -------
Debug info: {
  initialized: true,
  hasConfigData: true,
  hasDirectivePattern: true,
  hasLayerTypePattern: true,
  cacheStatus: { directive: "cached", layer: "cached" },
  directivePattern: "^(to|summary|defect)$",
  layerTypePattern: "^(project|issue|task)$",
  validDirectives: [ "to", "summary", "defect" ],
  validLayers: [ "project", "issue", "task" ]
}
validateDirectiveType('to'): true
validateLayerType('project'): true
getValidDirectiveTypes(): [ "to", "summary", "defect" ]
getValidLayerTypes(): [ "project", "issue", "task" ]
----- post-test output end -----
  Dynamic generation of TwoParams_Result ...
    Can generate TwoParams_Result from configuration base ... ok (1ms)
  Dynamic generation of TwoParams_Result ... ok (1ms)
  Hardcode elimination verification ...
    DirectiveType/LayerType definitions are not hardcoded ... ok (3ms)
    Changing configuration files also changes allowed values ... ok (1ms)
  Hardcode elimination verification ... ok (5ms)
  Error handling ...
    Returns error for non-existent profile ... ok (1ms)
    Returns error when patterns are undefined ... ok (1ms)
  Error handling ... ok (2ms)
JSR Integration - BreakdownConfig + BreakdownParams ... ok (18ms)
running 1 test from ./tests/integration/jsr_integration/hardcode_elimination_test.ts
Hardcode elimination verification ...
  DirectiveType/LayerType array hardcode detection ...
    No hardcoded arrays exist in lib/domain/core/value_objects/ ... ok (7ms)
    Verification that deleted files do not exist ... ok (1ms)
  DirectiveType/LayerType array hardcode detection ... ok (8ms)
  Dynamic pattern provider verification ...
    PatternProvider dynamically retrieves patterns from configuration ... ok (0ms)
  Dynamic pattern provider verification ... ok (1ms)
  Configuration-driven verification in integration tests ...
    Different profiles use different patterns ... ok (10ms)
  Configuration-driven verification in integration tests ... ok (11ms)
Hardcode elimination verification ... ok (22ms)

 ERRORS 

E2E: Tier1 - Basic Two Params Command Execution => ./tests/4_cross_domain/e2e/two_params_result_e2e_test.ts:112:6
error: AssertionError: Values are not equal: Output should not be empty


    [Diff] Actual / Expected


-   false
+   true

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/0.224.0/assert_equals.ts:52:9)
    at file:///home/runner/work/breakdown/breakdown/tests/4_cross_domain/e2e/two_params_result_e2e_test.ts:164:7

E2E: Tier5 - Complete Integration Flow Validation => ./tests/4_cross_domain/e2e/two_params_result_e2e_test.ts:468:6
error: AssertionError: Values are not equal: Output should contain generated content


    [Diff] Actual / Expected


-   false
+   true

  throw new AssertionError(message);
        ^
    at assertEquals (https://jsr.io/@std/assert/0.224.0/assert_equals.ts:52:9)
    at file:///home/runner/work/breakdown/breakdown/tests/4_cross_domain/e2e/two_params_result_e2e_test.ts:528:7

 FAILURES 

E2E: Tier1 - Basic Two Params Command Execution => ./tests/4_cross_domain/e2e/two_params_result_e2e_test.ts:112:6
E2E: Tier5 - Complete Integration Flow Validation => ./tests/4_cross_domain/e2e/two_params_result_e2e_test.ts:468:6

FAILED | 78 passed (58 steps) | 2 failed (1s)

error: Test failed
Error: Process completed with exit code 1.

```

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。


## 実施内容

### 1. 前提理解
1. 資料を読んで、ドメイン設計と Totality を理解する。
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する。

### 2. 作業開始
3. ローカルとの違いを .gitignore やローカルファイルの事前存在に求め、調査する
4. テストへデバッグ出力を入れ、エラー箇所について調査する
5. エラー修正作業をワーカープールに割り当て、修正後に6のステップを再確認させる
6. `deno task ci:dirty` を実行。エラー → 「2. 作業開始」を最初から実施

#### 完了条件

1. [実装のAI複雑性制御](`docs/breakdown/domain_core/ai-complexity-control_compact.ja.md`) の原則に従い、最小限のコード量で最大の効果を得ること。
2. `deno task ci:dirty` が完全に通過した: エラー0件達成
3. PR作成したうえで、pushして Github action を実行し、エラー解消を確認する

# タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。


# 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、仕様の理解を進め、実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。



