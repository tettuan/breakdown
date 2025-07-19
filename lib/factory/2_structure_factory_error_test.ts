/**
 * @fileoverview Structure Tests for Factory Error Types - Totality Principle Compliance
 *
 * Validates the structural integrity of factory error types following the Totality principle.
 * Tests discriminated union types, formatting functions, and error type consistency.
 *
 * @module factory/2_structure_factory_error_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { describe, it } from "jsr:@std/testing/bdd";
import {
  FactoryError,
  FactoryInitError,
  formatFactoryError,
  formatFactoryInitError,
  formatPathResolutionError,
  PathResolutionError,
} from "./factory_error.ts";

describe("2_structure_factory_error_test", () => {
  describe("Discriminated Union Type Structure", () => {
    it("should validate FactoryInitError discriminated union structure", () => {
      // Test all variants of FactoryInitError
      const invalidConfigError: FactoryInitError = {
        kind: "InvalidConfig",
        reason: "Test reason",
      };

      const missingParameterError: FactoryInitError = {
        kind: "MissingParameter",
        parameter: "testParam",
      };

      const configValidationError: FactoryInitError = {
        kind: "ConfigValidation",
        field: "testField",
        reason: "Test reason",
      };

      const dependencyFailureError: FactoryInitError = {
        kind: "DependencyFailure",
        dependency: "testDep",
        reason: "Test reason",
      };

      // Verify kind field consistency
      assertEquals(invalidConfigError.kind, "InvalidConfig");
      assertEquals(missingParameterError.kind, "MissingParameter");
      assertEquals(configValidationError.kind, "ConfigValidation");
      assertEquals(dependencyFailureError.kind, "DependencyFailure");

      // Verify required fields exist
      assertExists(invalidConfigError.reason);
      assertExists(missingParameterError.parameter);
      assertExists(configValidationError.field);
      assertExists(configValidationError.reason);
      assertExists(dependencyFailureError.dependency);
      assertExists(dependencyFailureError.reason);
    });

    it("should validate PathResolutionError discriminated union structure", () => {
      // Test all variants of PathResolutionError
      const notResolvedError: PathResolutionError = {
        kind: "NotResolved",
        resource: "promptFilePath",
      };

      const invalidPathError: PathResolutionError = {
        kind: "InvalidPath",
        path: "/test/path",
        reason: "Test reason",
      };

      const fileNotFoundError: PathResolutionError = {
        kind: "FileNotFound",
        path: "/test/file.txt",
      };

      const directoryNotFoundError: PathResolutionError = {
        kind: "DirectoryNotFound",
        path: "/test/dir",
      };

      const permissionDeniedError: PathResolutionError = {
        kind: "PermissionDenied",
        path: "/test/protected",
      };

      // Verify kind field consistency
      assertEquals(notResolvedError.kind, "NotResolved");
      assertEquals(invalidPathError.kind, "InvalidPath");
      assertEquals(fileNotFoundError.kind, "FileNotFound");
      assertEquals(directoryNotFoundError.kind, "DirectoryNotFound");
      assertEquals(permissionDeniedError.kind, "PermissionDenied");

      // Verify required fields exist
      assertExists(notResolvedError.resource);
      assertExists(invalidPathError.path);
      assertExists(invalidPathError.reason);
      assertExists(fileNotFoundError.path);
      assertExists(directoryNotFoundError.path);
      assertExists(permissionDeniedError.path);
    });

    it("should validate FactoryError union type structure", () => {
      // Test that FactoryError properly combines both error types
      const initError: FactoryError = {
        kind: "InvalidConfig",
        reason: "Test config error",
      };

      const pathError: FactoryError = {
        kind: "NotResolved",
        resource: "inputFilePath",
      };

      // Verify union type assignments work correctly
      assertEquals(initError.kind, "InvalidConfig");
      assertEquals(pathError.kind, "NotResolved");

      // Verify type discrimination through kind field
      if (initError.kind === "InvalidConfig") {
        assertExists((initError as { kind: "InvalidConfig"; reason: string }).reason);
      }

      if (pathError.kind === "NotResolved") {
        assertExists((pathError as { kind: "NotResolved"; resource: string }).resource);
      }
    });
  });

  describe("Error Formatting Function Structure", () => {
    it("should validate formatFactoryInitError function structure", () => {
      // Test all error variants produce valid strings
      const testCases: FactoryInitError[] = [
        { kind: "InvalidConfig", reason: "Config is invalid" },
        { kind: "MissingParameter", parameter: "requiredParam" },
        { kind: "ConfigValidation", field: "testField", reason: "Invalid value" },
        { kind: "DependencyFailure", dependency: "testDep", reason: "Dep failed" },
      ];

      for (const error of testCases) {
        const formatted = formatFactoryInitError(error);

        // Verify formatting function returns valid string
        assertEquals(typeof formatted, "string");
        assertEquals(formatted.length > 0, true);

        // Verify formatted message contains error information
        switch (error.kind) {
          case "InvalidConfig":
            assertEquals(formatted.includes("Invalid configuration"), true);
            assertEquals(formatted.includes(error.reason), true);
            break;
          case "MissingParameter":
            assertEquals(formatted.includes("Missing required parameter"), true);
            assertEquals(formatted.includes(error.parameter), true);
            break;
          case "ConfigValidation":
            assertEquals(formatted.includes("Configuration validation failed"), true);
            assertEquals(formatted.includes(error.field), true);
            assertEquals(formatted.includes(error.reason), true);
            break;
          case "DependencyFailure":
            assertEquals(formatted.includes("Dependency"), true);
            assertEquals(formatted.includes(error.dependency), true);
            assertEquals(formatted.includes("failed"), true);
            assertEquals(formatted.includes(error.reason), true);
            break;
        }
      }
    });

    it("should validate formatPathResolutionError function structure", () => {
      // Test all path error variants produce valid strings
      const testCases: PathResolutionError[] = [
        { kind: "NotResolved", resource: "promptFilePath" },
        { kind: "InvalidPath", path: "/invalid/path", reason: "Path is invalid" },
        { kind: "FileNotFound", path: "/missing/file.txt" },
        { kind: "DirectoryNotFound", path: "/missing/dir" },
        { kind: "PermissionDenied", path: "/protected/file" },
      ];

      for (const error of testCases) {
        const formatted = formatPathResolutionError(error);

        // Verify formatting function returns valid string
        assertEquals(typeof formatted, "string");
        assertEquals(formatted.length > 0, true);

        // Verify formatted message contains error information
        switch (error.kind) {
          case "NotResolved":
            assertEquals(formatted.includes(error.resource), true);
            assertEquals(formatted.includes("not resolved"), true);
            break;
          case "InvalidPath":
            assertEquals(formatted.includes("Invalid path"), true);
            assertEquals(formatted.includes(error.path), true);
            assertEquals(formatted.includes(error.reason), true);
            break;
          case "FileNotFound":
            assertEquals(formatted.includes("File not found"), true);
            assertEquals(formatted.includes(error.path), true);
            break;
          case "DirectoryNotFound":
            assertEquals(formatted.includes("Directory not found"), true);
            assertEquals(formatted.includes(error.path), true);
            break;
          case "PermissionDenied":
            assertEquals(formatted.includes("Permission denied"), true);
            assertEquals(formatted.includes(error.path), true);
            break;
        }
      }
    });

    it("should validate formatFactoryError function structure", () => {
      // Test combined error formatter correctly delegates
      const initError: FactoryError = {
        kind: "InvalidConfig",
        reason: "Test config error",
      };

      const pathError: FactoryError = {
        kind: "FileNotFound",
        path: "/test/file.txt",
      };

      const initFormatted = formatFactoryError(initError);
      const pathFormatted = formatFactoryError(pathError);

      // Verify both error types are handled correctly
      assertEquals(typeof initFormatted, "string");
      assertEquals(typeof pathFormatted, "string");
      assertEquals(initFormatted.length > 0, true);
      assertEquals(pathFormatted.length > 0, true);

      // Verify correct delegation to specific formatters
      assertEquals(initFormatted.includes("Invalid configuration"), true);
      assertEquals(pathFormatted.includes("File not found"), true);
    });
  });

  describe("Totality Principle Compliance", () => {
    it("should handle all possible error combinations without exceptions", () => {
      // Test exhaustive error type coverage
      const allFactoryInitErrors: FactoryInitError[] = [
        { kind: "InvalidConfig", reason: "test" },
        { kind: "MissingParameter", parameter: "test" },
        { kind: "ConfigValidation", field: "test", reason: "test" },
        { kind: "DependencyFailure", dependency: "test", reason: "test" },
      ];

      const allPathResolutionErrors: PathResolutionError[] = [
        { kind: "NotResolved", resource: "promptFilePath" },
        { kind: "NotResolved", resource: "inputFilePath" },
        { kind: "NotResolved", resource: "outputFilePath" },
        { kind: "NotResolved", resource: "schemaFilePath" },
        { kind: "InvalidPath", path: "/test", reason: "test" },
        { kind: "FileNotFound", path: "/test" },
        { kind: "DirectoryNotFound", path: "/test" },
        { kind: "PermissionDenied", path: "/test" },
      ];

      // Test all init errors format without exceptions
      for (const error of allFactoryInitErrors) {
        const formatted = formatFactoryInitError(error);
        assertEquals(typeof formatted, "string");
        assertEquals(formatted.length > 0, true);
      }

      // Test all path resolution errors format without exceptions
      for (const error of allPathResolutionErrors) {
        const formatted = formatPathResolutionError(error);
        assertEquals(typeof formatted, "string");
        assertEquals(formatted.length > 0, true);
      }

      // Test combined factory errors format without exceptions
      const allFactoryErrors: FactoryError[] = [
        ...allFactoryInitErrors,
        ...allPathResolutionErrors,
      ];

      for (const error of allFactoryErrors) {
        const formatted = formatFactoryError(error);
        assertEquals(typeof formatted, "string");
        assertEquals(formatted.length > 0, true);
      }
    });

    it("should maintain type safety with exhaustive switch handling", () => {
      // Test that all error kinds are handled in switch statements
      const testFactoryInitError = (error: FactoryInitError): boolean => {
        switch (error.kind) {
          case "InvalidConfig":
            return true;
          case "MissingParameter":
            return true;
          case "ConfigValidation":
            return true;
          case "DependencyFailure":
            return true;
            // No default case - TypeScript should ensure exhaustiveness
        }
      };

      const testPathResolutionError = (error: PathResolutionError): boolean => {
        switch (error.kind) {
          case "NotResolved":
            return true;
          case "InvalidPath":
            return true;
          case "FileNotFound":
            return true;
          case "DirectoryNotFound":
            return true;
          case "PermissionDenied":
            return true;
            // No default case - TypeScript should ensure exhaustiveness
        }
      };

      // Test all error types are handled
      assertEquals(testFactoryInitError({ kind: "InvalidConfig", reason: "test" }), true);
      assertEquals(testFactoryInitError({ kind: "MissingParameter", parameter: "test" }), true);
      assertEquals(
        testFactoryInitError({ kind: "ConfigValidation", field: "test", reason: "test" }),
        true,
      );
      assertEquals(
        testFactoryInitError({ kind: "DependencyFailure", dependency: "test", reason: "test" }),
        true,
      );

      assertEquals(
        testPathResolutionError({ kind: "NotResolved", resource: "promptFilePath" }),
        true,
      );
      assertEquals(
        testPathResolutionError({ kind: "InvalidPath", path: "/test", reason: "test" }),
        true,
      );
      assertEquals(testPathResolutionError({ kind: "FileNotFound", path: "/test" }), true);
      assertEquals(testPathResolutionError({ kind: "DirectoryNotFound", path: "/test" }), true);
      assertEquals(testPathResolutionError({ kind: "PermissionDenied", path: "/test" }), true);
    });
  });

  describe("Value Object Constraint Validation", () => {
    it("should validate resource type constraints in NotResolved errors", () => {
      // Test that resource field accepts only valid resource types
      const validResources = [
        "promptFilePath",
        "inputFilePath",
        "outputFilePath",
        "schemaFilePath",
      ] as const;

      for (const resource of validResources) {
        const error: PathResolutionError = {
          kind: "NotResolved",
          resource: resource,
        };

        assertEquals(error.resource, resource);

        // Verify error formats correctly with valid resource
        const formatted = formatPathResolutionError(error);
        assertEquals(formatted.includes(resource), true);
      }
    });

    it("should validate error message consistency and quality", () => {
      // Test that error messages are consistent and informative
      const testCases = [
        {
          error: { kind: "InvalidConfig", reason: "Missing required field" } as FactoryInitError,
          expectedPattern: /Invalid configuration: Missing required field/,
        },
        {
          error: { kind: "MissingParameter", parameter: "configFile" } as FactoryInitError,
          expectedPattern: /Missing required parameter: configFile/,
        },
        {
          error: { kind: "FileNotFound", path: "/path/to/file.txt" } as PathResolutionError,
          expectedPattern: /File not found: \/path\/to\/file\.txt/,
        },
        {
          error: { kind: "PermissionDenied", path: "/protected/file" } as PathResolutionError,
          expectedPattern: /Permission denied: \/protected\/file/,
        },
      ];

      for (const { error, expectedPattern } of testCases) {
        const formatted = formatFactoryError(error);
        assertEquals(expectedPattern.test(formatted), true);
      }
    });
  });
});
