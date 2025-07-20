#file:domain_boundaries_flow.ja.md に対し、 #file:refactor_investigations2.md を踏まえ、設計に修正を加えたい。
慎重に実施すべきで、主に以下の観点で行なって欲しい。

# Configuration Layer 

1. ParamsCustomConfig がBreakdownConfigの設定情報を受け取った上でBreakdownParamsが用いられ、その結果としてTwoParamsResult を返す（ここにDirectiveType/LayerTypeが判定後の状態で含まれる）
2. ProfilneName は、BreakdownConfig へ渡す「名前」でしかなく、それ以上の責務を持たない（DirectiveTypeなどを返すのは責任過剰であり廃止）

# CLI Layer
1. ProfileName は、BreakdownConfigに引き渡したら寿命を終える
2. BreakdownConfigは、ParamsCustomConfigとしてBreakdownParamsへ引き渡したら寿命を終える
3. BreakdownParamsの結果であるTwoParamsResultは寿命が長く、アプリケーション全体を通してプロンプト変数に渡されるまで用いられる

# 第4章：ドメイン間データフロー
第4章：ドメイン間データフローにおける「完全なデータフロー図」に違和感はないのだが、「段階的データ変換フロー」における「Config Profile」が「Parsing Layer」に向かわず、「Resolution Layer」に向いていることは問題である。「BreakdownConfig」は「BreakdownParamsResult」のためにも存在しており、用途が2分されるべきものである。
役割1. CLI argsからDirectiveType/LayerType解析、オプション解析の役割
役割2. workingdirやpromptパスの構成要素としてbase_dirを持つ

# 検討するべきこと
- 境界線の見直しをすべきか
- `BreakdownConfig`の名称を厳密化すべきか
  - JSR パッケージのことを指しているのか、独自定義のものを指しているのか曖昧
  -   BreakdownConfigから得られた結果を2役割りに分割するのであれば、異なる名称に分割するべきか



