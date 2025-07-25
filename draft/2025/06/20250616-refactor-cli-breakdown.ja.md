「プロジェクトの目的」に沿って、「足元のタスクとゴール」を完了させてください。
「チームの構成」を踏まえ、最大効率で「足元のタスクとゴール」を完了させてください。

# プロジェクトの目的

`Breakdown` アプリケーションを完成に導くことです。

## ブランチ

`main` での作業は禁止。

**作業前に**: 
プロジェクトの目的に従い、ブランチを作成し、移動します。(すでに移動済みなら、そのまま。)

# チームの構成
あなたは指揮官であり上司である。
各paneに部下がいるので、チームを立ち上げて進める。

`draft/2025/06/20250614-team.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。

# プロジェクトの実行

## タスクとゴール

信じて良い前提: BreakdownConfig, BreakdownParams, BreakdownPrompt が優秀で、信頼できる
タスク: 「アーキテクチャー」指示に従い、breakdown の一連の流れを、BreakdownConfig, BreakdownParams, BreakdownPrompt へ依存させる
ゴール: Breakdown本体は、BreakdownConfig, BreakdownParams, BreakdownPrompt へ依存し、同じ実装を独自に持たない

### 信頼して依存し、パフォーマンスを引き出すパッケージ
- BreakdownConfig: 
  - JSR: https://jsr.io/@tettuan/breakdownconfig
- BreakdownParams: 
  - JSR: https://jsr.io/@tettuan/breakdownparams
- BreakdownPrompt: 
  - JSR: https://jsr.io/@tettuan/breakdownprompt

## CLI実装のアウトライン

start 

1. パラメータから config prefix 取得
2. BreakdownConfig を prefix 付きで呼び出す（ない時は無し）
3. BreakdownParams に args を渡して信頼する
4. BreakdownParamsから結果を受け取り、判定する
5. zero,one,twoに応じた処理分岐
5-1. zero,oneの説明は省略。調べて。
6. two は、STDIN取得し、PATH解決する
7. BreakdownPrompt へ、BreakdownParamsから得た結果、STDIN、PATH情報を変数化して渡す
8. BreakdownPrompt の変換結果を受け取る
9. そのまま返す

end!

### 難易度

依存することが難課題なのは理解しています。きっと、エントリーポイントから他者を頼りたくないし、問題をハンドリングしたい衝動にかられるでしょう。でもその方向は、誤りです。

正しいのは、BreakdownParams へ移譲し、頼ることです。
BreakdownParams が出来ない部分のみを、Breakdown本体が担います。ConfigPrefixとSTDIN解釈は、BreakdownParams が使えない典型例です（でも、それ以外は任せられます。だって、args を渡せば済むんだもの）。

再実装するつもりで、全て最適化するために、書き直してください。

### 必読資料

- アーキテクチャ `docs/breakdown/architecture.ja.md` に照らして判断する。
- 用語集は `docs/breakdown/glossary.ja.md` にある。

### 完了条件

以下の4点です。

- BreakdownConfig, BreakdownParams, BreakdownPrompt へ依存し、機能をフル活用している
- lib/, tests/ のテストが全て pass する
- `deno task ci` が成功する
- 存在する examples/* を0から順番に実行した結果、最後までエラーなく完了する

## タスクの進め方

- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- サイクル段階に応じて、メンバーの役割を変更し最適アサイン。常時フル稼働を目指す。

### 伝達係: 状況把握と方針伝達
伝達係が行う「サマリー」の伝達とは、次のことです。

- 1状況あたり:
  - 文字数:100文字以内
  - 内容: 次の２点を完結に表現。1.成功してわかったこと, 2.失敗して避けるべきこと
- 保存先: `tmp/summary.md`
  - 最初に指揮官がリセットしておく
- 更新頻度: 
  - 追加: 部下からの報告で分かったことが増える都度
  - 圧縮: 単なる途中経過や矛盾点を消し込む
  - 圧縮頻度: 追加10回に1回程度


### エラー対応

- 総司令官とマネージャーが決める役。メンバーは実行役。
  - エラー前比で、2段階x2広い範囲で仕様理解する。
  - 仕様理解に必要な作業自体はメンバーへ依頼する。
- マネージャーと総司令官で議論して、対応を決める

今回の変更は、破壊的であることを理解し、ちょっとしたエラーで日和ることなく邁進して。


### 進捗更新

- 進捗させるべきタスクは `tmp/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- テストは、 `deno task ci` を実行して、local で CIが通ることを確認してください。

すべてが完了したら、`tmp/completed.md` に完了したレポートを記録してください。

# 過去に判明した事実
- zero,one,two以外のパラメータは追加しない（three paramsの実装は削除）
- BreakdownConfigやBreakdownParamをWrapする必要はない
  - BreakdownParamを拡張したEnhancedParamsParserクラス開発は行わない
    - 機能が不足していると考えた部分は、報告すること
- ConfigのPrefixは、最小限の実装で判定・取得する
- args は不要
  - 方向性:
    最初のconfig prefix取得 と、STDINの処理だけ、BreakdownParamsを使えない。そこだけ分割移譲したクラスが、Breakdown本体にあればよいだろう。
- BreakdownParamsが優秀。フォールバック実装は誤り。


# 開始指示

まずチームを立ち上げます。
タスクを適切に分解し、チーム全体のパフォーマンス向上が重要です。
あなたはそのためにメンバーとマネージャーを活躍させてください。

パフォーマンス最大化のためには、今なにをすべきか（タスク分割や、状況整理、要件定義）が重要です。
今やることに応じて、部下には適切な役割を割り当ててください。

プロジェクトの成功を祈ります。開始してください。

