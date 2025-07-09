/**
 * @fileoverview Prompt Content Value Object
 *
 * Represents prompt template content with validation and access methods.
 */

/**
 * Prompt content result
 */
export interface PromptContentResult {
  ok: boolean;
  data?: PromptContent;
  error?: string;
}

/**
 * Prompt Content Value Object
 */
export class PromptContent {
  private constructor(
    private readonly content: string,
    private readonly variables?: string[],
  ) {}

  /**
   * Create a new prompt content
   */
  static create(content: string): PromptContentResult {
    try {
      if (!content || content.trim() === "") {
        return {
          ok: false,
          error: "Prompt content cannot be empty",
        };
      }

      // Extract variables from content (simple regex for {{variable}} pattern)
      const variableMatches = content.match(/\{\{([^}]+)\}\}/g);
      const variables = variableMatches
        ? variableMatches.map((match) => match.slice(2, -2).trim())
        : [];

      return {
        ok: true,
        data: new PromptContent(content, variables),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get raw content
   */
  getValue(): string {
    return this.content;
  }

  /**
   * Get extracted variables
   */
  getVariables(): string[] {
    return this.variables || [];
  }

  /**
   * Check if content has variables
   */
  hasVariables(): boolean {
    return Boolean(this.variables && this.variables.length > 0);
  }

  /**
   * Get content length
   */
  getLength(): number {
    return this.content.length;
  }

  /**
   * Check if content is empty
   */
  isEmpty(): boolean {
    return this.content.trim() === "";
  }

  /**
   * Get content hash (simple hash for comparison)
   */
  getHash(): string {
    let hash = 0;
    for (let i = 0; i < this.content.length; i++) {
      const char = this.content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Replace variables in content
   */
  replaceVariables(replacements: Record<string, string>): string {
    let result = this.content;

    for (const [key, value] of Object.entries(replacements)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(pattern, value);
    }

    return result;
  }

  /**
   * Get preview of content (first 100 characters)
   */
  getPreview(): string {
    if (this.content.length <= 100) {
      return this.content;
    }
    return this.content.substring(0, 100) + "...";
  }

  /**
   * Count lines in content
   */
  getLineCount(): number {
    return this.content.split("\n").length;
  }

  /**
   * Check if this content equals another
   */
  equals(other: PromptContent): boolean {
    return this.content === other.content;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.content;
  }
}
