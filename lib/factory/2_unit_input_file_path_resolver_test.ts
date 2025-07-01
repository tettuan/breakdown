import { assertEquals } from "@std/assert";
import { InputFilePathResolver } from "./input_file_path_resolver.ts";
import { join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType } from "../types/mod.ts";

describe("InputFilePathResolver: fromFile not provided/absolute/relative", () => {
  it("returns empty string if fromFile is not provided", () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: {},
    });
    assertEquals(resolver.getPath(), "");
  });
  it("returns absolute path if fromFile is absolute", () => {
    const absPath = resolve(Deno.cwd(), "foo", "bar", "input.md");
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: { fromFile: absPath },
    });
    assertEquals(resolver.getPath(), absPath);
  });
  it("resolves path if fromFile has path hierarchy (relative)", () => {
    const relPath = join("foo", "bar", "input.md");
    const expected = resolve(Deno.cwd(), relPath);
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: { fromFile: relPath },
    });
    assertEquals(resolver.getPath(), expected);
  });
});

describe("InputFilePathResolver: layerType/fromLayerType handling", () => {
  it("resolves path if fromFile is filename only (uses layerType)", () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue",
      options: { fromFile: "input.md" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("resolves path if fromFile is filename only (uses fromLayerType)", () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "task",
      options: { fromFile: "input.md", fromLayerType: "project" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    assertEquals(resolver.getPath(), expected);
  });
});

describe("InputFilePathResolver: Windows/edge/ambiguous cases", () => {
  it("normalizes Windows-style path separators", () => {
    const winPath = "foo\\bar\\input.md";
    const expected = resolve(Deno.cwd(), "foo", "bar", "input.md");
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: { fromFile: winPath },
    });
    assertEquals(resolver.getPath(), expected);
  });
  it("handles edge case with empty layerType and fromLayerType", () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project",
      options: { fromFile: "input.md" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("handles ambiguous case where fromFile is a directory name", async () => {
    const dirName = "ambiguous.md";
    await Deno.mkdir(dirName, { recursive: true });
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue",
      options: { fromFile: dirName },
    });
    // Should resolve to <cwd>/ambiguous.md (not treat as directory)
    const expected = resolve(Deno.cwd(), dirName);
    assertEquals(resolver.getPath(), expected);
    await Deno.remove(dirName, { recursive: true });
  });
});
