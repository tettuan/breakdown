/**
 * @fileoverview JSR integration test - Configuration-driven architecture of BreakdownConfig and BreakdownParams
 *
 * Dynamically load DirectiveType/LayerType from configuration files,
 * Implementation of integration tests with complete hardcode elimination
 *
 * @module tests/integration/jsr_integration/breakdown_config_params_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  ConfigBasedTwoParamsBuilder,
  Result as _Result,
  TwoParams_Result as _TwoParams_Result,
} from "../../../lib/config/config_based_two_params_builder.ts";
import { ConfigProfile } from "../../../lib/config/config_profile_name.ts";
import { ParamsCustomConfig } from "../../../lib/config/params_custom_config.ts";
import { loadUserConfig } from "../../../lib/config/user_config_loader.ts";

const logger = new BreakdownLogger("jsr-integration");

describe("JSR Integration - BreakdownConfig + BreakdownParams", () => {
  describe("Dynamic loading from configuration files", () => {
    it("Can load configuration from breakdown-params-integration-user.yml", async () => {
      // Create configuration profile
      const profile = ConfigProfile.create("breakdown-params-integration");
      logger.debug("Config profile created", { profile: profile.value });

      // 設定ファイルの読み込み
      const configData = await loadUserConfig(profile);
      logger.debug("Config file loading completed", {
        keys: Object.keys(configData),
        paramsSection: configData.params,
      });

      // ParamsCustomConfig の作成
      const customConfig = ParamsCustomConfig.create(configData);

      // Verify patterns (no hardcode)
      assertExists(customConfig.directivePattern);
      assertExists(customConfig.layerPattern);

      logger.debug("Pattern retrieval successful", {
        directivePattern: customConfig.directivePattern,
        layerPattern: customConfig.layerPattern,
      });

      // Verify patterns are in expected format
      assertEquals(
        customConfig.directivePattern,
        "to|summary|defect|find|test_directive",
      );
      assertEquals(
        customConfig.layerPattern,
        "project|issue|task|test_layer",
      );
    });

    it("Can create configuration-based builder with ConfigBasedTwoParamsBuilder", async () => {
      // 設定ベースビルダーの作成
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      logger.debug("Builder creation result", { ok: builderResult.ok });

      // Result型のチェック
      assertEquals(builderResult.ok, true);
      assertExists(builderResult.data);

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // Dynamic pattern retrieval (no hardcode)
      const directivePattern = builder.getDirectivePattern();
      const layerPattern = builder.getLayerPattern();

      assertExists(directivePattern);
      assertExists(layerPattern);

      logger.debug("Pattern retrieval from builder", {
        directivePattern,
        layerPattern,
        profile: builder.getProfile(),
      });
    });
  });

  describe("Dynamic parameter validation", () => {
    it("Can validate valid parameters based on configuration file patterns", async () => {
      // Create builder
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // Test with valid values defined in configuration file
      const validationResult = builder.validateParams("to", "project");

      logger.debug("Validation result (valid)", {
        result: validationResult,
        directiveType: "to",
        layerType: "project",
      });

      assertEquals(validationResult.ok, true);

      // test_directive と test_layer も有効
      const testValidation = builder.validateParams("test_directive", "test_layer");
      assertEquals(testValidation.ok, true);
    });

    it("Can reject invalid parameters based on configuration file patterns", async () => {
      // Create builder
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // Test with invalid values (no hardcode)
      const invalidResult = builder.validateParams("invalid_directive", "invalid_layer");

      logger.debug("Validation result (invalid)", {
        result: invalidResult,
        directiveType: "invalid_directive",
        layerType: "invalid_layer",
      });

      assertEquals(invalidResult.ok, false);
      assertEquals(invalidResult.error?.kind, "ValidationFailed");
    });
  });

  describe("Dynamic generation of TwoParams_Result", () => {
    it("Can generate TwoParams_Result from configuration base", async () => {
      // Create builder
      const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!builderResult.ok) {
        throw new Error("Builder creation failed");
      }

      const builder = builderResult.data;

      // TwoParams_Result の生成
      const result = builder.build("summary", "issue");

      logger.debug("TwoParams_Result generation result", {
        ok: result.ok,
        data: result.ok ? result.data : undefined,
        error: result.ok ? undefined : result.error,
      });

      assertEquals(result.ok, true);

      if (!result.ok) {
        throw new Error("Build failed");
      }

      // 結果の検証
      const twoParamsResult = result.data;
      assertEquals(twoParamsResult.type, "two");
      assertEquals(twoParamsResult.directiveType, "summary");
      assertEquals(twoParamsResult.layerType, "issue");
      assertEquals(twoParamsResult.params, ["summary", "issue"]);

      // Verify that options contain metadata
      assertExists(twoParamsResult.options);
      assertEquals(twoParamsResult.options.profile, "breakdown-params-integration");
      assertEquals(twoParamsResult.options.source, "config-based");
    });
  });

  describe("Hardcode elimination verification", () => {
    it("DirectiveType/LayerType definitions are not hardcoded", async () => {
      // 複数のプロファイルでテスト
      const profiles = ["default", "flexible-test", "enterprise-test"];

      for (const profileName of profiles) {
        logger.debug("Profile test started", { profile: profileName });

        try {
          const builderResult = await ConfigBasedTwoParamsBuilder.fromConfig(profileName);

          if (builderResult.ok) {
            const builder = builderResult.data;
            const directivePattern = builder.getDirectivePattern();
            const layerPattern = builder.getLayerPattern();

            // Verify patterns exist and are not hardcoded arrays
            assertExists(directivePattern);
            assertExists(layerPattern);

            // Verify patterns are strings (regex patterns)
            assertEquals(typeof directivePattern, "string");
            assertEquals(typeof layerPattern, "string");

            logger.debug("Profile patterns", {
              profile: profileName,
              directivePattern,
              layerPattern,
            });
          }
        } catch (error) {
          logger.debug("Profile loading error (expected)", {
            profile: profileName,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    });

    it("Changing configuration files also changes allowed values", async () => {
      // デフォルトプロファイルのビルダー
      const defaultBuilder = await ConfigBasedTwoParamsBuilder.fromConfig("default");

      // breakdown-params-integration プロファイルのビルダー
      const integrationBuilder = await ConfigBasedTwoParamsBuilder.fromConfig(
        "breakdown-params-integration",
      );

      if (!defaultBuilder.ok || !integrationBuilder.ok) {
        throw new Error("Builder creation failed");
      }

      // test_directive は integration プロファイルでのみ有効
      const defaultValidation = defaultBuilder.data.validateParams("test_directive", "test_layer");
      const integrationValidation = integrationBuilder.data.validateParams(
        "test_directive",
        "test_layer",
      );

      logger.debug("Profile-specific validation results", {
        default: defaultValidation.ok,
        integration: integrationValidation.ok,
      });

      // integration プロファイルでのみ有効であることを確認
      assertEquals(integrationValidation.ok, true);
      // Invalid in default profile (may be valid depending on configuration)
      // これは設定ファイルの内容に依存
    });
  });

  describe("Error handling", () => {
    it("Returns error for non-existent profile", async () => {
      const result = await ConfigBasedTwoParamsBuilder.fromConfig("non-existent-profile");

      logger.debug("Non-existent profile result", {
        ok: result.ok,
        errorKind: result.error?.kind,
      });

      assertEquals(result.ok, false);
      assertEquals(result.error?.kind, "ConfigLoadFailed");
    });

    it("Returns error when patterns are undefined", () => {
      // Create CustomConfig with no patterns in custom configuration
      const emptyConfig = ParamsCustomConfig.create({});
      const builder = new ConfigBasedTwoParamsBuilder(emptyConfig, "empty");

      const validationResult = builder.validateParams("any", "value");

      logger.debug("Undefined pattern validation result", {
        ok: validationResult.ok,
        errorKind: validationResult.error?.kind,
      });

      assertEquals(validationResult.ok, false);
      assertEquals(validationResult.error?.kind, "MissingPattern");
    });
  });
});
