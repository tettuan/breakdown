/**
 * @fileoverview Additional test cases for all 5 path resolution logic patterns
 */

import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { OutputFilePathResolverTotality } from "./output_file_path_resolver_totality.ts";
import type { PromptCliParams } from "../types/mod.ts";
import { resolve } from "jsr:@std/path@^1.0.9";

Deno.test("OutputFilePathResolverTotality - Case 1: Relative path without prefix (traditional)", () => {
  const config = {
    working_dir: "/test/workspace",
    // No options.destination.prefix
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
      // Case 1: Traditional behavior - Deno.cwd() + working_dir + destinationFile
      const expectedPath = resolve(Deno.cwd(), "/test/workspace", "output.md");
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Case 2: Absolute path ignores everything", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "should-be-ignored",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      destinationFile: "/absolute/path/output.md",
    },
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Case 2: Absolute path - use as-is
      assertEquals(pathResult.data.getValue(), "/absolute/path/output.md");
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Case 3: Nested path with prefix", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "results/2024",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      destinationFile: "january/report.md",
    },
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Case 3: prefix + destinationFile
      const basePath = resolve(Deno.cwd(), "/test/workspace", "results/2024");
      const expectedPath = resolve(basePath, "january/report.md");
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});

Deno.test("OutputFilePathResolverTotality - Case 3: Relative navigation in destinationFile", () => {
  const config = {
    working_dir: "/test/workspace",
    options: {
      destination: {
        prefix: "results/current",
      },
    },
  };

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      destinationFile: "../archive/old.md",
    },
  };

  const result = OutputFilePathResolverTotality.create(config, cliParams);

  assertEquals(result.ok, true);
  if (result.ok) {
    const pathResult = result.data.getPath();
    assertEquals(pathResult.ok, true);
    if (pathResult.ok) {
      // Should resolve "../archive/old.md" relative to "results/current"
      const basePath = resolve(Deno.cwd(), "/test/workspace", "results/current");
      const expectedPath = resolve(basePath, "../archive/old.md");
      // This should resolve to "/test/workspace/results/archive/old.md"
      assertEquals(pathResult.data.getValue(), expectedPath);
    }
  }
});
