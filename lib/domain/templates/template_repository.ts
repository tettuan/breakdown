/**
 * @fileoverview Template Repository Interface - Domain repository for template management
 *
 * This interface defines the contract for accessing and managing prompt templates.
 * Implementations handle the actual storage and retrieval of templates.
 *
 * @module domain/templates/template_repository
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { PromptTemplate, TemplatePath } from "./prompt_generation_aggregate.ts";

/**
 * Template data type alias - represents a loaded template
 */
export type TemplateData = PromptTemplate;

/**
 * Selection result type alias - represents the result of template selection
 */
export type SelectionResult = TemplatePath;

/**
 * Template manifest entry
 */
export interface TemplateManifestEntry {
  path: string;
  directive: string;
  layer: string;
  filename: string;
  description?: string;
  version?: string;
}

/**
 * Template manifest
 */
export interface TemplateManifest {
  templates: TemplateManifestEntry[];
  generatedAt: Date;
  totalCount: number;
}

/**
 * Template query options
 */
export interface TemplateQueryOptions {
  directive?: DirectiveType;
  layer?: LayerType;
  includeMetadata?: boolean;
}

/**
 * Template repository interface
 */
export interface TemplateRepository {
  /**
   * Load a specific template by path
   */
  loadTemplate(path: TemplatePath): Promise<PromptTemplate>;

  /**
   * Check if a template exists
   */
  exists(path: TemplatePath): Promise<boolean>;

  /**
   * List all available templates
   */
  listAvailable(options?: TemplateQueryOptions): Promise<TemplateManifest>;

  /**
   * Save or update a template
   */
  save(template: PromptTemplate): Promise<void>;

  /**
   * Delete a template
   */
  delete(path: TemplatePath): Promise<void>;

  /**
   * Refresh template cache/index
   */
  refresh(): Promise<void>;
}

/**
 * Template not found error
 */
export class TemplateNotFoundError extends Error {
  constructor(
    public readonly path: TemplatePath,
    message?: string,
  ) {
    super(message || `Template not found: ${path.getPath()}`);
    this.name = "TemplateNotFoundError";
  }
}

/**
 * Template validation error
 */
export class TemplateValidationError extends Error {
  constructor(
    message: string,
    public readonly path?: TemplatePath,
    public readonly validationErrors?: string[],
  ) {
    super(message);
    this.name = "TemplateValidationError";
  }
}
