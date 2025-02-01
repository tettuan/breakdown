export interface MarkdownNode {
  type: string;
  content: string;
  children?: MarkdownNode[];
  level?: number;
}

export interface Schema {
  $schema: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface ConversionOptions {
  validate?: boolean;
  format?: "compact" | "pretty";
} 