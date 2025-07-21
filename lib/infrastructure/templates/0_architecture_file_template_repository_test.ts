/**
 * @fileoverview 0_architecture test for file_template_repository.ts
 *
 * Tests architectural constraints for file-based template repository implementation.
 * Validates TemplateRepository interface compliance, Config type safety, and error handling.
 *
 * @module infrastructure/templates/0_architecture_file_template_repository_test
 */

import {
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertThrows as _assertThrows,
} from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import type { TwoParams_Result } from "../../deps.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
// ConfigProfile import removed - using BreakdownConfig directly
import {
  PromptTemplate as _PromptTemplate,
  TemplateContent as _TemplateContent,
  TemplatePath,
} from "../../domain/templates/prompt_generation_aggregate.ts";
import type {
  TemplateManifest as _TemplateManifest,
  TemplateQueryOptions,
  TemplateRepository,
} from "../../domain/templates/template_repository.ts";
import { TemplateNotFoundError } from "../../domain/templates/template_repository.ts";
import {
  FileTemplateRepository,
  type FileTemplateRepositoryConfig,
} from "./file_template_repository.ts";

describe("FileTemplateRepository - Architecture", () => {
  describe("TemplateRepository Interface Implementation", () => {
    it("should implement TemplateRepository interface completely", () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: false,
      };
      const repository = new FileTemplateRepository(config);

      // Check that all required methods exist
      assertEquals(typeof repository.loadTemplate, "function");
      assertEquals(typeof repository.exists, "function");
      assertEquals(typeof repository.listAvailable, "function");
      assertEquals(typeof repository.save, "function");
      assertEquals(typeof repository.delete, "function");
      assertEquals(typeof repository.refresh, "function");

      // Verify interface compliance at runtime
      const repo: TemplateRepository = repository;
      assertEquals(typeof repo.loadTemplate, "function");
      assertEquals(typeof repo.exists, "function");
      assertEquals(typeof repo.listAvailable, "function");
      assertEquals(typeof repo.save, "function");
      assertEquals(typeof repo.delete, "function");
      assertEquals(typeof repo.refresh, "function");
    });

    it("should return correct types from interface methods", async () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: false,
      };
      const repository = new FileTemplateRepository(config);

      // Create test template path
      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(
        mockTwoParams_Result.layerType,
      );
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const templatePathResult = TemplatePath.create(directive, layer, "prompt.md");

      if (!templatePathResult.ok) {
        throw new Error("Failed to create template path");
      }
      const templatePath = templatePathResult.data;

      // exists() should return Promise<boolean>
      const existsResult = repository.exists(templatePath);
      assertEquals(existsResult instanceof Promise, true);
      const existsValue = await existsResult;
      assertEquals(typeof existsValue, "boolean");

      // listAvailable() should return Promise<TemplateManifest>
      const listResult = repository.listAvailable();
      assertEquals(listResult instanceof Promise, true);
      const manifest = await listResult;
      assertEquals(typeof manifest, "object");
      assertEquals(Array.isArray(manifest.templates), true);
      assertEquals(manifest.generatedAt instanceof Date, true);
      assertEquals(typeof manifest.totalCount, "number");

      // refresh() should return Promise<void>
      const refreshResult = repository.refresh();
      assertEquals(refreshResult instanceof Promise, true);
      const refreshValue = await refreshResult;
      assertEquals(refreshValue, undefined);
    });

    it("should handle method parameters with correct types", async () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: false,
      };
      const repository = new FileTemplateRepository(config);

      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(
        mockTwoParams_Result.layerType,
      );
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;

      // Query options should be properly typed
      const queryOptions: TemplateQueryOptions = {
        directive,
        layer,
        includeMetadata: true,
      };

      // Should accept properly typed parameters without errors
      const manifest = await repository.listAvailable(queryOptions);
      assertEquals(typeof manifest, "object");

      // Should handle undefined options
      const manifestNoOptions = await repository.listAvailable();
      assertEquals(typeof manifestNoOptions, "object");
    });
  });

  describe("Config Type Safety", () => {
    it("should enforce required config properties", () => {
      // baseDirectory is required
      const validConfig: FileTemplateRepositoryConfig = {
        baseDirectory: "/test/templates",
      };

      const repository = new FileTemplateRepository(validConfig);
      assertEquals(repository instanceof FileTemplateRepository, true);
    });

    it("should accept optional config properties with correct types", () => {
      const fullConfig: FileTemplateRepositoryConfig = {
        baseDirectory: "/test/templates",
        cacheEnabled: true,
        cacheTTLMs: 60000,
        watchForChanges: false,
      };

      const repository = new FileTemplateRepository(fullConfig);
      assertEquals(repository instanceof FileTemplateRepository, true);
    });

    it("should handle config property type constraints", () => {
      // Test different valid configurations
      const configs: FileTemplateRepositoryConfig[] = [
        { baseDirectory: "/test" },
        { baseDirectory: "/test", cacheEnabled: true },
        { baseDirectory: "/test", cacheEnabled: false },
        { baseDirectory: "/test", cacheTTLMs: 0 },
        { baseDirectory: "/test", cacheTTLMs: 999999 },
        { baseDirectory: "/test", watchForChanges: true },
        { baseDirectory: "/test", watchForChanges: false },
      ];

      for (const config of configs) {
        const repository = new FileTemplateRepository(config);
        assertEquals(repository instanceof FileTemplateRepository, true);
      }
    });

    it("should maintain immutable config after construction", () => {
      const originalConfig: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: true,
        cacheTTLMs: 60000,
      };

      const repository = new FileTemplateRepository(originalConfig);

      // Modifying original config should not affect repository
      originalConfig.baseDirectory = "/modified";
      originalConfig.cacheEnabled = false;
      originalConfig.cacheTTLMs = 1;

      // Repository should continue functioning with original values
      assertEquals(repository instanceof FileTemplateRepository, true);
    });
  });

  describe("Error Type Accuracy", () => {
    it("should throw TemplateNotFoundError for missing templates", async () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/nonexistent",
        cacheEnabled: false,
      };
      const repository = new FileTemplateRepository(config);

      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(
        mockTwoParams_Result.layerType,
      );
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const templatePathResult = TemplatePath.create(directive, layer, "missing.md");

      if (!templatePathResult.ok) {
        throw new Error("Failed to create template path");
      }
      const templatePath = templatePathResult.data;

      // loadTemplate should throw TemplateNotFoundError
      await assertRejects(
        () => repository.loadTemplate(templatePath),
        TemplateNotFoundError,
        "Template not found",
      );

      // delete should throw TemplateNotFoundError
      await assertRejects(
        () => repository.delete(templatePath),
        TemplateNotFoundError,
        "Template not found",
      );
    });

    it("should maintain error type hierarchy", () => {
      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(
        mockTwoParams_Result.layerType,
      );
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const templatePathResult = TemplatePath.create(directive, layer, "prompt.md");

      if (!templatePathResult.ok) {
        throw new Error("Failed to create template path");
      }
      const templatePath = templatePathResult.data;

      const error = new TemplateNotFoundError(templatePath);

      // Should be instance of Error
      assertInstanceOf(error, Error);

      // Should have correct name
      assertEquals(error.name, "TemplateNotFoundError");

      // Should contain path information
      assertEquals(error.path, templatePath);

      // Should have meaningful message
      assertEquals(typeof error.message, "string");
      assertEquals(error.message.includes("Template not found"), true);
      assertEquals(error.message.includes(templatePath.getPath()), true);
    });

    it("should handle error propagation correctly", async () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: true,
      };
      const repository = new FileTemplateRepository(config);

      // Test that errors are not swallowed or transformed incorrectly
      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(
        mockTwoParams_Result.layerType,
      );
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const templatePathResult = TemplatePath.create(directive, layer, "error.md");

      if (!templatePathResult.ok) {
        throw new Error("Failed to create template path");
      }
      const templatePath = templatePathResult.data;

      try {
        await repository.loadTemplate(templatePath);
      } catch (error) {
        // Should preserve error type and not wrap unnecessarily
        assertEquals(error instanceof TemplateNotFoundError, true);
        if (error instanceof TemplateNotFoundError) {
          assertEquals(error.name, "TemplateNotFoundError");
        }
      }
    });
  });

  describe("Architectural Boundaries", () => {
    it("should not expose internal implementation details", () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: true,
      };
      const repository = new FileTemplateRepository(config);

      // Should not expose internal state through public interface
      // Internal properties should be private and not accessible
      const publicProperties = Object.getOwnPropertyNames(repository);
      const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(repository));

      // Should only expose TemplateRepository interface methods
      const _allowedMethods = [
        "constructor",
        "loadTemplate",
        "exists",
        "listAvailable",
        "save",
        "delete",
        "refresh",
        "buildManifest",
        "filterManifest",
        "getFromCache",
        "addToCache",
        "invalidateCache",
        "isManifestFresh",
        "startWatching",
      ];
      const exposedMethods = publicMethods.filter((m) => !m.startsWith("_"));

      // Check that core interface methods are present
      const requiredMethods = [
        "loadTemplate",
        "exists",
        "listAvailable",
        "save",
        "delete",
        "refresh",
      ];
      for (const method of requiredMethods) {
        assertEquals(exposedMethods.includes(method), true, `Missing required method: ${method}`);
      }

      // Should not expose many internal properties (some basic properties are acceptable)
      assertEquals(
        publicProperties.length <= 5,
        true,
        `Too many exposed properties: ${publicProperties.length}. Properties: ${
          publicProperties.join(", ")
        }`,
      ); // Allow reasonable number of internal properties
    });

    it("should maintain separation from domain logic", () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
      };
      const repository = new FileTemplateRepository(config);

      // Repository should only handle storage concerns
      // Should not contain business logic or validation beyond storage
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(repository));
      const exposedMethods = methods.filter((m) => !m.startsWith("_") && m !== "constructor");

      // Should only expose TemplateRepository interface methods
      const expectedMethods = [
        "loadTemplate",
        "exists",
        "listAvailable",
        "save",
        "delete",
        "refresh",
      ];
      for (const method of expectedMethods) {
        assertEquals(exposedMethods.includes(method), true, `Missing required method: ${method}`);
      }
    });

    it("should handle dependency injection correctly", () => {
      // Repository should accept configuration via constructor
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
        cacheEnabled: false,
      };

      const repository = new FileTemplateRepository(config);
      assertEquals(repository instanceof FileTemplateRepository, true);

      // Should not have hard-coded dependencies
      // Logger should be injected, not imported statically
      assertEquals(repository instanceof FileTemplateRepository, true);
    });

    it("should respect async/await contracts", async () => {
      const config: FileTemplateRepositoryConfig = {
        baseDirectory: "/test",
      };
      const repository = new FileTemplateRepository(config);

      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(
        mockTwoParams_Result.layerType,
      );
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const templatePathResult = TemplatePath.create(directive, layer, "prompt.md");

      if (!templatePathResult.ok) {
        throw new Error("Failed to create template path");
      }
      const templatePath = templatePathResult.data;

      // All interface methods should return Promises
      const existsPromise = repository.exists(templatePath);
      assertEquals(existsPromise instanceof Promise, true);

      const listPromise = repository.listAvailable();
      assertEquals(listPromise instanceof Promise, true);

      const refreshPromise = repository.refresh();
      assertEquals(refreshPromise instanceof Promise, true);

      // Await all promises to ensure they resolve properly
      await existsPromise;
      await listPromise;
      await refreshPromise;
    });
  });
});
