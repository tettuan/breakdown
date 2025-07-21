# プロジェクト: DirectiveType/LayerType型からConfigProfileName依存の完全除去 - JSR検証済み値統合設計の実現

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## 緊急事態の認識

### 重大な設計違反
現在のDirectiveType/LayerType実装で以下の**重大な設計違反**が発見された：

```typescript
// ❌ 絶対禁止：DirectiveTypeへのConfigProfileName注入
class DirectiveType {
  private constructor(
    private readonly _value: string,
    private readonly _profile: ConfigProfileName,  // ← 設計違反
    private readonly _validatedByPattern: boolean,
  ) {}
  
  get profile(): ConfigProfileName {  // ← 設計違反
    return this._profile;
  }
  
  static create(
    value: string | null | undefined,
    profile?: ConfigProfileName,  // ← 設計違反
  ): Result<DirectiveType, DirectiveTypeError> {}
}

// ❌ 絶対禁止：LayerTypeへのConfigProfileName注入
class LayerType {
  static getCommonLayerTypes(profile?: ConfigProfileName): readonly string[] {}  // ← 設計違反
  static getKnownLayerTypes(profile?: ConfigProfileName): readonly string[] {}   // ← 設計違反
}

// ❌ 絶対禁止：テストでのConfigProfileName使用
DirectiveType.create(directive, ConfigProfileName.createDefault());  // ← 設計違反
LayerType.create(mockTwoParamsResult.layerType, ConfigProfileName.createDefault());  // ← 設計違反
```

この実装は、`domain_boundaries_flow.ja.md` と `two_params_types.ja.md` で定義された**BreakdownParams検証済み値統合設計**に**完全に違反**している。

### 設計原則違反の深刻度
1. **ドメイン境界違反**: DirectiveType/LayerTypeは設定ドメインに依存してはならない
2. **BreakdownParams統合設計違反**: BreakdownParams検証済み値が設定参照する必要はない
3. **責務分離違反**: ConfigProfileNameは設定読み込み専用、型定義に不要
4. **全域性原則違反**: 検証済み値に追加検証インフラの混入
5. **テスト設計違反**: 検証済み値の生成にConfigProfileNameは不要

### 正しい設計原則
- **DirectiveType/LayerTypeはBreakdownParams検証済みの純粋値オブジェクト**
- **ConfigProfileNameは設定読み込み専用（短寿命）、型定義に関与しない**
- **- **JSR TwoParamsResultから直接生成、追加検証不要****
- **ドメイン型の設定ドメインからの完全分離**

## タスクとゴール

```yml
- 緊急対応の背景: DirectiveType/LayerType型にConfigProfileNameが不要に注入され、BreakdownParams検証済み値統合設計に重大に違反している状態
- 緊急対応タスク: |
  1. DirectiveType/LayerType型からConfigProfileNameパラメータを完全除去 |
  2. ConfigProfileNameに依存するメソッド（profile accessor、getCommonLayerTypes等）を完全削除 |
  3. JSR TwoParamsResultから直接生成するコンストラクタの実装 |
  4. 設定ベースの検証をBreakdownParams統合に移行（型定義から除去） |
  5. テストでのConfigProfileName使用の完全削除 |
  6. BreakdownParams検証済み値として純粋な値オブジェクト実装 |
  7. ドメイン型と設定ドメインの完全分離実現 |
  8. 全テストが新しい実装でpassすることを確認 |
- ゴール: DirectiveType/LayerType型がBreakdownParams検証済み値として純粋に機能し、ConfigProfileNameへの依存が完全に除去された状態を実現する。ドメイン境界が明確に分離され、BreakdownParams統合設計に完全準拠した実装にする。
```

## 実装要件

### 1. 完全除去対象（絶対禁止）

#### 禁止パターン（即座に削除）
```typescript
// ❌ 絶対禁止：DirectiveTypeのConfigProfileName依存
class DirectiveType {
  private readonly _profile: ConfigProfileName;
  get profile(): ConfigProfileName;
  static create(value: string, profile?: ConfigProfileName);
  isValidForProfile(profile: ConfigProfileName): boolean;
}

// ❌ 絶対禁止：LayerTypeのConfigProfileName依存
class LayerType {
  static getCommonLayerTypes(profile?: ConfigProfileName): readonly string[];
  static getKnownLayerTypes(profile?: ConfigProfileName): readonly string[];
  static create(value: string, profile?: ConfigProfileName);
}

// ❌ 絶対禁止：テストでのConfigProfileName注入
DirectiveType.create("to", ConfigProfileName.createDefault());
LayerType.create("project", ConfigProfileName.createDefault());
const profile = ConfigProfileName.createDefault();
```

#### 検索・削除対象
以下のパターンを含むコードは**即座に削除または修正**：
- `ConfigProfileName.*DirectiveType`
- `DirectiveType.*ConfigProfileName`
- `ConfigProfileName.*LayerType`
- `LayerType.*ConfigProfileName`
- `profile?: ConfigProfileName`
- `getCommonLayerTypes(profile`
- `getKnownLayerTypes(profile`
- `isValidForProfile(profile`
- `_profile: ConfigProfileName`
- `get profile(): ConfigProfileName`

### 2. 正しい実装パターン（必須）

#### JSR検証済み値統合実装
```typescript
// ✅ 正しいパターン：BreakdownParams検証済み値からの直接生成
class DirectiveType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  
  constructor(readonly value: string) {
    Object.freeze(this);
  }
  
  // 型安全な比較
  equals(other: DirectiveType): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}

class LayerType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  
  constructor(readonly value: string) {
    Object.freeze(this);
  }
  
  // 型安全な比較
  equals(other: LayerType): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}
```

#### BreakdownParams統合ヘルパー関数
```typescript
// ✅ 正しいパターン：BreakdownParams TwoParamsResultから変換するヘルパー関数
import type { TwoParamsResult } from "@tettuan/breakdownparams";

function fromTwoParamsResult(twoParamsResult: TwoParamsResult): TwoParams {
  return {
    directive: new DirectiveType(twoParamsResult.directiveType),
    layer: new LayerType(twoParamsResult.layerType)
  };
}

// 使用例
const result = await breakdownParams(args, customConfig);
if (result.type === "two") {
  const twoParams = fromTwoParamsResult(result.data);
  // twoParams.directive, twoParams.layerは検証済み値
}
```

### 3. 設定分離の実現

#### 設定検証の責務分離
```typescript
// ✅ 正しいパターン：設定ベース検証はBreakdownParams統合で実行
// DirectiveType/LayerType型には検証ロジック不要

// ProfileName → BreakdownConfig → CustomConfig → BreakdownParams
const profileName = ConfigProfileName.fromCliOption(extractConfigOption(args));
const userConfig = await loadUserConfig(profileName);
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

// BreakdownParams統合（設定ベース検証）
const result = await breakdownParams(args, customConfig);
// result.directiveType, result.layerType が検証済み

// ConfigProfileNameの寿命終了（設定読み込み後）
// BreakdownConfigの分離後寿命終了（CustomConfig生成後）
// DirectiveType/LayerTypeはJSR検証済み値として長寿命
```

### 4. テスト実装の修正

#### 正しいテストパターン
```typescript
// ✅ 正しいパターン：BreakdownParams検証済み値として直接生成
describe("DirectiveType", () => {
  test("creates from BreakdownParams validated value", () => {
    const directive = new DirectiveType("to");
    assertEquals(directive.value, "to");
    assertEquals(directive.source, "BREAKDOWN_PARAMS_VALIDATED");
  });
  
  test("type-safe comparison", () => {
    const directive1 = new DirectiveType("to");
    const directive2 = new DirectiveType("to");
    assertTrue(directive1.equals(directive2));
  });
});

describe("LayerType", () => {
  test("creates from BreakdownParams validated value", () => {
    const layer = new LayerType("issue");
    assertEquals(layer.value, "issue");
    assertEquals(layer.source, "BREAKDOWN_PARAMS_VALIDATED");
  });
});

// ❌ 禁止パターン：ConfigProfileName使用
// DirectiveType.create("to", ConfigProfileName.createDefault()); // 削除
// const profile = ConfigProfileName.createDefault(); // 削除
```

### 5. 修正対象ファイル

#### 優先度1（緊急）
```
lib/domain/core/value_objects/directive_type.ts          # ConfigProfileName依存完全除去
lib/domain/core/value_objects/layer_type.ts             # ConfigProfileName依存完全除去
lib/domain/core/aggregates/two_params.ts                # fromTwoParamsResult()統合実装
```

#### 優先度2（重要）
```
lib/domain/core/aggregates/two_params.test.ts                           # テストでのConfigProfileName除去
lib/application/templates/1_behavior_prompt_generation_service_test.ts  # テストでのConfigProfileName除去
lib/types/type_factory.ts                                               # ConfigProfileName参照除去
lib/validator/0_architecture_parameter_validator_test.ts                # テストでのConfigProfileName除去
lib/validator/1_behavior_parameter_validator_test.ts                    # テストでのConfigProfileName除去
```

#### 優先度3（必要）
```
lib/types/mod.ts                                         # ドキュメント更新
examples/*.sh                                            # サンプル更新
docs/**/*.md                                             # ドキュメント更新
```

### 6. 検証ポイント

#### コード検証
```typescript
// ✅ 許可される実装：BreakdownParams検証済み値の直接生成
const directive = new DirectiveType(twoParamsResult.directiveType);
const layer = new LayerType(twoParamsResult.layerType);
const twoParams = { directive, layer };

// ✅ 許可される実装：型安全な比較
if (directive.equals(otherDirective)) {
  // 処理
}

// ❌ 禁止される実装：ConfigProfileName依存
const directive = DirectiveType.create("to", ConfigProfileName.createDefault());
const profile = directive.profile;
directive.isValidForProfile(profile);
LayerType.getCommonLayerTypes(profile);
```

#### 統合検証
```typescript
// BreakdownParams統合フローの完全検証
const profileName = ConfigProfileName.fromCliOption("default");
const userConfig = await loadUserConfig(profileName);
const customConfig = ParamsCustomConfig.create(userConfig);
const result = await breakdownParams(args, customConfig);

if (result.type === "two") {
  const twoParams = fromTwoParamsResult(result.data);
  // twoParams.directive, twoParams.layerは検証済み
  // ConfigProfileNameへの依存は一切なし
}
```

## 作業手順

### Phase 1: 緊急調査（即座実行）
1. ConfigProfileName依存パターンの全コード検索
2. DirectiveType/LayerType型でのConfigProfileName使用箇所特定
3. テストでのConfigProfileName注入箇所特定
4. 設定ベース検証の現在の実装状況調査
5. 依存除去対象の完全リスト作成
6. 調査結果を `tmp/<branch>/configprofile-dependency-audit.md` に記録

### Phase 2: BreakdownParams統合設計実装
1. DirectiveTypeの単純コンストラクタ実装
2. LayerTypeの単純コンストラクタ実装
3. fromTwoParamsResult()ヘルパー関数実装
4. ConfigProfileName依存メソッドの削除
5. BreakdownParams検証済み値としての純粋実装

### Phase 3: ConfigProfileName依存の段階的除去
1. **優先度1ファイル**: DirectiveType/LayerTypeからConfigProfileName完全除去
2. **優先度2ファイル**: テストでのConfigProfileName使用削除
3. **優先度3ファイル**: ドキュメント・サンプルの更新
4. 各段階でテスト実行による動作確認

### Phase 4: 設定分離の完全実現
1. BreakdownParams統合による設定ベース検証確認
2. ConfigProfileName短寿命化の確認
3. ドメイン型と設定ドメインの分離確認
4. エラーハンドリングのBreakdownParams統合対応

### Phase 5: 完全性検証
1. ConfigProfileName依存の完全除去確認（grep検索）
2. 全テストの成功確認（`deno task test`）
3. BreakdownParams統合フローの動作確認
4. ドメイン境界分離の動作確認

## 完了条件

### 必須条件（全て満たすこと）
- [ ] DirectiveType型にConfigProfileNameパラメータが一切存在しない
- [ ] LayerType型にConfigProfileNameパラメータが一切存在しない
- [ ] `profile?: ConfigProfileName` パターンが完全に削除されている
- [ ] `getCommonLayerTypes(profile)` / `getKnownLayerTypes(profile)` が削除されている
- [ ] `isValidForProfile(profile)` メソッドが削除されている
- [ ] `get profile(): ConfigProfileName` アクセサが削除されている
- [ ] DirectiveType() / LayerType() コンストラクタが実装されている
- [ ] fromTwoParamsResult() ヘルパー関数が実装されている
- [ ] テストでConfigProfileName使用が完全に除去されている
- [ ] `deno task test` が全てpassする
- [ ] 既存機能の動作に影響がない

### 品質条件
- [ ] BreakdownParams検証済み値統合設計に完全準拠している
- [ ] ドメイン型と設定ドメインが完全に分離されている
- [ ] ConfigProfileNameの責務が設定読み込み専用に限定されている
- [ ] DirectiveType/LayerTypeが純粋な値オブジェクトとして機能している
- [ ] パフォーマンスの劣化がない
- [ ] ドキュメントがBreakdownParams統合設計に更新されている

### 検証条件
- [ ] `grep -r "ConfigProfileName.*DirectiveType\|DirectiveType.*ConfigProfileName" lib/` の結果が空
- [ ] `grep -r "ConfigProfileName.*LayerType\|LayerType.*ConfigProfileName" lib/` の結果が空
- [ ] `grep -r "profile?: ConfigProfileName" lib/` の結果が空
- [ ] `grep -r "getCommonLayerTypes.*profile\|getKnownLayerTypes.*profile" lib/` の結果が空
- [ ] BreakdownParams統合フローが正しく動作する
- [ ] 設定変更でパターンマッチングが正しく動作する

## 禁止事項（絶対厳守）

### 絶対禁止
- **ConfigProfileName依存の存続**: いかなる理由があってもDirectiveType/LayerType型でのConfigProfileName使用を残存させない
- **profile accessorの維持**: `get profile()` アクセサの名前変更による回避も禁止
- **設定検証の型内実装**: DirectiveType/LayerType内での設定ベース検証の実装禁止
- **テストでのConfigProfileName**: テストコード内でのConfigProfileName注入も禁止
- **中途半端な分離**: 一部だけConfigProfileName除去も禁止

### 制限事項
- lib/ 配下のファイル変更は設計原則準拠に限定
- 既存機能の破壊は禁止
- パフォーマンスの大幅劣化は禁止

## タスクの進め方

- **Git**: 現在のブランチで作業する
- **緊急性**: ConfigProfileName依存の除去を最優先で実行
- **段階性**: BreakdownParams統合設計実装 → 依存除去 → 分離実現 → 検証
- **並列性**: ファイル単位での並列リファクタリングで効率化

## 進捗更新

- 緊急タスクは `tmp/<branch>/configprofile-elimination-tasks.md` で管理
- 除去進捗は `tmp/<branch>/dependency-removal-progress.md` で追跡
- 完了時は `tmp/<branch>/jsr-integration-completed.md` に完了レポート作成
- 問題発生時は `tmp/<branch>/integration-issues.md` に課題記録

## 作業開始指示

### 緊急タスク開始
1. **チーム立ち上げ**: 全pane稼働、緊急事態モード
2. **即座調査**: ConfigProfileName依存の完全リスト作成
3. **BreakdownParams実装**: コンストラクタベース実装
4. **依存除去**: ConfigProfileName依存の段階的除去

### 成功の鍵
**BreakdownParams検証済み値統合設計の完全実装**が絶対条件。ConfigProfileName依存の完全除去により、`domain_boundaries_flow.ja.md` と `two_params_types.ja.md` で定義されたドメイン境界分離を完全実現する。

### 重要提言
この緊急リファクタリングは、**ドメイン境界の明確化**のための必須作業である。妥協や部分的対応は許されない。ConfigProfileName依存の完全除去により、真のBreakdownParams検証済み値統合設計を実現せよ。

**開始指示**: 直ちにチームを緊急事態モードで立ち上げ、ConfigProfileName依存の完全除去作業を開始せよ。設計原則違反の状態を即座に解消し、BreakdownParams統合設計の完全実装を達成せよ。
