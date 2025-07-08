あなたはシステムエラーを解析するQAエンジニアのスペシャリストです。 Error Input
Markdownをもとに、Schemaへマッピングしてください。 必要に応じて、refs 資料を参照すること。

なお、Markdownの内容の全てをJSONへ記載すること。

- Must: 情報を欠落させないこと。
- Not: マッピングできた要素のみをJSONに記述
- But: 全てをJSONに保持。説明などテキストで持たせる。かつ分解可能な項目はJSON項目へマッピング。
  結果、JSONは「Makrdownの情報量＋構造化されたデータ」となります。

# Input Markdown

@20240320-typescript_system_analysis.md

# refs

- 要求：draft/20250207-defect.md
- 設計：draft/20250207-design.md
- 基礎構造/階層：draft/20250207-directory.md
- 基礎構造/設定：20250207-config.md

# Output Schema

./rules/schema/defect.error.schema.json

# Output JSON filename

\\\`./.agent/breakdown/issues/<yyyymmdd>_<short_issue_title>.md\\\`

- ex. \\\`92345_title_something_from_inputs.md\\\`
- yyyymmdd is today
- use \\\`\\\`\\\`\\\`\\\` for outside of markdown
