# プロジェクト: Breakdown全体のユースケース実行動作確認

仕様理解の上で、動作確認のexamples/*.sh修正を行う。
全て `examples/` をCWDとして実行すること。

`docs/breakdown/domain_core/prompt_template_path.ja.md` を理解する。
仕様は、用語集から探すこと。
`docs/breakdown/generic_domain/system/overview/glossary.ja.md`
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md`, `docs/breakdown/domain_core/two_params_types.ja.md` の設計に従い、DirectiveTypeとLayerTypeの組み合わせによるパス解決を正しく機能させる必要がある。


## 実施内容

## タスクとゴール

1. `--input` オプションを実行するshが、正しく動作していない。
2. `--adaptation` オプションを実行するshが、正しく動作していない。
いずれも、実装のテスト(プロジェクトルートの tests/)では動作が確認できているため、shを正しく動作するよう修正する。テンプレートの期待値、shのコメント、shで事前に作成するテンプレートファイルが修正候補である。

**注意書き**
- 実行前に、 `examples/README.md` を読むこと
- examples/ へ CWD を変えて、動作手順に従い実行すること
- 実行後、結果ログファイルを分析し、同じ階層にサマリーも保存すること
- 修正が必要な場合は、`examples/*.sh` のみ変更可能

## 実行手順

### 前提理解
1. 資料を読んで、examples/*.sh を理解する
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する

### 作業開始
3. examples/ へ CWD を変え、 `examples/README.md` の動作手順に従い、`examples/*.sh` を順次実行し、動作確認する
4. 全実行結果をプロジェクトルートの `tmp/example_results/examine.md` へ記述する。警告やエラーを中心に一覧化する
5. 問題が発見された場合、LOG_LEVEL=debug で実行する
   - 設定ファイルは、番号の早い段階で生成して準備する
   - プロンプトファイルやSchemaファイルは、必要な組み合わせを考え、生成しておく
   - `-o` オプションは、出力先変数の値指定であり、出力されない。出力は `>` リダイレクトを使う
   - 設定プロファイルを切り替える際は `-c` を用いる
   - `--uv-*` 指定など、メイン実装コードで問題があれば、「原因調査」して、別途レポートにまとめる
6. 修正した成功パターンは、`examples/*.sh` へ組み込み、再現性を確保する：
   - 成功した修正内容を該当する `examples/*.sh` ファイルに反映する
   - 修正内容は順序実行時の依存関係を考慮して適切な番号のスクリプトに配置する
   - 修正後は必ず clean up (21番) を実行して環境をリセットする
   - clean up 後に0番から順次実行しても同じ成功結果が再現されることを確認する
7. 修正後に3へ戻り、再び実行する
   - 再実行前に、 21 clean up を実行してから行う

### 必読資料

仕様は、用語集から探すこと。
`docs/breakdown/generic_domain/system/overview/glossary.ja.md`
- 必読: 
   - `docs/breakdown/domain_core/domain_boundaries_flow.ja.md`
   - `docs/breakdown/domain_core/two_params_types.ja.md`
- その他仕様は、必要に応じ `docs/breakdown/**/*.ja.md` を読むこと

### 成功条件

以下の3点です。

- 存在する examples/* を0から順番に実行した結果、最後までエラーなく完了する
- `examples/*.sh` が警告なし、エラーメッセージなしに完了した。警備な問題さえ許されない。
- lib/, tests/ のテストが全て pass する
- `deno task ci` が1つのエラーもなく成功する

### 完了条件

- 「成功条件」を満たす場合は完了
- 「成功条件」を満たさない場合は、エラーを整理してレポートへ含めることで完了

**禁止事項**
- lib/ 配下と tests/ 配下は変更禁止
- tmp/, examples/ 配下以外へのファイル作成、変更、改修は禁止
- examples/配下以外の改変案は、全て tmp/ 配下へレポート作製し次の課題にすること

# タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。

# 作業開始指示

仕様の理解を進め、実装方針に基づいて「作業開始」を実施します。
プロジェクトの成功を祈ります。開始してください。
