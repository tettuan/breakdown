# 定義
```bash
./deno/bin/breakdown
```
は、「インストール」されたCLIのコマンド名である。

# インストール
```bash
deno install -f --root ./deno --global cli/breakdown.ts
```

# 基本実装

以下のコマンドを実行したときに、 "Result Output" が出力される。
```bash
./deno/bin/breakdown to
```

## 引数
次のファイルを読み込むこと。
`@/docs/breakdown/options.ja.md`

## Result Output
```
to
```

## Deno Test
```bash
deno test -A
```

# 入力値
以下のコマンドを実行したときに、 "Result Output2" が出力される。
```bash
./deno/bin/breakdown to project
./deno/bin/breakdown to issue
./deno/bin/breakdown summary issue
./deno/bin/breakdown defect issue
./deno/bin/breakdown to task
```

## Result Output2
```
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
```

# 入力ファイル指定の入力
以下のコマンドを実行したときに、 "Result Output3" が出力される。
```bash
./deno/bin/breakdown to project -f ./.agent/breakdown/issues/issue_summary.md
```

## Result Output3
```
./.agent/breakdown/issues/issue_summary.md
```

# 出力ファイル指定の入力
以下のコマンドを実行したときに、 "Result Output4" が出力される。
```bash
./deno/bin/breakdown to issue -f ./.agent/breakdown/issues/project_summary.md -o ./.agent/breakdown/issues/issue_summary.md
```

## Result Output4
```
./.agent/breakdown/issues/project_summary.md --> ./.agent/breakdown/issues/issue_summary.md
```

# 設定の読み込み
次のファイルを読み込むこと。
アプリケーション設定： `/docs/breakdown/app_config.ja.md`


