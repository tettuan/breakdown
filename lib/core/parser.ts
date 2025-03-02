import type { MarkdownNode } from "../types/schema.ts";

export class MarkdownParser {
  constructor() {}

  parse(markdown: string): MarkdownNode[] {
    const lines = markdown.split('\n');
    const nodes: MarkdownNode[] = [];
    let currentNode: MarkdownNode | null = null;

    for (const line of lines) {
      // ヘッダーの処理
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const content = line.replace(/^#+\s*/, '').trim();
        currentNode = {
          type: 'heading',
          content,
          level,
        };
        nodes.push(currentNode);
        continue;
      }

      // リストの処理
      if (line.trim().startsWith('- ')) {
        const content = line.replace(/^-\s*/, '').trim();
        currentNode = {
          type: 'listItem',
          content,
        };
        nodes.push(currentNode);
        continue;
      }

      // 段落の処理
      if (line.trim() !== '') {
        currentNode = {
          type: 'paragraph',
          content: line.trim(),
        };
        nodes.push(currentNode);
      }
    }

    return nodes;
  }
} 