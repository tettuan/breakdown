# アプリケーションプロンプト
実行時に、アプリケーションが利用するプロンプトを特定し、利用する。
渡された引数やオプションから、どのプロンプトを用いるか判別する。

## プロンプトファイルの保存場所
app_configの設定ファイルに記載する。
```json
{
  ”app_prompt”:
    {"base_dir": "./breakdown/prompts/"}
}
```

## プロンプトファイルの命名規則
- dir : <app_prompt.base_dir>/<DemonstrativeType>/<LayerType>
- filename : f_<from_layer_type>.md

## 実行時にプロンプトを特定する手順
* `--from` オプションの値から <from_layer_type> を特定する
  * fromファイルについて、DemonstrativeType のいずれかを特定する
  * path, filename を調べて、DemonstrativeType が一致したら特定完了

ex.
```bash
./deno/bin/breakdown to issue -f ./.agent/breakdown/project/project_summary.md -o 
```
のとき、
- dir : <app_prompt.base_dir>/to/issue
- filename : f_project.md

