# アプリケーションSchema

実行時に、アプリケーションが利用するSchemaファイルを特定し、利用する。
渡された引数やオプションから、どのSchemaファイルを用いるか判別する。

## アプリケーションSchemaファイルの命名規則

- `./path.ja.md` を参照
- パラメータから、どのSchemaを使うかも決まるため、`./path.ja.md` の結果が、利用するSchemaを特定する

# スキーマ定義

Breakdownでは、各コマンドとレイヤーの組み合わせに対して、スキーマ定義を提供しています。
スキーマ定義は、プロンプトの出力に埋め込まれ、プロンプトをAIが解釈する際に、他のプロンプト入力値と並列で使用されます。

## スキーマの配置

- スキーマファイルは以下のディレクトリ構造で配置されています：

```
- lib/
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

## スキーマの構造

各スキーマファイルは、JSON Schemaの形式で記述されています。
