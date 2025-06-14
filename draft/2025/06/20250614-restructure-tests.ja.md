「プロジェクトの目的」に沿って、「足元のタスクとゴール」を完了させてください。
「チームの構成」を踏まえ、最大効率で「足元のタスクとゴール」を完了させてください。

# チームの構成
あなたは指揮官であり上司である。
各paneに部下がいるので、チームを立ち上げて進める。

`draft/2025/06/20250614-team.ja.md` に詳細の記載がある。チーム立ち上げ時に必ず読むこと。

# プロジェクトの目的

`Breakdown` アプリケーションを完成に導くことです。

## ブランチ
作業前にプロジェクトの目的に従い、ブランチを作成し、移動します。すでに移動済みなら、そのまま。

## 足元のタスクとゴール

`docs/breakdown/testing.ja.md` に従って、テストを再配置する。

### 1. 仕様の把握
Breakdown の設定と、BreakdownParams,BreakdownConfig を把握します。
`docs/breakdown/glosarry.ja.md` と、`docs/breakdown/index.ja.md`, `docs/breakdown/app_factory.ja.md` は、最低限読み込む。 

#### 順番の定義

1. CLIからBreakdownがargsを受け取る
2. Breakdown本体は、argsとBreakdownConfigのCustomConfigを BreakdownParamsへ渡す
  2-1. BreakdownConfigのCustomConfig を取得するためには、config用の $prefix　を渡したいが、まだ args しかない(`--config=$prefix`の結果がない)
  2-2. そこで先に `BreakdownConfigOption` が configオプションだけ取得する ($prefixを判明させる)
  2-3. $prefixをつけて、 BreakdownConfig へ $prefix を渡す
  2-4. BreakdownConfig を使って CustomConfig を取得する
  2-5. 取得した CustomConfig を BreakdownParams へ渡す
3. BreakdownParams の Result が返ってくる
4. 以降、zero,one,two の判定処理へ入る

### 2. フォルダ構成の把握

現在のフォルダ構成を、仕様に基づいて把握する。

### 3. 単体テストの再配置

0_architecture, 1_structure, 2_unit, の prefix 付きで、テストを実装と同じ階層へ配置する。（ 詳細は testing.ja.md を参照 ）

### 4. tests/ の整理

3で移動したテストを tests/ 配下から削除。
4_integration, 5_e2e テストは残す。

### 5. テストの修正

- `deno task ci` を実行し、テストを修正します。
- BreakdownLoggerを活用し、テストの中で問題をデバッグします。
- 不要なテストは削除し、必要なテストは新たに追加します。

### 足元のゴール

以下の3点です。

- ユニットテストまでは、実装と同じ階層に移動済
- test が全て pass すること
- `deno task ci` が成功すること

## サマリー: 状況把握と方針決め

- 目的: 常にプロジェクトの最新状況を把握するため
- 1状況あたり:
  - 文字数:100文字以内
  - 内容: 次の２点を完結に表現。1.成功してわかったこと, 2.失敗して避けるべきこと
- 保存先: `tmp/summary.md`
- 更新頻度: 
  - 追加: 部下からの報告で分かったことが増える都度
  - 圧縮: 単なる途中経過や矛盾点を消し込む
  - 圧縮頻度: 追加10回に1回程度

## タスクの進め方

- 進捗させるべきタスクは `tmp/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- テストは、 `deno task ci` を実行して、local で CIが通ることを確認してください。

すべてが完了したら、`tmp/completed.md` に完了したレポートを記録してください。

# 判明した事実
- zero,one,two以外のパラメータは追加しない（three paramsの実装は削除）
- BreakdownConfigやBreakdownParamをWrapする必要性はない

# 開始指示

タスクを適切に分解し、チーム全体のパフォーマンス向上が重要です。
あなたはそのためにメンバーとマネージャーを活躍させてください。
なにをすべきか（タスク分割や、状況整理、要件定義）が重要です。

プロジェクトの成功を祈ります。開始してください。


