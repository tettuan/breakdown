# プロジェクト: 包括的クリーンアップの完全達成 - ハードコード排除・ConfigProfile依存除去の最終確認と実行

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。

## 緊急事態の認識

### 進捗確認結果：重大な残存問題
2つの先行タスクの実行後、以下の**重大な残存問題**が確認された：

#### 1. ハードコード配列の大量残存（20箇所以上）
```typescript
// ❌ 残存中：lib/内に20箇所以上のハードコード配列
const validDirectiveTypes = ["to", "summary", "defect"];         // factory/0_architecture/
const validLayerTypes = ["project", "issue", "task"];           // factory/0_architecture/
const directiveTypes = ["to", "find", "summary", "defect"];     // domain/templates/
const directivePatterns = ["to", "summary", "defect"];          // cli/validators/
```

#### 2. ConfigProfile依存の部分残存
```typescript
// ❌ 残存中：lib/factory/input_file_path_resolver_totality.ts
readonly profile?: ConfigProfile;                            // 2箇所
```

#### 3. テストの設定ファイル化未完了
多数のテストファイルで設定ファイルベースへの移行が未完了

## タスクとゴール

```yml
- 緊急対応の背景: 先行作業では部分的成果にとどまり、20箇所以上のハードコード配列とConfigProfile依存が残存している状態
- 緊急対応タスク: |
  1. lib/内の全ハードコード配列（20箇所以上）の完全排除 |
  2. 残存するConfigProfile依存（input_file_path_resolver_totality.ts等）の完全除去 |
  3. 全テストファイルの設定ファイルベース実装への完全移行 |
  4. 条件分岐ハードコード（directive === "find"等）の完全排除 |
  5. BreakdownParams統合設計の完全実装確認 |
  6. 全テストの成功確認とCLI動作検証 |
- ゴール: lib/内からハードコード配列・ConfigProfile依存・条件分岐ハードコードが完全に除去され、BreakdownParams統合設計に完全準拠した状態を実現する
```

## 実装要件

### 1. 完全排除対象（絶対禁止・即座実行）

#### 残存ハードコード配列（20箇所以上）
```
lib/factory/0_architecture/prompt_variables_factory_architecture_test.ts
lib/domain/errors/config_error.ts
lib/domain/templates/template_resolver_service.ts
lib/domain/core/aggregates/two_params.test.ts
lib/supporting/initialization/init_service.ts
lib/templates/2_structure_prompts_test.ts
lib/cli/validators/two_params_validator_ddd.ts
lib/cli/initialization/workspace_initializer.ts
lib/templates/0_architecture_prompts_test.ts
lib/templates/1_behavior_prompts_test.ts
lib/types/1_behavior_type_factory_test.ts
```

#### 残存ConfigProfile依存
```
lib/factory/input_file_path_resolver_totality.ts    # profile?: ConfigProfile (2箇所)
lib/types/mod.ts                                     # コメント内のConfigProfile参照
```

### 2. 調査・実行方針

#### Phase 1: 残存問題の完全調査（即座実行）
1. **ハードコード配列の完全リスト作成**
   ```bash
   grep -r "\[\"to\".*\"summary\"\|\[\"project\".*\"issue\"" lib/ | wc -l
   grep -r "getDirectiveTypes\|getLayerTypes" lib/
   ```

2. **ConfigProfile依存の完全調査**
   ```bash
   grep -r "ConfigProfile" lib/ --exclude-dir=node_modules
   grep -r "profile\?\s*:\s*ConfigProfile" lib/
   ```

3. **条件分岐ハードコードの調査**
   ```bash
   grep -r "directive.*===.*\"find\"\|layer.*===.*\"bugs\"" lib/
   ```

#### Phase 2: 段階的完全排除（優先度順）
1. **最優先**: DirectiveType/LayerType value objectsの純粋化
2. **高優先**: テストファイルの設定ファイル化
3. **中優先**: サービス・ファクトリー層のハードコード除去
4. **低優先**: ドキュメント・エラーメッセージの更新

#### Phase 3: BreakdownParams統合実装
1. **fromTwoParamsResult()関数の実装**
2. **JSR検証済み値としてのDirectiveType/LayerType実装**
3. **設定ファイル→CustomConfig→BreakdownParamsフローの完全確認**

### 3. 成功確認基準

#### 必須確認項目
```bash
# ❌ これらの検索結果が空でなければ作業未完了
grep -r "\[\"to\".*\"summary\".*\"defect\"\]" lib/
grep -r "\[\"project\".*\"issue\".*\"task\"\]" lib/
grep -r "ConfigProfile" lib/ --exclude="*.md"
grep -r "getDirectiveTypes\|getLayerTypes" lib/
grep -r "directive.*===.*\"find\"" lib/
```

#### 動作確認項目
```bash
# ✅ これらが全て成功すること
deno task test                    # 全テスト成功
deno run mod.ts --help           # CLI動作確認
deno run mod.ts to project --config=custom  # 設定ファイル切り替え確認
```

### 4. 実装パターン（参考）

#### JSR検証済み値統合実装
```typescript
// ✅ 正しいパターン
class DirectiveType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  constructor(readonly value: string) { Object.freeze(this); }
  equals(other: DirectiveType): boolean { return this.value === other.value; }
}

function fromTwoParamsResult(result: TwoParamsResult): TwoParams {
  return {
    directive: new DirectiveType(result.directiveType),
    layer: new LayerType(result.layerType)
  };
}
```

#### 設定ファイルベーステスト
```typescript
// ✅ テストでの正しいパターン
const userConfig = await loadUserConfig(ConfigProfile.createDefault());
const customConfig = ParamsCustomConfig.create(userConfig);
const result = await breakdownParams(args, customConfig);
```

## 作業手順

### Step 1: 緊急調査（5分）
- ハードコード配列の完全箇所リスト作成
- ConfigProfile依存の残存箇所特定
- 条件分岐ハードコードの残存箇所特定

### Step 2: 優先度1実行（15分）
- DirectiveType/LayerType value objectsの純粋化
- ConfigProfile依存の完全除去
- fromTwoParamsResult()関数実装

### Step 3: 優先度2実行（20分）
- テストファイルの設定ファイル化
- サービス層のハードコード除去
- 条件分岐の設定ベース化

### Step 4: 完全性検証（10分）
- grep検索による残存確認
- テスト実行による動作確認
- CLI動作による統合確認

## 完了条件

### 必須条件（全て満たすこと）
- [ ] `grep -r "\[\"to\".*\"summary\"" lib/` の結果が空
- [ ] `grep -r "ConfigProfile" lib/ --exclude="*.md"` の結果が空
- [ ] `grep -r "getDirectiveTypes\|getLayerTypes" lib/` の結果が空
- [ ] `grep -r "directive.*===.*\"find\"" lib/` の結果が空
- [ ] `deno task test` が全てpass
- [ ] CLI動作が正常
- [ ] 設定ファイル切り替えが動作

### 禁止事項
- **部分的対応**: 一部だけの修正は禁止
- **回避策**: メソッド名変更等による回避禁止
- **テストでのハードコード**: テスト内でのハードコード配列も禁止

## 進捗管理

- 作業完了時: `tmp/feature-hardcode-elimination-emergency/comprehensive-cleanup-completed.md` 作成
- 問題発生時: `tmp/feature-hardcode-elimination-emergency/remaining-issues.md` 作成

## 重要提言

この作業は**設計原則への完全準拠**を実現するための最終段階である。先行作業では部分的成果にとどまったため、**完全性の確保**が絶対条件となる。

**20箇所以上のハードコード配列**と**ConfigProfile依存**の完全除去により、真のBreakdownParams統合設計を実現せよ。妥協は許されない。

**開始指示**: 直ちに残存問題の完全調査を実行し、段階的完全排除により設計原則違反を根絶せよ。
