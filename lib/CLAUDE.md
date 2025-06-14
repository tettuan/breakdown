# アウトライン

- この階層は Breakdown本体である
- Breakdownは、複数のライブラリ（パッケージ）に役割を分けている
  - BreakdownParams, BreakdownConfig, BreakdownPrompts
  - デバッグは BreakdownLogger
- パッケージが実装した役割を、Breakdown自身は実装しない
  - BreakdownParams: args CLI引数の分解、バリデーション。CLI引数は全てBreakdownParamsへ移譲し、BreakdownParamsの結果だけを使う。
  - BreakdownConfig: 設定ファイルを用いた設定値。設定の読み込みはすべてBreakdownConfigへ移譲し、Breakdown本体はBreakdownConfigの結果を使うだけ。
  - BreakdownPrompts: 本体処理のコア部分である、テンプレートとなるプロンプト特定や、変換処理をBreakdownPromptsへ移譲。得られた結果をCLI利用者へ返す。
- docs/ 配下に利用説明があり、 docs/breakdown/ 配下に開発仕様がある

## Breakdown本体が担う責務
- パッケージに対するオーケストレーション
- パッケージ間へのデータの受け渡し
- 利用者に対するメッセージング
- argsに含まれないSTDINの受け取り処理

# 実装の注意

- パッケージに責務があるはずの実装を、Breakdown本体でも実装することは禁止
  - パッケージのミスは、パッケージが直すべきであり、本体からは「使えない警告」を出すべき
  - なぜ禁止か？: 迂回路ができたり、二重実装で不具合が隠蔽されてしまう

# テストファイル

0_architecture, 1_structure, 2_unit テストは、実装コードと同じ階層に置く。 同一階層または tests/ 内。



# チームの構成

## 調査フェーズの役割分担例
- 検索、サマリ、変換、抽出といったETL手法
- Read/Write の分散
- ファイル種別の分散、調査範囲の分割

## 実装フェーズの役割分担例
- 実装、テスト実行、テストの解析、解析したテストに対するBreakdownLoggerの追記、など。考えられる分散並列の方法は、非常に多いはずだ。

