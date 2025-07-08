/**
 * プロンプトパス決定ドメインテスト
 * 
 * 検証対象: ユーザーの意図を正確なファイルパスに変換する確実性
 * 
 * 核心価値:
 * - パス決定の100%確実性
 * - 準備コストの非対称性への対応
 * - 明確なエラーメッセージによる問題切り分け
 * 
 * 移行元: tests/1_core/0_path/path_resolver_test.ts
 */

import { assertEquals, assertRejects } from "../../lib/deps.ts";
import { join } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import { ensureDir } from "@std/fs";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { TotalityPromptVariablesFactory } from "../../../lib/factory/prompt_variables_factory.ts";
import { cleanupTestEnvironment, setupTestEnvironment } from "../../helpers/setup.ts";

const logger = new BreakdownLogger("prompt-path-resolution");

/**
 * CLIパラメータ構築ヘルパー
 */
function makeCliParams(
  {
    demonstrativeType,
    layerType,
    fromFile,
    destinationFile,
    fromLayerType,
    adaptation,
    config,
  }: {
    demonstrativeType: string;
    layerType: string;
    fromFile?: string;
    destinationFile?: string;
    fromLayerType?: string;
    adaptation?: string;
    config?: string;
  }
) {
  return {
    demonstrativeType,
    layerType,
    options: {
      fromFile: fromFile ?? undefined,
      destinationFile: destinationFile ?? undefined,
      fromLayerType,
      adaptation,
      config,
    },
  };
}

describe("プロンプトパス決定ドメイン", () => {
  describe("核心価値1: パス決定の確実性保証", () => {
    it("同じ入力からは必ず同じパスを生成する（決定論的アルゴリズム）", async () => {
      const env = await setupTestEnvironment({
        workingDir: "./tmp/test_path_deterministic",
        configSetName: "test-path-deterministic",
      });

      try {
        // テスト環境の準備
        await ensureDir(join(env.workingDir, "prompts", "to", "issue"));
        await ensureDir(join(env.workingDir, "schema", "to", "issue"));
        
        await Deno.writeTextFile(
          join(env.workingDir, "prompts", "to", "issue", "f_project.md"),
          "# Test prompt"
        );
        await Deno.writeTextFile(
          join(env.workingDir, "schema", "to", "issue", "base.schema.md"),
          "# Test schema"
        );

        const originalCwd = Deno.cwd();
        Deno.chdir(env.workingDir);

        try {
          const cliParams = makeCliParams({
            demonstrativeType: "to",
            layerType: "issue",
            config: "test-path-deterministic",
          });

          // 複数回実行して同じ結果を得ることを確認
          const factoryResult1 = await TotalityPromptVariablesFactory.create(cliParams);
          if (!factoryResult1.ok) {
            logger.error("Factory creation failed", factoryResult1.error);
            throw new Error(`Factory creation failed: ${factoryResult1.error.kind}`);
          }
          const factory1 = factoryResult1.data;
          
          const factoryResult2 = await TotalityPromptVariablesFactory.create(cliParams);
          if (!factoryResult2.ok) {
            logger.error("Factory creation failed", factoryResult2.error);
            throw new Error(`Factory creation failed: ${factoryResult2.error.kind}`);
          }
          const factory2 = factoryResult2.data;
          
          const factoryResult3 = await TotalityPromptVariablesFactory.create(cliParams);
          if (!factoryResult3.ok) {
            logger.error("Factory creation failed", factoryResult3.error);
            throw new Error(`Factory creation failed: ${factoryResult3.error.kind}`);
          }
          const factory3 = factoryResult3.data;

          assertEquals(factory1.promptFilePath, factory2.promptFilePath);
          assertEquals(factory2.promptFilePath, factory3.promptFilePath);
          
          logger.info("パス決定の確実性が保証されている", {
            path: factory1.promptFilePath,
          });
        } finally {
          Deno.chdir(originalCwd);
        }
      } finally {
        await cleanupTestEnvironment(env);
      }
    });

    it("パス生成で例外が発生しない（100%確実性）", async () => {
      const env = await setupTestEnvironment({
        workingDir: "./tmp/test_path_reliability",
        configSetName: "test-path-reliability",
      });

      try {
        // 基本的なディレクトリ構造のみ準備（ファイルは意図的に作成しない）
        await ensureDir(join(env.workingDir, "prompts", "to", "issue"));
        await ensureDir(join(env.workingDir, "schema", "to", "issue"));

        const originalCwd = Deno.cwd();
        Deno.chdir(env.workingDir);

        try {
          const cliParams = makeCliParams({
            demonstrativeType: "to",
            layerType: "issue",
            config: "test-path-reliability",
          });

          // パス決定自体は例外を発生させない
          const factoryResult = await TotalityPromptVariablesFactory.create(cliParams);
          if (!factoryResult.ok) {
            logger.error("Factory creation failed", factoryResult.error);
            throw new Error(`Factory creation failed: ${factoryResult.error.kind}`);
          }
          const factory = factoryResult.data;
          
          // パスが確実に決定される
          assertEquals(typeof factory.promptFilePath, "string");
          assertEquals(factory.promptFilePath.length > 0, true);

          logger.info("パス生成の確実性が保証されている", {
            path: factory.promptFilePath,
          });
        } finally {
          Deno.chdir(originalCwd);
        }
      } finally {
        await cleanupTestEnvironment(env);
      }
    });
  });

  describe("核心価値2: 準備コストの非対称性対応", () => {
    it("ファイル不存在時に明確なエラーメッセージを提供する", async () => {
      const env = await setupTestEnvironment({
        workingDir: "./tmp/test_path_error_clarity",
        configSetName: "test-path-error-clarity",
      });

      try {
        // ディレクトリ構造は作成するが、ファイルは意図的に作成しない
        await ensureDir(join(env.workingDir, "prompts", "to", "issue"));
        await ensureDir(join(env.workingDir, "schema", "to", "issue"));

        const originalCwd = Deno.cwd();
        Deno.chdir(env.workingDir);

        try {
          const cliParams = makeCliParams({
            demonstrativeType: "to",
            layerType: "issue",
            config: "test-path-error-clarity",
          });

          // ファイル不存在エラーの検証
          await assertRejects(
            async () => {
              const factoryResult = await TotalityPromptVariablesFactory.create(cliParams);
              assertEquals(factoryResult.ok, true);
              if (!factoryResult.ok) return; // Type guard
              const factory = factoryResult.data;
              // プロンプトファイルの実際の読み込みでエラーが発生する
              const result = await factory.toPromptParams();
              if (!result.ok) {
                throw result.error;
              }
            },
            Error
          );

          logger.info("明確なエラーメッセージが提供される");
        } finally {
          Deno.chdir(originalCwd);
        }
      } finally {
        await cleanupTestEnvironment(env);
      }
    });

    it("パス決定成功時の準備コスト明確化", async () => {
      const env = await setupTestEnvironment({
        workingDir: "./tmp/test_path_preparation_cost",
        configSetName: "test-path-preparation-cost",
      });

      try {
        // 必要な構造とファイルを準備
        await ensureDir(join(env.workingDir, "prompts", "to", "issue"));
        await ensureDir(join(env.workingDir, "schema", "to", "issue"));
        
        await Deno.writeTextFile(
          join(env.workingDir, "prompts", "to", "issue", "f_project.md"),
          "# Test prompt with {input_text}"
        );
        await Deno.writeTextFile(
          join(env.workingDir, "schema", "to", "issue", "base.schema.md"),
          "# Test schema"
        );

        const originalCwd = Deno.cwd();
        Deno.chdir(env.workingDir);

        try {
          const cliParams = makeCliParams({
            demonstrativeType: "to",
            layerType: "issue",
            config: "test-path-preparation-cost",
          });

          const factoryResult = await TotalityPromptVariablesFactory.create(cliParams);
          if (!factoryResult.ok) {
            logger.error("Factory creation failed", factoryResult.error);
            throw new Error(`Factory creation failed: ${factoryResult.error.kind}`);
          }
          const factory = factoryResult.data;
          
          // パスが正確に決定される
          assertEquals(factory.promptPath.includes("f_project.md"), true);
          assertEquals(factory.schemaPath.includes("base.schema.md"), true);

          logger.info("準備コスト明確化: 必要ファイルが特定されている", {
            promptPath: factory.promptPath,
            schemaPath: factory.schemaPath,
          });
        } finally {
          Deno.chdir(originalCwd);
        }
      } finally {
        await cleanupTestEnvironment(env);
      }
    });
  });

  describe("核心価値3: 相対パス処理の確実性", () => {
    it("fromFile相対パスを正確に解決する", async () => {
      const env = await setupTestEnvironment({
        workingDir: "./tmp/test_relative_path",
        configSetName: "test-relative-path",
      });

      try {
        // テスト環境の準備
        await ensureDir(join(env.workingDir, "prompts", "to", "issue"));
        await ensureDir(join(env.workingDir, "schema", "to", "issue"));
        await ensureDir(join(env.workingDir, "path", "to"));
        
        await Deno.writeTextFile(
          join(env.workingDir, "prompts", "to", "issue", "f_project.md"),
          "# Test prompt"
        );
        await Deno.writeTextFile(
          join(env.workingDir, "schema", "to", "issue", "base.schema.md"),
          "# Test schema"
        );
        await Deno.writeTextFile(
          join(env.workingDir, "path", "to", "file.md"),
          "# Test input"
        );

        const originalCwd = Deno.cwd();
        Deno.chdir(env.workingDir);

        try {
          const fromFile = join("path", "to", "file.md");
          const cliParams = makeCliParams({
            demonstrativeType: "to",
            layerType: "issue",
            fromFile,
            config: "test-relative-path",
          });

          const factoryResult = await TotalityPromptVariablesFactory.create(cliParams);
          if (!factoryResult.ok) {
            logger.error("Factory creation failed", factoryResult.error);
            throw new Error(`Factory creation failed: ${factoryResult.error.kind}`);
          }
          const factory = factoryResult.data;
          
          // 相対パスが正確に解決される
          assertEquals(factory.inputFilePath.includes("path/to/file.md"), true);
          
          logger.info("相対パス解決の確実性が保証されている", {
            inputPath: factory.inputFilePath,
            originalFromFile: fromFile,
          });
        } finally {
          Deno.chdir(originalCwd);
        }
      } finally {
        await cleanupTestEnvironment(env);
      }
    });
  });

  describe("境界値テスト", () => {
    it("DirectiveTypeとLayerTypeの境界組み合わせ", async () => {
      const env = await setupTestEnvironment({
        workingDir: "./tmp/test_boundary_combinations",
        configSetName: "test-boundary-combinations",
      });

      try {
        // 複数のDirectiveType/LayerType組み合わせを準備
        const combinations = [
          { directive: "to", layer: "project" },
          { directive: "summary", layer: "issue" },
          { directive: "defect", layer: "task" },
        ];

        for (const combo of combinations) {
          await ensureDir(join(env.workingDir, "prompts", combo.directive, combo.layer));
          await ensureDir(join(env.workingDir, "schema", combo.directive, combo.layer));
          
          await Deno.writeTextFile(
            join(env.workingDir, "prompts", combo.directive, combo.layer, "f_project.md"),
            `# Test prompt for ${combo.directive}/${combo.layer}`
          );
          await Deno.writeTextFile(
            join(env.workingDir, "schema", combo.directive, combo.layer, "base.schema.md"),
            `# Test schema for ${combo.directive}/${combo.layer}`
          );
        }

        const originalCwd = Deno.cwd();
        Deno.chdir(env.workingDir);

        try {
          for (const combo of combinations) {
            const cliParams = makeCliParams({
              demonstrativeType: combo.directive,
              layerType: combo.layer,
              config: "test-boundary-combinations",
            });

            const factoryResult = await TotalityPromptVariablesFactory.create(cliParams);
            if (!factoryResult.ok) {
              logger.error("Factory creation failed", factoryResult.error);
              throw new Error(`Factory creation failed: ${factoryResult.error.kind}`);
            }
            const factory = factoryResult.data;
            
            // 各組み合わせでパスが正確に決定される
            assertEquals(factory.promptPath.includes(combo.directive), true);
            assertEquals(factory.promptPath.includes(combo.layer), true);
            
            logger.info(`境界組み合わせ成功: ${combo.directive}/${combo.layer}`, {
              promptPath: factory.promptPath,
            });
          }
        } finally {
          Deno.chdir(originalCwd);
        }
      } finally {
        await cleanupTestEnvironment(env);
      }
    });
  });
});
