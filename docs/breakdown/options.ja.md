
# breakdown 引数
## 基本コマンド
```bash
./deno/bin/breakdown
```

## 引数
```bash
./deno/bin/breakdown `$1` `$2` --from `<file>`
```

### $1
オプションの名称を `DemonstrativeType` とする。

#### DemonstrativeTypeの値
- 許可された値のみが有効
- 文字型
- いずれか
  - "to", "summary", "defect", "init"

### $2
オプションの名称を `LayerType` とする。

#### LayerTypeの値
- DemonstrativeType が "init" の場合は、引数の値が無視される
- 許可された値のみが有効
- 文字型
- いずれか
  - "project", "issue", "task"


###  --from `<file>`
オプションの名称を FromFile とする。
エイリアスで `-f` を用いる。
以下は同じ処理になる。
````bash
./deno/bin/breakdown --from `<file>`
./deno/bin/breakdown -f `<file>`
````

#### FromFile の値
-　`<file>` 部分を取得する。
  - ex. `--from ./.agent/breakdown/issues/issue_summary.md`
