# プロジェクト: ドメイン境界設計変更に基づくBreakdown全体のDDD実装リファクタリング

実装方針:
`domain_boundaries_flow.ja.md`と`two_params_types.ja.md`の設計変更に基づき、現在の`lib/`配下の実装をドメイン境界線に沿った正しいDDD設計へリファクタリングする。特に、TwoParamsの責務変更、BreakdownParams統合、パス解決ドメインの分離を中心とした実装修正を行う。

## 設計変更の概要

### 主要な設計変更点
1. **TwoParams責務変更**: パス解決機能の削除、純粋な値オブジェクト化
2. **DirectiveType/LayerType簡素化**: BreakdownParams検証済み値として、独自のパス解決メソッド削除
3. **プロンプトパス決定ドメイン分離**: パス解決責務の明確な分離
4. **BreakdownParams統合**: ParamsCustomConfigによる設定パターンベース検証
5. **ConfigProfileName短寿命化**: 設定読み込み専用オブジェクトへの責務縮小

### 影響を受ける実装領域
- **Core Domain**: `lib/domain/` 配下のTwoParams, DirectiveType, LayerType関連
- **Parameter Processing**: `lib/commands/` 配下のパラメータ解析処理
- **Path Resolution**: `lib/processor/` 配下のパス解決処理
- **Configuration**: `lib/config/` 配下の設定管理
- **Factory**: `lib/factory/` 配下のオブジェクト生成処理

`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## スコープの選定

### 優先度付きスコープ一覧
1. **高優先度**: ドメイン境界に直接関わる箇所
   - `lib/domain/` - TwoParams, DirectiveType, LayerType
   - `lib/commands/` - パラメータ解析処理
   - `lib/processor/` - パス解決処理分離

2. **中優先度**: 設定とファクトリー
   - `lib/config/` - ConfigProfileName責務変更
   - `lib/factory/` - オブジェクト生成方式変更

3. **低優先度**: 支援機能
   - `lib/helpers/` - ユーティリティ関数
   - `lib/io/` - 入出力処理

### スコープ選定手順
1. 「優先度付きスコープ一覧」の高優先度から1つを選ぶ。([DIR]とする)
2. `deno check [DIR]`, `deno test [DIR]`, `deno lint [DIR]`, `deno fmt [DIR]` を行う
2-1. 全て成功: 次のスコープを選ぶ
2-2. エラー発生: [DIR]を「作業スコープDIR」とする
3. 2-2の「作業スコープDIR」を実施スコープとする

## 実施内容

### 1. 前提理解と差分分析
1. **設計書の理解**: ドメイン設計とTotalityを理解する
2. **差分分析**: 設計変更による影響範囲を特定する
   - TwoParamsから削除すべきメソッドの特定
   - DirectiveType/LayerTypeの責務変更点の把握
   - プロンプトパス決定ドメインの新規分離要件
   - BreakdownParams統合による変更点
3. **調査結果記録**: `tmp/<branch_name>/` 配下に作成する

### 2. 設計変更に基づく実装修正

#### 2-1. TwoParams責務変更 (最高優先度)
- **削除対象メソッド**:
  - `getPromptPath()`
  - `getSchemaPath()` 
  - `resolvePromptFilePath()`
  - `resolveSchemaFilePath()`
  - `toCommand()`
- **残存メソッド**: `equals()`, `toString()` のみ
- **影響ファイル**: `lib/domain/two_params.ts`, 関連テスト

#### 2-2. DirectiveType/LayerType簡素化 (最高優先度)
- **削除対象**: 独自のパス解決関連メソッド
- **変更点**: BreakdownParams検証済み値としての位置づけ
- **コンストラクタ**: `constructor(readonly value: string)` に簡素化
- **影響ファイル**: `lib/domain/directive_type.ts`, `lib/domain/layer_type.ts`

#### 2-3. プロンプトパス決定ドメイン分離 (高優先度)
- **新規作成**: `lib/domain/prompt_path_resolver.ts`
- **責務**: TwoParamsとBreakdownConfigからのパス解決
- **メソッド**: `resolvePromptPath()`, `resolveSchemaPath()`
- **統合対象**: 既存のパス解決ロジックを集約

#### 2-4. BreakdownParams統合対応 (高優先度)
- **ParamsCustomConfig生成**: 設定値からの変換処理
- **検証ロジック削除**: 重複するパターンマッチング処理の除去
- **エラーハンドリング簡素化**: BreakdownParams依存エラーのみ残存
- **影響ファイル**: `lib/commands/parameter_parser.ts`

#### 2-5. ConfigProfileName短寿命化 (中優先度)
- **責務削除**: DirectiveType/LayerType提供機能の除去
- **設定読み込み専用化**: `getConfigPath()`以外の機能削除
- **寿命管理**: 設定読み込み後の即時解放
- **影響ファイル**: `lib/config/config_profile.ts`

### 3. テスト修正と検証

4. **スコープ選定**: 「スコープの選定」を行い、「作業スコープDIR」を取得
5. **段階的検証**:
   5-1. `deno check [DIR]` : 成功→5-2,失敗→6
   5-2. `deno test [DIR]` : 成功→5-3,失敗→6  
   5-3. `deno lint [DIR]` : 成功→5-4,失敗→6
   5-4. `deno fmt [DIR]`  : 成功→4,失敗→6
6. **エラー修正**: ワーカープールに割り当て、修正後に5のステップを再確認
7. **全スコープ完了**: 「優先度付きスコープ一覧」全てで5が成功するまで繰り返し

### 4. 作業レビュー → 差し戻し | 完了

8. **型チェック**: `deno check lib/ > tmp/type_errors.log 2>&1` でエラー → 「2. 設計変更に基づく実装修正」へ戻る
9. **CI確認**: `deno task ci:dirty` でエラー → 「2. 設計変更に基づく実装修正」へ戻る

#### 完了条件

1. **設計変更の完全反映**: 全ての優先度付きスコープで実施内容5が成功
2. **型安全性確保**: `deno check lib/` エラー0件
3. **テスト通過**: `deno task ci:dirty` 完全通過

## 調査範囲と修正指示

### 調査対象ファイルパターン
```
# TwoParams関連
lib/domain/*two_params*
lib/factory/*two_params*
tests/**/two_params*

# DirectiveType/LayerType関連  
lib/domain/*directive*
lib/domain/*layer*
lib/factory/*directive*
lib/factory/*layer*

# パス解決関連
lib/processor/*path*
lib/processor/*prompt*
lib/helpers/*path*

# 設定関連
lib/config/*profile*
lib/config/*config*

# パラメータ解析関連
lib/commands/*parameter*
lib/commands/*parser*
```

### 修正指示手順

#### Step 1: 影響調査
```bash
# TwoParamsの使用箇所特定
grep -r "getPromptPath\|getSchemaPath\|resolvePromptFilePath\|resolveSchemaFilePath\|toCommand" lib/
grep -r "TwoParams" lib/ tests/

# DirectiveType/LayerTypeのメソッド使用箇所
grep -r "DirectiveType\|LayerType" lib/ tests/
```

#### Step 2: 段階的修正
1. **ドメインオブジェクト修正**: `lib/domain/` から開始
2. **ファクトリー修正**: `lib/factory/` のオブジェクト生成
3. **プロセッサー修正**: `lib/processor/` のパス解決分離
4. **コマンド修正**: `lib/commands/` のパラメータ解析
5. **設定修正**: `lib/config/` の責務変更

#### Step 3: テスト調整
1. **削除対象**: 不要になったメソッドのテスト
2. **修正対象**: パス解決ドメイン分離に伴うテスト
3. **新規作成**: プロンプトパス決定ドメインのテスト

# タスクの進め方

- **Git**: 現在のGitブランチで作業する
- **サイクル**: 設計理解 → 差分分析 → 影響調査 → 実装修正 → テスト修正 → 検証 → 設計理解へ戻る
- **作業分担**: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。

## 特別な注意事項

### BreakdownParams統合
- 具体的な実装方法は [JSR @tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) のドキュメントを参照
- ParamsCustomConfigの生成方法を正確に把握する
- 既存の検証ロジックとの重複を避ける

### ドメイン境界の遵守
- TwoParamsはパス解決を行わない純粋な値オブジェクト
- プロンプトパス決定ドメインが全てのパス解決を担当
- DirectiveType/LayerTypeは文字列値の保持のみ

### 型安全性の維持
- Totality原則に基づく全域関数の実装
- Result型によるエラーハンドリング
- Discriminated Unionによる状態表現

# 作業開始指示

まずチームを立ち上げます。
その後、設計変更の理解と差分分析タスクを早々にワーカープールマネージャーへ渡します。

続いて、ドメイン境界設計の理解を進め、実装修正方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（設計理解、差分分析、影響調査、実装修正、テスト修正）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
