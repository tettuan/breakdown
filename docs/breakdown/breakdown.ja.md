# Breakdown CLI 最新利用ガイド（Deno対応）

> 本仕様書は、Breakdown CLIのDeno環境におけるインストール・実行・運用方法を開発者向けに定義します。

## CLIのインストール・利用方法

Breakdown CLIはDeno 1.44以降の仕様に合わせて、以下の方法で利用できます。

### 1. バイナリとしてコンパイルして利用（推奨）

Denoの `deno compile` 機能でスタンドアロンバイナリを生成し、プロジェクトローカルで利用できます。

```bash
mkdir -p .deno/bin
# バイナリ生成
 deno compile -A -o .deno/bin/breakdown jsr:@tettuan/breakdown/cli
# 実行例
./.deno/bin/breakdown --help
```

### 2. deno task でJSRパッケージとして利用

`deno.json` にタスクを追加し、JSR経由でCLIを呼び出せます。

```jsonc
{
  "tasks": {
    "breakdown": "run -A jsr:@tettuan/breakdown/cli"
  }
}
```

実行例：
```bash
deno task breakdown --help
deno task breakdown to project <input.md> -o <output_dir>
```

### 3. グローバルインストール（システム全体で利用）

```bash
deno install -A -f --global -n breakdown jsr:@tettuan/breakdown
# 実行例
breakdown --help
```

### 4. 直接 deno run で実行

```bash
deno run -A jsr:@tettuan/breakdown/cli --help
deno run -A jsr:@tettuan/breakdown/cli to project <input.md> -o <output_dir>
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
./.deno/bin/breakdown to project -f <project_summary.md> -o <project_dir>
# または
deno task breakdown to project -f <project_summary.md> -o <project_dir>
```

### 課題分解
```bash
./.deno/bin/breakdown to issue -f <project.md> -o <issue_dir>
```

### タスク分解
```bash
./.deno/bin/breakdown to task -f <issue.md> -o <tasks_dir>
```

---

## 注意事項
- Deno 1.44以降では、`deno install --root` でのローカルインストール時にパーミッション付与ができません。
- プロジェクトローカルでの利用は「バイナリ化」または「deno task」推奨です。
- 生成したバイナリは `10_clean.sh` などでクリーンアップできます。
- 詳細な利用例は `examples/README.md` を参照してください。
