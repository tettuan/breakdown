# Examples スクリプトのユースケース詳細マッピング

## 実行状態の凡例
- [OK] 成功: スクリプトが正常に実行され、期待される結果を生成
- [WARN] 条件付き成功: 前提条件が満たされれば成功
- [NG] 失敗: 実行エラーまたは機能未実装
- [WIP] 準備中: 機能は存在するが設定待ち

## ユースケースマッピング表

| 番号 | スクリプト名 | カバーするユースケース | 実行状態 | 備考 |
|------|-------------|----------------------|----------|------|
| 01 | install.sh | **インストール方法の案内**<br>• deno task経由の利用方法<br>• バイナリコンパイル方法<br>• グローバルインストール方法<br>• JSRパッケージの直接実行 | [OK] | 情報提供のみ、実際のインストールは行わない |
| 02 | compile.sh | **スタンドアロンバイナリの作成**<br>• deno compileによるバイナリ生成<br>• ./.deno/bin/breakdownへの配置<br>• 実行権限の付与 | [OK] | バイナリが正常に生成される |
| 03 | check_version.sh | **CLIツールの動作確認**<br>• --versionオプションのテスト<br>• バイナリの存在確認<br>• バージョン情報の表示 | [WARN] | バイナリが存在する場合のみ成功 |
| 04 | init.sh | **プロジェクト初期化（バイナリ版）**<br>• .agent/breakdown構造の作成<br>• 必要なディレクトリ作成<br>• 基本設定ファイルの配置<br>• app.ymlの生成 | [WARN] | バイナリが必要 |
| 05 | init_deno_run.sh | **プロジェクト初期化（deno run版）**<br>• バイナリ不要の初期化<br>• cli/breakdown.ts直接実行<br>• 同じディレクトリ構造の作成 | [OK] | deno runで直接実行可能 |
| 06 | create_user_config.sh | **ユーザー設定作成（バイナリ版）**<br>• user.ymlの作成<br>• working_dir設定<br>• 基本的なユーザー設定 | [WARN] | バイナリが必要 |
| 07 | create_user_config_deno_run.sh | **ユーザー設定作成（deno run版）**<br>• バイナリ不要の設定作成<br>• 同じuser.yml生成<br>• 直接実行による柔軟性 | [OK] | deno runで直接実行可能 |
| 08 | stdin_example.sh | **STDIN入力の処理**<br>• echoからのパイプ入力<br>• catからのファイル入力<br>• summaryコマンドでのプロジェクト要約<br>• 出力ファイルの自動生成 | [OK] | STDIN経由の入力処理が正常動作 |
| 09 | basic_usage.sh | **主要コマンドの実践使用**<br>• `to issue`: プロジェクト→イシュー分解<br>• `summary task`: メモ→タスク整理<br>• `defect project`: エラーログ分析<br>• `find bugs`: バグ検出（未実装） | [WARN] | find bugs以外は動作、find bugsは設定待ち |
| 10 | config_basic.sh | **最小限の設定管理**<br>• basic-app.yml作成<br>• 基本的な設定項目<br>• STDINでの実行例<br>• --configオプション使用 | [OK] | 基本設定での動作確認済み |
| 11 | config_production.sh | **本番環境向け設定**<br>• セキュリティ設定強化<br>• JSONログ出力<br>• パフォーマンス最適化<br>• エラーレベルのログ制御 | [OK] | 本番想定の堅牢な設定 |
| 12 | config_team.sh | **チーム開発環境**<br>• デバッグ情報の充実<br>• メタデータ付き出力<br>• コラボレーション機能<br>• 実験的機能の有効化 | [OK] | チーム向け機能が有効 |
| 13 | config_environments.sh | **環境別設定管理**<br>• dev/staging/prod切り替え<br>• 環境ごとのログレベル<br>• パフォーマンス設定の調整<br>• 3つの設定ファイル作成と比較 | [OK] | 各環境での動作を確認 |
| 14 | config_production_example.sh | **バグ検出機能のデモ**<br>• find bugsコマンドの設定<br>• バグパターンの定義<br>• サンプルコードでの検出<br>• 詳細レポート生成 | [WIP] | プロンプト/スキーマは存在、app.yml更新待ち |
| 15 | config_production_custom.sh | **高度なカスタマイズ**<br>• CustomConfig完全活用<br>• JSRパッケージ使用法<br>• 新config構造(.agent/breakdown/config/)<br>• 大規模プロジェクト例 | [WIP] | 設定は完備、機能有効化待ち |
| 99 | clean.sh | **環境クリーンアップ**<br>• 生成ファイルの削除<br>• 設定ファイルの削除<br>• バイナリの削除（オプション）<br>• .agent構造は保持 | [OK] | 安全なクリーンアップ実装 |

## カバーされているユースケースの分類

### 1. セットアップ・初期化（01-07）
- **完全カバー**: インストール、コンパイル、初期化、設定作成
- **実行方法の選択肢**: バイナリ版とdeno run版の両方を提供
- **状態**: ほぼ完全に機能（バイナリ依存部分を除く）

### 2. 基本的な使用方法（08-09）
- **入力方法**: STDIN、ファイル入力の両方をカバー
- **主要コマンド**: to/summary/defectの3つの基本コマンド
- **状態**: find bugs以外は完全動作

### 3. 設定管理パターン（10-15）
- **基本設定**: 最小限の構成から開始
- **環境別設定**: 開発/ステージング/本番の使い分け
- **用途別設定**: チーム開発、バグ検出など特定用途
- **状態**: 設定ファイルは完備、一部機能は有効化待ち

### 4. 特殊機能（14-15）
- **find bugsコマンド**: 実装済みだが未有効化
- **CustomConfig**: 高度なカスタマイズ機能
- **状態**: 準備完了、app.ymlの更新で有効化可能

## 実行状態のサマリー

### 完全動作（[OK]）: 7個
- 01_install.sh
- 05_init_deno_run.sh
- 07_create_user_config_deno_run.sh
- 08_stdin_example.sh
- 10-13_config_*.sh（4個）
- 99_clean.sh

### 条件付き動作（[WARN]）: 4個
- 03_check_version.sh（バイナリ必要）
- 04_init.sh（バイナリ必要）
- 06_create_user_config.sh（バイナリ必要）
- 09_basic_usage.sh（find bugs未実装）

### 準備中（[WIP]）: 2個
- 14_config_production_example.sh
- 15_config_production_custom.sh

## 主要な発見事項

1. **二重実装パターン**: 多くの機能でバイナリ版とdeno run版の両方を提供
2. **段階的複雑性**: 基本→環境別→用途別→カスタムの順で複雑性が増加
3. **find bugs機能**: 完全に実装済みだがapp.ymlでの有効化待ち
4. **新設定構造**: .agent/breakdown/config/への集約が進行中
5. **JSRパッケージ対応**: 直接実行とパッケージ利用の両方をサポート

## 推奨事項

1. **find bugs有効化**: app.ymlのパターン更新で即座に利用可能
2. **バイナリ依存の解消**: より多くの例をdeno run版に移行
3. **エラーハンドリング例**: 失敗ケースの具体例を追加
4. **カスタム変数例**: --uv-*オプションの活用例を追加
5. **adaptation例**: --adaptationオプションの具体例を追加
