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
前提1: Breakdownが `--config=production` の値を args から取得し、BreakdownConfig に渡している。
前提2: 1で用いられるyaml設定の prefix を、BreakdownParams へ渡している。
タスク: 
  前提1にて、現在:BreakdownParamsから config オプション値を取得、変更後:Breakdown内部で独自クラス（BreakdownConfigOption）を作り、--config=$prefix,-c=$prefixの `$prefix` 値を取得するだけの責務を持たせる。 (存在しない場合はundefined)
ゴール: --config=$prefxを使って、ユースケースが成功すること

### 1. 仕様の把握
Breakdown の設定と、BreakdownParams,BreakdownConfig を把握します。
`docs/breakdown/glosarry.ja.md` と、`docs/breakdown/index.ja.md`, `docs/breakdown/app_factory.ja.md` は、最低限読み込む。 


- **混乱防止の情報**
  - BreakdownConfig は、設定のファイルを読み取る。そのため、Breakdownは設定ファイルを適切に用意し、その設定へ CustomConfig 相当の構造を再現する。
  - BreakdownParams の CustomConfig は、設定を受け取る

BreakdownParams の CustomConfig: https://github.com/tettuan/breakdownparams/blob/main/docs/custom_params.ja.md

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

### 2. 責務の分解

- Breakdown:
  - 本体処理
    - BreakdownParams 結果を使って処理内容を振り分ける
  - BreakdownConfigOption: args から `-c=$prefix`, `--config=$prefix` のみを取得する。ない時は uncefined
    - $prefix: [a-z\-_]+
- BreakdownConfig: yml 設定ファイルから設定値を取得
- BreakdownParams: args を分解してバリデート結果を返す


#### 設定の構造

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

#### 設定ファイルの構造

```
- app.yml
- user.yml
- production-app.yml
- production-user.yml
- validation-app.yml
- validation-user.yml
- spec-app.yml
- spec-user.yml
```

### 3. ユースケースの追加（examplesの追加）
examples/ 配下へ、新しいユースケースを追加します。
これは実装が外部から利用できることの証となるユースケースとなります。
もし既存の examples/ があれば、追加する必要はありません。

#### 追加対象

- `production-user.yml` を用いた設定に、 BreakdownParams の CustomConfig設定 が存在すること
  - ex:
    - cli: `breakdown find system -c=production`
    - CustomConfig設定: `find` と `system` が two パラメータで許容されている


### 4. tests/ の追加
テストファイルを tests/ へ、CustomConfig設定がある場合のテストを追加してください。 config には、custom configを使うことがわかるprefixを用いるべきでしょう。

テスト実装の際に、 `docs/tests.ja.md` を理解して行うこと。

BreakdownLoggerを有効活用し、LOG_KEY/LOG_LENGTH を使って、カスタム設定の問題把握に役立てます。

### 5. 実装の修正

- 仕様やテストに合わせ、必要な設定ファイルの追加を行います。
- 仕様は docs/* にあります。今回は docs/ の変更は禁止します。
- 必要な中間データは、プロジェクト直下の tmp/ 配下におきます。
- 進捗状況は、 tmp/progress.svg に記録します。グラフで各メンバーの可動効率を図示し、随時更新してください。

### 足元のゴール

以下の3点です。

- 3で追加した examples の例が、意図した通りに動作すること
- tests/ が全て pass すること
- `deno task ci` が成功すること

## サマリー: 状況把握と方針決め

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
- テストは、 `scripts/local_ci.sh` を実行して、local で CIが通ることを確認してください。

すべてが完了したら、`tmp/completed.md` に完了したレポートを記録してください。

# 判明した事実
- zero,one,two以外のパラメータは追加しない（three paramsの実装は削除）
- BreakdownConfigやBreakdownParamをWrapする必要性はない

# 開始指示

タスクを適切に分解し、チーム全体のパフォーマンス向上が重要です。
あなたはそのためにメンバーとマネージャーを活躍させてください。
なにをすべきか（タスク分割や、状況整理、要件定義）が重要です。

プロジェクトの成功を祈ります。開始してください。


