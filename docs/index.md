# BreakDown Documentation

BreakDownは、TypeScriptとJSONを使ったAI自動開発のための開発指示言語ツールです。

## 目次

- [概要](#概要)
- [使用方法](usage.ja.md)
- [開発者向け情報](breakdown/index.ja.md)

## 概要

BreakDownは、MarkdownドキュメントをJSON
Schema形式に変換し、AIシステムが解釈しやすい形式にする変換ツールです。 主な特徴：

- AI解釈用に最適化されたMarkdownからJSONへの変換
- DenoランタイムによるTypeScript実装
- AI自動開発のための構造化フォーマット
- AIシステムのための学習しやすい構文
- CursorとClineのAI開発エージェントに最適化
- Claude-3.7-sonnetおよび他のAIモデルとの互換性

### 処理フロー

```mermaid
sequenceDiagram
  participant Developer as アプリ開発者
  participant CursorCline as Cursor/Cline
  participant AI as AIエンジン

  Developer->>Developer: プロジェクト概要や要望をMarkdownで記載し保存
  Developer->>CursorCline: `breakdown project <markdown.md>` 実行
  CursorCline->>CursorCline: コマンド実行
  CursorCline->>AI: マッピング依頼
  AI->>CursorCline: JSONへ変換
  CursorCline->>Developer: JSON指示書を取得
  Developer->>CursorCline: JSON指示書をAI開発エージェントに送信
  CursorCline->>AI: JSON指示書で開発指示
  AI->>AI: JSON指示書に基づき開発
  AI->>CursorCline: 成果物
```

# JSON Schema形式

- Schema定義は、別のドキュメントがあります。 https://github.com/tettuan/breakdownschema
- このライブラリでは、Schemaの中身を扱うことはありません。
- パラメータからSchemaのファイルPATHを特定するだけです。
