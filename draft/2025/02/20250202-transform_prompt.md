# 処理のイメージ

## 実行イメージ

### issueの場合

```
breakdown to issue <written_issue_1.md>  -o <issue-dir>
```

#### 内部的処理

- md: written_issue_1.mdを読み込む
- json: issue の JSONスキーマを取得
- prompt: `breakdown to issue` に相応しいPromptファイルを選択
- prompt + md + json を指示書として出力する

#### prompt 例

``````
以下のMarkdownを用いて、JSONスキーマに埋められる情報を埋めてください。

# markdwon
`````
<引数で示されたマークダウン>
`````

# JSON Schema
- Issue
- @Docs/breakdown
``````

### タスクの場合

```
breakdown to task <issue_1.json>  -o <tasks-dir>
```

#### 内部的処理

- input_json: issue_1.jsonを読み込む
- output_json: task の JSONスキーマを取得
- prompt: `breakdown to task` に相応しいPromptファイルを選択
- prompt + input_json + output_json を指示書として出力する

#### prompt 例

``````
以下のsource-jsonを用いて、JSONスキーマに埋められる情報を埋めてください。

# source-json
`````
<issue-1.json>
`````

# JSON Schema
- Task
- @Docs/breakdown
``````

# 課題

- prompt の配置構成が決まっていない
- input となる Markdownやjsonの配置が決まっていない
- prompt + markdown + JSONスキーマを結合する処理が未完成

# 解決の方向性

- `./breakdown/config.json` を作る
  - default設定
    - root: agent/breakdown
    - project directory : agent/breakdown/projects
    - issue directory : agent/breakdown/issues
    - task directory : agent/breakdown/tasks
- breakdownの使うデフォルトプロンプトは `./breakdown/prompots/*.prompt` に配置する
