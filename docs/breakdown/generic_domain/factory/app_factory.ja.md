# PromptVariablesFactory

> **本ドキュメントの位置付け**: PromptVariablesFactory のファクトリー責務（パラメータ構築・パス解決の一元化）に特化した文書。関連ドメインの正本は以下。
> - **アプリケーション設定（*-app.yml, *-user.yml）**: [configuration.ja.md](../../interface/configuration.ja.md)
> - **DirectiveType / LayerType / ConfigProfile の型定義**: [two_params_types.ja.md](../../domain_core/two_params_types.ja.md)
> - **PromptVariables の3段階変容（Source → Variables → Params）**: [prompt_variables.ja.md](../../domain_core/prompt_variables.ja.md)
> - **プロンプトテンプレートのパス決定ロジック詳細**: [prompt_template_path.ja.md](../../domain_core/prompt_template_path.ja.md)

> **重要：TwoParamsResult と TwoParams の区別**
> - **TwoParamsResult**: JSR `@tettuan/breakdownparams` が返す解析結果型（境界横断の生データ）
> - **TwoParams**: Breakdown ドメイン内部の型（DirectiveType + LayerType をバリューオブジェクトで保持）
> - 本Factory は TwoParamsResult を入力として受け取り、内部で TwoParams 相当の構造へ写像してパス解決に用いる。詳細は [two_params_types.ja.md](../../domain_core/two_params_types.ja.md) を参照。

## 概要

プロンプト置換処理に必要な全パラメータ・パス解決を一元化するFactoryクラス。
CLI・テスト・アプリ本体は必ずこのFactory経由でパス解決・パラメータ構築を行う。

- 設定値はBreakdownConfigから取得し、CLIパラメータと組み合わせて仕様に従い全てのパス・パラメータを生成
- スキーマファイルパスも含め、全てのパス解決を一元化
- Factoryパターンにより、拡張性・テスト容易性・一貫性を担保
- 本ファイルは**パス解決アルゴリズムの正式参照**として位置付ける（`app_prompt.ja.md` / `app_schema.ja.md` / `interface/path_resolution.ja.md` は本ファイルを参照する）

## 目的の階層

上位の目的のために、下位の目的が存在する。
判断は上位目的が優先する。(1が上位,2,3,4と下位になる)

### 目的1
プロンプト置換処理に必要な全パラメータ・パス解決を一元化する。
必ずこのFactory経由でパス解決・パラメータ構築を行う。
解釈が各所に点在する不都合を、排除する。

### 目的2
各パラメータ、オプション、設定などの責務を明確にする。
単一責任、責任分解を行い、役割に応じた実装を行うことで、可読性やテスト容易性を高める。

### 目的3
処理を隠蔽する。大きな目的のための大きなフローと、細部の処理を混ぜない。
抽象度の高い処理を大きな処理で行い、内部は内部で最適化可能にする。
外部で起こることへ関知しないことで、Interfaceの定義によって結合する、疎結合なシステムを目指す。

## PromptVariablesFactory責務

- プロンプト/スキーマ/入出力ファイル等、全パス・パラメータの構築
- 仕様変更時の影響範囲最小化

※ 入力値のバリデーションは原則Validatorの責務とし、Factoryはパス・パラメータ構築に専念する。

## 入出力

- **入力**:  
  - BreakdownConfig（*-app.yml, *-user.yml などから読み込まれる設定値）
    - ※ ConfigProfile（プロファイル切り替え）の責務定義は [two_params_types.ja.md](../../domain_core/two_params_types.ja.md) を参照
  - CLIパラメータ（TwoParamsResult 等、コマンドライン引数やAPI経由で渡されるパラメータ全般）
  - カスタム変数（--* オプションで指定されるユーザー定義変数）
- **出力**:  
  - promptFilePath, inputFilePath, outputFilePath, schemaFilePath など、プロンプト置換処理に必要な全パラメータ
  - カスタム変数マップ（変数名でアクセス可能）
  - ※ 出力されるパラメータが PromptVariableSource → PromptVariables → PromptParams のどの段階に該当するかは [prompt_variables.ja.md](../../domain_core/prompt_variables.ja.md) を参照

## パス解決ルール（要点のみ）

- **プロンプトファイル**:  
  プロンプトベースディレクトリ（`app_prompt.base_dir`） + directiveType + layerType + `f_{fromLayerType}.md`
- **スキーマファイル**:  
  スキーマベースディレクトリ（`app_schema.base_dir`） + directiveType + layerType + `base.schema.md`
- **入力ファイル**:  
  入力ファイルパス解決の詳細仕様準拠
- **出力ファイル**:  
  出力ファイルパス解決の詳細仕様準拠

## クラス設計・API例

> ※ 下記はpublicなAPIメソッドのみを記載。内部のprivateメソッドは省略。

```ts
interface PromptVariablesFactoryOptions {
  config: AppConfig;
  cliParams: TwoParamsResult; // v1.0.1: DoubleParamsResult → TwoParamsResult
}

class PromptVariablesFactory {
  constructor(options: PromptVariablesFactoryOptions);
  validateAll(): void;
  getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    userVariables?: Record<string, string>; // v1.0.1: ユーザー変数サポート
    // ...他の必要なパラメータ
  };
  // 個別getter（readonlyプロパティとしても可）
  readonly promptFilePath: string;
  readonly inputFilePath: string;
  readonly outputFilePath: string;
  readonly schemaFilePath: string;
  readonly userVariables: Record<string, string>; // v1.0.1: ユーザー変数
}
```

### 利用例

```ts
const factory = new PromptVariablesFactory({ config, cliParams });
// 一括取得
const { promptFilePath, inputFilePath, outputFilePath, schemaFilePath, userVariables } = factory.getAllParams();
// 個別アクセス
console.log(factory.promptFilePath);
console.log(factory.inputFilePath);
// v1.0.1: ユーザー変数へのアクセス
console.log(factory.userVariables['projectName']); // --uv-projectName=value で指定した値
```

## 参照

- [パス解決ルール](../../interface/path_resolution.ja.md)
- [設定管理](../../interface/configuration.ja.md)
- [テスト仕様](../../../tests/testing.ja.md)

# カスタム変数（--*）のサポート

ユーザー定義のカスタム変数をCLIから指定し、テンプレート内で利用できます。

## 実装方法

```ts
// TwoParamsResult型のcliParamsからユーザー変数を抽出
const userVariables = tpr.options.userVariables || {};
```

### 使用例

```bash
# CLI実行時
breakdown to issue --from=project.md \
  --projectName=MyProject \
  --author=太郎 \
  --version=1.0.0

# テンプレート内での参照 -> 　`` は除去されて渡される 
プロジェクト: {projectName}
作成者: {uauthor}
バージョン: {version}
```

# パラメータオプションと予約変数の対応表

> breakdownparams のパラメータオプション（--from, -o, など）と、breakdownprompt の予約変数の関係を整理したものです。

## 対応表

| 入力オプション         | inputFilePath         | outputFilePath        | promptFilePath        | schemaFilePath        | fromLayerType        | adaptationType      | userVariables |
|------------------------|-----------------------|-----------------------|-----------------------|-----------------------|----------------------|---------------------|--------------------------|
| --from, -f             | 入力ファイルパスとして利用 |                       |                       |                       |                      |                     |                          |
| --destination, -o      |                       | 出力ファイルパスとして利用 |                       |                       |                      |                     |                          |
| --edition, -e          |                       |                       |                       |                       | 入力レイヤー種別を指定 |                     |                          |
| --adaptation, -a       |                       |                       | プロンプトファイル名のsuffix |                       |                      | プロンプト種別を指定   |                          |
| --* (v1.0.1)        |                       |                       |                       |                       |                      |                     | カスタム変数として格納    |
| directiveType          |                       |                       | パス解決に利用         | パス解決に利用         |                      |                     |                          |
| layerType              |                       |                       | パス解決に利用         | パス解決に利用         |                      |                     |                          |

### 補足
- inputFilePath, outputFilePath, promptFilePath, schemaFilePath などの予約変数は PromptVariablesFactory で一元的に構築される。
- fromLayerType は --edition で明示指定されない場合、"default" を使用する。
- adaptationType は --adaptation で指定された場合、プロンプトファイル名のsuffixとして利用される。
- directiveType, layerType はコマンドの主要引数であり、各種パス解決のディレクトリ名等に利用される。
- ユーザー変数（--uv-*）は userVariables オブジェクトに格納され、テンプレート内で `{uv-変数名}` として参照可能。
- **base_prompt_dir** は promptFilePath から `dirname()` で算出される派生変数。プロンプトテンプレートが配置されているディレクトリパス（例: `/workspace/prompts/to/task`）を提供する。テンプレート内で `{base_prompt_dir}` として参照可能。末尾スラッシュは含まれない。
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

---

## CHANGELOG

### 2026-04-18: 設計ドキュメント整理
- 冒頭に TwoParamsResult（JSR 結果）と TwoParams（ドメイン型）の区別を明記
- ConfigProfile 責務の説明を [two_params_types.ja.md](../../domain_core/two_params_types.ja.md) への参照に置換
- PromptVariables 3段階変容の概念説明を [prompt_variables.ja.md](../../domain_core/prompt_variables.ja.md) への参照に置換
- 本ファイルを「パス解決アルゴリズムの正式参照」と位置付け、`app_prompt.ja.md` / `app_schema.ja.md` 側からの参照を受ける形に整理