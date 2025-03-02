# エラー分析スキーマ

## 概要

```mermaid
graph TD
    A[Error Analysis] -->|Contains| B[Error Summary]
    A -->|Contains| C[Requirement Analysis]
    A -->|Contains| D[Error Details]
    
    B -->|Has| B1[Trigger Command]
    B -->|Has| B2[Previous Changes]
    B -->|Has| B3[Error Reason]
    
    C -->|Has| C1[Requirement Files]
    C -->|Has| C2[Design Files]
    C -->|Has| C3[Summary]
    
    D -->|Contains| E[Error Entry]
    E -->|Has| E1[File Info]
    E -->|Has| E2[Error Content]
    E -->|Has| E3[Error Analysis]
    E -->|Has| E4[Error Response]
```

## 構造

```mermaid
erDiagram
    ErrorAnalysis ||--|{ ErrorDetails : contains
    ErrorAnalysis {
        object errorSummary
        object requirementAnalysis
        array errorDetails
    }
    
    ErrorDetails {
        string fileName
        integer line
        object errorContent
        object errorAnalysis
        object errorResponse
    }
    
    ErrorDetails ||--|| ErrorContent : has
    ErrorContent {
        string message
        enum errorType
        enum errorSource
    }
    
    ErrorDetails ||--|| ErrorAnalysis : has
    ErrorAnalysis {
        integer occurrenceCount
        array relatedFiles
        boolean triggersOtherErrors
    }
    
    ErrorDetails ||--|| ErrorResponse : has
    ErrorResponse {
        string requirementJudgment
        string designJudgment
        string dependencyJudgment
        integer priority
    }
```

## エラータイプ

```mermaid
classDiagram
    class ErrorType {
        <<enumeration>>
        code
        data
        syntax
    }
    
    class ErrorSource {
        <<enumeration>>
        typescript
        deno
        application
    }
```

## エラー分析の状態

```mermaid
stateDiagram-v2
    [*] --> Analysis
    Analysis --> ErrorCollection
    ErrorCollection --> RequirementCheck
    RequirementCheck --> PriorityAssignment
    PriorityAssignment --> [*]
```

## 属性

### エラーコンテンツ
- **message**: 実際のエラーメッセージテキスト
- **errorType**: 
  - `code`: ロジックまたは実装エラー
  - `data`: データ構造またはフォーマットエラー
  - `syntax`: 言語構文エラー
- **errorSource**:
  - `typescript`: TypeScriptコンパイラエラー
  - `deno`: Denoランタイムエラー
  - `application`: アプリケーション固有のエラー

### エラー分析
- **occurrenceCount**: このエラーが発生した合計回数
- **relatedFiles**: エラーチェーンに関連するファイルのリスト
- **triggersOtherErrors**: このエラーが他のカスケードエラーを引き起こすかどうか

### エラー対応
- **requirementJudgment**: コードを修正するか要件を更新するかの判断
- **designJudgment**: コードを修正するか設計を更新するかの判断
- **dependencyJudgment**: このエラーを直接修正するか依存関係を先に対処するかの判断
- **priority**: 整数の優先順位ランキング（1-5）
  - `5（重大）`: システム操作をブロックするかデータ破損を引き起こす
  - `4（高）`: コア機能に深刻な影響を与える
  - `3（中）`: 重要でない機能に影響するか回避策がある
  - `2（低）`: 影響が最小限の軽微な問題
  - `1（些細）`: 見た目の問題や機能強化要求

```mermaid
classDiagram
    class Priority {
        <<enumeration>>
        5: Critical
        4: High
        3: Medium
        2: Low
        1: Trivial
    }
``` 