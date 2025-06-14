「プロジェクトの目的」に沿って、「足元のタスクとゴール」を完了させてください。
「チームの構成」を踏まえ、最大効率で「足元のタスクとゴール」を完了させてください。

# チームの構成
あなたは指揮官であり上司である。
各paneに部下がいるので、チームを立ち上げて進める。

`drafts/2025/06/20250614-team.ja.md` に詳細の記載がある。チーム立ち上げ時に必ず読むこと。

# プロジェクトの目的

`Breakdown` アプリケーションを完成に導くことです。

## ブランチ
作業前にプロジェクトの目的に従い、ブランチを作成し、移動します。すでに移動済みなら、そのまま。

  `feature/breakdown-params-custom-config-integration`

## 足元のタスクとゴール
前提: BreakdownParamsが完成している。
タスク: `BreakdownParams` が期待する `CustomConfig` を、統合済みのBreakdownConfigのMergedConfigから発見し、セットする
ゴール: CustomConfigを利用した例が、意図した通りに動作すること。

1. 仕様の把握
Breakdown の設定と、BreakdownParams の CustomConfig を把握します。

- **混乱防止の情報**
  - BreakdownConfig は、設定のファイルを読み取る。そのため、Breakdownは設定ファイルを適切に用意し、その設定へ CustomConfig 相当の構造を再現する。
  - BreakdownParams の CustomConfig は、設定を受け取る

BreakdownParams の CustomConfig: https://github.com/tettuan/breakdownparams/blob/main/docs/custom_params.ja.md


2. 責務の分解
まず、CustomConfig を 独立した責務として、Breakdown 上に再現した型で設計します。BreakdownParams の まず、CustomConfig を import することは禁じます。

`設定 → 設定からCustomConfig構造を取得→CustomConfigの型へセット → BreakdownParams へCustomConfigを渡す` という使い方を想定します。

### 設定の構造

```user.ymlの例
.. 他の設定
- breakdowwn_params:
  - custom_config:  # interface CustomConfig に相当 
    - params: ..
    - options: ..
    - validation: ..
    - errorHandling: ..
.. 他の設定
```

3. ユースケースの追加（examplesの追加）
examples/ 配下へ、新しく CustomConfig 設定を含んだユースケースを追加します。
これは実装が外部から利用できることの証となるユースケースとなります。

4. tests/ の追加
テストファイルを tests/ へ、CustomConfig設定がある場合のテストを追加してください。 config には、custom configを使うことがわかるprefixを用いるべきでしょう。

テスト実装の際に、 `docs/tests.ja.md` を理解して行うこと。

BreakdownLoggerを有効活用し、LOG_KEY/LOG_LENGTH を使って、カスタム設定の問題把握に役立てます。

5. 実装の修正

仕様やテストに合わせ、必要な設定ファイルの追加を行います。
仕様は docs/* にあります。今回は docs/ の変更は禁止します。
必要な中間データは、プロジェクト直下の tmp/ 配下におきます。
進捗状況は、 tmp/progress.svg に記録します。グラフで各メンバーの可動効率を図示し、随時更新してください。

### 足元のゴール

以下の3点です。

- 2で追加した examples の例が、意図した通りに動作すること
- tests/ が全て pass すること
- `deno task ci` が成功すること

## サマリー: 状況把握と方針決め

以下の２点を完結に100文字以内でリスト化したファイルを、`tmp/summary.md` に作成してください。
- 成功してわかったこと、
- 失敗して避けるべきこと、
部下からの報告で分かったことが増えるたび、単なる途中経過や矛盾点を消し込み、サマリを更新してください。この作業も部下へ任せること。

## タスクの進め方

進捗させるべきタスクは `tmp/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
テストは、 `scripts/local_ci.sh` を実行して、local で CIが通ることを確認してください。

すべてが完了したら、`tmp/completed.md` に完了したレポートを記録してください。

では、プロジェクトの成功を祈ります。開始してください。


