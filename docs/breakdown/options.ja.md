# breakdown 引数の仕様

## パラメータ処理の実装

https://jsr.io/@tettuan/breakdownparams を使用します。最新版はJSRを確認すること。 README
https://github.com/tettuan/breakdownparams を読み把握すること。 オプション詳細は
https://github.com/tettuan/breakdownparams/blob/HEAD/docs/options.md に記載があります。

```ts
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^0.1.10";

const parser = new ParamsParser();

// Parse arguments
const result = parser.parse(Deno.args);

// Handle different result types
switch (result.type) {
  case "no-params":
    if (result.help) {
      console.log("Show help message");
    }
    if (result.version) {
      console.log("Show version");
    }
    break;

  case "single":
    if (result.command === "init") {
      console.log("Initialize project");
    }
    break;

  case "double":
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
NoParamsResult: For commands with no parameters or help/version flags
SingleParamResult: For single commands like "init"
DoubleParamsResult: For commands with demonstrative and layer type
```

### NoParamsResult = ヘルプやバージョン確認:

ex.

```bash
./.deno/bin/breakdown --help
```

#### SingleParamResult = 初期化などアプリケーションへの変更

- `init` : 初期設定を行う。

### DoubleParamsResult = 分解処理

ex.

```bash
./.deno/bin/breakdown `<DemonstrativeType>` `<layerType>` \
  --from `<file>` \
  --destination `<output_file>` \
  --input `<from_layer_type>` \
  --adaptation `<adaptation_type>` \
```

ex.

```bash
./.deno/bin/breakdown to issue \
  --from project.md \
  --destination issue_details \
  --input project \
  --adaptation strict \
```

### オプション一覧

- `-f, --from <file>`: 入力ファイルを指定
- `-o, --destination <output_file>`: 出力先を指定
- `-i, --input <from_layer_type>`: 入力レイヤーの種類を指定
- `-a, --adaptation <adaptation_type>`: プロンプトの種類を指定（例: strict, a など）
