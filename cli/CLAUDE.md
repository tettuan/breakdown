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

悪い例→修正例:
```
  // Use options from BreakdownParams result instead of checking args directly
  if (options.help) {
    showHelp();
  } else if (options.version) {
    showVersion();
  } else {
    showUsage();
  }

```

# JSRパッケージ化された Breakdownシリーズ
BreakdownConfig
BreakdownParams
BreakdownPrompt
BreakdownLogger

## 出力 / Output

出力は標準出力に書き出す。CLI実行者は、自ら `>` などでファイル書き出しを行う。
出力先情報は、変数として用いるためのものであり、Breakdown本体が write することは禁ずる。

悪い例:
```
// Write the result to output (file or stdout)
if (allParams.outputFilePath === "stdout" || allParams.outputFilePath === "-") {
  console.log(content);
} else {
  // Ensure output directory exists
  const outputDir = allParams.outputFilePath.substring(
    0,
    allParams.outputFilePath.lastIndexOf("/"),
  );
  if (outputDir) {
    await ensureDir(outputDir);
  }
  await Deno.writeTextFile(allParams.outputFilePath, content);
  console.log(`Output written to: ${allParams.outputFilePath}`);
}

```
