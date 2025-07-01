import { assertEquals, assertMatch } from "@std/assert";
import { OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType } from "../types/mod.ts";

describe("OutputFilePathResolver: path resolution", () => {
  it("returns default path if destinationFile is not provided", () => {
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: {},
    });
    const result = resolver.getPath();
    assertMatch(result, new RegExp(`/project/\\d{8}_[a-f0-9]{7}\\.md$`));
  });
  it("returns absolute path if destinationFile is absolute file path", () => {
    const absPath = resolve(Deno.cwd(), "foo", "bar", "output.md");
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: { destinationFile: absPath },
    });
    assertEquals(resolver.getPath(), absPath);
  });
  it("returns path if destinationFile has path hierarchy and extension", () => {
    const relPath = join("foo", "bar", "output.md");
    const expected = resolve(Deno.cwd(), relPath);
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "task",
      options: { destinationFile: relPath },
    });
    assertEquals(resolver.getPath(), expected);
  });
});

describe("OutputFilePathResolver: directory/file/extension handling", () => {
  it("returns path in directory if destinationFile is directory", async () => {
    const dir = resolve(Deno.cwd(), "tmp", "output_dir");
    await Deno.mkdir(dir, { recursive: true });
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue",
      options: { destinationFile: dir },
    });
    const result = resolver.getPath();
    assertMatch(result, new RegExp(`${dir}/\\d{8}_[a-f0-9]{7}\\.md$`));
    await Deno.remove(dir, { recursive: true });
  });
  it("returns path in layerType dir if destinationFile is filename only with extension", () => {
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "task",
      options: { destinationFile: "output.md" },
    });
    const expected = resolve(Deno.cwd(), "task", "output.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("returns path in directory if destinationFile is filename only without extension", async () => {
    const dir = resolve(Deno.cwd(), "tmp", "output_dir2");
    await Deno.mkdir(dir, { recursive: true });
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue",
      options: { destinationFile: dir },
    });
    const result = resolver.getPath();
    assertMatch(result, new RegExp(`${dir}/\\d{8}_[a-f0-9]{7}\\.md$`));
    await Deno.remove(dir, { recursive: true });
  });
});

describe("OutputFilePathResolver: Windows/ambiguous cases", () => {
  it("normalizes Windows-style path separators", () => {
    const winPath = "foo\\bar\\output.md";
    const expected = resolve(Deno.cwd(), "foo", "bar", "output.md");
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: { destinationFile: winPath },
    });
    assertEquals(resolver.getPath(), expected);
  });
  it("handles ambiguous case where destinationFile is a directory name with extension", async () => {
    const dirName = "ambiguous.md";
    await Deno.mkdir(dirName, { recursive: true });
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue",
      options: { destinationFile: dirName },
    });
    // Should resolve to <cwd>/ambiguous.md/<generated>.md
    const result = resolver.getPath();
    const pattern = new RegExp(`${resolve(Deno.cwd(), dirName)}/\\d{8}_[a-f0-9]{7}\\.md$`);
    assertMatch(result, pattern);
    await Deno.remove(dirName, { recursive: true });
  });
});

describe("OutputFilePathResolver: unique filename generation", () => {
  it("generates unique filenames for default output (hash collision test)", () => {
    const resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: {},
    });
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(resolver.getPath());
    }
    // All generated filenames should be unique
    assertEquals(results.size, 10);
  });
});
