# 緊急修正指示書 - Workingdir+Basedirをbase_dirだけ使う箇所問題の修正

## 実装方針

テンプレートパスの決定ロジックと設定ファイルの項目とCWDの存在が、複雑化している。
これらを修正し、1つのロジックに集約する。working_dir + app_prompt.base_dir, working_dir + app_schema.base_dir によって、場所が決まる。

作業着手前に、設計思想を理解する。
`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。
[TwoParams型システム](docs/breakdown/domain_core/two_params_types.ja.md)の設計に従い、DirectiveTypeとLayerTypeの組み合わせによるパス解決を正しく機能させる必要がある。
`docs/breakdown/domain_core/prompt_template_path.ja.md` を用いてテンプレートPATH構築を把握する。
実装のAI複雑性制御は `docs/breakdown/domain_core/ai-complexity-control_compact.ja.md` の原則に従い、最小限の修正で最大の効果を得ること。


テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
他の`docs/breakdown/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

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
3. "base_dir"だけ使う箇所を実装から洗い出す
4. working_dir + base_dir を使うように変更案を考え、指示文章を作成する
5. 指示文章を添えて、修正作業をワーカープールに割り当てる
6. `LOG_LEVEL=debug deno task ci:dirty` を実行。
7. 新たな問題は `tmp/next_issue.md` へ記載し、 「2. 作業開始」を最初から実施する


#### 完了条件

1. `working_dir + base_dir`に実装が統一されている
2. `base_dir` 単体の利用箇所が無くなっている
3. ハードコーディングが無くなっている
4. [実装のAI複雑性制御](`docs/breakdown/domain_core/ai-complexity-control_compact.ja.md`) の原則に従い、最小限のコード量で最大の効果を得る案になっている。
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

続いて、仕様の理解を進め、調査・修正案の作成と実施内容に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。



