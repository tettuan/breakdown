import { assertEquals } from "../../../lib/deps.ts";
import { InputFilePathResolver } from "../../../../lib/factory/input_file_path_resolver.ts";
import { join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType } from "../types/mod.ts";

describe("InputFilePathResolver: fromFile not provided/absolute/relative", () => {
  it("returns empty string if fromFile is not provided", async () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: {},
    });
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, "");
  });
  it("returns absolute path if fromFile is absolute", async () => {
    const absPath = resolve(Deno.cwd(), "foo", "bar", "input.md");
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: absPath },
    });
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, absPath);
  });
  it("resolves path if fromFile has path hierarchy (relative)", async () => {
    const relPath = join("foo", "bar", "input.md");
    const expected = resolve(Deno.cwd(), relPath);
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: relPath },
    });
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, expected);
  });
});

describe("InputFilePathResolver: layerType/fromLayerType handling", () => {
  it("resolves path if fromFile is filename only (uses layerType)", async () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { fromFile: "input.md" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, expected);
  });
  it("resolves path if fromFile is filename only (uses fromLayerType)", async () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "task",
      options: { fromFile: "input.md", fromLayerType: "project" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, expected);
  });
});

describe("InputFilePathResolver: Windows/edge/ambiguous cases", () => {
  it("normalizes Windows-style path separators", async () => {
    const winPath = "foo\\bar\\input.md";
    const expected = resolve(Deno.cwd(), "foo", "bar", "input.md");
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: winPath },
    });
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, expected);
  });
  it("handles edge case with empty layerType and fromLayerType", async () => {
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "project",
      options: { fromFile: "input.md" },
    });
    const expected = resolve(Deno.cwd(), "input.md");
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, expected);
  });
  it("handles ambiguous case where fromFile is a directory name", async () => {
    const dirName = "ambiguous.md";
    await Deno.mkdir(dirName, { recursive: true });
    const resolver = new InputFilePathResolver({}, {
      demonstrativeType: "to",
      layerType: "issue",
      options: { fromFile: dirName },
    });
    // Should resolve to <cwd>/ambiguous.md (not treat as directory)
    const expected = resolve(Deno.cwd(), dirName);
    const result = resolver.getPath();
    assertEquals(result.ok, true);
    if (result.ok) assertEquals(result.data.data, expected);
    await Deno.remove(dirName, { recursive: true });
  });
});
