# Option間の関係性

DemonstrativeType

- "to", "summary", "defect", "init" LayerType
- "project", "issue", "task"

<!-- DemonstrativeTypeとLayerTypeのマトリクス表を作成 -->

| DemonstrativeType \ LayerType | project | issue | task |
| ----------------------------- | ------- | ----- | ---- |
| to                            | ✓       | ✓     | ✓    |
| summary                       | ✓       | ✓     | ✓    |
| defect                        | ✓       | ✓     | ✓    |
| init                          | -       | -     | -    |

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

入力ファイル による差異

| DemonstrativeType | LayerType (出力) | FromLayerType(-i,-f) | 説明                     |
| ----------------- | ---------------- | -------------------- | ------------------------ |
| to                | issue            | project              | projectからissueへの分解 |
| to                | task             | issue                | issueからtaskへの分解    |
| to                | task             | task                 | taskからsub taskへの分解 |
| summary           | project          | project              | projectの要点整理        |
| summary           | issue            | issue                | issueの要点整理          |
| summary           | task             | task                 | issueの要点整理          |
| defect            | project          | project              | projectの問題分析        |
| defect            | issue            | issue                | issueの問題分析          |
| defect            | task             | task                 | taskの問題分析           |

使用例：

- `breakdown to issue -f project.md`: projectからissueへの分解
- `breakdown to task -f issue.md`: issueからtaskへの分解
- `breakdown summary project -f project.md`: projectの要点整理
- `breakdown defect issue -f issue-defect-claims.md`: issueのエラー分析

注意：

- LayerTypeは常に出力の層を指定
- `-i`オプションで入力の層を指定（FromLayerType）
- `-f`オプションで入力ファイルを指定