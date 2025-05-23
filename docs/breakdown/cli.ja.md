# コマンドライン引数仕様

## 基本構文

```bash
breakdown <demonstrative> [layer] [options]
```

### demonstrative (必須)

変換や要約の種類を指定します：

- `to`: Markdownから構造化JSONへの変換
- `summary`: 構造化JSONからMarkdownの要約生成
- `defect`: エラーログからの問題分析
- `init`: 作業ディレクトリの初期化

### layer (demonstrativeがinitの場合は不要)

処理対象の階層を指定します：

- `project`: プロジェクト概要レベル
- `issue`: 課題レベル
- `task`: タスクレベル

## オプション

### 入力ソース指定

- `--from <file>`, `-f <file>`: 入力ファイルの指定

### 出力先指定

- `--destination <path>`, `-o <path>`: 出力先の指定
  - ディレクトリの場合: 自動的にファイル名を生成
  - ファイルの場合: 指定されたファイル名で出力
  
  > destinationPathはテンプレート埋め込み用の値であり、必ずしもファイル出力を伴いません。

### プロンプト制御

- `--adaptation <type>`, `-a <type>`: プロンプトの種類を指定
  - 例: `strict`, `a` など
  - プロンプトファイル名に影響: `f_{fromLayerType}_{adaptation}.md`

## 標準入出力

### 標準入力からの読み込み

```bash
echo "<content>" | breakdown <demonstrative> <layer> -o <output>
tail -100 "<log_file>" | breakdown defect <layer> -o <output>
```

### 標準出力への出力

結果は標準出力に出力されます。

## パス解決

### 作業ディレクトリ

- `init`コマンドで初期化された作業ディレクトリを基準
- 未初期化の場合はエラー
- 詳細な実装については[Workspace仕様書](./workspace.ja.md)を参照
- パス解決の実装詳細は[PromptVariablesFactory](./app_factory.ja.md)を参照

### パス解決の実装

WorkspaceとPromptVariablesFactoryは以下の関係で連携します：

1. Workspace
   - 作業ディレクトリの管理
   - 設定ファイル（app.yml）の読み込み
   - 基本的なパス解決機能の提供

2. PromptVariablesFactory
   - Workspaceの設定とCLIパラメータを統合
   - プロンプト、スキーマ、入出力ファイルのパスを生成
   - パス解決の一元化と一貫性の確保

### パスの自動補完

1. 完全パスの場合: そのまま使用
2. ファイル名のみの場合:
   - 作業ディレクトリ
   - コマンドタイプ（to/summary/defect）
   - レイヤータイプ（project/issue/task） に基づいて補完

### 自動ファイル名生成

出力先がディレクトリの場合:

```
<yyyymmdd>_<random_hash>.md
```

## エラー処理

### 必須チェック

1. demonstrativeの指定
2. layerの指定（init以外）
3. 入力ソースの指定

### 実行前チェック

1. 作業ディレクトリの存在確認
2. 入力ファイルの存在確認
3. 出力先の書き込み権限確認

### エラーメッセージ

- 英語で出力
- エラーの原因と対処方法を明示
