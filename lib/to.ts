import type { ConversionResult } from "../mod.ts";

// Markdown to JSON conversion
export async function toJSON(
  type: "project" | "issue" | "task",
  input: string,
  output: string
): Promise<ConversionResult> {
  // 無効なコマンドの検証を先に行う
  if (type !== "project" && type !== "issue" && type !== "task") {
    throw new Error("Invalid subcommand");
  }

  try {
    let data;
    switch (type) {
      case "project":
        data = await convertProjectToJSON(input, output);
        break;
      case "issue":
        data = await convertIssueToJSON(input, output);
        break;
      case "task":
        data = await convertTaskToJSON(input, output);
        break;
    }
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function convertProjectToJSON(input: string, _outputDir: string): Promise<any> {
  // 実際の実装では、Markdownをパースしてオブジェクトを返す
  const titleMatch = input.match(/^# (.+)$/m);
  return {
    title: titleMatch?.[1] || "",
    // その他のデータ
  };
}

async function convertIssueToJSON(input: string, _outputDir: string): Promise<any> {
  const titleMatch = input.match(/^# (.+)$/m);
  return {
    title: titleMatch?.[1] || "",
    // その他のデータ
  };
}

async function convertTaskToJSON(input: string, _outputDir: string): Promise<any> {
  const titleMatch = input.match(/^# (.+)$/m);
  return {
    title: titleMatch?.[1] || "",
    // その他のデータ
  };
} 