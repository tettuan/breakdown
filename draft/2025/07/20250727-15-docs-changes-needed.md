# docs/配下での変更が必要な箇所 - Plan1実装のため

## 🎯 Plan1統一設定形式
```yaml
working_dir: ".agent/breakdown"  # SINGLE SOURCE OF TRUTH
app_prompt:
  base_dir: "prompts"            # 常に相対パス
app_schema:
  base_dir: "schemas"            # 常に相対パス
```

## 📝 変更が必要なドキュメント一覧

### 🔴 高優先度: 設定例の変更が必要

#### 1. `/docs/breakdown/interface/configuration.ja.md`
**変更箇所**:
- **Line 36**: `base_dir: "lib/breakdown/prompts"` → `base_dir: "prompts"`
- **Line 39**: `base_dir: "lib/breakdown/schema"` → `base_dir: "schemas"`
- **Line 50**: デフォルト値 `lib/breakdown/prompts` → `prompts`
- **Line 51**: デフォルト値 `lib/breakdown/schema` → `schemas`

**変更後の設定例**:
```yaml
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: "prompts"              # 相対パス
app_schema:
  base_dir: "schemas"              # 相対パス
```

#### 2. `/docs/breakdown/supporting_domain/initialization/init.ja.md`
**変更箇所**:
- **Line 42**: `base_dir: .agent/breakdown/prompts` → `base_dir: prompts`
- **Line 45**: `base_dir: .agent/breakdown/schema` → `base_dir: schemas`

**追加説明が必要**:
- working_dirとbase_dirの関係性説明
- パス解決方法の明確化

#### 3. `/docs/breakdown/supporting_domain/template_management/app_prompt.ja.md`
**変更箇所**:
- **Line 26**: `"base_dir": "./.agent/breakdown/prompts/"` → `"base_dir": "prompts"`

### 🟡 中優先度: パス解決説明の更新が必要

#### 4. `/docs/breakdown/interface/path_resolution.ja.md`
**大幅な更新が必要**:
- **Line 13**: `lib/breakdown/prompts/` → `.agent/breakdown/prompts/`  
- **Lines 57,61,65,69,161,165,169**: 全てのパス例を更新
- **Line 229**: プロファイル設定例の更新
- **Line 298**: 設定例の更新

**新しいパス解決説明を追加**:
```yaml
# 統一後のパス解決方法
working_dir: ".agent/breakdown"     # ベースディレクトリ  
app_prompt:
  base_dir: "prompts"               # 相対パス
# 実際のパス: .agent/breakdown/prompts/
```

#### 5. `/docs/breakdown/supporting_domain/workspace_management/workspace.ja.md`  
**変更箇所**:
- **Line 43**: 設定例の統一
- ディレクトリ構造図の更新（Line 28周辺）

### 🟢 低優先度: 用語説明の更新

#### 6. `/docs/breakdown/generic_domain/system/overview/glossary.ja.md`
**変更箇所**:
- **Line 90**: working_dirの説明更新
- **Line 99**: *-app.ymlの設定例更新  
- **Line 101**: config/の説明更新
- base_dirの説明でパス解決方法を明確化

#### 7. `/docs/breakdown/generic_domain/system/overview/glossary.md` (英語版)
**変更箇所**:
- 対応する英語版の更新

### 🔵 追加が必要: 新しい説明セクション

#### 8. 設定ファイル全体に追加すべき説明
```markdown
## パス解決の統一方針

### SINGLE SOURCE OF TRUTH原則
- `working_dir`: 唯一の基準ディレクトリ
- `base_dir`: 常に相対パス
- 実際のパス: `resolve(working_dir, base_dir)`

### 設定の意図
- `working_dir`: プロジェクト空間の定義
- `base_dir`: 相対的な役割分担の定義
```

## 🚨 検証が必要な箇所

### ドメイン設計ドキュメント
#### 9. `/docs/breakdown/domain_core/domain_boundaries_flow.ja.md`
**確認が必要**:
- **Line 163**: base_dir設定の記述が統一方針と整合するか
- プロンプトパス決定ドメインの説明更新

## 📋 変更作業の手順

### Phase 1: 高優先度（設定例）
1. `configuration.ja.md` の設定例統一
2. `init.ja.md` の初期化設定統一  
3. `app_prompt.ja.md` の設定例統一

### Phase 2: 中優先度（パス解決）
4. `path_resolution.ja.md` の全体的更新
5. `workspace.ja.md` のディレクトリ構造更新

### Phase 3: 低優先度（用語・説明）
6. `glossary.ja.md` の用語説明更新
7. 英語版ドキュメントの対応更新

### Phase 4: 追加説明
8. パス解決統一方針の説明追加
9. 設定意図の明確化

## ✅ 完了確認チェックリスト

- [ ] 全設定例が統一形式（working_dir + 相対base_dir）
- [ ] パス解決説明が統一方針と整合
- [ ] ディレクトリ構造図が正確
- [ ] 用語説明が最新設計と整合
- [ ] 英語版ドキュメントも対応済み
- [ ] 新しい設定意図の説明が追加済み

---

**影響範囲**: 7つの主要ドキュメントファイル  
**変更の性質**: 設定例の統一、パス解決説明の更新、新しい設計方針の説明追加