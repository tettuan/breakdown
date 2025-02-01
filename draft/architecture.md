graph TD
  A[Markdownファイル] --> B[AIによる処理]
  B --> C[JSONルールセット]
  B --> D[変換後JSON]
  D --> E[保存先 (ファイル)]
  E --> F[Deno + TypeScript実行]
  
  C --> G[タイトル必須]
  C --> H[説明オプション]
  C --> I[使用技術リスト]
  
  F --> J[コマンド実行]
  J --> K[結果出力 (JSON)]
  
  A --> L[要望記述 (タイトル, 説明, 使用技術)]
  L --> M[Markdownフォーマット]
  
  classDef important fill:#f9f,stroke:#333,stroke-width:4px;
  class A,B,C,D,E,F important;
