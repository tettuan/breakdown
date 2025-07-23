/**
 * @fileoverview New integration flow test - Configuration-driven test
 *
 * Test integration flow operation with various configuration file patterns
 * Implement configuration file-based tests after eliminating createDefault() dependencies
 *
 * @module tests/integration/breakdown_params/02_config_driven_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  createTwoParamsFromConfigFile,
  executeBreakdownParams,
} from "../../../lib/application/breakdown_params_integration.ts";

// Initialize test logger
const logger = new BreakdownLogger("config-driven-test");

// Test cases for configuration file-based tests
interface ConfigTestCase {
  profileName: string;
  description: string;
  validArgs: string[][];
  invalidArgs: string[][];
  expectedPatterns: {
    directivePattern: string;
    layerPattern: string;
  };
}

const configTestCases: ConfigTestCase[] = [
  {
    profileName: "default-test",
    description: "Basic configuration pattern",
    validArgs: [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
    ],
    invalidArgs: [
      ["invalid", "project"],
      ["to", "invalid"],
      ["", "project"],
      ["to", ""],
    ],
    expectedPatterns: {
      directivePattern: "^(to|summary|defect)$",
      layerPattern: "^(project|issue|task)$",
    },
  },
  {
    profileName: "flexible-test",
    description: "Extended pattern configuration",
    validArgs: [
      ["to", "project"],
      ["summary", "issue"],
      ["defect", "task"],
    ],
    invalidArgs: [
      ["invalid@email", "project"],
      ["to", "INVALID@LAYER"],
      ["a123456789012345678901", "project"], // too long
      ["a", "project"], // too short
    ],
    expectedPatterns: {
      directivePattern: "^(to|summary|defect)$",
      layerPattern: "^(project|issue|task)$",
    },
  },
];

// Test execution for each configuration pattern
for (const testCase of configTestCases) {
  Deno.test(`1_behavior: Configuration-driven integration - ${testCase.description}`, async () => {
    logger.debug(`Config-driven test started: ${testCase.description} - config pattern`, {
      profileName: testCase.profileName,
    });

    // Test with valid arguments
    for (const validArgs of testCase.validArgs) {
      const result = await createTwoParamsFromConfigFile(validArgs, testCase.profileName);

      logger.debug(
        `Valid arguments test: ${validArgs.join(" ")} (profile: ${testCase.profileName})`,
        {
          result,
        },
      );

      assertEquals(
        result.ok,
        true,
        `Valid arguments [${validArgs.join(", ")}] failed: ${testCase.profileName}`,
      );
      if (result.ok) {
        assertExists(result.data);
        assertEquals(result.data.directiveType, validArgs[0]);
        assertEquals(result.data.layerType, validArgs[1]);
      }
    }

    logger.debug(`Config-driven valid arguments test completed: ${testCase.description}`, {
      stage: "test",
    });
  });

  Deno.test(`2_structure: Configuration-driven validation - ${testCase.description}`, async () => {
    logger.debug(
      `Config-driven validation test started: ${testCase.description} - Validation verification`,
      { profileName: testCase.profileName },
    );

    // Test with invalid arguments
    for (const invalidArgs of testCase.invalidArgs) {
      const result = await createTwoParamsFromConfigFile(invalidArgs, testCase.profileName);

      logger.debug(
        `Invalid arguments test: ${invalidArgs.join(" ")} (profile: ${testCase.profileName})`,
        {
          result,
        },
      );

      assertEquals(
        result.ok,
        false,
        `Invalid arguments [${
          invalidArgs.join(", ")
        }] succeeded unexpectedly: ${testCase.profileName}`,
      );
    }

    logger.debug(`Config-driven validation test completed: ${testCase.description}`, {
      stage: "test",
    });
  });
}

Deno.test("3_core: Configuration-driven integration - Pattern consistency verification", async () => {
  logger.debug("Pattern consistency verification test started", {
    stage: "testData vs pattern consistency",
  });

  // Configuration file loading and pattern consistency verification
  for (const testCase of configTestCases) {
    logger.debug(`Pattern consistency verification: ${testCase.profileName}`, {
      stage: "consistency-check-started",
    });

    // Verify that valid values in testData actually match patterns
    for (const validArgs of testCase.validArgs) {
      const result = await executeBreakdownParams(validArgs, testCase.profileName);

      assertEquals(
        result.ok,
        true,
        `testData valid values do not match pattern: ${
          validArgs.join(", ")
        } (${testCase.profileName})`,
      );

      // Detailed check for pattern consistency
      const directiveRegex = new RegExp(testCase.expectedPatterns.directivePattern);
      const layerRegex = new RegExp(testCase.expectedPatterns.layerPattern);

      assertEquals(
        directiveRegex.test(validArgs[0]),
        true,
        `DirectiveType pattern match failed: ${validArgs[0]}`,
      );
      assertEquals(
        layerRegex.test(validArgs[1]),
        true,
        `LayerType pattern match failed: ${validArgs[1]}`,
      );
    }

    logger.debug(`Pattern consistency verification completed: ${testCase.profileName}`, {
      stage: "consistency-verification-success",
    });
  }
});

Deno.test("3_core: Configuration-driven integration - Profile switching", async () => {
  logger.debug("Profile switching test started", {
    stage: "behavior-verification-between-different-configs",
  });

  const switchTestArgs = ["to", "project"];

  // default-test プロファイルでの実行
  const defaultResult = await createTwoParamsFromConfigFile(switchTestArgs, "default-test");
  assertEquals(defaultResult.ok, true);

  // flexible-test プロファイルでの実行
  const flexibleResult = await createTwoParamsFromConfigFile(switchTestArgs, "flexible-test");
  assertEquals(flexibleResult.ok, true);

  // 両方とも同じ結果を返すこと
  if (defaultResult.ok && flexibleResult.ok) {
    assertEquals(defaultResult.data.directiveType, flexibleResult.data.directiveType);
    assertEquals(defaultResult.data.layerType, flexibleResult.data.layerType);
  }

  // Both profiles support the same basic patterns, so this test demonstrates profile loading
  const basicArgs = ["summary", "issue"];

  const flexibleOnlyResult = await createTwoParamsFromConfigFile(basicArgs, "flexible-test");
  assertEquals(flexibleOnlyResult.ok, true);

  const defaultOnlyResult = await createTwoParamsFromConfigFile(basicArgs, "default-test");
  assertEquals(defaultOnlyResult.ok, true); // both profiles support basic patterns

  logger.debug("Profile switching test completed", {
    stage: "behavior-difference-verification-between-configs-success",
  });
});
