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
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { DEFAULT_PROMPT_BASE_DIR } from "../../config/constants.ts";
import type { DirectiveType as _DirectiveType, LayerType as _LayerType } from "../../types/mod.ts";
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

/**
 * Repository configuration
 */
export interface FileTemplateRepositoryConfig {
  baseDirectory: string;
  cacheEnabled?: boolean;
  cacheTTLMs?: number;
  watchForChanges?: boolean;
  breakdownConfig?: BreakdownConfig;
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
  private readonly cache: Map<string, CacheEntry>;
  private manifest?: TemplateManifest;
  private manifestLoadedAt?: Date;

  constructor(
    private readonly config: FileTemplateRepositoryConfig,
  ) {
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
        // Template loaded from cache
        return cached;
      }
    }

    // Load from file system
    const promptsSubDir = await this.getPromptsSubDirectory();
    const fullPath = join(this.config.baseDirectory, promptsSubDir, pathString);

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

      // Template loaded from file
      return template;
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new TemplateNotFoundError(path);
      }
      throw error;
    }
  }

  async exists(path: TemplatePath): Promise<boolean> {
    const promptsSubDir = await this.getPromptsSubDirectory();
    const fullPath = join(this.config.baseDirectory, promptsSubDir, path.getPath());
    return await exists(fullPath);
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
    const promptsSubDir = await this.getPromptsSubDirectory();
    const fullPath = join(this.config.baseDirectory, promptsSubDir, path.getPath());

    // Ensure directory exists
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    await Deno.mkdir(dir, { recursive: true });

    // Write template content
    await Deno.writeTextFile(fullPath, template.getContent().getContent());

    // Invalidate cache
    this.invalidateCache(path.getPath());
    this.manifest = undefined; // Force manifest rebuild

    // Template saved successfully
  }

  async delete(path: TemplatePath): Promise<void> {
    const promptsSubDir = await this.getPromptsSubDirectory();
    const fullPath = join(this.config.baseDirectory, promptsSubDir, path.getPath());

    try {
      await Deno.remove(fullPath);
      this.invalidateCache(path.getPath());
      this.manifest = undefined;

      // Template deleted successfully
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        throw new TemplateNotFoundError(path);
      }
      throw error;
    }
  }

  refresh(): Promise<void> {
    this.cache.clear();
    this.manifest = undefined;
    this.manifestLoadedAt = undefined;

    // Repository cache cleared
    return Promise.resolve();
  }

  private async buildManifest(): Promise<TemplateManifest> {
    const templates: TemplateManifestEntry[] = [];
    const promptsSubDir = await this.getPromptsSubDirectory();
    const promptsDir = join(this.config.baseDirectory, promptsSubDir);

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
    } catch (_error) {
      // Failed to build manifest - error silently ignored
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
      const directiveValue = options.directive.value;
      filtered = filtered.filter((t) => t.directive === directiveValue);
    }

    if (options.layer) {
      const layerValue = options.layer.value;
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
    // File watching not yet implemented
  }

  /**
   * BreakdownConfigからプロンプトディレクトリ名を取得
   *
   * @returns プロンプトディレクトリ名（相対パス）
   */
  private async getPromptsSubDirectory(): Promise<string> {
    // BreakdownConfigから設定値を取得
    if (this.config.breakdownConfig) {
      try {
        // getConfig()メソッドを使用して設定データを取得
        const configData = await this.config.breakdownConfig.getConfig();
        const promptConfig = configData.app_prompt;

        if (promptConfig?.base_dir) {
          // app_prompt.base_dirを直接使用（相対パスとして扱う）
          const baseDir = promptConfig.base_dir.trim();

          // 絶対パスの場合は警告してフォールバックを使用
          if (baseDir.startsWith("/") || baseDir.match(/^[A-Za-z]:[\\\/]/)) {
            console.warn(
              `app_prompt.base_dir should be relative path, got: ${baseDir}. Using fallback.`,
            );
            return DEFAULT_PROMPT_BASE_DIR;
          }

          return baseDir;
        }
      } catch (error) {
        // 設定取得エラーの場合のみフォールバック
        console.warn(`Failed to get prompt directory from config: ${error}`);
      }
    }

    // 設定がない場合や取得に失敗した場合のフォールバック
    return DEFAULT_PROMPT_BASE_DIR;
  }
}
