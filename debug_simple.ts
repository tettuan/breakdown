import { BreakdownParams } from "./lib/deps.ts";

const parser = new BreakdownParams();
const result1 = parser.parse(["to", "issue"]);
const result2 = parser.parse(["to"]);

console.log("Two args result:", result1.type);
console.log("One arg result:", result2.type);

if (result1.type === "error") {
  console.log("Two args error:", result1.error?.message);
}
if (result2.type === "error") {
  console.log("One arg error:", result2.error?.message);
}
