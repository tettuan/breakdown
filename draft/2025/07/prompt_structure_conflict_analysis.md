# PromptPath/PromptManager vs PromptCliParams 構造衝突分析

## 構造衝突の概要

現在のコードベースには2つの異なるプロンプト処理アプローチが存在しており、これらの統一が必要です：

### A: PromptPath + PromptManagerAdapter アプローチ
- **定義場所**: `docs/breakdown/overview/totality-type.ja.yml`
- **概念**: 全域性原則に基づく型定義
- **特徴**: 
  - `PromptManager.generatePrompt()`メソッドが中心
  - `PromptPath`（テンプレートパス）と`PromptVariables`を分離
  - Duck Typingによる変数統一

### B: PromptCliParams アプローチ  
- **定義場所**: `lib/types/prompt_variables.ts`, `lib/factory/prompt_variables_factory.ts`
- **概念**: 実装されている既存の型システム
- **特徴**:
  - `PromptCliParams`（レガシー）と`TotalityPromptCliParams`（新しい）
  - Factory Patternによる実装
  - 直接的な設定オプション管理

# 採用案
改善提案: Adapter Pattern + Factory Method で、改善する。

```
// 1. 抽象型を保持しつつ、変換責務を明確化
class PromptManagerAdapter {
  /**
   * 抽象型を受け取り、適切に変換してBreakdownPrompt APIを呼び出す
   */
  static async generatePrompt(
    template: PromptPath, 
    variables: PromptVariables
  ): Promise<PromptResult> {
    // Duck Typingパターンを活用
    const templatePath = template.toString();
    const variableDict = variables.toRecord();
    
    // BreakdownPrompt APIの直接呼び出し
    const manager = new PromptManager();
    return await manager.generatePrompt(templatePath, variableDict);
  }
```

# 削除: 
PromptCliParams, TotalityPromptCliParams, PromptParameterFactory, TotalityPromptManagerFactory

# 既知の重複
`new PromptManager\s*\(` で検索

```
[text](../../../lib/cli/handlers/two_params_handler_original.ts)

[text](../../../lib/prompt/new_prompt_manager_adapter.ts)

[text](../../../lib/prompt/prompt_adapter.ts)

[text](../../../lib/prompt/prompt_manager_adapter.ts) [text](../../../lib/prompt/prompt_manager_adapter.ts)

[text](../../../tests/integration/prompt_generation_pipeline_integration_test.ts) [text](../../../tests/integration/prompt_generation_pipeline_integration_test.ts)
```
