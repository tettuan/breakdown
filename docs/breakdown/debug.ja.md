# Breakdown デバッグ出力機能について

## デバッグモードの有効化

Breakdown CLIやライブラリの実行時に、環境変数 `DEBUG` を有効にすることで、詳細なデバッグ出力が得られます。

例：
```sh
DEBUG=1 deno run -A cli/breakdown.ts ...
```

## 出力される内容
デバッグモードでは、以下の情報が `console.log` で標準出力に表示されます。

- `[DEBUG] current working directory:`
  - コマンド実行時のカレントディレクトリ
- `[DEBUG] app.yml path:`
  - 参照している app.yml の絶対パス
- `[DEBUG] app.yml content:`
  - app.yml の内容
- `[DEBUG] user.yml path:`
  - 参照している user.yml の絶対パス
- `[DEBUG] user.yml content:`
  - user.yml の内容
- `[DEBUG] prompt template path:`
  - 実際に参照しているプロンプトテンプレートのパス
- `[DEBUG] JSON schema path:`
  - 参照しているスキーマファイルのパス
- `[DEBUG] variables for PromptManager:`
  - PromptManager に渡す変数（JSON形式）

## 出力箇所・検索方法

- 主に `lib/prompt/processor.ts` 内で出力されます。
- ソースコード内で `console.log("[DEBUG]` という形式で記載されているため、
  - `grep '\[DEBUG\]'` などで検索することで、デバッグ出力箇所を特定できます。
- 必要に応じて他の箇所にも同様の出力を追加可能です。

## 活用例・トラブルシュート

- 設定ファイルやテンプレートのパスが意図通りか、どの変数が使われているかを確認できます。
- パスの混乱や設定ミス、テンプレートが見つからない場合の原因特定に役立ちます。
- テストやCI環境でも `DEBUG=1` を付与することで詳細な実行状況を把握できます。

---

**備考**
- デバッグ出力は標準出力に出るため、ログファイルへのリダイレクトやフィルタも可能です。
- 本番運用時は `DEBUG` を無効にしてください。 