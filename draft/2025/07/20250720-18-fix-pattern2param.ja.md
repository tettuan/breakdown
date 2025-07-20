# プロジェクト: BreakdownのDirectiveType/LayerType判定とConfigProfileNameの関係性見直し

実装方針:
現在の`lib/`配下の実装をドメイン駆動設計と全域性（Totality）による大幅リファクタリングした。

ところが、examples/ 配下に移動して
`deno run --allow-all ../cli/breakdown.ts find bugs --config=findbugs --from=tmp/production-bug-reports/test_bug.js -o=tmp/production-bug-reports/bug_analysis.md` を実行すると、`find` が認識されない。設定ファイルは examples/.agent 配下に存在する。

この問題が、設計と実装にあることを突き止め、リファクタ計画を作る。
「現在の判明状況」を踏まえ、調査を推し進める。

`Totality` について、必ず `docs/breakdown/generic_domain/system/overview/totality.ja.md` を参照すること。
ドメイン情報は、 `docs/breakdown/domain_core/domain_boundaries_flow.ja.md` および `docs/breakdown/domain_core/*` を必ず読むこと。

テスト方針:
テストに関しては `docs/tests/testing.ja.md` を読むこと。

仕様:
他の`docs/breakdown/*`資料は、適宜実装ファイルを変更するタイミングで読むこと。

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。
各paneの存在を確認し、無ければ起動し、あればClaudeの起動を確認すること。全員を調べ、Claudeが起動していない部下に対し,Claude起動する。

## スコープの認識

1. examples/ 配下の実行は、 examples/ へCWD移動してから実施する。
2. examples/ 配下以外の実行は、 プロジェクトルートへ移動してから実施する。
3. スコープを原因特定に限り、大幅なリファクタはスコープ外とする。

## 仮説

前提: DemonstrativeTypeはDirectiveTypeの旧名であり問題ではない

1. 「現在の判明状況」に基づくと、単なるProfileNameである `ConfigProfileName` に過剰な責務がある
2. 設定のpatternでParamsが解析されるべきで、Params解析結果が DirectiveType/LayerTypeである
3. 上記1と2の結果、 `BreakdownParams`を活用できておらず、`ProfileName`を用いて取得した`BreakdownConfig`の設定値を、`BreakdownParams`へ渡すべき処理が欠けている
4. 設計 `domain_boundaries_flow.ja.md`に、上記3のフロー記載がなく、実装漏れが生じている

## 実施内容

### 1. 前提理解
1. 資料を読んで、ドメイン設計と Totality を理解する。
2. 理解した結果や調査した結果を `tmp/<branch_name>/` 配下に作成する。

### 2. 作業開始
3. 「スコープの認識」を行い、「現在の判明状況」を踏まえ、examples/11番を実行する
4. `BreakdownConfig`へ、`ConfigProfileName` を用いて設定値を取得しているか確認する
5. ProfileNameを用いた`BreakdownConfig`が、`find`を許容数rpattern設定値を持っているか確認する
6. `BreakdownParams`へ4の設定値が渡されているか調査する
7. `BreakdownParams`が`find`を許容した結果を返しているか確認する（DirectiveType(DemonstrativeType)にfindがセットされて返ってくる）

#### 完了条件

1. 特定した問題点を報告した

報告先: `tmp/refactor_investigations2.md`

# タスクの進め方

- Git:
  - 現在のGitブランチで作業する
- サイクル: 仕様把握 → 調査 → 計画・設計 → 実行 → 記録・検証 → 学習 → 仕様把握へ戻る
- 作業分担: 作業内容をワーカープールマネージャーへ依頼し、ワーカーへの指示を行わせる。チームの常時フル稼働を目指す。

## 進捗更新

- 進捗させるべきタスクは `tmp/<branch_name>/tasks.md` に書き出し、完了マークをつけたりしながら進めてください。
- すべてが完了したら、`tmp/<branch_name>/completed.md` に完了したレポートを記録してください。

# 現在の判明状況

`````
# リファクタリング調査結果

## 問題の概要
examples/11番で `find bugs` コマンドが認識されない問題の調査結果

## 実行コマンド
```bash
cd examples
deno run --allow-all ../cli/breakdown.ts find bugs --config=findbugs --from=tmp/production-bug-reports/test_bug.js -o=tmp/production-bug-reports/bug_analysis.md
```

## エラー内容
```
⚠️ Prompt generation issue: {"kind":"VariablesBuilderError","errors":["Failed to create DirectiveType: [object Object]"],"phase":"unexpected"}
```

## 根本原因

### 1. ConfigProfileNameクラスのメソッド不足
- **問題箇所**: `lib/config/config_profile_name.ts`
- **不足メソッド**: 
  - `getDirectiveTypes()` 
  - `getLayerTypes()`
- **影響**: DirectiveTypeとLayerTypeの検証時に、設定ファイルのパターンが無視される

### 2. フォールバック処理による固定値
- **DirectiveType.ts** (137-139行目): ConfigProfileNameにメソッドがない場合、固定値 `["to", "summary", "defect"]` を返す
- **結果**: 設定ファイルに `find` が含まれていても認識されない

## 設定ファイルの状況
両方の設定ファイルには正しく `find` が含まれている：
1. `/Users/tettuan/github/breakdown/config/default-app.yml`
2. `/Users/tettuan/github/breakdown/examples/.agent/breakdown/config/default-app.yml`

## 影響範囲
- `lib/domain/core/value_objects/directive_type.ts`
- `lib/domain/core/value_objects/layer_type.ts`
- 他のDirectiveType/LayerTypeを使用するすべての箇所

## 推奨される修正方法
1. `ConfigProfileName`クラスに`getDirectiveTypes()`と`getLayerTypes()`メソッドを実装
2. これらのメソッドで設定ファイルから正しくパターンを読み込む
3. DirectiveTypeとLayerTypeのフォールバック処理を改善

## 現在の状況
- プロジェクトルートの`.agent/breakdown/config/default-app.yml`に`find`と`bugs`が追加済み
- しかし、ConfigProfileNameクラスのメソッド不足により、設定が反映されない
- エラーメッセージ: "Invalid demonstrative type. Must be one of: to, summary, defect"
- これは固定値のフォールバックが使用されていることを示す

## DDD観点からの分析
- **境界コンテキストの違反**: ConfigProfileNameが設定管理ドメインの責務を果たしていない
- **全域性（Totality）の違反**: メソッドが存在しない場合の処理が部分関数的

## 調査実施者
- 総司令官（スケジューラー）
- Manager1/Manager2（ワーカープール管理）
- 各ワーカー（詳細調査実施）

## 最終確認事項（追記）
1. **プロンプトファイルの配置場所**
   - `./examples/.agent/breakdown/prompts/find/bugs/base.md` ✓
   - `./lib/breakdown/prompts/find/bugs/base.md` ✓
   - `./.agent/breakdown/prompts/find/bugs/base.md` ✓
   - 複数箇所に存在するが、システムがどれを参照するかは設定依存

2. **DirectiveTypeの実装問題**
   - パターン文字列（例: "^(to|summary|defect|find)$"）からリスト抽出する実装が欠落
   - ConfigProfileName.getDirectiveTypes()メソッドが存在しないため、パターンが活用されない

3. **完了条件達成**
   - 特定した問題点を`tmp/refactor_investigations.md`に報告 ✓

## 新たな発見（worker5報告）
- 拡張プロファイル`breakdown`では`["to","summary","defect","init","find"]`をサポート
- しかし、`breakdown`プロファイルの設定ファイルが存在しない
- プロファイル切り替えによる解決の可能性があるが、設定ファイルの準備が必要
`````


# 作業開始指示

まずチームを立ち上げます。
その後、初期タスク（仕様理解、実装調査）を早々にワーカープールマネージャーへ渡します。

続いて、仕様の理解を進め、実装方針に基づいてワーカープールの稼働を最大化します。
その後は、チーム全体のパフォーマンスが重要です。
常にワーカープールマネージャーと、その部下であるゴルーチンをフル稼働させてください。

今なにをすべきか（タスク分割や、状況整理、要件定義、実装、テスト）について、ワーカープールマネージャーが把握していることが重要です。ワーカープールマネージャーから、今やる詳細タスクへ分割し、部下ゴルーチンへ割り当てさせてください。

プロジェクトの成功を祈ります。開始してください。



