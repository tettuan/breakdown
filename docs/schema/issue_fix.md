# イシュー修正スキーマ

このドキュメントでは、Breakdownシステムにおけるイシュー修正ファイルの構造と使用方法について説明します。

## 概要

イシュー修正ファイルは、単一のイシュー、その分析、および解決策を記述するJSONドキュメントです。各ファイルは、必要なすべての情報が一貫して取得されることを保証する厳格なスキーマに従います。

## スキーマ構造

### ルートプロパティ

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| issueId | はい | 文字列 | 一意の識別子（形式：YYYYMMDD-description） |
| title | はい | 文字列 | イシューの簡単な説明 |
| gap | はい | オブジェクト | 理想と現在の状態の間のギャップ |
| errorSummary | はい | オブジェクト | エラー状況の概要 |
| analysis | はい | オブジェクト | イシューの詳細分析 |
| solution | はい | オブジェクト | 提案された解決策とタスク |
| references | はい | 配列 | 関連ファイルとドキュメント |
| scope | はい | 文字列 | イシューの範囲："minimal"または"comprehensive" |
| mingoal | はい | オブジェクト | 最小機能、テスト、および証明要件 |

### ギャップ分析

理想と現在の状態の間のギャップを記述します：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| ideal | はい | 文字列 | 望ましい状態の説明 |
| current | はい | 文字列 | 現在の状態の説明 |
| impact | はい | 文字列 | このギャップがプロジェクトに与える影響 |
| minGoalLink | はい | 文字列 | 最小目標ドキュメントへのリンク |

### エラーサマリー

エラーの直接的なコンテキストを含みます：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| command | はい | 文字列 | エラーを引き起こしたコマンド |
| previousChanges | はい | 文字列 | エラー前のコード変更 |
| reason | はい | 文字列 | 全体的なエラーの説明 |

### 分析

イシューの詳細な内訳：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| requirements | はい | 文字列[] | 要件ファイルパス |
| design | はい | 文字列[] | 設計ファイルパス |
| errors | はい | オブジェクト[] | 特定のエラーのリスト |

#### エラー詳細

errorsの配列の各エラーには以下が含まれます：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| file | はい | 文字列 | エラーファイルの場所 |
| line | はい | 整数 | エラー行番号 |
| message | はい | 文字列 | エラーメッセージ |
| type | はい | 列挙型 | エラータイプ：code/data/syntax |
| source | はい | 列挙型 | エラーソース：typescript/deno/application |
| analysis | はい | オブジェクト | 詳細なエラー分析 |
| priority | はい | 整数 | 優先度レベル（1-5） |

##### エラー分析プロパティ

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| occurrenceCount | はい | 整数 | エラーが発生した回数 |
| relatedFiles | はい | 文字列[] | このエラーに関連するファイル |
| triggersOtherErrors | はい | ブール値 | エラーが他のエラーを引き起こすかどうか |

### 解決策

提案された修正と実装計画：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| approach | はい | 文字列 | 全体的な解決アプローチ |
| tasks | はい | オブジェクト[] | 実装タスク |
| minGoalAlignment | はい | 文字列 | 解決策が最小目標とどのように一致するか |

#### タスクプロパティ

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| id | はい | 文字列 | タスク識別子 |
| description | はい | 文字列 | タスクの説明 |
| type | はい | 列挙型 | タスクタイプ：code/test/config/docs |
| status | はい | 列挙型 | ステータス：pending/in-progress/completed |

### 参照

関連ファイルへのリンク：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| type | はい | 列挙型 | 参照タイプ：requirement/design/test/code/mingoal |
| path | はい | 文字列 | 参照ファイルへのパス |

### 最小目標

最小機能とその検証を定義します：

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| function | はい | オブジェクト | 対象機能の定義 |
| test | はい | オブジェクト | テスト要件 |
| proof | はい | オブジェクト | 解決策の検証 |

#### 機能定義

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| description | はい | 文字列 | 最小機能の説明 |
| requirements | はい | 文字列[] | 特定の要件リスト |

#### テスト定義

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| description | はい | 文字列 | テストする必要があるもの |
| criteria | はい | 文字列[] | テスト成功基準 |

#### 証明定義

| プロパティ | 必須 | 型 | 説明 |
|----------|----------|------|-------------|
| description | はい | 文字列 | 解決策が機能することを証明する方法 |
| verificationMethod | はい | 列挙型 | 方法：test/demo/review |

## 使用例

```json
{
  "issueId": "20250209-typescript-config",
  "title": "TypeScript Configuration Error in Path Resolution",
  "gap": {
    "ideal": "TypeScript path aliases should resolve correctly for all imports",
    "current": "Path aliases fail to resolve in specific test files",
    "impact": "Prevents running tests and blocks CI pipeline",
  },
  "errorSummary": {
    "command": "deno test",
    "previousChanges": "Updated import map configuration",
    "reason": "Import map configuration conflicts with TypeScript paths"
  },
  "analysis": {
    "requirements": ["draft/20250207-defect.md"],
    "design": ["draft/20250207-design.md"],
    "errors": [
      {
        "file": "src/utils/path.ts",
        "line": 42,
        "message": "Cannot find module '@types/command.ts'",
        "type": "code",
        "source": "typescript",
        "analysis": {
          "occurrenceCount": 3,
          "relatedFiles": ["src/cli/breakdown.ts"],
          "triggersOtherErrors": true
        },
        "priority": 1
      }
    ]
  },
  "solution": {
    "approach": "Update import map configuration to align with TypeScript path aliases",
    "tasks": [
      {
        "id": "FIX-001",
        "description": "Update import map paths",
        "type": "config",
        "status": "pending"
      }
    ],
    "minGoalAlignment": "Directly addresses core functionality requirement of working imports"
  },
  "references": [
    {
      "type": "design",
      "path": "draft/20250207-design.md"
    },
    {
      "type": "mingoal",
      "path": "docs/mingoal.md"
    }
  ],
  "scope": "minimal",
  "mingoal": {
    "function": {
      "description": "TypeScript path alias resolution in test files",
      "requirements": [
        "Must resolve all import aliases in test files",
        "Must maintain compatibility with Deno import maps"
      ]
    },
    "test": {
      "description": "Verify path alias resolution in test environment",
      "criteria": [
        "All test files can import using aliases",
        "No TS2307 errors in test execution"
      ]
    },
    "proof": {
      "description": "Run test suite with path aliases",
      "verificationMethod": "test"
    }
  }
}
```

## 注意

- すべてのファイルパスはプロジェクトルートからの相対パスであるべきです
- 優先度レベルは1（最高）から5（最低）の範囲です
- タスクIDはFIX-NNNの形式に従うべきです
- issueIdの日付はYYYYMMDD形式を使用すべきです
- スコープの値：
  - "minimal"：イシューが最小目標に直接対応する
  - "comprehensive"：イシューがより広範な改善に対応する
- minGoalLinkはdocs/mingoal.mdの特定のセクションを参照すべきです 