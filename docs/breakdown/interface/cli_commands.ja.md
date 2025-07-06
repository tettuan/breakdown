# CLIコマンド仕様

## 概要

Breakdown CLIは、**DirectiveType**と**LayerType**の組み合わせによる階層的なプロンプト生成を提供します。このドキュメントでは、コマンドライン引数の仕様と使用方法を説明します。

## 基本構文

```bash
breakdown <directive> <layer> [options]
```

### 基本パラメータ

- **`<directive>`** - 処理方向（DirectiveType）
  - `to` - 変換処理
  - `summary` - 要約処理
  - `defect` - 欠陥検出処理
  - ※*-user.ymlで自由に定義可能

- **`<layer>`** - 処理階層（LayerType）
  - `project` - プロジェクト階層
  - `issue` - 課題階層
  - `task` - タスク階層
  - ※*-user.ymlで自由に定義可能

## 基本的なコマンド例

### 1. 基本的な変換処理

```bash
# タスクへの変換
breakdown to task

# プロジェクトの要約
breakdown summary project

# 課題の欠陥検出
breakdown defect issue
```

### 2. ファイル入力を使用した処理

```bash
# ファイルからタスクへの変換
breakdown to task -f input.md

# ファイルからプロジェクトの要約
breakdown summary project --from input.md
```

### 3. 出力ファイルの指定

```bash
# 結果を指定したファイルに出力
breakdown to task -f input.md -o output.txt

# 結果を指定したファイルに出力（長形式）
breakdown to task --from input.md --output output.txt
```

## オプション仕様

### 基本オプション

| オプション | 短縮形 | 説明 | 例 |
|-----------|--------|------|-----|
| `--from` | `-f` | 入力ファイルを指定 | `-f input.md` |
| `--output` | `-o` | 出力ファイルを指定 | `-o output.txt` |
| `--adaptation` | `-a` | プロンプト適応タイプ | `-a strict` |
| `--config` | `-c` | 設定プロファイル | `-c search` |
| `--debug` | `-d` | デバッグモード | `-d` |
| `--help` | `-h` | ヘルプ表示 | `-h` |
| `--version` | `-v` | バージョン表示 | `-v` |

### 高度なオプション

| オプション | 説明 | 例 |
|-----------|------|-----|
| `--use-schema` | スキーマ使用フラグ | `--use-schema` |
| `--uv-<key>` | カスタム変数 | `--uv-priority=高` |
| `--input` | 入力階層の明示的指定 | `--input issue` |

## 使用例

### 基本的な使用パターン

```bash
# 1. 標準入力からタスクへの変換
echo "要件を整理してください" | breakdown to task

# 2. ファイルからプロジェクトへの変換
breakdown to project -f requirements.md

# 3. 厳密なプロンプトを使用した変換
breakdown to task -f input.md --adaptation strict

# 4. カスタム変数を使用した処理
breakdown to task -f input.md --uv-priority=高 --uv-assignee=田中

# 5. 異なる設定プロファイルの使用
breakdown -c search web query -f input.md
```

### 複合的な使用パターン

```bash
# 1. 完全な指定による変換
breakdown to task \
  --from input.md \
  --output result.txt \
  --adaptation detailed \
  --use-schema \
  --uv-version=2.0 \
  --debug

# 2. パイプラインでの使用
cat requirements.md | breakdown summary project > summary.txt

# 3. 複数のカスタム変数を使用
breakdown to issue \
  --from story.md \
  --uv-priority=緊急 \
  --uv-assignee=山田 \
  --uv-deadline=2024-12-31
```

## エラーハンドリング

### 一般的なエラー

1. **無効なDirectiveType**
   ```bash
   breakdown invalid task
   # エラー: 'invalid' は有効なDirectiveTypeではありません
   ```

2. **無効なLayerType**
   ```bash
   breakdown to invalid
   # エラー: 'invalid' は有効なLayerTypeではありません
   ```

3. **ファイルが見つからない**
   ```bash
   breakdown to task -f nonexistent.md
   # エラー: ファイル 'nonexistent.md' が見つかりません
   ```

### エラーメッセージの解釈

- **設定エラー** - 設定ファイルの準備が必要
- **パラメータエラー** - コマンドライン引数の修正が必要
- **ファイルエラー** - ファイルの準備または権限の確認が必要

## 設定との連携

### プロファイル切り替え

```bash
# デフォルト設定（breakdown プロファイル）
breakdown to task

# 検索設定（search プロファイル）
breakdown -c search web query

# カスタム設定（custom プロファイル）
breakdown -c custom analyze data
```

### 設定ファイルでの定義

```yaml
# *-user.yml
breakdown:
  two:
    directive:
      patterns:
        - "to"
        - "summary"
        - "defect"
    layer:
      patterns:
        - "project"
        - "issue"
        - "task"

search:
  two:
    directive:
      patterns:
        - "web"
        - "rag"
        - "db"
    layer:
      patterns:
        - "query"
        - "index"
        - "data"
```

## ヘルプとバージョン情報

### ヘルプ表示

```bash
breakdown --help
breakdown -h
breakdown to --help  # 特定のコマンドのヘルプ
```

### バージョン情報

```bash
breakdown --version
breakdown -v
```

## 関連ドキュメント

- **[設定管理](../configuration/app_config.ja.md)** - 設定ファイルの準備
- **[パラメータ型](../domain_core/two_params_types.ja.md)** - DirectiveTypeとLayerTypeの詳細
- **[プロンプトテンプレート](../templates/app_prompt.ja.md)** - プロンプトファイルの準備
- **[パス解決](../templates/path.ja.md)** - ファイルパスの解決ルール

---

**設計方針**: ユーザーフレンドリーなCLIインターフェースの提供  
**更新日**: 2025年1月
