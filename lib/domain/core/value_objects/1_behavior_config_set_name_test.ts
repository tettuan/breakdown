/**
 * @fileoverview Behavior tests for ConfigSetName Value Object
 *
 * This test suite validates the domain logic and business rules
 * of the ConfigSetName implementation:
 * - Validation rules (empty, format, length, characters)
 * - Reserved name restrictions
 * - Reserved prefix restrictions
 * - Factory method behaviors
 * - Edge case handling
 * - Business rule enforcement
 */

import { assertEquals } from "jsr:@std/assert";
import {
  ConfigSetName,
  ConfigSetNameCollection,
  type ConfigSetNameError,
} from "./config_set_name.ts";

// ============================================================================
// Empty Name Validation Tests
// ============================================================================

Deno.test("1_behavior: rejects null and undefined inputs", () => {
  const nullResult = ConfigSetName.create(null as any);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "EmptyName");
    assertEquals(nullResult.error.message.includes("null or undefined"), true);
  }

  const undefinedResult = ConfigSetName.create(undefined as any);
  assertEquals(undefinedResult.ok, false);
  if (!undefinedResult.ok) {
    assertEquals(undefinedResult.error.kind, "EmptyName");
    assertEquals(undefinedResult.error.message.includes("null or undefined"), true);
  }
});

Deno.test("1_behavior: rejects empty string and whitespace-only inputs", () => {
  const emptyResult = ConfigSetName.create("");
  assertEquals(emptyResult.ok, false);
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "EmptyName");
    assertEquals(emptyResult.error.message.includes("empty"), true);
  }

  const whitespaceInputs = [
    " ",
    "   ",
    "\t",
    "\n",
    "\r",
    "\t\n\r",
    "   \t   ",
  ];

  whitespaceInputs.forEach((input) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, false, `Should reject whitespace: "${input}"`);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyName");
      assertEquals(result.error.message.includes("whitespace"), true);
    }
  });
});

Deno.test("1_behavior: rejects non-string inputs with InvalidFormat error", () => {
  const nonStringInputs = [
    { input: 123, desc: "number" },
    { input: true, desc: "boolean" },
    { input: false, desc: "boolean" },
    { input: {}, desc: "object" },
    { input: [], desc: "array" },
    { input: () => {}, desc: "function" },
    { input: Symbol("test"), desc: "symbol" },
    { input: new Date(), desc: "Date" },
  ];

  nonStringInputs.forEach(({ input, desc }) => {
    const result = ConfigSetName.create(input as any);
    assertEquals(result.ok, false, `Should reject ${desc}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      assertEquals(result.error.message.includes("must be a string"), true);
    }
  });
});

// ============================================================================
// Format Validation Tests
// ============================================================================

Deno.test("1_behavior: accepts valid alphanumeric names with hyphens and underscores", () => {
  const validNames = [
    // Simple names
    "myconfig",
    "mysettings",
    "preferences",
    // With numbers
    "myconfig123",
    "123myconfig",
    "c0nf1g",
    // With hyphens
    "my-config",
    "my-config-set-name",
    "multi-word-config",
    // With underscores
    "my_config",
    "config_set_name",
    "multi_word_config",
    // Mixed
    "my-config_123",
    "CONFIG_SET-name",
    // Single character
    "a",
    "1",
    // Max allowed characters
    "valid-with_Numbers123_and-Symbols",
  ];

  validNames.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true, `Should accept: ${name}`);
    if (result.ok) {
      assertEquals(result.data.value, name);
    }
  });
});

Deno.test("1_behavior: rejects invalid characters", () => {
  const invalidCharTests = [
    { input: "config space", chars: [" "] },
    { input: "config@name", chars: ["@"] },
    { input: "config#name", chars: ["#"] },
    { input: "config$name", chars: ["$"] },
    { input: "config%name", chars: ["%"] },
    { input: "config^name", chars: ["^"] },
    { input: "config&name", chars: ["&"] },
    { input: "config*name", chars: ["*"] },
    { input: "config(name)", chars: ["(", ")"] },
    { input: "config[name]", chars: ["[", "]"] },
    { input: "config{name}", chars: ["{", "}"] },
    { input: "config=name", chars: ["="] },
    { input: "config+name", chars: ["+"] },
    { input: "config|name", chars: ["|"] },
    { input: "config\\name", chars: ["\\"] },
    { input: "config/name", chars: ["/"] },
    { input: "config:name", chars: [":"] },
    { input: "config;name", chars: [";"] },
    { input: "config'name", chars: ["'"] },
    { input: 'config"name', chars: ['"'] },
    { input: "config<name>", chars: ["<", ">"] },
    { input: "config?name", chars: ["?"] },
    { input: "config.name", chars: ["."] },
    { input: "config,name", chars: [","] },
    { input: "config~name", chars: ["~"] },
    { input: "config`name", chars: ["`"] },
    { input: "config!name", chars: ["!"] },
    { input: "múltiple@#$%", chars: ["ú", "@", "#", "$", "%"] },
  ];

  invalidCharTests.forEach(({ input, chars }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, false, `Should reject: ${input}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidCharacters");
      if (result.error.kind === "InvalidCharacters") {
        // Verify detected invalid characters
        const error = result.error;
        chars.forEach((char) => {
          assertEquals(
            error.invalidChars.includes(char),
            true,
            `Should detect invalid char: ${char}`,
          );
        });
      }
    }
  });
});

// ============================================================================
// Length Validation Tests
// ============================================================================

Deno.test("1_behavior: accepts names up to 64 characters", () => {
  const lengths = [1, 10, 32, 63, 64];

  lengths.forEach((length) => {
    const name = "a".repeat(length);
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, true, `Should accept length ${length}`);
  });
});

Deno.test("1_behavior: rejects names longer than 64 characters", () => {
  const lengths = [65, 100, 256];

  lengths.forEach((length) => {
    const name = "a".repeat(length);
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject length ${length}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "TooLong");
      if (result.error.kind === "TooLong") {
        assertEquals(result.error.maxLength, 64);
        assertEquals(result.error.actualLength, length);
        assertEquals(result.error.message.includes("concise"), true);
      }
    }
  });
});

// ============================================================================
// Reserved Names Tests
// ============================================================================

Deno.test("1_behavior: rejects reserved system configuration names", () => {
  const reservedNames = [
    // System level
    "default",
    "system",
    "global",
    "local",
    "temp",
    "tmp",
    "cache",
    // Configuration related
    "config",
    "configuration",
    "settings",
    "app",
    "application",
    // User/profile related
    "user",
    "profile",
    "env",
    "environment",
    // Environment names
    "dev",
    "development",
    "prod",
    "production",
    "test",
    "testing",
    "stage",
    "staging",
  ];

  reservedNames.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject reserved: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
      if (result.error.kind === "ReservedName") {
        assertEquals(Array.isArray(result.error.reserved), true);
        assertEquals(result.error.reserved.length > 0, true);
        assertEquals(result.error.message.includes("conflicts"), true);
      }
    }
  });
});

Deno.test("1_behavior: reserved names are case-insensitive", () => {
  const caseVariations = [
    "DEFAULT",
    "Default",
    "DeFaUlT",
    "SYSTEM",
    "System",
    "SyStEm",
    "CONFIG",
    "Config",
    "CoNfIg",
    "PRODUCTION",
    "Production",
    "PrOdUcTiOn",
  ];

  caseVariations.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject case variation: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
    }
  });
});

// ============================================================================
// Reserved Prefix Tests
// ============================================================================

Deno.test("1_behavior: rejects names starting with reserved prefixes", () => {
  const reservedPrefixTests = [
    { name: "sys-config", prefix: "sys-" },
    { name: "system-settings", prefix: "system-" },
    { name: "app-config", prefix: "app-" },
    { name: "tmp-data", prefix: "tmp-" },
    { name: "temp-file", prefix: "temp-" },
    { name: "test-config", prefix: "test-" },
  ];

  reservedPrefixTests.forEach(({ name, prefix }) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject prefix: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "StartsWithReservedPrefix");
      if (result.error.kind === "StartsWithReservedPrefix") {
        assertEquals(result.error.prefix, prefix);
        assertEquals(result.error.message.includes("clear separation"), true);
      }
    }
  });
});

Deno.test("1_behavior: reserved prefixes are case-insensitive", () => {
  const caseVariations = [
    "SYS-config",
    "Sys-Config",
    "SyS-config",
    "SYSTEM-config",
    "System-Config",
    "SyStEm-config",
    "APP-config",
    "App-Config",
    "ApP-config",
    "TMP-config",
    "Tmp-Config",
    "TmP-config",
  ];

  caseVariations.forEach((name) => {
    const result = ConfigSetName.create(name);
    assertEquals(result.ok, false, `Should reject case variation: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "StartsWithReservedPrefix");
    }
  });
});

// ============================================================================
// Whitespace Handling Tests
// ============================================================================

Deno.test("1_behavior: trims leading and trailing whitespace", () => {
  const whitespaceTests = [
    { input: " trimmed", expected: "trimmed" },
    { input: "trimmed ", expected: "trimmed" },
    { input: " trimmed ", expected: "trimmed" },
    { input: "\ttrimmed", expected: "trimmed" },
    { input: "trimmed\t", expected: "trimmed" },
    { input: "\ntrimmed\n", expected: "trimmed" },
    { input: "\r\ntrimmed\r\n", expected: "trimmed" },
    { input: "  \t  trimmed  \t  ", expected: "trimmed" },
  ];

  whitespaceTests.forEach(({ input, expected }) => {
    const result = ConfigSetName.create(input);
    assertEquals(result.ok, true, `Should trim: "${input}"`);
    if (result.ok) {
      assertEquals(result.data.value, expected);
    }
  });
});

// ============================================================================
// Factory Method Tests
// ============================================================================

Deno.test("1_behavior: defaultSet factory creates 'main' config", () => {
  const result = ConfigSetName.defaultSet();
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.value, "main");
  }
});

Deno.test("1_behavior: development factory creates development configs", () => {
  // Without suffix
  const defaultDev = ConfigSetName.development();
  assertEquals(defaultDev.ok, true);
  if (defaultDev.ok) {
    assertEquals(defaultDev.data.value, "development-main");
  }

  // With suffix
  const suffixTests = [
    { suffix: "api", expected: "dev-api" },
    { suffix: "frontend", expected: "dev-frontend" },
    { suffix: "backend", expected: "dev-backend" },
    { suffix: "test", expected: "dev-test" },
  ];

  suffixTests.forEach(({ suffix, expected }) => {
    const result = ConfigSetName.development(suffix);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.value, expected);
    }
  });
});

Deno.test("1_behavior: forProject factory sanitizes project names", () => {
  const projectTests = [
    { input: "MyProject", expected: "project-myproject" },
    { input: "My Project", expected: "project-my-project" },
    { input: "My@Project#123", expected: "project-my-project-123" },
    { input: "   Project   ", expected: "project-project" },
    { input: "PROJECT", expected: "project-project" },
    { input: "complex.project/name", expected: "project-complex-project-name" },
    { input: "123-numbers", expected: "project-123-numbers" },
  ];

  projectTests.forEach(({ input, expected }) => {
    const result = ConfigSetName.forProject(input);
    assertEquals(result.ok, true, `Should sanitize: ${input}`);
    if (result.ok) {
      assertEquals(result.data.value, expected);
    }
  });
});

Deno.test("1_behavior: forProject factory rejects empty project names", () => {
  const emptyInputs = [
    "",
    "   ",
    null as any,
    undefined as any,
  ];

  emptyInputs.forEach((input) => {
    const result = ConfigSetName.forProject(input);
    assertEquals(result.ok, false, `Should reject empty: ${input}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyName");
      assertEquals(result.error.message.includes("Project name is required"), true);
    }
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

Deno.test("1_behavior: handles edge cases in validation order", () => {
  // Test that validation happens in the correct order

  // Empty check comes before format check
  const emptyNonString = ConfigSetName.create(null as any);
  assertEquals(emptyNonString.ok, false);
  if (!emptyNonString.ok) {
    assertEquals(emptyNonString.error.kind, "EmptyName"); // Not InvalidFormat
  }

  // Format check comes before length check
  const longNonString = ConfigSetName.create(
    123456789012345678901234567890123456789012345678901234567890123456789 as any,
  );
  assertEquals(longNonString.ok, false);
  if (!longNonString.ok) {
    assertEquals(longNonString.error.kind, "InvalidFormat"); // Not TooLong
  }

  // Length check comes before character check
  const longInvalidChars = ConfigSetName.create("a".repeat(65) + "@#$");
  assertEquals(longInvalidChars.ok, false);
  if (!longInvalidChars.ok) {
    assertEquals(longInvalidChars.error.kind, "TooLong"); // Not InvalidCharacters
  }

  // Character check comes before reserved check
  const reservedWithInvalid = ConfigSetName.create("default@123");
  assertEquals(reservedWithInvalid.ok, false);
  if (!reservedWithInvalid.ok) {
    assertEquals(reservedWithInvalid.error.kind, "InvalidCharacters"); // Not ReservedName
  }
});

Deno.test("1_behavior: handles boundary values correctly", () => {
  // Exactly at length limit
  const exactly64 = "a".repeat(64);
  const result64 = ConfigSetName.create(exactly64);
  assertEquals(result64.ok, true);

  // Just over length limit
  const exactly65 = "a".repeat(65);
  const result65 = ConfigSetName.create(exactly65);
  assertEquals(result65.ok, false);

  // Single character (minimum valid)
  const single = ConfigSetName.create("a");
  assertEquals(single.ok, true);

  // Mixed case at boundaries
  const mixedBoundary = ConfigSetName.create("A".repeat(32) + "a".repeat(32));
  assertEquals(mixedBoundary.ok, true);
});

// ============================================================================
// Collection Behavior Tests
// ============================================================================

Deno.test("1_behavior: collection validates all names", () => {
  const mixedNames = ["valid1", "valid2", "invalid@", "valid3"];
  const result = ConfigSetNameCollection.create(mixedNames);

  // Should fail on first invalid name
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "InvalidCharacters");
  }
});

Deno.test("1_behavior: collection preserves order", () => {
  const names = ["config-c", "config-a", "config-b"];
  const result = ConfigSetNameCollection.create(names);

  assertEquals(result.ok, true);
  if (result.ok) {
    const retrievedNames = result.data.getNames();
    assertEquals(retrievedNames[0], "config-c");
    assertEquals(retrievedNames[1], "config-a");
    assertEquals(retrievedNames[2], "config-b");
  }
});

Deno.test("1_behavior: collection handles empty array", () => {
  const result = ConfigSetNameCollection.create([]);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.isEmpty(), true);
    assertEquals(result.data.getCount(), 0);
  }
});
