# Option間の関係性

DemonstrativeType
  - "to", "summary", "defect", "init"
LayerType
  - "project", "issue", "task"


<!-- DemonstrativeTypeとLayerTypeのマトリクス表を作成 -->


| DemonstrativeType \ LayerType | project | issue | task |
|------------------------------|---------|--------|------|
| to                          | ✓       | ✓      | ✓    |
| summary                     | ✓       | ✓      | ✓    |
| defect                      | ✓       | ✓      | ✓    |
| init                        | x       | x      | x    |

各セルの意味：
- `to`: 上位レイヤーから下位レイヤーへの分解
- `summary`: 各レイヤーの要点整理
- `defect`: 各レイヤーのエラー・欠陥分析
- `init`: 初期化のみ

使用例：
- `breakdown to issue`: projectからissueへの分解
- `breakdown summary task`: taskの要約生成
- `breakdown defect issue`: issueのエラー分析
- `breakdown init project`: projectの初期化



## --from(-f) オプション
入力ファイル -> 出力

| DemonstrativeType \ Input LayerType | project | issue | task |
|------------------------------|---------|--------|------|
| to                          | -> issue | -> task | -> sub task |
| summary                     | -> project | -> issue | -> task |
| defect                      | -> project | -> issue | -> task |
| init                        | x       | x      | x    |
