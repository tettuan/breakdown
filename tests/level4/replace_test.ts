/**
 * プロンプト変数置換テスト [ID:REPLACE] - レベル4: 変数置換と出力処理
 * 
 * 目的:
 * - {input_markdown_file}の置換
 * - {input_markdown}の置換
 * - {destination_path}の置換
 * - {schema_file}の置換
 * 
 * テストデータ:
 * - 変数を含むプロンプトテンプレート
 * - 入力マークダウンファイル
 * - テスト用の出力パス
 * 
 * 境界線:
 * - プロンプト特定 → 変数置換
 *   プロンプトファイルが特定できないと、変数置換処理が実行できない
 * 
 * 依存関係:
 * - [PROMPT] プロンプトファイル特定テスト
 * - [PATH] ファイルパス自動補完テスト
 */ 