# ## ブランチ戦略（Conventional Branches）

コミットメッセージ規約と連動したブランチ命名戦略を採用。一貫性があり、自動化ツールとの相性が良い。

```
main          # 本番環境
├── feat/user-auth-20250623        # 新機能開発
├── feat/user-profile-20250623     # 新機能開発
├── fix/login-error-20250623       # バグ修正
├── docs/api-spec-20250623         # ドキュメント更新
├── refactor/auth-service-20250623 # リファクタリング
│    └── test/user-service-20250623     # テスト追加
├── release/v1.0.0                     # リリース準備
└── hotfix/critical-security-20250623  # 緊急修正
```

### ブランチ命名規則

**基本形式**: `<type>/<description>-<date>`

**例**:
- `feat/user-authentication-20250623`
- `fix/login-validation-20250623`
- `docs/api-documentation-20250623`
- `refactor/database-layer-20250623`

**日時形式**: `date +%Y%m%d-%H%M`（時分まで必要）

### ブランチタイプ（Conventional Branches）

- **`feat/`** - 新機能の追加
- **`fix/`** - バグ修正
- **`docs/`** - ドキュメントのみの変更
- **`style/`** - コードフォーマット、セミコロン追加など（機能に影響しない変更）
- **`refactor/`** - バグ修正や機能追加を伴わないコードの改善
- **`test/`** - テストの追加や既存テストの修正
- **`chore/`** - ビルドプロセスや補助ツールの変更
- **`perf/`** - パフォーマンス改善
- **`ci/`** - CI設定ファイルやスクリプトの変更
- **`build/`** - ビルドシステムや外部依存関係の変更
- **`revert/`** - 以前のコミットの取り消し

### 特別なブランチ

- **`release/`** - リリース準備（バージョン番号付き）
- **`hotfix/`** - 本番環境の緊急修正

### ブランチ作成ルール

**重要**: 新しいブランチは必ず `main` ブランチから派生させること。`main` ブランチから直接ブランチを作成してはいけない。

**正しい手順**:
```bash
# mainブランチに切り替え
git checkout main

# 最新状態に更新
git pull origin main

# 新しいブランチを作成・切り替え
git checkout -b feat/new-feature-$(date +%Y%m%d)
```

**例外**: `hotfix/` ブランチのみ `main` から派生可能
```bash
# 緊急修正の場合のみ
git checkout main
git checkout -b hotfix/critical-bug-$(date +%Y%m%d)
```

Conventional Branches

```
main          # 本番環境
├── main   # 開発統合ブランチ
│   ├── feature/user-auth     # 機能開発
│   ├── feature/user-profile  # 機能開発
│   └── bugfix/fix-login      # バグ修正
├── release/v1.0.0           # リリース準備
└── hotfix/critical-bug      # 緊急修正
```

## コミットメッセージ規約
```
type(scope): subject

body

footer
```

**タイプ**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: その他の変更

**例**:
```
feat(auth): add JWT authentication

- Implement JWT token generation
- Add middleware for token validation
- Update user login endpoint

Closes #123
```

## プルリクエスト
- **base**: ブランチtreeの派生元へ。main直接は禁止, mainから
- **レビュー必須**: 最低1名の承認
- **CI/CD**: 自動テスト・ビルドの通過必須
- **説明**: 変更内容・影響範囲を明記
- **リンク**: 関連するIssueを紐付け
