# パス解決インターフェース

## 概要

Breakdown CLIの**パス解決**は、**プロンプトパス決定ドメイン**として実装されています。このドキュメントでは、パラメータに応じたファイルパス解決の仕組みと、ユーザーがファイルを配置する際のルールを説明します。

## パス解決の基本構造

### ディレクトリ階層

```
プロジェクトルート/
├── lib/breakdown/prompts/        # app_prompt.base_dir
│   ├── to/                      # DirectiveType
│   │   ├── project/            # LayerType
│   │   │   ├── f_project.md    # 基本プロンプト
│   │   │   └── f_project_strict.md  # 適応タイプ付き
│   │   ├── issue/              # LayerType
│   │   │   ├── f_issue.md
│   │   │   └── f_task_detailed.md   # fromLayer指定
│   │   └── task/               # LayerType
│   │       ├── f_task.md
│   │       └── f_issue_quick.md     # fromLayer指定
│   ├── summary/                # DirectiveType
│   │   └── project/
│   │       └── f_project.md
│   └── defect/                 # DirectiveType
│       └── issue/
│           └── f_issue.md
└── lib/breakdown/schema/       # app_schema.base_dir
    ├── to/                     # DirectiveType
    │   ├── project/            # LayerType
    │   │   └── base.schema.json
    │   ├── issue/
    │   │   └── base.schema.json
    │   └── task/
    │       └── base.schema.json
    └── defect/
        └── issue/
            └── base.schema.json
```

## プロンプトファイルパス解決

### 基本的なパス解決ルール

1. **ベースディレクトリ** - `app_prompt.base_dir`
2. **DirectiveType** - 処理方向（to, summary, defect等）
3. **LayerType** - 処理階層（project, issue, task等）
4. **ファイル名** - `f_{fromLayer}[_{adaptation}].md`

### パス解決の実例

```bash
# 基本的なパス解決
breakdown to task
# → lib/breakdown/prompts/to/task/f_task.md

# 適応タイプ付きパス解決
breakdown to task --adaptation strict
# → lib/breakdown/prompts/to/task/f_task_strict.md

# fromLayer指定パス解決
breakdown to task --input issue
# → lib/breakdown/prompts/to/task/f_issue.md

# 複合指定パス解決
breakdown to task --input issue --adaptation detailed
# → lib/breakdown/prompts/to/task/f_issue_detailed.md
```

### ファイル名の構成ルール

```
f_{fromLayer}[_{adaptation}].md

例：
- f_project.md           # 基本形
- f_project_strict.md    # 適応タイプ付き
- f_issue_detailed.md    # fromLayer + 適応タイプ
- f_task_quick.md        # fromLayer + 適応タイプ
```

## スキーマファイルパス解決

### 基本的なパス解決ルール

1. **ベースディレクトリ** - `app_schema.base_dir`
2. **DirectiveType** - 処理方向
3. **LayerType** - 処理階層
4. **ファイル名** - `base.schema.json`（固定）

### スキーマパス解決の実例

```bash
# 基本的なスキーマパス解決
breakdown to task
# → lib/breakdown/schema/to/task/base.schema.json

# 異なるDirectiveTypeでのスキーマパス解決
breakdown summary project
# → lib/breakdown/schema/summary/project/base.schema.json

# 欠陥検出のスキーマパス解決
breakdown defect issue
# → lib/breakdown/schema/defect/issue/base.schema.json
```

## 入力・出力ファイルパス解決

### 入力ファイルパス解決

```bash
# 相対パス指定
breakdown to task -f input.md
# → カレントディレクトリ/input.md

# 絶対パス指定
breakdown to task -f /path/to/input.md
# → /path/to/input.md

# working_dir相対パス指定
breakdown to task -f ./work/input.md
# → カレントディレクトリ/work/input.md
```

### 出力ファイルパス解決

```bash
# 相対パス指定
breakdown to task -f input.md -o output.txt
# → カレントディレクトリ/output.txt

# working_dir相対パス指定
breakdown to task -f input.md -o result/output.txt
# → カレントディレクトリ/result/output.txt
```

## パス解決のフォールバック戦略

### プロンプトファイルのフォールバック

```
1. 指定されたファイル（適応タイプ + fromLayer）
   例：f_issue_detailed.md
   ↓（存在しない場合）
2. fromLayerのみのファイル
   例：f_issue.md
   ↓（存在しない場合）
3. 基本ファイル
   例：f_task.md
   ↓（存在しない場合）
4. エラー（適切なエラーメッセージ）
```

### フォールバック実例

```bash
# 1. 理想的なケース（全て存在）
breakdown to task --input issue --adaptation detailed
# → lib/breakdown/prompts/to/task/f_issue_detailed.md

# 2. 適応タイプなしのフォールバック
breakdown to task --input issue --adaptation nonexistent
# → lib/breakdown/prompts/to/task/f_issue.md

# 3. 基本ファイルへのフォールバック
breakdown to task --input nonexistent
# → lib/breakdown/prompts/to/task/f_task.md
```

## ハッシュ値生成とファイル名規則

### ハッシュ値の生成

```bash
# ハッシュ値を含むファイル名生成
breakdown to task -f input.md -o output.txt
# → output_a1b2c3d4.txt（ハッシュ値付き）

# ハッシュ値の構成要素
# - 入力ファイルのパス
# - コマンドライン引数
# - 実行時のタイムスタンプ
```

### ファイル名規則

```
{base_name}_{hash}.{extension}

例：
- output_a1b2c3d4.txt
- result_e5f6g7h8.json
- summary_i9j0k1l2.md
```

## パス解決のエラーハンドリング

### エラーの種類と対処

1. **プロンプトファイルが見つからない**
   ```
   エラー: パスは正確に生成されました: lib/breakdown/prompts/to/task/f_task_strict.md
   しかし、このファイルは存在しません。
   プロンプトテンプレートファイルの準備が必要です。
   ```

2. **設定ディレクトリが見つからない**
   ```
   エラー: ベースディレクトリが存在しません: lib/breakdown/prompts
   app_prompt.base_dir の設定を確認してください。
   ```

3. **権限エラー**
   ```
   エラー: ファイルの読み込み権限がありません: lib/breakdown/prompts/to/task/f_task.md
   ファイルの権限を確認してください。
   ```

## 設定別パス解決

### プロファイル別ディレクトリ

```yaml
# breakdown プロファイル
breakdown:
  app_prompt:
    base_dir: "lib/breakdown/prompts"
  app_schema:
    base_dir: "lib/breakdown/schema"

# search プロファイル
search:
  app_prompt:
    base_dir: "lib/search/prompts"
  app_schema:
    base_dir: "lib/search/schema"
```

### プロファイル別パス解決

```bash
# breakdown プロファイル
breakdown to task
# → lib/breakdown/prompts/to/task/f_task.md

# search プロファイル
breakdown -c search web query
# → lib/search/prompts/web/query/f_query.md
```

## パス解決のベストプラクティス

### 1. ディレクトリ構造の整理

```
lib/breakdown/
├── prompts/
│   ├── to/
│   │   ├── project/
│   │   │   ├── f_project.md      # 基本
│   │   │   └── f_project_strict.md  # 適応タイプ
│   │   ├── issue/
│   │   │   ├── f_issue.md
│   │   │   └── f_task_detailed.md   # fromLayer指定
│   │   └── task/
│   │       ├── f_task.md
│   │       └── f_issue_quick.md
│   ├── summary/
│   └── defect/
└── schema/
    ├── to/
    ├── summary/
    └── defect/
```

### 2. ファイル命名の一貫性

```
# 推奨命名パターン
f_{fromLayer}[_{adaptation}].md

# 例
f_project.md           # 基本
f_project_strict.md    # 厳密な適応
f_project_detailed.md  # 詳細な適応
f_issue_quick.md       # 高速な適応
f_task_minimal.md      # 最小限の適応
```

### 3. 設定の明確化

```yaml
# default-app.yml
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: "lib/breakdown/prompts"  # 明確なパス指定
app_schema:
  base_dir: "lib/breakdown/schema"   # 明確なパス指定
```

## 関連ドキュメント

- **[プロンプトパス決定ドメイン](../domain_core/prompt_template_path.ja.md)** - パス決定の詳細な仕組み
- **[プロンプトテンプレート](../templates/app_prompt.ja.md)** - プロンプトファイルの作成方法
- **[スキーマ管理](../templates/app_schema.ja.md)** - スキーマファイルの配置方法
- **[設定管理](./configuration.ja.md)** - 設定によるパス制御

---

**設計方針**: 確実性の保証による問題切り分けの明確化  
**更新日**: 2025年1月
