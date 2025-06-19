# CLI 

## breakdown.ts
mainエントリーである。
自身に具体のコードを書かず、JSRパッケージ化された Breakdownシリーズや、移譲されたFactoryクラスを用いる。

良い例: BreakdownParamsへ移譲し、その結果を利用している。
```
  const paramsParser = new ParamsParser(undefined, customConfig);

  if (result.type === "two") {
    await handleTwoParams(result.params, config, result.options);
  } else if (result.type === "one") {
    await handleOneParams(result.params, config, result.options);
  } else if (result.type === "zero") {
    await handleZeroParams(args, config, result.options);
  } else if (result.type === "error") {
    throw new Error(`Parameter parsing error: ${result.error?.message || "Unknown error"}`);
  } else {
    throw new Error(`Unknown result type: ${result.type}`);
  }

```

悪い例: argsを直接使っている。`--version`など BreakdownParams へ移譲した名称を独自実装しており、DRYになっていない。
```
  } else if (args.includes("--version") || args.includes("-v")) {

  if (args.includes("--help") || args.includes("-h") || args.includes("help")) {
```

# JSRパッケージ化された Breakdownシリーズ
BreakdownConfig
BreakdownParams
BreakdownPrompt
BreakdownLogger

