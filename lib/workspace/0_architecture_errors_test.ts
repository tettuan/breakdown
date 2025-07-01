/**
 * @fileoverview Architecture test for workspace/errors module
 * 
 * このテストはワークスペースエラーモジュールのアーキテクチャ制約を検証します：
 * - エラークラスの階層構造の妥当性
 * - 依存関係の方向性（循環参照の防止）
 * - エクスポートの完全性
 * - 型定義の一貫性
 * - Totalityパターンの遵守
 * 
 * アーキテクチャテストの目的は、モジュールの構造が設計原則に
 * 従っていることを保証することです。
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("test-architecture-errors");

describe("Workspace Errors - Architecture Tests", () => {
  describe("Module exports completeness", () => {
    it("should export all required error classes", async () => {
      logger.debug("Testing module exports", {
        testType: "architecture",
        aspect: "exports"
      });

      const ErrorsModule = await import("./errors.ts");

      // 必須のエラークラスがエクスポートされていることを確認
      assertExists(ErrorsModule.WorkspaceError);
      assertExists(ErrorsModule.WorkspaceInitError);
      assertExists(ErrorsModule.WorkspaceConfigError);
      assertExists(ErrorsModule.WorkspacePathError);
      assertExists(ErrorsModule.WorkspaceDirectoryError);

      // エクスポートされたクラスが関数（コンストラクタ）であることを確認
      assertEquals(typeof ErrorsModule.WorkspaceError, "function");
      assertEquals(typeof ErrorsModule.WorkspaceInitError, "function");
      assertEquals(typeof ErrorsModule.WorkspaceConfigError, "function");
      assertEquals(typeof ErrorsModule.WorkspacePathError, "function");
      assertEquals(typeof ErrorsModule.WorkspaceDirectoryError, "function");

      logger.debug("All required error classes are exported", {
        exportCount: 5,
        verified: true
      });
    });

    it("should not export internal implementation details", async () => {
      logger.debug("Testing encapsulation", {
        testType: "architecture",
        aspect: "encapsulation"
      });

      const ErrorsModule = await import("./errors.ts");
      // モジュールのエクスポートキーを取得
      const exportedKeys = Object.keys(ErrorsModule);
      const expectedExports = [
        "WorkspaceError",
        "WorkspaceInitError",
        "WorkspaceConfigError",
        "WorkspacePathError",
        "WorkspaceDirectoryError"
      ];

      // 期待されるエクスポートのみが存在することを確認
      assertEquals(exportedKeys.sort(), expectedExports.sort());

      logger.debug("Module encapsulation verified", {
        exportedKeys: exportedKeys.length,
        noInternalLeaks: true
      });
    });
  });

  describe("Error hierarchy structure", () => {
    it("should establish proper inheritance chain", async () => {
      logger.debug("Testing inheritance hierarchy", {
        testType: "architecture",
        aspect: "inheritance"
      });

      const ErrorsModule = await import("./errors.ts");
      // 各エラークラスがWorkspaceErrorを継承していることを確認
      const initError = new ErrorsModule.WorkspaceInitError("test");
      const configError = new ErrorsModule.WorkspaceConfigError("test");
      const pathError = new ErrorsModule.WorkspacePathError("test");
      const directoryError = new ErrorsModule.WorkspaceDirectoryError("test");

      // instanceof チェック
      assertEquals(initError instanceof ErrorsModule.WorkspaceError, true);
      assertEquals(configError instanceof ErrorsModule.WorkspaceError, true);
      assertEquals(pathError instanceof ErrorsModule.WorkspaceError, true);
      assertEquals(directoryError instanceof ErrorsModule.WorkspaceError, true);

      // Error基底クラスからの継承も確認
      assertEquals(initError instanceof Error, true);
      assertEquals(configError instanceof Error, true);
      assertEquals(pathError instanceof Error, true);
      assertEquals(directoryError instanceof Error, true);

      logger.debug("Inheritance hierarchy verified", {
        baseClass: "WorkspaceError",
        derivedClasses: 4,
        properChain: true
      });
    });

    it("should not have circular dependencies", async () => {
      logger.debug("Testing for circular dependencies", {
        testType: "architecture",
        aspect: "dependencies"
      });

      const ErrorsModule = await import("./errors.ts");
      // エラークラス間での相互参照がないことを確認
      // 各クラスのプロトタイプチェーンを確認
      const classes = [
        ErrorsModule.WorkspaceInitError,
        ErrorsModule.WorkspaceConfigError,
        ErrorsModule.WorkspacePathError,
        ErrorsModule.WorkspaceDirectoryError
      ];

      for (const ErrorClass of classes) {
        const prototype = ErrorClass.prototype;
        const parentPrototype = Object.getPrototypeOf(prototype);
        
        // 直接の親がWorkspaceErrorであることを確認
        assertEquals(parentPrototype.constructor.name, "WorkspaceError");
        
        // 他の兄弟クラスへの参照がないことを確認
        for (const OtherClass of classes) {
          if (ErrorClass !== OtherClass) {
            assertEquals(prototype instanceof OtherClass, false);
          }
        }
      }

      logger.debug("No circular dependencies detected", {
        classCount: classes.length,
        clean: true
      });
    });
  });

  describe("Error code uniqueness and consistency", () => {
    it("should have unique error codes for each error type", async () => {
      logger.debug("Testing error code uniqueness", {
        testType: "architecture",
        aspect: "error_codes"
      });

      const ErrorsModule = await import("./errors.ts");
      const errorInstances = [
        new ErrorsModule.WorkspaceError("test", "TEST_CODE"),
        new ErrorsModule.WorkspaceInitError("test"),
        new ErrorsModule.WorkspaceConfigError("test"),
        new ErrorsModule.WorkspacePathError("test"),
        new ErrorsModule.WorkspaceDirectoryError("test")
      ];

      const codes = errorInstances.map(err => err.code);
      const uniqueCodes = new Set(codes);

      // すべてのコードがユニークであることを確認（基底クラスを除く）
      assertEquals(uniqueCodes.size, codes.length);

      // 各エラータイプの期待されるコードを確認
      assertEquals(errorInstances[1].code, "WORKSPACE_INIT_ERROR");
      assertEquals(errorInstances[2].code, "WORKSPACE_CONFIG_ERROR");
      assertEquals(errorInstances[3].code, "WORKSPACE_PATH_ERROR");
      assertEquals(errorInstances[4].code, "WORKSPACE_DIRECTORY_ERROR");

      logger.debug("Error codes are unique and consistent", {
        totalCodes: codes.length,
        uniqueCodes: uniqueCodes.size,
        verified: true
      });
    });

    it("should follow consistent error code naming pattern", async () => {
      logger.debug("Testing error code naming convention", {
        testType: "architecture",
        aspect: "naming_convention"
      });

      const ErrorsModule = await import("./errors.ts");
      const errorTypes = [
        { Class: ErrorsModule.WorkspaceInitError, expectedPrefix: "WORKSPACE_INIT" },
        { Class: ErrorsModule.WorkspaceConfigError, expectedPrefix: "WORKSPACE_CONFIG" },
        { Class: ErrorsModule.WorkspacePathError, expectedPrefix: "WORKSPACE_PATH" },
        { Class: ErrorsModule.WorkspaceDirectoryError, expectedPrefix: "WORKSPACE_DIRECTORY" }
      ];

      for (const { Class, expectedPrefix } of errorTypes) {
        const instance = new Class("test");
        assertEquals(instance.code.startsWith(expectedPrefix), true);
        assertEquals(instance.code.endsWith("_ERROR"), true);
        
        // 大文字とアンダースコアのみで構成されていることを確認
        assertEquals(/^[A-Z_]+$/.test(instance.code), true);
      }

      logger.debug("Error code naming convention verified", {
        pattern: "WORKSPACE_<TYPE>_ERROR",
        consistent: true
      });
    });
  });

  describe("Totality pattern compliance", () => {
    it("should cover all workspace operation error scenarios", async () => {
      logger.debug("Testing totality pattern coverage", {
        testType: "architecture",
        aspect: "totality"
      });

      const { WorkspaceError, WorkspaceInitError, WorkspaceConfigError, WorkspacePathError, WorkspaceDirectoryError } = await import("./errors.ts");
      // ワークスペース操作のすべての失敗シナリオがカバーされていることを確認
      const errorScenarios = {
        initialization: WorkspaceInitError,
        configuration: WorkspaceConfigError,
        pathResolution: WorkspacePathError,
        directoryOperations: WorkspaceDirectoryError
      };

      // 各シナリオに対応するエラークラスが存在することを確認
      for (const [scenario, ErrorClass] of Object.entries(errorScenarios)) {
        assertExists(ErrorClass);
        assertEquals(typeof ErrorClass, "function");
        
        // インスタンス化可能であることを確認
        const instance = new ErrorClass("test");
        assertEquals(instance instanceof WorkspaceError, true);
        
        logger.debug(`Error scenario covered: ${scenario}`, {
          scenario,
          className: ErrorClass.name,
          covered: true
        });
      }

      logger.debug("Totality pattern verified", {
        totalScenarios: Object.keys(errorScenarios).length,
        allCovered: true
      });
    });

    it("should not allow invalid error states", async () => {
      logger.debug("Testing invalid state prevention", {
        testType: "architecture",
        aspect: "state_validation"
      });

      const { WorkspaceInitError, WorkspaceConfigError, WorkspacePathError, WorkspaceDirectoryError } = await import("./errors.ts");
      // エラーインスタンスが常に有効な状態を持つことを確認
      const testCases = [
        { Class: WorkspaceInitError, message: "Init failed" },
        { Class: WorkspaceConfigError, message: "Config invalid" },
        { Class: WorkspacePathError, message: "Path not found" },
        { Class: WorkspaceDirectoryError, message: "Dir creation failed" }
      ];

      for (const { Class, message } of testCases) {
        const instance = new Class(message);
        
        // 必須プロパティが設定されていることを確認
        assertExists(instance.message);
        assertExists(instance.code);
        assertExists(instance.name);
        
        // プロパティが空でないことを確認
        assertEquals(instance.message.length > 0, true);
        assertEquals(instance.code.length > 0, true);
        assertEquals(instance.name.length > 0, true);
        
        // stackトレースが存在することを確認
        assertExists(instance.stack);
      }

      logger.debug("Invalid states prevented", {
        testedClasses: testCases.length,
        allValid: true
      });
    });
  });

  describe("Interface consistency", () => {
    it("should maintain consistent constructor signatures", async () => {
      logger.debug("Testing constructor consistency", {
        testType: "architecture",
        aspect: "interface_consistency"
      });

      const { WorkspaceInitError, WorkspaceConfigError, WorkspacePathError, WorkspaceDirectoryError } = await import("./errors.ts");
      // 派生クラスのコンストラクタシグネチャが一貫していることを確認
      const derivedClasses = [
        WorkspaceInitError,
        WorkspaceConfigError,
        WorkspacePathError,
        WorkspaceDirectoryError
      ];

      for (const ErrorClass of derivedClasses) {
        // すべての派生クラスが単一のmessageパラメータを受け取ることを確認
        assertEquals(ErrorClass.length, 1);
        
        // エラーメッセージなしでインスタンス化した場合の動作を確認
        const instanceWithoutMessage = new ErrorClass("");
        assertEquals(instanceWithoutMessage.message, "");
        assertExists(instanceWithoutMessage.code);
      }

      logger.debug("Constructor signatures are consistent", {
        classCount: derivedClasses.length,
        parameterCount: 1,
        consistent: true
      });
    });

    it("should provide consistent error identification methods", async () => {
      logger.debug("Testing error identification consistency", {
        testType: "architecture",
        aspect: "identification"
      });

      const { WorkspaceInitError, WorkspaceConfigError, WorkspacePathError, WorkspaceDirectoryError } = await import("./errors.ts");
      const errorInstances = [
        new WorkspaceInitError("test"),
        new WorkspaceConfigError("test"),
        new WorkspacePathError("test"),
        new WorkspaceDirectoryError("test")
      ];

      for (const error of errorInstances) {
        // name プロパティがクラス名と一致することを確認
        assertEquals(error.name, error.constructor.name);
        
        // code プロパティが設定されていることを確認
        assertExists(error.code);
        assertEquals(typeof error.code, "string");
        
        // toString() メソッドが適切に動作することを確認
        const stringRepresentation = error.toString();
        assertEquals(stringRepresentation.includes(error.name), true);
        assertEquals(stringRepresentation.includes(error.message), true);
      }

      logger.debug("Error identification methods are consistent", {
        instanceCount: errorInstances.length,
        identifiable: true
      });
    });
  });
});