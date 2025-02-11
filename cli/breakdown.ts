#!/usr/bin/env -S deno run -A

type DemonstrativeType = "to" | "summary" | "defect";
type LayerType = "project" | "issue" | "task";

function isValidDemonstrativeType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect"].includes(type);
}

function isValidLayerType(type: string): type is LayerType {
  return ["project", "issue", "task"].includes(type);
}

if (import.meta.main) {
  const args = Deno.args;
  if (args.length === 1) {
    const type = args[0];
    if (isValidDemonstrativeType(type)) {
      console.log(type);
    } else {
      console.error("Invalid first argument. Must be one of: to, summary, defect");
      Deno.exit(1);
    }
  } else if (args.length === 2) {
    const [demonstrative, layer] = args;
    if (!isValidDemonstrativeType(demonstrative)) {
      console.error("Invalid first argument. Must be one of: to, summary, defect");
      Deno.exit(1);
    }
    if (!isValidLayerType(layer)) {
      console.error("Invalid second argument. Must be one of: project, issue, task");
      Deno.exit(1);
    }
    console.log(`${demonstrative}-${layer}`);
  }
} 