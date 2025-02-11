#!/usr/bin/env -S deno run -A

import { getConfig } from "../breakdown/config/config.ts";
import { ensureDir, exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

type DemonstrativeType = "to" | "summary" | "defect" | "init";
type LayerType = "project" | "issue" | "task";

function isValidDemonstrativeType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect", "init"].includes(type);
}

function isValidLayerType(type: string): type is LayerType {
  return ["project", "issue", "task"].includes(type);
}

function formatOutput(demonstrative: string, layer: string): string {
  const config = getConfig();
  return `${demonstrative}${config.output_format}${layer}`;
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
      string: ["from", "f"],
      alias: { f: "from" },
    });

    const fromFile = flags.from;
    const args = flags._;

    if (fromFile) {
      console.log(fromFile);
      Deno.exit(0);
    }

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
      if (demonstrative === "init") {
        await initWorkspace();
        Deno.exit(0);
      }
      if (!isValidLayerType(layer)) {
        console.error("Invalid second argument. Must be one of: project, issue, task");
        Deno.exit(1);
      }
      console.log(formatOutput(demonstrative, layer));
    }
  } catch (error) {
    console.error("Error:", error.message);
    Deno.exit(1);
  }
} 