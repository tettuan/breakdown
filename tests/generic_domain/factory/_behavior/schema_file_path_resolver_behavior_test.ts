import { assertEquals } from "../../../lib/deps.ts";
import { SchemaFilePathResolver } from "../../../../lib/factory/schema_file_path_resolver.ts";
import { isAbsolute, join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";

describe("SchemaFilePathResolver: base_dir resolution", () => {
  it("resolves with config.app_schema.base_dir (absolute)", () => {
    const baseDir = resolve(Deno.cwd(), "tmp", "schema");
    const resolverResult = SchemaFilePathResolver.create(
      { app_schema: { base_dir: baseDir } },
      {
        demonstrativeType: "to",
        layerType: "project",
        options: {},
      },
    );
    const expected = join(baseDir, "to", "project", "base.schema.md");
    assertEquals(resolverResult.ok, true);
    if (!resolverResult.ok) return;
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();
    assertEquals(pathResult.ok, true);
    if (!pathResult.ok) return;
    assertEquals(pathResult.data.value, expected);
  });
  it("resolves with config.app_schema.base_dir (relative)", () => {
    const relBaseDir = "./tmp/rel_schema";
    const absBaseDir = resolve(Deno.cwd(), relBaseDir);
    const resolverResult = SchemaFilePathResolver.create(
      { app_schema: { base_dir: relBaseDir } },
      {
        demonstrativeType: "summary",
        layerType: "issue",
        options: {},
      },
    );
    const expected = join(absBaseDir, "summary", "issue", "base.schema.md");
    assertEquals(resolverResult.ok, true);
    if (!resolverResult.ok) return;
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();
    assertEquals(pathResult.ok, true);
    if (!pathResult.ok) return;
    assertEquals(pathResult.data.value, expected);
  });
  it("falls back to default if config.app_schema.base_dir is not set", () => {
    const defaultBaseDir = resolve(Deno.cwd(), ".agent/breakdown/schema");
    const resolverResult = SchemaFilePathResolver.create(
      {},
      {
        demonstrativeType: "defect",
        layerType: "task",
        options: {},
      },
    );
    const expected = join(defaultBaseDir, "defect", "task", "base.schema.md");
    assertEquals(resolverResult.ok, true);
    if (!resolverResult.ok) return;
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();
    assertEquals(pathResult.ok, true);
    if (!pathResult.ok) return;
    assertEquals(pathResult.data.value, expected);
  });
});

describe("SchemaFilePathResolver: absolute path check", () => {
  it("returns absolute path", () => {
    const relBaseDir = "./tmp/abs_schema";
    const resolverResult = SchemaFilePathResolver.create(
      { app_schema: { base_dir: relBaseDir } },
      {
        demonstrativeType: "to",
        layerType: "issue",
        options: {},
      },
    );
    assertEquals(resolverResult.ok, true);
    if (!resolverResult.ok) return;
    const resolver = resolverResult.data;
    const pathResult = resolver.getPath();
    assertEquals(pathResult.ok, true);
    if (!pathResult.ok) return;
    const result = pathResult.data.value;
    assertEquals(isAbsolute(result), true);
  });
});
