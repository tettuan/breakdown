# プロンプトテンプレート変数機能の修正

## 問題点
1. テストケースの期待値が新しいプロンプト形式と一致していない
2. CLIテストの環境設定が不十分
3. 型エラーの修正が必要

## エラー発生源の調査
1. `tests/cli_test.ts`のインポートエラー
```typescript
import { join, ensureDir } from "https://deno.land/std@0.208.0/path/mod.ts";
```
- エラー内容：`ensureDir`がpath/mod.tsにない
- 原因追跡：
  1. `ensureDir`は`fs/mod.ts`のメソッド
  2. 他のファイルでは正しくfs/mod.tsからインポート
  3. CLIテストで誤ってpath/mod.tsからインポート

2. インポートの修正が必要なファイル：
- `tests/cli_test.ts`
  - 誤：path/mod.tsからensureDirをインポート
  - 正：fs/mod.tsからensureDirをインポート

3. 影響範囲：
- `setupTestFiles`関数
  - ensureDirを使用してテストディレクトリを作成
- テストケース「CLI outputs prompt content with destination」
  - setupTestFilesを呼び出し

## 修正対象
1. `tests/prompts/loader_test.ts`
- [ ] `loads from-type specific prompt`テストの期待値を更新
  - 新しいプロンプト形式（テンプレート変数を含む）に合わせる
- [ ] テスト用プロンプトファイルの内容を変数対応に更新

2. `tests/cli_test.ts`
- [x] インポート文の修正
  ```typescript
  import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
  import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
  ```

3. `cli/breakdown.ts`
- [ ] `fromFile`の型エラー修正（null許容の修正）
- [ ] `Deno`型の解決

## 優先順位
1. [x] インポート文の修正
2. [ ] `tests/prompts/loader_test.ts`の修正
3. [ ] `cli/breakdown.ts`の型エラー修正
4. [ ] `tests/cli_test.ts`の環境設定修正

## 注意点
- テストファイルの準備は`setupTestEnv`関数で行う
- 型エラーはDenoの型定義を適切にインポートして解決
- テストの期待値は実際の出力形式に合わせる
- インポートは適切なモジュールから行う
- 型定義は正しいモジュールから取得する 