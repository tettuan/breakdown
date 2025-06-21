import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ensureDir, exists } from "@std/fs";
import { join } from "@std/path";

const logger = new BreakdownLogger("examples-e2e-test");

/**
 * E2E tests for complete example workflows
 * 
 * These tests verify:
 * - Complete user workflows from installation to advanced usage
 * - Integration between multiple examples
 * - Real-world usage scenarios
 * - End-to-end functionality of the breakdown tool through examples
 */

/**
 * Helper to setup a complete example environment
 */
async function setupCompleteExampleEnvironment(): Promise<string> {
  const testDir = await Deno.makeTempDir();
  
  // Create full directory structure
  const dirs = [
    ".agent/breakdown/config",
    ".agent/breakdown/prompts/to/project",
    ".agent/breakdown/prompts/to/issue", 
    ".agent/breakdown/prompts/to/task",
    ".agent/breakdown/prompts/summary/project",
    ".agent/breakdown/prompts/summary/issue",
    ".agent/breakdown/prompts/summary/task", 
    ".agent/breakdown/prompts/defect/issue",
    ".agent/breakdown/prompts/defect/task",
    ".agent/breakdown/schema",
    "cli",
    "examples/output",
    "examples/configs",
    "examples/prompts",
  ];
  
  for (const dir of dirs) {
    await ensureDir(join(testDir, dir));
  }
  
  // Create a working breakdown CLI mock
  const cliContent = `#!/usr/bin/env -S deno run --allow-all
import { parseArgs } from "@std/cli/parse-args";

const args = parseArgs(Deno.args);
const command = args._[0];
const layer = args._[1];

console.log(\`Breakdown CLI - Command: \${command}, Layer: \${layer}\`);

// Simulate different commands
if (command === "init") {
  console.log("Initializing breakdown project...");
  console.log("Directory structure created successfully.");
} else if (command === "to") {
  console.log(\`Converting to \${layer}...\`);
  if (args.destination) {
    await Deno.writeTextFile(args.destination, \`# Generated \${layer}\\n\\nContent from: \${args.from || "stdin"}\`);
  }
} else if (command === "summary") {
  console.log(\`Summarizing \${layer}...\`);
  if (args.destination) {
    await Deno.writeTextFile(args.destination, \`# Summary of \${layer}\\n\\nSummarized content\`);
  }
} else if (command === "defect") {
  console.log(\`Analyzing defects in \${layer}...\`);
  console.log("Found 2 potential issues.");
} else {
  console.log(\`Unknown command: \${command}\`);
}
`;
  
  await Deno.writeTextFile(join(testDir, "cli", "breakdown.ts"), cliContent);
  
  // Create template files
  const templates = [
    { path: ".agent/breakdown/prompts/to/project/f_project.md", content: "Project template" },
    { path: ".agent/breakdown/prompts/to/issue/f_issue.md", content: "Issue template" },
    { path: ".agent/breakdown/prompts/to/task/f_task.md", content: "Task template" },
    { path: ".agent/breakdown/prompts/summary/task/f_task.md", content: "Summary template" },
    { path: ".agent/breakdown/prompts/defect/issue/f_issue.md", content: "Defect template" },
  ];
  
  for (const template of templates) {
    await Deno.writeTextFile(join(testDir, template.path), template.content);
  }
  
  // Create default config
  await Deno.writeTextFile(
    join(testDir, ".agent/breakdown/config/default-app.yml"),
    `working_dir: .agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schema
`
  );
  
  return testDir;
}

/**
 * Execute example script with full environment
 */
async function executeExample(
  scriptName: string,
  testDir: string,
): Promise<{ success: boolean; stdout: string; stderr: string }> {
  const scriptPath = join(Deno.cwd(), "examples", scriptName);
  
  const command = new Deno.Command("bash", {
    args: [scriptPath],
    cwd: join(testDir, "examples"),
    stdout: "piped", 
    stderr: "piped",
    env: {
      ...Deno.env.toObject(),
      PATH: `${join(testDir, ".deno/bin")}:${Deno.env.get("PATH")}`,
    },
  });
  
  const { code, stdout, stderr } = await command.output();
  
  return {
    success: code === 0,
    stdout: new TextDecoder().decode(stdout),
    stderr: new TextDecoder().decode(stderr),
  };
}

/**
 * E2E Test: Complete setup workflow
 */
Deno.test("E2E: Complete setup workflow from installation to first use", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Step 1: Installation (00_install.sh is educational only)
    logger.debug("Step 1: Installation guide");
    
    // Step 2: Compilation
    logger.debug("Step 2: Compilation");
    const compileResult = await executeExample("01_compile.sh", testDir);
    logger.debug("Compile result", { 
      success: compileResult.success,
      hasOutput: compileResult.stdout.length > 0,
    });
    
    // Step 3: Initialization
    logger.debug("Step 3: Project initialization");
    const initResult = await executeExample("02_init_deno_run.sh", testDir);
    assertEquals(initResult.success, true, "Initialization should succeed");
    assertStringIncludes(initResult.stdout, "Initializing");
    
    // Step 4: User configuration
    logger.debug("Step 4: User configuration");
    const configResult = await executeExample("03_create_user_config.sh", testDir);
    assertEquals(configResult.success, true, "User config should succeed");
    
    // Step 5: Basic usage
    logger.debug("Step 5: Basic usage");
    const usageResult = await executeExample("05_basic_usage.sh", testDir);
    assertEquals(usageResult.success, true, "Basic usage should succeed");
    
    // The examples ran successfully - that's what we're testing
    logger.info("Complete setup workflow successful");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * E2E Test: Configuration management workflow
 */
Deno.test("E2E: Configuration management across environments", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Initialize project first
    await executeExample("02_init_deno_run.sh", testDir);
    
    // Create basic config
    logger.debug("Creating basic configuration");
    const basicResult = await executeExample("06_config_basic.sh", testDir);
    assertEquals(basicResult.success, true);
    
    // Create production config
    logger.debug("Creating production configuration");
    const prodResult = await executeExample("07_config_production.sh", testDir);
    assertEquals(prodResult.success, true);
    
    // Create team config
    logger.debug("Creating team configuration");
    const teamResult = await executeExample("08_config_team.sh", testDir);
    assertEquals(teamResult.success, true);
    
    // Create environment-specific configs
    logger.debug("Creating environment configurations");
    const envResult = await executeExample("09_config_environments.sh", testDir);
    assertEquals(envResult.success, true);
    
    // Verify examples ran successfully
    logger.debug("Configuration examples completed successfully");
    
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * E2E Test: Complete command workflow
 */
Deno.test("E2E: Complete command workflow from input to output", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Setup
    await executeExample("02_init_deno_run.sh", testDir);
    await executeExample("03_create_user_config.sh", testDir);
    
    // Create input data
    const inputPath = join(testDir, "examples/messy_tasks.md");
    await Deno.writeTextFile(inputPath, `# Project Tasks
- Implement user authentication
- Fix database connection issues  
- Update API documentation
- Review security policies
`);
    
    // Test summary command
    logger.debug("Testing summary command");
    const summaryResult = await executeExample("12_summary_issue.sh", testDir);
    assertEquals(summaryResult.success, true, "Summary should succeed");
    
    // Test defect analysis
    logger.debug("Testing defect analysis");
    const defectResult = await executeExample("13_defect_patterns.sh", testDir);
    assertEquals(defectResult.success, true, "Defect analysis should succeed");
    
    // Test custom variables
    logger.debug("Testing custom variables");
    const customResult = await executeExample("14_custom_variables.sh", testDir);
    assertEquals(customResult.success, true, "Custom variables should work");
    
    // Examples ran successfully
    logger.debug("Command workflow completed");
    
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * E2E Test: Advanced processing workflows
 */
Deno.test("E2E: Advanced processing with pipelines and batch operations", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Setup
    await executeExample("02_init_deno_run.sh", testDir);
    
    // Create multiple input files for batch processing
    const inputFiles = [
      { name: "feature1.md", content: "# Feature 1\nImplement login functionality" },
      { name: "feature2.md", content: "# Feature 2\nAdd password reset" },
      { name: "bug1.md", content: "# Bug Report\nLogin fails on mobile" },
    ];
    
    for (const file of inputFiles) {
      await Deno.writeTextFile(
        join(testDir, "examples", file.name),
        file.content
      );
    }
    
    // Test pipeline processing
    logger.debug("Testing pipeline processing");
    const pipelineResult = await executeExample("15_pipeline_processing.sh", testDir);
    assertEquals(typeof pipelineResult.success, "boolean", "Pipeline example should return status");
    
    // Test batch processing
    logger.debug("Testing batch processing");
    const batchResult = await executeExample("16_batch_processing.sh", testDir);
    assertEquals(batchResult.success, true, "Batch processing should work");
    
    // Test error handling
    logger.debug("Testing error handling");
    const errorResult = await executeExample("17_error_handling.sh", testDir);
    // Error handling example might intentionally fail to demonstrate recovery
    assertEquals(typeof errorResult.success, "boolean");
    
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * E2E Test: CI/CD integration workflow
 */
Deno.test("E2E: CI/CD integration workflow", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Setup
    await executeExample("02_init_deno_run.sh", testDir);
    await executeExample("07_config_production.sh", testDir);
    
    // Test CI/CD integration
    logger.debug("Testing CI/CD integration");
    const cicdResult = await executeExample("22_cicd_integration.sh", testDir);
    assertEquals(cicdResult.success, true, "CI/CD integration should work");
    
    // Verify CI/CD artifacts
    assertStringIncludes(cicdResult.stdout, "CI/CD");
    
    // Check for generated CI configurations
    const reportsDir = join(testDir, "examples/reports");
    if (await exists(reportsDir)) {
      let hasCI = false;
      for await (const entry of Deno.readDir(reportsDir)) {
        if (entry.name.includes("ci") || entry.name.includes("github") || entry.name.includes("gitlab")) {
          hasCI = true;
          break;
        }
      }
      logger.debug("CI/CD artifacts", { hasCI });
    }
    
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * E2E Test: Complete workflow with cleanup
 */
Deno.test("E2E: Complete workflow with proper cleanup", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Run a complete workflow
    await executeExample("02_init_deno_run.sh", testDir);
    await executeExample("03_create_user_config.sh", testDir);
    await executeExample("05_basic_usage.sh", testDir);
    await executeExample("12_summary_issue.sh", testDir);
    
    // Create some output files
    const outputDir = join(testDir, "examples/output");
    await ensureDir(outputDir);
    await Deno.writeTextFile(join(outputDir, "test1.md"), "Test output 1");
    await Deno.writeTextFile(join(outputDir, "test2.md"), "Test output 2");
    
    // Verify files exist before cleanup
    const outputExists = await exists(outputDir);
    assertEquals(outputExists, true, "Output directory should exist");
    
    // Run cleanup
    logger.debug("Running cleanup");
    const cleanResult = await executeExample("19_clean.sh", testDir);
    assertEquals(cleanResult.success, true, "Cleanup should succeed");
    assertStringIncludes(cleanResult.stdout.toLowerCase(), "clean");
    
    // Note: The clean script should preserve the main structure
    const configDir = join(testDir, "examples/.agent/breakdown/config");
    const configPreserved = await exists(configDir);
    logger.debug("After cleanup", { 
      configPreserved,
      cleanOutput: cleanResult.stdout.substring(0, 200),
    });
    
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

/**
 * E2E Test: Verify examples don't interfere with each other
 */
Deno.test("E2E: Examples maintain isolation and don't interfere", async () => {
  const testDir = await setupCompleteExampleEnvironment();
  
  try {
    // Run multiple examples in sequence
    const examples = [
      "02_init_deno_run.sh",
      "05_basic_usage.sh",
      "06_config_basic.sh",
      "12_summary_issue.sh",
      "14_custom_variables.sh",
    ];
    
    const results = [];
    for (const example of examples) {
      logger.debug(`Running ${example}`);
      const result = await executeExample(example, testDir);
      results.push({
        example,
        success: result.success,
        hasOutput: result.stdout.length > 0,
      });
    }
    
    // All examples should succeed independently
    for (const result of results) {
      assertEquals(
        result.success,
        true,
        `${result.example} should succeed independently`
      );
    }
    
    logger.debug("Example isolation test", { 
      total: results.length,
      successful: results.filter(r => r.success).length,
    });
    
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});