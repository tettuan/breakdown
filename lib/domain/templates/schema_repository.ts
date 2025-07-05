/**
 * @fileoverview Schema Repository Interface - Domain repository for schema management
 *
 * This interface defines the contract for accessing and managing JSON schemas
 * in a domain-driven way.
 *
 * @module domain/templates/schema_repository
 */

import type { Schema, SchemaPath } from "./schema_management_aggregate.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";

/**
 * Schema manifest entry
 */
export interface SchemaManifestEntry {
  path: string;
  directive: string;
  layer: string;
  filename: string;
  title?: string;
  description?: string;
  version?: string;
  dependencies?: string[];
}

/**
 * Schema manifest
 */
export interface SchemaManifest {
  schemas: SchemaManifestEntry[];
  generatedAt: Date;
  totalCount: number;
}

/**
 * Schema query options
 */
export interface SchemaQueryOptions {
  directive?: DirectiveType;
  layer?: LayerType;
  includeMetadata?: boolean;
  includeDependencies?: boolean;
}

/**
 * Schema batch operation result
 */
export interface SchemaBatchResult {
  successful: string[];
  failed: Array<{
    path: string;
    error: string;
  }>;
}

/**
 * Schema repository interface
 */
export interface SchemaRepository {
  /**
   * Load a specific schema by path
   */
  loadSchema(path: SchemaPath): Promise<Schema>;

  /**
   * Load multiple schemas
   */
  loadSchemas(paths: SchemaPath[]): Promise<Map<string, Schema>>;

  /**
   * Check if a schema exists
   */
  exists(path: SchemaPath): Promise<boolean>;

  /**
   * List all available schemas
   */
  listAvailable(options?: SchemaQueryOptions): Promise<SchemaManifest>;

  /**
   * Save or update a schema
   */
  save(schema: Schema): Promise<void>;

  /**
   * Save multiple schemas
   */
  saveAll(schemas: Schema[]): Promise<SchemaBatchResult>;

  /**
   * Delete a schema
   */
  delete(path: SchemaPath): Promise<void>;

  /**
   * Delete multiple schemas
   */
  deleteAll(paths: SchemaPath[]): Promise<SchemaBatchResult>;

  /**
   * Get schema dependencies
   */
  getDependencies(path: SchemaPath): Promise<SchemaPath[]>;

  /**
   * Validate schema content
   */
  validateSchema(content: unknown): Promise<{ valid: boolean; errors?: string[] }>;

  /**
   * Refresh schema cache/index
   */
  refresh(): Promise<void>;
}

/**
 * Schema not found error
 */
export class SchemaNotFoundError extends Error {
  constructor(
    public readonly path: SchemaPath,
    message?: string,
  ) {
    super(message || `Schema not found: ${path.getPath()}`);
    this.name = "SchemaNotFoundError";
  }
}

/**
 * Schema validation error
 */
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly path?: SchemaPath,
    public readonly validationErrors?: string[],
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

/**
 * Schema dependency error
 */
export class SchemaDependencyError extends Error {
  constructor(
    message: string,
    public readonly path: SchemaPath,
    public readonly missingDependencies?: string[],
  ) {
    super(message);
    this.name = "SchemaDependencyError";
  }
}
