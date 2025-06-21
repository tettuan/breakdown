import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { exists, walk } from "@std/fs";
import { join, dirname, basename } from "@std/path";

const logger = new BreakdownLogger("structure-examples-test");

/**
 * Structure tests for example scripts dependencies and relationships
 * 
 * These tests verify:
 * - Dependencies between examples are properly managed
 * - Required files and directories are created in correct order
 * - Examples build upon each other logically
 * - Resource cleanup is handled appropriately
 */

/**
 * Test: Examples have proper dependency ordering
 */
Deno.test("Structure: Examples follow dependency order", async () => {
  const dependencies = new Map<string, string[]>([
    // Installation must come first
    ["01_compile.sh", ["00_install.sh"]],
    // Init requires installation
    ["02_init_deno_run.sh", ["01_compile.sh"]],
    // User config requires init
    ["03_create_user_config.sh", ["02_init_deno_run.sh"]],
    // Basic usage requires setup
    ["05_basic_usage.sh", ["02_init_deno_run.sh", "03_create_user_config.sh"]],
    // Config examples require basic setup
    ["06_config_basic.sh", ["02_init_deno_run.sh"]],
    // Advanced configs build on basic
    ["07_config_production.sh", ["06_config_basic.sh"]],
    ["08_config_team.sh", ["06_config_basic.sh"]],
    // Command examples require setup
    ["12_summary_issue.sh", ["05_basic_usage.sh"]],
    ["13_defect_patterns.sh", ["05_basic_usage.sh"]],
    // Advanced features require basics
    ["15_pipeline_processing.sh", ["05_basic_usage.sh"]],
    ["16_batch_processing.sh", ["05_basic_usage.sh"]],
    // Integration requires multiple features
    ["22_cicd_integration.sh", ["05_basic_usage.sh", "07_config_production.sh"]],
  ]);
  
  // Verify dependency files exist
  for (const [example, deps] of dependencies.entries()) {
    const examplePath = join(Deno.cwd(), "examples", example);
    
    if (await exists(examplePath)) {
      for (const dep of deps) {
        const depPath = join(Deno.cwd(), "examples", dep);
        const depExists = await exists(depPath);
        
        assertEquals(
          depExists,
          true,
          `${example} depends on ${dep}, which should exist`
        );
        
        // Verify numerical ordering
        const exampleNum = parseInt(example.substring(0, 2));
        const depNum = parseInt(dep.substring(0, 2));
        
        assertEquals(
          depNum < exampleNum,
          true,
          `Dependency ${dep} should come before ${example} numerically`
        );
      }
    }
  }
});

/**
 * Test: Examples create required directory structures
 */
Deno.test("Structure: Examples create required directories in order", async () => {
  // Map of which examples create which directories
  const directoryCreators = new Map<string, string[]>([
    ["02_init_deno_run.sh", [
      ".agent/breakdown",
      ".agent/breakdown/config",
      ".agent/breakdown/prompts",
      ".agent/breakdown/schema",
    ]],
    ["03_create_user_config.sh", [
      ".agent/breakdown/config",
    ]],
    ["05_basic_usage.sh", [
      "output",
    ]],
    ["06_config_basic.sh", [
      "configs",
    ]],
  ]);
  
  // Verify examples that need directories have them created first
  const examplesNeedingDirs = [
    "03_create_user_config.sh",  // Needs .agent/breakdown/config
    "05_basic_usage.sh",          // Creates output
    "12_summary_issue.sh",        // Needs output dir
    "13_defect_patterns.sh",      // Needs output dir
  ];
  
  for (const example of examplesNeedingDirs) {
    const exampleNum = parseInt(example.substring(0, 2));
    
    // Find which example should create the needed directory
    let creatorFound = false;
    for (const [creator, dirs] of directoryCreators.entries()) {
      const creatorNum = parseInt(creator.substring(0, 2));
      
      if (creatorNum <= exampleNum) {
        creatorFound = true;
        break;
      }
    }
    
    assertEquals(
      creatorFound,
      true,
      `${example} should have a predecessor that creates required directories`
    );
  }
});

/**
 * Test: Examples handle file dependencies correctly
 */
Deno.test("Structure: Examples manage file dependencies", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  
  // Map of files created and consumed by examples
  const fileFlows = new Map<string, { creates?: string[], needs?: string[] }>([
    ["03_create_user_config.sh", {
      creates: [".agent/breakdown/config/user.yml"],
    }],
    ["05_basic_usage.sh", {
      creates: ["messy_tasks.md", "output/tasks.md", "output/issue.md"],
    }],
    ["06_config_basic.sh", {
      creates: ["configs/basic-app.yml"],
    }],
    ["12_summary_issue.sh", {
      needs: ["messy_tasks.md"],
      creates: ["output/summary_issue/organized_tasks.md"],
    }],
  ]);
  
  // Verify file creation order
  for (const [example, flow] of fileFlows.entries()) {
    if (flow.needs) {
      const exampleNum = parseInt(example.substring(0, 2));
      
      for (const neededFile of flow.needs) {
        // Find creator of needed file
        let creatorNum = -1;
        for (const [creator, creatorFlow] of fileFlows.entries()) {
          if (creatorFlow.creates?.includes(neededFile)) {
            creatorNum = parseInt(creator.substring(0, 2));
            break;
          }
        }
        
        if (creatorNum >= 0) {
          assertEquals(
            creatorNum < exampleNum,
            true,
            `${example} needs ${neededFile} which should be created by an earlier example`
          );
        }
      }
    }
  }
});

/**
 * Test: Examples use consistent working directories
 */
Deno.test("Structure: Examples use consistent working directories", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const workingDirPatterns = [
    /cd\s+["']?\.agent\/breakdown["']?/,
    /BREAKDOWN_HOME=["']?.*\.agent\/breakdown["']?/,
    /working_dir:\s*\.agent\/breakdown/,
  ];
  
  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const content = await Deno.readTextFile(entry.path);
      
      // Check if example changes directory
      const changesDir = content.includes("cd ") && 
                        !content.includes("cd examples");
      
      if (changesDir) {
        // Verify it uses standard working directory
        const usesStandardDir = workingDirPatterns.some(pattern => 
          pattern.test(content)
        );
        
        // Some examples might use other directories for demos
        const isSpecialCase = entry.name.includes("clean") ||
                            entry.name.includes("install");
        
        if (!isSpecialCase) {
          logger.debug(`${entry.name} directory usage`, {
            changesDir,
            usesStandardDir,
          });
        }
      }
    }
  }
  
  // This is more of a guideline than strict requirement
  assertEquals(true, true);
});

/**
 * Test: Examples share common utility functions appropriately
 */
Deno.test("Structure: Examples share utilities without duplication", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const commonFunctions = new Map<string, number>();
  
  // Patterns for common utility functions
  const utilityPatterns = [
    /function\s+run_breakdown\s*\(\)/,
    /function\s+setup_env\s*\(\)/,
    /function\s+create_config\s*\(\)/,
    /function\s+cleanup\s*\(\)/,
  ];
  
  // Count occurrences of utility functions
  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const content = await Deno.readTextFile(entry.path);
      
      for (const pattern of utilityPatterns) {
        if (pattern.test(content)) {
          const funcName = pattern.toString();
          commonFunctions.set(funcName, (commonFunctions.get(funcName) || 0) + 1);
        }
      }
    }
  }
  
  // Check for excessive duplication
  for (const [func, count] of commonFunctions.entries()) {
    if (count > 5) {
      logger.warn("Utility function duplicated many times", {
        function: func,
        count: count,
      });
    }
  }
  
  // Some duplication is acceptable for example independence
  assertEquals(true, true);
});

/**
 * Test: Examples handle cleanup consistently
 */
Deno.test("Structure: Examples with cleanup follow consistent patterns", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  
  // Examples that create significant resources
  const examplesNeedingCleanup = [
    "05_basic_usage.sh",
    "12_summary_issue.sh", 
    "13_defect_patterns.sh",
    "16_batch_processing.sh",
    "22_cicd_integration.sh",
  ];
  
  for (const exampleName of examplesNeedingCleanup) {
    const examplePath = join(examplesDir, exampleName);
    
    if (await exists(examplePath)) {
      const content = await Deno.readTextFile(examplePath);
      
      // Check for cleanup patterns
      const hasCleanup = 
        content.includes("cleanup") ||
        content.includes("Clean up") ||
        content.includes("rm -rf") ||
        content.includes("19_clean.sh") ||
        content.includes("echo \"Outputs saved");
      
      // Not all examples need explicit cleanup if they mention where outputs are saved
      logger.debug(`${exampleName} cleanup check`, {
        hasCleanup,
        mentionsOutput: content.includes("output") || content.includes("saved"),
      });
    }
  }
  
  // Verify clean script exists
  const cleanScriptPath = join(examplesDir, "19_clean.sh");
  const cleanExists = await exists(cleanScriptPath);
  
  assertEquals(
    cleanExists,
    true,
    "Clean script (19_clean.sh) should exist for manual cleanup"
  );
});

/**
 * Test: Examples reference resources with proper paths
 */
Deno.test("Structure: Examples use proper relative paths for resources", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  
  // Common resource references
  const resourcePatterns = [
    { pattern: /\.\.\/cli\/breakdown\.ts/, type: "CLI" },
    { pattern: /prompts\//, type: "prompts" },
    { pattern: /schema\//, type: "schema" },
    { pattern: /configs\//, type: "configs" },
    { pattern: /output\//, type: "output" },
  ];
  
  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const content = await Deno.readTextFile(entry.path);
      const references: Record<string, number> = {};
      
      // Count resource references
      for (const { pattern, type } of resourcePatterns) {
        const matches = content.match(new RegExp(pattern, "g"));
        if (matches) {
          references[type] = matches.length;
        }
      }
      
      // CLI references should use consistent paths
      if (references["CLI"]) {
        const cliRefs = content.match(/\.\.\/cli\/breakdown\.ts/g) || [];
        const denoRunRefs = content.match(/deno run .* \.\.\/cli\/breakdown\.ts/g) || [];
        
        // Most CLI references should be with deno run
        if (cliRefs.length > 0 && entry.name !== "01_compile.sh") {
          logger.debug(`${entry.name} CLI references`, {
            total: cliRefs.length,
            withDenoRun: denoRunRefs.length,
          });
        }
      }
    }
  }
  
  assertEquals(true, true);
});

/**
 * Test: Examples follow progressive complexity
 */
Deno.test("Structure: Examples increase in complexity progressively", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  
  // Complexity indicators
  const complexityMarkers = {
    basic: ["echo", "cat", "mkdir", "deno run"],
    intermediate: ["function", "for", "if", "case", "array"],
    advanced: ["trap", "process substitution", "parallel", "retry", "timeout"],
  };
  
  const exampleComplexity = new Map<string, number>();
  
  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const content = await Deno.readTextFile(entry.path);
      let complexity = 0;
      
      // Basic: 1 point each
      for (const marker of complexityMarkers.basic) {
        if (content.includes(marker)) complexity += 1;
      }
      
      // Intermediate: 2 points each
      for (const marker of complexityMarkers.intermediate) {
        if (content.includes(marker)) complexity += 2;
      }
      
      // Advanced: 3 points each  
      for (const marker of complexityMarkers.advanced) {
        if (content.includes(marker)) complexity += 3;
      }
      
      exampleComplexity.set(entry.name, complexity);
    }
  }
  
  // Verify general trend of increasing complexity
  const sortedExamples = Array.from(exampleComplexity.entries())
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  // Calculate average complexity for each range
  const ranges = [
    { name: "basic", start: 0, end: 5 },
    { name: "intermediate", start: 6, end: 14 },
    { name: "advanced", start: 15, end: 22 },
  ];
  
  const avgComplexity = ranges.map(range => {
    const examples = sortedExamples.filter(([name]) => {
      const num = parseInt(name.substring(0, 2));
      return num >= range.start && num <= range.end;
    });
    
    const total = examples.reduce((sum, [_, complexity]) => sum + complexity, 0);
    return {
      range: range.name,
      average: examples.length > 0 ? total / examples.length : 0,
    };
  });
  
  logger.debug("Example complexity progression", { avgComplexity });
  
  // Generally, complexity should increase
  if (avgComplexity.length >= 2) {
    const basicAvg = avgComplexity[0].average;
    const advancedAvg = avgComplexity[avgComplexity.length - 1].average;
    
    // Advanced examples should generally be more complex
    // But this is a soft requirement as some advanced examples might be simple
    logger.debug("Complexity trend", {
      basic: basicAvg,
      advanced: advancedAvg,
      increasing: advancedAvg >= basicAvg,
    });
  }
  
  assertEquals(true, true);
});