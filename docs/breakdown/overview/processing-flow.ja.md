# Breakdownの処理フロー

> 本仕様書は、Breakdown CLIの内部処理フローの詳細を技術者向けに定義します。

## 全体アーキテクチャ

Breakdown CLIは以下のフェーズで処理を実行します：

1. **入力パラメータの処理** - CLI引数の解析とバリデーション
2. **必要なファイルの特定** - プロンプト・スキーマ・入出力パスの解決
3. **プロンプト生成** - テンプレート読み込み・変数置換・スキーマ情報埋め込み
4. **結果の出力** - 生成されたプロンプトの出力

## 詳細処理フロー

### 1. 入力パラメータの処理

#### 1.1 コマンドライン引数の解析
- `BreakdownParams`による引数解析
- パラメータの型判定（Zero/One/Two Parameters）
- 設定ファイル接頭詞（`--config`/`-c`）の検出

#### 1.2 設定の読み込み・統合
- `BreakdownConfig`による設定管理
- `app.yml`（アプリケーション設定）の読み込み
- `user.yml`（ユーザー設定）の読み込み
- CLI引数と設定の統合・優先順位適用

#### 1.3 オプションの検証
- 必須パラメータの存在確認
- パラメータ値の妥当性検証
- カスタム変数（`--uv-*`）の処理

### 2. 必要なファイルの特定

#### 2.1 プロンプトファイルの選択
- `PromptTemplatePathResolver`による解決
- `DemonstrativeType`（処理分類：to, summary, defect等）の判定
- `LayerType`（対象階層：project, issue, task等）の判定
- `adaptation`（適応タイプ）による特化プロンプト選択

#### 2.2 スキーマファイルの特定
- `SchemaFilePathResolver`による解決
- プロンプトに対応するJSONスキーマファイルの特定
- スキーマファイルの存在確認

#### 2.3 入出力パスの解決
- `InputFilePathResolver`による入力ファイルパス解決
- `OutputFilePathResolver`による出力ファイルパス解決
- 相対パス・絶対パスの正規化
- ディレクトリ存在確認・作成

### 3. プロンプト生成

#### 3.1 プロンプトファイルの読み込み
- `BreakdownPrompt`によるテンプレート処理
- プロンプトファイルの読み込み
- テンプレート構文の解析

#### 3.2 変数の置換処理
- `PromptVariablesFactory`による変数統合
- 設定値・CLI引数・カスタム変数の統合
- プロンプト内変数プレースホルダーの置換

#### 3.3 JSON Schema参照情報の埋め込み
- スキーマファイル内容の読み込み
- プロンプト内へのスキーマ情報埋め込み
- AIが参照するための形式整形

### 4. 結果の出力

#### 4.1 生成されたプロンプトの出力
- 完成したプロンプトの標準出力
- ファイル出力（指定された場合）

#### 4.2 エラー時の適切な処理
- `BreakdownLogger`によるログ出力
- エラー種別に応じた適切なメッセージ表示
- 復旧可能なエラーの処理

## データフロー

```
CLI引数 → BreakdownParams → 設定統合 → BreakdownConfig
                                    ↓
                              パス解決器群
                            (Prompt/Schema/Input/Output)
                                    ↓
                            PromptVariablesFactory
                                    ↓
                             BreakdownPrompt
                                    ↓
                               結果出力
```

## 主要コンポーネント

### パラメータ解析
- **BreakdownParams**: CLI引数解析・バリデーションの中核
- **ConfigPrefixDetector**: `--config`/`-c`オプションの検出

### 設定管理
- **BreakdownConfig**: アプリ・ユーザー設定の統合管理
- **WorkspaceConfig**: ワークスペース固有設定

### パス解決
- **PromptTemplatePathResolver**: プロンプトファイルパス計算
- **SchemaFilePathResolver**: スキーマファイルパス計算
- **InputFilePathResolver**: 入力ファイルパス計算
- **OutputFilePathResolver**: 出力ファイルパス計算

### プロンプト処理
- **PromptVariablesFactory**: 変数統合・プロンプト構築
- **BreakdownPrompt**: プロンプト生成・置換処理

### ユーティリティ
- **BreakdownLogger**: ログ出力・デバッグ情報管理

## エラーハンドリング

各フェーズで以下のエラー処理を実行：

1. **引数解析エラー**: 不正なCLI引数の検出・報告
2. **設定ファイルエラー**: 設定ファイル読み込み・形式エラーの処理
3. **ファイル解決エラー**: 存在しないファイル・ディレクトリの処理
4. **プロンプト生成エラー**: テンプレート・変数置換エラーの処理

## パフォーマンス考慮事項

- ファイル読み込みの最適化
- 不要な処理の回避
- メモリ効率的な文字列処理
- 並行処理可能な部分の特定

## 拡張ポイント

- 新しいDemonstrativeType・LayerTypeの追加
- カスタムパス解決戦略の実装
- プロンプトテンプレート形式の拡張
- 新しい出力形式の対応
