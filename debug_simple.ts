import { EnhancedParamsParser } from "./lib/cli/parser/enhanced_params_parser.ts";

const parser = new EnhancedParamsParser();
const result = parser.parse([
  "find",
  "bugs",
  "--from",
  "test_input.txt",
  "--destination",
  "output.md",
]);
console.log("EnhancedParamsParser result:", JSON.stringify(result, null, 2));
