/**
 * @fileoverview Template Schema Reader Service - Read and validate JSON schemas for templates
 *
 * This service provides functionality to read, validate, and manage JSON schemas
 * that are used by template generation processes.
 *
 * @module domain/templates/template_schema_reader
 */

import type { Schema, SchemaPath } from "./schema_management_aggregate.ts";
import type { SchemaRepository } from "./schema_repository.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";

/**
 * Schema reading options
 */
export interface SchemaReadOptions {
  includeMetadata?: boolean;
  validateContent?: boolean;
  resolveDependencies?: boolean;
}

/**
 * Schema read result
 */
export interface SchemaReadResult {
  schema: Schema;
  dependencies: Schema[];
  metadata: {
    readAt: Date;
    validationPassed: boolean;
    dependencyCount: number;
  };
}

/**
 * Schema batch read result
 */
export interface SchemaBatchReadResult {
  successful: SchemaReadResult[];
  failed: Array<{
    path: SchemaPath;
    error: string;
  }>;
}

/**
 * Template Schema Reader Service
 * 
 * Provides high-level schema reading functionality for template management.
 * Acts as a domain service that orchestrates schema loading, validation,
 * and dependency resolution.
 */
export class TemplateSchemaReader {
  constructor(private readonly schemaRepository: SchemaRepository) {}

  /**
   * Read a single schema with options
   */
  async readSchema(
    path: SchemaPath,
    options: SchemaReadOptions = {}
  ): Promise<SchemaReadResult> {
    const schema = await this.schemaRepository.loadSchema(path);
    
    let dependencies: Schema[] = [];
    if (options.resolveDependencies) {
      const depPaths = await this.schemaRepository.getDependencies(path);
      dependencies = await this.loadDependencies(depPaths);
    }

    let validationPassed = true;
    if (options.validateContent) {
      const validation = await this.schemaRepository.validateSchema(
        schema.getContent().getContent()
      );
      validationPassed = validation.valid;
    }

    return {
      schema,
      dependencies,
      metadata: {
        readAt: new Date(),
        validationPassed,
        dependencyCount: dependencies.length,
      },
    };
  }

  /**
   * Read multiple schemas
   */
  async readSchemas(
    paths: SchemaPath[],
    options: SchemaReadOptions = {}
  ): Promise<SchemaBatchReadResult> {
    const successful: SchemaReadResult[] = [];
    const failed: Array<{ path: SchemaPath; error: string }> = [];

    for (const path of paths) {
      try {
        const result = await this.readSchema(path, options);
        successful.push(result);
      } catch (error) {
        failed.push({
          path,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { successful, failed };
  }

  /**
   * Read schemas by directive and layer
   */
  async readSchemasByType(
    directive: DirectiveType,
    layer: LayerType,
    options: SchemaReadOptions = {}
  ): Promise<SchemaBatchReadResult> {
    const manifest = await this.schemaRepository.listAvailable({
      directive,
      layer,
    });

    const paths = manifest.schemas.map((entry) => {
      // Create SchemaPath from manifest entry
      // This is a simplified implementation - in reality would need proper path construction
      const _filename = entry.filename;
      return { getPath: () => entry.path } as SchemaPath;
    });

    return this.readSchemas(paths, options);
  }

  /**
   * Check if schema exists and is readable
   */
  async isSchemaReadable(path: SchemaPath): Promise<boolean> {
    try {
      const exists = await this.schemaRepository.exists(path);
      if (!exists) return false;

      // Try to load and validate
      const schema = await this.schemaRepository.loadSchema(path);
      const validation = await this.schemaRepository.validateSchema(
        schema.getContent().getContent()
      );

      return validation.valid;
    } catch {
      return false;
    }
  }

  /**
   * Get schema dependencies recursively
   */
  async getSchemaTree(path: SchemaPath): Promise<SchemaReadResult> {
    const visited = new Set<string>();
    const result = await this.readSchemaRecursive(path, visited);
    return result;
  }

  private async readSchemaRecursive(
    path: SchemaPath,
    visited: Set<string>
  ): Promise<SchemaReadResult> {
    const pathStr = path.getPath();
    if (visited.has(pathStr)) {
      throw new Error(`Circular dependency detected: ${pathStr}`);
    }

    visited.add(pathStr);

    const schema = await this.schemaRepository.loadSchema(path);
    const depPaths = await this.schemaRepository.getDependencies(path);
    
    const dependencies: Schema[] = [];
    for (const depPath of depPaths) {
      const depResult = await this.readSchemaRecursive(depPath, visited);
      dependencies.push(depResult.schema);
      dependencies.push(...depResult.dependencies);
    }

    return {
      schema,
      dependencies,
      metadata: {
        readAt: new Date(),
        validationPassed: true,
        dependencyCount: dependencies.length,
      },
    };
  }

  private async loadDependencies(paths: SchemaPath[]): Promise<Schema[]> {
    const dependencies: Schema[] = [];
    
    for (const path of paths) {
      try {
        const schema = await this.schemaRepository.loadSchema(path);
        dependencies.push(schema);
      } catch (error) {
        // Log error but continue - dependency might be optional
        // Note: Using console.warn for dependency loading failures as per domain service guidelines
        console.warn(`Failed to load dependency ${path.getPath()}:`, error);
      }
    }

    return dependencies;
  }
}

/**
 * Schema reader factory function
 */
export function createTemplateSchemaReader(
  schemaRepository: SchemaRepository
): TemplateSchemaReader {
  return new TemplateSchemaReader(schemaRepository);
}