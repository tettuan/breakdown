# breakdown 引数の仕様

> **パラメータからパス解決への流れ・実装例については [app_factory.ja.md](./app_factory.ja.md) も参照してください。**

## パラメータ処理の実装

https://jsr.io/@tettuan/breakdownparams を使用します。最新版はJSRを確認すること。 README
https://github.com/tettuan/breakdownparams を読み把握すること。 オプション詳細は
https://github.com/tettuan/breakdownparams/blob/HEAD/docs/options.md に記載があります。

```ts
import { ParamsParser } from "@tettuan/breakdownparams";

const parser = new ParamsParser();

// Parse arguments
const result = parser.parse(Deno.args);

// Handle different result types
switch (result.type) {
  case "zero-params":
    if (result.help) {
      console.log("Show help message");
    }
    if (result.version) {
      console.log("Show version");
    }
    break;

  case "one":
    if (result.command === "init") {
      console.log("Initialize project");
    }
    break;

  case "two":
    console.log(`Demonstrative: ${result.demonstrativeType}`);
    console.log(`Layer: ${result.layerType}`);
    if (result.options.fromFile) {
      console.log(`From file: ${result.options.fromFile}`);
    }
    break;
}
```

## 基本コマンド

```bash
./.deno/bin/breakdown
```

## 引数

まず、引数の数に応じて処理が変わります。

### Result Types from breakdownparams

```
ZeroParamsResult: For commands with no parameters or help/version flags
OneParamsResult: For single commands like "init"
TwoParamsResult: For commands with demonstrative and layer type
```

### ZeroParamsResult = ヘルプやバージョン確認:

ex.

```bash
./.deno/bin/breakdown --help
```

#### OneParamsResult = 初期化などアプリケーションへの変更

- `init` : 初期設定を行う。

### TwoParamsResult = 分解処理

ex.

```bash
./.deno/bin/breakdown `<DemonstrativeType>` `<layerType>` \
  --from=`<file>` \
  --destination=`<output_file>` \
  --input=`<from_layer_type>` \
  --adaptation=`<adaptation_type>` \
```

ex.

```bash
./.deno/bin/breakdown to issue \
  --from=project.md \
  --destination=issue_details \
  --input=project \
  --adaptation=strict \
```

### オプション一覧

#### 基本オプション

- プロンプト指定に利用
  - `-a, --adaptation=<adaptation_type>`: プロンプトの種類を指定（例: strict, a など）
  - `-i, --input=<from_layer_type>`: usecase:入力レイヤーの種類を指定, system: fromLayerType を上書き
- テンプレート変数（ see `BreakdownPrompt` documents ）の値に利用
  - `-f, --from=<file>`: usecase:入力ファイルを指定, system: `{input_text_file}` を置き換え
  - `-o, --destination=<output_file>`: usecase:出力先を指定, system: `{destination_path}` を置き換え

- STDIN 
  - テンプレート変数の値に利用。 `{input_text}` を置き換え

#### 拡張オプション 

##### カスタム変数オプション (--uv-*)

テンプレート内で参照可能なユーザー定義変数を設定できます。

###### 基本的な使用方法

```bash
# 単一のカスタム変数
./.deno/bin/breakdown to issue \
  --from=project.md \
  --uv-userName=太郎

# 複数のカスタム変数
./.deno/bin/breakdown to issue \
  --from=project.md \
  --uv-userName=太郎 \
  --uv-projectName=マイプロジェクト \
  --uv-version=1.0.0 \
  --uv-environment=production
```

###### カスタム変数の仕様

- **形式**: `--uv-変数名=値`
- **変数名**: 英数字とアンダースコア（_）が使用可能
- **値**: 任意の文字列（スペースを含む場合はクォートで囲む）

###### テンプレート内での参照方法

プロンプトテンプレート内では `{変数名}` の形式で参照します：

```markdown
# プロンプトテンプレート例
プロジェクト名: {projectName}
担当者: {userName}
バージョン: {version}
環境: {environment}

入力ファイル: {input_text_file}
```

###### 実行例

```bash
# ユーザー情報を含むイシュー作成
./.deno/bin/breakdown to issue \
  --from=requirements.md \
  --uv-userName=太郎 \
  --uv-assignee=花子 \
  --uv-priority=high

# プロジェクト情報を含むドキュメント生成
./.deno/bin/breakdown to documentation \
  --from=design.md \
  --uv-projectName=ECサイト \
  --uv-version=2.1.0 \
  --uv-releaseDate=2024-04-01

# 複数言語対応の例
./.deno/bin/breakdown to translation \
  --from=content.md \
  --uv-sourceLang=日本語 \
  --uv-targetLang=英語 \
  --uv-translator=山田太郎
```

###### 注意事項

- カスタム変数名は大文字小文字を区別します（`userName` と `username` は別の変数）
- 同じ変数名を複数回指定した場合、最後の値が使用されます
- テンプレート内で未定義の変数を参照した場合、置換されずにそのまま残ります

