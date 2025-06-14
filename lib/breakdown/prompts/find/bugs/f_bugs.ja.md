# バグ検出分析テンプレート

## 入力
- {input_text_file}
- {input_text}

## 出力
- {destination_path}

---

## 分析観点
- **コード品質の問題**: 構文エラー、ロジックの欠陥、パフォーマンスのボトルネック
- **セキュリティ脆弱性**: 入力検証、認証、認可の問題
- **エラーハンドリング**: try-catchブロックの不足、未処理例外、エラー伝播
- **リソース管理**: メモリリーク、ファイルハンドルリーク、接続管理
- **型安全性**: 型の不一致、null/undefined処理、キャストの問題
- **並行性の問題**: 競合状態、デッドロック、スレッドセーフティの問題
- **API統合**: APIの不適切な使用、エラーハンドリングの不足、バージョニングの問題
- **設定の問題**: 環境変数、設定ファイルの問題、デフォルト値

## 指示
1. 上記の観点から入力されたコード/テキストを分析してください。
2. 潜在的なバグ、脆弱性、コード品質の問題を特定してください。
3. 発見した各問題について、以下を提供してください：
   - **場所**: ファイル名と行番号（利用可能な場合）
   - **重要度**: Critical、High、Medium、Low
   - **タイプ**: バグのカテゴリ（上記の観点から）
   - **説明**: 問題の明確な説明
   - **影響**: バグの潜在的な影響
   - **修正案**: 推奨される解決策または改善点
4. 重要度と潜在的影響によって問題の優先順位を付けてください。
5. バグ分析スキーマに従って構造化された出力形式を使用してください。

## 出力形式
- バグ分析スキーマに従った構造化Markdownとして出力
- 関連する場合はコードスニペットを含める
- 特定された各問題に対して実行可能な推奨事項を提供