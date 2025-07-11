/**
 * @fileoverview Unit tests for UserPromptVariables
 *
 * Tests the UserPromptVariables class which manages user-defined variables
 * from CLI --uv-* options. Validates proper handling of variable creation,
 * validation, and CLI option parsing.
 *
 * @module prompt/variables/2_unit_user_prompt_variables_test
 */

import {
  assertEquals,
  assertExists as _assertExists,
} from "https://deno.land/std@0.211.0/assert/mod.ts";
import { UserPromptVariables } from "./user_prompt_variables.ts";

/**
 * Test: Basic creation with valid variables
 */
Deno.test("UserPromptVariables - creates with valid variables", () => {
  const result = UserPromptVariables.create({
    userName: "太郎",
    projectName: "マイプロジェクト",
    version: "1.0.0",
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.userName, "太郎");
    assertEquals(record.projectName, "マイプロジェクト");
    assertEquals(record.version, "1.0.0");
  }
});

/**
 * Test: Empty variables creation
 */
Deno.test("UserPromptVariables - creates empty instance", () => {
  const variables = UserPromptVariables.empty();

  assertEquals(variables.isEmpty(), true);
  assertEquals(variables.size(), 0);
  assertEquals(Object.keys(variables.toRecord()).length, 0);
});

/**
 * Test: Empty string validation - key
 */
Deno.test("UserPromptVariables - rejects empty key", () => {
  const result = UserPromptVariables.create({
    "": "value",
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyKey");
    if (result.error.kind === "EmptyKey") {
      assertEquals(result.error.key, "");
    }
  }
});

/**
 * Test: Empty string validation - whitespace key
 */
Deno.test("UserPromptVariables - rejects whitespace-only key", () => {
  const result = UserPromptVariables.create({
    "   ": "value",
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyKey");
    if (result.error.kind === "EmptyKey") {
      assertEquals(result.error.key, "   ");
    }
  }
});

/**
 * Test: Empty string validation - value
 */
Deno.test("UserPromptVariables - rejects empty value", () => {
  const result = UserPromptVariables.create({
    userName: "",
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyValue");
    if (result.error.kind === "EmptyValue") {
      assertEquals(result.error.key, "userName");
    }
  }
});

/**
 * Test: Empty string validation - whitespace value
 */
Deno.test("UserPromptVariables - rejects whitespace-only value", () => {
  const result = UserPromptVariables.create({
    userName: "   ",
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyValue");
    if (result.error.kind === "EmptyValue") {
      assertEquals(result.error.key, "userName");
    }
  }
});

/**
 * Test: Null/undefined validation
 */
Deno.test("UserPromptVariables - rejects null/undefined values", () => {
  const resultNull = UserPromptVariables.create({
    userName: null as unknown as string,
  });

  assertEquals(resultNull.ok, false);
  if (!resultNull.ok) {
    assertEquals(resultNull.error.kind, "NullOrUndefined");
    if (resultNull.error.kind === "NullOrUndefined") {
      assertEquals(resultNull.error.key, "userName");
    }
  }

  const resultUndefined = UserPromptVariables.create({
    userName: undefined as unknown as string,
  });

  assertEquals(resultUndefined.ok, false);
  if (!resultUndefined.ok) {
    assertEquals(resultUndefined.error.kind, "NullOrUndefined");
    if (resultUndefined.error.kind === "NullOrUndefined") {
      assertEquals(resultUndefined.error.key, "userName");
    }
  }
});

/**
 * Test: Value trimming
 */
Deno.test("UserPromptVariables - trims values", () => {
  const result = UserPromptVariables.create({
    userName: "  太郎  ",
    projectName: "\tマイプロジェクト\n",
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.userName, "太郎");
    assertEquals(record.projectName, "マイプロジェクト");
  }
});

/**
 * Test: Individual variable access
 */
Deno.test("UserPromptVariables - provides individual access methods", () => {
  const result = UserPromptVariables.create({
    userName: "太郎",
    projectName: "マイプロジェクト",
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const variables = result.data;

    const getUser = variables.get("userName");
    assertEquals(getUser.ok, true);
    if (getUser.ok) {
      assertEquals(getUser.data, "太郎");
    }

    const getProject = variables.get("projectName");
    assertEquals(getProject.ok, true);
    if (getProject.ok) {
      assertEquals(getProject.data, "マイプロジェクト");
    }

    const getNonexistent = variables.get("nonexistent");
    assertEquals(getNonexistent.ok, false);

    assertEquals(variables.has("userName"), true);
    assertEquals(variables.has("nonexistent"), false);

    assertEquals(variables.size(), 2);
    assertEquals(variables.keys().sort(), ["projectName", "userName"]);
  }
});

/**
 * Test: fromOptions method - CLI option parsing
 */
Deno.test("UserPromptVariables - fromOptions parses CLI --uv-* options", () => {
  const options = {
    "uv-userName": "太郎",
    "uv-projectName": "マイプロジェクト",
    "uv-version": "1.0.0",
    // Non-uv options should be ignored
    "from": "input.md",
    "to": "output.md",
    "help": true,
  };

  const result = UserPromptVariables.fromOptions(options);
  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.userName, "太郎");
    assertEquals(record.projectName, "マイプロジェクト");
    assertEquals(record.version, "1.0.0");
    assertEquals(record.from, undefined);
    assertEquals(record.to, undefined);
    assertEquals(record.help, undefined);
  }
});

/**
 * Test: fromOptions method - invalid uv prefix handling
 */
Deno.test("UserPromptVariables - fromOptions ignores invalid uv prefix", () => {
  const options = {
    "uv": "invalid", // Too short, should be ignored
    "uv-": "invalid", // Too short (length = 3), should be ignored
    "uvtest": "ignored", // Doesn't start with uv-, should be ignored
    "uv-validVar": "valid",
  };

  // Should not throw because "uv-" is ignored due to length check
  const result = UserPromptVariables.fromOptions(options);
  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.validVar, "valid");
    assertEquals(Object.keys(record).length, 1);
    assertEquals(record.uv, undefined);
    assertEquals(record.uvtest, undefined);
  }
});

/**
 * Test: fromOptions method - only valid uv options
 */
Deno.test("UserPromptVariables - fromOptions with only valid uv options", () => {
  const options = {
    "uv-name": "test",
    "uvtest": "ignored", // No hyphen, should be ignored
    "uv": "ignored", // Too short, should be ignored
  };

  const result = UserPromptVariables.fromOptions(options);
  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.name, "test");
    assertEquals(Object.keys(record).length, 1);
  }
});

/**
 * Test: fromOptions method - type conversion
 */
Deno.test("UserPromptVariables - fromOptions converts types to string", () => {
  const options = {
    "uv-number": 123,
    "uv-boolean": true,
    "uv-array": [1, 2, 3],
    "uv-object": { test: "value" },
  };

  const result = UserPromptVariables.fromOptions(options);
  assertEquals(result.ok, true);
  if (result.ok) {
    const record = result.data.toRecord();
    assertEquals(record.number, "123");
    assertEquals(record.boolean, "true");
    assertEquals(record.array, "1,2,3");
    assertEquals(record.object, "[object Object]");
  }
});

/**
 * Test: fromOptions method - empty options
 */
Deno.test("UserPromptVariables - fromOptions with empty options", () => {
  const result = UserPromptVariables.fromOptions({});
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.isEmpty(), true);
    assertEquals(result.data.size(), 0);
  }
});

/**
 * Test: fromOptions method - validation after parsing
 */
Deno.test("UserPromptVariables - fromOptions validates parsed values", () => {
  // Should return error because empty string after string conversion
  const result = UserPromptVariables.fromOptions({
    "uv-empty": "",
  });

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "EmptyValue");
    if (result.error.kind === "EmptyValue") {
      assertEquals(result.error.key, "empty");
    }
  }
});

/**
 * Test: Immutability methods
 */
Deno.test("UserPromptVariables - immutable operations", () => {
  const result = UserPromptVariables.create({
    userName: "太郎",
    projectName: "プロジェクト",
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const original = result.data;

    // Test with() method
    const withResult = original.with("version", "1.0.0");
    assertEquals(withResult.ok, true);
    if (withResult.ok) {
      const withNew = withResult.data;
      assertEquals(original.size(), 2);
      assertEquals(withNew.size(), 3);
      const versionResult = withNew.get("version");
      assertEquals(versionResult.ok, true);
      if (versionResult.ok) {
        assertEquals(versionResult.data, "1.0.0");
      }
    }

    // Test without() method
    const withoutUser = original.without("userName");
    assertEquals(original.size(), 2);
    assertEquals(withoutUser.size(), 1);
    assertEquals(withoutUser.has("userName"), false);
    assertEquals(withoutUser.has("projectName"), true);

    // Test merge() method
    const mergedResult = original.merge({
      environment: "development",
      debug: "true",
    });
    assertEquals(mergedResult.ok, true);
    if (mergedResult.ok) {
      const merged = mergedResult.data;
      assertEquals(original.size(), 2);
      assertEquals(merged.size(), 4);
      const envResult = merged.get("environment");
      assertEquals(envResult.ok, true);
      if (envResult.ok) {
        assertEquals(envResult.data, "development");
      }
      const debugResult = merged.get("debug");
      assertEquals(debugResult.ok, true);
      if (debugResult.ok) {
        assertEquals(debugResult.data, "true");
      }
    }
  }
});

/**
 * Test: with() method validation
 */
Deno.test("UserPromptVariables - with() validates new variables", () => {
  const createResult = UserPromptVariables.create({
    userName: "太郎",
  });

  assertEquals(createResult.ok, true);
  if (createResult.ok) {
    const variables = createResult.data;

    const emptyKeyResult = variables.with("", "value");
    assertEquals(emptyKeyResult.ok, false);
    if (!emptyKeyResult.ok) {
      assertEquals(emptyKeyResult.error.kind, "EmptyKey");
      if (emptyKeyResult.error.kind === "EmptyKey") {
        assertEquals(emptyKeyResult.error.key, "");
      }
    }

    const emptyValueResult = variables.with("test", "");
    assertEquals(emptyValueResult.ok, false);
    if (!emptyValueResult.ok) {
      assertEquals(emptyValueResult.error.kind, "EmptyValue");
      if (emptyValueResult.error.kind === "EmptyValue") {
        assertEquals(emptyValueResult.error.key, "test");
      }
    }

    const nullValueResult = variables.with("test", null as unknown as string);
    assertEquals(nullValueResult.ok, false);
    if (!nullValueResult.ok) {
      assertEquals(nullValueResult.error.kind, "NullOrUndefined");
      if (nullValueResult.error.kind === "NullOrUndefined") {
        assertEquals(nullValueResult.error.key, "test");
      }
    }
  }
});

/**
 * Test: merge() method validation
 */
Deno.test("UserPromptVariables - merge() validates merged variables", () => {
  const createResult = UserPromptVariables.create({
    userName: "太郎",
  });

  assertEquals(createResult.ok, true);
  if (createResult.ok) {
    const variables = createResult.data;

    const emptyKeyResult = variables.merge({
      "": "value",
    });
    assertEquals(emptyKeyResult.ok, false);
    if (!emptyKeyResult.ok) {
      assertEquals(emptyKeyResult.error.kind, "EmptyKey");
      if (emptyKeyResult.error.kind === "EmptyKey") {
        assertEquals(emptyKeyResult.error.key, "");
      }
    }

    const emptyValueResult = variables.merge({
      test: "",
    });
    assertEquals(emptyValueResult.ok, false);
    if (!emptyValueResult.ok) {
      assertEquals(emptyValueResult.error.kind, "EmptyValue");
      if (emptyValueResult.error.kind === "EmptyValue") {
        assertEquals(emptyValueResult.error.key, "test");
      }
    }
  }
});

/**
 * Test: toRecord() returns copy
 */
Deno.test("UserPromptVariables - toRecord returns immutable copy", () => {
  const result = UserPromptVariables.create({
    userName: "太郎",
  });

  assertEquals(result.ok, true);
  if (result.ok) {
    const variables = result.data;
    const record1 = variables.toRecord();
    const record2 = variables.toRecord();

    // Should be equal but not the same object
    assertEquals(record1, record2);
    assertEquals(record1 === record2, false);

    // Modifying returned record should not affect original
    record1.newField = "added";
    assertEquals(variables.has("newField"), false);
    assertEquals(record2.newField, undefined);
  }
});
