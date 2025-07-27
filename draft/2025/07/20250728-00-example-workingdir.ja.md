# プロジェクト: working_dir の examples & tests 矛盾問題の解明

仕様理解の上で、動作確認のexamples/*.shの動作とtestsの動作を確認する。

`docs/breakdown/domain_core/prompt_template_path.ja.md` を理解する。
仕様は、用語集から探すこと。
`docs/breakdown/generic_domain/system/overview/glossary.ja.md`
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md`, `docs/breakdown/domain_core/two_params_types.ja.md` の設計に従い、DirectiveTypeとLayerTypeの組み合わせによるパス解決を正しく機能させる必要がある。


## 実施内容

## タスクとゴール
「examples 調査」と「tests 調査」を行い、矛盾点の解明レポートをまとめる。
examples/ とテストで矛盾した成否が出ており、実装に不備がないか、改めて確認し、`examples/*.sh` 修正 or 実装の修正に、結論を出して欲しい。

### examples 調査
 `examples/` をCWDとして実行すること。
1. working_dir="."で実行するshが、正しく動作していない。

**注意書き**
- 実行前に、 `examples/README.md` を読むこと
- examples/ へ CWD を変えて、動作手順に従い実行すること
- 実行後、結果ログファイルを分析し、同じ階層にサマリーも保存すること
- 修正が必要な場合は、`examples/*.sh` のみ変更可能


### tests 調査

プロジェクトルート をCWDとして実行すること。

1. 実装のテスト(プロジェクトルートの tests/)では working_dir = "." でも動作が確認できているため、shを正しく動作するよう修正する必要があると考えている。

## 実行手順

### 前提理解
1. 資料を読んで、examples/*.sh を理解する
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する

### 作業開始
3. examples/ へ CWD を変え、 `examples/README.md` の動作手順に従い、`examples/*.sh` を順次実行し、動作確認する
4. 全実行結果をプロジェクトルートの `tmp/examine.md` へ記述する。警告やエラーを中心に一覧化する
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
8. プロジェクトルートに戻り、tests/ をテストする。working_dir のテストを入念に調べ、実装が working_dir と base_dir を適切に扱っているか確認する。
結果をプロジェクトルートの `tmp/examine_tests.md` へ記述する。

### 必読資料

仕様は、用語集から探すこと。
`docs/breakdown/generic_domain/system/overview/glossary.ja.md`
- 必読: 
   - `docs/breakdown/domain_core/domain_boundaries_flow.ja.md`
   - `docs/breakdown/domain_core/two_params_types.ja.md`
- その他仕様は、必要に応じ `docs/breakdown/**/*.ja.md` を読むこと

### 完了条件

1. 入念な調査により原因が解明した
2. レポートを作成した

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
