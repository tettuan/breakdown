# 定義
```bash
./.deno/bin/breakdown
```
は、「インストール」されたCLIのコマンド名である。

# インストール
```bash
deno install -f --root ./.deno --global --allow-all --no-prompt cli/breakdown.ts
```

# 使用するJSRパッケージ
アプリケーションは以下のJSRパッケージを使用します：

1. [@tettuan/breakdownconfig](https://jsr.io/@tettuan/breakdownconfig) - 設定管理
2. [@tettuan/breakdownlogger](https://jsr.io/@tettuan/breakdownlogger) - ロギング機能
3. [@tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) - パラメータ処理
4. [@tettuan/breakdownprompt](https://jsr.io/@tettuan/breakdownprompt) - プロンプト処理

```ts
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.6";
import { Logger } from "jsr:@tettuan/breakdownlogger@^1.0.0";
import { ParamsParser } from "jsr:@tettuan/breakdownparams@^0.1.8";
import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.3";

// Initialize components
const config = new BreakdownConfig();
const logger = new Logger();
const parser = new ParamsParser();
const promptManager = new PromptManager();

// Main processing flow
async function main() {
  // Load configuration
  await config.loadConfig();
  
  // Parse command line arguments
  const params = parser.parse(Deno.args);
  
  // Process based on parameters
  switch (params.type) {
    case 'init':
      // Initialize workspace
      break;
    case 'to':
      // Handle conversion
      const prompt = await promptManager.loadPrompt({
        demonstrativeType: params.demonstrativeType,
        layerType: params.layerType,
        fromLayerType: params.fromLayerType,
        variables: params.variables
      });
      break;
    // ... other cases
  }
}
```

# 基本実装

以下のコマンドを実行したときに、 "Result Output" が出力される。
```bash
./.deno/bin/breakdown to
```

## 引数
次のファイルの内容に従って構築する。
`@/docs/breakdown/options.ja.md`

## Result Output
```
to
```

## Deno Test
```bash
deno test -A
```

# 入力値
以下のコマンドを実行したときに、 "Result Output2" が出力される。
```bash
./.deno/bin/breakdown to project
./.deno/bin/breakdown to issue
./.deno/bin/breakdown summary issue
./.deno/bin/breakdown defect issue
./.deno/bin/breakdown to task
```

## Result Output2
```
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
入力値がないというエラーメッセージ
```

# 設定の読み込み
次のファイルの内容に従って構築する。
アプリケーション設定： `/docs/breakdown/app_config.ja.md`

# プロンプトの読み込み
引数に応じてプロンプトを読み替える。詳しくは、次のファイルの内容に従って構築する。
`@/docs/breakdown/app_prompt.ja.md`

# 入力ファイル指定の入力
以下のコマンドを実行したときに、 "Result Output3" が出力される。
```bash
./.deno/bin/breakdown to task -f ./.agent/breakdown/issues/issue_summary.md
```

## Result Output3
特定したプロンプトの内容を表示

# 出力ファイル指定の入力
以下のコマンドを実行したときに、 "Result Output4" が出力される。
```bash
./.deno/bin/breakdown to issue -f ./.agent/breakdown/issue/project_summary.md -o ./.agent/breakdown/issues/issue_summary.md
```

## Result Output4
特定したプロンプトの内容を表示

