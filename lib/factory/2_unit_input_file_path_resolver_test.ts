import { assertEquals } from "@std/assert";
import { InputFilePathResolver as _InputFilePathResolver } from "./input_file_path_resolver.ts";
import { join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType } from "../types/mod.ts";

describe("InputFilePathResolver: fromFile not provided/absolute/relative", () => {
  it("returns empty string if fromFile is not provided", async () => {
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    });
    assertEquals(_resolver.getPath(), "");
  });
  it("returns absolute path if fromFile is absolute", async () => {
    const absPath = resolve(Deno.cwd(), "foo", "bar", "input.md");
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: absPath },
    });
    assertEquals(_resolver.getPath(), absPath);
  });
  it("resolves path if fromFile has path hierarchy (relative)", async () => {
    const relPath = join("foo", "bar", "input.md");
    const expected = resolve(Deno.cwd(), relPath);
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: relPath },
    });
    assertEquals(_resolver.getPath(), expected);
  });
});

describe("InputFilePathResolver: layerType/fromLayerType handling", () => {
  it("resolves path if fromFile is filename only (uses layerType)", async () => {
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { fromFile: "input.md" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    assertEquals(_resolver.getPath(), expected);
  });
  it("resolves path if fromFile is filename only (uses fromLayerType)", async () => {
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "task",
      options: { fromFile: "input.md", fromLayerType: "project" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    assertEquals(_resolver.getPath(), expected);
  });
});

describe("InputFilePathResolver: Windows/edge/ambiguous cases", () => {
  it("normalizes Windows-style path separators", async () => {
    const winPath = "foo\\bar\\input.md";
    const expected = resolve(Deno.cwd(), "foo", "bar", "input.md");
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: winPath },
    });
    assertEquals(_resolver.getPath(), expected);
  });
  it("handles edge case with empty layerType and fromLayerType", async () => {
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: "input.md" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    assertEquals(_resolver.getPath(), expected);
  });
  it("handles ambiguous case where fromFile is a directory name", async () => {
    const dirName = "ambiguous.md";
    await Deno.mkdir(dirName, { recursive: true });
    const _resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { fromFile: dirName },
    });
    // Should resolve to <cwd>/ambiguous.md (not treat as directory)
    const expected = resolve(Deno.cwd(), dirName);
    assertEquals(_resolver.getPath(), expected);
    await Deno.remove(dirName, { recursive: true });
  });
});
