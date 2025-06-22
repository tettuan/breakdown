# Breakdown CLI 最新利用ガイド（Deno 2対応）

> 本仕様書は、Breakdown CLIのDeno 2環境におけるインストール・実行・運用方法を開発者向けに定義します。

## CLIのインストール・利用方法

Breakdown CLIはDeno 2以降の仕様に合わせて、以下の方法で利用できます。

### 1. バイナリとしてコンパイルして利用（推奨）

Denoの `deno compile` 機能でスタンドアロンバイナリを生成し、プロジェクトローカルで利用できます。

```bash
mkdir -p .deno/bin
# バイナリ生成
 deno compile -A -o .deno/bin/breakdown jsr:@tettuan/breakdown
# 実行例
./.deno/bin/breakdown --help
```

### 2. deno task でJSRパッケージとして利用

`deno.json` にタスクを追加し、JSR経由でCLIを呼び出せます。

```jsonc
{
  "tasks": {
    "breakdown": "deno run -A jsr:@tettuan/breakdown"
  }
}
```

実行例：
```bash
deno task breakdown --help
deno task breakdown to project <input.md> -o=<output_dir>
```

### 3. グローバルインストール（システム全体で利用）

```bash
deno install -A -f --global -n breakdown jsr:@tettuan/breakdown
# 実行例
breakdown --help
```

### 4. 直接 deno run で実行

```bash
deno run -A jsr:@tettuan/breakdown --help
deno run -A jsr:@tettuan/breakdown to project <input.md> -o=<output_dir>
```

### 5. シェルスクリプトラッパーの作成

バイナリのような使い勝手でCLIを呼び出すシェルスクリプトを作成できます：

```bash
mkdir -p .deno/bin

# JSR直接（任意の場所から）
echo '#!/bin/bash
deno run -A jsr:@tettuan/breakdown "$@"' > .deno/bin/breakdown

chmod +x .deno/bin/breakdown
```

実行例：
```bash
./.deno/bin/breakdown --help
./.deno/bin/breakdown to project -f=input/project.md -o=output/
./.deno/bin/breakdown to task -f=/absolute/path/issue.md -o=/absolute/path/tasks/
```

### 6. deno add でパッケージ管理

Deno 2の新しいパッケージ管理機能を使用：

```bash
# 依存関係として追加
deno add jsr:@tettuan/breakdown
```

`deno.json`にtasksを手動追加：
```jsonc
{
  "dependencies": {
    "@tettuan/breakdown": "jsr:@tettuan/breakdown@^1.0.0"
  },
  "tasks": {
    "breakdown": "deno run -A @tettuan/breakdown",
    "bd": "deno run -A @tettuan/breakdown"
  }
}
```

---

## CLIコマンド例

### プロジェクト初期化
```bash
./.deno/bin/breakdown init
# または
deno task breakdown init
```

### プロジェクト分解
```bash
./.deno/bin/breakdown to project -f=<project_summary.md> -o=<project_dir>
# または
deno task breakdown to project -f=<project_summary.md> -o=<project_dir>
```

### 課題分解
```bash
./.deno/bin/breakdown to issue -f=<project.md> -o=<issue_dir>
```

### タスク分解
```bash
./.deno/bin/breakdown to task -f=<issue.md> -o=<tasks_dir>
```

---

## 注意事項
- Deno 2以降では、`deno install --root` でのローカルインストール時にパーミッション付与ができません。
- プロジェクトローカルでの利用は「バイナリ化」または「deno task」推奨です。
- Deno 2では新しいパッケージ管理コマンド（`deno add`, `deno remove`）が利用可能です。
- 生成したバイナリは `10_clean.sh` などでクリーンアップできます。
- 詳細な利用例は `examples/README.md` を参照してください。

