# Usage:

- README.ja.md のUsageを参照

このファイルは、ディレクトリ の方針に限って記載されている。

## 実行コマンド例

```sh
./.deno/bin/breakdown defect issue --from-issue examples/sample_issue.md
```

# 前提

- このアプリケーションは、Denoのライブラリとして提供される
- 設定は、3つに分かれる
  1. アプリケーションがコンパイルされると変わらない内臓された設定（<application_config>と呼ぶ）
  2. アプリケーション自体が初期値として用いる設定で、初期化時点でユーザーの環境を踏まえて行われる設定(<initialize_config>と呼ぶ)
  3. 初期設定としては不要だが、必要に応じてユーザーが追加できる設定(<user_config>と呼ぶ)
- 設定で行われることは、 `20250207-config.md`
  を参照すること。この設定に基づいてディレクトリが決定されることもある。

# 所与の条件

## 期待動作

- `breakdown` アプリが使うデフォルトのディレクトリは、全て最初に決まっている。
- working_dir は、ライブラリをインストールしたユーザーが設定を変えることがある。そのため
  initialize_config を読み込んでから定まる。
- ユーザーが実行の都度指定することのできるディレクトリは、そのデフォルト値として user_config
  を用いることができる。 　そのため、user_config は実行の都度、読み込まれる。アプリケーションは
  user_config が設定されていることを期待してはならない。

## 期待しない動作

- 同じ設定値を、複数の ts ファイルへハードコーディングし、DRYではない状態になること

## 入念に設計すること

- TypeScriptの定義エラーが起きないよう、読み込み順序を入念に設計すること
