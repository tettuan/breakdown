import { BreakdownParams } from "./lib/deps.ts";

const parser = new BreakdownParams();

// Test current supported commands
const validCommands = [
  ["init"],
  ["to", "project"],
  ["summary", "issue"],
  ["defect", "task"],
];

// Test unsupported/problematic commands
const problematicCommands = [
  ["find", "bugs"],
  ["find", "bugs", "test.js"],
  ["invalid"],
  ["to"],
  ["find", "bugs", "--from", "test.js"],
];

console.log("=== VALID COMMANDS ===");
for (const cmd of validCommands) {
  const result = parser.parse(cmd);
  console.log(`${cmd.join(" ")} -> Type: ${result.type}`);
  if (result.type === "error") {
    console.log(`  Error: ${result.error?.message} (${result.error?.code})`);
  }
}

console.log("\n=== PROBLEMATIC COMMANDS ===");
for (const cmd of problematicCommands) {
  const result = parser.parse(cmd);
  console.log(`${cmd.join(" ")} -> Type: ${result.type}`);
  if (result.type === "error") {
    console.log(`  Error: ${result.error?.message} (${result.error?.code})`);
  }
}
