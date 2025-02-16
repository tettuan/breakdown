# アプリケーション設定の読み込み
## 実行概要
```bash
deno install -f --root ./deno --global cli/breakdown.ts 
```
でインストールしたあと、
以下のコマンドを実行すると
```bash
./.deno/bin/breakdown to project
```

アプリケーションの設定ファイル
`/breakdown/config/config.ts` 
を読み込む。

読み込んだ設定ファイルの内容を用いて、アプリケーションの挙動が変わるようにする。


## WorkingDirの設定
設定に `{"working_dir": "./.agent/breakdown"}` が記載されている。
このとき、次のコマンド
```bash
./.deno/bin/breakdown init
```
が実行されると、
次の「作業スペース作成処理」が行われる。

### 作業スペース作成処理
- `working_dir` の存在を確認する
  - ない場合は、作成する
    - 作成したことを伝えるメッセージを表示する
  - ある場合は、すでに存在することを伝えるメッセージを表示する


## 設定を読み込み後のチェック処理
### WorkingDirの存在が確認できない場合
- すべての処理を中断し、エラーメッセージを表示して終了する
  - メッセージ： breakdown init を実行し、作業フォルダを作成してください。
- なお、すでに存在しているディレクトリは保持したままで、削除しない。
