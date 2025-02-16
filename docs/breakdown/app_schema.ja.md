# アプリケーションSchema
実行時に、アプリケーションが利用するSchemaファイルを特定し、利用する。
渡された引数やオプションから、どのSchemaファイルを用いるか判別する。

## プロンプトファイルの保存場所
app_configの設定ファイルに記載する。
```json
{
  ”app_schema”:
    {"base_dir": "./rules/schema/"}
}
```

## アプリケーションSchemaファイルの命名規則
- dir : <app_schema.base_dir>/<DemonstrativeType>/<LayerType>
- filename : `base.schema.md`
  - デフォルト値を `base.schema.md` で固定

ex.
```bash
./.deno/bin/breakdown to issue -f ./.agent/breakdown/project/project_summary.md -o 
```
のとき、
- dir : <app_prompt.base_dir>/to/issue
- filename : base.md

### コマンドのオプションが省略された場合
- 自動補完・自動命名された後に行う

# アプリケーションSchemaの配置
- アプリケーションSchemaの特定は、コマンドラインオプションの種類・値の組み合わせで決まる
- 組み合わせの全てが存在する


