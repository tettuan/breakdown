#!/usr/bin/env -S deno run -A

type DemonstrativeType = "to" | "summary" | "defect";

function isValidType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect"].includes(type);
}

if (import.meta.main) {
  const args = Deno.args;
  if (args.length > 0) {
    const type = args[0];
    if (isValidType(type)) {
      console.log(type);
    } else {
      console.error("Invalid argument. Must be one of: to, summary, defect");
      Deno.exit(1);
    }
  }
} 