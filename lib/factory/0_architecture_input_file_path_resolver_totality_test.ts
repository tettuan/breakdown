/**
 * @fileoverview Architecture tests for InputFilePathResolverTotality
 *
 * Tests verify:
 * - Smart constructor validation
 * - Result type usage throughout
 * - Discriminated union handling for path types
 * - Enhanced error handling
 * - Path validation and normalization
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import {
  formatInputFilePathError,
  InputFilePathResolverTotality,
} from "./input_file_path_resolver_totality.ts";
import type { InputFilePathError } from "./input_file_path_resolver_totality.ts";

Deno.test("InputFilePathResolverTotality - Smart Constructor validates inputs", () => {
  // Test invalid config
  const invalidConfigs = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const config of invalidConfigs) {
    const result = InputFilePathResolverTotality.create(
      config as unknown as { working_dir: string; resource_dir: string },
      { directiveType: "to", layerType: "project", options: {} },
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ConfigurationError");
    }
  }

  // Test invalid cliParams
  const validConfig = { working_dir: ".agent/breakdown" };
  const invalidParams = [
    null,
    undefined,
    [],
    "string",
    123,
  ];

  for (const params of invalidParams) {
    const result = InputFilePathResolverTotality.create(
      validConfig,
      params as unknown as {
        directiveType: string;
        layerType: string;
        options: Record<string, unknown>;
      },
    );
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ConfigurationError");
    }
  }
});

Deno.test("InputFilePathResolverTotality - normalizes config to discriminated union", () => {
  // WithWorkingDir
  const result1 = InputFilePathResolverTotality.create(
    { working_dir: "/custom/working/dir" },
    { directiveType: "to", layerType: "project", options: {} },
  );
  assertEquals(result1.ok, true);

  // NoWorkingDir
  const result2 = InputFilePathResolverTotality.create(
    {},
    { directiveType: "to", layerType: "project", options: {} },
  );
  assertEquals(result2.ok, true);

  // Invalid working_dir (non-string) - should default to NoWorkingDir
  const result3 = InputFilePathResolverTotality.create(
    { working_dir: 123 },
    { directiveType: "to", layerType: "project", options: {} },
  );
  assertEquals(result3.ok, true);
});

Deno.test("InputFilePathResolverTotality - handles empty path", () => {
  const config = {};

  const resolverResult = InputFilePathResolverTotality.create(
    config,
    { directiveType: "to", layerType: "project", options: {} },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      assertEquals(resolved.value, "");
      assertEquals(resolved.pathType.kind, "Empty");
      assertEquals(resolved.exists, false);
      assertEquals(resolved.metadata.resolvedFrom, "default");
    }
  }
});

Deno.test("InputFilePathResolverTotality - handles stdin input", () => {
  const config = {};

  const resolverResult = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromFile: "-" },
    },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      assertEquals(resolved.value, "-");
      assertEquals(resolved.pathType.kind, "Stdin");
      assertEquals(resolved.exists, true);
      assertEquals(resolved.isValidInput(), true);
      assertEquals(resolved.getDescription(), "Reading from standard input");
    }
  }
});

Deno.test("InputFilePathResolverTotality - validates paths with invalid characters", () => {
  const config = {};

  // Path with null character
  const resolverResult1 = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromFile: "file\0name.md" },
    },
  );

  assertEquals(resolverResult1.ok, true);
  if (resolverResult1.ok) {
    const resolver = resolverResult1.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, false);
    if (!pathResult.ok) {
      assertEquals(pathResult.error.kind, "InvalidCharacters");
      if (pathResult.error.kind === "InvalidCharacters") {
        assertEquals(pathResult.error.invalidChars.includes("\\0"), true);
      }
    }
  }
});

Deno.test("InputFilePathResolverTotality - determines path types correctly", () => {
  const config = {};

  // Absolute path
  const resolverResult1 = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromFile: "/absolute/path/file.md" },
    },
  );

  assertEquals(resolverResult1.ok, true);
  if (resolverResult1.ok) {
    const resolver = resolverResult1.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      assertEquals(resolved.pathType.kind, "Absolute");
      assertEquals(resolved.value, "/absolute/path/file.md");
    }
  }

  // Relative path with hierarchy
  const resolverResult2 = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromFile: "relative/path/file.md" },
    },
  );

  assertEquals(resolverResult2.ok, true);
  if (resolverResult2.ok) {
    const resolver = resolverResult2.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      assertEquals(resolved.pathType.kind, "Relative");
      if (resolved.pathType.kind === "Relative") {
        assertEquals(resolved.pathType.hasHierarchy, true);
      }
    }
  }

  // Simple filename
  const resolverResult3 = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromFile: "simple.md" },
    },
  );

  assertEquals(resolverResult3.ok, true);
  if (resolverResult3.ok) {
    const resolver = resolverResult3.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      assertEquals(resolved.pathType.kind, "Filename");
      if (resolved.pathType.kind === "Filename") {
        assertEquals(resolved.pathType.name, "simple.md");
      }
    }
  }
});

Deno.test("InputFilePathResolverTotality - handles TwoParams_Result structure", () => {
  const config = {};

  const twoParams = {
    type: "two" as const,
    params: ["to", "project"],
    directiveType: "to",
    demonstrativeType: "to",
    layerType: "project",
    options: { fromFile: "input.md" },
  };

  const resolverResult = InputFilePathResolverTotality.create(config, twoParams);

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      assertEquals(resolved.pathType.kind, "Filename");
      assertEquals(resolved.metadata.originalPath, "input.md");
    }
  }
});

Deno.test("InputFilePathResolverTotality - getTargetDirectory returns correct directory", () => {
  const config = {};

  // With fromLayerType
  const resolverResult1 = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromLayerType: "issue" },
    },
  );

  assertEquals(resolverResult1.ok, true);
  if (resolverResult1.ok) {
    const resolver = resolverResult1.data;
    const dirResult = resolver.getTargetDirectory();

    assertEquals(dirResult.ok, true);
    if (dirResult.ok) {
      assertEquals(dirResult.data, "issue");
    }
  }

  // Without fromLayerType - uses layerType
  const resolverResult2 = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: {},
    },
  );

  assertEquals(resolverResult2.ok, true);
  if (resolverResult2.ok) {
    const resolver = resolverResult2.data;
    const dirResult = resolver.getTargetDirectory();

    assertEquals(dirResult.ok, true);
    if (dirResult.ok) {
      assertEquals(dirResult.data, "project");
    }
  }
});

Deno.test("InputFilePathResolverTotality - path normalization handles backslashes", () => {
  const config = {};

  const resolverResult = InputFilePathResolverTotality.create(
    config,
    {
      directiveType: "to",
      layerType: "project",
      options: { fromFile: "windows\\style\\path.md" },
    },
  );

  assertEquals(resolverResult.ok, true);
  if (resolverResult.ok) {
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();

    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      const resolved = pathResult.data;
      // Path should be normalized to forward slashes
      assertEquals(resolved.metadata.normalizedPath, "windows/style/path.md");
    }
  }
});

Deno.test("InputFilePathResolverTotality - formatInputFilePathError provides helpful messages", () => {
  const errors: InputFilePathError[] = [
    {
      kind: "InvalidPath",
      path: "/bad/path",
      reason: "Contains invalid characters",
    },
    {
      kind: "PathNotFound",
      path: "/missing/file.md",
      checkedAt: "2024-01-01T00:00:00Z",
    },
    {
      kind: "PermissionDenied",
      path: "/restricted/file.md",
      operation: "read",
    },
    {
      kind: "ConfigurationError",
      message: "Invalid configuration",
      field: "working_dir",
    },
    {
      kind: "PathNormalizationError",
      originalPath: "bad\\path",
      reason: "Failed to normalize",
    },
    {
      kind: "InvalidCharacters",
      path: "file\0name.md",
      invalidChars: ["\\0"],
    },
  ];

  for (const error of errors) {
    const message = formatInputFilePathError(error);
    assertExists(message);
    assertEquals(message.length > 0, true);
  }
});
