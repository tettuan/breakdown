# 緊急修正指示書 - `--adaptation`,`--input`のテンプレートパス解決問題の修正

## 実装方針

`docs/breakdown/domain_core/prompt_template_path.ja.md` を実装反映する。
(1) フォルダPATH 決定
(2) FILE名決定
特に`--adaptation`,`--input`のエラーが examples/15,16で起きている。

**禁止事項**: `examples/*.sh`を変更してはならない。

作業着手前に、設計思想を理解する。
`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。[TwoParams型システム](docs/breakdown/domain_core/two_params_types.ja.md)の設計に従い、DirectiveTypeとLayerTypeの組み合わせによるパス解決を正しく機能させる必要がある。

実装のAI複雑性制御は `docs/breakdown/domain_core/ai-complexity-control_compact.ja.md` の原則に従い、最小限の修正で最大の効果を得ること。

テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
仕様は、用語集から探すこと。
`docs/breakdown/generic_domain/system/overview/glossary.ja.md`


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
3. ハードコーディングは禁止である。

### 2. 作業開始
4. テンプレートFILE名の決まり方を仕様や設計情報から調べる
5. 実装のテンプレートFILE名を調べる
6. `tmp/saved_example_results/*` に`examples/*.sh`実行ログがあるので15,16の `--input`, `--adaptation` について把握する
6. 「修正対象の内容」に対し、解決策の調査指示を端的に作成する
7. 調査指示を添えて、調査作業をワーカープールに割り当てる
8. 調査結果に基づき、背景や経緯を含めた修正指示を作成し、修正作業をワーカープールに割り当てる
9. 修正後に10のステップを再確認する
10. `LOG_LEVEL=debug deno task ci:dirty` を実行。
11. 新たな問題は `tmp/next_issue.md` へ記載し、 「2. 作業開始」を最初から実施する

**禁止事項**: examples/*.sh の変更は禁止。

#### 修正対象の内容

`````
## 15_input_parameter.sh - Input パラメータテスト
**Exit Code**: 0
**生成ファイル**: 5ファイル (output/input_parameter_test/)
- result_no_input.md
- result_input_project.md  
- result_input_issue.md
- result_short_form.md

**[WARN] 問題発見**: 
- --input=project 指定時に f_project.md が使用されない
- 常に f_task.md (デフォルト) が使用される
- 期待されるテンプレート選択動作が機能していない

## 16_adaptation_parameter.sh - Adaptation パラメータテスト
**Exit Code**: 0
**生成ファイル**: 5ファイル (output/adaptation_parameter_test/)
- result_no_adaptation.md
- result_strict.md
- result_agile.md
- result_detailed.md
- result_custom.md

**[WARN] 問題発見**:
- --adaptation=strict 指定時に f_task_strict.md が使用されない
- adaptationサフィックス付きテンプレートが無視される
- フォールバック動作により基本テンプレートが使用される

`````

#### 完了条件

1. `-i`,`-a` によるテンプレートファイル名の決定調査と修正が完了した
2. ハードコーディングが無くなった
3. `-a`,`-i`のPATH決定のテストが成功した
4. [実装のAI複雑性制御](`docs/breakdown/domain_core/ai-complexity-control_compact.ja.md`) の原則に従い、最小限のコード量で最大の効果を得ること。
5. `deno task ci:dirty` が完全に通過した: エラー0件達成


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
