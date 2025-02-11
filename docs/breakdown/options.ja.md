
# breakdown 引数
## 基本コマンド
```bash
./deno/bin/breakdown
```

## 引数
```bash
./deno/bin/breakdown `$1` `$2`
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

