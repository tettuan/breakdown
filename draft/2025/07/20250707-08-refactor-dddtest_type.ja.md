# プロジェクト: Breakdown全体のドメイン駆動設計と全域性（Totality）のテスト完成

実装方針:
現在の`lib/`配下の実装をドメイン駆動設計と全域性（Totality）による大幅リファクタリングに、テストを対応させる。ドメイン領域の明確な理解に基づき、型安全性を強化して、骨格が通った芯の強いテスト構造を実現する。

`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。

テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
他の`docs/breakdown/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

## 実施内容

1. 資料を読んで、ドメイン設計と Totality を理解する。
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する。
3. `tmp/type_errors.log` のType Errorリスト, error filesを順番に読み込む
4. リストに基づき、作業をワーカープールに4ファイルずつ割り当て、type check エラー、deno test を確認させる
5. 不要なテストは削除する
5-1. 削除判断: 存在しない実装のテスト、ダミーテスト、スケルトン、実装をテストせずテストコードで実装しテストしている
5-2. 重複したテストは古いテストを削除する
6. `deno check <testfile>` で、作成したファイルをtype checkする
7. `deno test <testfile>` で、作成したファイルをテストする （allowフラグつけて）
8. 結果を修正する
9. 3で作成したリストの全てが完了するまで、再び4に戻り、実装修正を行う

### 全ての変更が完了した後

10. `deno task ci:error-files` を通して、passするまでテストを完成させる

## 完了条件

1. **残エラーの完全修正**: テストファイル構造問題の解決した
2. `deno task ci` が完全に通過した: エラー0件達成


# タスクの進め方

- Git:
  - 現在のGitブランチが適切か判断する (see @instructions/git-workflow.md)
  - 作成が必要なら Git ブランチを作成し、移動する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。


