import type { MarkdownNode } from "../types/schema.ts";

export function transform(ast: MarkdownNode[]): unknown {
  // TODO: 実際の変換ロジック実装
  return {
    version: "1.0",
    nodes: ast,
    metadata: {
      transformedAt: new Date().toISOString(),
    },
  };
} 