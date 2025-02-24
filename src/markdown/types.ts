export type NodeType = 'heading' | 'paragraph' | 'list' | 'listItem' | 'codeBlock';

export interface MarkdownNode {
  type: NodeType;
  content: string;
  metadata?: Record<string, unknown>;
  title?: string;
  children?: MarkdownNode[];
  level?: number;  // ヘッダーレベル用
} 