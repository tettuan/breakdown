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
  assertThrows,
} from "https://deno.land/std@0.211.0/assert/mod.ts";
import { UserPromptVariables } from "./user_prompt_variables.ts";

/**
 * Test: Basic creation with valid variables
 */
Deno.test("UserPromptVariables - creates with valid variables", () => {
  const variables = UserPromptVariables.create({
    userName: "太郎",
    projectName: "マイプロジェクト",
    version: "1.0.0",
  });

  const record = variables.toRecord();
  assertEquals(record.userName, "太郎");
  assertEquals(record.projectName, "マイプロジェクト");
  assertEquals(record.version, "1.0.0");
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
  assertThrows(
    () => {
      UserPromptVariables.create({
        "": "value",
      });
    },
    Error,
    "Variable key cannot be empty",
  );
});

/**
 * Test: Empty string validation - whitespace key
 */
Deno.test("UserPromptVariables - rejects whitespace-only key", () => {
  assertThrows(
    () => {
      UserPromptVariables.create({
        "   ": "value",
      });
    },
    Error,
    "Variable key cannot be empty",
  );
});

/**
 * Test: Empty string validation - value
 */
Deno.test("UserPromptVariables - rejects empty value", () => {
  assertThrows(
    () => {
      UserPromptVariables.create({
        userName: "",
      });
    },
    Error,
    "Variable value for 'userName' cannot be empty",
  );
});

/**
 * Test: Empty string validation - whitespace value
 */
Deno.test("UserPromptVariables - rejects whitespace-only value", () => {
  assertThrows(
    () => {
      UserPromptVariables.create({
        userName: "   ",
      });
    },
    Error,
    "Variable value for 'userName' cannot be empty",
  );
});

/**
 * Test: Null/undefined validation
 */
Deno.test("UserPromptVariables - rejects null/undefined values", () => {
  assertThrows(
    () => {
      UserPromptVariables.create({
        userName: null as unknown as string,
      });
    },
    Error,
    "Variable value for 'userName' cannot be null or undefined",
  );

  assertThrows(
    () => {
      UserPromptVariables.create({
        userName: undefined as unknown as string,
      });
    },
    Error,
    "Variable value for 'userName' cannot be null or undefined",
  );
});

/**
 * Test: Value trimming
 */
Deno.test("UserPromptVariables - trims values", () => {
  const variables = UserPromptVariables.create({
    userName: "  太郎  ",
    projectName: "\tマイプロジェクト\n",
  });

  const record = variables.toRecord();
  assertEquals(record.userName, "太郎");
  assertEquals(record.projectName, "マイプロジェクト");
});

/**
 * Test: Individual variable access
 */
Deno.test("UserPromptVariables - provides individual access methods", () => {
  const variables = UserPromptVariables.create({
    userName: "太郎",
    projectName: "マイプロジェクト",
  });

  assertEquals(variables.get("userName"), "太郎");
  assertEquals(variables.get("projectName"), "マイプロジェクト");
  assertEquals(variables.get("nonexistent"), undefined);

  assertEquals(variables.has("userName"), true);
  assertEquals(variables.has("nonexistent"), false);

  assertEquals(variables.size(), 2);
  assertEquals(variables.keys().sort(), ["projectName", "userName"]);
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

  const variables = UserPromptVariables.fromOptions(options);
  const record = variables.toRecord();

  assertEquals(record.userName, "太郎");
  assertEquals(record.projectName, "マイプロジェクト");
  assertEquals(record.version, "1.0.0");
  assertEquals(record.from, undefined);
  assertEquals(record.to, undefined);
  assertEquals(record.help, undefined);
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
  const variables = UserPromptVariables.fromOptions(options);
  const record = variables.toRecord();

  assertEquals(record.validVar, "valid");
  assertEquals(Object.keys(record).length, 1);
  assertEquals(record.uv, undefined);
  assertEquals(record.uvtest, undefined);
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

  const variables = UserPromptVariables.fromOptions(options);
  const record = variables.toRecord();

  assertEquals(record.name, "test");
  assertEquals(Object.keys(record).length, 1);
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

  const variables = UserPromptVariables.fromOptions(options);
  const record = variables.toRecord();

  assertEquals(record.number, "123");
  assertEquals(record.boolean, "true");
  assertEquals(record.array, "1,2,3");
  assertEquals(record.object, "[object Object]");
});

/**
 * Test: fromOptions method - empty options
 */
Deno.test("UserPromptVariables - fromOptions with empty options", () => {
  const variables = UserPromptVariables.fromOptions({});

  assertEquals(variables.isEmpty(), true);
  assertEquals(variables.size(), 0);
});

/**
 * Test: fromOptions method - validation after parsing
 */
Deno.test("UserPromptVariables - fromOptions validates parsed values", () => {
  // Should throw because empty string after string conversion
  assertThrows(
    () => {
      UserPromptVariables.fromOptions({
        "uv-empty": "",
      });
    },
    Error,
    "Variable value for 'empty' cannot be empty",
  );
});

/**
 * Test: Immutability methods
 */
Deno.test("UserPromptVariables - immutable operations", () => {
  const original = UserPromptVariables.create({
    userName: "太郎",
    projectName: "プロジェクト",
  });

  // Test with() method
  const withNew = original.with("version", "1.0.0");
  assertEquals(original.size(), 2);
  assertEquals(withNew.size(), 3);
  assertEquals(withNew.get("version"), "1.0.0");

  // Test without() method
  const withoutUser = original.without("userName");
  assertEquals(original.size(), 2);
  assertEquals(withoutUser.size(), 1);
  assertEquals(withoutUser.has("userName"), false);
  assertEquals(withoutUser.has("projectName"), true);

  // Test merge() method
  const merged = original.merge({
    environment: "development",
    debug: "true",
  });
  assertEquals(original.size(), 2);
  assertEquals(merged.size(), 4);
  assertEquals(merged.get("environment"), "development");
  assertEquals(merged.get("debug"), "true");
});

/**
 * Test: with() method validation
 */
Deno.test("UserPromptVariables - with() validates new variables", () => {
  const variables = UserPromptVariables.create({
    userName: "太郎",
  });

  assertThrows(
    () => {
      variables.with("", "value");
    },
    Error,
    "Variable key cannot be empty",
  );

  assertThrows(
    () => {
      variables.with("test", "");
    },
    Error,
    "Variable value for 'test' cannot be empty",
  );

  assertThrows(
    () => {
      variables.with("test", null as unknown as string);
    },
    Error,
    "Variable value for 'test' cannot be null or undefined",
  );
});

/**
 * Test: merge() method validation
 */
Deno.test("UserPromptVariables - merge() validates merged variables", () => {
  const variables = UserPromptVariables.create({
    userName: "太郎",
  });

  assertThrows(
    () => {
      variables.merge({
        "": "value",
      });
    },
    Error,
    "Variable key cannot be empty",
  );

  assertThrows(
    () => {
      variables.merge({
        test: "",
      });
    },
    Error,
    "Variable value for 'test' cannot be empty",
  );
});

/**
 * Test: toRecord() returns copy
 */
Deno.test("UserPromptVariables - toRecord returns immutable copy", () => {
  const variables = UserPromptVariables.create({
    userName: "太郎",
  });

  const record1 = variables.toRecord();
  const record2 = variables.toRecord();

  // Should be equal but not the same object
  assertEquals(record1, record2);
  assertEquals(record1 === record2, false);

  // Modifying returned record should not affect original
  record1.newField = "added";
  assertEquals(variables.has("newField"), false);
  assertEquals(record2.newField, undefined);
});
