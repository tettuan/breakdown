import { Schema } from "../types/schema.ts";

export async function validateJson(data: unknown): Promise<boolean> {
  try {
    const schema = await loadSchema();
    // TODO: 実際のバリデーション実装
    return true;
  } catch (error) {
    throw new Error(`Validation failed: ${error.message}`);
  }
}

async function loadSchema(): Promise<Schema> {
  try {
    const schemaText = await Deno.readTextFile(new URL('../../rules/schema.json', import.meta.url));
    return JSON.parse(schemaText);
  } catch (error) {
    throw new Error(`Failed to load schema: ${error.message}`);
  }
} 