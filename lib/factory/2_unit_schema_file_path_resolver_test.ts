import { assertEquals } from "@std/assert";
import { SchemaFilePathResolver } from "./schema_file_path_resolver.ts";
import { isAbsolute, join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";

describe("SchemaFilePathResolver: base_dir resolution", () => {
  it("resolves with config.app_schema.base_dir (absolute)", () => {
    const baseDir = resolve(Deno.cwd(), "tmp", "schema");
    const resolver = new SchemaFilePathResolver(
      { app_schema: { base_dir: baseDir } },
      {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "project" as LayerType,
        options: {},
      },
    );
    const expected = join(baseDir, "to", "project", "base.schema.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("resolves with config.app_schema.base_dir (relative)", () => {
    const relBaseDir = "./tmp/rel_schema";
    const absBaseDir = resolve(Deno.cwd(), relBaseDir);
    const resolver = new SchemaFilePathResolver(
      { app_schema: { base_dir: relBaseDir } },
      {
        demonstrativeType: "summary" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {},
      },
    );
    const expected = join(absBaseDir, "summary", "issue", "base.schema.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("falls back to default if config.app_schema.base_dir is not set", () => {
    const defaultBaseDir = resolve(Deno.cwd(), ".agent/breakdown/schema");
    const resolver = new SchemaFilePathResolver(
      {},
      {
        demonstrativeType: "defect" as DemonstrativeType,
        layerType: "task" as LayerType,
        options: {},
      },
    );
    const expected = join(defaultBaseDir, "defect", "task", "base.schema.md");
    assertEquals(resolver.getPath(), expected);
  });
});

describe("SchemaFilePathResolver: absolute path check", () => {
  it("returns absolute path", () => {
    const relBaseDir = "./tmp/abs_schema";
    const resolver = new SchemaFilePathResolver(
      { app_schema: { base_dir: relBaseDir } },
      {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {},
      },
    );
    const result = resolver.getPath();
    assertEquals(isAbsolute(result), true);
  });
});
