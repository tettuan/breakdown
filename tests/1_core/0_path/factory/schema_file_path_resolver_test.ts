import { assertEquals } from "@std/assert";
import { SchemaFilePathResolver } from "$lib/factory/SchemaFilePathResolver.ts";
import { join, resolve, isAbsolute } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";

describe("SchemaFilePathResolver: base_dir resolution", () => {
  it("resolves with config.app_schema.base_dir (absolute)", () => {
    const baseDir = resolve(Deno.cwd(), "tmp", "schemas");
    const resolver = new SchemaFilePathResolver(
      { app_schema: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project" },
    );
    const expected = join(baseDir, "to", "project", "base.schema.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("resolves with config.app_schema.base_dir (relative)", () => {
    const relBaseDir = "./tmp/rel_schemas";
    const absBaseDir = resolve(Deno.cwd(), relBaseDir);
    const resolver = new SchemaFilePathResolver(
      { app_schema: { base_dir: relBaseDir } },
      { demonstrativeType: "summary", layerType: "issue" },
    );
    const expected = join(absBaseDir, "summary", "issue", "base.schema.md");
    assertEquals(resolver.getPath(), expected);
  });
  it("falls back to default if config.app_schema.base_dir is not set", () => {
    const defaultBaseDir = resolve(Deno.cwd(), ".agent/breakdown/schemas");
    const resolver = new SchemaFilePathResolver(
      {},
      { demonstrativeType: "defect", layerType: "task" },
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
      { demonstrativeType: "to", layerType: "issue" },
    );
    const result = resolver.getPath();
    assertEquals(isAbsolute(result), true);
  });
}); 