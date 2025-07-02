/**
 * @fileoverview Structure test for workspace/errors module
 *
 * このテストはワークスペースエラーモジュールの構造的な設計を検証します：
 * - クラスの責務分離と単一責任の原則
 * - エラークラス間の関係性の適切さ
 * - 抽象化レベルの一貫性
 * - エラー情報の構造化
 * - 拡張性と保守性の確保
 *
 * 構造テストの目的は、モジュールの内部構造が良い設計原則に
 * 従っていることを保証することです。
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  WorkspaceConfigError,
  WorkspaceDirectoryError,
  WorkspaceError,
  WorkspaceInitError,
  WorkspacePathError,
} from "./errors.ts";

const _logger = new BreakdownLogger("test-structure-errors");

describe("Workspace Errors - Structure Tests", async () => {
  describe("Single Responsibility Principle", async () => {
    it("should have each error class handle a single concern", async () => {
      _logger.debug("Testing single responsibility", {
        testType: "structure",
        principle: "SRP",
      });

      // 各エラークラスが単一の関心事を扱っていることを確認
      const errorResponsibilities = [
        {
          ErrorClass: WorkspaceInitError,
          responsibility: "initialization",
          validMessages: [
            "Failed to create workspace directory",
            "Workspace already exists",
            "Permission denied during initialization",
          ],
        },
        {
          ErrorClass: WorkspaceConfigError,
          responsibility: "configuration",
          validMessages: [
            "Invalid configuration format",
            "Missing required configuration field",
            "Configuration file not found",
          ],
        },
        {
          ErrorClass: WorkspacePathError,
          responsibility: "path_resolution",
          validMessages: [
            "Invalid path format",
            "Path outside workspace boundary",
            "Path traversal detected",
          ],
        },
        {
          ErrorClass: WorkspaceDirectoryError,
          responsibility: "directory_operations",
          validMessages: [
            "Directory creation failed",
            "Cannot delete non-empty directory",
            "Directory already exists",
          ],
        },
      ];

      for (const { ErrorClass, responsibility, validMessages } of errorResponsibilities) {
        // 各メッセージが適切なエラークラスで処理されることを確認
        for (const message of validMessages) {
          const error = new ErrorClass(message);
          assertEquals(error instanceof WorkspaceError, true);
          // Check that error class name reflects its responsibility
          const responsibilityKey = responsibility.split("_")[0]; // e.g., "initialization" -> "init"
          const expectedName = responsibilityKey === "initialization"
            ? "init"
            : responsibilityKey === "configuration"
            ? "config"
            : responsibilityKey === "path"
            ? "path"
            : responsibilityKey === "directory"
            ? "directory"
            : responsibilityKey;
          assertEquals(error.constructor.name.toLowerCase().includes(expectedName), true);

          _logger.debug("Responsibility verified", {
            class: ErrorClass.name,
            responsibility,
            messageHandled: true,
          });
        }
      }

      _logger.debug("Single responsibility principle verified", {
        errorClasses: errorResponsibilities.length,
        allResponsibilitiesClear: true,
      });
    });

    it("should not have overlapping responsibilities", async () => {
      _logger.debug("Testing responsibility boundaries", {
        testType: "structure",
        aspect: "responsibility_separation",
      });

      const {
        WorkspaceInitError,
        WorkspaceConfigError,
        WorkspacePathError,
        WorkspaceDirectoryError,
      } = await import("./errors.ts");
      // 異なるエラータイプが明確に区別されることを確認
      const scenarios = [
        {
          scenario: "Directory creation during init",
          primaryError: WorkspaceInitError,
          notError: WorkspaceDirectoryError,
          reason: "Init phase owns all init-time failures",
        },
        {
          scenario: "Config path validation",
          primaryError: WorkspaceConfigError,
          notError: WorkspacePathError,
          reason: "Config validation owns config-related paths",
        },
        {
          scenario: "Path normalization failure",
          primaryError: WorkspacePathError,
          notError: WorkspaceDirectoryError,
          reason: "Path operations are distinct from directory ops",
        },
      ];

      for (const { scenario, primaryError, notError, reason } of scenarios) {
        const error = new primaryError(scenario);

        // 正しいエラータイプが使用されていることを確認
        assertEquals(error instanceof primaryError, true);
        assertEquals(error instanceof notError, false);

        _logger.debug("Responsibility boundary verified", {
          scenario,
          correctType: primaryError.name,
          reason,
        });
      }

      _logger.debug("No overlapping responsibilities detected", {
        scenariosTested: scenarios.length,
        boundariesClear: true,
      });
    });
  });

  describe("Class cohesion and coupling", async () => {
    it("should have high cohesion within each error class", async () => {
      _logger.debug("Testing class cohesion", {
        testType: "structure",
        aspect: "cohesion",
      });

      // 各エラークラスのプロパティとメソッドが関連していることを確認
      const errorInstances = [
        new WorkspaceInitError("init test"),
        new WorkspaceConfigError("config test"),
        new WorkspacePathError("path test"),
        new WorkspaceDirectoryError("directory test"),
      ];

      for (const error of errorInstances) {
        // すべてのプロパティが一貫した目的を持つことを確認
        assertExists(error.name);
        assertExists(error.message);
        assertExists(error.code);
        assertExists(error.stack);

        // nameとcodeが関連していることを確認
        const codePrefix = error.code.replace("_ERROR", "").toLowerCase().replace("workspace_", "");
        const namePrefix = error.name.replace("Error", "").toLowerCase().replace("workspace", "");
        assertEquals(
          codePrefix.includes(namePrefix) || namePrefix.includes(codePrefix) ||
            codePrefix === namePrefix,
          true,
        );

        _logger.debug("Cohesion verified", {
          errorType: error.name,
          propertiesRelated: true,
        });
      }

      _logger.debug("High cohesion confirmed", {
        classesChecked: errorInstances.length,
        allCohesive: true,
      });
    });

    it("should have loose coupling between error classes", async () => {
      _logger.debug("Testing class coupling", {
        testType: "structure",
        aspect: "coupling",
      });

      // エラークラス間の依存関係が最小限であることを確認
      const errorClasses = [
        WorkspaceInitError,
        WorkspaceConfigError,
        WorkspacePathError,
        WorkspaceDirectoryError,
      ];

      for (const ErrorClass of errorClasses) {
        const instance = new ErrorClass("test");

        // 他のエラークラスのインスタンスやメソッドに依存していないことを確認
        const propertyNames = Object.getOwnPropertyNames(instance);
        const inheritedProps = ["name", "message", "code", "stack"];

        for (const prop of propertyNames) {
          if (!inheritedProps.includes(prop)) {
            // カスタムプロパティが存在しないことを確認（低結合性）
            assertEquals(false, true, `Unexpected property: ${prop}`);
          }
        }

        _logger.debug("Low coupling verified", {
          class: ErrorClass.name,
          noExternalDependencies: true,
        });
      }

      _logger.debug("Loose coupling confirmed", {
        classesChecked: errorClasses.length,
        minimalDependencies: true,
      });
    });
  });

  describe("Abstraction levels", async () => {
    it("should maintain consistent abstraction levels", async () => {
      _logger.debug("Testing abstraction consistency", {
        testType: "structure",
        aspect: "abstraction_levels",
      });

      // 基底クラスが適切な抽象化レベルを提供していることを確認
      const baseError = new WorkspaceError("test", "TEST_CODE");

      // 基底クラスが一般的なエラー情報のみを持つことを確認
      assertExists(baseError.message);
      assertExists(baseError.code);
      assertExists(baseError.name);

      // 派生クラスが具体的な実装を提供していることを確認
      const derivedErrors = [
        { error: new WorkspaceInitError("test"), expectedCode: "WORKSPACE_INIT_ERROR" },
        { error: new WorkspaceConfigError("test"), expectedCode: "WORKSPACE_CONFIG_ERROR" },
        { error: new WorkspacePathError("test"), expectedCode: "WORKSPACE_PATH_ERROR" },
        { error: new WorkspaceDirectoryError("test"), expectedCode: "WORKSPACE_DIRECTORY_ERROR" },
      ];

      for (const { error, expectedCode } of derivedErrors) {
        // 派生クラスが基底クラスの抽象化を具体化していることを確認
        assertEquals(error.code, expectedCode);
        assertEquals(error.name !== "WorkspaceError", true);

        _logger.debug("Abstraction level verified", {
          errorType: error.name,
          concreteImplementation: true,
        });
      }

      _logger.debug("Abstraction levels are consistent", {
        baseAbstraction: "WorkspaceError",
        concreteImplementations: derivedErrors.length,
      });
    });

    it("should not mix abstraction levels within classes", async () => {
      _logger.debug("Testing abstraction level separation", {
        testType: "structure",
        aspect: "abstraction_purity",
      });

      // 各クラスが単一の抽象化レベルを維持していることを確認
      const testCases = [
        {
          error: new WorkspaceInitError("Failed to initialize"),
          abstractionLevel: "operation",
          shouldNotContain: ["file", "byte", "socket"], // 低レベルの詳細
        },
        {
          error: new WorkspaceConfigError("Invalid config"),
          abstractionLevel: "configuration",
          shouldNotContain: ["parser", "tokenizer", "ast"], // 実装の詳細
        },
        {
          error: new WorkspacePathError("Invalid path"),
          abstractionLevel: "path",
          shouldNotContain: ["inode", "filesystem", "descriptor"], // システムレベルの詳細
        },
      ];

      for (const { error, abstractionLevel, shouldNotContain } of testCases) {
        const errorString = JSON.stringify(error);

        for (const lowLevelDetail of shouldNotContain) {
          assertEquals(errorString.toLowerCase().includes(lowLevelDetail), false);
        }

        _logger.debug("Abstraction purity verified", {
          errorType: error.name,
          abstractionLevel,
          noMixing: true,
        });
      }

      _logger.debug("Abstraction levels are not mixed", {
        testCases: testCases.length,
        allPure: true,
      });
    });
  });

  describe("Error information structure", async () => {
    it("should structure error information consistently", async () => {
      _logger.debug("Testing error information structure", {
        testType: "structure",
        aspect: "information_structure",
      });

      const { WorkspaceInitError, WorkspaceConfigError } = await import("./errors.ts");
      const errorCases = [
        {
          ErrorClass: WorkspaceInitError,
          message: "Failed to create directory: /workspace/projects",
          expectedStructure: {
            hasMessage: true,
            hasCode: true,
            hasName: true,
            hasStack: true,
          },
        },
        {
          ErrorClass: WorkspaceConfigError,
          message: "Missing required field: workingDirectory",
          expectedStructure: {
            hasMessage: true,
            hasCode: true,
            hasName: true,
            hasStack: true,
          },
        },
      ];

      for (const { ErrorClass, message, expectedStructure } of errorCases) {
        const error = new ErrorClass(message);

        // 期待される構造を持つことを確認
        assertEquals(expectedStructure.hasMessage, error.message !== undefined);
        assertEquals(expectedStructure.hasCode, error.code !== undefined);
        assertEquals(expectedStructure.hasName, error.name !== undefined);
        assertEquals(expectedStructure.hasStack, error.stack !== undefined);

        // 情報が適切に構造化されていることを確認
        assertEquals(error.message, message);
        assertEquals(typeof error.code, "string");
        assertEquals(typeof error.name, "string");

        _logger.debug("Information structure verified", {
          errorType: ErrorClass.name,
          structureComplete: true,
        });
      }

      _logger.debug("Error information consistently structured", {
        casesChecked: errorCases.length,
        allConsistent: true,
      });
    });

    it("should provide sufficient context in error messages", async () => {
      _logger.debug("Testing error context sufficiency", {
        testType: "structure",
        aspect: "context_information",
      });

      const { WorkspaceInitError, WorkspacePathError } = await import("./errors.ts");
      const contextualErrors = [
        {
          ErrorClass: WorkspaceInitError,
          contexts: [
            {
              message: "Failed to create directory: Permission denied at /workspace",
              hasPath: true,
            },
            { message: "Workspace already initialized at /home/user/project", hasPath: true },
            { message: "Cannot initialize: Parent directory does not exist", hasReason: true },
          ],
        },
        {
          ErrorClass: WorkspacePathError,
          contexts: [
            {
              message: "Invalid path: '../../../etc/passwd' attempts to escape workspace",
              hasSecurity: true,
            },
            { message: "Path not found: 'projects/nonexistent/file.ts'", hasPath: true },
            { message: "Malformed path: Contains null bytes", hasReason: true },
          ],
        },
      ];

      for (const { ErrorClass, contexts } of contextualErrors) {
        for (const context of contexts) {
          const error = new ErrorClass(context.message);

          // メッセージが十分なコンテキストを提供していることを確認
          assertEquals(error.message.length > 10, true); // 最小限の長さ
          assertEquals(error.message.includes(":") || error.message.includes(" "), true); // 構造化

          _logger.debug("Context sufficiency verified", {
            errorType: ErrorClass.name,
            messageLength: error.message.length,
            contextual: true,
          });
        }
      }

      _logger.debug("All errors provide sufficient context", {
        errorTypes: contextualErrors.length,
        contextual: true,
      });
    });
  });

  describe("Extensibility and maintainability", async () => {
    it("should be easily extensible for new error types", async () => {
      _logger.debug("Testing extensibility", {
        testType: "structure",
        aspect: "extensibility",
      });

      const { WorkspaceError } = await import("./errors.ts");
      // 新しいエラータイプを追加する際のパターンを確認
      class TestWorkspaceCustomError extends WorkspaceError {
        constructor(message: string) {
          super(message, "WORKSPACE_CUSTOM_ERROR");
          this.name = "TestWorkspaceCustomError";
        }
      }

      const customError = new TestWorkspaceCustomError("Custom error test");

      // 新しいエラーが既存の構造に適合することを確認
      assertEquals(customError instanceof WorkspaceError, true);
      assertEquals(customError instanceof Error, true);
      assertEquals(customError.code, "WORKSPACE_CUSTOM_ERROR");
      assertEquals(customError.name, "TestWorkspaceCustomError");

      _logger.debug("Extensibility verified", {
        newErrorType: "TestWorkspaceCustomError",
        followsPattern: true,
        easilyExtended: true,
      });
    });

    it("should maintain clear error categorization", async () => {
      _logger.debug("Testing error categorization", {
        testType: "structure",
        aspect: "categorization",
      });

      const {
        WorkspaceInitError,
        WorkspaceConfigError,
        WorkspacePathError,
        WorkspaceDirectoryError,
      } = await import("./errors.ts");
      // エラーのカテゴリが明確に分類されていることを確認
      const errorCategories = {
        lifecycle: [WorkspaceInitError],
        configuration: [WorkspaceConfigError],
        filesystem: [WorkspacePathError, WorkspaceDirectoryError],
      };

      for (const [category, ErrorClasses] of Object.entries(errorCategories)) {
        for (const ErrorClass of ErrorClasses) {
          const error = new ErrorClass("test");

          // カテゴリに応じた適切な命名とコードを持つことを確認
          assertEquals(error.code.includes("WORKSPACE"), true);
          assertEquals(error.code.includes("ERROR"), true);

          _logger.debug("Categorization verified", {
            category,
            errorType: ErrorClass.name,
            properlyCategorzed: true,
          });
        }
      }

      _logger.debug("Error categorization is clear", {
        categories: Object.keys(errorCategories).length,
        wellOrganized: true,
      });
    });
  });
});
