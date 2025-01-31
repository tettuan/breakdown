export interface MarkdownNode {
  type: string;
  content: string;
  children?: MarkdownNode[];
  level?: number;
} 