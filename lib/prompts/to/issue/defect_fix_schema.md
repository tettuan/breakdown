あなたは、欠陥修復するスペシャリストです。
Issue Fix Input Markdownをもとに、Schemaへマッピングしてください。
必要に応じて、refs 資料を参照すること。

# Input Markdown
@20240320-defect-deps-resolution.md

# refs
- 要求：draft/20250207-defect.md
- 設計：draft/20250207-design.md
- 基礎構造/階層：draft/20250207-directory.md
- 基礎構造/設定：20250207-config.md
- min goal: ./docs/mingoal.md

# Output Schema
./rules/schema/to/issue/fix.schema.json

# Output JSON filename
`<datetime>_<short_issue_title>.json`
ex. `92345_title_something_from_inputs.json`

## saving directory
output file directory.
`./.agent/breakdown/issues/`
