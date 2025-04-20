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
import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.8";

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
    case "init":
      // Initialize workspace
      break;
    case "to":
      // Handle conversion
      const prompt = await promptManager.loadPrompt({
        demonstrativeType: params.demonstrativeType,
        layerType: params.layerType,
        fromLayerType: params.fromLayerType,
        variables: params.variables,
      });
      break;
      // ... other cases
  }
}
```
