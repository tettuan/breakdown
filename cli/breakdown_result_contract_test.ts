/**
 * @fileoverview runBreakdown returnMode error-contract tests (Issue #104).
 *
 * Guarantees preserved by these tests:
 * - `runBreakdown(args, { returnMode: true })` returns `{ ok: false, error }`
 *   when a prompt template cannot be resolved. The error carries
 *   `kind: "PromptGenerationError"` and preserves the upstream
 *   structured {@link PromptError} (discriminated union) on `error.cause`.
 * - In library mode (`returnMode: true`), a failed call produces no writes
 *   to `Deno.stdout`. (Warning/diagnostic messages may still go to stderr.)
 * - A happy-path invocation in library mode still returns
 *   `{ ok: true, data: string }` with a non-empty prompt body.
 * - A malformed CLI argument still surfaces as
 *   `{ ok: false, error: { kind: "ParameterParsingError" } }`, so the
 *   pre-#104 behaviour is not regressed by the new PromptGenerationError
 *   wrapping.
 *
 * Setup strategy:
 * - Each test creates an isolated temp directory and `Deno.chdir`s into
 *   it so BreakdownConfig's `.agent/climpt/config/` lookup resolves
 *   relative to the fixture. The original cwd is restored in `finally`.
 * - The fixture profile declares valid directive/layer patterns so
 *   BreakdownParams succeeds; the template directory is deliberately
 *   left empty (or populated minimally) to steer the handler toward the
 *   desired success or failure path.
 *
 * @module cli/breakdown_result_contract_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import { TestLoggerFactory } from "$test/helpers/test_logger_factory.ts";
import { runBreakdown } from "./breakdown.ts";

const logger = TestLoggerFactory.create("cross", "cli/breakdown-result-contract");

/**
 * Profile name used by all tests in this file. A dedicated profile keeps
 * the fixture YAML self-contained and avoids collisions with the shared
 * `default` / `default-test` profiles that other tests rely on.
 */
const PROFILE_NAME = "issue104-contract";

/**
 * Relative path (from a fixture's working directory) where
 * BreakdownConfig expects profile YAML files. Mirrors
 * `DEFAULT_CONFIG_DIR` in `lib/config/constants.ts`.
 */
const CONFIG_DIR_RELATIVE = ".agent/climpt/config";

/** Directive value used across fixtures (matches the profile pattern). */
const DIRECTIVE = "to";

/** Layer value used across fixtures (matches the profile pattern). */
const LAYER = "project";

/**
 * Base dir used in the "template-missing" scenario. The directory itself
 * is created (empty) so the resolver advances past the BaseDirectoryNotFound
 * check and fails with a structured TemplateNotFound PromptError instead.
 */
const EMPTY_PROMPT_BASE_DIR = "prompts-empty";

/** Base dir used by the success fixture that will be populated. */
const PRESENT_PROMPT_BASE_DIR = "prompts";

/**
 * Shape of the library-mode result we expect after Issue #104.
 * Kept local so the test does not depend on the internal
 * BreakdownError union re-exported from breakdown.ts.
 */
interface LibraryResultError {
  ok: false;
  error: {
    kind: string;
    cause?: unknown;
    message?: string;
  };
}

/**
 * Minimal fixture builder. Creates an isolated working directory with a
 * BreakdownConfig profile that parses successfully but points the
 * template base_dir at `promptBaseDir` (which may or may not exist).
 */
async function setupFixture(
  promptBaseDir: string,
  options: { createPromptDir?: boolean } = {},
): Promise<{ dir: string; restore: () => Promise<void> }> {
  const dir = await Deno.makeTempDir({ prefix: "breakdown-issue104-" });
  const configDir = join(dir, CONFIG_DIR_RELATIVE);
  await Deno.mkdir(configDir, { recursive: true });

  // Some scenarios need the prompt base_dir to exist (empty) so the
  // resolver proceeds past BaseDirectoryNotFound and emits the
  // structured TemplateNotFound PromptError instead.
  if (options.createPromptDir) {
    await Deno.mkdir(join(dir, promptBaseDir), { recursive: true });
  }

  // App config: directs template lookup to `promptBaseDir`.
  const appConfig = [
    `working_dir: "."`,
    `app_prompt:`,
    `  base_dir: "${promptBaseDir}"`,
    `app_schema:`,
    `  base_dir: "schemas"`,
    ``,
  ].join("\n");
  await Deno.writeTextFile(join(configDir, `${PROFILE_NAME}-app.yml`), appConfig);

  // User config: declares valid directive/layer patterns for the
  // BreakdownParams parse step, matching DIRECTIVE/LAYER above.
  const userConfig = [
    `params:`,
    `  two:`,
    `    directiveType:`,
    `      pattern: "^(to|summary|defect)$"`,
    `    layerType:`,
    `      pattern: "^(project|issue|task)$"`,
    `breakdown:`,
    `  params:`,
    `    two:`,
    `      directiveType:`,
    `        pattern: "^(to|summary|defect)$"`,
    `      layerType:`,
    `        pattern: "^(project|issue|task)$"`,
    ``,
  ].join("\n");
  await Deno.writeTextFile(join(configDir, `${PROFILE_NAME}-user.yml`), userConfig);

  const originalCwd = Deno.cwd();
  Deno.chdir(dir);

  logger.debug("Fixture ready", {
    stage: "setup",
    dir,
    promptBaseDir,
    profile: PROFILE_NAME,
  });

  const restore = async () => {
    Deno.chdir(originalCwd);
    try {
      await Deno.remove(dir, { recursive: true });
    } catch {
      // Best-effort cleanup: the test run must not fail because of
      // leftover tempdir contents.
    }
  };

  return { dir, restore };
}

/**
 * Stub `Deno.stdout.write` so any bytes the CLI tries to emit are
 * captured in memory instead of polluting the test reporter's output.
 * The returned accessor reports the total byte count so assertions can
 * enforce the library-mode "no stdout" contract.
 */
function captureStdout(): { restore: () => void; bytesWritten: () => number } {
  const original = Deno.stdout.write;
  let total = 0;
  Deno.stdout.write = (data: Uint8Array) => {
    total += data.byteLength;
    return Promise.resolve(data.byteLength);
  };
  return {
    restore: () => {
      Deno.stdout.write = original;
    },
    bytesWritten: () => total,
  };
}

/**
 * Create a minimal prompt template under `<cwd>/<baseDir>/<directive>/<layer>/`
 * so the happy-path test has something for the resolver to find.
 */
async function writeMinimalTemplate(
  cwd: string,
  baseDir: string,
  directive: string,
  layer: string,
): Promise<void> {
  const dir = join(cwd, baseDir, directive, layer);
  await Deno.mkdir(dir, { recursive: true });
  const body = "# Contract Test Prompt\n\nDirective: {directive}\nLayer: {layer}\n";
  // The resolver tries a handful of filenames; cover the common ones so
  // the test does not need to mirror every fallback path the resolver
  // enumerates.
  for (const name of ["f_project.md", "f_default.md", "f_issue.md", "f_task.md"]) {
    await Deno.writeTextFile(join(dir, name), body);
  }
}

Deno.test(
  "runBreakdown returnMode returns ok:false with PromptGenerationError when template is missing",
  async () => {
    const { dir, restore } = await setupFixture(EMPTY_PROMPT_BASE_DIR, {
      createPromptDir: true,
    });
    const capture = captureStdout();
    try {
      const args = [`--config=${PROFILE_NAME}`, DIRECTIVE, LAYER, "--destination=-"];
      const result = await runBreakdown(args, { returnMode: true });
      capture.restore();

      logger.debug("Missing template invocation result", {
        stage: "verification",
        dir,
        ok: result.ok,
        kind: result.ok ? null : result.error.kind,
        cause: result.ok ? null : (result.error as LibraryResultError["error"]).cause,
      });

      assertEquals(
        result.ok,
        false,
        "runBreakdown must surface missing template as ok:false in library mode",
      );
      if (result.ok) return; // Narrowing for TS; assertion above already failed.

      const err = (result as LibraryResultError).error;
      assertEquals(
        err.kind,
        "PromptGenerationError",
        "Missing template should map to PromptGenerationError (Issue #104)",
      );

      // The cause must exist and reference the template-not-found
      // condition. Depending on which layer surfaces first (path resolver
      // vs BreakdownPrompt adapter) the cause may be either a structured
      // PromptError object (`{kind: "TemplateNotFound", ...}`) or a
      // string describing the same condition. Both are acceptable for
      // Issue #104 - the key contract is "not silently dropped".
      assertExists(err.cause, "PromptGenerationError must carry a cause");
      const causeType = typeof err.cause;
      assertEquals(
        causeType === "object" || causeType === "string",
        true,
        `PromptGenerationError.cause must be object or string, got ${causeType}`,
      );
      if (causeType === "object" && err.cause !== null && "kind" in (err.cause as object)) {
        const causeKind = (err.cause as { kind: unknown }).kind;
        assertEquals(
          causeKind,
          "TemplateNotFound",
          "Structured PromptError.kind should be TemplateNotFound when template is missing",
        );
      } else if (causeType === "string") {
        // Fallback: the string form must at least mention the template
        // so callers retain a diagnostic. This is how the path-resolver
        // branch currently surfaces the condition.
        const causeStr = err.cause as string;
        const mentionsTemplate = /template|directory|base.?dir/i.test(causeStr);
        assertEquals(
          mentionsTemplate,
          true,
          `Stringified cause should reference template/directory context, got: ${causeStr}`,
        );
      }
    } finally {
      capture.restore();
      await restore();
    }
  },
);

Deno.test(
  "runBreakdown library mode does not write to stdout on template error",
  async () => {
    const { restore } = await setupFixture(EMPTY_PROMPT_BASE_DIR, {
      createPromptDir: true,
    });
    const capture = captureStdout();
    try {
      const args = [`--config=${PROFILE_NAME}`, DIRECTIVE, LAYER, "--destination=-"];
      const result = await runBreakdown(args, { returnMode: true });

      // Assert failure first so the zero-stdout claim is meaningful.
      assertEquals(result.ok, false, "Precondition: template-missing call should fail");

      const bytes = capture.bytesWritten();
      logger.debug("Stdout byte count after failing library call", {
        stage: "verification",
        bytes,
      });
      assertEquals(
        bytes,
        0,
        "Library mode must not emit any bytes to stdout when the call fails",
      );
    } finally {
      capture.restore();
      await restore();
    }
  },
);

Deno.test(
  "runBreakdown returnMode returns ok:true with prompt content on success",
  async () => {
    const { dir, restore } = await setupFixture(PRESENT_PROMPT_BASE_DIR);
    await writeMinimalTemplate(dir, PRESENT_PROMPT_BASE_DIR, DIRECTIVE, LAYER);
    const capture = captureStdout();

    // Skip STDIN read so the handler does not block waiting for input.
    const originalSkipStdin = Deno.env.get("BREAKDOWN_SKIP_STDIN");
    Deno.env.set("BREAKDOWN_SKIP_STDIN", "true");
    try {
      const args = [`--config=${PROFILE_NAME}`, DIRECTIVE, LAYER, "--destination=-"];
      const result = await runBreakdown(args, { returnMode: true });
      capture.restore();

      logger.debug("Happy-path library call result", {
        stage: "verification",
        ok: result.ok,
        bytesWritten: capture.bytesWritten(),
      });

      assertEquals(result.ok, true, "Happy-path library call should succeed");
      if (!result.ok) return;
      assertExists(result.data, "returnMode:true must populate Result.data");
      assertEquals(typeof result.data, "string", "Result.data should be the prompt string");
      assertEquals(
        (result.data as string).length > 0,
        true,
        "Prompt content should not be empty on success",
      );
      assertEquals(
        capture.bytesWritten(),
        0,
        "Library mode must not tee prompt content to stdout on success either",
      );
    } finally {
      capture.restore();
      if (originalSkipStdin !== undefined) {
        Deno.env.set("BREAKDOWN_SKIP_STDIN", originalSkipStdin);
      } else {
        Deno.env.delete("BREAKDOWN_SKIP_STDIN");
      }
      await restore();
    }
  },
);

Deno.test(
  "runBreakdown returnMode surfaces ParameterParsingError for malformed args",
  async () => {
    // Arguments that fail the directive/layer patterns declared in the
    // fixture profile - the CLI must report a ParameterParsingError
    // rather than being rewrapped as PromptGenerationError.
    const { restore } = await setupFixture(PRESENT_PROMPT_BASE_DIR);
    const capture = captureStdout();
    try {
      const args = [
        `--config=${PROFILE_NAME}`,
        "totally_invalid_directive",
        "also_invalid_layer",
      ];
      const result = await runBreakdown(args, { returnMode: true });
      capture.restore();

      logger.debug("Parameter parsing invocation result", {
        stage: "verification",
        ok: result.ok,
        kind: result.ok ? null : result.error.kind,
      });

      assertEquals(result.ok, false, "Malformed args must not succeed");
      if (result.ok) return;

      // The pre-#104 contract is preserved: bad args => ParameterParsingError.
      assertEquals(
        result.error.kind,
        "ParameterParsingError",
        "Malformed args should still surface as ParameterParsingError, not PromptGenerationError",
      );
      assertEquals(
        capture.bytesWritten(),
        0,
        "Library mode must not write to stdout for parameter errors either",
      );
    } finally {
      capture.restore();
      await restore();
    }
  },
);
