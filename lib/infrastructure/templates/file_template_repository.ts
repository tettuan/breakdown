/**
 * @fileoverview File Template Repository - Infrastructure implementation for template storage
 *
 * This implementation manages templates stored in the file system,
 * providing dynamic loading and caching capabilities.
 *
 * @module infrastructure/templates/file_template_repository
 */

import { exists, walk } from "@std/fs";
import { join, relative } from "@std/path";
import type { DirectiveType, LayerType } from "../../types/mod.ts";
import {
  PromptTemplate,
  TemplatePath,
} from "../../domain/templates/prompt_generation_aggregate.ts";
import type {
  TemplateManifest,
  TemplateManifestEntry,
  TemplateQueryOptions,
  TemplateRepository,
} from "../../domain/templates/template_repository.ts";
import { TemplateNotFoundError } from "../../domain/templates/template_repository.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * Repository configuration
 */
export interface FileTemplateRepositoryConfig {
  baseDirectory: string;
  cacheEnabled?: boolean;
  cacheTTLMs?: number;
  watchForChanges?: boolean;
}

/**
 * Template cache entry
 */
interface CacheEntry {
  template: PromptTemplate;
  loadedAt: Date;
  size: number;
}

/**
 * File-based template repository implementation
 */
export class FileTemplateRepository implements TemplateRepository {
  private readonly logger: BreakdownLogger;
  private readonly cache: Map<string, CacheEntry>;
  private manifest?: TemplateManifest;
  private manifestLoadedAt?: Date;

  constructor(
    private readonly config: FileTemplateRepositoryConfig,
  ) {
    this.logger = new BreakdownLogger("file-template-repository");
    this.cache = new Map();

    if (config.watchForChanges) {
      this.startWatching();
    }
  }

  async loadTemplate(path: TemplatePath): Promise<PromptTemplate> {
    const pathString = path.getPath();

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(pathString);
      if (cached) {
        this.logger.debug("Template loaded from cache", { path: pathString });
        return cached;
      }
    }

    // Load from file system
    const fullPath = join(this.config.baseDirectory, "prompts", pathString);

    try {
      const content = await Deno.readTextFile(fullPath);
      const stat = await Deno.stat(fullPath);

      const templateResult = PromptTemplate.create(path, content, {
        createdAt: stat.birthtime || new Date(),
        updatedAt: stat.mtime || new Date(),
      });

      if (!templateResult.ok) {
        throw new Error(`Failed to create template: ${templateResult.error}`);
      }

      const template = templateResult.data;

      // Cache if enabled
      if (this.config.cacheEnabled) {
        this.addToCache(pathString, template, stat.size);
      }

      this.logger.debug("Template loaded from file", { path: pathString });
      return template;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new TemplateNotFoundError(path);
      }
      throw error;
    }
  }

  async exists(path: TemplatePath): Promise<boolean> {
    const fullPath = join(this.config.baseDirectory, "prompts", path.getPath());
    return exists(fullPath);
  }

  async listAvailable(options?: TemplateQueryOptions): Promise<TemplateManifest> {
    // Return cached manifest if fresh
    if (this.manifest && this.isManifestFresh()) {
      return this.filterManifest(this.manifest, options);
    }

    // Build new manifest
    const manifest = await this.buildManifest();
    this.manifest = manifest;
    this.manifestLoadedAt = new Date();

    return this.filterManifest(manifest, options);
  }

  async save(template: PromptTemplate): Promise<void> {
    const path = template.getPath();
    const fullPath = join(this.config.baseDirectory, "prompts", path.getPath());

    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    await Deno.mkdir(dir, { recursive: true });

    // Write template content
    await Deno.writeTextFile(fullPath, template.getContent().getContent());

    // Invalidate cache
    this.invalidateCache(path.getPath());
    this.manifest = undefined; // Force manifest rebuild

    this.logger.info("Template saved", { path: path.getPath() });
  }

  async delete(path: TemplatePath): Promise<void> {
    const fullPath = join(this.config.baseDirectory, "prompts", path.getPath());

    try {
      await Deno.remove(fullPath);
      this.invalidateCache(path.getPath());
      this.manifest = undefined;

      this.logger.info("Template deleted", { path: path.getPath() });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new TemplateNotFoundError(path);
      }
      throw error;
    }
  }

  async refresh(): Promise<void> {
    this.cache.clear();
    this.manifest = undefined;
    this.manifestLoadedAt = undefined;

    this.logger.info("Repository cache cleared");
  }

  private async buildManifest(): Promise<TemplateManifest> {
    const templates: TemplateManifestEntry[] = [];
    const promptsDir = join(this.config.baseDirectory, "prompts");

    try {
      for await (
        const entry of walk(promptsDir, {
          exts: [".md"],
          includeDirs: false,
        })
      ) {
        const relativePath = relative(promptsDir, entry.path);
        const parts = relativePath.split("/");

        if (parts.length >= 3) {
          templates.push({
            path: relativePath,
            directive: parts[0],
            layer: parts[1],
            filename: parts[parts.length - 1],
          });
        }
      }
    } catch (error) {
      this.logger.error("Failed to build manifest", { error });
      // Return empty manifest on error
    }

    return {
      templates,
      generatedAt: new Date(),
      totalCount: templates.length,
    };
  }

  private filterManifest(
    manifest: TemplateManifest,
    options?: TemplateQueryOptions,
  ): TemplateManifest {
    if (!options) return manifest;

    let filtered = manifest.templates;

    if (options.directive) {
      const directiveValue = options.directive.getValue();
      filtered = filtered.filter((t) => t.directive === directiveValue);
    }

    if (options.layer) {
      const layerValue = options.layer.getValue();
      filtered = filtered.filter((t) => t.layer === layerValue);
    }

    return {
      templates: filtered,
      generatedAt: manifest.generatedAt,
      totalCount: filtered.length,
    };
  }

  private getFromCache(path: string): PromptTemplate | null {
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

    return entry.template;
  }

  private addToCache(path: string, template: PromptTemplate, size: number): void {
    this.cache.set(path, {
      template,
      loadedAt: new Date(),
      size,
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

  private startWatching(): void {
    // Placeholder for file watching implementation
    // This would use Deno.watchFs to monitor template directory
    this.logger.info("File watching not yet implemented");
  }
}
