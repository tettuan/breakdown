# プロジェクト: VariablesBuilderのTotality対応

現在の`lib/`配下の実装を全域性（Totality）による設計にリファクタリングする。部分関数による不安定性を排除し、型安全性を強化して、バグに強いコード設計を実現する。

今回は、`VariablesBuilder` を Totality 対応する。

`Totality` について、必ず `docs/breakdown/overview/totality.ja.md` を参照すること。
ビジネスドメイン情報は、 `docs/breakdown/index.ja.md` および `docs/breakdown/overview/glossary.ja.md` を必ず読むこと。
他の`docs/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## 実施内容

1. 資料を読んで、ドメインに基づいた Totality を理解する。
2. 理解した結果を `tmp/<branch_name>/` 配下に作成し、ドメイン情報として保持する。
3. `tmp/totality-prompt-variables-20250629-1130/*` に調査結果あるため、全て読む。
4. StdinVariableFactoryを作成する
5. 上記3の内容を踏まえ、`VariablesBuilder`が、*FactoryやPathResolverの構築した値型を受け取る構成にする
6. 上記5の結果、不要になったクラスや処理を一式削除する（関連するテストも削除する）
7. PromptVariablesFactoryとPromptAdapterで重複している箇所をごっそり削除する

## 完了条件

1. Totality に基づいて、VariablesBuilderの構築ができた

**テストは実施しなくて良い**

# タスクの進め方

- Git:
  - 現在のGitブランチが適切か判断する (see @instructions/git-workflow.md)
  - 作成が必要なら Git ブランチを作成し、移動する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- アサイン: サイクル段階に応じて、メンバーの役割を変更し最適アサイン。常時フル稼働を目指す。

### 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。

# 作業開始指示

まずチームを立ち上げます。
チーム全体のパフォーマンスが重要です。
ワーカープールマネージャーを活躍させ、部下であるゴルーチンをフル稼働させてください。
今なにをすべきか（タスク分割や、状況整理、要件定義）について、ワーカープールマネージャーが把握していることが重要です。
ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
