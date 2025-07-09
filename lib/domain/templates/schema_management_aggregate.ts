/**
 * @fileoverview Schema Management Aggregate - Core domain model for schema management
 *
 * This aggregate manages JSON schemas dynamically, replacing static auto-generated files
 * with a flexible domain-driven approach.
 *
 * @module domain/templates/schema_management_aggregate
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";

/**
 * Schema path value object
 */
export class SchemaPath {
  private constructor(
    private readonly directive: DirectiveType,
    private readonly layer: LayerType,
    private readonly filename: string,
  ) {}

  static create(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): Result<SchemaPath, string> {
    if (!filename.endsWith(".json")) {
      return error(`Invalid schema filename: ${filename}. Must end with .json`);
    }
    return ok(new SchemaPath(directive, layer, filename));
  }

  static fromString(path: string): SchemaPath | null {
    const parts = path.split("/");
    if (parts.length < 3) return null;

    // This is a simplified implementation - would need proper type creation
    // in real implementation
    return null;
  }

  getPath(): string {
    return `${this.directive.getValue()}/${this.layer.getValue()}/${this.filename}`;
  }

  getDirective(): DirectiveType {
    return this.directive;
  }

  getLayer(): LayerType {
    return this.layer;
  }

  getFilename(): string {
    return this.filename;
  }

  equals(other: SchemaPath): boolean {
    return this.getPath() === other.getPath();
  }
}

/**
 * Schema content value object
 */
export class SchemaContent {
  private constructor(
    private readonly content: unknown,
    private readonly schemaVersion: string,
  ) {}

  static create(content: unknown, version = "draft-07"): Result<SchemaContent, string> {
    // Validate that content is a valid JSON schema structure
    if (!SchemaContent.isValidSchema(content)) {
      return error("Invalid schema content");
    }
    return ok(new SchemaContent(content, version));
  }

  private static isValidSchema(content: unknown): boolean {
    if (typeof content !== "object" || content === null) return false;
    const schema = content as Record<string, unknown>;

    // Basic validation - check for common schema properties
    return typeof schema.$schema === "string" ||
      typeof schema.type === "string" ||
      typeof schema.properties === "object";
  }

  getContent(): unknown {
    return this.content;
  }

  getSchemaVersion(): string {
    return this.schemaVersion;
  }

  stringify(pretty = true): string {
    return JSON.stringify(this.content, null, pretty ? 2 : 0);
  }

  /**
   * Extract referenced schemas from this schema
   */
  getReferences(): string[] {
    const refs: string[] = [];
    this.extractRefs(this.content, refs);
    return [...new Set(refs)];
  }

  private extractRefs(obj: unknown, refs: string[]): void {
    if (typeof obj !== "object" || obj === null) return;

    for (const [key, value] of Object.entries(obj)) {
      if (key === "$ref" && typeof value === "string") {
        refs.push(value);
      } else if (typeof value === "object") {
        this.extractRefs(value, refs);
      }
    }
  }
}

/**
 * Schema metadata
 */
export interface SchemaMetadata {
  title?: string;
  description?: string;
  version: string;
  author: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema entity
 */
export class Schema {
  private constructor(
    private readonly path: SchemaPath,
    private readonly content: SchemaContent,
    private readonly metadata: SchemaMetadata,
  ) {}

  static create(
    path: SchemaPath,
    content: unknown,
    metadata?: Partial<SchemaMetadata>,
  ): Result<Schema, string> {
    const schemaContentResult = SchemaContent.create(content);
    if (!schemaContentResult.ok) {
      return error(schemaContentResult.error);
    }

    const fullMetadata: SchemaMetadata = {
      version: metadata?.version || "1.0.0",
      author: metadata?.author || "system",
      createdAt: metadata?.createdAt || new Date(),
      updatedAt: metadata?.updatedAt || new Date(),
      ...metadata,
    };
    return ok(new Schema(path, schemaContentResult.data, fullMetadata));
  }

  getPath(): SchemaPath {
    return this.path;
  }

  getContent(): SchemaContent {
    return this.content;
  }

  getMetadata(): SchemaMetadata {
    return { ...this.metadata };
  }

  /**
   * Update schema content
   */
  updateContent(newContent: unknown): Result<Schema, string> {
    const updatedContentResult = SchemaContent.create(newContent);
    if (!updatedContentResult.ok) {
      return { ok: false, error: updatedContentResult.error };
    }

    return {
      ok: true,
      data: new Schema(
        this.path,
        updatedContentResult.data,
        {
          ...this.metadata,
          updatedAt: new Date(),
        },
      ),
    };
  }

  /**
   * Validate data against this schema
   */
  validate(_data: unknown): ValidationResult {
    // In a real implementation, this would use a JSON schema validator
    // For now, we'll return a simple result
    return {
      valid: true,
      errors: [],
    };
  }
}

/**
 * Schema registry - manages schema collection
 */
export class SchemaRegistry {
  private readonly schemas: Map<string, Schema>;
  private readonly dependencies: Map<string, Set<string>>;

  constructor() {
    this.schemas = new Map();
    this.dependencies = new Map();
  }

  /**
   * Register a schema
   */
  register(schema: Schema): void {
    const path = schema.getPath().getPath();
    this.schemas.set(path, schema);

    // Update dependencies
    const refs = schema.getContent().getReferences();
    for (const ref of refs) {
      if (!this.dependencies.has(ref)) {
        this.dependencies.set(ref, new Set());
      }
      this.dependencies.get(ref)!.add(path);
    }
  }

  /**
   * Get a schema by path
   */
  get(path: SchemaPath): Schema | undefined {
    return this.schemas.get(path.getPath());
  }

  /**
   * Remove a schema
   */
  remove(path: SchemaPath): boolean {
    const pathStr = path.getPath();
    const schema = this.schemas.get(pathStr);
    if (!schema) return false;

    // Remove from registry
    this.schemas.delete(pathStr);

    // Update dependencies
    const refs = schema.getContent().getReferences();
    for (const ref of refs) {
      const deps = this.dependencies.get(ref);
      if (deps) {
        deps.delete(pathStr);
        if (deps.size === 0) {
          this.dependencies.delete(ref);
        }
      }
    }

    return true;
  }

  /**
   * Find schemas that depend on the given schema
   */
  getDependents(path: SchemaPath): Schema[] {
    const pathStr = path.getPath();
    const deps = this.dependencies.get(pathStr);
    if (!deps) return [];

    return Array.from(deps)
      .map((p) => this.schemas.get(p))
      .filter((s): s is Schema => s !== undefined);
  }

  /**
   * List all schemas
   */
  list(filter?: { directive?: DirectiveType; layer?: LayerType }): Schema[] {
    let schemas = Array.from(this.schemas.values());

    if (filter?.directive) {
      schemas = schemas.filter(
        (s) => s.getPath().getDirective().getValue() === filter.directive!.getValue(),
      );
    }

    if (filter?.layer) {
      schemas = schemas.filter(
        (s) => s.getPath().getLayer().getValue() === filter.layer!.getValue(),
      );
    }

    return schemas;
  }

  /**
   * Clear all schemas
   */
  clear(): void {
    this.schemas.clear();
    this.dependencies.clear();
  }
}

/**
 * Schema management aggregate root
 */
export class SchemaManagementAggregate {
  private constructor(
    private readonly id: string,
    private readonly registry: SchemaRegistry,
    private state: SchemaManagementState,
  ) {}

  static create(id: string): Result<SchemaManagementAggregate, string> {
    if (!id || id.trim().length === 0) {
      return { ok: false, error: "Invalid aggregate ID: ID cannot be empty" };
    }

    return {
      ok: true,
      data: new SchemaManagementAggregate(
        id,
        new SchemaRegistry(),
        {
          initialized: true,
          lastSync: null,
          schemaCount: 0,
        },
      ),
    };
  }

  getId(): string {
    return this.id;
  }

  getRegistry(): SchemaRegistry {
    return this.registry;
  }

  getState(): SchemaManagementState {
    return { ...this.state };
  }

  /**
   * Import schemas from a source
   */
  importSchemas(schemas: Schema[]): ImportResult {
    const imported: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    for (const schema of schemas) {
      try {
        this.registry.register(schema);
        imported.push(schema.getPath().getPath());
      } catch (error) {
        failed.push({
          path: schema.getPath().getPath(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.state = {
      ...this.state,
      lastSync: new Date(),
      schemaCount: this.registry.list().length,
    };

    return { imported, failed };
  }

  /**
   * Validate schema dependencies
   */
  validateDependencies(): DependencyValidationResult {
    const missing: string[] = [];
    const circular: string[][] = [];

    // Check for missing dependencies
    for (const schema of this.registry.list()) {
      const refs = schema.getContent().getReferences();
      for (const ref of refs) {
        // Simple check - in real implementation would resolve $ref properly
        if (!this.registry.list().some((s) => s.getPath().getPath() === ref)) {
          missing.push(`${schema.getPath().getPath()} -> ${ref}`);
        }
      }
    }

    // TODO: Check for circular dependencies

    return {
      valid: missing.length === 0 && circular.length === 0,
      missing,
      circular,
    };
  }
}

/**
 * Schema management state
 */
interface SchemaManagementState {
  initialized: boolean;
  lastSync: Date | null;
  schemaCount: number;
}

/**
 * Import result
 */
export interface ImportResult {
  imported: string[];
  failed: Array<{ path: string; error: string }>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Dependency validation result
 */
export interface DependencyValidationResult {
  valid: boolean;
  missing: string[];
  circular: string[][];
}
