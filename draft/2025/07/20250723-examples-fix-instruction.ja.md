# 緊急修正指示書 - Examples実行時のテンプレートパス解決エラーの修正

## 実装方針

examples/配下の動作確認で発見されたテンプレートパス解決エラーを修正し、全examplesスクリプトを警告なしで実行可能にする。[ドメイン境界の協働関係](docs/breakdown/domain_core/domain_boundaries_flow.ja.md)に基づき、プロンプトパス決定ドメインの責務を明確にしながら、examples/*.shのみの修正で問題を解決する。

### 背景

実行結果より以下の問題が確認された：
1. 全12スクリプトで`Template not found: prompts/{directive}/{layer}/f_{layer}.md`警告
2. 出力ファイルが実行ステータスメッセージのみ（期待はAI処理結果）
3. base_dirの相対パス解決が`prompts/prompts/`の二重パスになる不整合

[TwoParams型システム](docs/breakdown/domain_core/two_params_types.ja.md)の設計に従い、DirectiveTypeとLayerTypeの組み合わせによるパス解決を正しく機能させる必要がある。

## チームの構成

`start company`: tmuxを使った相互通信によるClaude Code Company管理方法の基本セットアップを実施

### 役割分担
- **総司令官**（あなた）：全体統括、修正方針決定、品質確認
- **修正リーダー**（pane1）：examples/*.sh修正の統括、[Totality原則](docs/breakdown/domain_core/totality.ja.md)に基づく網羅性確保
- **パス修正担当**（pane2-3）：設定ファイルのbase_dir修正、テンプレート配置確認
- **出力修正担当**（pane4-5）：リダイレクト処理修正、出力検証
- **検証担当**（pane6-7）：修正後の動作確認、警告除去確認

## 作業内容

### Phase 1: 問題分析と修正準備

1. **現状確認**
   ```bash
   cd examples
   ls -la .agent/breakdown/config/*.yml | head -5
   find .agent/breakdown/prompts -name "*.md" | head -5
   ```

2. **修正対象ファイルリスト作成**
   - 02_init_deno_run.sh（テンプレート配置）
   - 各設定ファイル（base_dir修正）
   - 警告が出た12スクリプト（出力処理）

### Phase 2: 設定ファイル修正

3. **base_dir統一修正**
   ```yaml
   # 全プロファイルで統一（例：default-app.yml）
   app_prompt:
     base_dir: "prompts"  # ".agent/breakdown/prompts"から変更
   app_schema:
     base_dir: "schema"   # ".agent/breakdown/schema"から変更
   ```

4. **02_init_deno_run.sh修正**
   - 設定ファイル生成部分のbase_dir修正
   - テンプレート存在確認の追加

### Phase 3: 出力処理修正

5. **リダイレクト修正**（12スクリプト）
   ```bash
   # 修正前: BREAKDOWN summary project > output.md
   # 修正後: BREAKDOWN summary project 2>/dev/null > output.md
   ```

6. **common_functions.shへの追加**
   - ensure_template()関数追加
   - エラーハンドリング強化

### Phase 4: 検証とCI実行

7. **段階的検証**
   ```bash
   bash 18_clean.sh  # 環境リセット
   bash 02_init_deno_run.sh  # 初期化
   bash 04_stdin_example.sh  # 基本動作確認
   # 警告なしを確認後、全スクリプト実行
   ```

8. **CI実行による再帰的検証**
   ```bash
   cd ..  # プロジェクトルートへ
   deno task ci:dirty  # 再帰的なタスク洗い替え
   ```

## タスクとゴール

[AI複雑性制御](docs/breakdown/domain_core/ai-complexity-control_compact.ja.md)の原則に従い、最小限の修正で最大の効果を得る：

- **修正対象**: examples/*.shのみ（lib/, tests/は変更不要）
- **ゴール**: 全examplesが警告なしで正常実行、deno task ci:dirty成功

## 進捗管理

- タスク管理: `tmp/feature/hardcode-elimination-emergency/tasks.md`
- 修正ログ: `tmp/feature/hardcode-elimination-emergency/fix_log.md`
- 完了レポート: `tmp/feature/hardcode-elimination-emergency/completed.md`

## 完了条件

1. **必須条件**
   - 全18スクリプトが警告なしで実行完了
   - 出力ファイルに適切な内容が含まれる（48バイトではない）
   - `deno task ci:dirty`が成功

2. **品質条件**
   - テンプレートパス解決エラー: 0件
   - 出力ファイル不備: 0件
   - 新規エラー導入: 0件

3. **検証条件**
   ```bash
   # examples/で実行
   for script in *.sh; do
     echo "Testing $script..."
     bash "$script" 2>&1 | grep -i "warning\|error" || echo "✓ No warnings"
   done
   ```

## 開始指示

1. チーム立ち上げ（tmux pane構成）
2. 修正リーダーに`tmp/example_results/examine.md`と本指示書を読ませる
3. Phase 1から順次実施
4. 各Phaseの完了を`tmp/feature/hardcode-elimination-emergency/fix_log.md`に記録
5. 問題発生時は総司令官に即座に報告

プロジェクトの成功を確実にするため、慎重かつ迅速に作業を進めてください。