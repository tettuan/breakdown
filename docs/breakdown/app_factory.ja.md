# PromptVariablesFactory

> **アプリケーション設定（app.yml, user.yml）の詳細仕様については [app_config.ja.md](./app_config.ja.md) を参照してください。**

## 概要

プロンプト置換処理に必要な全パラメータ・パス解決を一元化するFactoryクラス。
CLI・テスト・アプリ本体は必ずこのFactory経由でパス解決・パラメータ構築を行う。

- 設定値はBreakdownConfigから取得し、CLIパラメータと組み合わせて仕様に従い全てのパス・パラメータを生成
- スキーマファイルパスも含め、全てのパス解決を一元化
- Factoryパターンにより、拡張性・テスト容易性・一貫性を担保

## 責務

- プロンプト/スキーマ/入出力ファイル等、全パス・パラメータの構築
- 仕様変更時の影響範囲最小化

※ 入力値のバリデーションは原則Validatorの責務とし、Factoryはパス・パラメータ構築に専念する。

## 入出力

- **入力**:  
  - BreakdownConfig（app.yml, user.yml などから読み込まれる設定値）
  - CLIパラメータ（DoubleParamsResult等、コマンドライン引数やAPI経由で渡されるパラメータ全般）
- **出力**:  
  - promptFilePath, inputFilePath, outputFilePath, schemaFilePath など、プロンプト置換処理に必要な全パラメータ

## パス解決ルール（要点のみ）

- **プロンプトファイル**:  
  プロンプトベースディレクトリ（`app_prompt.base_dir`） + demonstrativeType + layerType + `f_{fromLayerType}.md`
- **スキーマファイル**:  
  スキーマベースディレクトリ（`app_schema.base_dir`） + demonstrativeType + layerType + `base.schema.md`
- **入力ファイル**:  
  [path.ja.md](./path.ja.md)「Inputファイル」セクション準拠
- **出力ファイル**:  
  [path.ja.md](./path.ja.md)「Outputファイル」セクション準拠

## クラス設計・API例

> ※ 下記はpublicなAPIメソッドのみを記載。内部のprivateメソッドは省略。

```ts
interface PromptVariablesFactoryOptions {
  config: AppConfig;
  cliParams: DoubleParamsResult;
}

class PromptVariablesFactory {
  constructor(options: PromptVariablesFactoryOptions);
  validateAll(): void;
  getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    // ...他の必要なパラメータ
  };
  // 個別getter（readonlyプロパティとしても可）
  readonly promptFilePath: string;
  readonly inputFilePath: string;
  readonly outputFilePath: string;
  readonly schemaFilePath: string;
}
```

### 利用例

```ts
const factory = new PromptVariablesFactory({ config, cliParams });
// 一括取得
const { promptFilePath, inputFilePath, outputFilePath, schemaFilePath } = factory.getAllParams();
// 個別アクセス
console.log(factory.promptFilePath);
console.log(factory.inputFilePath);
```

## 参照

- [docs/breakdown/path.ja.md](./path.ja.md)
- [docs/breakdown/options.ja.md](./options.ja.md)
- [docs/breakdown/testing.ja.md](./testing.ja.md)
- [docs/breakdown/app_config.ja.md](./app_config.ja.md)

# パラメータオプションと予約変数の対応表

> breakdownparams のパラメータオプション（--from, -o, など）と、breakdownprompt の予約変数の関係を整理したものです。

## 対応表

| 入力オプション         | inputFilePath         | outputFilePath        | promptFilePath        | schemaFilePath        | fromLayerType        | adaptationType      |
|------------------------|-----------------------|-----------------------|-----------------------|-----------------------|----------------------|---------------------|
| --from, -f             | 入力ファイルパスとして利用 |                       |                       |                       | fromFileから推定      |                     |
| --destination, -o      |                       | 出力ファイルパスとして利用 |                       |                       |                      |                     |
| --input, -i            |                       |                       |                       |                       | 入力レイヤー種別を指定 |                     |
| --adaptation, -a       |                       |                       | プロンプトファイル名のsuffix |                       |                      | プロンプト種別を指定   |
| demonstrativeType      |                       |                       | パス解決に利用         | パス解決に利用         |                      |                     |
| layerType              |                       |                       | パス解決に利用         | パス解決に利用         |                      |                     |

### 補足
- inputFilePath, outputFilePath, promptFilePath, schemaFilePath などの予約変数は PromptVariablesFactory で一元的に構築される。
- fromLayerType は --input で明示指定されない場合、fromFile のパスやファイル名から推定される。
- adaptationType は --adaptation で指定された場合、プロンプトファイル名のsuffixとして利用される。
- demonstrativeType, layerType はコマンドの主要引数であり、各種パス解決のディレクトリ名等に利用される。

---

- 入力オプション（CLIオプション）の詳細な説明は [breakdownparams リポジトリ](https://github.com/tettuan/breakdownparams) を参照してください。
- 予約変数の詳細な説明は [breakdownprompt の variables.ja.md](https://github.com/tettuan/breakdownprompt/blob/main/docs/variables.ja.md) を参照してください。

# STDIN・-f（--from）・input_textの仕様

## 概要
- Breakdown CLIでは、標準入力（STDIN）と-f（--from）オプションは**独立して動作**します。
- それぞれ、異なる予約変数（`input_text`, `input_text_file`）のトリガーとなります。

## 仕様詳細
- **STDINがある場合**
  - STDINの内容は `variables.input_text` にセットされます。
  - -f（--from）は**オプショナル**で、指定してもしなくてもよい。
  - STDINが存在しない場合、`input_text` は空文字列または未定義となります。
- **-f（--from）を指定した場合**
  - 指定したファイルの内容は `variables.input_text_file` にセットされます。
  - STDINの有無に関わらず、`input_text_file` の値は独立して決まります。
- **両方指定した場合**
  - `input_text` にはSTDIN、`input_text_file` にはファイル内容がセットされます。
  - どちらもテンプレート内で `{input_text}` `{input_text_file}` として利用可能です。
- **相互干渉なし**
  - STDINと-fは互いに干渉せず、どちらか一方・両方、いずれのケースも許容されます。
- **両方指定しなかった場合**
  どちらも無しは許容されません。いずれかは必須です。入力がいずれもない場合はエラーです。

## テンプレート変数への反映
- プロンプトテンプレート内で `{input_text}` `{input_text_file}` などの変数を使うことで、
  CLIから渡されたSTDINやファイル内容を柔軟に利用できます。
- 例：
  ```md
  # Project
  {input_text}
  {input_text_file}
  ```
- これにより、パイプやリダイレクト、ファイル指定など多様な入力方法に対応できます。

## 参考
- 仕様の根拠・詳細は `docs/breakdown/cli.ja.md` および `docs/breakdown/path.ja.md` も参照してください。