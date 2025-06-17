## Usage
breakdownconfig を 第三者アプリケーションが import すると、設定ファイルの読み込み処理を行うことができる。

### アプリケーション利用者のUssage
- デフォルト設定はアプリ設定を用いる
- ユーザーごとに設定を切り替える場合は、ユーザー設定を設ける
- ユーザー設定は、アプリ設定の `working_dir` 項目で設定されたディレクトリに存在する

### アプリケーションからの読み込み
`import * as breakdownconfig from "@tettuan/breakdownconfig";


### アプリケーションでの利用例

```typescript
let config = new BreakdownConfig();
```

