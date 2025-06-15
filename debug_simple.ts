import { ParamsParser } from "@tettuan/breakdownparams";

const parser = new ParamsParser();
const result = parser.parse([
  "find",
  "bugs",
  "--from",
  "test_input.txt",
  "--destination",
  "output.md",
]);
console.log("ParamsParser result:", JSON.stringify(result, null, 2));
