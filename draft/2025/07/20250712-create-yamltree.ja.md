# 概要
アプリケーションの重要なTYPE宣言と、
重要なフローを、以下の観点でYAML化し、アプリケーション全体の骨格を示す。

# 手順

1. main からスタートし、「ゴール地点」までを順序よく辿る
2. 分岐は階層で表現する
3. 「初期引数」を複数のパターンで試し、正常系と異常系を分ける
3-1. 異常系は1階層で追うのを止める
4. 経路情報を簡潔に記録し、後から「骨格判断」を行う
5. 骨格のTYPE宣言（interface, class, constant）をYAML化する
6. 「距離判定」に応じて、YAML階層を深くする
6-1. 3階層まで記載する
7. 6までの手順で洗い出しされた型について、「簡易な宣言構造」を末尾にまとめる

## 骨格判断
1. 何度も通る経路は、「骨格」と判断する
2. 最後まで最短で通る経路は、「骨格の中心」と判断する

## 距離判定
1. 「骨格の中心」から、2軸で判断する
2. まず実行ステップの数を判断材料とする
3. 内部的な処理は深さとし、縦軸とする
4. 意味的な違いは近接距離とし、横軸とする
5. 横軸が遠いものは、「骨格の中心」から離れた距離と判断する
6. 横軸の距離を判定結果とする

## 記載項目

- 名称: Interface, Class, Type 宣言した名称
- 受け取り値型: コンストラクタや 初回呼び出しの引数に用いられるメソッドが受け取る型の名称
  - 引数名ではない
  - Record型やTYPE宣言された型や、stringなどの標準型
- 戻り値型: 返る値の型
  - 変数名ではない
  - Record型やTYPE宣言された型や、stringなどの標準型


### 記載例
- name:PromptManager
  - initializer: generatePrompt()
  - args: template: PromptPath, PromptVariables
  - return: PromptResult

#### 簡易な宣言構造
- Options: TwoParamsResult.Options | OneParamsResult.Options | ZeroParamsResult.Options
- PromptVariables: StandardVariable | FilePathVariable | StdinVariable | UserVariable

##### 記載例

```
  result_types:
    - name: Result
      structure: Result<T, E>
      description: "Generic Result type for error handling"
      
    - name: ParamsResult
      structure: ZeroParamsResult | OneParamsResult | TwoParamsResult | ErrorResult
      description: "Discriminated union for parameter parsing results"
```


## 初期引数

### zero
```
breakdown  --version
```

### one
```
breakdown init
```

### two
#### ユースケースパターン

#### 1. 未整理の情報からプロジェクト実装へ

```bash
echo "<messy_something>" | breakdown summary project -o=<project_summary.md>
breakdown to project -i=<project_summary.md> -o=<project_dir>
breakdown to issue -i=<project_summary.md> -o=<issue_dir>
breakdown to task -i=<issue.md> -o=<tasks_dir>
```

#### 2. タスク群からの課題作成

```bash
breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir>
# 必要に応じて生成された課題を編集
breakdown to task -i=<issue.md> -o=<tasks_dir>
```

#### 3. 不具合情報からの修正タスク生成

```bash
tail -100 "<error_log_file>" | breakdown defect project -o=<project_defect.md>
breakdown defect issue --from=<project_defect.md> -o=<issue_defect_dir>
breakdown defect task --from=<issue_defect.md> -o=<task_defect_dir>
```

#### 4. 改善要求からの修正提案作成

```bash
breakdown defect task --from=<improvement_request.md> -o=<task_defect_dir>
```



## ゴール地点

プロンプトテンプレートを標準出力するまで。


# 出力先
`tmp/application-20250712.yml`



