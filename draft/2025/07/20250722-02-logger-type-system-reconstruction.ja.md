# プロジェクト超緊急対応: Logger統一とType定義根本修復作戦

## チーム立ち上げ

あなたは指揮官であり上司である。最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。

## 超緊急状況の分析

### 具体的エラー状況（16箇所の特定エラー）
```
TS2307 [ERROR]: Cannot find module '../types/breakdown_logger.ts'
at /Users/tettuan/github/breakdown/tests/0_core_domain/lib/domains/project_domain/entity/breakdown_project_entity_tests.ts:3:50

TS2554 [ERROR]: Expected 1-2 arguments, but got 3. (15箇所)
対象ファイル:
- tests/4_cross_domain/lib/test_helpers/breakdown_expect_with_project_test_helper_tests.ts
- lib/test_helpers/breakdown_project_assert.ts  
- lib/test_helpers/breakdown_test_common.ts
- lib/test_helpers/breakdown_test_expects.ts
- tests/0_core_domain/lib/domains/project_domain/entity/breakdown_project_entity_tests.ts
- tests/usecases/breakdown_usecase_tests.ts
- tests/integration/cli/breakdown_tests.ts
```

### Logger 3引数パターンの問題
- **現在のコード**: `logger.debug(message, tag, data)`
- **正しい形式**: `logger.debug(message, data)` または `logger.debug(message)`
- **JSR @tettuan/breakdownlogger v1.0.8**: 2引数までのAPIのみサポート
- **JSR最新版反映**: 指定された最新バージョンへの統一が必要

### 設計原則（必須参照）
- [domain_boundaries_flow.ja.md](../../../docs/breakdown/domain_core/domain_boundaries_flow.ja.md): ドメイン境界とデータフロー
- [two_params_types.ja.md](../../../docs/breakdown/domain_core/two_params_types.ja.md): DirectiveType/LayerType設計
- [totality.ja.md](../../../docs/breakdown/generic_domain/system/overview/totality.ja.md): 全域性原則

## 即時実行ロードマップ（残り16エラーの解決）

### フェーズ1: 破損import修正（即座実行・1分）
```bash
# 対象: tests/0_core_domain/lib/domains/project_domain/entity/breakdown_project_entity_tests.ts:3:50
# 削除済みファイルへの参照を削除
```

### フェーズ2: Logger 3引数呼び出し修正（10分）
**対象ファイル15箇所のパターン修正**:
```typescript
// 修正前（3引数）
logger.debug(message, tag, data);
logger.info(message, tag, data);
logger.warn(message, tag, data);

// 修正後（2引数）
logger.debug(message, data);
logger.info(message, data);
logger.warn(message, data);
```

**対象ファイルリスト**:
1. `lib/test_helpers/breakdown_project_assert.ts`
2. `lib/test_helpers/breakdown_test_common.ts`
3. `lib/test_helpers/breakdown_test_expects.ts`
4. `tests/4_cross_domain/lib/test_helpers/breakdown_expect_with_project_test_helper_tests.ts`
5. `tests/0_core_domain/lib/domains/project_domain/entity/breakdown_project_entity_tests.ts`
6. `tests/usecases/breakdown_usecase_tests.ts`
7. `tests/integration/cli/breakdown_tests.ts`

### フェーズ3: JSRパッケージ最新版統一（5分）

### 最重要エラー箇所とソリューション

### 優先度1: 破損import削除（即座実行）
```typescript
// NG: 問題コード (tests/0_core_domain/lib/domains/project_domain/entity/breakdown_project_entity_tests.ts:3:50)
import type { Logger } from '../types/breakdown_logger.ts';

// OK: 修正コード（削除またはJSR直接インポート）
import { Logger } from 'jsr:@tettuan/breakdownlogger@1.0.8';
```

```

### 特化作業スコープ（緊急完了まで20分）

#### スコープ1: エラー箇所直接修正（15分）
1. **破損import削除**: 1箇所の`breakdown_logger.ts`参照削除
2. **Logger 3引数修正**: 15箇所の`logger.debug(msg, tag, data)`→`logger.debug(msg, data)`変換
3. **JSR最新版統一**: deno.json内の4パッケージ最新バージョン適用

#### スコープ2: 検証とクリーンアップ（5分）  
4. **CI再実行**: `deno task ci:dirty`による成功確認
5. **不要ファイル削除**: 設計違反テストファイル・バックアップファイル除去
6. **古いコメント削除**: ハードコード関連コメント・例示の完全除去
```typescript
// NG: 問題パターン（15箇所）
logger.debug("Processing data", "TAG", { data: value });
logger.info("Success", "RESULT", result);

// OK: 修正パターン 
logger.debug("Processing data", { tag: "TAG", data: value });
logger.info("Success", { tag: "RESULT", ...result });
```

### 優先度3: JSR依存関係統一
```json
// NG: 現在の問題（deno.json内でバージョン不整合）
"@tettuan/breakdownlogger": "jsr:@tettuan/breakdownlogger@^1.0.5"
"@tettuan/breakdownparams": "jsr:@tettuan/breakdownparams@^1.1.0"
"@tettuan/breakdownconfig": "jsr:@tettuan/breakdownconfig@^1.1.4"

// OK: 修正後（最新版への統一）
"@tettuan/breakdownlogger": "jsr:@tettuan/breakdownlogger@^1.0.8"
"@tettuan/breakdownparams": "jsr:@tettuan/breakdownparams@^1.2.0"
"@tettuan/breakdownconfig": "jsr:@tettuan/breakdownconfig@^1.2.0"
```

### 優先度2: Logger直接インポート統一
```typescript
// NG: 削除済み（型拡張ファイル）
// lib/types/breakdown_logger.d.ts

// OK: 修正後（JSR直接インポート）
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// 正しいAPIシグネチャ使用
logger.debug("message", data);  // 2引数
logger.info("message", data);   // 2引数
```

## 削除対象の完全指定

### 削除対象1: 古いハードコード関連
```bash
# 完全削除対象
lib/types/defaults/1_behavior_default_type_pattern_provider_test.ts
lib/types/1_totality_directive_type_test.ts.backup
lib/test_helpers/breakdown_params_test_helper.ts（コメント行のみ）
lib/test_helpers/configuration_pattern_generator.ts（ハードコード例のコメント）
```

### 削除対象2: ConfigProfile依存古いコメント
```bash
# コメント削除対象
- "ConfigProfile.createDefault() 依存を完全に排除した純粋な実装。"
- "ConfigProfile.createDefault() 使用"
- "ハードコード配列 ["to", "summary"] 等"
- 正規表現パターンから値を抽出の例示コメント
```

## 作業分担指示

### ワーカープール1: JSR依存関係統一班
- **対象**: `deno.json`、`deno.lock`、JSRパッケージ依存関係
- **タスク**: JSRパッケージ最新版統一、依存関係一元化
- **成果物**: JSR統一システム、依存関係最新版統一

### ワーカープール2: 古いコード完全除去班
- **対象**: テストファイル、コメント、バックアップファイル
- **タスク**: 設計変更前の古いコード・コメント・テスト完全削除
- **成果物**: クリーンなコードベース、設計一貫性確保

## 実行手順

### フェーズ1: JSR依存関係統一（60分）
1. `deno.json`でJSRパッケージ最新版確認
2. 依存関係バージョン統一（@tettuan/breakdown*）
3. `deno cache --reload`で依存関係更新
4. 型チェック実行（`deno check lib/mod.ts`）

### フェーズ2: 古いコード削除（60分）
1. ハードコードされたテストファイル除去
   - `lib/types/defaults/1_behavior_default_type_pattern_provider_test.ts`
   - その他の古いテストファイル
2. 非推奨コメント・ファイル削除
3. 全体型チェック（`deno task ci:dirty`）

## 検証チェックリスト

### 必須完了条件
- [ ] `deno task ci:dirty` が完全成功（エラー0件）
- [ ] TypeScript Type Check完全成功（91エラー→0）
- [ ] JSRパッケージ最新版統一確認
- [ ] `grep -r "ConfigProfile.*createDefault" lib/` の結果が空（コメント含む）
- [ ] `grep -r "\[\"to\", \"summary\"" lib/` の結果が空（コメント含む）

### 設計品質確認
- [ ] JSR依存関係統一確立
- [ ] [totality.ja.md](../../../docs/breakdown/generic_domain/system/overview/totality.ja.md)の全域性原則適用
- [ ] 古い設計の痕跡完全除去

## 検証基準
- TypeScriptエラー0件
- JSRパッケージ最新版統一
- 非推奨ファイル完全除去
- CI通過確認

## 絶対禁止事項

### 設計違反（即座に差し戻し）
- **Logger インターフェース分裂**: 複数のLogger定義存在禁止
- **古いコメント残存**: 設計変更前のコメント・例示残存禁止
- **中途半端な修正**: 一部ファイルのみの修正禁止（全域修正必須）

### 削除基準（厳格適用）  
- **バックアップファイル**: `.backup`拡張子ファイル即座削除
- **古いテストコメント**: ハードコード・ConfigProfile言及コメント削除
- **例示コメント**: 古い設計の例示を含むコメント削除

## 成功指標

### 最終ゴール
```bash
# OK: 完全成功の証明コマンド
deno task ci:dirty  # エラー0件で完了
deno check lib/     # Type エラー0件
deno task test      # 全テスト成功
```

### 品質指標
- TypeScript エラー: 91→0（100%解決）
- Logger統一: 分裂→統一インターフェース確立
- コード品質: 古い設計痕跡完全除去
- 設計一貫性: [domain_boundaries_flow.ja.md](../../../docs/breakdown/domain_core/domain_boundaries_flow.ja.md)完全準拠

## 作業開始指令

**超緊急指令**: チームを Logger統一特別編成で立ち上げ、2つの特化スコープによる集中作業を開始せよ。Type システム根本修復と古いコード完全除去により、システム全体の復旧を達成せよ。

作業時間: 120分以内での完全修復を目標とし、Logger統一による TypeScript 型システムの完全復旧を実現せよ。
