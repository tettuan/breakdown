# Import書き換え手動作業ガイド

## 現状確認済み

### 修正完了ファイル ✅
- `lib/cli/commands.ts` - 正常に`../../cli/breakdown.ts`を参照
- `lib/cli/breakdown.ts` - 正常に`../../cli/breakdown.ts`を参照  
- 大部分のファイルで修正済み

### 修正が必要なファイル

#### 1. `lib/cli/prompts/loader.ts`
**現在**:
```typescript
import { CommandOptions } from "../breakdown.ts"
```
**修正後**:
```typescript
import { CommandOptions } from "../../../cli/breakdown.ts"
```

## 手動修正手順（最適化版）

### ステップ1: 一括検索・置換
```bash
# args.ts参照を検索
rg "args\.ts" --type ts

# import文を検索
rg 'from.*args\.ts' --type ts

# 具体的な修正対象を特定
rg 'from\s+["\'][^"\']*args\.ts["\']' --type ts
```

### ステップ2: エディタでの一括置換パターン
**VSCode/エディタでの正規表現置換**:

1. **パターン1**: `from\s+["']\.\.?/.*args\.ts["'];?`
   **置換**: `from "../../cli/breakdown.ts";`

2. **パターン2**: `import\s+\{([^}]+)\}\s+from\s+["'].*args\.ts["'];?`
   **置換**: `import { $1 } from "../../cli/breakdown.ts";`

3. **パターン3**: `import\s+type\s+\{([^}]+)\}\s+from\s+["'].*args\.ts["'];?`
   **置換**: `import type { $1 } from "../../cli/breakdown.ts";`

### ステップ3: 検証コマンド
```bash
# 残存確認
rg "args\.ts" --type ts

# TypeScript型チェック
deno check **/*.ts

# テスト実行で動作確認
deno test --allow-env --allow-write --allow-read
```

## 自動化スクリプト使用法

### 基本実行
```bash
# 実行権限付与
chmod +x scripts/fix_imports.ts

# スクリプト実行
deno run --allow-read --allow-write scripts/fix_imports.ts
```

### 安全な実行（ドライラン風）
```bash
# 修正対象ファイルを事前確認
rg 'from.*args\.ts' --type ts --files-with-matches

# バックアップ作成
git add . && git commit -m "修正前のバックアップ"

# スクリプト実行
deno run --allow-read --allow-write scripts/fix_imports.ts

# 結果確認
git diff

# 問題があれば元に戻す
git reset --hard HEAD~1
```

## トラブルシューティング

### 問題1: 相対パスの深さが合わない
**症状**: `../../../cli/breakdown.ts`が見つからない
**解決**: ファイルの実際の位置から正しい相対パスを計算

### 問題2: 循環依存エラー
**症状**: `Circular dependency detected`
**解決**: 依存関係を確認し、必要に応じて型のみインポート

### 問題3: 型エラー
**症状**: TypeScript型チェックエラー
**解決**: 
```bash
# 詳細な型エラー確認
deno check --all **/*.ts

# 問題箇所を特定して個別修正
```

## 品質保証チェックリスト

### 修正前チェック
- [ ] 現在のargs.ts依存ファイルをリスト化
- [ ] バックアップ作成（git commit）
- [ ] 既存テストが通ることを確認

### 修正後チェック
- [ ] `rg "args\.ts" --type ts`で残存なし
- [ ] `deno check **/*.ts`でTypeScript型エラーなし
- [ ] `deno test`で全テスト通過
- [ ] 基本機能の動作確認

### 最終確認
- [ ] インポート文の統一性確認
- [ ] 不要なファイルの削除確認
- [ ] ドキュメント更新（必要に応じて）

## エマージェンシー手順

### 修正が複雑すぎる場合
1. **段階的修正**: 1ファイルずつ修正してテスト
2. **一時的復元**: 問題あるファイルのみ`lib/cli/args.ts`を一時復活
3. **部分的移行**: 重要でないファイルは後回し

### 自動スクリプトが失敗した場合
1. **手動での個別修正**に切り替え
2. **VSCodeのFind & Replace**を活用
3. **git bisect**で問題箇所の特定

## 推定作業時間

- **自動スクリプト使用**: 2-3分（実行 + 検証）
- **手動修正**: 5-10分（検索 + 置換 + 検証）
- **トラブル対応**: 追加5-15分

## 成功指標

- ✅ `rg "args\.ts" --type ts`の結果が空
- ✅ `deno check **/*.ts`が成功
- ✅ `deno test`が全通過
- ✅ 基本的なCLIコマンドが正常動作