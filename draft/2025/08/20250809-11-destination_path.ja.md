# 仕様変更指示書 - destination_pathのパス決定仕様の変更

## 実装方針

destination_path の「現在の仕様」のパス解決のうち、「解決ロジック:」を変更する。
新たに、設定値を用いた決定方法を使う。

### 前提仕様
「現在の仕様」のパス解決以外の仕様を変更しない。

作業着手前に、設計思想を理解する。
`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。
実装のAI複雑性制御は `docs/breakdown/domain_core/ai-complexity-control_compact.ja.md` の原則に従い、最小限の修正で最大の効果を得ること。

テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
他の`docs/breakdown/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

### 変更の背景

出力先をoption指定する方式を採用していたが、実行指定では、出力先がバラバラになり、整理できず混乱することとなった。
設定ファイルを用いて基本ルールを適用し、destination_pathのprefix部分を自動決定した方が良いと考え、仕様変更することとした。

### 現在の仕様

``````
# destination_path 仕様調査結果

## 1. PATH決定に使用している変数や入力値

### 1.1 CLIオプション（入力）
- `-o` オプション
- `--destination` オプション  
- `--output` オプション（未確認の可能性あり）

### 1.2 中間変数
- `options.destinationFile`: CLIオプションから抽出された値
- `PromptCliParams.options.destinationFile`: CLIパラメータ構造体のプロパティ
- `PromptVariableSource.destinationPath`: 変数ソースのプロパティ

### 1.3 設定値
- `config.working_dir`: 作業ディレクトリ（BreakdownConfigから取得）
- `Deno.cwd()`: 現在の作業ディレクトリ（working_dirが未設定の場合のフォールバック）

### 1.4 最終変数
- `destination_path`: プロンプトテンプレート内で使用される変数名
- `StandardVariables.destination_path`: 標準変数としての最終値

## 2. 決定方法

### 2.1 CLIオプションの解析
`lib/cli/generators/two_params_prompt_generator_ddd.ts` (line 478-479):
```typescript
destinationFile: (options.o as string) || (options.destination as string) || 
  (options.output as string)
```
3つのオプション名から優先順位付きで値を取得。

### 2.2 パスの解決
`lib/factory/output_file_path_resolver_totality.ts` (line 54-57):
```typescript
const workingDir = (config.working_dir as string) || ".";
const resolvedPath = isAbsolute(String(destinationFile))
  ? String(destinationFile)
  : resolve(Deno.cwd(), workingDir, String(destinationFile));
```

解決ロジック:
1. 絶対パスの場合: そのまま使用
2. 相対パスの場合: `Deno.cwd()` + `working_dir` + `destinationFile` を結合

### 2.3 変数の生成
`lib/processor/variable_processor.ts` (line 325-330):
```typescript
const destinationPath = options.o ?? 
  options.destination ?? 
  options.output ?? 
  options.destinationFile;
if (destinationPath !== undefined) {
  standardVariables.destination_path = String(destinationPath);
}
```

### 2.4 BreakdownPromptへの受け渡し
`lib/prompt/prompt_generation_service_impl.ts` (line 177):
```typescript
builder.addStandardVariable("destination_path", context.outputFilePath);
```

重要な仕様:
- 出力ファイルが指定されていない場合、`destination_path`変数は追加されない
- これにより、テンプレート内の`{destination_path}`は未置換のまま残る

## 3. destination_path変数へセットする直前までのフローチャート図

```mermaid
flowchart TD
    Start[CLIコマンド実行] --> ParseOptions[CLIオプション解析]
    
    ParseOptions --> CheckO{"-o オプション?"}
    CheckO -->|Yes| SetDestFile[options.o を使用]
    CheckO -->|No| CheckDest{"--destination?"}
    CheckDest -->|Yes| SetDestFile2[options.destination を使用]
    CheckDest -->|No| CheckOutput{"--output?"}
    CheckOutput -->|Yes| SetDestFile3[options.output を使用]
    CheckOutput -->|No| NoDestFile[destinationFile = undefined]
    
    SetDestFile --> HasDestFile[destinationFile に値あり]
    SetDestFile2 --> HasDestFile
    SetDestFile3 --> HasDestFile
    
    HasDestFile --> CreateCliParams[PromptCliParams作成]
    NoDestFile --> CreateCliParams
    
    CreateCliParams --> LoadConfig[BreakdownConfig読み込み]
    LoadConfig --> GetWorkingDir[working_dir取得]
    
    GetWorkingDir --> CheckWorkingDir{working_dir設定済み?}
    CheckWorkingDir -->|Yes| UseConfigWD[config.working_dirを使用]
    CheckWorkingDir -->|No| UseCWD[Deno.cwd()を使用]
    
    UseConfigWD --> ResolveOutputPath
    UseCWD --> ResolveOutputPath
    
    HasDestFile --> ResolveOutputPath[OutputFilePathResolver実行]
    NoDestFile --> SkipResolver[Resolver スキップ]
    
    ResolveOutputPath --> CheckAbsolute{絶対パス?}
    CheckAbsolute -->|Yes| UseAbsolute[そのまま使用]
    CheckAbsolute -->|No| UseRelative[resolve(cwd, working_dir, destinationFile)]
    
    UseAbsolute --> CreateStandardVar
    UseRelative --> CreateStandardVar
    
    CreateStandardVar[StandardVariable作成] --> CheckDestExists{destinationFileが存在?}
    CheckDestExists -->|Yes| AddVariable[destination_path変数を追加]
    CheckDestExists -->|No| SkipVariable[destination_path変数を追加しない]
    
    SkipResolver --> SkipVariable
    
    AddVariable --> BuildPrompt[PromptBuilder実行]
    SkipVariable --> BuildPrompt
    
    BuildPrompt --> FinalPrompt[最終プロンプト生成]
```

## 4. 現在の実装の特徴

### 4.1 優先順位
1. `-o` オプション（最優先）
2. `--destination` オプション
3. `--output` オプション（存在する場合）

### 4.2 パス解決の特性
- 絶対パスはそのまま使用
- 相対パスは `Deno.cwd()` → `working_dir` → `destinationFile` の順で結合
- `working_dir`が未設定の場合は "." または `Deno.cwd()` を使用

### 4.3 変数の条件付き生成
- 出力先が指定されていない場合、`destination_path`変数自体が生成されない
- これにより、テンプレート内の`{destination_path}`プレースホルダーが保持される

### 4.4 関連ファイル
主要な実装ファイル:
- `lib/cli/generators/two_params_prompt_generator_ddd.ts`: CLIオプション解析
- `lib/factory/output_file_path_resolver_totality.ts`: パス解決ロジック
- `lib/processor/variable_processor.ts`: 変数処理
- `lib/prompt/prompt_generation_service_impl.ts`: プロンプト生成
- `lib/builder/variables_builder.ts`: 変数ビルダー

## 5. 仕様変更の検討事項

現在の実装では、`destination_path`の決定に以下の要素が関与しています：

1. **複数のオプション名**: `-o`, `--destination`, `--output` の3つ
2. **working_dirとの結合**: 相対パスの場合の基準ディレクトリ
3. **条件付き変数生成**: 未指定時の挙動

仕様変更を行う場合は、これらの要素それぞれについて、どのように変更するかを明確にする必要があります。

``````

### 仕様の変更部分

変更後の仕様へ改める。

現在の仕様：
````
### 2.2 パスの解決

解決ロジック:
1. 絶対パスの場合: そのまま使用
2. 相対パスの場合: `Deno.cwd()` + `working_dir` + `destinationFile` を結合
````

変更後の仕様:
````
### 2.2 パスの解決

解決ロジック:
1. 絶対パスの場合: そのまま使用
2. 相対パスの場合: `Deno.cwd()` + `working_dir` + `destinationFile` を結合
3. 相対パスの場合かつ設定値のprefix指定がある場合: `Deno.cwd()` + `working_dir` + `設定値のprefix指定` + `destinationFile` を結合
4. 未指定の場合かつ設定値のprefix指定がある場合: `Deno.cwd()` + `working_dir` + `設定値のprefix指定` を結合
5. 未指定かつ設定値のprefix指定がない場合: 指定しない（`destination_path`変数自体が生成されない）
````

#### `設定値のprefix`の仕様

設定値へ、以下の階層を追加する仕様とする。
設定のrootから記載した仕様である。
値は文字列で取得するだけで、解析はしない。

`````yaml
options:
  destination:
    prefix: "string" # path指定の文字列指定
`````

使用例1:
`````yaml
options:
  destination:
    prefix: "dest/yyyy/mm/yyyymmdd-HH-something.md" # 日時のプレースホルダーでテンプレートへ記載
`````

使用例2:
`````yaml
options:
  destination:
    prefix: "tmp/research_result.md" # 指定ファイル
`````

使用例3:
`````yaml
options:
  destination:
    prefix: "tmp/<current_branch>/*.md" # 階層指定
`````


## 実施内容

### 1. 前提理解
1. 資料を読んで、ドメイン設計と Totality を理解する。
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する。

### 2. 作業開始
3. 現在の仕様を理解し、変更内容を理解する
4. 設定ファイルの値取得を処理へ加える
5. パス解決ロジックを変更する
6. テストに設定ファイルの設定例に基づいたチェックを加える
7. `docs/breakdown/interface/configuration.ja.md` へ新たな設定の説明を加える
8. `deno task ci:dirty` を実行。エラー → 「2. 作業開始」を最初から実施

#### 完了条件

1. パス解決が実装された
2. テストが実装された
3. 設定ファイルんの説明が追記された
4. [実装のAI複雑性制御](`docs/breakdown/domain_core/ai-complexity-control_compact.ja.md`) の原則に従い、最小限のコード量で最大の効果を得ること。
5. `deno task ci:dirty` が完全に通過した: エラー0件達成


# タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。


# 作業開始指示

仕様の理解を進め、実装方針に基づいて作業します。

プロジェクトの成功を祈ります。開始してください。



