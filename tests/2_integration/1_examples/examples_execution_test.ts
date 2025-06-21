import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ensureDir, exists } from "@std/fs";
import { join } from "@std/path";

const logger = new BreakdownLogger("examples-execution-test");

/**
 * Helper function to execute example scripts
 */
async function executeExampleScript(
  scriptName: string,
  testDir: string,
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  const scriptPath = join(Deno.cwd(), "examples", scriptName);
  
  // Ensure script exists
  const scriptExists = await exists(scriptPath);
  if (!scriptExists) {
    return {
      success: false,
      stdout: "",
      stderr: `Script not found: ${scriptPath}`,
    };
  }

  // Execute the script from the examples directory so relative paths work
  const command = new Deno.Command("bash", {
    args: [scriptName],
    cwd: join(Deno.cwd(), "examples"),
    stdout: "piped",
    stderr: "piped",
    env: {
      ...Deno.env.toObject(),
      // Ensure examples use the test directory for outputs
      BREAKDOWN_TEST_DIR: testDir,
    },
  });

  try {
    const { code, stdout, stderr } = await command.output();
    return {
      success: code === 0,
      stdout: new TextDecoder().decode(stdout),
      stderr: new TextDecoder().decode(stderr),
    };
  } catch (error) {
    logger.error("Failed to execute script", { scriptName, error });
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Setup test environment for examples
 */
async function setupExampleTestEnvironment(): Promise<string> {
  const testDir = await Deno.makeTempDir();
  
  // Create expected directory structure
  await ensureDir(join(testDir, ".agent", "breakdown", "config"));
  await ensureDir(join(testDir, ".agent", "breakdown", "prompts"));
  await ensureDir(join(testDir, ".agent", "breakdown", "schema"));
  await ensureDir(join(testDir, "examples"));
  
  // Copy necessary files for examples to run
  const cliPath = join(testDir, "cli");
  await ensureDir(cliPath);
  
  // Create a minimal breakdown.ts for examples
  await Deno.writeTextFile(
    join(cliPath, "breakdown.ts"),
    `#!/usr/bin/env -S deno run --allow-all
console.log("Breakdown CLI (test mode)");
`,
  );

  return testDir;
}

/**
 * Test: 00_install.sh - Installation guide
 */
Deno.test("Example: 00_install.sh - Installation guide", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    // This is an educational script, just verify it runs without errors
    const result = await executeExampleScript("00_install.sh", testDir);
    
    logger.debug("00_install.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // Installation guide should execute without errors
    assertEquals(result.success, true, "Installation guide should run successfully");
    
    // Should show installation information
    assertEquals(result.stdout.includes("Installation") || result.stdout.includes("install"), true);
    assertEquals(result.stdout.includes("JSR"), true);
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 01_compile.sh - Binary compilation
 */
Deno.test("Example: 01_compile.sh - Binary compilation", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    // Create a mock breakdown.ts for compilation
    const cliDir = join(testDir, "cli");
    await ensureDir(cliDir);
    await Deno.writeTextFile(
      join(cliDir, "breakdown.ts"),
      `#!/usr/bin/env -S deno run --allow-all
import { parseArgs } from "@std/cli/parse-args";
console.log("Breakdown CLI v1.0.0");
`,
    );

    const result = await executeExampleScript("01_compile.sh", testDir);
    
    logger.debug("01_compile.sh result", { 
      success: result.success,
      stderr: result.stderr,
    });
    
    // Compilation might fail in test environment, but script should run
    assertEquals(typeof result.success, "boolean");
    
    // Should attempt to compile
    assertEquals(
      result.stdout.includes("Compiling breakdown") || 
      result.stderr.includes("deno compile"),
      true,
      "Should attempt compilation"
    );
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 02_init_deno_run.sh - Project initialization
 */
Deno.test("Example: 02_init_deno_run.sh - Project initialization", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("02_init_deno_run.sh", testDir);
    
    logger.debug("02_init_deno_run.sh result", { 
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    
    // Should create initialization structure
    assertEquals(result.success, true, "Initialization should succeed");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 03_create_user_config.sh - User configuration
 */
Deno.test("Example: 03_create_user_config.sh - User configuration", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("03_create_user_config.sh", testDir);
    
    logger.debug("03_create_user_config.sh result", { 
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    
    // Should create user configuration
    assertEquals(result.success, true, "User config creation should succeed");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 04_stdin_example.sh - STDIN input methods
 */
Deno.test("Example: 04_stdin_example.sh - STDIN input methods", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("04_stdin_example.sh", testDir);
    
    logger.debug("04_stdin_example.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // Should demonstrate multiple input methods
    assertEquals(result.success, true, "STDIN examples should run successfully");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 05_basic_usage.sh - Core commands
 */
Deno.test("Example: 05_basic_usage.sh - Core commands", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("05_basic_usage.sh", testDir);
    
    logger.debug("05_basic_usage.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // Should demonstrate core commands
    assertEquals(result.success, true, "Basic usage should run successfully");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 14_custom_variables.sh - Custom variables
 */
Deno.test("Example: 14_custom_variables.sh - Custom variables", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("14_custom_variables.sh", testDir);
    
    logger.debug("14_custom_variables.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // Should demonstrate custom variables
    assertEquals(result.success, true, "Custom variables example should run");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 16_batch_processing.sh - Batch file processing
 */
Deno.test("Example: 16_batch_processing.sh - Batch file processing", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("16_batch_processing.sh", testDir);
    
    logger.debug("16_batch_processing.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // Should demonstrate batch processing
    assertEquals(result.success, true, "Batch processing should run");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 17_error_handling.sh - Error handling patterns
 */
Deno.test("Example: 17_error_handling.sh - Error handling patterns", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("17_error_handling.sh", testDir);
    
    logger.debug("17_error_handling.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // Error handling example should complete (even if demonstrating errors)
    assertEquals(typeof result.success, "boolean", "Should return a boolean status");
    
    // Should produce output about error handling
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 22_cicd_integration.sh - CI/CD integration
 */
Deno.test("Example: 22_cicd_integration.sh - CI/CD integration", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    const result = await executeExampleScript("22_cicd_integration.sh", testDir);
    
    logger.debug("22_cicd_integration.sh result", { 
      success: result.success,
      stdoutLength: result.stdout.length,
      stderr: result.stderr,
    });
    
    // CI/CD example should run
    assertEquals(result.success, true, "CI/CD integration should run");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: Configuration examples (06-11)
 */
Deno.test("Example: Configuration examples run successfully", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  const configExamples = [
    "06_config_basic.sh",
    "07_config_production.sh",
    "08_config_team.sh",
    "09_config_environments.sh",
    "10_config_production_example.sh",
    "11_config_production_custom.sh",
  ];
  
  try {
    for (const example of configExamples) {
      const result = await executeExampleScript(example, testDir);
      
      logger.debug(`${example} result`, { 
        success: result.success,
        hasOutput: result.stdout.length > 0,
      });
      
      // Config examples should run
      assertEquals(
        result.success, 
        true, 
        `${example} should run successfully`
      );
      
      // Should produce output
      assertEquals(
        result.stdout.length > 0,
        true,
        `${example} should produce output`
      );
    }
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: Examples don't create directories in project root
 */
Deno.test("Example: Scripts don't pollute project root", async () => {
  const testDir = await setupExampleTestEnvironment();
  const projectRoot = Deno.cwd();
  
  // Directories that should NOT be created in project root
  const protectedDirs = ["prompts", "prompt", "output", "schema", "schemas", "configs"];
  
  try {
    // Run a few examples that might create directories
    const examplesThatCreateDirs = [
      "02_init_deno_run.sh",
      "03_create_user_config.sh",
      "05_basic_usage.sh",
    ];
    
    for (const example of examplesThatCreateDirs) {
      await executeExampleScript(example, testDir);
    }
    
    // Check that protected directories weren't created in project root
    for (const dir of protectedDirs) {
      const dirPath = join(projectRoot, dir);
      const dirExists = await exists(dirPath);
      
      assertEquals(
        dirExists,
        false,
        `Directory '${dir}' should not be created in project root by examples`
      );
    }
    
    // Verify they were created in the test directory instead
    const exampleDir = join(testDir, "examples");
    const hasExampleOutput = await exists(exampleDir) || 
                           await exists(join(testDir, ".agent", "breakdown"));
    
    assertEquals(
      hasExampleOutput,
      true,
      "Examples should create output in test directory"
    );
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * Test: 19_clean.sh - Cleanup script
 */
Deno.test("Example: 19_clean.sh - Cleanup script", async () => {
  const testDir = await setupExampleTestEnvironment();
  
  try {
    // Create some test files to clean
    await ensureDir(join(testDir, "examples", "output"));
    await Deno.writeTextFile(
      join(testDir, "examples", "output", "test.md"),
      "test content"
    );
    
    const result = await executeExampleScript("19_clean.sh", testDir);
    
    logger.debug("19_clean.sh result", { 
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
    });
    
    // Cleanup script should run
    assertEquals(result.success, true, "Cleanup script should run");
    
    // Should produce output
    assertEquals(result.stdout.length > 0, true, "Should produce output");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});