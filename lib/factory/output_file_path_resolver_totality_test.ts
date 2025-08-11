/**
 * @fileoverview Tests for OutputFilePathResolverTotality with destination prefix support
 */

import { assertEquals, assertExists } from "jsr:@std/assert@^1.0.0";
import {
  formatOutputFilePathError,
  OutputFilePathResolverTotality,
} from "./output_file_path_resolver_totality.ts";
import type { PromptCliParams } from "../types/mod.ts";
import { resolve } from "jsr:@std/path@^1.0.9";

Deno.test("OutputFilePathResolverTotality - Case 3: Relative path with prefix combines both", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "results",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      destinationFile: "output.md",
    },
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Should concatenate prefix + destinationFile directly (no automatic path separator)
      const baseDir = resolve(Deno.cwd(), "/test/workspace");
      const expectedPath = resolve(baseDir, "results" + "output.md");
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Case 4: No CLI option uses prefix as default", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "config/output.md",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Should use config prefix as default path
      const expectedPath = resolve(Deno.cwd(), "/test/workspace", "config/output.md");
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Case 5: Error when no destination specified", () => {
  const config = {
    working_dir: "/test/workspace",
    // No options.destination.prefix
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.kind, "MissingDestinationFile");
    assertExists(
      "message" in result.error && result.error.message.includes("no prefix configured"),
    );
  }
});

Deno.test("OutputFilePathResolverTotality - Handles absolute path in prefix", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "/absolute/path/output.md",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Absolute path should be used as-is
      assertEquals(pathResult.data.getValue(), "/absolute/path/output.md");
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Handles placeholder in prefix (passthrough)", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "dest/yyyy/mm/yyyymmdd-HH-something.md",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Placeholder should be passed through as-is (not expanded in this implementation)
      const expectedPath = resolve(
        Deno.cwd(),
        "/test/workspace",
        "dest/yyyy/mm/yyyymmdd-HH-something.md",
      );
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Handles wildcard in prefix (passthrough)", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "tmp/<current_branch>/*.md",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Wildcard should be passed through as-is (not expanded in this implementation)
      const expectedPath = resolve(
        Deno.cwd(),
        "/test/workspace",
        "tmp/<current_branch>/*.md",
      );
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Handles missing options object", () => {
  const config = {
    working_dir: "/test/workspace",
    // No options object at all
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      destinationFile: "fallback.md",
    },
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Should fall back to CLI option
      const expectedPath = resolve(Deno.cwd(), "/test/workspace", "fallback.md");
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Validate method works correctly", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "output.md",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {},
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const validateResult = result.data.validate();
    assertEquals(validateResult.ok, true);
  }
});

Deno.test("formatOutputFilePathError - Formats error messages correctly", () => {
  const missingError = {
    kind: "MissingDestinationFile" as const,
    message: "No destination specified",
  };
  const formatted = formatOutputFilePathError(missingError);
  assertExists(formatted.includes("Output file error"));

  const invalidError = {
    kind: "InvalidPath" as const,
    path: "/bad/path",
    reason: "Invalid characters",
  };
  const formatted2 = formatOutputFilePathError(invalidError);
  assertExists(formatted2.includes("Invalid output path"));

  const creationError = {
    kind: "PathCreationError" as const,
    path: "/failed/path",
    error: "Permission denied",
  };
  const formatted3 = formatOutputFilePathError(creationError);
  assertExists(formatted3.includes("Failed to create output path"));
});
