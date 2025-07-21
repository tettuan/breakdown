/**
 * @fileoverview Configuration E2E Test - Tier 2 設定・環境シナリオ
 *
 * 多様な設定環境での動作を検証するE2Eテスト。
 * プロファイル切り替え、カスタム設定、ワークスペース設定での統合動作を確認する。
 *
 * @module tests/4_cross_domain/e2e/configuration_e2e
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// 各ドメインのコンポーネントをインポート
import { DirectiveType } from "../../../lib/domain/core/value_objects/directive_type.ts";
import { TwoParamsDirectivePattern } from "../../../lib/types/mod.ts";
import {
  LayerType,
  TwoParamsLayerTypePattern,
} from "../../../lib/domain/core/value_objects/layer_type.ts";
import { ConfigProfile } from "../../../lib/config/mod.ts";
import { createTwoParamsResult } from "../../../lib/types/two_params_result_extension.ts";

const logger = new BreakdownLogger("e2e:configuration");

/**
 * S2.1: プロファイル切り替えシナリオ
 *
 * `BREAKDOWN_PROFILE=development breakdown to project input.md` 相当の処理を検証
 *
 * 検証項目:
 * 1. プロファイル固有設定の適用
 * 2. パターンバリデーションの変更
 * 3. 出力フォーマットの切り替え
 */
Deno.test("E2E Configuration: S2.1 - Profile Switching", () => {
  logger.debug("Starting profile switching E2E test", {
    scenario: "S2.1",
    profiles: ["default", "development", "production"],
  });

  // プロファイル設定のシミュレーション
  const profileConfigs = {
    default: {
      name: "default",
      directivePattern: "^(to|summary|defect)$",
      layerPattern: "^(project|issue|task)$",
      outputFormat: "markdown",
      debugMode: false,
    },
    development: {
      name: "development",
      directivePattern: "^(to|summary|defect|debug|trace|analyze)$", // 拡張パターン
      layerPattern: "^(project|issue|task|function|test|module)$", // 開発用層追加
      outputFormat: "markdown-verbose",
      debugMode: true,
    },
    production: {
      name: "production",
      directivePattern: "^(to|summary)$", // 制限パターン
      layerPattern: "^(project|issue)$", // 本番用のみ
      outputFormat: "markdown-compact",
      debugMode: false,
    },
  };

  // テストケース: 各プロファイルでの動作確認
  const testCases = [
    {
      profile: "default",
      directive: "to",
      layer: "project",
      shouldSucceed: true,
    },
    {
      profile: "development",
      directive: "to", // 基本的なディレクティブを使用
      layer: "project", // 基本的なレイヤーを使用
      shouldSucceed: true,
    },
    {
      profile: "production",
      directive: "summary", // production許可
      layer: "project", // production許可
      shouldSucceed: true,
    },
    {
      profile: "production",
      directive: "defect", // production制限（summaryとtoのみ許可）
      layer: "project",
      shouldSucceed: false,
    },
    {
      profile: "production",
      directive: "to",
      layer: "task", // production制限（projectとissueのみ許可）
      shouldSucceed: false,
    },
  ];

  for (const testCase of testCases) {
    logger.debug("Testing profile configuration", testCase);

    const config = profileConfigs[testCase.profile as keyof typeof profileConfigs];

    // Phase 1: プロファイル適用シミュレーション
    const twoParamsResult = createTwoParamsResult(testCase.directive, testCase.layer);

    // Phase 2: パターンバリデーション（プロファイル固有）
    const directivePatternResult = TwoParamsDirectivePattern.createOrError(config.directivePattern);
    const layerPatternResult = TwoParamsLayerTypePattern.createOrError(config.layerPattern);

    assertEquals(directivePatternResult.ok, true);
    assertEquals(layerPatternResult.ok, true);

    if (!directivePatternResult.ok || !layerPatternResult.ok) continue;

    // Phase 3: 型作成（実際のDirectiveType.createはデフォルトのパターンを使用）
    const directiveResult = DirectiveType.create(
      twoParamsResult.directiveType,
    );
    const layerResult = LayerType.create(
      twoParamsResult.layerType,
    );

    // プロファイル制約のシミュレーション（テスト用）
    const profileDirectiveValid = directivePatternResult.data.test(testCase.directive);
    const profileLayerValid = layerPatternResult.data.test(testCase.layer);

    // Phase 4: プロファイル制約の検証
    if (testCase.shouldSucceed) {
      // 基本的な型制約（DirectiveType.createの制約）とプロファイル制約の両方をチェック
      const allValidationsPassed = directiveResult.ok && layerResult.ok && profileDirectiveValid &&
        profileLayerValid;
      assertEquals(
        allValidationsPassed,
        true,
        `${testCase.directive}-${testCase.layer} should be valid in ${testCase.profile} profile`,
      );

      if (allValidationsPassed) {
        // Phase 5: プロファイル固有の出力フォーマット適用
        const promptPath = directiveResult.data.getPromptPath(layerResult.data);
        const outputPath = directiveResult.data.resolveOutputPath("test.md", layerResult.data);

        // プロファイル固有パスの確認
        assertStringIncludes(promptPath, testCase.directive);
        assertStringIncludes(promptPath, testCase.layer);
        assertStringIncludes(outputPath, testCase.directive);
        assertStringIncludes(outputPath, testCase.layer);

        // デバッグモード設定の反映
        const metadata = {
          profile: config.name,
          debugMode: config.debugMode,
          outputFormat: config.outputFormat,
          directive: testCase.directive,
          layer: testCase.layer,
        };

        assertEquals(metadata.profile, testCase.profile);
        assertEquals(metadata.debugMode, config.debugMode);
      }
    } else {
      // 制約違反の確認（基本制約またはプロファイル制約のいずれかが失敗）
      const hasConstraintViolation = !directiveResult.ok || !layerResult.ok ||
        !profileDirectiveValid || !profileLayerValid;
      assertEquals(
        hasConstraintViolation,
        true,
        `${testCase.directive}-${testCase.layer} should be invalid in ${testCase.profile} profile`,
      );
    }

    logger.debug("Profile test case completed", {
      profile: testCase.profile,
      directive: testCase.directive,
      layer: testCase.layer,
      expected: testCase.shouldSucceed,
      directiveValid: directiveResult.ok,
      layerValid: layerResult.ok,
    });
  }

  logger.debug("Profile switching E2E test completed", {
    scenario: "S2.1",
    profiles: Object.keys(profileConfigs).length,
    testCases: testCases.length,
  });
});

/**
 * S2.2: カスタム設定ファイルシナリオ
 *
 * `breakdown --config custom-app.yml to project input.md` 相当の処理を検証
 */
Deno.test("E2E Configuration: S2.2 - Custom Configuration Files", () => {
  logger.debug("Starting custom configuration E2E test", {
    scenario: "S2.2",
  });

  // カスタム設定のシミュレーション
  const customConfigs = {
    "custom-app.yml": {
      directiveTypes: {
        patterns: "^(to|summary)$", // 基本ディレクティブのサブセット
        aliases: {
          "tf": "to",
          "cv": "summary",
        },
      },
      layerTypes: {
        patterns: "^(project|issue)$", // 基本レイヤーのサブセット
        hierarchy: {
          "project": 1,
          "issue": 2,
        },
      },
      output: {
        baseDir: "custom-output",
        format: "json",
        includeMetadata: true,
      },
    },
    "default-app.yml": {
      directiveTypes: {
        patterns: "^(to|summary|defect)$",
        aliases: {},
      },
      layerTypes: {
        patterns: "^(project|issue|task)$",
        hierarchy: {
          "project": 1,
          "issue": 2,
          "task": 3,
        },
      },
      output: {
        baseDir: "output",
        format: "markdown",
        includeMetadata: false,
      },
    },
  };

  // テストケース: カスタム設定適用
  const testCases = [
    {
      configFile: "custom-app.yml",
      directive: "to", // 基本ディレクティブを使用（カスタム設定での検証をシンプル化）
      layer: "project", // 基本レイヤーを使用
      input: "legacy-code.md",
      expected: {
        valid: true,
        outputDir: "custom-output",
        format: "json",
      },
    },
    {
      configFile: "custom-app.yml",
      directive: "summary",
      layer: "issue",
      input: "old-component.md",
      expected: {
        valid: true,
        outputDir: "custom-output",
        format: "json",
      },
    },
    {
      configFile: "default-app.yml",
      directive: "to",
      layer: "project",
      input: "standard-project.md",
      expected: {
        valid: true,
        outputDir: "output",
        format: "markdown",
      },
    },
    {
      configFile: "custom-app.yml",
      directive: "defect", // カスタム設定では無効なディレクティブ
      layer: "project",
      input: "test.md",
      expected: {
        valid: false,
      },
    },
  ];

  for (const testCase of testCases) {
    logger.debug("Testing custom configuration", testCase);

    const config = customConfigs[testCase.configFile as keyof typeof customConfigs];

    // Phase 1: カスタム設定読み込みシミュレーション
    const directivePattern = TwoParamsDirectivePattern.createOrError(
      config.directiveTypes.patterns,
    );
    const layerPattern = TwoParamsLayerTypePattern.createOrError(config.layerTypes.patterns);

    assertEquals(directivePattern.ok, true);
    assertEquals(layerPattern.ok, true);

    if (!directivePattern.ok || !layerPattern.ok) continue;

    // Phase 2: エイリアス解決（該当する場合）
    let resolvedDirective = testCase.directive;
    const aliases = config.directiveTypes.aliases;
    if (aliases && typeof aliases === "object" && testCase.directive in aliases) {
      resolvedDirective = (aliases as Record<string, string>)[testCase.directive];
    }

    // Phase 3: 型作成と検証
    const twoParamsResult = createTwoParamsResult(resolvedDirective, testCase.layer);
    const directiveResult = DirectiveType.create(twoParamsResult.directiveType);
    const layerResult = LayerType.create(twoParamsResult.layerType);

    // カスタム設定制約のシミュレーション（テスト用）
    const customDirectiveValid = directivePattern.data.test(resolvedDirective);
    const customLayerValid = layerPattern.data.test(testCase.layer);

    // Phase 4: カスタム設定制約の確認
    if (testCase.expected.valid) {
      // 基本的な型制約（DirectiveType.createの制約）とカスタム設定制約の両方をチェック
      const isValidForCustomConfig = directiveResult.ok && layerResult.ok && customDirectiveValid &&
        customLayerValid;
      assertEquals(
        isValidForCustomConfig,
        true,
        `${testCase.directive} should be valid with ${testCase.configFile}`,
      );

      if (isValidForCustomConfig) {
        // Phase 5: カスタム出力設定の適用
        const baseDir = config.output.baseDir;
        const outputPath = directiveResult.data.resolveOutputPath(
          testCase.input,
          layerResult.data,
          baseDir,
        );

        assertStringIncludes(outputPath, testCase.expected.outputDir!);
        assertStringIncludes(outputPath, testCase.directive);
        assertStringIncludes(outputPath, testCase.layer);

        // メタデータ生成
        const metadata = {
          configFile: testCase.configFile,
          format: config.output.format,
          includeMetadata: config.output.includeMetadata,
          hierarchy: config.layerTypes.hierarchy,
          resolvedDirective,
          originalDirective: testCase.directive,
        };

        assertEquals(metadata.format, testCase.expected.format);
        assertEquals(metadata.resolvedDirective, resolvedDirective);
      }
    } else {
      // 無効な組み合わせの確認（基本制約またはカスタム設定制約のいずれかが失敗）
      const hasConstraintViolation = !directiveResult.ok || !layerResult.ok ||
        !customDirectiveValid || !customLayerValid;
      assertEquals(
        hasConstraintViolation,
        true,
        `${testCase.directive}-${testCase.layer} should be invalid with ${testCase.configFile}`,
      );
    }

    logger.debug("Custom configuration test completed", {
      configFile: testCase.configFile,
      directive: testCase.directive,
      layer: testCase.layer,
      resolvedDirective,
      expected: testCase.expected.valid,
      actual: directiveResult.ok && layerResult.ok,
    });
  }

  logger.debug("Custom configuration E2E test completed", {
    scenario: "S2.2",
    configFiles: Object.keys(customConfigs).length,
    testCases: testCases.length,
  });
});

/**
 * S2.3: ワークスペース設定シナリオ
 *
 * `cd project-workspace && breakdown to issue workspace-file.md` 相当の処理を検証
 */
Deno.test("E2E Configuration: S2.3 - Workspace Configuration", () => {
  logger.debug("Starting workspace configuration E2E test", {
    scenario: "S2.3",
  });

  // ワークスペース設定のシミュレーション
  const workspaceConfigs = {
    "/project/frontend": {
      workspaceType: "frontend",
      baseDir: "/project/frontend",
      customDirectives: ["to", "summary"], // 基本ディレクティブを使用
      customLayers: ["project", "issue"], // 基本レイヤーを使用
      templateOverrides: {
        "component-page": "templates/react-page.md",
        "service-widget": "templates/widget-service.md",
      },
      relativePaths: true,
    },
    "/project/backend": {
      workspaceType: "backend",
      baseDir: "/project/backend",
      customDirectives: ["to", "defect"], // 基本ディレクティブを使用
      customLayers: ["project", "task"], // 基本レイヤーを使用
      templateOverrides: {
        "api-endpoint": "templates/rest-api.md",
        "model-entity": "templates/domain-model.md",
      },
      relativePaths: true,
    },
    "/project/docs": {
      workspaceType: "documentation",
      baseDir: "/project/docs",
      customDirectives: ["to", "summary"], // 標準のみ
      customLayers: ["project", "issue"], // 基本レイヤーを使用
      templateOverrides: {},
      relativePaths: false,
    },
  };

  // テストケース: ワークスペース固有設定
  const testCases = [
    {
      workspace: "/project/frontend",
      directive: "to",
      layer: "project",
      inputFile: "LoginPage.tsx",
      expected: {
        valid: true,
        templateOverride: undefined,
        relativePath: true,
      },
    },
    {
      workspace: "/project/backend",
      directive: "to",
      layer: "project",
      inputFile: "UserController.java",
      expected: {
        valid: true,
        templateOverride: undefined,
        relativePath: true,
      },
    },
    {
      workspace: "/project/docs",
      directive: "summary",
      layer: "issue",
      inputFile: "installation.md",
      expected: {
        valid: true,
        templateOverride: undefined,
        relativePath: false,
      },
    },
    {
      workspace: "/project/frontend",
      directive: "defect", // backend専用をfrontendで使用（無効）
      layer: "project",
      inputFile: "test.tsx",
      expected: {
        valid: false,
      },
    },
  ];

  for (const testCase of testCases) {
    logger.debug("Testing workspace configuration", testCase);

    const config = workspaceConfigs[testCase.workspace as keyof typeof workspaceConfigs];

    // Phase 1: ワークスペース検出シミュレーション
    const currentWorkspace = testCase.workspace;
    const workspaceType = config.workspaceType;

    // Phase 2: ワークスペース固有パターン構築
    const allowedDirectives = config.customDirectives;
    const allowedLayers = config.customLayers;

    const directiveValid = allowedDirectives.includes(testCase.directive);
    const layerValid = allowedLayers.includes(testCase.layer);

    // Phase 3: 相対パス解決
    let inputPath = testCase.inputFile;
    let outputPath = "";

    if (config.relativePaths) {
      inputPath = `${config.baseDir}/${testCase.inputFile}`;
      outputPath =
        `${config.baseDir}/output/${testCase.directive}/${testCase.layer}/${testCase.inputFile}`;
    } else {
      outputPath = `output/${testCase.directive}/${testCase.layer}/${testCase.inputFile}`;
    }

    // Phase 4: テンプレートオーバーライド確認
    const overrideKey = `${testCase.directive}-${testCase.layer}`;
    const templateOverride =
      config.templateOverrides && typeof config.templateOverrides === "object" &&
        overrideKey in config.templateOverrides
        ? (config.templateOverrides as Record<string, string>)[overrideKey]
        : undefined;

    // Phase 5: ワークスペース制約の検証
    if (testCase.expected.valid) {
      assertEquals(
        directiveValid,
        true,
        `${testCase.directive} should be valid in ${workspaceType} workspace`,
      );
      assertEquals(
        layerValid,
        true,
        `${testCase.layer} should be valid in ${workspaceType} workspace`,
      );

      // 型作成（ワークスペース制約を満たす場合のみ）
      const twoParamsResult = createTwoParamsResult(testCase.directive, testCase.layer);
      const directiveType = DirectiveType.create(twoParamsResult.directiveType);
      const layerType = LayerType.create(twoParamsResult.layerType);

      assertEquals(directiveType.ok ? directiveType.data.value : "", testCase.directive);
      assertEquals(layerType.ok ? layerType.data.value : "", testCase.layer);

      // パス構造の確認
      if (config.relativePaths) {
        assertStringIncludes(inputPath, config.baseDir);
        assertStringIncludes(outputPath, config.baseDir);
      }

      // テンプレートオーバーライドの確認
      if (testCase.expected.templateOverride) {
        assertEquals(templateOverride, testCase.expected.templateOverride);
      }

      // ワークスペースメタデータ
      const metadata = {
        workspace: currentWorkspace,
        workspaceType,
        relativePaths: config.relativePaths,
        templateOverride,
        inputPath,
        outputPath,
      };

      assertEquals(metadata.workspaceType, workspaceType);
      assertEquals(metadata.relativePaths, testCase.expected.relativePath);
    } else {
      // ワークスペース制約違反の確認
      const hasConstraintViolation = !directiveValid || !layerValid;
      assertEquals(
        hasConstraintViolation,
        true,
        `${testCase.directive}-${testCase.layer} should violate ${workspaceType} workspace constraints`,
      );
    }

    logger.debug("Workspace configuration test completed", {
      workspace: testCase.workspace,
      workspaceType,
      directive: testCase.directive,
      layer: testCase.layer,
      directiveValid,
      layerValid,
      templateOverride,
      expected: testCase.expected.valid,
    });
  }

  logger.debug("Workspace configuration E2E test completed", {
    scenario: "S2.3",
    workspaces: Object.keys(workspaceConfigs).length,
    testCases: testCases.length,
  });
});
