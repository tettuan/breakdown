/**
 * @fileoverview 1_behavior tests for FileTemplateRepository
 *
 * Tests behavioral aspects of file-based template repository operations:
 * - loadTemplate method behavior with various scenarios
 * - exists method accuracy and performance
 * - listAvailable filtering and query options
 * - save/delete operations and their side effects
 * - refresh method cache invalidation behavior
 *
 * @module infrastructure/templates/file_template_repository
 */

import { assert, assertEquals, assertRejects } from "jsr:@std/assert@0.224.0";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import { DirectiveType, LayerType } from "../../types/mod.ts";
// ConfigProfile import removed - using string directly
import {
  FileTemplateRepository,
  type FileTemplateRepositoryConfig,
} from "./file_template_repository.ts";
import {
  PromptTemplate,
  TemplateContent as _TemplateContent,
  TemplatePath,
} from "../../domain/templates/prompt_generation_aggregate.ts";
import {
  TemplateNotFoundError,
  type TemplateQueryOptions,
} from "../../domain/templates/template_repository.ts";
import { createTwoParamsResult } from "../../types/two_params_result_extension.ts";

// Helper function to create test DirectiveType and LayerType
function createTestDirectiveType(value: string): DirectiveType {
  const result = createTwoParamsResult(value, "project");
  const directiveResult = DirectiveType.create(result.directiveType);
  if (!directiveResult.ok) {
    throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
  }
  return directiveResult.data;
}

function createTestLayerType(directiveType: string, value: string): LayerType {
  const result = createTwoParamsResult(directiveType, value);
  // Use default profile string instead of ConfigProfile
  const layerResult = LayerType.create(result.layerType);
  if (!layerResult.ok) {
    throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
  }
  return layerResult.data;
}

/**
 * Test setup helper
 */
async function createTestRepository(config?: Partial<FileTemplateRepositoryConfig>) {
  const tempDir = await Deno.makeTempDir({ prefix: "breakdown_test_" });

  const defaultConfig: FileTemplateRepositoryConfig = {
    baseDirectory: tempDir,
    cacheEnabled: true,
    cacheTTLMs: 60000,
    watchForChanges: false,
    ...config,
  };

  const repository = new FileTemplateRepository(defaultConfig);

  return { repository, tempDir, cleanup: () => Deno.remove(tempDir, { recursive: true }) };
}

/**
 * Create test template file
 */
async function createTestTemplateFile(
  baseDir: string,
  directive: string,
  layer: string,
  filename: string,
  content: string,
) {
  const templateDir = join(baseDir, "prompts", directive, layer);
  await ensureDir(templateDir);
  const filePath = join(templateDir, filename);
  await Deno.writeTextFile(filePath, content);
  return filePath;
}

Deno.test("FileTemplateRepository loadTemplate - successful load with caching", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    // Create test template file
    const templateContent = "This is a test template with {variable1} and {variable2}";
    await createTestTemplateFile(_tempDir, "to", "project", "test.md", templateContent);

    // Create template path
    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "test.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    // Load template first time (from file)
    const template1 = await repository.loadTemplate(templatePath);
    assertEquals(template1.getContent().getContent(), templateContent);
    assertEquals(template1.getPath().getPath(), "to/project/test.md");

    // Load template second time (should use cache)
    const template2 = await repository.loadTemplate(templatePath);
    assertEquals(template2.getContent().getContent(), templateContent);

    // Templates should be equivalent (same content)
    assertEquals(template1.getContent().getContent(), template2.getContent().getContent());
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository loadTemplate - throws TemplateNotFoundError for non-existent file", async () => {
  const { repository, cleanup } = await createTestRepository();

  try {
    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "missing.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    await assertRejects(
      () => repository.loadTemplate(templatePath),
      TemplateNotFoundError,
      "Template not found: to/project/missing.md",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository exists - accurate existence check", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    // Create test template file
    await createTestTemplateFile(_tempDir, "summary", "task", "exists.md", "Content");

    const directive = createTestDirectiveType("summary");
    const layer = createTestLayerType("summary", "task");

    // Test existing file
    const existingPathResult = TemplatePath.create(directive, layer, "exists.md");
    assert(existingPathResult.ok);
    const existingPath = existingPathResult.data;

    const exists = await repository.exists(existingPath);
    assertEquals(exists, true);

    // Test non-existing file
    const nonExistingPathResult = TemplatePath.create(directive, layer, "missing.md");
    assert(nonExistingPathResult.ok);
    const nonExistingPath = nonExistingPathResult.data;

    const notExists = await repository.exists(nonExistingPath);
    assertEquals(notExists, false);
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository listAvailable - returns manifest with all templates", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    // Create multiple test template files
    await createTestTemplateFile(_tempDir, "to", "project", "convert.md", "Convert content");
    await createTestTemplateFile(_tempDir, "to", "task", "transform.md", "Transform content");
    await createTestTemplateFile(_tempDir, "summary", "project", "summarize.md", "Summary content");

    const manifest = await repository.listAvailable();

    assertEquals(manifest.totalCount, 3);
    assertEquals(manifest.templates.length, 3);

    // Check specific templates
    const convertTemplate = manifest.templates.find((t) => t.filename === "convert.md");
    assert(convertTemplate);
    assertEquals(convertTemplate.directive, "to");
    assertEquals(convertTemplate.layer, "project");
    assertEquals(convertTemplate.path, "to/project/convert.md");
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository listAvailable - filters by directive", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    // Create test templates with different directives
    await createTestTemplateFile(_tempDir, "to", "project", "convert.md", "Convert");
    await createTestTemplateFile(_tempDir, "summary", "project", "summarize.md", "Summary");

    const directive = createTestDirectiveType("to");
    const options: TemplateQueryOptions = { directive };

    const manifest = await repository.listAvailable(options);

    assertEquals(manifest.totalCount, 1);
    assertEquals(manifest.templates[0].directive, "to");
    assertEquals(manifest.templates[0].filename, "convert.md");
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository save - creates new template file", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    const directive = createTestDirectiveType("defect");
    const layer = createTestLayerType("defect", "issue");
    const pathResult = TemplatePath.create(directive, layer, "newtemplate.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    const content = "This is a new template with {newVariable}";
    const templateResult = PromptTemplate.create(templatePath, content);
    assert(templateResult.ok);
    const template = templateResult.data;

    await repository.save(template);

    // Verify file was created
    const exists = await repository.exists(templatePath);
    assertEquals(exists, true);

    // Verify content is correct
    const loadedTemplate = await repository.loadTemplate(templatePath);
    assertEquals(loadedTemplate.getContent().getContent(), content);
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository delete - removes existing template", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    // Create template file
    await createTestTemplateFile(_tempDir, "to", "project", "todelete.md", "Content to delete");

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "todelete.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    // Verify file exists before deletion
    const existsBefore = await repository.exists(templatePath);
    assertEquals(existsBefore, true);

    // Delete template
    await repository.delete(templatePath);

    // Verify file no longer exists
    const existsAfter = await repository.exists(templatePath);
    assertEquals(existsAfter, false);
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository delete - throws TemplateNotFoundError for non-existent template", async () => {
  const { repository, cleanup } = await createTestRepository();

  try {
    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "missing.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    await assertRejects(
      () => repository.delete(templatePath),
      TemplateNotFoundError,
      "Template not found: to/project/missing.md",
    );
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository refresh - clears cache and manifest", async () => {
  const { repository, tempDir: _tempDir, cleanup } = await createTestRepository();

  try {
    // Create template and load it (to populate cache)
    await createTestTemplateFile(_tempDir, "to", "project", "cached.md", "Cached content");

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "cached.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    // Load template to populate cache
    await repository.loadTemplate(templatePath);

    // Get manifest to populate manifest cache
    const manifest1 = await repository.listAvailable();
    assertEquals(manifest1.totalCount, 1);

    // Add another template file directly (bypassing repository)
    await createTestTemplateFile(_tempDir, "summary", "task", "new.md", "New content");

    // Before refresh, manifest should still show old count (cached)
    const manifest2 = await repository.listAvailable();
    assertEquals(manifest2.totalCount, 1); // Still cached

    // Refresh repository
    await repository.refresh();

    // After refresh, manifest should show updated count
    const manifest3 = await repository.listAvailable();
    assertEquals(manifest3.totalCount, 2); // Cache cleared, new scan performed
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository cache behavior - respects cache TTL", async () => {
  const { repository, tempDir, cleanup } = await createTestRepository({
    cacheEnabled: true,
    cacheTTLMs: 100, // Very short TTL for testing
  });

  try {
    // Create template file
    const content = "Original content";
    await createTestTemplateFile(tempDir, "to", "project", "ttl.md", content);

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "ttl.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    // Load template (should cache)
    const template1 = await repository.loadTemplate(templatePath);
    assertEquals(template1.getContent().getContent(), content);

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Update file content directly
    const newContent = "Updated content";
    const filePath = join(tempDir, "prompts", "to", "project", "ttl.md");
    await Deno.writeTextFile(filePath, newContent);

    // Load template again (cache should be expired, reload from file)
    const template2 = await repository.loadTemplate(templatePath);
    assertEquals(template2.getContent().getContent(), newContent);
  } finally {
    await cleanup();
  }
});

Deno.test("FileTemplateRepository cache disabled - always loads from file", async () => {
  const { repository, tempDir, cleanup } = await createTestRepository({
    cacheEnabled: false,
  });

  try {
    // Create template file
    const content = "Test content";
    const filePath = await createTestTemplateFile(tempDir, "to", "project", "nocache.md", content);

    const directive = createTestDirectiveType("to");
    const layer = createTestLayerType("to", "project");
    const pathResult = TemplatePath.create(directive, layer, "nocache.md");
    assert(pathResult.ok);
    const templatePath = pathResult.data;

    // Load template first time
    const template1 = await repository.loadTemplate(templatePath);
    assertEquals(template1.getContent().getContent(), content);

    // Update file content directly
    const newContent = "Updated content immediately";
    await Deno.writeTextFile(filePath, newContent);

    // Load template again (should get updated content since cache is disabled)
    const template2 = await repository.loadTemplate(templatePath);
    assertEquals(template2.getContent().getContent(), newContent);
  } finally {
    await cleanup();
  }
});
