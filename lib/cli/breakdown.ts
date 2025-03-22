#!/usr/bin/env -S deno run -A

import { exists, ensureDir } from "../../deps.ts";

type DemonstrativeType = "to" | "summary" | "defect" | "init";
type LayerType = "project" | "issue" | "task";

function isValidDemonstrativeType(type: string): type is DemonstrativeType {
  return ["to", "summary", "defect", "init"].includes(type);
}

function isValidLayerType(type: string): type is LayerType {
  return ["project", "issue", "task"].includes(type);
}

async function initWorkspace(): Promise<void> {
  try {
    const dirExists = await exists(".agent/breakdown");
    if (dirExists) {
      console.log(`Working directory already exists: .agent/breakdown`);
    } else {
      await ensureDir(".agent/breakdown");
      console.log(`Created working directory: .agent/breakdown`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to initialize workspace: ${error.message}`);
    } else {
      console.error(`Failed to initialize workspace: ${String(error)}`);
    }
    Deno.exit(1);
  }
}

export async function runBreakdown(args: string[]): Promise<void> {
  // This function will be replaced with @tettuan/breakdownparams
  throw new Error("Not implemented: Use @tettuan/breakdownparams instead");
}

// メイン処理
if (import.meta.main) {
  runBreakdown(Deno.args);
}

const process = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "cli/breakdown.ts", "to"],
  stdout: "piped",
}); 