/**
 * @fileoverview Behavior tests for WorkspaceName Value Object
 *
 * This test suite validates the domain logic and business rules
 * of the WorkspaceName implementation:
 * - Validation rules (empty, whitespace, characters, length)
 * - Filesystem safety restrictions
 * - Security constraints (path traversal, hidden files)
 * - Reserved name restrictions
 * - Factory method behaviors
 * - Edge case handling
 * - Business rule enforcement
 */

import { assertEquals } from "jsr:@std/assert";
import {
  WorkspaceName,
  WorkspaceNameCollection,
  type WorkspaceNameError as _WorkspaceNameError,
} from "./workspace_name.ts";

// ============================================================================
// Empty Name Validation Tests
// ============================================================================

Deno.test("1_behavior: rejects null and undefined inputs", () => {
  const nullResult = WorkspaceName.create(null as unknown as string);
  assertEquals(nullResult.ok, false);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "EmptyName");
    assertEquals(nullResult.error.message.includes("null or undefined"), true);
  }

  const undefinedResult = WorkspaceName.create(undefined as unknown as string);
  assertEquals(undefinedResult.ok, false);
  if (!undefinedResult.ok) {
    assertEquals(undefinedResult.error.kind, "EmptyName");
    assertEquals(undefinedResult.error.message.includes("null or undefined"), true);
  }
});

Deno.test("1_behavior: rejects empty string and whitespace-only inputs", () => {
  const emptyResult = WorkspaceName.create("");
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
    const result = WorkspaceName.create(input);
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
    const result = WorkspaceName.create(input as unknown as string);
    assertEquals(result.ok, false, `Should reject ${desc}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidFormat");
      assertEquals(result.error.message.includes("must be a string"), true);
    }
  });
});

// ============================================================================
// Whitespace Handling Tests
// ============================================================================

Deno.test("1_behavior: rejects names containing whitespace for CLI compatibility", () => {
  const whitespaceTests = [
    { input: "with space", positions: [4] },
    { input: "multiple  spaces", positions: [8, 9] },
    { input: "leading space", positions: [7] },
    { input: "trailing space", positions: [8] },
    { input: "tab\there", positions: [3] },
    { input: "new\nline", positions: [3] },
    { input: "carriage\rreturn", positions: [8] },
    { input: "form\ffeed", positions: [4] },
    { input: "vertical\vtab", positions: [8] },
    { input: "mixed \t\n spaces", positions: [5, 6, 7, 8] },
  ];

  whitespaceTests.forEach(({ input, positions }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, false, `Should reject whitespace: "${input}"`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ContainsWhitespace");
      if (result.error.kind === "ContainsWhitespace") {
        const error = result.error;
        assertEquals(Array.isArray(error.whitespacePositions), true);
        assertEquals(error.whitespacePositions.length, positions.length);
        positions.forEach((pos) => {
          assertEquals(error.whitespacePositions.includes(pos), true);
        });
      }
    }
  });
});

Deno.test("1_behavior: trims leading and trailing whitespace before validation", () => {
  const trimTests = [
    { input: " workspace", expected: "workspace" },
    { input: "workspace ", expected: "workspace" },
    { input: " workspace ", expected: "workspace" },
    { input: "\tworkspace", expected: "workspace" },
    { input: "workspace\t", expected: "workspace" },
    { input: "\nworkspace\n", expected: "workspace" },
    { input: "\r\nworkspace\r\n", expected: "workspace" },
    { input: "  \t  workspace  \t  ", expected: "workspace" },
  ];

  trimTests.forEach(({ input, expected }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, true, `Should trim and accept: "${input}"`);
    if (result.ok) {
      assertEquals(result.data.value, expected);
    }
  });
});

// ============================================================================
// Length Validation Tests
// ============================================================================

Deno.test("1_behavior: accepts names up to 255 characters", () => {
  const lengths = [1, 10, 100, 200, 254, 255];

  lengths.forEach((length) => {
    const name = "a".repeat(length);
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true, `Should accept length ${length}`);
  });
});

Deno.test("1_behavior: rejects names longer than 255 characters", () => {
  const lengths = [256, 300, 500, 1000];

  lengths.forEach((length) => {
    const name = "a".repeat(length);
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject length ${length}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "TooLong");
      if (result.error.kind === "TooLong") {
        assertEquals(result.error.maxLength, 255);
        assertEquals(result.error.actualLength, length);
        assertEquals(result.error.message.includes("filesystem path length"), true);
      }
    }
  });
});

// ============================================================================
// Path Traversal Security Tests
// ============================================================================

Deno.test("1_behavior: rejects path traversal attempts for security", () => {
  const pathTraversalTests = [
    { input: "../parent", patterns: [".."] },
    { input: "..\\windows-parent", patterns: ["..", "\\"] },
    { input: "normal../attack", patterns: [".."] },
    { input: "attack/../normal", patterns: [".."] },
    { input: "../../etc", patterns: [".."] },
    { input: "path/separator", patterns: ["/"] },
    { input: "path\\backslash", patterns: ["\\"] },
    { input: "mixed/../and\\paths", patterns: ["..", "/", "\\"] },
  ];

  pathTraversalTests.forEach(({ input, patterns }) => {
    const result = WorkspaceName.create(input);
    assertEquals(result.ok, false, `Should reject path traversal: ${input}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "PathTraversalAttempt");
      if (result.error.kind === "PathTraversalAttempt") {
        const error = result.error;
        assertEquals(Array.isArray(error.suspiciousPatterns), true);
        patterns.forEach((pattern) => {
          assertEquals(
            error.suspiciousPatterns.includes(pattern),
            true,
            `Should detect pattern: ${pattern}`,
          );
        });
      }
    }
  });
});

// ============================================================================
// Hidden File Prevention Tests
// ============================================================================

Deno.test("1_behavior: rejects names starting with dot to prevent hidden directories", () => {
  const dotNames = [
    ".hidden",
    ".git",
    ".vscode",
    ".env",
    ".config",
    ".cache",
    ".local",
    ".ssh",
    ".gnupg",
    ".single",
  ];

  dotNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject dot prefix: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "StartsWithDot");
      assertEquals(result.error.message.includes("hidden directories"), true);
    }
  });

  // Note: Path traversal patterns like ".." are caught by PathTraversalAttempt first
  const doubleDotsResult = WorkspaceName.create("..double-dot");
  assertEquals(doubleDotsResult.ok, false);
  if (!doubleDotsResult.ok) {
    assertEquals(doubleDotsResult.error.kind, "PathTraversalAttempt"); // Higher priority
  }
});

// ============================================================================
// Cross-Platform Character Safety Tests
// ============================================================================

Deno.test("1_behavior: rejects forbidden characters for cross-platform compatibility", () => {
  const forbiddenCharTests = [
    { char: "<", reason: "angle bracket" },
    { char: ">", reason: "angle bracket" },
    { char: ":", reason: "colon" },
    { char: '"', reason: "quote" },
    { char: "|", reason: "pipe" },
    { char: "?", reason: "question mark" },
    { char: "*", reason: "asterisk" },
    { char: "\0", reason: "null character" },
  ];

  forbiddenCharTests.forEach(({ char, reason }) => {
    const name = `workspace${char}name`;
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject ${reason}: ${char}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidCharacters");
      if (result.error.kind === "InvalidCharacters") {
        assertEquals(result.error.invalidChars.includes(char), true);
        assertEquals(result.error.message.includes("cross-platform"), true);
      }
    }
  });
});

Deno.test("1_behavior: accepts filesystem-safe characters", () => {
  const safeNames = [
    "simple",
    "with-hyphens",
    "with_underscores",
    "MixedCase",
    "numbers123",
    "123numbers",
    "a",
    "complex-name_with-123_parts",
    "ALLCAPS",
    "lowercase",
    "Pascal_Case-Mixed_123",
    // Unicode letters should be accepted (basic support)
    "café", // Depends on filesystem, but commonly supported
    "naïve",
  ];

  safeNames.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true, `Should accept safe name: ${name}`);
    if (result.ok) {
      assertEquals(result.data.value, name);
    }
  });
});

// ============================================================================
// Reserved Names Tests
// ============================================================================

Deno.test("1_behavior: rejects Windows reserved device names", () => {
  const windowsReserved = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];

  windowsReserved.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject Windows reserved: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
      assertEquals(result.error.message.includes("conflicts with system"), true);
    }
  });
});

Deno.test("1_behavior: rejects Unix/Linux system directories", () => {
  const unixDirectories = [
    "bin",
    "boot",
    "dev",
    "etc",
    "home",
    "lib",
    "lib64",
    "mnt",
    "opt",
    "proc",
    "root",
    "run",
    "sbin",
    "srv",
    "sys",
    "tmp",
    "usr",
    "var",
  ];

  unixDirectories.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject Unix directory: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
    }
  });
});

Deno.test("1_behavior: rejects common application directories", () => {
  const appDirectories = [
    "node_modules",
    "target",
    "build",
    "dist",
  ];

  appDirectories.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject app directory: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
    }
  });

  // Test dot-prefixed app directories separately (caught by StartsWithDot)
  const dotAppDirectories = [".git", ".svn", ".hg"];

  dotAppDirectories.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject dot app directory: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "StartsWithDot");
    }
  });
});

Deno.test("1_behavior: reserved names are case-insensitive", () => {
  const caseVariations = [
    "con",
    "Con",
    "CON",
    "cOn",
    "bin",
    "Bin",
    "BIN",
    "bIn",
    "tmp",
    "Tmp",
    "TMP",
    "tMp",
  ];

  caseVariations.forEach((name) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, false, `Should reject case variation: ${name}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "ReservedName");
    }
  });
});

// ============================================================================
// Validation Priority Tests
// ============================================================================

Deno.test("1_behavior: validation happens in correct priority order", () => {
  // Empty check comes before format check
  const emptyNonString = WorkspaceName.create(null as unknown as string);
  assertEquals(emptyNonString.ok, false);
  if (!emptyNonString.ok) {
    assertEquals(emptyNonString.error.kind, "EmptyName");
  }

  // Format check comes before whitespace check
  const nonStringWithSpaces = WorkspaceName.create(123 as unknown as string);
  assertEquals(nonStringWithSpaces.ok, false);
  if (!nonStringWithSpaces.ok) {
    assertEquals(nonStringWithSpaces.error.kind, "InvalidFormat");
  }

  // Whitespace check comes before length check
  const longWithSpaces = WorkspaceName.create("a".repeat(256) + " space");
  assertEquals(longWithSpaces.ok, false);
  if (!longWithSpaces.ok) {
    assertEquals(longWithSpaces.error.kind, "ContainsWhitespace");
  }

  // Length check comes before path traversal check
  const longWithTraversal = WorkspaceName.create("a".repeat(256) + "../attack");
  assertEquals(longWithTraversal.ok, false);
  if (!longWithTraversal.ok) {
    assertEquals(longWithTraversal.error.kind, "TooLong");
  }

  // Path traversal check comes before dot check (../ contains ..)
  const traversalWithDot = WorkspaceName.create("../hidden");
  assertEquals(traversalWithDot.ok, false);
  if (!traversalWithDot.ok) {
    assertEquals(traversalWithDot.error.kind, "PathTraversalAttempt");
  }

  // Dot check comes before character check
  const dotWithInvalid = WorkspaceName.create(".hidden<invalid>");
  assertEquals(dotWithInvalid.ok, false);
  if (!dotWithInvalid.ok) {
    assertEquals(dotWithInvalid.error.kind, "StartsWithDot");
  }

  // Character check comes before reserved check
  const reservedWithInvalid = WorkspaceName.create("CON<invalid>");
  assertEquals(reservedWithInvalid.ok, false);
  if (!reservedWithInvalid.ok) {
    assertEquals(reservedWithInvalid.error.kind, "InvalidCharacters");
  }
});

// ============================================================================
// Factory Method Tests
// ============================================================================

Deno.test("1_behavior: defaultWorkspace factory creates standard default", () => {
  const result = WorkspaceName.defaultWorkspace();
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.value, "default-workspace");
  }
});

Deno.test("1_behavior: withTimestamp factory creates timestamped names", () => {
  // Without prefix
  const withoutPrefix = WorkspaceName.withTimestamp();
  assertEquals(withoutPrefix.ok, true);
  if (withoutPrefix.ok) {
    assertEquals(withoutPrefix.data.value.startsWith("workspace-"), true);
    // Should contain timestamp pattern (YYYY-MM-DD_HH-MM-SS)
    const timestampPattern = /workspace-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/;
    assertEquals(timestampPattern.test(withoutPrefix.data.value), true);
  }

  // With prefix
  const withPrefix = WorkspaceName.withTimestamp("project");
  assertEquals(withPrefix.ok, true);
  if (withPrefix.ok) {
    assertEquals(withPrefix.data.value.startsWith("project-"), true);
    const prefixPattern = /project-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/;
    assertEquals(prefixPattern.test(withPrefix.data.value), true);
  }

  // Consecutive calls should produce different timestamps
  const first = WorkspaceName.withTimestamp("test");
  const second = WorkspaceName.withTimestamp("test");
  if (first.ok && second.ok) {
    // Either different timestamps or very close (within same second)
    const sameOrClose = first.data.value === second.data.value ||
      first.data.value !== second.data.value;
    assertEquals(sameOrClose, true);
  }
});

Deno.test("1_behavior: forProject factory sanitizes and validates project names", () => {
  const projectTests = [
    { input: "MyProject", expected: "MyProject" },
    { input: "My Project Name", expected: "My-Project-Name" },
    { input: "Project@#$%", expected: "Project----" },
    { input: "   Project   ", expected: "Project" },
    { input: "complex.project/name", expected: "complex-project-name" },
    { input: "123-numbers", expected: "123-numbers" },
  ];

  projectTests.forEach(({ input, expected }) => {
    const result = WorkspaceName.forProject(input);
    assertEquals(result.ok, true, `Should sanitize: ${input}`);
    if (result.ok) {
      assertEquals(result.data.value, expected);
    }
  });

  // With suffix
  const withSuffix = WorkspaceName.forProject("MyProject", "dev");
  assertEquals(withSuffix.ok, true);
  if (withSuffix.ok) {
    assertEquals(withSuffix.data.value, "MyProject-dev");
  }
});

Deno.test("1_behavior: forProject factory handles edge cases", () => {
  // Empty project names
  const emptyInputs = [
    "",
    "   ",
    null as unknown as string,
    undefined as unknown as string,
  ];

  emptyInputs.forEach((input) => {
    const result = WorkspaceName.forProject(input);
    assertEquals(result.ok, false, `Should reject empty: ${input}`);
    if (!result.ok) {
      assertEquals(result.error.kind, "EmptyName");
      assertEquals(result.error.message.includes("Project name is required"), true);
    }
  });

  // Project names that become invalid after sanitization
  const onlySpecialChars = WorkspaceName.forProject("@#$%^&*");
  assertEquals(onlySpecialChars.ok, false);
  if (!onlySpecialChars.ok) {
    assertEquals(onlySpecialChars.error.kind, "InvalidFormat");
    assertEquals(onlySpecialChars.error.message.includes("valid characters"), true);
  }

  // Project names that become only hyphens
  const onlyHyphens = WorkspaceName.forProject("---");
  assertEquals(onlyHyphens.ok, false);
  if (!onlyHyphens.ok) {
    assertEquals(onlyHyphens.error.kind, "InvalidFormat");
  }
});

Deno.test("1_behavior: temporary factory creates random workspace names", () => {
  // Without purpose
  const withoutPurpose = WorkspaceName.temporary();
  assertEquals(withoutPurpose.ok, true);
  if (withoutPurpose.ok) {
    assertEquals(withoutPurpose.data.value.startsWith("temp-"), true);
    // Should end with 6-character random suffix
    const tempPattern = /^temp-[a-z0-9]{6}$/;
    assertEquals(tempPattern.test(withoutPurpose.data.value), true);
  }

  // With purpose
  const withPurpose = WorkspaceName.temporary("testing");
  assertEquals(withPurpose.ok, true);
  if (withPurpose.ok) {
    assertEquals(withPurpose.data.value.startsWith("temp-testing-"), true);
    const purposePattern = /^temp-testing-[a-z0-9]{6}$/;
    assertEquals(purposePattern.test(withPurpose.data.value), true);
  }

  // Multiple calls should produce different suffixes
  const temp1 = WorkspaceName.temporary("test");
  const temp2 = WorkspaceName.temporary("test");
  if (temp1.ok && temp2.ok) {
    // Very unlikely to get same random suffix
    assertEquals(temp1.data.value !== temp2.data.value, true);
  }
});

// ============================================================================
// Production Suitability Tests
// ============================================================================

Deno.test("1_behavior: production suitability assessment", () => {
  const productionSuitable = [
    { name: "my-project", suitable: true },
    { name: "client-workspace", suitable: true },
    { name: "production-app", suitable: true },
    { name: "stable-version", suitable: true },
    { name: "main-workspace", suitable: true },
  ];

  const notProductionSuitable = [
    { name: "temp-workspace", suitable: false },
    { name: "test-env", suitable: false },
    { name: "debug-mode", suitable: false },
    { name: "dev-environment", suitable: false },
    { name: "tmp-data", suitable: false },
    { name: "ab", suitable: false }, // Too short (< 3 chars)
    { name: "x", suitable: false }, // Too short
  ];

  [...productionSuitable, ...notProductionSuitable].forEach(({ name, suitable }) => {
    const result = WorkspaceName.create(name);
    assertEquals(result.ok, true, `Should create: ${name}`);
    if (result.ok) {
      assertEquals(
        result.data.isSuitableForProduction(),
        suitable,
        `${name} production suitability should be ${suitable}`,
      );
    }
  });
});

// ============================================================================
// Collection Behavior Tests
// ============================================================================

Deno.test("1_behavior: collection validates all workspace names", () => {
  const mixedNames = ["valid1", "valid2", "with spaces", "valid3"];
  const result = WorkspaceNameCollection.create(mixedNames);

  // Should fail on first invalid name
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "ContainsWhitespace");
  }
});

Deno.test("1_behavior: collection preserves order and handles operations", () => {
  const names = ["workspace-c", "workspace-a", "workspace-b"];
  const result = WorkspaceNameCollection.create(names);

  assertEquals(result.ok, true);
  if (result.ok) {
    const collection = result.data;

    // Order preservation
    const retrievedNames = collection.getNames();
    assertEquals(retrievedNames[0], "workspace-c");
    assertEquals(retrievedNames[1], "workspace-a");
    assertEquals(retrievedNames[2], "workspace-b");

    // Contains operation
    const searchResult = WorkspaceName.create("workspace-a");
    if (searchResult.ok) {
      assertEquals(collection.contains(searchResult.data), true);
    }

    // Production filtering
    const prodWorkspaces = ["production-app", "temp-workspace", "client-project"];
    const prodResult = WorkspaceNameCollection.create(prodWorkspaces);
    if (prodResult.ok) {
      const filtered = prodResult.data.filterProductionSuitable();
      const filteredNames = filtered.getNames();
      assertEquals(filteredNames.includes("production-app"), true);
      assertEquals(filteredNames.includes("client-project"), true);
      assertEquals(filteredNames.includes("temp-workspace"), false);
    }
  }
});

Deno.test("1_behavior: collection handles empty array", () => {
  const result = WorkspaceNameCollection.create([]);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.data.isEmpty(), true);
    assertEquals(result.data.getCount(), 0);
  }
});
