# プロジェクト: Breakdown全体のドメイン駆動設計と全域性（Totality）のディレクトリ単位の完成

実装方針:
現在の`lib/`配下の実装をドメイン駆動設計と全域性（Totality）による大幅リファクタリングした。これから、テストがpassするよう修正する。ドメイン領域の明確な理解に基づき、型安全性を強化して、骨格が通った芯の強いテスト構造を実現し、テストが通過するよう「実施内容」に従い「スコープ」を定めながら修正する。

`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。

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

## スコープの選定

1. 「ディレクトリ一覧」の上から1つを選ぶ。([DIR]とする)
2. `deno check [DIR]`, `deno test [DIR]`, `deno lint [DIR]`, `deno fmt [DIR]` を行う
2-1. 全て成功: 次のディレクトリを選ぶ
2-2. エラー発生: [DIR]を「スコープDIR」とする
3. 2-2の「スコープDIR」を実施スコープとする

## 実施内容

### 1. 前提理解
1. 資料を読んで、ドメイン設計と Totality を理解する。
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する。

### 2. 作業開始
3. 「スコープの選定」を行い、「スコープDIR」を取得する。
4. 以下のチェックコマンドを順次行い、成功か失敗かで次のステップを変える。
4-1. `deno check [DIR]` : 成功→4-2,失敗→5
4-2. `deno test [DIR]` : 成功→4-3,失敗→5
4-3. `deno lint [DIR]` : 成功→4-4,失敗→5
4-4. `deno fmt [DIR]`  : 成功→3,失敗→5
5. エラー修正作業をワーカープールに割り当て、修正後に4のステップを再確認させる
6. 3で選定した「ディレクトリ一覧」の全ての「スコープDIR」で4の全てが成功するまで、再び3に戻り、修正を行う

### 3. 作業レビュー → 差し戻し | 完了

7. `deno task ci:dirty lib/` を実行し、passするまでテストを完成させる

#### 完了条件

1. **残エラーの完全修正**: 「ディレクトリ一覧」全てで 実施内容.4 が成功した
2. `deno task ci:dirty lib/` が完全に通過した: エラー0件達成


# タスクの進め方

- Git:
  - 現在のGitブランチが適切か判断する (see @instructions/git-workflow.md)
  - 作成が必要なら Git ブランチを作成し、移動する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。


## ディレクトリ一覧

```

### tests/ 配下のディレクトリ構造

```
lib/domain/generic/template_management/value_objects
lib/breakdown/schema/to/task
lib/breakdown/schema/to/project
lib/breakdown/schema/to/issue
lib/breakdown/schema/find/bugs
lib/domain/supporting/workspace_management
lib/domain/supporting/template_management
lib/domain/supporting/initialization
lib/domain/generic/template_management
lib/domain/generic/system
lib/domain/generic/factory
lib/domain/core/value_objects
lib/domain/core/prompt_variable_generation
lib/domain/core/aggregates
lib/breakdown/schema/to
lib/breakdown/schema/find
lib/workspace/path
lib/types/defaults
lib/supporting/initialization
lib/prompt/variables
lib/infrastructure/templates
lib/factory/0_architecture
lib/domain/templates
lib/domain/supporting
lib/domain/generic
lib/domain/errors
lib/domain/core
lib/domain/application
lib/cli/validators
lib/cli/processors
lib/cli/orchestrators
lib/cli/initialization
lib/cli/handlers
lib/cli/generators
lib/cli/config
lib/breakdown/schema
lib/breakdown/prompts
lib/breakdown/.obsidian
lib/application/templates
lib/application/services
lib/application/initialization
lib/workspace
lib/validator
lib/types
lib/templates
lib/supporting
lib/prompt
lib/processor
lib/migration
lib/io
lib/infrastructure
lib/helpers
lib/factory
lib/domain
lib/config
lib/commands
lib/cli
lib/builder
lib/breakdown
lib/application
```

# 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、仕様の理解を進め、実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。



