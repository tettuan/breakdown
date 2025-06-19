# Example 14: Production Configuration with Find Bugs Feature

## 概要

`14_config_production_example.sh`は、Breakdown CLIのfind bugs機能を本番環境設定で使用する方法を示すサンプルです。このスクリプトは、コードベース内のバグインジケーター（TODO、FIXME、BUG、HACK等）を検出し、レポートを生成します。

## 主な特徴

### 1. バグインジケーターの検出

以下のパターンを検出します：
- **TODO**: 将来実装すべき機能や改善点
- **FIXME**: 修正が必要な既知の問題
- **BUG**: バグとして認識されている箇所
- **HACK**: 一時的な回避策
- **XXX**: 注意が必要な箇所
- **DEPRECATED**: 非推奨となった機能

### 2. 設定ファイルの構造

```yaml
customConfig:
  enabled: true
  find:
    twoParams:
      - "bugs"
  findBugs:
    enabled: true
    sensitivity: "medium"
    patterns:
      - "TODO"
      - "FIXME"
      - "HACK"
      - "BUG"
      - "XXX"
      - "DEPRECATED"
    includeExtensions:
      - ".ts"
      - ".js"
      - ".py"
      - ".go"
    excludeDirectories:
      - "node_modules"
      - ".git"
      - "dist"
      - "build"
    maxResults: 100
    detailedReports: true
```

### 3. 実行フロー

1. **作業ディレクトリの管理**: スクリプト実行後、元のディレクトリに自動的に戻ります
2. **設定ファイルの作成**: production-bugs-app.ymlを生成
3. **サンプルコードの生成**: バグインジケーターを含むTypeScriptとPythonのサンプルファイル
4. **バグ検出の実行**: `deno run -A jsr:@tettuan/breakdown find bugs`コマンドを実行
5. **レポート生成**: 検出されたバグの詳細レポートを出力
6. **クリーンアップ**: 一時ファイルの自動削除

### 4. サンプルコードの内容

#### TypeScript (payment_service.ts)
- 決済処理サービスの実装
- セキュリティ上の問題（ハードコードされたAPIキー）
- エラーハンドリングの不足
- 非推奨メソッドの存在

#### Python (user_auth.py)
- ユーザー認証モジュール
- セキュリティの脆弱性（SHA256の単純使用）
- データベース接続の未実装
- レート制限の欠如

### 5. 検出されるバグの例

- **セキュリティ関連**
  - ハードコードされた認証情報
  - 不適切なハッシュアルゴリズム
  - 入力検証の欠如

- **パフォーマンス関連**
  - メモリリークの可能性
  - キャッシュの有効期限未設定
  - レート制限の未実装

- **保守性関連**
  - 非推奨メソッドの使用
  - 一時的な回避策
  - 不完全なエラーハンドリング

## 使用方法

```bash
# スクリプトの実行
./examples/14_config_production_example.sh

# または、任意のディレクトリから実行
bash /path/to/examples/14_config_production_example.sh
```

## 出力例

```
=== Production Find Bugs Example ===
Created production configuration with find bugs: .agent/breakdown/config/production-bugs-app.yml
Created sample code with bug indicators

Running breakdown find bugs command...
Command: deno run -A jsr:@tettuan/breakdown find bugs --config=production-bugs < code_files.md

=== Bugs Report ===
# Bug Detection Report

## Summary
- Total files scanned: 2
- Total issues found: 16
- Critical: 3
- High: 7
- Medium: 6

## Details
[詳細なバグレポート]

=== Production Find Bugs Example Completed ===
```

## 注意事項

1. **作業ディレクトリ**: スクリプトは実行後、元のディレクトリに戻ります
2. **一時ファイル**: サンプルコードとレポートは実行後に自動削除されます
3. **設定の永続化**: production-bugs-app.ymlは`.agent/breakdown/config/`に保存されます
4. **カスタマイズ**: パターンや拡張子は設定ファイルで調整可能です

## 関連ファイル

- `examples/15_config_production_custom.sh`: より高度なエラーハンドリングを含む例
- `lib/breakdown/prompts/find/bugs/`: find bugs機能のプロンプトテンプレート
- `lib/breakdown/schema/find/bugs/`: バグ検出結果のスキーマ定義