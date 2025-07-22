# プロジェクト分解プロンプト

## 目的
このプロンプトは、プロジェクトレベルの要件を具体的なタスクに分解するためのテンプレートです。

## 入力
- プロジェクト名: ${projectName}
- プロジェクト概要: ${projectDescription}
- 期限: ${deadline}
- 優先度: ${priority}

## 処理指示
以下の観点でプロジェクトを分解してください：

1. **目標の明確化**
   - プロジェクトの最終成果物を定義
   - 成功基準を具体化

2. **フェーズ分割**
   - プロジェクトを論理的なフェーズに分割
   - 各フェーズの依存関係を明確化

3. **タスク分解**
   - 各フェーズを実行可能なタスクに分解
   - タスクの粒度は1-3日で完了可能なレベル

4. **リソース配分**
   - 必要なスキルセットの特定
   - 工数見積もり

## 出力形式
JSON形式で以下の構造に従って出力してください：

```json
{
  "projectId": "${projectId}",
  "phases": [
    {
      "phaseId": "string",
      "phaseName": "string",
      "description": "string",
      "tasks": [
        {
          "taskId": "string",
          "taskName": "string",
          "description": "string",
          "estimatedHours": number,
          "dependencies": ["taskId"],
          "requiredSkills": ["skill"]
        }
      ]
    }
  ]
}
```

## 制約事項
- タスクは具体的で測定可能な成果物を持つこと
- 依存関係は循環しないこと
- 各タスクは独立して割り当て可能であること
