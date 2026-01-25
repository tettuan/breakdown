# プロジェクト: WorkspaceImpl初期化エラーハンドリングのCI失敗修正

## エラー分析

### 発生したエラー
```
1_behavior: Error handling follows Result pattern principles => ./lib/workspace/1_behavior_workspace_test.ts:209:6
error: AssertionError: A non-Error object was rejected.
        throw new AssertionError(`A non-Error object was rejected${msgSuffix}`);
              ^
    at assertRejects (https://jsr.io/@std/assert/0.224.0/assert_rejects.ts:93:15)
    at eventLoopTick (ext:core/01_core.js:178:7)
    at async file:///home/runner/work/breakdown/breakdown/lib/workspace/1_behavior_workspace_test.ts:222:3
```

## ローカル環境とCI環境での動作差異の原因

### 問題の根本原因

**ローカル環境（macOS）とCI環境（Linux）でOSレベルの権限エラーの種類が異なる**

#### ローカル環境（macOS）での動作:
```typescript
// /root/restricted-workspace への書き込み時
Error: Read-only file system (os error 30): mkdir '/root/restricted-workspace'
// error instanceof Deno.errors.PermissionDenied → false
// catch文で元のErrorがそのまま再スローされる
throw error; // Error インスタンス
```

#### CI環境（Linux）での動作:
```typescript
// /root/restricted-workspace への書き込み時  
Deno.errors.PermissionDenied が投げられる
// error instanceof Deno.errors.PermissionDenied → true
// createWorkspaceInitError() が呼ばれる
throw createWorkspaceInitError(...); // WorkspaceInitErrorInterface オブジェクト（非Error）
```

### 技術的詳細

1. **macOS**: `/root`は読み取り専用ファイルシステムエラー（EROFS）
2. **Linux**: `/root`は権限拒否エラー（PermissionDenied）  
3. **問題**: `createWorkspaceInitError()`がプレーンオブジェクトを返し、`Error`インスタンスではない
4. **結果**: CI環境でのみ`assertRejects()`が`A non-Error object was rejected`エラーを発生

### 確認済み事実
- ローカルテスト: [OK] 成功（`Error`インスタンスが投げられる）
- CI環境テスト: [NG] 失敗（`WorkspaceInitErrorInterface`オブジェクトが投げられる）

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## 実施内容

## タスクとゴール

```yml
- 信じて良い前提: Breakdown本体は基本的に正常だが、WorkspaceImplのエラーハンドリングにCI環境特有の問題がある
- タスク: |
  1. WorkspaceImpl.initialize()のエラーハンドリング実装を詳細調査する |
  2. createWorkspaceInitError()の戻り値型を確認し、必ずErrorインスタンスを返すよう修正する |
  3. CI環境での権限エラー時に適切なErrorオブジェクトが投げられるよう修正する |
  4. テストケースを実行して、assertRejects()が期待通りにErrorを捕捉することを確認する |
  5. lib/workspace/配下のみの修正で問題を解決する |
- ゴール: WorkspaceImplのエラーハンドリングがCI環境で適切にErrorインスタンスを投げ、テストが成功する
```

**注意書き**
- 修正対象は `lib/workspace/` 配下のファイルのみ
- テストファイル自体は変更せず、実装側を修正する
- CI環境での権限エラーを適切に`Error`インスタンスとして扱う
- `createWorkspaceInitError()`の戻り値型を`Error`に統一する

### 実行方針

#### 前提理解
1. `lib/workspace/workspace.ts`の`initialize()`メソッド（165-170行目周辺）を詳細調査
2. `lib/workspace/errors.ts`の`createWorkspaceInitError()`実装を確認
3. `lib/workspace/workspace_init_error.ts`のエラークラス定義を確認
4. 調査結果を `tmp/<branch_name>/workspace_error_analysis.md` に記録

#### 作業開始
5. **createWorkspaceInitError()修正**:
   - `lib/workspace/errors.ts`の`createWorkspaceInitError`関数を修正
   - プレーンオブジェクト返却から`WorkspaceInitError`クラスインスタンス返却に変更
   - 戻り値型を`WorkspaceInitError`（`Error`継承クラス）に統一

6. **型定義整合性確認**:
   - `createWorkspaceInitErrorInterface`の使用箇所を確認
   - 破壊的変更による影響範囲の特定と対応
   - インターフェースとクラスの併用による型安全性の確保

7. **WorkspaceImpl.initialize()動作確認**:
   - 現在の`createWorkspaceInitError()`呼び出しが適切に動作することを確認
   - 修正後も同じ呼び出し方法で`Error`インスタンスが生成されることを検証

8. **テスト実行と検証**:
   - `deno test lib/workspace/1_behavior_workspace_test.ts` でテスト実行
   - CI環境想定での`PermissionDenied`エラーパターンの動作確認
   - 他のworkspaceテストへの影響がないことを確認

### 修正アプローチ

#### A. createWorkspaceInitError()の型安全性強化
**現在の問題**: 
- `errors.ts`の`createWorkspaceInitError`が`WorkspaceInitErrorInterface`（プレーンオブジェクト）を返す
- `workspace_init_error.ts`に`WorkspaceInitError`クラス（`Error`継承）が既に存在

**修正方針**:
```typescript
// lib/workspace/errors.ts の修正
import { WorkspaceInitError } from "./workspace_init_error.ts";

// 現在: プレーンオブジェクトを返す
export const createWorkspaceInitError = createWorkspaceInitErrorInterface;

// 修正後: Error継承クラスのインスタンスを返す
export function createWorkspaceInitError(message: string): WorkspaceInitError {
  return new WorkspaceInitError(message, "WORKSPACE_INIT_ERROR");
}
```

#### B. WorkspaceImpl.initialize()のエラーハンドリング確認
**現在の実装**: 
```typescript
catch (error) {
  if (error instanceof Deno.errors.PermissionDenied) {
    throw createWorkspaceInitError(
      `Permission denied: Cannot create directory structure in ${
        join(this.config.workingDir, "breakdown")
      }`,
    );
  }
  throw error;
}
```

**修正後の期待動作**:
- `createWorkspaceInitError()`が`WorkspaceInitError`インスタンス（`Error`継承）を返す
- CI環境で`assertRejects()`が適切に`Error`を捕捉

#### C. テストケース期待動作の確認
```typescript
// テストが期待する動作: Errorインスタンスのthrow
await assertRejects(
  () => workspace.initialize(),
  Error, // この型チェックが成功するよう実装修正
);
```

### 検証方法
1. **単体テスト実行**: `deno test lib/workspace/1_behavior_workspace_test.ts --filter="Error handling follows Result pattern principles"`
2. **型チェック**: `deno check lib/workspace/errors.ts lib/workspace/workspace.ts`
3. **統合確認**: `deno test lib/workspace/` で全テスト実行
4. **破壊的変更影響確認**: `createWorkspaceInitError`の他の使用箇所への影響確認

### 成功条件
- `assertRejects()`が`Error`インスタンスを正常に捕捉してテスト成功
- `WorkspaceInitError`クラスが適切に`Error`を継承
- CI環境でのテスト実行が成功
- 他のworkspaceテストおよび`createWorkspaceInitError`使用箇所に影響を与えない

### 注意事項
- **最小変更原則**: `lib/workspace/errors.ts`の`createWorkspaceInitError`関数のみ修正
- **後方互換性**: 他の`createWorkspaceInitErrorInterface`関数は維持
- **型安全性**: 既存の呼び出し方法で適切に`Error`インスタンスが生成されることを確認

## タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 問題分析 → 調査 → 実装修正 → テスト → 検証 → 記録 → 問題分析へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。

## 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（問題分析、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、エラーハンドリングの理解を進め、修正実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（問題調査、影響範囲分析、実装修正、テスト実行、検証）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。
