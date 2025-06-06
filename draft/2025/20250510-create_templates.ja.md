「仕様理解」を行ったあと、「初期テンプレート作成」に着手する。

# ミッション：テンプレートの完成
`lib/breakdown/prompt` 配下に、プロンプトテンプレートを作成する。
パターンを網羅し、有意義なテンプレートを作成することがミッション。

# 仕様理解
まず、用語集 `docs/breakdown/glossary.ja.md` で関係性を把握して。
必要に応じ、`docs/index.md`と `docs/breakdown/index.ja.md` から参照される仕様書を読む。 Schema仕様の理解は不要。
特に `docs/breakdown/options.ja.md`, `docs/usage.ja.md` は、テンプレートに必要な情報を説明している。

## ユースケース： 
必要なタイミングで、プロジェクトのREADME を読み、ユースケースを理解する。

# 初期テンプレート作成
DoubleParams の場合に、
- to/summary/defect
- project/issue/task
の2つの組み合わせで、プロンプトを決定する。

プロンプト文章は、以下の「観点」で考え、「論点」を網羅して作成する。
「守ること」も踏まえ、作成すること。

`default.ja.md`, `f_*.ja.md` を日本語で作成すること。

## 観点
- to : 
  - input を解析し要素を分解する
  - 情報の欠落がないように、カバー範囲を保つ
  - 大きな情報を解像度高くし、具体化していくために分割する

- summary : 
  - 雑然とした情報から、論点を読み取る
  - input を解析し、主要な論点から情報をサマライズする。
  - 文字数を 100文字、200文字、300文字の単位で説明する
  - 章立てし、段落を構成する

- defect : 
  - エラーメッセージやシステムログ、不具合レポートを input とする
  - 情報の発生源、環境などから、回収要望を把握する
  - システムへ反映すべき要望を的確に捉える
  - 不足情報は不足とわかるように明記する

## 論点
- プロジェクトマネジメントに関する要求・要件、仕様の区分
- プロジェクトの目的、課題、経緯、背景
- MoSCoW分析、DDD、デザインパターン
- ソフトウェア開発に必要なアーキテクチャ設計
- 仕様をもとにしたタスク化、タスク間のフロー化や分岐
  - blocked,related,sub,parent

## 守ること
- テンプレート変数を入れる

