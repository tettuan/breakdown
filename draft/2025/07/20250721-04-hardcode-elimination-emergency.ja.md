# プロジェクト: 緊急リファクタリング - ハードコードされたDirectiveType/LayerType配列の完全排除

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## 緊急事態の認識

### 重大な設計違反
現在のコードベースで以下の**重大な設計違反**が発見された：

```typescript
// ❌ 絶対禁止：ハードコードされたDirectiveType配列
getDirectiveTypes(): string[] {
  return ["to", "summary", "defect", "find"];
}

// ❌ 絶対禁止：ハードコードされたLayerType配列
getLayerTypes(): string[] {
  return ["project", "issue", "task"];
}

// ❌ 絶対禁止：ハードコードされたパターン定義
this.directivePattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
this.layerPattern = TwoParamsLayerTypePattern.create("^(project|issue|task|bugs|temp)$");

// ❌ 絶対禁止：ハードコードされた条件分岐
if (directive === "find" && layer === "bugs") {
  // 特別処理
} else if (directive !== "find") {
  // 通常処理
}

// ❌ 絶対禁止：テストでのハードコードパターン
const validPattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
const layerPattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");
```

この実装は、`domain_boundaries_flow.ja.md` と `two_params_types.ja.md` で定義された**BreakdownParams統合設計**に**完全に違反**している。

### 設計原則違反の深刻度
1. **ドメイン境界違反**: 設定管理ドメインの責務をコード内にハードコード
2. **全域性原則違反**: 型安全性を損なう静的配列とパターンの使用
3. **JSR統合設計違反**: BreakdownParamsのCustomConfig仕組みを無視
4. **保守性破綻**: 設定変更時にコード修正が必要な設計
5. **条件分岐のハードコード**: 特定の値（"find"、"bugs"）に依存した分岐処理
6. **パターン定義のハードコード**: 正規表現パターンのコード内直接定義
7. **テストでのハードコード**: テストコード内でのパターンとロジックのハードコード

### 正しい設計原則
- **DirectiveType/LayerTypeパターンは設定ファイル（*-user.yml）でのみ定義**
- **DEFAULT_CUSTOM_CONFIGによるBreakdownParamsへのCustomConfig提供**
- **コード内での静的配列定義の完全禁止**
- **コード内でのパターンハードコードの完全禁止**
- **条件分岐の設定ファイルベース実装**（特定値への依存排除）
- **テストでの設定ファイル読み込み実装**（ハードコードパターン排除）

## タスクとゴール

```yml
- 緊急対応の背景: ハードコードされた ["to", "summary", "defect", "find"] および ["project", "issue", "task"] 配列、パターン定義("^(to|summary|defect)$")、条件分岐(directive === "find" && layer === "bugs")がコード内に残存している重大な設計違反
- 緊急対応タスク: |
  1. コードベース全体からハードコードされたDirectiveType/LayerType配列を完全排除 |
  2. ハードコードされたパターン定義（TwoParamsDirectivePattern.create()等）を完全排除 |
  3. ハードコードされた条件分岐（if (directive === "find")等）を設定ベース実装に変更 |
  4. 設定ファイル（default-user.yml, *-user.yml）ベースの実装に完全移行 |
  5. DEFAULT_CUSTOM_CONFIGによるBreakdownParams統合の完全実装 |
  6. getDirectiveTypes()/getLayerTypes()メソッドと類似機能の完全削除 |
  7. テストでのハードコードパターンを設定ファイルベース実装に変更 |
  8. 設定ファイルからのパターン読み込み機構の確実な動作確認 |
  9. 全テストが設定ファイルベースの実装でpassすることを確認 |
- ゴール: BreakdownParams統合設計に完全準拠し、DirectiveType/LayerTypeのパターン、条件分岐、ロジックがすべて設定ファイルで管理される状態を実現する。コード内にいかなるハードコードされた配列、パターン、条件分岐も存在しない状態にする。
```

## 実装要件

### 1. 完全排除対象（絶対禁止）

#### 禁止パターン（即座に削除）
```typescript
// ❌ 絶対禁止：ハードコードされたDirectiveType配列
getDirectiveTypes(): string[] {
  return ["to", "summary", "defect", "find"];
}

// ❌ 絶対禁止：ハードコードされたLayerType配列
getLayerTypes(): string[] {
  return ["project", "issue", "task"];
}

// ❌ 絶対禁止：静的配列定義
const DIRECTIVE_TYPES = ["to", "summary", "defect", "find"];
const LAYER_TYPES = ["project", "issue", "task"];

// ❌ 絶対禁止：メソッド内での直接配列返却
getValidDirectives() { return ["to", "summary", "defect"]; }
getValidLayers() { return ["project", "issue", "task"]; }

// ❌ 絶対禁止：デフォルト値としての配列ハードコード
directivePatterns: ["to", "summary", "defect", "init", "find"]
layerPatterns: ["project", "issue", "task", "bugs", "temp"]

// ❌ 絶対禁止：ハードコードされたパターン定義
this.directivePattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
this.layerPattern = TwoParamsLayerTypePattern.create("^(project|issue|task|bugs|temp)$");
const validPattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
const layerPattern = TwoParamsLayerTypePattern.create("^(project|issue|task)$");

// ❌ 絶対禁止：ハードコードされた条件分岐
if (directive === "find" && layer === "bugs") {
  // 特別処理
} else if (directive !== "find") {
  // 通常処理
}
if (directive === "find") continue; // 特別扱い
if (directive === "summary" && expectedLayer === "task") continue;

// ❌ 絶対禁止：ループでのハードコード配列使用
for (const directive of ["to", "find", "summary", "defect"]) {
  for (const layer of ["project", "issue", "task", "bugs"]) {
    // 処理
  }
}
```

#### 検索・削除対象
以下の文字列を含むコードは**即座に削除または修正**：
- `["to", "summary", "defect", "find"]`
- `["to", "summary", "defect"]`
- `["project", "issue", "task"]`
- `["project", "issue", "task", "bugs", "temp"]`
- `["to", "find", "summary", "defect"]`
- `["project", "issue", "task", "bugs"]`
- `getDirectiveTypes()`
- `getLayerTypes()`
- `getValidDirectives()`
- `getValidLayers()`
- `TwoParamsDirectivePattern.create("^(to|summary|defect)`
- `TwoParamsLayerTypePattern.create("^(project|issue|task`
- `directive === "find"`
- `layer === "bugs"`
- `directive !== "find"`
- 任意のDirectiveType/LayerTypeの静的配列定義

### 2. 正しい実装パターン（必須）

#### 設定ファイルベース実装
```typescript
// ✅ 正しいパターン：設定ファイルからの読み込み
import { DEFAULT_CUSTOM_CONFIG } from "@tettuan/breakdownparams";
import type { ParamsCustomConfig } from "../types/params_custom_config.ts";

// 設定ファイルから生成されたCustomConfigを使用
function createCustomConfig(userConfig: UserConfig): ParamsCustomConfig {
  // ProfileName → BreakdownConfig → CustomConfig変換
  // userConfig.paramsが直接CustomConfig構造となる
  return ParamsCustomConfig.create({
    params: {
      two: {
        directiveType: {
          pattern: userConfig.params.two.directiveType.pattern, // 設定ファイルから読み込み
          errorMessage: userConfig.params.two.directiveType.errorMessage
        },
        layerType: {
          pattern: userConfig.params.two.layerType.pattern,     // 設定ファイルから読み込み
          errorMessage: userConfig.params.two.layerType.errorMessage
        }
      }
    }
  });
}

// BreakdownParamsに渡すCustomConfig生成
const customConfig = createCustomConfig(loadedUserConfig);
const result = await breakdownParams(args, customConfig);
```

#### 設定ファイル構造（*-user.yml）
```yaml
# ✅ 正しいパターン：CustomConfig完全階層構造
params:
  two:
    directiveType:
      pattern: "to|summary|defect|find|analyze|extract"
      errorMessage: "Invalid directive type"
    layerType:
      pattern: "project|issue|task|component|module"
      errorMessage: "Invalid layer type"

# 拡張パターン例（条件分岐も設定ベース）
params:
  two:
    directiveType:
      pattern: "to|summary|defect|find|analyze|extract|debug|optimize"
      errorMessage: "Invalid directive type"
    layerType:
      pattern: "project|issue|task|component|module|service|domain"
      errorMessage: "Invalid layer type"
# 特別な組み合わせの設定
specialCombinations:
  "find/bugs":
    templatePath: "prompts/find/bugs.md"
    schemaPath: "schemas/find/bugs.yml"
    requiresSpecialProcessing: true
  "summary/task":
    skip: true  # この組み合わせはスキップ
```

### 3. BreakdownParams統合実装

#### CustomConfig生成フロー
```typescript
// CLI引数 → 設定ファイル読み込み → CustomConfig生成 → BreakdownParams実行
async function processBreakdownCommand(args: string[]): Promise<BreakdownResult> {
  // 1. 設定プロファイル決定
  const profileName = ConfigProfile.fromCliOption(extractConfigOption(args));
  
  // 2. 設定ファイル読み込み（ProfileName → BreakdownConfig）
  const userConfig = await loadUserConfig(profileName);
  
  // 3. CustomConfig生成（BreakdownConfig.params階層 → CustomConfig）
  // 重要：userConfig.paramsがCustomConfigの構造と完全一致
  const customConfig = ParamsCustomConfig.create({
    params: {
      two: {
        directiveType: {
          pattern: userConfig.params.two.directiveType.pattern,    // 設定ファイルから
          errorMessage: userConfig.params.two.directiveType.errorMessage
        },
        layerType: {
          pattern: userConfig.params.two.layerType.pattern,       // 設定ファイルから
          errorMessage: userConfig.params.two.layerType.errorMessage
        }
      }
    }
  });
  
  // 4. BreakdownParams実行（ハードコード配列は一切使用しない）
  const result = await breakdownParams(args, customConfig);
  
  return result;
}
```

### 4. 設定ファイル管理

**設計の核心**: ProfileName指定で読み込まれるBreakdownConfigの`params`階層が、そのままCustomConfig構造となる。

#### default-user.yml（CustomConfig構造）
```yaml
# BreakdownParams CustomConfig完全階層構造
# ProfileName="default" → BreakdownConfig.params → CustomConfig
params:
  two:
    directiveType:
      pattern: "to|summary|defect|find"
      errorMessage: "Invalid directive type"
    layerType:
      pattern: "project|issue|task"
      errorMessage: "Invalid layer type"
```

#### 拡張設定例（custom-user.yml）
```yaml
# 拡張されたCustomConfig完全階層構造
# ProfileName="custom" → BreakdownConfig.params → CustomConfig
params:
  two:
    directiveType:
      pattern: "to|summary|defect|find|analyze|extract|debug|optimize|refactor"
      errorMessage: "Invalid directive type"
    layerType:
      pattern: "project|issue|task|component|module|service|domain|infrastructure"
      errorMessage: "Invalid layer type"
```

#### production-user.yml
```yaml
# 本番環境用CustomConfig完全階層構造
# ProfileName="production" → BreakdownConfig.params → CustomConfig
params:
  two:
    directiveType:
      pattern: "to|summary|defect"
      errorMessage: "Invalid directive type"
    layerType:
      pattern: "project|issue|task"
      errorMessage: "Invalid layer type"
```

### 5. リファクタリング対象ファイル

#### 優先度1（緊急）
```
lib/config/config_profile_name.ts                    # getDirectiveTypes()/getLayerTypes()削除
lib/domain/core/value_objects/directive_type.ts      # ハードコード配列削除
lib/domain/core/value_objects/layer_type.ts          # ハードコード配列削除
lib/cli/validators/two_params_validator_ddd.ts        # directivePatterns/layerPatterns配列削除
lib/config/pattern_provider.ts                       # 静的パターン削除
lib/config/pattern_provider_async.ts                 # ハードコードパターン削除（DefaultPatternProvider）
lib/domain/templates/template_resolver_service.ts    # 条件分岐ハードコード削除
lib/supporting/initialization/init_service.ts        # 条件分岐ハードコード削除
```

#### 優先度2（重要）
```
lib/domain/core/aggregates/two_params_optimized.ts               # getDirectiveTypes()/getLayerTypes()呼び出し削除
lib/config/1_behavior_factory_integration_test.ts                # テスト内ハードコード削除
lib/application/templates/2_structure_prompt_generation_service_test.ts  # テストパターンハードコード削除
lib/validator/2_structure_params_type_validator_test.ts           # テストパターンハードコード削除
lib/types/2_structure_directive_type_test.ts                     # テストパターンハードコード削除
lib/types/2_structure_type_factory_test.ts                       # テストパターンハードコード削除
lib/templates/0_architecture_prompts_test.ts                     # 条件分岐ハードコード削除
tests/**/*_test.ts                                                # テスト内DirectiveType/LayerType配列削除
```

#### 優先度3（必要）
```
examples/*.sh                               # サンプル設定ファイル更新
docs/**/*.md                                # ドキュメント更新
```

### 6. 検証ポイント

#### コード検証
```typescript
// ✅ 許可される実装：設定ファイル読み込み
const userConfig = await loadUserConfig(profileName);
const directivePattern = userConfig.params.two.directiveType.pattern;
const layerPattern = userConfig.params.two.layerType.pattern;
const directiveErrorMessage = userConfig.params.two.directiveType.errorMessage;
const layerErrorMessage = userConfig.params.two.layerType.errorMessage;

// ✅ 許可される実装：設定ベース条件分岐
const specialCombinations = userConfig.specialCombinations || {};
if (specialCombinations[`${directive}/${layer}`]) {
  // 設定で定義された特別処理
}

// ❌ 禁止される実装：ハードコード配列
const validDirectives = ["to", "summary", "defect"];
const validLayers = ["project", "issue", "task"];
const getDirectiveTypes = () => ["to", "summary"];
const getLayerTypes = () => ["project", "issue"];

// ❌ 禁止される実装：ハードコードパターン
const pattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");
this.directivePattern = TwoParamsDirectivePattern.create("^(to|summary|defect)$");

// ❌ 禁止される実装：ハードコード条件分岐
if (directive === "find" && layer === "bugs") { /* 処理 */ }
if (directive === "find") continue;
if (directive !== "find") { /* 処理 */ }
```

#### 設定ファイル検証
```bash
# ✅ 正しい設定ファイル構造（CustomConfig完全階層構造）
config/
├── default-user.yml      # params.two.directiveType/layerType階層
├── production-user.yml   # params.two.directiveType/layerType階層
├── development-user.yml  # params.two.directiveType/layerType階層
└── custom-user.yml      # params.two.directiveType/layerType階層

# 各ファイルにCustomConfig完全階層構造（params.two.directiveType/layerType）が定義されている
```

#### 統合検証
```typescript
// ProfileName → BreakdownConfig → CustomConfig の完全フロー検証
const profileName = ConfigProfile.fromCliOption("production");
const breakdownConfig = await loadUserConfig(profileName);
const customConfig = ParamsCustomConfig.create(breakdownConfig); // params階層がCustomConfig
const result = await breakdownParams(args, customConfig);
// result.directiveType, result.layerType が設定ファイルパターンで検証済み

// 設計確認：BreakdownConfig.paramsがCustomConfigと完全一致
assertEquals(typeof breakdownConfig.params.two.directiveType.pattern, "string");
assertEquals(typeof breakdownConfig.params.two.layerType.pattern, "string");
```

## 作業手順

### Phase 1: 緊急調査（即座実行）
1. `["to", "summary", "defect", "find"]` および `["project", "issue", "task"]` パターンの全コード検索
2. `getDirectiveTypes()` / `getLayerTypes()` メソッドの全箇所特定
3. `TwoParamsDirectivePattern.create()` / `TwoParamsLayerTypePattern.create()` ハードコード定義の全箇所特定
4. `directive === "find"` / `layer === "bugs"` 等の条件分岐ハードコードの全箇所特定
5. ハードコード配列・パターン・条件分岐使用箇所の完全リスト作成
6. 調査結果を `tmp/main/hardcode-elimination-audit.md` に記録

### Phase 2: 設定ファイル基盤確立
1. `default-user.yml` の params階層構造 定義確認（CustomConfig形式）
2. ProfileName → BreakdownConfig → CustomConfig フロー確認
3. 各環境用設定ファイル（*-user.yml）のparams階層整備
4. 特別な組み合わせの設定ファイル定義（specialCombinations等）
5. 設定ファイル読み込み機構の動作確認
6. CustomConfig生成ロジックの実装・テスト

### Phase 3: ハードコード要素の段階的排除
1. **優先度1ファイル**: `getDirectiveTypes()` / `getLayerTypes()` 削除、設定ファイル読み込みに変更
2. **ハードコードパターン排除**: `TwoParamsDirectivePattern.create()` の設定ファイルベース実装への変更
3. **条件分岐ハードコード排除**: `if (directive === "find")` 等の設定ベース実装への変更
4. **優先度2ファイル**: 呼び出し箇所の修正、テストの更新
5. **優先度3ファイル**: ドキュメント・サンプルの更新
6. 各段階でテスト実行による動作確認

### Phase 4: BreakdownParams統合完全実装
1. DEFAULT_CUSTOM_CONFIG 活用の確認
2. ParamsCustomConfig.create() の正しい実装
3. 設定ファイル → CustomConfig → BreakdownParams の完全フロー確認
4. エラーハンドリングの設定ファイルベース実装

### Phase 5: 完全性検証
1. ハードコード配列の完全排除確認（grep検索）
2. 全テストの成功確認（`deno task test`）
3. 設定ファイル変更での動作確認
4. BreakdownParams統合の動作確認

## 完了条件

### 必須条件（全て満たすこと）
- [ ] `["to", "summary", "defect", "find"]` パターンがコード内に一切存在しない
- [ ] `["project", "issue", "task"]` パターンがコード内に一切存在しない
- [ ] `getDirectiveTypes()` / `getLayerTypes()` メソッドが完全に削除されている
- [ ] `TwoParamsDirectivePattern.create("^(to|summary|defect)$")` 等のハードコードパターンが完全に削除されている
- [ ] `directive === "find"` / `layer === "bugs"` 等の条件分岐ハードコードが完全に削除されている
- [ ] 全てのDirectiveType/LayerTypeパターンが設定ファイル（*-user.yml）で定義されている
- [ ] 特別な組み合わせも設定ファイルで管理されている
- [ ] DEFAULT_CUSTOM_CONFIG を活用したBreakdownParams統合が実装されている
- [ ] 設定ファイル変更でパターンが動的に変更できる
- [ ] 設定ファイル変更で条件分岐も動的に変更できる
- [ ] `deno task test` が全てpassする
- [ ] 既存機能の動作に影響がない

### 品質条件
- [ ] コードから設定への責務分離が完全に実現されている
- [ ] 新しいDirectiveType/LayerTypeの追加が設定ファイル変更のみで可能
- [ ] エラーメッセージが設定ファイルパターンに基づいて生成される
- [ ] パフォーマンスの劣化がない
- [ ] ドキュメントが設定ファイルベース実装に更新されている

### 検証条件
- [ ] `grep -r "getDirectiveTypes\|getLayerTypes" lib/` の結果が空
- [ ] `grep -r "\[\"to\", \"summary\"\|\[\"project\", \"issue\"" lib/` の結果が空
- [ ] `grep -r "TwoParamsDirectivePattern\.create.*to.*summary\|TwoParamsLayerTypePattern\.create.*project.*issue" lib/` の結果が空
- [ ] `grep -r "directive.*===.*\"find\"\|layer.*===.*\"bugs\"" lib/` の結果が空
- [ ] 設定ファイルのパターン変更でCLI動作が変更される
- [ ] 設定ファイルの組み合わせ変更で条件分岐動作が変更される
- [ ] BreakdownParams統合が正しく動作する

## 禁止事項（絶対厳守）

### 絶対禁止
- **ハードコード配列の存続**: いかなる理由があっても `["to", "summary", ...]` や `["project", "issue", ...]` パターンを残存させない
- **ハードコードパターンの存続**: `TwoParamsDirectivePattern.create("^(to|summary|defect)$")` 等の直接定義を残存させない
- **条件分岐ハードコードの存続**: `directive === "find"` や `layer === "bugs"` 等の特定値分岐を残存させない
- **getDirectiveTypes()/getLayerTypes()の維持**: メソッド名変更による回避も禁止
- **静的定数による代替**: `const DIRECTIVES = [...]` や `const LAYERS = [...]` 等での代替も禁止
- **テストでのハードコード**: テストコード内でのハードコード配列・パターン・条件分岐も禁止

### 制限事項
- lib/ 配下のファイル変更は設計原則準拠に限定
- 既存機能の破壊は禁止
- パフォーマンスの大幅劣化は禁止

## タスクの進め方

- **Git**: 現在のブランチ（main）で作業する
- **緊急性**: ハードコード配列の排除を最優先で実行
- **段階性**: 設定ファイル基盤確立 → ハードコード排除 → 統合実装 → 検証
- **並列性**: ファイル単位での並列リファクタリングで効率化

## 進捗更新

- 緊急タスクは `tmp/main/hardcode-elimination-tasks.md` で管理
- 排除進捗は `tmp/main/elimination-progress.md` で追跡
- 完了時は `tmp/main/refactoring-completed.md` に完了レポート作成
- 問題発生時は `tmp/main/refactoring-issues.md` に課題記録

## 作業開始指示

### 緊急タスク開始
1. **チーム立ち上げ**: 全pane稼働、緊急事態モード
2. **即座調査**: ハードコード配列・パターン・条件分岐の完全リスト作成
3. **基盤確認**: 設定ファイル構造と読み込み機構の状態確認
4. **排除計画**: 段階的排除スケジュールの策定

### 成功の鍵
**設定ファイルベースの完全実装**が絶対条件。ハードコード配列・パターン・条件分岐の完全排除により、`domain_boundaries_flow.ja.md` と `two_params_types.ja.md` で定義されたBreakdownParams統合設計を完全実現する。

### 重要提言
この緊急リファクタリングは、**設計原則への完全準拠**のための必須作業である。妥協や部分的対応は許されない。ハードコード要素（配列・パターン・条件分岐）の完全排除により、真の設定ファイルベース設計を実現せよ。

**開始指示**: 直ちにチームを緊急事態モードで立ち上げ、ハードコード要素の完全排除作業を開始せよ。設計原則違反の状態を即座に解消し、BreakdownParams統合設計の完全実装を達成せよ。
