import { MarkdownParser } from "../core/parser.ts";
import { validateJson } from "../core/validator.ts";
import { transform } from "../core/transformer.ts";
import type { ConversionOptions } from "../types/schema.ts";

export async function convertMarkdownToJson(
  input: string,
  options: ConversionOptions = {}
): Promise<unknown> {
  const parser = new MarkdownParser();
  const ast = parser.parse(input);
  const transformed = transform(ast);
  
  if (options.validate) {
    await validateJson(transformed);
  }
  
  return transformed;
} 