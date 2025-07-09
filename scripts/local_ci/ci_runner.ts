/**
 * @file ci_runner.ts
 * @description Main CI runner class
 */

import type {
  BatchResult,
  CIConfig,
  CIResult,
  ProcessResult,
  TestResult,
  TypeCheckResult,
} from "./types.ts";
import { Logger } from "./logger.ts";
import { ProcessRunner } from "./process_runner.ts";
import { FileSystem } from "./file_system.ts";
import { CLIParser } from "./cli_parser.ts";

export class CIRunner {
  private config: CIConfig;
  private logger: Logger;
  private startTime: number;

  constructor(config: CIConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.startTime = Date.now();
  }

  /**
   * Run the complete CI pipeline
   */
  async run(): Promise<boolean> {
    try {
      // Special mode: Show only error files list
      if (this.config.errorFilesOnly) {
        const errorFiles = await this.runComprehensiveErrorListing();
        this.logger.errorSummary(errorFiles.typeCheckErrors, errorFiles.testFailures);
        return errorFiles.typeCheckErrors.length === 0 && errorFiles.testFailures.length === 0;
      }

      this.logger.section("Starting CI execution in optimized mode");

      const mode = CLIParser.getExecutionMode(this.config);
      this.logger.info(`Mode: ${mode}`);
      this.logger.info(`Batch Size: ${this.config.batchSize}`);
      this.logger.info(`Fallback Enabled: ${this.config.fallbackToSingleFile}`);

      // Track error files for silent mode
      const errorFiles = {
        typeCheckErrors: [] as string[],
        testFailures: [] as string[],
      };

      // Initialize lockfile
      await this.initializeLockfile();

      // Run type checks
      const typeCheckResult = await this.runTypeChecks();
      if (!typeCheckResult.success) {
        this.logger.failure("Type checks failed");
        errorFiles.typeCheckErrors = typeCheckResult.failedFiles;
        this.logger.errorFileList(
          "Type Check Failures",
          typeCheckResult.failedFiles,
          typeCheckResult.errors,
        );

        if (this.logger.getMode() === "silent") {
          this.logger.errorSummary(errorFiles.typeCheckErrors, errorFiles.testFailures);
        }
        return false;
      }

      // Run JSR checks
      if (!this.config.singleFileMode) {
        const jsrResult = await this.runJSRChecks();
        if (!jsrResult) {
          this.logger.failure("JSR checks failed");
          return false;
        }
      }

      // Run tests
      const testResults = await this.runTests();
      const failedTests = testResults.filter((result) => !result.success);

      if (failedTests.length > 0) {
        this.logger.failure(`Test execution completed with ${failedTests.length} failures`);
        errorFiles.testFailures = failedTests.map((test) => test.filePath);
        this.logger.errorFileList(
          "Test Failures",
          errorFiles.testFailures,
          failedTests.map((test) => test.error || ""),
        );

        if (this.logger.getMode() === "silent") {
          this.logger.errorSummary(errorFiles.typeCheckErrors, errorFiles.testFailures);
        }

        // In batch mode, don't exit immediately - show full results
        if (this.config.batchMode) {
          this.logger.info(
            `Batch mode completed processing all files. Total failures: ${failedTests.length}`,
          );
        }

        return false;
      }

      // Skip final checks in optimized modes
      if (this.config.singleFileMode || this.config.batchMode) {
        this.logger.info("Skipping final comprehensive checks in optimized mode");
        this.logger.success("CI execution completed successfully");
        return true;
      }

      // Run final checks for legacy mode
      const finalChecksResult = await this.runFinalChecks();
      if (!finalChecksResult) {
        this.logger.failure("Final checks failed");
        return false;
      }

      this.logger.success("Local checks completed successfully");
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`CI execution failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Initialize and regenerate lockfile
   */
  private async initializeLockfile(): Promise<void> {
    this.logger.info("Removing old deno.lock...");
    await FileSystem.removeIfExists("deno.lock");

    this.logger.info("Regenerating deno.lock...");
    const result = await ProcessRunner.runDeno("cache", ["--reload", "mod.ts"]);

    if (!result.success) {
      throw new Error(`Failed to regenerate deno.lock: ${result.stderr}`);
    }
  }

  /**
   * Run comprehensive type checks
   */
  private async runTypeChecks(): Promise<TypeCheckResult> {
    if (this.config.singleFileMode) {
      this.logger.info(
        "Skipping comprehensive type checking in single-file mode (will be done per test file)",
      );
      return { success: true, failedFiles: [], errors: [] };
    }

    if (this.config.batchMode || !this.config.legacyMode) {
      return await this.runOptimizedTypeChecks();
    }

    return await this.runComprehensiveTypeChecks();
  }

  /**
   * Run optimized type checks for batch mode
   */
  private async runOptimizedTypeChecks(): Promise<TypeCheckResult> {
    this.logger.info("Running optimized type checking for batch mode...");

    const tsFiles = await FileSystem.findTypeScriptFiles();
    if (tsFiles.length === 0) {
      this.logger.info("No TypeScript files found for type checking");
      return { success: true, failedFiles: [], errors: [] };
    }

    // Take sample of files for quick check
    const sampleFiles = tsFiles.slice(0, Math.min(50, tsFiles.length));

    this.logger.info(`Running type check on ${sampleFiles.length} sample TypeScript files...`);
    const result = await ProcessRunner.runDeno("check", sampleFiles);

    if (!result.success) {
      this.logger.info("Type check failed on sample files. Running batch type checking...");

      const failedFiles: string[] = [];
      const errors: string[] = [];

      // Check in smaller batches to identify specific failures
      const chunks = FileSystem.chunk(sampleFiles, 10);
      for (const chunk of chunks) {
        const chunkResult = await ProcessRunner.runDeno("check", chunk);
        if (!chunkResult.success) {
          // Check individual files in the failed chunk
          for (const file of chunk) {
            const fileResult = await ProcessRunner.runDeno("check", [file]);
            if (!fileResult.success) {
              failedFiles.push(file);
              errors.push(`${file}: ${fileResult.stderr}`);
              this.logger.error(`Type check failed for: ${file}`);
            }
          }
        }
      }

      if (failedFiles.length > 0) {
        this.logger.error("Type checking failed. Please run: deno check lib/**/*.ts");
        return { success: false, failedFiles, errors };
      }
    }

    this.logger.success("Optimized type check completed");
    return { success: true, failedFiles: [], errors: [] };
  }

  /**
   * Run comprehensive type checks
   */
  private async runComprehensiveTypeChecks(): Promise<TypeCheckResult> {
    this.logger.info("Running comprehensive type checks...");

    const tsFiles = await FileSystem.findTypeScriptFiles();
    if (tsFiles.length === 0) {
      this.logger.info("No TypeScript files found for type checking");
      return { success: true, failedFiles: [], errors: [] };
    }

    this.logger.info(`Running comprehensive type check on ${tsFiles.length} TypeScript files...`);
    const result = await ProcessRunner.runDeno("check", tsFiles);

    if (!result.success) {
      this.logger.subsection("COMPREHENSIVE TYPE CHECK FAILED");
      this.logger.info("Running individual file checks to identify specific issues...");

      const failedFiles: string[] = [];
      const errors: string[] = [];

      // Check files individually to identify failures
      for (const file of tsFiles) {
        const fileResult = await ProcessRunner.runDeno("check", [file]);
        if (!fileResult.success) {
          failedFiles.push(file);
          errors.push(`${file}: ${fileResult.stderr}`);
          this.logger.error(`Type check failed for: ${file}`);
        }
      }

      this.logger.subsection("TYPE CHECK FAILURES DETECTED");
      this.logger.error("Please fix type errors and re-run the script.");
      this.logger.error("For detailed error information, run: deno check [failing-file]");

      return { success: false, failedFiles, errors };
    }

    this.logger.success("All TypeScript files passed comprehensive type check");
    return { success: true, failedFiles: [], errors: [] };
  }

  /**
   * Run JSR (JavaScript Registry) checks
   */
  private async runJSRChecks(): Promise<boolean> {
    this.logger.info("Running JSR type check...");

    const result = await ProcessRunner.runDeno("publish", ["--dry-run", "--allow-dirty"]);
    if (!result.success) {
      this.handleJSRError(result.stderr);
      return false;
    }

    this.logger.info("Running comprehensive JSR publish test...");
    const publishResult = await ProcessRunner.runDeno("publish", [
      "--dry-run",
      "--allow-dirty",
      "--no-check",
    ]);
    if (!publishResult.success) {
      this.handleJSRPublishError(publishResult.stderr);
      return false;
    }

    return true;
  }

  /**
   * Run tests based on configured mode
   */
  private async runTests(): Promise<TestResult[]> {
    this.logger.info("Starting test execution...");

    if (this.config.singleFileMode) {
      return await this.runSingleFileTests();
    } else if (this.config.batchMode) {
      return await this.runBatchTests();
    } else if (this.config.legacyMode) {
      return await this.runLegacyTests();
    }

    throw new Error("No execution mode selected");
  }

  /**
   * Run tests in single file mode
   */
  private async runSingleFileTests(): Promise<TestResult[]> {
    this.logger.section("SINGLE FILE MODE: Running tests one file at a time in debug mode");

    const results: TestResult[] = [];

    // Phase 1: Run lib tests
    this.logger.subsection("Phase 1: Running lib/ directory tests");
    const libTests = await FileSystem.findTestFiles(["lib"]);

    if (libTests.length > 0) {
      for (let i = 0; i < libTests.length; i++) {
        const testFile = libTests[i];
        this.logger.subsection(`Processing lib test file ${i + 1}: ${testFile}`);

        const result = await this.runSingleTest(testFile, true);
        results.push(result);

        if (!result.success) {
          this.logger.subsection("SINGLE FILE MODE: EXECUTION STOPPED IN LIB PHASE");
          this.logger.error(`Test execution failed in ${testFile}`);
          this.logger.error("Remaining tests in lib/ directory have been skipped.");
          this.logger.error("Tests in tests/ directory will not be executed.");
          return results;
        }
      }
      this.logger.success(`All ${libTests.length} lib/ test files passed`);
    } else {
      this.logger.info("No test files found in lib/ directory");
    }

    // Phase 2: Run tests directory tests
    this.logger.subsection("Phase 2: Running tests/ directory tests");
    const testsTests = await FileSystem.findTestFiles(["tests"]);

    if (testsTests.length > 0) {
      for (let i = 0; i < testsTests.length; i++) {
        const testFile = testsTests[i];
        this.logger.subsection(`Processing tests test file ${i + 1}: ${testFile}`);

        const result = await this.runSingleTest(testFile, true);
        results.push(result);

        if (!result.success) {
          this.logger.subsection("SINGLE FILE MODE: EXECUTION STOPPED IN TESTS PHASE");
          this.logger.error(`Test execution failed in ${testFile}`);
          this.logger.error("Remaining tests in tests/ directory have been skipped.");
          return results;
        }
      }
      this.logger.success(`All ${testsTests.length} tests/ test files passed`);
    } else {
      this.logger.info("No test files found in tests/ directory");
    }

    this.logger.subsection("Single file mode completed successfully");
    return results;
  }

  /**
   * Run tests in batch mode
   */
  private async runBatchTests(): Promise<TestResult[]> {
    this.logger.section("BATCH MODE: Running tests in batches with automatic fallback");

    const allTestFiles = await FileSystem.findTestFiles(["lib", "tests"]);
    if (allTestFiles.length === 0) {
      this.logger.info("No test files found");
      return [];
    }

    const results: TestResult[] = [];
    const batches = FileSystem.chunk(allTestFiles, this.config.batchSize);

    this.logger.info(
      `Running ${allTestFiles.length} test files in ${batches.length} batches of ${this.config.batchSize} files each...`,
    );

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;

      this.logger.subsection(
        `Processing batch ${batchNumber}/${batches.length} (${batch.length} files)`,
      );

      const batchResult = await this.runBatch(batch, batchNumber);

      if (!batchResult.success) {
        if (this.config.fallbackToSingleFile) {
          this.logger.subsection(
            `BATCH ${batchNumber} FAILED - Attempting individual file execution`,
          );

          // Run failed batch files individually
          let batchHasCriticalFailure = false;
          for (const file of batch) {
            const result = await this.runSingleTest(file, true);
            results.push(result);

            if (!result.success) {
              this.logger.error(`Individual test failed: ${file}`);
              batchHasCriticalFailure = true;
              // Continue with other files in the batch instead of stopping immediately
            }
          }

          if (batchHasCriticalFailure) {
            this.logger.error(
              `Batch ${batchNumber} has critical failures - continuing with remaining batches`,
            );
          } else {
            this.logger.success(`Batch ${batchNumber} recovered through individual file execution`);
          }
        } else {
          this.logger.error(`Batch ${batchNumber} execution failed and fallback is disabled.`);
          // Add failed results for all files in batch
          for (const file of batch) {
            results.push({
              filePath: file,
              success: false,
              error: "Batch execution failed",
            });
          }
          // Continue with remaining batches instead of stopping
          this.logger.info(`Continuing with remaining batches...`);
        }
      } else {
        // Add successful results for all files in batch
        for (const file of batch) {
          results.push({
            filePath: file,
            success: true,
          });
        }
      }
    }

    this.logger.success(`All ${batches.length} batches completed`);

    // Report summary
    const totalFiles = results.length;
    const passedFiles = results.filter((r) => r.success).length;
    const failedFiles = results.filter((r) => !r.success).length;

    this.logger.subsection("BATCH MODE SUMMARY");
    this.logger.info(`Total files processed: ${totalFiles}`);
    this.logger.info(`Passed: ${passedFiles}`);
    this.logger.info(`Failed: ${failedFiles}`);

    if (failedFiles > 0) {
      this.logger.error("Failed files:");
      results.filter((r) => !r.success).forEach((r) => {
        this.logger.error(`  - ${r.filePath}`);
      });
    }

    return results;
  }

  /**
   * Run tests in legacy mode
   */
  private async runLegacyTests(): Promise<TestResult[]> {
    this.logger.section("LEGACY MODE: Running all tests with memory optimizations");

    const optimalJobs = await ProcessRunner.getOptimalJobCount();
    this.logger.info(`Using ${optimalJobs} parallel jobs for test execution...`);

    const result = await ProcessRunner.runDeno("test", [
      "--v8-flags=--max-old-space-size=4096",
      "--allow-env",
      "--allow-write",
      "--allow-read",
      "--allow-run",
    ], {
      env: { DENO_JOBS: optimalJobs.toString() },
    });

    if (!result.success) {
      this.logger.subsection("ALL TESTS EXECUTION FAILED");
      this.logger.error("Test execution failed. Consider using batch mode (default)");
      return [{
        filePath: "all tests",
        success: false,
        error: result.stderr,
      }];
    }

    this.logger.success("All tests passed with memory optimizations");
    return [{
      filePath: "all tests",
      success: true,
    }];
  }

  /**
   * Run a single test file
   */
  private async runSingleTest(testFile: string, debug = false): Promise<TestResult> {
    const startTime = Date.now();

    // Type check the test file first
    this.logger.info(`Type checking ${testFile}...`);
    const typeCheckResult = await ProcessRunner.runDeno("check", [testFile]);

    if (!typeCheckResult.success) {
      this.logger.subsection(`TYPE CHECK FAILED FOR: ${testFile}`);
      this.logger.error(typeCheckResult.stderr);
      this.logger.error("Please fix the type errors before proceeding.");

      return {
        filePath: testFile,
        success: false,
        error: `Type check failed: ${typeCheckResult.stderr}`,
        duration: Date.now() - startTime,
      };
    }

    this.logger.success(`Type check passed for ${testFile}`);

    // Run the test
    const env = debug ? { LOG_LEVEL: "debug", LOG_LENGTH: "W" } : undefined;

    if (debug) {
      this.logger.subsection(`RUNNING TEST IN DEBUG MODE: ${testFile}`);
      this.logger.debug(`Command: deno task test ${testFile}`);
      this.logger.debug(`Working directory: ${Deno.cwd()}`);
    } else {
      this.logger.info(`Running test: ${testFile}`);
    }

    const testResult = await ProcessRunner.runDeno("task", ["test", testFile], { env });

    if (!testResult.success) {
      this.logger.error(`Test failed for ${testFile}`);
      this.logger.debug(`Exit code: ${testResult.code}`);
      this.logger.debug(`Stderr: ${testResult.stderr}`);
      this.logger.debug(`Stdout: ${testResult.stdout}`);

      return {
        filePath: testFile,
        success: false,
        error: testResult.stderr,
        duration: Date.now() - startTime,
      };
    }

    this.logger.success(`${testFile}`);

    return {
      filePath: testFile,
      success: true,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Run a batch of test files
   */
  private async runBatch(files: string[], batchNumber: number): Promise<BatchResult> {
    const result = await ProcessRunner.runDeno("test", [
      "--allow-env",
      "--allow-write",
      "--allow-read",
      "--allow-run",
      "--v8-flags=--max-old-space-size=2048,--expose-gc",
      ...files,
    ], {
      env: { DENO_JOBS: "1" },
    });

    if (!result.success) {
      this.logger.subsection(`BATCH ${batchNumber} FAILED`);
      this.logger.error("Batch test execution failed");
      this.logger.error("Files in this batch:");
      for (const file of files) {
        this.logger.error(`  - ${file}`);
      }

      return {
        batchNumber,
        files,
        success: false,
        error: result.stderr,
      };
    }

    this.logger.success(`Batch ${batchNumber} completed successfully`);
    return {
      batchNumber,
      files,
      success: true,
    };
  }

  /**
   * Run final comprehensive checks
   */
  private async runFinalChecks(): Promise<boolean> {
    this.logger.info("All tests passed. Running final comprehensive type check...");

    // Final type check
    const finalTsFiles = await FileSystem.findTypeScriptFiles();
    if (finalTsFiles.length > 0) {
      const sampleFiles = finalTsFiles.slice(0, 50);
      const result = await ProcessRunner.runDeno("check", sampleFiles);
      if (!result.success) {
        this.logger.error("Final type check failed. Please run: deno check lib/**/*.ts");
        return false;
      }
      this.logger.success("Final comprehensive type check passed");
    }

    // JSR type check
    this.logger.info("Running JSR type check...");
    const jsrResult = await ProcessRunner.runDeno("publish", ["--dry-run", "--allow-dirty"]);
    if (!jsrResult.success) {
      this.logger.error("JSR type check failed. Please run: deno publish --dry-run --allow-dirty");
      return false;
    }

    // Format check
    this.logger.info("Running format check...");
    const formatResult = await ProcessRunner.runDeno("fmt", ["--check"]);
    if (!formatResult.success) {
      this.handleFormatError(formatResult.stderr);
      return false;
    }

    // Lint check
    this.logger.info("Running lint...");
    const lintResult = await ProcessRunner.runDeno("lint");
    if (!lintResult.success) {
      this.handleLintError(lintResult.stderr);
      return false;
    }

    // Final comprehensive type check with --all flag
    this.logger.info("Running final comprehensive type check with --all flag...");
    const finalCheckFiles = await FileSystem.findTypeScriptFiles();
    if (finalCheckFiles.length > 0) {
      const sampleFiles = finalCheckFiles.slice(0, 100);
      const result = await ProcessRunner.runDeno("check", ["--all", ...sampleFiles]);
      if (!result.success) {
        this.logger.error(
          "Final --all type check failed. Please run: deno check --all lib/**/*.ts",
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Handle JSR error messages
   */
  private handleJSRError(errorOutput: string): void {
    if (errorOutput.includes("Aborting due to uncommitted changes")) {
      this.logger.subsection("INTERNAL ERROR: JSR CHECK CONFIGURATION");
      this.logger.error("JSR check failed with uncommitted changes despite --allow-dirty flag");
      this.logger.error("This is likely a bug in the CI script. Please:");
      this.logger.error("1. Report this issue");
      this.logger.error("2. As a temporary workaround, commit your changes");
      return;
    }

    this.logger.subsection("JSR TYPE CHECK FAILED");
    this.logger.error("JSR publish dry-run failed");
    this.logger.error("Common causes:");
    this.logger.error("1. Version constraints in import statements");
    this.logger.error("2. Package name format in deno.json");
    this.logger.error("3. File paths and naming conventions");
    this.logger.error("4. Type definition errors");
    this.logger.error(`Error details: ${errorOutput}`);
  }

  /**
   * Handle JSR publish error messages
   */
  private handleJSRPublishError(errorOutput: string): void {
    this.logger.subsection("JSR PUBLISH TEST FAILED");
    this.logger.error("JSR publish test failed");
    this.logger.error("Common causes:");
    this.logger.error("1. Dependency version mismatches");
    this.logger.error("2. Invalid package structure");
    this.logger.error("3. Missing required files");
    this.logger.error("4. Invalid file permissions");
    this.logger.error(`Error details: ${errorOutput}`);
  }

  /**
   * Handle format error messages
   */
  private handleFormatError(errorOutput: string): void {
    this.logger.subsection("FORMAT CHECK FAILED");
    this.logger.error("Please review:");
    this.logger.error("1. Project formatting rules in docs/ directory");
    this.logger.error("2. Deno's style guide at https://deno.land/manual/tools/formatter");
    this.logger.error("3. Format settings in deno.json");
    this.logger.error("To auto-fix formatting issues: deno fmt");
    this.logger.error(`Error details: ${errorOutput}`);
  }

  /**
   * Handle lint error messages
   */
  private handleLintError(errorOutput: string): void {
    this.logger.subsection("LINT CHECK FAILED");
    this.logger.error("Please review:");
    this.logger.error("1. Project linting rules in docs/ directory");
    this.logger.error("2. Deno's linting rules at https://deno.land/manual/tools/linter");
    this.logger.error("3. Lint configuration in deno.json");
    this.logger.error(`Error details: ${errorOutput}`);
  }

  /**
   * Run comprehensive error file listing for silent mode
   */
  private async runComprehensiveErrorListing(): Promise<
    { typeCheckErrors: string[]; testFailures: string[] }
  > {
    const errorFiles = {
      typeCheckErrors: [] as string[],
      testFailures: [] as string[],
    };

    // Get all TypeScript files for type checking
    const tsFiles = await FileSystem.findTypeScriptFiles();

    if (tsFiles.length > 0) {
      this.logger.info(`Checking ${tsFiles.length} TypeScript files...`);

      // Check all files individually to get complete error list
      for (const file of tsFiles) {
        const result = await ProcessRunner.runDeno("check", [file]);
        if (!result.success) {
          errorFiles.typeCheckErrors.push(file);
        }
      }
    }

    // Get all test files
    const testFiles = await FileSystem.findTestFiles(["lib", "tests"]);

    if (testFiles.length > 0) {
      this.logger.info(`Checking ${testFiles.length} test files...`);

      // Check all test files individually
      for (const file of testFiles) {
        const result = await this.runSingleTest(file, false);
        if (!result.success) {
          errorFiles.testFailures.push(file);
        }
      }
    }

    return errorFiles;
  }
}
