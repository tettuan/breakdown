# バリデーションルールスキーマ

## 概要

このドキュメントでは、breakdownがMarkdownをJSONに変換するために使用するルールと規則について説明します。

## ノードタイプ

### 見出し
- レベル（1-6）が必要
- 内容は必須
- 空の見出しは許可されない

### リスト
- 最大3レベルまでネスト可能
- 順序付きリストと順序なしリストの両方がサポートされている
- リストアイテムには内容が必要

### コードブロック
- 言語指定が必要
- 内容は空でも可
- シンタックスハイライトのヒントをサポート

## バリデーションルール

バリデータは以下を確認します：
1. すべてのノードが必要なプロパティを持っている
2. ノードタイプが有効である
3. 内容がフォーマット要件を満たしている
4. 構造がネストルールに従っている 