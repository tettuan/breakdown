「仕様理解」を行ったあと、「実装の自動修正」に着手する。

# ミッション：実装の確認と修正
BreakdownPrompt を用いた変換処理のあと、出力する方法を統一する。

# 課題：
プロンプトテンプレートのディレクトリ利用に関する現象整理

## 1. 出力期待と実際の参照パス

### 出力期待
- `app.yml` や `user.yml` の `app_prompt.base_dir` で指定したディレクトリ配下に、プロンプトテンプレート（例: `f_task.md` など）が配置されていること。
- 例：
  - `app.yml` の場合: `prompts/to/task/f_task.md`
  - `user.yml` の場合: `.agent/breakdown/prompts/user/to/task/f_task.md`

### 実際の参照パス（デバッグ出力より）
- コマンド実行時、`/Users/tettuan/github/breakdown/examples/to/task/f_task.md` など、
  - `app_prompt.base_dir` の値を無視し、`examples/` 直下の `to/task/` ディレクトリを参照している。
- 例：
  - `[DEBUG] prompt template path: /Users/tettuan/github/breakdown/examples/to/task/f_task.md`

## 2. 設定値とパス解決のズレ

- `app.yml` や `user.yml` の `app_prompt.base_dir` には `prompts` や `.agent/breakdown/prompts/user` などが指定されている。
- しかし、実際のテンプレート探索時にこの値が使われていない（もしくは空文字列やデフォルト値になっている）ため、
  - 期待したディレクトリではなく、カレントディレクトリ直下の `to/` や `summary/` などを参照してしまう。
- デバッグ出力でも `baseDir=''` となっているケースが見られる。

## 3. 初期化時と利用時のパス解決の違い

- **初期化時（03_init.sh など）**
  - `.agent/breakdown/prompts` や `.agent/breakdown/prompts/user` など、設定値に基づいたディレクトリが作成される。
- **利用時（05_project_to_implementation.sh 以降）**
  - 設定値を参照せず、`examples/` 直下のパスを直接参照しようとする挙動が見られる。
  - そのため、テンプレートが見つからずエラーとなる。

## 4. まとめ・事実面のポイント

- 設定ファイル（app.yml, user.yml）で指定した `app_prompt.base_dir` が、実際のテンプレート探索時に正しく使われていない。
- 初期化時は設定値に従ってディレクトリが作られるが、利用時はカレントディレクトリ基準のパス解決となっている。
- このズレが、テンプレートが見つからない主因となっている。
- デバッグ出力（[DEBUG] prompt template path: ...）を確認することで、どのパスが参照されているか事実ベースで把握できる。

---

この現象を踏まえ、テンプレート探索ロジックの修正や、設定値の利用徹底が必要。 

## 5. 解決案と導出ロジック

### 解決案
- プロンプト・スキーマのテンプレート探索時は、必ず設定ファイル（`app.yml`, `user.yml`）の `app_prompt.base_dir` および `app_schema.base_dir` を参照し、パス生成時の起点として明示的に利用する。
- CLIやスクリプトのエントリーポイントで、設定ファイルからbase_dirを取得し、`processWithPrompt`やパス生成関数に必ず渡す。
- 相対パスで渡された場合も「設定値＋相対パス」で絶対パス化し、カレントディレクトリ（Deno.cwd()）基準での解決を禁止する。
- プロンプトとスキーマでbaseDirを分離し、それぞれの用途で正しく使い分ける。

### 導出ロジック
- 設定ファイルのbase_dirは「テンプレート探索の起点ディレクトリ」として設計されているが、現状はbaseDirが空や未設定の場合にDeno.cwd()（現在ディレクトリ）が基準となり、意図しない場所を参照してしまう。
- PromptManager（BreakdownPrompt）はパス生成ロジックを持たず、絶対パスでテンプレートファイルを受け取るだけであるため、パス生成は外部（processor等）で責任を持つ必要がある。
- 設定値を必ず参照し、パス生成時に明示的に利用することで、examples/実行時の「テンプレートが見つからない」現象や、テストと現実の挙動のズレを解消できる。
- また、プロンプトとスキーマでbaseDirを分離することで、将来的な拡張や設定の柔軟性も担保できる。



# 仕様理解

`docs/index.md`と `docs/breakdown/index.ja.md` から参照されるすべての仕様書を読み込んで。 Schema仕様の理解は不要。
特に `docs/usage.ja.md`, `docs/path.ja.md`, `docs/breakdown/options.md` は、利用に必要な情報を説明している。

## ユースケース： プロンプトの選定ロジック
プロジェクトのREADME を読み、ユースケースを理解する。

# 実装の自動修正
1. `scripts/local_ci.sh` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `scripts/local_ci.sh` を実行する
5. 不明点や曖昧さがあれば、ミッションと `docs/` を起点に仕様書を探し、読んで、解決策を導く。
6. エラー修正のために1へ戻る
