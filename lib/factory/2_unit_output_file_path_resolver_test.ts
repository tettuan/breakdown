import { assertEquals, assertMatch } from "@std/assert";
import { OutputFilePathResolver as _OutputFilePathResolver } from "./output_file_path_resolver.ts";
import { join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType } from "../types/mod.ts";

describe("OutputFilePathResolver: path resolution", () => {
  it("returns default path if destinationFile is not provided", async () => {
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    });
    const _result = _resolver.getPath();
    assertMatch(_result, new RegExp(`/project/\\d{8}_[a-f0-9]{7}\\.md$`));
  });
  it("returns absolute path if destinationFile is absolute file path", async () => {
    const absPath = resolve(Deno.cwd(), "foo", "bar", "output.md");
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: absPath },
    });
    assertEquals(_resolver.getPath(), absPath);
  });
  it("returns path if destinationFile has path hierarchy and extension", async () => {
    const relPath = join("foo", "bar", "output.md");
    const expected = resolve(Deno.cwd(), relPath);
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "task",
      options: { destinationFile: relPath },
    });
    assertEquals(_resolver.getPath(), expected);
  });
});

describe("OutputFilePathResolver: directory/file/extension handling", () => {
  it("returns path in directory if destinationFile is directory", async () => {
    const dir = resolve(Deno.cwd(), "tmp", "output_dir");
    await Deno.mkdir(dir, { recursive: true });
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { destinationFile: dir },
    });
    const _result = _resolver.getPath();
    assertMatch(_result, new RegExp(`${dir}/\\d{8}_[a-f0-9]{7}\\.md$`));
    await Deno.remove(dir, { recursive: true });
  });
  it("returns path in layerType dir if destinationFile is filename only with extension", async () => {
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "task",
      options: { destinationFile: "output.md" },
    });
    const expected = resolve(Deno.cwd(), "task", "output.md");
    assertEquals(_resolver.getPath(), expected);
  });
  it("returns path in directory if destinationFile is filename only without extension", async () => {
    const dir = resolve(Deno.cwd(), "tmp", "output_dir2");
    await Deno.mkdir(dir, { recursive: true });
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { destinationFile: dir },
    });
    const _result = _resolver.getPath();
    assertMatch(_result, new RegExp(`${dir}/\\d{8}_[a-f0-9]{7}\\.md$`));
    await Deno.remove(dir, { recursive: true });
  });
});

describe("OutputFilePathResolver: Windows/ambiguous cases", () => {
  it("normalizes Windows-style path separators", async () => {
    const winPath = "foo\\bar\\output.md";
    const expected = resolve(Deno.cwd(), "foo", "bar", "output.md");
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { destinationFile: winPath },
    });
    assertEquals(_resolver.getPath(), expected);
  });
  it("handles ambiguous case where destinationFile is a directory name with extension", async () => {
    const dirName = "ambiguous.md";
    await Deno.mkdir(dirName, { recursive: true });
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { destinationFile: dirName },
    });
    // Should resolve to <cwd>/ambiguous.md/<generated>.md
    const _result = _resolver.getPath();
    const pattern = new RegExp(`${resolve(Deno.cwd(), dirName)}/\\d{8}_[a-f0-9]{7}\\.md$`);
    assertMatch(_result, pattern);
    await Deno.remove(dirName, { recursive: true });
  });
});

describe("OutputFilePathResolver: unique filename generation", () => {
  it("generates unique filenames for default output (hash collision test)", async () => {
    const _resolver = new OutputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    });
    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      results.add(_resolver.getPath());
    }
    // All generated filenames should be unique
    assertEquals(results.size, 10);
  });
});
