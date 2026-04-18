# アプリケーションプロンプト

---

**BreakdownPromptの利用**
BreakdownPromptはBreakdownアプリケーションの中核的なモジュールであり、AI開発支援のためのプロンプト生成を担います。ユーザーの入力やプロジェクトの状態に応じて、最適なプロンプトを自動的に選択・生成し、AIエージェントが理解しやすい指示文を提供します。

**公式ドキュメント**
最新の使い方や型定義、APIの詳細は https://jsr.io/@tettuan/breakdownprompt およびGitHubリポジトリのREADMEを参照してください。常に公式ドキュメントを確認することで、最新の仕様や推奨される利用方法を把握できます。

**役割・責務**
BreakdownPromptの責務は「特定されたプロンプトファイルに対する変数置換・スキーマ参照・プロンプト生成」に限定されます。どのプロンプトファイルを使うかの特定やパス解決は path.ja.md や app_factory.ja.md の責務、設定値の管理は app_config.ja.md の責務です。

**スコープ**
本モジュールはプロンプトファイルの内容をもとに、与えられた変数やスキーマ情報を埋め込んだプロンプトを生成することに特化します。ファイル特定・パス解決・設定管理は他モジュールが担い、AIによる変換やMarkdown解析、スキーマ検証も対象外です。

**処理概要**
コマンドライン引数や設定ファイルから必要なパラメータを取得し、プロンプトファイルの選択・変数置換・スキーマ情報の埋め込みを経て、最終的なプロンプトを生成・出力します。エラー時は適切なフィードバックも行います。

**設定例**
app_configファイルで baseDir や debug オプションを指定することで、プロンプトの格納ディレクトリやデバッグモードの有効化など、柔軟な運用が可能です。

```yaml
# Plan1統一設定形式
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"  # working_dir相対パス
  debug: false
```

# テンプレート変数の記述方法
- `{variable_name}`: テンプレート変数は `{` と `}` で括る
- `{{variable_name}}` は間違い。

# プロンプトテンプレートの配置ルール

- プロンプトテンプレートは `app_prompt.base_dir`（working_dir 相対）配下に、DirectiveType / LayerType に対応するディレクトリ階層で配置する。
- ファイル命名規則と組み合わせの詳細仕様は、パス解決の正式参照である [app_factory.ja.md](../../generic_domain/factory/app_factory.ja.md) を参照すること。
- ディレクトリ階層の具体例は [interface/path_resolution.ja.md](../../interface/path_resolution.ja.md) も参考になる。

---

詳細なパスや変数の扱い、命名規則などは [app_factory.ja.md](../../generic_domain/factory/app_factory.ja.md) を参照してください。

---

## CHANGELOG

### 2026-04-18: 設計ドキュメント整理
- パス解決ルールの説明を [app_factory.ja.md](../../generic_domain/factory/app_factory.ja.md) への参照に置換
- 「プロンプトテンプレートの配置ルール」を本ファイル固有の責務として明示
