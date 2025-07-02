import { assertEquals } from "@std/assert";
import { PromptTemplatePathResolver as _PromptTemplatePathResolver } from "./prompt_template_path_resolver.ts";
import { ensureDir } from "@std/fs";
import { isAbsolute, join, resolve } from "@std/path";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";
import type { TwoParamsResult } from "../deps.ts";

/*
 * IMPORTANT: All path resolution is based on config/app_prompt.base_dir (and app_schema.base_dir).
 * - baseDirOverride or promptDir override is NOT supported.
 * - All tests use config/app_prompt.base_dir for baseDir resolution.
 */

describe("PromptTemplatePathResolver: baseDir resolution", () => {
  it("falls back to config.app_prompt.base_dir", async () => {
    const _baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "to", "project", "f_project.md"));
    await Deno.remove(baseDir, { recursive: true });
  });
  it("uses relative baseDir and resolves to absolute", async () => {
    const relBaseDir = "./tmp/prompts";
    const absBaseDir = resolve(Deno.cwd(), relBaseDir);
    const promptDir = join(absBaseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: relBaseDir } },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    const _result = _resolver.getPath();
    assertEquals(isAbsolute(_result), true);
    assertEquals(_result, join(absBaseDir, "to", "project", "f_project.md"));
    await Deno.remove(absBaseDir, { recursive: true });
  });
  it("config.app_prompt.base_dir is a nested relative path", async () => {
    const relBaseDir = "./tmp/nested/prompts";
    const absBaseDir = resolve(Deno.cwd(), relBaseDir);
    const promptDir = join(absBaseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: relBaseDir } },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(absBaseDir, "to", "project", "f_project.md"));
    await Deno.remove(absBaseDir, { recursive: true });
  });
  it("config.app_prompt.base_dir is an absolute path", async () => {
    const absBaseDir = await Deno.makeTempDir();
    const promptDir = join(absBaseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: absBaseDir } },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(absBaseDir, "to", "project", "f_project.md"));
    await Deno.remove(absBaseDir, { recursive: true });
  });
  it("config.app_prompt.base_dir is empty string (should fallback to default)", async () => {
    const defaultBaseDir = resolve(Deno.cwd(), "lib/breakdown/prompts");
    const promptDir = join(defaultBaseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: "" } },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(defaultBaseDir, "to", "project", "f_project.md"));
    await Deno.remove(defaultBaseDir, { recursive: true });
  });
  it("config.app_prompt.base_dir is deeply nested", async () => {
    const relBaseDir = "./tmp/deeply/nested/prompts";
    const absBaseDir = resolve(Deno.cwd(), relBaseDir);
    const promptDir = join(absBaseDir, "summary", "task");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_task.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: relBaseDir } },
      { demonstrativeType: "summary", layerType: "task", options: {} },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(absBaseDir, "summary", "task", "f_task.md"));
    await Deno.remove(absBaseDir, { recursive: true });
  });
});

describe("PromptTemplatePathResolver: adaptation/fallback logic", () => {
  it("adaptation file preferred if exists", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "project");
    await ensureDir(promptDir);
    const adaptationFile = join(promptDir, "f_project_strict.md");
    await Deno.writeTextFile(adaptationFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project", options: { adaptation: "strict" } },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, adaptationFile);
    await Deno.remove(baseDir, { recursive: true });
  });
  it("uses adaptation and falls back if not found", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "project");
    await ensureDir(promptDir);
    // Only fallback file exists
    const fallbackFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(fallbackFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project", options: { adaptation: "special" } },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, fallbackFile);
    await Deno.remove(baseDir, { recursive: true });
  });
  it("adaptation and fallback both missing", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "project");
    await ensureDir(promptDir);
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project", options: { adaptation: "strict" } },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "to", "project", "f_project_strict.md"));
    await Deno.remove(baseDir, { recursive: true });
  });
});

describe("PromptTemplatePathResolver: fromLayerType inference", () => {
  it("infers fromLayerType from fromFile", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "issue");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_issue.md");
    await Deno.writeTextFile(promptFile, "dummy");
    // fromLayerType omitted, fromFile contains 'issue'
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      {
        demonstrativeType: "to",
        layerType: "issue",
        options: { fromFile: "something/created/123_issue_file.md" },
      },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "to", "issue", "f_issue.md"));
    await Deno.remove(baseDir, { recursive: true });
  });
  it("uses explicit fromLayerType", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "issue");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      {
        demonstrativeType: "to",
        layerType: "issue",
        options: { fromFile: "foo.md", fromLayerType: "project" },
      },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "to", "issue", "f_project.md"));
    await Deno.remove(baseDir, { recursive: true });
  });
  it("falls back to layerType if fromFile has no keyword", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "to", "task");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_task.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "task", options: { fromFile: "foo.md" } },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "to", "task", "f_task.md"));
    await Deno.remove(baseDir, { recursive: true });
  });
});

describe("PromptTemplatePathResolver: file existence and edge cases", () => {
  it("returns path even if file does not exist", async () => {
    const baseDir = await Deno.makeTempDir();
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project", options: {} },
    );
    const expected = join(baseDir, "to", "project", "f_project.md");
    const _result = _resolver.getPath();
    assertEquals(_result, expected);
    await Deno.remove(baseDir, { recursive: true });
  });
  it("returns correct path for missing demonstrativeType/layerType", async () => {
    const baseDir = "somewhere";
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "", layerType: "", options: {} },
    );
    const expected = resolve(Deno.cwd(), baseDir, "", "", "f_.md");
    const _result = _resolver.getPath();
    assertEquals(_result, expected);
  });
  it("fromFile is absolute path", async () => {
    const baseDir = await Deno.makeTempDir();
    const absFromFile = join(baseDir, "foo", "bar", "project_file.md");
    const promptDir = join(baseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(promptFile, "dummy");
    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      { demonstrativeType: "to", layerType: "project", options: { fromFile: absFromFile } },
    );
    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "to", "project", "f_project.md"));
    await Deno.remove(baseDir, { recursive: true });
  });
});

describe("PromptTemplatePathResolver: fromLayerType (--input option)", () => {
  it("uses fromLayerType when provided via --input option", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "summary", "issue");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_task.md");
    await Deno.writeTextFile(promptFile, "dummy");

    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      {
        demonstrativeType: "summary",
        layerType: "issue",
        options: { fromLayerType: "task" }, // --input=task
      },
    );

    const _result = _resolver.getPath();
    // Should use f_task.md instead of f_issue.md
    assertEquals(_result, join(baseDir, "summary", "issue", "f_task.md"));
    await Deno.remove(baseDir, { recursive: true });
  });

  it("falls back to layerType when fromLayerType is not provided", async () => {
    const baseDir = await Deno.makeTempDir();
    const promptDir = join(baseDir, "summary", "issue");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_issue.md");
    await Deno.writeTextFile(promptFile, "dummy");

    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      {
        demonstrativeType: "summary",
        layerType: "issue",
        options: {}, // No --input option
      },
    );

    const _result = _resolver.getPath();
    // Should use f_issue.md as default
    assertEquals(_result, join(baseDir, "summary", "issue", "f_issue.md"));
    await Deno.remove(baseDir, { recursive: true });
  });

  it("handles all combinations of demonstrativeType/layerType with fromLayerType", async () => {
    const baseDir = await Deno.makeTempDir();

    // Test case: summary issue --input=task
    const promptDir = join(baseDir, "summary", "issue");
    await ensureDir(promptDir);
    await Deno.writeTextFile(join(promptDir, "f_task.md"), "dummy");

    const _resolver = new PromptTemplatePathResolver(
      { app_prompt: { base_dir: baseDir } },
      {
        demonstrativeType: "summary",
        layerType: "issue",
        options: { fromLayerType: "task" },
      },
    );

    const _result = _resolver.getPath();
    assertEquals(_result, join(baseDir, "summary", "issue", "f_task.md"));

    await Deno.remove(baseDir, { recursive: true });
  });
});

describe("PromptTemplatePathResolver: demonstrativeType/layerType combinations", () => {
  for (const demonstrativeType of ["to", "summary", "defect"]) {
    for (const layerType of ["project", "issue", "task"]) {
      it(`${demonstrativeType}/${layerType} basic`, async () => {
        const baseDir = await Deno.makeTempDir();
        const promptDir = join(baseDir, demonstrativeType, layerType);
        await ensureDir(promptDir);
        const promptFile = join(promptDir, `f_${layerType}.md`);
        await Deno.writeTextFile(promptFile, "dummy");
        const _resolver = new PromptTemplatePathResolver(
          { app_prompt: { base_dir: baseDir } },
          {
            demonstrativeType: demonstrativeType,
            layerType: layerType,
            options: {},
          },
        );
        const _result = _resolver.getPath();
        assertEquals(_result, join(baseDir, demonstrativeType, layerType, `f_${layerType}.md`));
        await Deno.remove(baseDir, { recursive: true });
      });
    }
  }
});
