# breakdown 引数の仕様
## 基本コマンド
```bash
./.deno/bin/breakdown
```

## 引数

### 設定やヘルプやバージョン確認:
```bash
./.deno/bin/breakdown `$1`
```

#### $1
オプションの名称を `AppParams` とする。

- `init` : 初期設定を行う。

### ユースケース:
```bash
./.deno/bin/breakdown `$1` `$2` \
  --from `<file>` \
  --destination `<output_file>` \
  --input `<from_layer_type>` \
```

#### $1
オプションの名称を `DemonstrativeType` とする。

##### DemonstrativeTypeの値
- 許可された値のみが有効
- 文字型
- いずれか
  - "to", "summary", "defect", "init"

#### $2
オプションの名称を `LayerType` とする。

##### LayerTypeの値
- DemonstrativeType が "init" の場合は、引数の値が無視される
- 許可された値のみが有効
- 文字型
- いずれか
  - "project", "issue", "task"


####  --from `<file>`
オプションの名称を FromFile とする。
エイリアスで `-f` を用いる。
以下は同じ処理になる。
````bash
./.deno/bin/breakdown --from `<file>`
./.deno/bin/breakdown -f `<file>`
````

##### FromFile の値
-　`<file>` 部分を取得する。
  - ex. `--from ./.agent/breakdown/issues/issue_summary.md`
- 「Path の自動補完」がなされる。

#### --destination `<output_file>`
オプションの名称を DestinationFile とする。
エイリアスで `-o` を用いる。
以下は同じ処理になる。
````bash
./.deno/bin/breakdown --destination `<output_file>`
./.deno/bin/breakdown -o `<output_file>`
````

##### DestinationFile の値
-　`<output_file>` 部分を取得する。
  - ex. `--destination ./.agent/breakdown/issues/issue_summary.md`
- 「Path の自動補完」がなされる。
- 「出力ファイル名の自動作成」がなされる。

#### Path の自動補完
FromFile と DestinationFile は、Pathの自動補完がされる。

DestinationFile と DestinationFile は同じ自動補完なので、以下は両者を
Inputfile とする。

- Inputfile が path 情報を含む場合、何も補完しない。渡された値をそのまま利用する。
  - ex. `--destination ./.agent/breakdown/issues/issue_summary.md`
- Inputfile が path 情報を含まない場合、PATHの補完処理を、ルールに従って行う。
  - ex. `--destination issue_summary.md`
- 補完処理のルール
  - 設定の working_directory を先頭に用いる
  - 次に、DemonstrativeType を用いる
  - 最後に、Inputfile を続ける
  - つまり `<working_directory>/<DemonstrativeType>/issue_summary.md` 
  - ex. 
  working_directory 設定は `./.agent/breakdown` とする。
  ```bash
  ./.deno/bin/breakdown to issue -f issue_summary.md
  ```
  のとき、-fは `./.agent/breakdown/issues/issue_summary.md` へ補完される
  - ex2. 
  ```bash
  ./.deno/bin/breakdown to issue -o issue_summary.md
  ```
  のとき、-oは `./.agent/breakdown/issues/issue_summary.md` へ補完される


#### 出力ファイル名の自動作成
`-o`か`--destination` パラメータが存在する、かつファイル名が空白の場合のみ行う。

実行例：
```bash
./.deno/bin/breakdown to issue -o 
```

- DestinationFile が指定されていないとき、ファイル名を生成する
- Pathは、「Path の自動補完」に従う
- ファイル名のみ生成する
  - <yyyymmdd>_<ランダムなハッシュ値>.md
  ex. 20250211_e81d0bd.md 

#### --input `<from_layer_type>`
オプションの名称を FromLayerType とする。
エイリアスで `-i` を用いる。
以下は同じ処理になる。
````bash
./.deno/bin/breakdown --input `<from_layer_type>`
./.deno/bin/breakdown -i `<from_layer_type>`
````

##### 優先順位
- `--input`（または`-i`）オプションが指定された場合、FromLayerTypeの特定に使用される
- `--from`（または`-f`）オプションは常にファイルパスの指定に使用される
- FromLayerTypeの特定には`--input`オプションが優先的に使用され、指定がない場合のみ`--from`オプションのファイル名から推測される

##### FromLayerType の値
-　`<from_layer_type>` 部分を取得する。
  - ex. `--input project_summary`, `--i error`
- 「FromLayerTypeの特定処理」がなされる。

###### FromLayerTypeの特定処理
- `<from_layer_type>` を入力値とする。
- FromLayerType が取りうる値は以下の値のみである。
  - "project", "issue", "task"
- 以下のルールで `<from_layer_type>` をチェックし、FromLayerType を選択する。上から夕羽扇的に一致させる。UP/low case問わない。
  - project : 次のワードのいずれかに一致する
    - project, pj, prj 
  - issue : 次のワードのいずれかに一致する
    - issue, story
  - task : 次のワードのいずれかに一致する
    - task, todo, chore, style, fix, error, bug

##### 用途
* 入力内容の種類判定
* prompt file pathの特定
