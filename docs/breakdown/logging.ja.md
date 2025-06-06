# ロギング仕様

## 基本方針

https://jsr.io/@tettuan/breakdownlogger を使用します。README
https://github.com/tettuan/breakdownlogger を読み把握すること。

### DEBUG と LOG_LEVEL の使い分け

- `LOG_LEVEL`: BreakdownLoggerで使用する環境変数
  - テストコードでのみ使用
  - 恒久的なデバッグ出力として機能
  - テストの一部として扱われる
  - テストケースの実行状態や結果の追跡に使用

- `DEBUG`: 一時的なデバッグ出力用の環境変数
  - テスト以外のコードでも使用可能
  - 一時的なデバッグコードとして扱う
  - 開発時の問題調査用
  - 最終的には削除されるべきコード

### テストコードのみでの使用

- アプリケーションコードでは`BreakdownLogger`を使用しない
- テストコードでのみ`BreakdownLogger`を使用可能
- デバッグ情報の出力は開発時のみ

## ログレベル

### 環境変数による制御

```bash
LOG_LEVEL=<level> deno test ...
```

### レベル定義

1. `debug`: 詳細なデバッグ情報
   - 変数の値
   - 処理の開始/終了
   - 中間状態

2. `info`: 重要な情報
   - テストケースの開始
   - 重要な状態変化
   - 期待される結果

3. `warn`: 警告
   - 想定外の状態
   - 回復可能なエラー
   - パフォーマンス問題

4. `error`: エラー
   - 処理の中断
   - 重大な問題
   - 回復不能なエラー

## 出力フォーマット

### JSON形式

```json
{
  "timestamp": "2025-04-13T12:34:56.789Z",
  "level": "debug",
  "message": "テストメッセージ",
  "data": {
    "testName": "example",
    "status": "running"
  }
}
```

### フィールド定義

- `timestamp`: ISO 8601形式のタイムスタンプ
- `level`: ログレベル
- `message`: ログメッセージ
- `data`: 追加情報（オプション）

## デバッグ方法

### テストケース別のデバッグ

```typescript
// テストファイル内
const logger = new BreakdownLogger();

Deno.test("テストケース", () => {
  logger.debug("テスト開始", { case: "example" });
  // テスト処理
  logger.debug("テスト終了", { result: "success" });
});
```

### エラー調査

1. `LOG_LEVEL=debug`での実行
2. ログ出力の確認
3. エラー箇所の特定
4. 修正と再実行

## ログ出力の制御

### 出力先

- デフォルト: 標準エラー出力
- ファイル出力は非サポート

### フィルタリング

- レベルによるフィルタリング
- 特定のテストケースのみの出力
- データフィールドの制限
