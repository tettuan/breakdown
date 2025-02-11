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
to-project
to-issue
summary-issue
defect-issue
to-task
```
