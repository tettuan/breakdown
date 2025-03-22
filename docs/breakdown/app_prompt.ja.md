# アプリケーションプロンプト
実行時に、アプリケーションが利用するプロンプトを特定し、利用する。
渡された引数やオプションから、どのプロンプトを用いるか判別する。

## プロンプト処理の実装
https://jsr.io/@tettuan/breakdownprompt を使用します。

```ts
import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.3";

// プロンプトマネージャーの初期化
const promptManager = new PromptManager({
  base_dir: "./breakdown/prompts/"
});

// プロンプトの読み込みと変数置換
const prompt = await promptManager.loadPrompt({
  demonstrativeType: "to",
  layerType: "issue",
  fromLayerType: "project",
  variables: {
    input_markdown_file: "./.agent/breakdown/project/project_summary.md",
    input_markdown: "# Project Summary\nThis is a test project.",
    destination_path: "./.agent/breakdown/issues/"
  }
});
```

## プロンプトファイルの保存場所
app_configの設定ファイルに記載する。
```json
{
  "app_prompt": {
    "base_dir": "./breakdown/prompts/"
  }
}
```

## プロンプトファイルの命名規則
- dir : <app_prompt.base_dir>/<DemonstrativeType>/<LayerType>
- filename : f_<from_layer_type>.md

## 実行時にプロンプトを特定する手順
* options.ja.md に基づいて <from_layer_type> が決定される。この結果を受け取る。

ex 1.
```bash
./.deno/bin/breakdown to issue -f ./.agent/breakdown/project/project_summary.md -o 
```
のとき、
- dir : <app_prompt.base_dir>/to/issue
- filename : f_project.md

ex 2.
`-i` が明示的に指定されているケース。
```bash
./.deno/bin/breakdown to issue -f ./.agent/breakdown/project/project_summary.md -o \
-i issue
```
のとき、
- dir : <app_prompt.base_dir>/to/issue
- filename : f_issue.md


### コマンドのオプションが省略された場合
- 自動補完・自動命名された後に行う

## 出力形式
すべての出力において、プロンプトの内容を表示します。
表示時に「置換処理」を行ったうえで出力します。

ex.：
入力プロンプトの内容： ```prompt
# example prompt 
this is a propmt contents.
{input_markdown_file}
{input_markdown}

# schema
{schema_file}

# destination path
{destination_path}
```

出力： ```
# example prompt 
this is a propmt contents.
./.agent/breakdown/issues/12345_something.md
# input markdown
this is a input markdown contents.

# schema
./rules/schema/task/base.schema.json

# destination path
./.agent/breakdown/tasks/
```
### 置換処理
CLIオプションの値と、自動補完処理されたファイルを用いる。

#### {input_markdown_file}
- CLI の -f で渡されたファイルのPATH
  - 自動補完されたディレクトリ情報を含む
####  {input_markdown}
- CLI の -f で渡されたファイルの内容
####  {destination_path}
- CLI の -o で渡されたPATH
- または、自動補完された出力先


# プロンプトの配置
- プロンプトの特定は、コマンドラインオプションの種類・値の組み合わせで決まる
- 組み合わせの全てが存在する


