# プロジェクト: DirectiveType/LayerTypeパターンマッチング統合テスト追加

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## 実施内容

## タスクとゴール

```yml
- 信じて良い前提: Breakdown本体はテストをpassして正常に動作する
- タスク: |
  1. 統合テストを1つ追加する |
  2. 設定ファイルのDirectiveType/LayerTypeのパターンマッチングを広くする（a-z0-9） |
  3. 設定のpatternの中でランダムな文字列を生成してbreakdown <random1> <random2>としてテストする |
  4. runBreakdownを通してCLI経由でDirectiveType/LayerTypeのパターンマッチングを検証する |
  5. テスト実行時に必要なプロンプトテンプレートファイルを動的に作成し、完了後に削除する |
  6. TwoParamsResultからプロンプトファイル読み込みまでの完全な処理フローを検証する |
- ゴール: CLI経由でのパターンマッチング機能が正常に動作し、ランダムなDirectiveType/LayerTypeでも適切に処理される。テストはrunBreakdown実行→設定読み込み→パターンマッチング→TwoParamsResult生成→プロンプトファイル読み込みまでの完全フローを検証する。テスト用ファイルは動的作成・削除で管理する。
```

**注意書き**
- テスト追加前に、 `tests/README.md` と `docs/tests/testing.ja.md` を読むこと
- tests/ 配下のテスト構造を理解してから実装すること
- 修正が必要な場合は、`tests/` 配下のファイルのみ変更可能
- 統合テストは `tests/integration/` 配下に配置すること

### 実行方針

#### 前提理解
1. 資料を読んで、tests/ 配下の構造とテスト方針を理解する
2. DirectiveType/LayerTypeのパターンマッチング仕様を `docs/breakdown/domain_core/two_params_types.ja.md` で確認する
3. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する

#### 作業開始
4. 現在のDirectiveType/LayerTypeパターンマッチング実装を調査する
5. パターンマッチング設定ファイルのテスト用設定を作成する
6. ランダム文字列生成機能をテスト内に実装する
7. テスト用プロンプトテンプレートファイルの動的作成・削除機能を実装する
8. 統合テストを `tests/integration/` 配下に追加する：
   - ランダムなDirectiveType/LayerTypeの組み合わせでテストケースを生成
   - テスト実行前に対応するプロンプトテンプレートファイルを動的作成
     * ディレクトリ: `prompts/{DirectiveType}/{LayerType}/`
     * ファイル名: `f_{LayerType}.md` (基本) または `f_{LayerType}_{adaptation}.md` (適応あり)
     * 完全パス: `prompts/{DirectiveType}/{LayerType}/f_{LayerType}.md`
   - runBreakdownを通してCLI経由で実行し、完全な処理フローを検証
   - 設定ファイルの正しい読み込み確認
   - TwoParamsResultからプロンプトファイル読み込みまでの処理を検証
   - テスト完了後にテンプレートファイルを削除
9. テストを実行して動作確認する
10. 必要に応じてテスト設定の修正を行う

### パターンマッチングテスト仕様

- 現在のパターン: 設定ファイル（*-user.yml）で定義されたパターン
- テスト対象パターン: a-z0-9 の組み合わせ（英数字）を許可する設定
- ランダム文字列生成: 
  - DirectiveType: 3-8文字のランダム英数字
  - LayerType: 3-8文字のランダム英数字
  - fromLayerType: 3-8文字のランダム英数字（-i= オプションで指定）
- テストケース数: 最低10パターン以上
- テスト用ファイル管理:
  - テスト実行前: 対応するプロンプトテンプレートファイルを動的作成
    * パス: `prompts/{DirectiveType}/{LayerType}/f_{fromLayerType}.md`
    * CLI: `breakdown {DirectiveType} {LayerType} -i={fromLayerType}`
  - テスト実行中: 完全な処理フローを検証
  - テスト完了後: 作成したテンプレートファイルを削除
- 成功判定基準:
  - パターンマッチング成功 → テスト成功
  - プロンプトファイル読み込み成功 → テスト成功
  - パターンマッチングエラー → テスト失敗

### 統合テスト実装要件

1. テストファイル名: `tests/integration/pattern_matching_integration_test.ts`
2. テスト実行方法: runBreakdownを使用したCLI統合テスト
3. テスト内容:
   - ランダムなDirectiveType/LayerType/fromLayerTypeトリプレットの生成
   - テスト用プロンプトテンプレートファイルの動的作成・削除
     * パス: `prompts/{DirectiveType}/{LayerType}/f_{fromLayerType}.md`
     * CLI: `breakdown {DirectiveType} {LayerType} -i={fromLayerType}`
     * 内容: テスト用プロンプトテンプレート
   - runBreakdownを通したCLI経由での完全な処理フローの動作確認
   - 設定ファイルの正しい読み込み確認
   - CLI実行結果からTwoParamsResultの生成と結果検証
   - プロンプトファイル読み込みまでの完全フロー検証
4. テストデータ:
   - 有効なDirectiveType/LayerType/fromLayerTypeパターン（a-z0-9組み合わせ）
   - 無効なパターン（エラーケース）
   - 境界値テストケース
   - 動的作成するプロンプトテンプレートファイル（f_{fromLayerType}.md形式）
5. テスト用設定ファイル:
   - `tests/fixtures/config/pattern-test-user.yml`
   - a-z0-9パターンマッチングを許可する設定

### プロンプトテンプレートファイル構成

テスト実行時に動的作成するプロンプトテンプレートファイルの構成：

#### ディレクトリ構造
```
prompts/
├── {DirectiveType}/
│   └── {LayerType}/
│       └── f_{fromLayerType}.md
```

#### ファイル名パターン
- **基本パターン**: `f_{fromLayerType}.md`
- **適応パターン**: `f_{fromLayerType}_{adaptation}.md`
- **例**: `f_abc123.md` (fromLayerType="abc123", -i= オプションで指定)
- **適応例**: `f_abc123_strict.md` (fromLayerType="abc123", adaptation="strict")

#### パス解決ルール
- **ベースディレクトリ**: `prompts` (デフォルト)
- **完全パス**: `prompts/{DirectiveType}/{LayerType}/f_{fromLayerType}.md`
- **例**: `prompts/def456/xyz789/f_abc123.md` (DirectiveType="def456", LayerType="xyz789", fromLayerType="abc123")
- **適応例**: `prompts/def456/xyz789/f_abc123_strict.md`

#### CLI実行パターン
- **基本**: `breakdown {DirectiveType} {LayerType} -i={fromLayerType}`
- **ファイル入力**: `breakdown {DirectiveType} {LayerType} -i={fromLayerType} -f={inputFile}`
- **例**: `breakdown def456 xyz789 -i=abc123`
- **ファイル例**: `breakdown def456 xyz789 -i=abc123 -f=test.md`
- **結果**: `prompts/def456/xyz789/f_abc123.md` が読み込まれる

#### 動的作成内容
```markdown
# Test Prompt Template for {DirectiveType} {LayerType} from {fromLayerType}

This is a dynamically generated test template for:
- DirectiveType: {DirectiveType}
- LayerType: {LayerType}
- fromLayerType: {fromLayerType}

CLI Command: breakdown {DirectiveType} {LayerType} -i={fromLayerType}
Template Path: prompts/{DirectiveType}/{LayerType}/f_{fromLayerType}.md

Generated at: {timestamp}
```

### 必読資料

- テスト仕様: `docs/tests/testing.ja.md`
- ドメイン仕様: `docs/breakdown/domain_core/two_params_types.ja.md`
- パターンマッチング: `docs/breakdown/domain_core/domain_boundaries_flow.ja.md`
- 統合テスト構造: `tests/integration/` 配下の既存ファイル

### 完了条件

以下の全ての点を満たすこと：

- 統合テストが `tests/integration/` 配下に正しく追加されている
- テスト用設定ファイルでDirectiveType/LayerTypeのパターンマッチングが a-z0-9 パターンで設定されている
- ランダム文字列生成機能がテスト内に実装されている
- 統合テストが全てpassする
- `deno task test` が1つのエラーもなく成功する
- runBreakdownを通したCLI経由での完全な処理フローが正しく実行されている
- テスト用ファイルの動的作成・削除が正しく動作している
- プロンプトファイル読み込みまでの処理が成功している

**禁止事項**
- lib/ 配下のコア実装ファイルの変更は最小限にとどめること
- examples/ 配下のファイル変更は禁止
- tmp/ 配下以外への不要なファイル作成は禁止
- 既存のテストを破壊する変更は禁止

## タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実装 → テスト → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。

## 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、テスト仕様の理解を進め、統合テスト実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
