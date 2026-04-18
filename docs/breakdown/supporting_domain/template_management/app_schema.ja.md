# アプリケーションSchema

実行時に、アプリケーションが利用するSchemaファイルを特定し、利用する。
渡された引数やオプションから、どのSchemaファイルを用いるか判別する。

## アプリケーションSchemaファイルの命名規則とパス解決

- パラメータ（DirectiveType / LayerType）と Schema ファイルの対応関係、`app_schema.base_dir` を起点とするパス解決アルゴリズムは、正式参照である [app_factory.ja.md](../../generic_domain/factory/app_factory.ja.md) を参照すること。
- ディレクトリ階層の具体例は [interface/path_resolution.ja.md](../../interface/path_resolution.ja.md) も参考になる。

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

---

## CHANGELOG

### 2026-04-18: 設計ドキュメント整理
- パス解決・命名規則の説明を [app_factory.ja.md](../../generic_domain/factory/app_factory.ja.md) への参照に置換
- 「スキーマの配置」「スキーマの構造」を本ファイル固有の責務として残置
