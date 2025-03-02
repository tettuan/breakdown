# 開発者向けドキュメント

このセクションでは、Breakdownの開発に関する情報を提供します。

## 目次

- [ディレクトリ構造](directory-structure.md)
- [テスト戦略](test-strategy.md)
- [コントリビューションガイド](contribution-guide.md)

## 仕様書

詳細な仕様書は `docs/breakdown` ディレクトリに格納されています：

- [Breakdown概要](../breakdown/breakdown.ja.md) - Breakdownツールの基本概念と設計
- [アプリケーション設定](../breakdown/app_config.ja.md) - 設定ファイルの構造と使用方法
- [プロンプト管理](../breakdown/app_prompt.ja.md) - AIプロンプトの管理と使用方法
- [スキーマ定義](../breakdown/app_schema.ja.md) - データスキーマの定義と検証
- [コマンドオプション](../breakdown/options.ja.md) - 利用可能なコマンドラインオプション
- [テスト設定](../breakdown/test/config.md) - テスト環境の設定

## 開発環境のセットアップ

Breakdownの開発環境をセットアップするには、以下の手順に従ってください：

1. リポジトリをクローン
   ```bash
   git clone https://github.com/yourusername/breakdown.git
   cd breakdown
   ```

2. 依存関係をインストール
   ```bash
   deno cache deps.ts
   ```

3. テストを実行して環境が正しく設定されていることを確認
   ```bash
   deno test -A
   ```

## 開発ワークフロー

1. 新しい機能やバグ修正のためのブランチを作成
2. コードを変更
3. テストを追加または更新
4. `deno fmt` を実行してコードをフォーマット
5. `deno lint` を実行して潜在的な問題をチェック
6. すべてのテストが通ることを確認
7. プルリクエストを作成

## ビルドプロセス

リソースファイルをTypeScriptファイルに変換するには：

```bash
deno task build-resources
```

## 関連リソース

- [Deno公式ドキュメント](https://deno.land/manual)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/) 