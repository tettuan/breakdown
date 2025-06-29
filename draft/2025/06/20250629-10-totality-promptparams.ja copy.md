# プロジェクト: Totality

現在の`lib/`配下の実装を全域性（Totality）による設計にリファクタリングする。部分関数による不安定性を排除し、型安全性を強化して、バグに強いコード設計を実現する。

今回は、`PromptVariables` を Totality 対応する。

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
3. PromptVariablesの役割を、アプリケーション全体の位置付けで理解する（どこで使われ、何をしたら役割を終えるのか）
3-1. アプリ全体のなかでBreakdownPromptへPromptParamsを渡すまでだと理解する
3-2. PromptParamsへ渡す値は、複数の経路から入手することを理解する。OptionsはBreakdownParamsのTwoParamsResult経由、STDINはBreakdown本体経由、file系は組み立てをBreakdown本体のFactoryが実施した結果経由、となっている。
4. cli/breakdown.ts および lib/ 配下を調べ、 PromptVariables が受け入れるべき型を定めて全域性の対象を洗い出す
4. PromptVariablesが受け入れるべき型のリストと、参考実装を行なった例文を作成する（ `tmp/<branch_name>/` 配下）

## 完了条件

1. Totality に基づいて、PromptVariablesの受け入れる実装案ができた

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
