#!/usr/bin/env -S deno run -A

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir, exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { getConfig } from "../breakdown/config/config.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

type DemonstrativeType = "to" | "summary" | "defect" | "init";
type LayerType = "project" | "issue" | "task";

function isValidDemonstrativeType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect", "init"].includes(type);
}

function isValidLayerType(type: string): type is LayerType {
  return ["project", "issue", "task"].includes(type);
}

function normalizePath(path: string): string {
  return path.startsWith("./") ? path : "./" + path;
}

function autoCompletePath(filePath: string, demonstrative: string): string {
  if (filePath.includes("/")) {
    return normalizePath(filePath);
  }
  const config = getConfig();
  const dirType = demonstrative === "to" ? "issue" : demonstrative;
  return normalizePath(join(config.working_dir, dirType + "s", filePath).replace(/\\/g, "/"));
}

async function initWorkspace(): Promise<void> {
  const config = getConfig();
  const dirExists = await exists(config.working_dir);
  
  if (dirExists) {
    console.log(`Working directory already exists: ${config.working_dir}`);
  } else {
    await ensureDir(config.working_dir);
    console.log(`Created working directory: ${config.working_dir}`);
  }
}

if (import.meta.main) {
  try {
    const flags = parse(Deno.args, {
      string: ["from", "f", "destination", "o"],
      alias: { 
        f: "from",
        o: "destination"
      },
    });

    const args = flags._;

    if (args.length === 1) {
      const type = args[0] as string;
      if (!isValidDemonstrativeType(type)) {
        console.error("Invalid first argument. Must be one of: to, summary, defect, init");
        Deno.exit(1);
      }
      
      if (type === "init") {
        await initWorkspace();
      } else {
        console.log(type);
      }
    } else if (args.length === 2) {
      const [demonstrative, layer] = args as [string, string];
      if (!isValidDemonstrativeType(demonstrative)) {
        console.error("Invalid first argument. Must be one of: to, summary, defect, init");
        Deno.exit(1);
      }
      if (!isValidLayerType(layer)) {
        console.error("Invalid second argument. Must be one of: project, issue, task");
        Deno.exit(1);
      }

      const fromFile = flags.from ? autoCompletePath(flags.from, layer) : null;
      const destFile = flags.destination ? autoCompletePath(flags.destination, demonstrative) : null;

      if (!fromFile) {
        console.error("Input file is required. Use --from or -f option.");
        Deno.exit(1);
      }

      if (destFile) {
        console.log(`${fromFile} --> ${destFile}`);
      } else {
        console.log(fromFile);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    Deno.exit(1);
  }
} 