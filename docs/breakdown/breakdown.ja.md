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
