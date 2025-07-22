/**
 * @fileoverview File Schema Repository - Infrastructure implementation for schema storage
 *
 * This implementation manages JSON schemas stored in the file system,
 * providing dynamic loading, validation, and caching capabilities.
 *
 * @module infrastructure/templates/file_schema_repository
 */

import { exists, walk } from "@std/fs";
import { join, relative } from "@std/path";
import type { DirectiveType as _DirectiveType, LayerType as _LayerType } from "../../types/mod.ts";
import { Schema, SchemaPath } from "../../domain/templates/schema_management_aggregate.ts";
import type {
  SchemaBatchResult,
  SchemaManifest,
  SchemaManifestEntry,
  SchemaQueryOptions,
  SchemaRepository,
} from "../../domain/templates/schema_repository.ts";
import {
  SchemaDependencyError,
  SchemaNotFoundError,
  SchemaValidationError,
} from "../../domain/templates/schema_repository.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * Schema repository configuration
 */
export interface FileSchemaRepositoryConfig {
  baseDirectory: string;
  schemaDirectory?: string;
  cacheEnabled?: boolean;
  cacheTTLMs?: number;
  validateOnLoad?: boolean;
  resolveReferences?: boolean;
}

/**
 * Schema cache entry
 */
export interface SchemaCacheEntry {
  schema: Schema;
  loadedAt: Date;
  size: number;
  dependencies?: string[];
}

/**
 * File-based schema repository implementation
 */
export class FileSchemaRepository implements SchemaRepository {
  private readonly logger: BreakdownLogger;
  private readonly cache: Map<string, SchemaCacheEntry>;
  private manifest?: SchemaManifest;
  private manifestLoadedAt?: Date;
  private readonly schemaDir: string;

  constructor(
    private readonly config: FileSchemaRepositoryConfig,
  ) {
    this.logger = new BreakdownLogger("file-schema-repository");
    this.cache = new Map();
    this.schemaDir = join(
      config.baseDirectory,
      config.schemaDirectory || "schema",
    );
  }

  async loadSchema(path: SchemaPath): Promise<Schema> {
    const pathString = path.getPath();

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(pathString);
      if (cached) {
        this.logger.debug("Schema loaded from cache", { path: pathString });
        return cached;
      }
    }

    // Load from file system
    const fullPath = join(this.schemaDir, pathString);

    try {
      const content = await Deno.readTextFile(fullPath);
      const schemaData = JSON.parse(content);
      const stat = await Deno.stat(fullPath);

      // Validate schema if configured
      if (this.config.validateOnLoad) {
        const validation = await this.validateSchema(schemaData);
        if (!validation.valid) {
          throw new SchemaValidationError(
            `Invalid schema: ${validation.errors?.join(", ")}`,
            path,
            validation.errors,
          );
        }
      }

      const schemaResult = Schema.create(path, schemaData, {
        createdAt: stat.birthtime || new Date(),
        updatedAt: stat.mtime || new Date(),
      });

      if (!schemaResult.ok) {
        throw new SchemaValidationError(
          `Failed to create schema: ${schemaResult.error}`,
          path,
        );
      }

      const schema = schemaResult.data;

      // Cache if enabled
      if (this.config.cacheEnabled) {
        const dependencies = this.config.resolveReferences
          ? schema.getContent().getReferences()
          : undefined;
        this.addToCache(pathString, schema, stat.size, dependencies);
      }

      this.logger.debug("Schema loaded from file", { path: pathString });
      return schema;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new SchemaNotFoundError(path);
      }
      if (error instanceof SyntaxError) {
        throw new SchemaValidationError(
          `Invalid JSON in schema: ${error.message}`,
          path,
        );
      }
      throw error;
    }
  }

  async loadSchemas(paths: SchemaPath[]): Promise<Map<string, Schema>> {
    const result = new Map<string, Schema>();
    const errors: string[] = [];

    // Load schemas in parallel
    const loadPromises = paths.map(async (path) => {
      try {
        const schema = await this.loadSchema(path);
        result.set(path.getPath(), schema);
      } catch (error) {
        errors.push(`${path.getPath()}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    await Promise.all(loadPromises);

    if (errors.length > 0) {
      this.logger.warn("Some schemas failed to load", { errors });
    }

    return result;
  }

  exists(path: SchemaPath): Promise<boolean> {
    const fullPath = join(this.schemaDir, path.getPath());
    return exists(fullPath);
  }

  async listAvailable(options?: SchemaQueryOptions): Promise<SchemaManifest> {
    // Return cached manifest if fresh
    if (this.manifest && this.isManifestFresh()) {
      return this.filterManifest(this.manifest, options);
    }

    // Build new manifest
    const manifest = await this.buildManifest(options);
    this.manifest = manifest;
    this.manifestLoadedAt = new Date();

    return this.filterManifest(manifest, options);
  }

  async save(schema: Schema): Promise<void> {
    const path = schema.getPath();
    const fullPath = join(this.schemaDir, path.getPath());

    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    await Deno.mkdir(dir, { recursive: true });

    // Validate schema content before saving
    const validation = await this.validateSchema(schema.getContent().getContent());
    if (!validation.valid) {
      throw new SchemaValidationError(
        `Cannot save invalid schema: ${validation.errors?.join(", ")}`,
        path,
        validation.errors,
      );
    }

    // Write schema content
    const content = schema.getContent().stringify(true);
    await Deno.writeTextFile(fullPath, content);

    // Invalidate cache
    this.invalidateCache(path.getPath());
    this.manifest = undefined; // Force manifest rebuild

    this.logger.info("Schema saved", { path: path.getPath() });
  }

  async saveAll(schemas: Schema[]): Promise<SchemaBatchResult> {
    const successful: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    // Save schemas in parallel
    const savePromises = schemas.map(async (schema) => {
      try {
        await this.save(schema);
        successful.push(schema.getPath().getPath());
      } catch (error) {
        failed.push({
          path: schema.getPath().getPath(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(savePromises);

    return { successful, failed };
  }

  async delete(path: SchemaPath): Promise<void> {
    const fullPath = join(this.schemaDir, path.getPath());

    try {
      await Deno.remove(fullPath);
      this.invalidateCache(path.getPath());
      this.manifest = undefined;

      this.logger.info("Schema deleted", { path: path.getPath() });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new SchemaNotFoundError(path);
      }
      throw error;
    }
  }

  async deleteAll(paths: SchemaPath[]): Promise<SchemaBatchResult> {
    const successful: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    // Delete schemas in parallel
    const deletePromises = paths.map(async (path) => {
      try {
        await this.delete(path);
        successful.push(path.getPath());
      } catch (error) {
        failed.push({
          path: path.getPath(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(deletePromises);

    return { successful, failed };
  }

  async getDependencies(path: SchemaPath): Promise<SchemaPath[]> {
    try {
      const schema = await this.loadSchema(path);
      const references = schema.getContent().getReferences();

      // Convert references to SchemaPath objects
      // This is simplified - real implementation would need proper path resolution
      const dependencies: SchemaPath[] = [];
      for (const _ref of references) {
        // Parse reference and create SchemaPath
        // Implementation depends on reference format
      }

      return dependencies;
    } catch (error) {
      throw new SchemaDependencyError(
        `Failed to resolve dependencies: ${error instanceof Error ? error.message : String(error)}`,
        path,
      );
    }
  }

  validateSchema(content: unknown): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    // Basic JSON schema validation
    if (typeof content !== "object" || content === null) {
      errors.push("Schema must be an object");
      return Promise.resolve({ valid: false, errors });
    }

    const schema = content as Record<string, unknown>;

    // Check required properties
    if (!schema.$schema && !schema.type && !schema.properties) {
      errors.push("Schema must have at least one of: $schema, type, or properties");
    }

    // Validate $schema format if present
    if (schema.$schema && typeof schema.$schema !== "string") {
      errors.push("$schema must be a string");
    }

    // Validate type if present
    if (schema.type && typeof schema.type !== "string") {
      errors.push("type must be a string");
    }

    // More comprehensive validation would use a proper JSON schema validator
    // like ajv or similar

    return Promise.resolve({
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    });
  }

  refresh(): Promise<void> {
    this.cache.clear();
    this.manifest = undefined;
    this.manifestLoadedAt = undefined;
    this.logger.info("Schema repository cache cleared", "cache");
    return Promise.resolve();
  }

  private async buildManifest(options?: SchemaQueryOptions): Promise<SchemaManifest> {
    const schemas: SchemaManifestEntry[] = [];

    try {
      if (await exists(this.schemaDir)) {
        for await (
          const entry of walk(this.schemaDir, {
            exts: [".json"],
            includeDirs: false,
          })
        ) {
          const relativePath = relative(this.schemaDir, entry.path);
          const parts = relativePath.split("/");

          if (parts.length >= 3) {
            const manifestEntry: SchemaManifestEntry = {
              path: relativePath,
              directive: parts[0],
              layer: parts[1],
              filename: parts[parts.length - 1],
            };

            // Include metadata if requested
            if (options?.includeMetadata) {
              try {
                const content = await Deno.readTextFile(entry.path);
                const schemaData = JSON.parse(content);
                manifestEntry.title = schemaData.title;
                manifestEntry.description = schemaData.description;
                manifestEntry.version = schemaData.version;
              } catch {
                // Ignore metadata loading errors
              }
            }

            // Include dependencies if requested
            if (options?.includeDependencies) {
              try {
                const content = await Deno.readTextFile(entry.path);
                const schemaData = JSON.parse(content);
                // Extract dependencies from schema
                manifestEntry.dependencies = this.extractDependencies(schemaData);
              } catch {
                // Ignore dependency extraction errors
              }
            }

            schemas.push(manifestEntry);
          }
        }
      }
    } catch (error) {
      this.logger.error("Failed to build schema manifest", { error });
    }

    return {
      schemas,
      generatedAt: new Date(),
      totalCount: schemas.length,
    };
  }

  private extractDependencies(schemaData: unknown): string[] {
    const dependencies: string[] = [];

    function extractRefs(obj: unknown): void {
      if (typeof obj !== "object" || obj === null) return;

      for (const [key, value] of Object.entries(obj)) {
        if (key === "$ref" && typeof value === "string") {
          dependencies.push(value);
        } else if (typeof value === "object") {
          extractRefs(value);
        }
      }
    }

    extractRefs(schemaData);
    return [...new Set(dependencies)];
  }

  private filterManifest(
    manifest: SchemaManifest,
    options?: SchemaQueryOptions,
  ): SchemaManifest {
    if (!options) return manifest;

    let filtered = manifest.schemas;

    if (options.directive) {
      const directiveValue = options.directive.value;
      filtered = filtered.filter((s) => s.directive === directiveValue);
    }

    if (options.layer) {
      const layerValue = options.layer.value;
      filtered = filtered.filter((s) => s.layer === layerValue);
    }

    return {
      schemas: filtered,
      generatedAt: manifest.generatedAt,
      totalCount: filtered.length,
    };
  }

  private getFromCache(path: string): Schema | null {
    const entry = this.cache.get(path);
    if (!entry) return null;

    // Check TTL
    if (this.config.cacheTTLMs) {
      const age = Date.now() - entry.loadedAt.getTime();
      if (age > this.config.cacheTTLMs) {
        this.cache.delete(path);
        return null;
      }
    }

    return entry.schema;
  }

  private addToCache(
    path: string,
    schema: Schema,
    size: number,
    dependencies?: string[],
  ): void {
    this.cache.set(path, {
      schema,
      loadedAt: new Date(),
      size,
      dependencies,
    });

    // Implement simple LRU if cache gets too large
    if (this.cache.size > 100) {
      const oldest = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.loadedAt.getTime() - b.loadedAt.getTime())[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }
  }

  private invalidateCache(path: string): void {
    this.cache.delete(path);
  }

  private isManifestFresh(): boolean {
    if (!this.manifestLoadedAt) return false;
    const age = Date.now() - this.manifestLoadedAt.getTime();
    return age < 60000; // 1 minute
  }
}
