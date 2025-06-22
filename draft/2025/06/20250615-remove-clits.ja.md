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

## 足元のタスクとゴール

前提: Breakdown本体が,BreakdownParamsを使わず独自実装している
タスク: breakdown のCLIパラメータ、CLIオプションの判定ロジックを全て削除する
ゴール: BreakdownParamsへの移譲によって、lib/cli/*.ts を使った箇所を動作させる

削除候補:
- executeCommand: 未使用？ BreakdownParams と重複
- lib/cli/breakdown.ts:
  - VALID_OPTIONS: BreakdownParams がバリデートする
  - VALID_INPUT_TYPES:  BreakdownParams がバリデートする
  - parseCustomVariables: 未使用？ BreakdownParams と重複
- args.ts: BreakdownParams と重複
- cli/breakdown.ts
  - getCanonicalOptionName: BreakdownParams と重複
  - parseArgs: BreakdownParams と重複
  - enhancedPreprocessCommandLine: BreakdownParams と重複
  - PREDEFINED_CONFIGS: ユーザーの任意定義をハードコーディングしている
  - VALID_OPTIONS: BreakdownParams がバリデートする, BreakdownParams と重複
  - CommandOptions:  BreakdownParams がバリデートする, BreakdownParams と重複
  - ArgumentError: BreakdownParams がバリデートする, BreakdownParams と重複

リファクタ候補:
- cli/breakdown.ts: BreakdownParams を使わず、独自実装になっている、BreakdownParams と重複

### BreakdownParams を使う

JSR: https://jsr.io/@tettuan/breakdownparams を最新化
資料: https://github.com/tettuan/breakdownparams/tree/main

```usege
import { ParamsParser } from 'jsr:@tettuan/breakdownparams@1.0.0';

const parser = new ParamsParser();

// Parse arguments
const result = parser.parse(Deno.args);

// Type-safe handling with discriminated unions
switch (result.type) {
  case 'zero':
    // No parameters, only options
    if (result.options.help) {
      console.log('Display help message');
    }
    if (result.options.version) {
      console.log('Display version');
    }
    break;

  case 'one':
    // Single parameter with demonstrative type
    console.log(`Command: ${result.demonstrativeType}`);
    if (result.demonstrativeType === 'init') {
      console.log('Initialize project');
    }
    break;

  case 'two':
    // Two parameters with full semantic information
    console.log(`Demonstrative Type: ${result.demonstrativeType}`);
    console.log(`Layer Type: ${result.layerType}`);
    if (result.options.from) {
      console.log(`Input file: ${result.options.from}`);
    }
    break;

  case 'error':
    // Comprehensive error information
    console.error(`Error: ${result.error.message}`);
    console.error(`Code: ${result.error.code}`);
    console.error(`Category: ${result.error.category}`);
    break;
}
```

### 難易度

lib/cli/*.ts は、現在の実装の多くで利用されています。
削除の難易度は高いです。
その分、入念に確認を行い、段階的な削除・削減が求められます。
問題に遭遇したときは、必ず資料を読み、アーキテクチャに照らして判断してください。

### 資料

以下は最初に読み込むこと。

- アーキテクチャ `docs/breakdown/architecture.ja.md` に照らして判断する。
- 用語集は `docs/breakdown/glossary.ja.md` にある。


### 完了条件

以下の4点です。

- 削除候補が全て削除されている（代わりの独自実装もされず、BreakdownParamsのParamsParserを使っている）
- lib/, tests/ のテストが全て pass する
- `deno task ci` が成功する
- 存在する examples/* を0から順番に実行した結果、最後までエラーなく完了する

## タスクの進め方

- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- サイクル段階に応じて、メンバーの役割を変更し最適アサイン。常時フル稼働を目指す。

### サマリー: 状況把握と方針決め
サマリー役が行う「サマリー」とは、次のことです。

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

# 開始指示

まずチームを立ち上げます。
タスクを適切に分解し、チーム全体のパフォーマンス向上が重要です。
あなたはそのためにメンバーとマネージャーを活躍させてください。

そのために、なにをすべきか（タスク分割や、状況整理、要件定義）が重要です。

プロジェクトの成功を祈ります。開始してください。

