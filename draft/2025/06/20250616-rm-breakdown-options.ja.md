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
タスク: アーキテクチャに従い、breakdown のCLIパラメータ、CLIオプションのBreakdown本体ない部での判定ロジックを全て削除する
ゴール: BreakdownParamsへの移譲によって、lib/cli/*.ts を使った箇所を動作させる

削除: args を直接解析する箇所。（ConfigPrefixのみ許可。他は全て BreakdownParams (ParamsParse) を通して parse 後の値を受け取る。 ）
削除例:
```
  // Extract options and their values
  while (i < args.length) {
    let arg = args[i];
    
    // Map short options to long options
    if (arg === "-h") {
      arg = "--help";
    }
    if (arg === "-v") {
      arg = "--version";
    }
    if (arg === "-f") {
      arg = "--from";
    }
    if (arg === "-o") {
      arg = "--destination";
    }
    if (arg === "-i") {
      arg = "--input";
    }
    if (arg === "-c") {
      arg = "--config";
    }
    if (arg === "-a") {
      arg = "--adaptation";
    }
    
    // Handle equals format for short options
    if (arg.startsWith("-") && arg.includes("=") && arg.length > 2) {
      const [option, value] = arg.split("=", 2);
      if (option === "-f") arg = `--from=${value}`;
      if (option === "-o") arg = `--destination=${value}`;
      if (option === "-i") arg = `--input=${value}`;
      if (option === "-c") arg = `--config=${value}`;
      if (option === "-a") arg = `--adaptation=${value}`;
    }
    
    optionArgs.push(arg);
    i++;
  }


  // Extract positional arguments (command and parameter)
  while (i < args.length && !args[i].startsWith("-")) {
    let arg = args[i];
    if (arg === "find") {
      arg = "defect"; // Workaround for find command
    }
    if (arg === "bugs") {
      arg = "task"; // Workaround for bugs parameter
    }
    positionalArgs.push(arg);
    i++;
  }


```

OKの例:
```
import { ParamsParser } from 'jsr:@tettuan/breakdownparams@1.0.3';

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



### BreakdownParams を使う

JSR: https://jsr.io/@tettuan/breakdownparams を最新化
資料: https://github.com/tettuan/breakdownparams/


### 難易度

cli/breakdown.ts はエントリーポイントで利用されています。
このためか、Claudeが "args を解析する「引力」" が強いためか、コードが混乱します。
しかし、この引力に逆らって、BreakdownParams を四天王として、自分の分身である強力な味方だと認識し、頼ってください。

これが難しい課題なのは理解しています。きっと、エントリーポイントから他者を頼りたくないし、問題をハンドリングしたい衝動にかられるでしょう。でもその方向は、誤りです。

正しいのは、BreakdownParams へ移譲し、頼ることです。
BreakdownParams が出来ない部分のみを、Breakdown本体が担います。ConfigPrefixとSTDIN解釈は、BreakdownParams が使えない典型例です（でも、それ以外は任せられます。だって、args を渡せば済むんだもの）。

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
- BreakdownParamsが優秀。フォールバック実装は誤り。


# 開始指示

まずチームを立ち上げます。
タスクを適切に分解し、チーム全体のパフォーマンス向上が重要です。
あなたはそのためにメンバーとマネージャーを活躍させてください。

そのために、なにをすべきか（タスク分割や、状況整理、要件定義）が重要です。

プロジェクトの成功を祈ります。開始してください。

