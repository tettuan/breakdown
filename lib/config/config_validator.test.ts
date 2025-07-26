/**
 * @fileoverview Configuration validator tests
 */

import { assertEquals } from "@std/assert";
import {
  createSafeConfigData,
  getMissingRequiredFields,
  validateConfigData,
} from "./config_validator.ts";

Deno.test("ConfigValidator - validateConfigData with valid configuration", () => {
  const validConfig = {
    directiveTypes: ["to", "summary", "defect"],
    layerTypes: ["project", "issue", "task"],
  };

  const result = validateConfigData(validConfig);
  assertEquals(result.ok, true);
});

Deno.test("ConfigValidator - validateConfigData with missing required fields", () => {
  const invalidConfig = {
    directiveTypes: ["to", "summary"],
    // layerTypes is missing
  };

  const result = validateConfigData(invalidConfig, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-missing-required");
    assertEquals(result.error.message.includes("layerTypes"), true);
    assertEquals(result.error.message.includes("test-user.yml"), true);
  }
});

Deno.test("ConfigValidator - validateConfigData with invalid types", () => {
  const invalidConfig = {
    directiveTypes: "invalid", // should be array
    layerTypes: ["project", "task"],
  };

  const result = validateConfigData(invalidConfig, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-validation-failed");
    assertEquals(result.error.message.includes("Expected array, got string"), true);
  }
});

Deno.test("ConfigValidator - validateConfigData with empty arrays", () => {
  const invalidConfig = {
    directiveTypes: [],
    layerTypes: ["project"],
  };

  const result = validateConfigData(invalidConfig, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-validation-failed");
    assertEquals(result.error.message.includes("at least 1 items"), true);
  }
});

Deno.test("ConfigValidator - validateConfigData with params.two structure", () => {
  const configWithParamsTwo = {
    directiveTypes: ["to", "summary"],
    layerTypes: ["project", "task"],
    params: {
      two: {
        directiveType: {
          pattern: "^(to|summary|defect)$",
        },
        layerType: {
          pattern: "^(project|issue|task)$",
        },
      },
    },
  };

  const result = validateConfigData(configWithParamsTwo, "test");
  assertEquals(result.ok, true);
});

Deno.test("ConfigValidator - validateConfigData with missing params.two.directiveType.pattern", () => {
  const invalidConfig = {
    directiveTypes: ["to", "summary"],
    layerTypes: ["project", "task"],
    params: {
      two: {
        directiveType: {
          // pattern is missing
        },
        layerType: {
          pattern: "^(project|issue|task)$",
        },
      },
    },
  };

  const result = validateConfigData(invalidConfig, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-missing-required");
    assertEquals(
      result.error.message.includes("params.two.directiveType.pattern in test-user.yml"),
      true,
    );
  }
});

Deno.test("ConfigValidator - validateConfigData with null input", () => {
  const result = validateConfigData(null, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-not-found");
  }
});

Deno.test("ConfigValidator - validateConfigData with duplicate values", () => {
  const configWithDuplicates = {
    directiveTypes: ["to", "summary", "to"], // duplicate 'to'
    layerTypes: ["project", "task"],
  };

  const result = validateConfigData(configWithDuplicates, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-validation-failed");
    assertEquals(result.error.message.includes("Duplicate values are not allowed"), true);
  }
});

Deno.test("ConfigValidator - getMissingRequiredFields", () => {
  const partialConfig = {
    directiveTypes: ["to", "summary"],
    // layerTypes is missing
  };

  const missingFields = getMissingRequiredFields(partialConfig);
  assertEquals(missingFields, ["layerTypes"]);
});

Deno.test("ConfigValidator - getMissingRequiredFields with null config", () => {
  const missingFields = getMissingRequiredFields(null);
  assertEquals(missingFields, ["directiveTypes", "layerTypes"]);
});

Deno.test("ConfigValidator - createSafeConfigData with defaults", () => {
  const safeConfig = createSafeConfigData();

  assertEquals(Array.isArray(safeConfig.directiveTypes), true);
  assertEquals(Array.isArray(safeConfig.layerTypes), true);
  assertEquals((safeConfig.directiveTypes as string[]).length > 0, true);
  assertEquals((safeConfig.layerTypes as string[]).length > 0, true);
});

Deno.test("ConfigValidator - createSafeConfigData with partial config merge", () => {
  const partialConfig = {
    directiveTypes: ["custom-directive"],
    customField: "custom-value",
  };

  const safeConfig = createSafeConfigData(partialConfig);

  assertEquals(safeConfig.directiveTypes, ["custom-directive"]);
  assertEquals(safeConfig.customField, "custom-value");
  assertEquals(Array.isArray(safeConfig.layerTypes), true); // should have default
});

Deno.test("ConfigValidator - detailed error messages", () => {
  const invalidConfig = {
    directiveTypes: ["to", 123, "summary"], // invalid type in array
    layerTypes: ["project", "task"],
  };

  const result = validateConfigData(invalidConfig, "custom-profile");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-validation-failed");
    assertEquals(result.error.message.includes("custom-profile-user.yml"), true);
    assertEquals(result.error.message.includes("directiveTypes[1]"), true);
    assertEquals(result.error.message.includes("must be of type string, got number"), true);
  }
});

Deno.test("ConfigValidator - path validation", () => {
  const configWithPaths = {
    directiveTypes: ["to", "summary"],
    layerTypes: ["project", "task"],
    app_prompt: {
      basedir: "invalid/path/with/spaces and special chars!@#",
    },
  };

  const result = validateConfigData(configWithPaths, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-validation-failed");
    assertEquals(result.error.message.includes("does not match required pattern"), true);
  }
});

Deno.test("ConfigValidator - empty string validation", () => {
  const configWithEmptyStrings = {
    directiveTypes: ["to", "", "summary"], // empty string
    layerTypes: ["project", "task"],
  };

  const result = validateConfigData(configWithEmptyStrings, "test");
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "config-validation-failed");
    assertEquals(result.error.message.includes("Empty string values are not allowed"), true);
    assertEquals(result.error.message.includes("directiveTypes[1]"), true);
  }
});
