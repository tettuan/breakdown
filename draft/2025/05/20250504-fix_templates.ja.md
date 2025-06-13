「仕様理解」を行ったあと、「問題の修正」に着手する。

# ミッション：実装の確認と修正
BreakdownConfig と BreakdownPrompt を用いたパス解決の方法を確立する。
テンプレート置換が無事に行われ、出力するテストが完了することを目指す。

# 仕様理解

`docs/index.md`と `docs/breakdown/index.ja.md` から参照されるすべての仕様書を読み込んで。 Schema仕様の理解は不要。
特に `docs/breakdown/path.ja.md`, `docs/breakdown/app_config.ja.md`, `docs/breakdown/options.ja.md`, `docs/breakdown/app_factory.ja.md` は、利用に必要な情報を説明している。

## ユースケース： パラメータの渡し方
プロジェクトのREADME を読み、ユースケースを理解する。
パラメータは、https://github.com/tettuan/breakdownparams/blob/main/docs/options.md を参照する。


# 問題の修正
1. `scripts/local_ci.sh` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `scripts/local_ci.sh` を実行する
5. 不明点や曖昧さがあれば、ミッションと `docs/` を起点に仕様書を探し、読んで、解決策を導く。
6. エラー修正のために1へ戻る

## テスト通過後
1. examples/README.md を読む
2. examples/*.sh を 1ファイルずつ実行する
2-1. 実行時に DEBUG=1 を付与する
3. examples の結果を分析し、問題点を整理する
4. 「パス解決の修正」へ戻る

# テンプレート・ディレクトリ判定の不一致に関するメインイシュー（2025-05-04）

## 発生しているエラー

### 1. Precedence when user.yml and app.yml baseDir conflict
- 期待値: 正常終了（テンプレートが見つかる）
- 実際: `result.success === false`、エラー: "Required directory does not exist"

### 2. E2E: baseDir is used for template lookup
- 期待値: 正常終了（テンプレートが見つかる）
- 実際: `result.success === false`、エラー: "Required directory does not exist"

### 3. Retry/recovery scenario on error
- 期待値: 2回目実行で正常終了（テンプレートが見つかる）
- 実際: `result.success === false`、エラー: "Required directory does not exist"

---

## メインイシュー

### 「存在しているディレクトリが存在しないと判定される」現象
- テストの準備段階で、テンポラリディレクトリやテンプレートファイルは確かに作成されている。
- BreakdownLoggerの出力からも、該当ディレクトリやテンプレートファイルが存在していることが確認できる。
- しかし、CLI実装側で「Required directory does not exist」と判定され、`result.success === false` となる。

### この現象がメインイシューである理由
- テストの異常系（存在しない場合のエラー）は期待通りに動作している。
- 一方、正常系（存在しているはずのディレクトリ・テンプレート）で「存在しない」と判定されるのは、テストと実装のパス解決や参照基準にズレがある可能性が高い。
- 仕様・テスト・実装のどこでパス解決の基準が食い違っているかを特定し、修正することが最優先課題である。

---

## 次のアクション
- 実装側のパス解決ロジックと、テストで作成しているパスの比較・検証を行う。
- どの時点で「存在しない」と判定されるのか、BreakdownLoggerの出力やDeno APIの挙動をもとに詳細に追跡する。

## デバッグ案：ディレクトリ階層ごとの比較による問題特定

- ディレクトリ構成は仕様（ルール）に基づいて構築されているため、
  - テストで作成したパス
  - 実装が参照しようとしているパス
  を「階層ごとに分解」して比較することで、問題の切り分けができる。

### デバッグ手順案
1. **パスを階層ごとに分解**
   - 例: `/a/b/c/d/e` → `[a, b, c, d, e]`
2. **テストで作成したパスと、実装が参照するパスを同時に分解**
3. **各階層ごとに比較**
   - どこまで一致しているかを確認
   - 一致している階層までは構築ロジック・パス解決ロジックが正しい
   - 一致しなくなった階層が問題の所在
4. **不一致となった階層で、テスト・実装・仕様のどこにズレがあるかを重点的に調査**

### メリット
- どこまでが正しいか／どこからズレているかを明確にできる
- 問題の特定が早くなり、修正すべき箇所（実装・テスト・仕様）が明確になる
- 仕様変更やリファクタ時にも、影響範囲を階層単位で把握できる

### 実装例（イメージ）
```ts
function comparePaths(pathA: string, pathB: string): number {
  const a = pathA.split(/[\\/]/);
  const b = pathB.split(/[\\/]/);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return i; // 不一致となった階層のインデックス
  }
  return Math.min(a.length, b.length); // すべて一致
}
```
- このようなロジックで「どこまで一致しているか」を自動で判定できる

---

このデバッグ手法を導入することで、パス解決やディレクトリ構成のバグ調査・仕様検証がより効率的になる。
