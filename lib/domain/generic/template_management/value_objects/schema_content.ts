/**
 * @fileoverview Schema Content Value Object
 * 
 * Represents JSON schema content with validation and access methods.
 */

/**
 * Schema content result
 */
export interface SchemaContentResult {
  ok: boolean;
  data?: SchemaContent;
  error?: string;
}

/**
 * Schema Content Value Object
 */
export class SchemaContent {
  private constructor(
    private readonly content: string,
    private readonly parsedSchema?: unknown,
  ) {}

  /**
   * Create a new schema content
   */
  static create(content: string): SchemaContentResult {
    try {
      if (!content || content.trim() === '') {
        return {
          ok: false,
          error: "Schema content cannot be empty",
        };
      }

      // Try to parse as JSON to validate
      let parsedSchema: unknown;
      try {
        parsedSchema = JSON.parse(content);
      } catch (parseError) {
        return {
          ok: false,
          error: `Invalid JSON schema: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
        };
      }

      return {
        ok: true,
        data: new SchemaContent(content, parsedSchema),
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
   * Get parsed schema object
   */
  getParsedSchema(): unknown {
    return this.parsedSchema;
  }

  /**
   * Check if schema is valid JSON
   */
  isValid(): boolean {
    return this.parsedSchema !== undefined;
  }

  /**
   * Get schema as formatted JSON
   */
  getFormattedJson(): string {
    if (!this.parsedSchema) {
      return this.content;
    }

    try {
      return JSON.stringify(this.parsedSchema, null, 2);
    } catch {
      return this.content;
    }
  }

  /**
   * Get schema as minified JSON
   */
  getMinifiedJson(): string {
    if (!this.parsedSchema) {
      return this.content;
    }

    try {
      return JSON.stringify(this.parsedSchema);
    } catch {
      return this.content;
    }
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
    return this.content.trim() === '';
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
   * Check if this content equals another
   */
  equals(other: SchemaContent): boolean {
    return this.content === other.content;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.content;
  }
}