# アプリケーションSchema
実行時に、アプリケーションが利用するSchemaファイルを特定し、利用する。
渡された引数やオプションから、どのSchemaファイルを用いるか判別する。

## プロンプトファイルの保存場所
app_configの設定ファイルに記載する。
```json
{
  "app_schema":
    {"base_dir": "./rules/schema/"}
}
```

## アプリケーションSchemaファイルの命名規則
`./path.ja.md` を参照

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

# スキーマ定義

Breakdownでは、各コマンドとレイヤーの組み合わせに対して、スキーマ定義を提供しています。
スキーマ定義は、プロンプトの出力形式を規定するために使用されます。

## スキーマの配置

- スキーマファイルは以下のディレクトリ構造で配置されています：

```
- rules/
  - schema/
    - to/
      - project/
        - base.schema.json
      - issue/
        - base.schema.json
      - task/
        - base.schema.json
    - summary/
      - project/
        - base.schema.json
      - issue/
        - base.schema.json
      - task/
        - base.schema.json
    - defect/
      - project/
        - base.schema.json
      - issue/
        - base.schema.json
      - task/
        - base.schema.json
```

+
+ 注: 開発環境では、スキーマファイルは `assets/schemas/` ディレクトリに配置されます。
+ 配布パッケージでは、これらのスキーマは `lib/schemas/definitions.ts` に埋め込まれています。
+

## スキーマの構造

各スキーマファイルは、JSON Schemaの形式で記述されています。


