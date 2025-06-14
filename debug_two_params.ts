import { BreakdownParams } from "./lib/deps.ts";

const parser = new BreakdownParams();
const result = parser.parse(["to", "issue", "--from", "test.md"]);

console.log("Result type:", result.type);
console.log("Result:", result);

if (result.type === "error") {
  console.log("Error message:", result.error?.message);
}
