// Markdownパーサーの基本実装
import type { MarkdownNode, NodeType } from './types.ts';

export class MarkdownParser {
  constructor() {}

  parse(markdown: string): MarkdownNode {
    const lines = markdown.split('\n');
    const nodes: MarkdownNode[] = [];
    let currentNode: MarkdownNode | undefined;

    for (const line of lines) {
      // ヘッダーの処理
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const content = line.replace(/^#+\s*/, '').trim();
        currentNode = {
          type: 'heading' as NodeType,
          content,
          level,
          title: content
        };
        if (currentNode) nodes.push(currentNode);
        continue;
      }

      // リストの処理
      if (line.trim().startsWith('- ')) {
        const content = line.replace(/^-\s*/, '').trim();
        currentNode = {
          type: 'listItem' as NodeType,
          content
        };
        if (currentNode) nodes.push(currentNode);
        continue;
      }

      // コードブロックの処理
      if (line.startsWith('```')) {
        const language = line.slice(3).trim();
        if (language) { // コードブロック開始
          currentNode = {
            type: 'codeBlock' as NodeType,
            content: '',
            children: [],
          };
          nodes.push(currentNode);
        }
        continue;
      }

      // 段落の処理
      if (line.trim() !== '') {
        currentNode = {
          type: 'paragraph' as NodeType,
          content: line.trim()
        };
        if (currentNode) nodes.push(currentNode);
      }
    }

    // ルートノードを返す
    return {
      type: 'heading',
      title: nodes.find(n => n.type === 'heading')?.content || 'Test Project',
      content: markdown,
      metadata: {},
      children: nodes
    };
  }
} 