# breakdownconfig モジュールの読み込み
https://github.com/tettuan/breakdownconfig

```ts
import { BreakdownConfig } from "https://deno.land/x/breakdownconfig/mod.ts";
```

# usage

```ts
// Create a new configuration instance
const config = new BreakdownConfig();

// Load both application and user configurations
await config.loadConfig();

// Get the merged configuration
const settings = config.getConfig();
```
