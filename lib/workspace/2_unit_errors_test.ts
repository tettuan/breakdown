/**
 * @fileoverview Unit test for workspace/errors module
 *
 * このテストはワークスペースエラーモジュールの機能動作を検証します：
 * - 各エラークラスのインスタンス化と基本動作
 * - エラーメッセージとコードの正確性
 * - エラープロパティの設定と取得
 * - 継承チェーンの動作確認
 * - エラー固有の振る舞い
 *
 * 単体テストの目的は、各エラークラスが仕様通りに動作し、
 * 期待される結果を返すことを保証することです。
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  WorkspaceConfigError,
  WorkspaceDirectoryError,
  WorkspaceError,
  WorkspaceInitError,
  WorkspacePathError,
} from "./errors.ts";

const _logger = new BreakdownLogger("test-unit-errors");

describe("Workspace Errors - Unit Tests", async () => {
  describe("WorkspaceError (Base Class)", async () => {
    it("should create WorkspaceError with message and code", async () => {
      _logger.debug("Testing WorkspaceError instantiation", {
        testType: "unit",
        target: "WorkspaceError",
      });

      const { WorkspaceError } = await import("./errors.ts");
      const message = "Test workspace error";
      const code = "TEST_ERROR_CODE";
      const error = new WorkspaceError(message, code);

      assertEquals(error.message, message);
      assertEquals(error.code, code);
      assertEquals(error.name, "WorkspaceError");
      assertInstanceOf(error, Error);
      assertInstanceOf(error, WorkspaceError);

      _logger.debug("WorkspaceError created successfully", {
        message,
        code,
        name: error.name,
      });
    });

    it("should have proper stack trace", async () => {
      _logger.debug("Testing stack trace generation", {
        testType: "unit",
        target: "WorkspaceError.stack",
      });

      const { WorkspaceError } = await import("./errors.ts");
      const error = new WorkspaceError("Stack trace test", "STACK_TEST");

      assertExists(error.stack);
      assertEquals(typeof error.stack, "string");
      assertEquals(error.stack.includes("WorkspaceError"), true);
      assertEquals(error.stack.includes("Stack trace test"), true);

      _logger.debug("Stack trace verified", {
        hasStack: true,
        includesErrorType: true,
        includesMessage: true,
      });
    });

    it("should handle empty message and code", async () => {
      _logger.debug("Testing empty values handling", {
        testType: "unit",
        target: "WorkspaceError",
        edge: "empty_values",
      });

      const { WorkspaceError } = await import("./errors.ts");
      const error = new WorkspaceError("", "");

      assertEquals(error.message, "");
      assertEquals(error.code, "");
      assertEquals(error.name, "WorkspaceError");
      assertExists(error.stack);

      _logger.debug("Empty values handled correctly", {
        emptyMessage: true,
        emptyCode: true,
        stillValid: true,
      });
    });

    it("should be throwable and catchable", async () => {
      _logger.debug("Testing throw/catch behavior", {
        testType: "unit",
        target: "WorkspaceError",
        behavior: "throwable",
      });

      const { WorkspaceError } = await import("./errors.ts");
      const caught = false;
      let caughtError: InstanceType<typeof WorkspaceError> | null = null;

      try {
        throw new WorkspaceError("Thrown error", "THROW_TEST");
      } catch (error) {
        caught = true;
        if (error instanceof WorkspaceError) {
          caughtError = error;
        }
      }

      assertEquals(caught, true);
      assertExists(caughtError);
      assertEquals(caughtError?.message, "Thrown error");
      assertEquals(caughtError?.code, "THROW_TEST");

      _logger.debug("Throw/catch behavior verified", {
        throwable: true,
        catchable: true,
        properInstance: true,
      });
    });
  });

  describe("WorkspaceInitError", async () => {
    it("should create WorkspaceInitError with proper defaults", async () => {
      _logger.debug("Testing WorkspaceInitError instantiation", {
        testType: "unit",
        target: "WorkspaceInitError",
      });

      const { WorkspaceError, WorkspaceInitError } = await import("./errors.ts");
      const message = "Failed to initialize workspace";
      const error = new WorkspaceInitError(message);

      assertEquals(error.message, message);
      assertEquals(error.code, "WORKSPACE_INIT_ERROR");
      assertEquals(error.name, "WorkspaceInitError");
      assertInstanceOf(error, Error);
      assertInstanceOf(error, WorkspaceError);
      assertInstanceOf(error, WorkspaceInitError);

      _logger.debug("WorkspaceInitError created successfully", {
        message,
        code: error.code,
        properInheritance: true,
      });
    });

    it("should handle various initialization failure messages", async () => {
      _logger.debug("Testing various init failure scenarios", {
        testType: "unit",
        target: "WorkspaceInitError",
        scenarios: "multiple",
      });

      const initScenarios = [
        "Failed to create workspace directory",
        "Permission denied: Cannot write to /workspace",
        "Workspace already exists at specified location",
        "Parent directory does not exist",
        "Disk quota exceeded",
        "Invalid workspace configuration during initialization",
      ];

      for (const scenario of initScenarios) {
        const error = new WorkspaceInitError(scenario);

        assertEquals(error.message, scenario);
        assertEquals(error.code, "WORKSPACE_INIT_ERROR");
        assertEquals(error.name, "WorkspaceInitError");

        _logger.debug("Init scenario handled", {
          scenario,
          errorCreated: true,
        });
      }

      _logger.debug("All init scenarios tested", {
        scenarioCount: initScenarios.length,
        allHandled: true,
      });
    });

    it("should be distinguishable from other error types", async () => {
      _logger.debug("Testing error type distinction", {
        testType: "unit",
        target: "WorkspaceInitError",
        aspect: "type_checking",
      });

      const initError = new WorkspaceInitError("Init error");
      const configError = new WorkspaceConfigError("Config error");

      // Positive checks
      assertInstanceOf(initError, WorkspaceInitError);
      assertInstanceOf(initError, WorkspaceError);

      // Negative checks
      assertEquals(initError instanceof WorkspaceConfigError, false);
      assertEquals(initError instanceof WorkspacePathError, false);
      assertEquals(initError instanceof WorkspaceDirectoryError, false);

      _logger.debug("Error type distinction verified", {
        correctType: true,
        notOtherTypes: true,
      });
    });
  });

  describe("WorkspaceConfigError", async () => {
    it("should create WorkspaceConfigError with proper defaults", async () => {
      _logger.debug("Testing WorkspaceConfigError instantiation", {
        testType: "unit",
        target: "WorkspaceConfigError",
      });

      const message = "Invalid configuration format";
      const error = new WorkspaceConfigError(message);

      assertEquals(error.message, message);
      assertEquals(error.code, "WORKSPACE_CONFIG_ERROR");
      assertEquals(error.name, "WorkspaceConfigError");
      assertInstanceOf(error, Error);
      assertInstanceOf(error, WorkspaceError);
      assertInstanceOf(error, WorkspaceConfigError);

      _logger.debug("WorkspaceConfigError created successfully", {
        message,
        code: error.code,
        properInheritance: true,
      });
    });

    it("should handle various configuration error messages", async () => {
      _logger.debug("Testing various config error scenarios", {
        testType: "unit",
        target: "WorkspaceConfigError",
        scenarios: "multiple",
      });

      const configScenarios = [
        "Missing required field: workingDirectory",
        "Invalid value for timeout: must be a positive number",
        "Configuration file not found: .breakdown/config.json",
        "Malformed JSON in configuration file",
        "Unsupported configuration version: 3.0",
        "Conflicting configuration options: debug and production",
      ];

      for (const scenario of configScenarios) {
        const error = new WorkspaceConfigError(scenario);

        assertEquals(error.message, scenario);
        assertEquals(error.code, "WORKSPACE_CONFIG_ERROR");
        assertEquals(error.name, "WorkspaceConfigError");

        _logger.debug("Config scenario handled", {
          scenario,
          errorCreated: true,
        });
      }

      _logger.debug("All config scenarios tested", {
        scenarioCount: configScenarios.length,
        allHandled: true,
      });
    });

    it("should properly stringify for logging", async () => {
      _logger.debug("Testing error stringification", {
        testType: "unit",
        target: "WorkspaceConfigError",
        aspect: "toString",
      });

      const { WorkspaceConfigError } = await import("./errors.ts");
      const error = new WorkspaceConfigError("Test config error");
      const stringified = error.toString();

      assertEquals(typeof stringified, "string");
      assertEquals(stringified.includes("WorkspaceConfigError"), true);
      assertEquals(stringified.includes("Test config error"), true);

      // JSON stringification
      const jsonStringified = JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
      });

      assertEquals(jsonStringified.includes("WorkspaceConfigError"), true);
      assertEquals(jsonStringified.includes("WORKSPACE_CONFIG_ERROR"), true);

      _logger.debug("Stringification verified", {
        toString: true,
        jsonStringify: true,
      });
    });
  });

  describe("WorkspacePathError", async () => {
    it("should create WorkspacePathError with proper defaults", async () => {
      _logger.debug("Testing WorkspacePathError instantiation", {
        testType: "unit",
        target: "WorkspacePathError",
      });

      const { WorkspaceError, WorkspacePathError } = await import("./errors.ts");
      const message = "Invalid path format";
      const error = new WorkspacePathError(message);

      assertEquals(error.message, message);
      assertEquals(error.code, "WORKSPACE_PATH_ERROR");
      assertEquals(error.name, "WorkspacePathError");
      assertInstanceOf(error, Error);
      assertInstanceOf(error, WorkspaceError);
      assertInstanceOf(error, WorkspacePathError);

      _logger.debug("WorkspacePathError created successfully", {
        message,
        code: error.code,
        properInheritance: true,
      });
    });

    it("should handle various path error scenarios", async () => {
      _logger.debug("Testing various path error scenarios", {
        testType: "unit",
        target: "WorkspacePathError",
        scenarios: "multiple",
      });

      const { WorkspacePathError } = await import("./errors.ts");
      const pathScenarios = [
        "Invalid relative path: ../../../etc/passwd",
        "Path contains null bytes",
        "Path too long: exceeds maximum length of 4096 characters",
        "Circular symbolic link detected",
        "Path not found: projects/nonexistent/file.ts",
        "Access denied: insufficient permissions for path",
        "Invalid characters in path: <|>*?",
      ];

      for (const scenario of pathScenarios) {
        const error = new WorkspacePathError(scenario);

        assertEquals(error.message, scenario);
        assertEquals(error.code, "WORKSPACE_PATH_ERROR");
        assertEquals(error.name, "WorkspacePathError");

        _logger.debug("Path scenario handled", {
          scenario,
          errorCreated: true,
        });
      }

      _logger.debug("All path scenarios tested", {
        scenarioCount: pathScenarios.length,
        allHandled: true,
      });
    });

    it("should handle edge cases for paths", async () => {
      _logger.debug("Testing path edge cases", {
        testType: "unit",
        target: "WorkspacePathError",
        edge: "paths",
      });

      const { WorkspacePathError } = await import("./errors.ts");
      const edgeCases = [
        { path: "", message: "Empty path provided" },
        { path: ".", message: "Current directory reference not allowed" },
        { path: "..", message: "Parent directory reference not allowed" },
        { path: "~", message: "Home directory expansion not supported" },
        { path: "/", message: "Root directory access not allowed" },
        { path: "//", message: "Double slash in path" },
        { path: "\\", message: "Backslash not supported" },
      ];

      for (const { path, message } of edgeCases) {
        const error = new WorkspacePathError(`${message}: '${path}'`);

        assertEquals(error.message.includes(path), true);
        assertEquals(error.message.includes(message), true);
        assertEquals(error.code, "WORKSPACE_PATH_ERROR");

        _logger.debug("Path edge case handled", {
          path,
          message,
          handled: true,
        });
      }

      _logger.debug("All path edge cases tested", {
        edgeCaseCount: edgeCases.length,
      });
    });
  });

  describe("WorkspaceDirectoryError", async () => {
    it("should create WorkspaceDirectoryError with proper defaults", async () => {
      _logger.debug("Testing WorkspaceDirectoryError instantiation", {
        testType: "unit",
        target: "WorkspaceDirectoryError",
      });

      const { WorkspaceError, WorkspaceDirectoryError } = await import("./errors.ts");
      const message = "Failed to create directory";
      const error = new WorkspaceDirectoryError(message);

      assertEquals(error.message, message);
      assertEquals(error.code, "WORKSPACE_DIRECTORY_ERROR");
      assertEquals(error.name, "WorkspaceDirectoryError");
      assertInstanceOf(error, Error);
      assertInstanceOf(error, WorkspaceError);
      assertInstanceOf(error, WorkspaceDirectoryError);

      _logger.debug("WorkspaceDirectoryError created successfully", {
        message,
        code: error.code,
        properInheritance: true,
      });
    });

    it("should handle various directory operation errors", async () => {
      _logger.debug("Testing various directory operation scenarios", {
        testType: "unit",
        target: "WorkspaceDirectoryError",
        scenarios: "multiple",
      });

      const { WorkspaceDirectoryError } = await import("./errors.ts");
      const directoryScenarios = [
        "Failed to create directory: Permission denied",
        "Directory already exists: projects/existing-project",
        "Cannot remove non-empty directory without force flag",
        "Parent directory does not exist",
        "Directory name contains invalid characters",
        "Maximum directory depth exceeded",
        "Disk quota exceeded while creating directory",
        "Directory is read-only",
      ];

      for (const scenario of directoryScenarios) {
        const error = new WorkspaceDirectoryError(scenario);

        assertEquals(error.message, scenario);
        assertEquals(error.code, "WORKSPACE_DIRECTORY_ERROR");
        assertEquals(error.name, "WorkspaceDirectoryError");

        _logger.debug("Directory scenario handled", {
          scenario,
          errorCreated: true,
        });
      }

      _logger.debug("All directory scenarios tested", {
        scenarioCount: directoryScenarios.length,
        allHandled: true,
      });
    });

    it("should handle complex directory operation failures", async () => {
      _logger.debug("Testing complex directory operations", {
        testType: "unit",
        target: "WorkspaceDirectoryError",
        complexity: "high",
      });

      const { WorkspaceDirectoryError } = await import("./errors.ts");
      const complexOperations = [
        {
          operation: "recursive create",
          message: "Failed to create nested directories: a/b/c/d/e",
          expectation: "handles deep nesting",
        },
        {
          operation: "atomic rename",
          message: "Cannot rename directory: source and target on different filesystems",
          expectation: "filesystem boundaries",
        },
        {
          operation: "permission cascade",
          message: "Failed to set permissions recursively: some files inaccessible",
          expectation: "partial failures",
        },
      ];

      for (const { operation, message, expectation } of complexOperations) {
        const error = new WorkspaceDirectoryError(message);

        assertEquals(error.message, message);
        assertEquals(error.code, "WORKSPACE_DIRECTORY_ERROR");

        _logger.debug("Complex operation handled", {
          operation,
          expectation,
          handled: true,
        });
      }

      _logger.debug("Complex operations tested", {
        operationCount: complexOperations.length,
        allHandled: true,
      });
    });
  });

  describe("Error interoperability", async () => {
    it("should work with standard error handling", async () => {
      _logger.debug("Testing standard error handling compatibility", {
        testType: "unit",
        aspect: "interoperability",
      });

      const { WorkspaceError, WorkspaceInitError } = await import("./errors.ts");
      function riskyOperation(): void {
        throw new WorkspaceInitError("Simulated failure");
      }

      const errorMessage = "";
      const errorCode = "";
      const isWorkspaceError = false;

      try {
        riskyOperation();
      } catch (error) {
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        if (error instanceof WorkspaceError) {
          errorCode = error.code;
          isWorkspaceError = true;
        }
      }

      assertEquals(errorMessage, "Simulated failure");
      assertEquals(errorCode, "WORKSPACE_INIT_ERROR");
      assertEquals(isWorkspaceError, true);

      _logger.debug("Standard error handling verified", {
        catchesAsError: true,
        catchesAsWorkspaceError: true,
        preservesProperties: true,
      });
    });

    it("should work with Promise rejections", async () => {
      _logger.debug("Testing Promise rejection handling", {
        testType: "unit",
        aspect: "promise_compatibility",
      });

      const { WorkspaceConfigError } = await import("./errors.ts");
      async function asyncOperation(): Promise<void> {
        throw new WorkspaceConfigError("Async config error");
      }

      const caught = false;
      let error: InstanceType<typeof WorkspaceConfigError> | null = null;

      try {
        await asyncOperation();
      } catch (e) {
        caught = true;
        if (e instanceof WorkspaceConfigError) {
          error = e;
        }
      }

      assertEquals(caught, true);
      assertExists(error);
      assertEquals(error?.message, "Async config error");
      assertEquals(error?.code, "WORKSPACE_CONFIG_ERROR");

      _logger.debug("Promise rejection handling verified", {
        asyncCompatible: true,
        properError: true,
      });
    });

    it("should provide useful debugging information", async () => {
      _logger.debug("Testing debugging information availability", {
        testType: "unit",
        aspect: "debugging",
      });

      const {
        WorkspaceInitError,
        WorkspaceConfigError,
        WorkspacePathError,
        WorkspaceDirectoryError,
      } = await import("./errors.ts");
      const errors = [
        new WorkspaceInitError("Init debug test"),
        new WorkspaceConfigError("Config debug test"),
        new WorkspacePathError("Path debug test"),
        new WorkspaceDirectoryError("Directory debug test"),
      ];

      for (const error of errors) {
        // Verify all debugging properties are available
        assertExists(error.name);
        assertExists(error.message);
        assertExists(error.code);
        assertExists(error.stack);

        // Verify error is distinguishable
        assertEquals(error.name !== "Error", true);
        assertEquals(error.code !== "", true);

        // Verify stack trace contains useful info
        assertEquals(error.stack?.includes(error.name), true);

        _logger.debug("Debugging info verified", {
          errorType: error.name,
          hasAllProperties: true,
          distinguishable: true,
        });
      }

      _logger.debug("All errors provide debugging information", {
        errorCount: errors.length,
        debuggable: true,
      });
    });
  });
});
