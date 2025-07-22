# プロジェクト緊急対応: Lint完全解決とハードコード撲滅作戦

## チーム立ち上げ

あなたは指揮官であり上司である。最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。

## 緊急状況の分析

### CI失敗の根本原因
- **50個のlintエラー**: 型安全性違反（`any`型乱用、未使用変数、async/await不整合）
- **ハードコード残存**: 設定ファイル無視の直接配列定義が複数箇所に残存
- **BreakdownParams統合不完全**: JSR検証済み値の活用が不十分

### 設計原則（必須参照）
- [domain_boundaries_flow.ja.md](../../../docs/breakdown/domain_core/domain_boundaries_flow.ja.md): ドメイン境界とデータフロー
- [two_params_types.ja.md](../../../docs/breakdown/domain_core/two_params_types.ja.md): DirectiveType/LayerType設計
- [totality.ja.md](../../../docs/breakdown/generic_domain/system/overview/totality.ja.md): 全域性原則

## 作戦目標

### Phase 1: 型安全性完全修復（30分）
1. **`any`型完全除去**: 50箇所の`any`型をspecific型に変更
2. **未使用変数除去**: `_`プレフィックス適用または削除
3. **async/await修復**: 不要な`async`キーワード除去

### Phase 2: ハードコード完全撲滅（45分）
4. **設定ファイルベース統合**: [breakdown-params-integration-user.yml](../../../tests/fixtures/configs/breakdown-params-integration-user.yml)活用
5. **ConfigProfile依存除去**: BreakdownParams検証済み値への完全移行
6. **テストヘルパー修復**: [configuration-based-testing-guide.ja.md](./20250721-07-configuration-based-testing-guide.ja.md)パターン適用
7. **設計違反テスト削除**: ハードコード/ConfigProfile依存テストの完全除去

### Phase 3: 完全検証（15分）  
8. **`deno task ci:dirty`成功**: エラー0件達成
9. **動作確認**: 設定ファイル変更による動的パターン変更確認

## 重要エラー箇所とソリューション

### 優先度1: 型定義修復
```typescript
// ❌ 禁止パターン
private readonly config: any
static create(userConfig: any): ParamsCustomConfig
export async function loadUserConfig(profile: ConfigProfile): Promise<any>

// ✅ 修正パターン  
private readonly config: UserConfigData
static create(userConfig: UserConfigData): ParamsCustomConfig
export async function loadUserConfig(profile: ConfigProfile): Promise<UserConfigData>
```

### 優先度2: BreakdownParams完全統合
```typescript
// ❌ 現在のConfigProfile依存パターン（除去対象）
DirectiveType.create("to", ConfigProfile.createDefault())

// ✅ BreakdownParams統合パターン（目標）
const twoParamsResult = await executeBreakdownParams(["to", "issue"], "test");
const { directive, layer } = fromTwoParamsResult(twoParamsResult);
```

### 優先度3: async/await修復
```typescript
// ❌ 修正対象  
async get(profilePrefix?: string): Promise<MockConfigResult> {
  return { success: true, data: {} }; // awaitなし
}

// ✅ 修正後
get(profilePrefix?: string): MockConfigResult {
  return { success: true, data: {} };
}
```

## 作業分担指示

### ワーカープール1: 型安全性修復班
- **対象**: `lib/config/`, `lib/application/`, `lib/test_helpers/`
- **タスク**: `any`型→specific型変換、未使用変数除去
- **成果物**: 型安全なコードベース

### ワーカープール2: BreakdownParams統合班  
- **対象**: `DirectiveType`, `LayerType`, `TwoParams`関連
- **タスク**: ConfigProfile依存除去、JSR検証済み値活用
- **成果物**: 設定ファイルベース完全統合

### ワーカープール3: テスト修復班
- **対象**: `*_test.ts`, `test_helpers/`
- **タスク**: ハードコード配列除去、設定ファイルベーステスト実装、**設計違反テスト削除**
- **成果物**: [configuration-based-testing-guide.ja.md](./20250721-07-configuration-based-testing-guide.ja.md)準拠テスト

#### 設計違反テスト削除対象
```typescript
// ❌ 削除対象：ハードコードテスト
describe("DirectiveType hardcoded validation", () => {
  test("accepts hardcoded values", () => {
    const validTypes = ["to", "summary", "defect"]; // ハードコード配列
    assertEquals(DirectiveType.create("to").isValid(), true);
  });
});

// ❌ 削除対象：ConfigProfile依存テスト  
test("DirectiveType with ConfigProfile.createDefault()", () => {
  const directive = DirectiveType.create("to", ConfigProfile.createDefault());
});

// ✅ 保持対象：設定ファイルベーステスト
test("DirectiveType with configuration file", async () => {
  const config = await ConfigurationTestHelper.loadTestConfiguration("test-basic");
  const twoParamsResult = await executeBreakdownParams(["to", "issue"], "test-basic");
});
```

## 検証チェックリスト

### 必須完了条件
- [ ] `deno task ci:dirty` が完全成功（エラー0件）
- [ ] `grep -r "any" lib/` の大幅削減（型定義ファイル除く）
- [ ] `grep -r "\[\"to\", \"summary\"" lib/` の結果が空
- [ ] `grep -r "ConfigProfile.*createDefault" lib/` の結果が空

### 設計品質確認
- [ ] [domain_boundaries_flow.ja.md](../../../docs/breakdown/domain_core/domain_boundaries_flow.ja.md)準拠
- [ ] [totality.ja.md](../../../docs/breakdown/generic_domain/system/overview/totality.ja.md)の全域性原則適用
- [ ] BreakdownParams完全統合フロー動作確認

## 絶対禁止事項

### 設計違反（即座に差し戻し）
- **ハードコード配列復活**: `["to", "summary", "defect"]`等の直接定義禁止
- **`any`型安易使用**: 型不明時も`unknown`使用、適切な型定義要求
- **ConfigProfile依存復活**: テスト含む全箇所でBreakdownParams使用必須
- **設定ファイル回避**: 必ず[breakdown-params-integration-user.yml](../../../tests/fixtures/configs/breakdown-params-integration-user.yml)経由
- **設計違反テスト保持**: ハードコード/ConfigProfile依存テストは即座に削除

### テスト削除基準（厳格適用）
- **ハードコードテスト**: 配列やパターンを直接定義するテスト
- **ConfigProfile.createDefault()使用テスト**: 設定ファイル無視テスト  
- **モック過多テスト**: 実設定ファイルを使わないテスト
- **重複テスト**: 同一機能を複数方法でテストするもの

### コード品質（厳格適用）
- 未使用import残存禁止
- 非同期不整合禁止（async without await等）
- テスト内ハードコード禁止
- **設計違反テスト即座削除**: 修正不可能なテストは削除優先

## 成功指標

### 最終ゴール
```bash
# ✅ 完全成功の証明コマンド
deno task ci:dirty  # エラー0件で完了
deno task test      # 全テスト成功
deno fmt --check    # フォーマット違反0件
```

### 品質指標
- Lintエラー: 50→0（100%改善）  
- ハードコード箇所: 残存→0（完全撲滅）
- 型安全性: `any`型大幅削減
- 設計一貫性: BreakdownParams統合フロー確立
- **テスト品質**: 設計違反テスト完全除去、設定ファイルベーステスト100%

## 作業開始指令

**緊急指令**: チームを最大戦力で立ち上げ、3つのワーカープールによる並行作業を開始せよ。型安全性とハードコード撲滅の完全達成を目指し、CI成功まで全力投球せよ。Breakdown設計原則への完全準拠を実現せよ。

作業時間: 90分以内での完全修復を目標とする。各フェーズ完了時に進捗報告を行い、最終的にCI完全成功を達成せよ。
