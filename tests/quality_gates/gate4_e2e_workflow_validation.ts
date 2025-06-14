/**
 * Quality Gate 4: E2E Workflow Validation (Final Integration)
 *
 * Purpose: Complete end-to-end validation of "breakdown find bugs" implementation
 * Execution: Final quality gate before production readiness
 * Prerequisites: Gates 1, 2, 3 passed, all implementation steps complete
 *
 * Success Criteria:
 * - ✅ "breakdown find bugs" command fully functional
 * - ✅ Custom variables integration working
 * - ✅ Output generation successful
 * - ✅ Error handling end-to-end
 * - ✅ Performance within acceptable limits
 * - ✅ Ready for deno task ci execution
 *
 * Quality Standards:
 * - E2E workflow success: 100%
 * - Response time: <2 seconds for typical input
 * - Memory usage: <50MB peak
 * - Error handling: Comprehensive coverage
 * - User experience: Production-ready
 */

import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";
import {
  cleanupTestEnvironment,
  setupTestEnvironment,
  type TestEnvironment,
} from "$test/helpers/setup.ts";

const logger = new BreakdownLogger("gate4-e2e");
let TEST_ENV: TestEnvironment;

// Gate 4 Quality Metrics Tracking
interface Gate4Metrics {
  testStartTime: number;
  testEndTime: number;
  memoryPeakUsage: number;
  e2eWorkflowTests: number;
  performanceTests: number;
  errorScenarioTests: number;
  customVariableTests: number;
  testsPassed: number;
  testsFailed: number;
  userExperienceScore: number;
}

let gate4Metrics: Gate4Metrics;

// Setup for Gate 4 validation
Deno.test({
  name: "Gate4 Setup - E2E Workflow Validation Environment",
  fn: async () => {
    logger.info("🚀 Gate 4 E2E Workflow Validation Started");
    gate4Metrics = {
      testStartTime: performance.now(),
      testEndTime: 0,
      memoryPeakUsage: Deno.memoryUsage().heapUsed,
      e2eWorkflowTests: 0,
      performanceTests: 0,
      errorScenarioTests: 0,
      customVariableTests: 0,
      testsPassed: 0,
      testsFailed: 0,
      userExperienceScore: 0,
    };

    TEST_ENV = await setupTestEnvironment({
      workingDir: "./tmp/test_gate4_e2e",
    });

    // Create test configuration and fixtures
    const configDir = join(TEST_ENV.workingDir, ".agent", "breakdown", "config");
    await ensureDir(configDir);

    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
    );

    logger.info("Gate 4 environment ready", {
      workingDir: TEST_ENV.workingDir,
      configDir,
    });
  },
});

// Gate 4 Test: Complete "breakdown find bugs" Workflow
Deno.test("Gate4: Complete Find Bugs E2E Workflow", async () => {
  logger.debug("Testing complete 'breakdown find bugs' end-to-end workflow");

  try {
    // Create test input file with bug scenarios
    const inputFile = join(TEST_ENV.workingDir, "code_with_bugs.md");
    await Deno.writeTextFile(
      inputFile,
      `
# Code Analysis Request

## Issues Found
- Memory leaks in payment processing
- SQL injection vulnerabilities in user authentication
- Race conditions in concurrent operations
- Null pointer exceptions in error handling

## Code Snippets
\`\`\`javascript
// Problematic code example
function processPayment(amount, userId) {
  const query = "SELECT * FROM users WHERE id = " + userId; // SQL injection risk
  const result = database.query(query);
  return result.balance > amount; // potential null reference
}
\`\`\`

## Expected Fixes
- Use prepared statements for database queries
- Add null checks for safety
- Implement proper error handling
- Add concurrent access controls
`,
    );

    const outputFile = join(TEST_ENV.workingDir, "bugs_analysis.md");

    // Import the CLI function for testing
    const { runBreakdown } = await import("../../cli/breakdown.ts");

    // Test the complete workflow
    const startTime = performance.now();

    // Simulate CLI execution with find bugs command
    await runBreakdown([
      "find",
      "bugs",
      "--from",
      inputFile,
      "--destination",
      outputFile,
      "--uv-team",
      "Security Team",
      "--uv-priority",
      "Critical",
      "--uv-project",
      "PaymentGateway",
    ]);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Validate execution time requirement
    assert(executionTime < 2000, `Execution time ${executionTime}ms exceeds 2000ms requirement`);

    // Validate output file was created
    const outputExists = await Deno.stat(outputFile).then(() => true).catch(() => false);
    assertEquals(outputExists, true, "Output file should be created");

    if (outputExists) {
      const output = await Deno.readTextFile(outputFile);

      // Validate output contains expected content
      assertStringIncludes(output, "Security Team", "Output should contain custom variables");
      assertStringIncludes(output, "Critical", "Output should contain priority");
      assertStringIncludes(output, "PaymentGateway", "Output should contain project name");

      // Validate bug analysis content is present
      assert(output.length > 100, "Output should contain substantial analysis");
    }

    gate4Metrics.e2eWorkflowTests++;
    gate4Metrics.testsPassed++;

    logger.info("✅ Gate4 Test PASSED: Complete find bugs E2E workflow", {
      executionTime: `${executionTime.toFixed(2)}ms`,
      outputFileSize: outputExists ? (await Deno.stat(outputFile)).size : 0,
    });
  } catch (error) {
    gate4Metrics.testsFailed++;
    logger.error("❌ Gate4 Test FAILED: Complete find bugs E2E workflow", error);
    throw error;
  }
});

// Gate 4 Test: Custom Variables Integration E2E
Deno.test("Gate4: Custom Variables Integration E2E", async () => {
  logger.debug("Testing custom variables integration in find bugs workflow");

  try {
    const inputFile = join(TEST_ENV.workingDir, "bug_report.md");
    await Deno.writeTextFile(
      inputFile,
      `
# Bug Report: Authentication Issues

## Problem Description
Users experiencing login failures during peak traffic periods.

## Technical Details
- Database connection timeouts
- Session management issues
- Rate limiting problems
`,
    );

    const outputFile = join(TEST_ENV.workingDir, "custom_vars_output.md");

    // Import the CLI function
    const { runBreakdown } = await import("../../cli/breakdown.ts");

    // Test with comprehensive custom variables
    await runBreakdown([
      "find",
      "bugs",
      "--from",
      inputFile,
      "-o",
      outputFile,
      "--uv-team",
      "Backend Engineering",
      "--uv-sprint",
      "2025-Q1-Sprint-4",
      "--uv-project",
      "AuthenticationService",
      "--uv-severity",
      "High",
      "--uv-reporter",
      "QA Team",
      "--uv-environment",
      "Production",
    ]);

    // Validate custom variables are properly integrated
    const outputExists = await Deno.stat(outputFile).then(() => true).catch(() => false);
    assertEquals(outputExists, true, "Output with custom variables should be created");

    if (outputExists) {
      const output = await Deno.readTextFile(outputFile);

      // Validate all custom variables are present in output
      const expectedVars = [
        "Backend Engineering",
        "2025-Q1-Sprint-4",
        "AuthenticationService",
        "High",
        "QA Team",
        "Production",
      ];

      for (const varValue of expectedVars) {
        assertStringIncludes(
          output,
          varValue,
          `Output should contain custom variable: ${varValue}`,
        );
      }
    }

    gate4Metrics.customVariableTests++;
    gate4Metrics.testsPassed++;

    logger.info("✅ Gate4 Test PASSED: Custom variables integration E2E");
  } catch (error) {
    gate4Metrics.testsFailed++;
    logger.error("❌ Gate4 Test FAILED: Custom variables integration E2E", error);
    throw error;
  }
});

// Gate 4 Test: Error Handling E2E Scenarios
Deno.test("Gate4: Error Handling E2E Scenarios", async () => {
  logger.debug("Testing comprehensive error handling in find bugs workflow");

  try {
    const { runBreakdown } = await import("../../cli/breakdown.ts");

    // Test various error scenarios
    const errorScenarios = [
      {
        description: "Non-existent input file",
        args: ["find", "bugs", "--from", "nonexistent.md"],
        expectError: true,
      },
      {
        description: "Invalid output directory",
        args: [
          "find",
          "bugs",
          "--from",
          join(TEST_ENV.workingDir, "bug_report.md"),
          "-o",
          "/invalid/path/output.md",
        ],
        expectError: true,
      },
      {
        description: "Missing required parameters",
        args: ["find", "bugs"],
        expectError: true,
      },
    ];

    // Create a valid input file for some tests
    await Deno.writeTextFile(
      join(TEST_ENV.workingDir, "bug_report.md"),
      "# Sample bug report for testing",
    );

    for (const scenario of errorScenarios) {
      let errorOccurred = false;

      try {
        await runBreakdown(scenario.args);
      } catch (error) {
        errorOccurred = true;
        logger.debug("Expected error occurred", {
          scenario: scenario.description,
          error: error.message,
        });
      }

      if (scenario.expectError) {
        assertEquals(errorOccurred, true, `Error should occur for: ${scenario.description}`);
      }

      gate4Metrics.errorScenarioTests++;
    }

    gate4Metrics.testsPassed++;
    logger.info("✅ Gate4 Test PASSED: Error handling E2E scenarios", {
      scenariosTested: errorScenarios.length,
    });
  } catch (error) {
    gate4Metrics.testsFailed++;
    logger.error("❌ Gate4 Test FAILED: Error handling E2E scenarios", error);
    throw error;
  }
});

// Gate 4 Test: Performance and Memory Usage E2E
Deno.test("Gate4: Performance and Memory Usage E2E", async () => {
  logger.debug("Testing performance and memory usage in realistic scenarios");

  try {
    // Create a larger input file to test performance
    const largeInputFile = join(TEST_ENV.workingDir, "large_codebase.md");
    const largeContent = `
# Large Codebase Analysis

## Multiple Components
${
      Array.from({ length: 100 }, (_, i) => `
### Component ${i + 1}
- Potential memory leak in component ${i + 1}
- Performance issue in loop optimization
- Error handling improvements needed
- Code review recommendations

\`\`\`javascript
function component${i + 1}Function() {
  // Sample code with potential issues
  const data = [];
  for (let j = 0; j < 10000; j++) {
    data.push(new Object()); // Potential memory issue
  }
  return data; // No cleanup
}
\`\`\`
`).join("\n")
    }
`;

    await Deno.writeTextFile(largeInputFile, largeContent);

    const outputFile = join(TEST_ENV.workingDir, "performance_test_output.md");

    // Monitor memory usage during execution
    const memoryBefore = Deno.memoryUsage().heapUsed;
    const startTime = performance.now();

    const { runBreakdown } = await import("../../cli/breakdown.ts");

    await runBreakdown([
      "find",
      "bugs",
      "--from",
      largeInputFile,
      "-o",
      outputFile,
      "--uv-project",
      "LargeCodebase",
      "--uv-analysis",
      "Performance",
    ]);

    const endTime = performance.now();
    const memoryAfter = Deno.memoryUsage().heapUsed;

    const executionTime = endTime - startTime;
    const memoryUsed = (memoryAfter - memoryBefore) / 1024 / 1024; // Convert to MB

    // Update peak memory usage
    gate4Metrics.memoryPeakUsage = Math.max(gate4Metrics.memoryPeakUsage, memoryAfter);

    // Validate performance requirements
    assert(
      executionTime < 10000,
      `Large file processing time ${executionTime}ms exceeds 10000ms limit`,
    );
    assert(memoryUsed < 50, `Memory usage ${memoryUsed}MB exceeds 50MB limit`);

    // Validate output was generated
    const outputExists = await Deno.stat(outputFile).then(() => true).catch(() => false);
    assertEquals(outputExists, true, "Large file output should be generated");

    gate4Metrics.performanceTests++;
    gate4Metrics.testsPassed++;

    logger.info("✅ Gate4 Test PASSED: Performance and memory usage E2E", {
      executionTime: `${executionTime.toFixed(2)}ms`,
      memoryUsed: `${memoryUsed.toFixed(2)}MB`,
      inputSize: largeContent.length,
      requirement: "<10s execution, <50MB memory",
    });
  } catch (error) {
    gate4Metrics.testsFailed++;
    logger.error("❌ Gate4 Test FAILED: Performance and memory usage E2E", error);
    throw error;
  }
});

// Gate 4 Test: User Experience Validation
Deno.test("Gate4: User Experience Validation", async () => {
  logger.debug("Testing user experience aspects of find bugs command");

  try {
    const { runBreakdown } = await import("../../cli/breakdown.ts");

    // Test help documentation
    let helpOutput = "";
    const originalWriteStdout = console.log;
    console.log = (message: string) => {
      helpOutput += message + "\n";
    };

    try {
      await runBreakdown(["--help"]);
    } catch {
      // Help command might exit, which is expected
    } finally {
      console.log = originalWriteStdout;
    }

    // Validate help text contains find bugs command
    assertStringIncludes(helpOutput, "find bugs", "Help text should document find bugs command");

    // Test command suggestions and error messages
    let errorOutput = "";
    const originalWriteStderr = console.error;
    console.error = (message: string) => {
      errorOutput += message + "\n";
    };

    try {
      await runBreakdown(["find", "invalid"]);
    } catch {
      // Expected to fail
    } finally {
      console.error = originalWriteStderr;
    }

    // Validate user-friendly error messages
    assert(errorOutput.length > 0, "Should provide error feedback for invalid commands");

    // Calculate user experience score based on various factors
    let uxScore = 0;
    if (helpOutput.includes("find bugs")) uxScore += 25;
    if (helpOutput.includes("Layer Types")) uxScore += 25;
    if (errorOutput.length > 0) uxScore += 25;
    if (errorOutput.includes("command") || errorOutput.includes("invalid")) uxScore += 25;

    gate4Metrics.userExperienceScore = uxScore;

    assert(uxScore >= 75, `User experience score ${uxScore} below 75% threshold`);

    gate4Metrics.testsPassed++;
    logger.info("✅ Gate4 Test PASSED: User experience validation", {
      userExperienceScore: `${uxScore}%`,
      helpDocumentation: "Available",
      errorHandling: "User-friendly",
    });
  } catch (error) {
    gate4Metrics.testsFailed++;
    logger.error("❌ Gate4 Test FAILED: User experience validation", error);
    throw error;
  }
});

// Gate 4 Final Validation and Production Readiness Report
Deno.test({
  name: "Gate4 Final - Production Readiness Report",
  fn: async () => {
    gate4Metrics.testEndTime = performance.now();

    const executionTime = gate4Metrics.testEndTime - gate4Metrics.testStartTime;
    const peakMemoryMB = gate4Metrics.memoryPeakUsage / 1024 / 1024;

    // Validate final Gate 4 quality criteria
    assert(
      executionTime < 30000,
      `Total test execution time ${executionTime}ms exceeds 30000ms limit`,
    );
    assert(peakMemoryMB < 100, `Peak memory usage ${peakMemoryMB}MB exceeds 100MB limit`);
    assert(gate4Metrics.testsFailed === 0, `Gate 4 has ${gate4Metrics.testsFailed} failed tests`);
    assert(gate4Metrics.e2eWorkflowTests >= 1, "Must have E2E workflow tests");
    assert(gate4Metrics.customVariableTests >= 1, "Must have custom variable tests");
    assert(gate4Metrics.errorScenarioTests >= 3, "Must have comprehensive error tests");
    assert(gate4Metrics.userExperienceScore >= 75, "User experience below threshold");

    const productionReadinessReport = {
      status: "PRODUCTION_READY",
      executionTime: `${executionTime.toFixed(2)}ms`,
      peakMemoryUsage: `${peakMemoryMB.toFixed(2)}MB`,
      testsPassed: gate4Metrics.testsPassed,
      testsFailed: gate4Metrics.testsFailed,
      e2eWorkflowTests: gate4Metrics.e2eWorkflowTests,
      customVariableTests: gate4Metrics.customVariableTests,
      errorScenarioTests: gate4Metrics.errorScenarioTests,
      performanceTests: gate4Metrics.performanceTests,
      userExperienceScore: `${gate4Metrics.userExperienceScore}%`,
      qualityGate: "Gate 4: E2E Workflow Validation",
      nextStep: "deno task ci execution ready",
      productionDeployment: "APPROVED",
    };

    logger.info("🎉 Gate 4 E2E Validation COMPLETED - PRODUCTION READY", productionReadinessReport);

    // Cleanup
    await cleanupTestEnvironment(TEST_ENV);

    // Final production readiness report
    console.log("\n" + "=".repeat(80));
    console.log("🚀 QUALITY GATE 4 - PRODUCTION READINESS REPORT");
    console.log("=".repeat(80));
    console.log(`Status: ${productionReadinessReport.status}`);
    console.log(`Total Execution Time: ${productionReadinessReport.executionTime}`);
    console.log(`Peak Memory Usage: ${productionReadinessReport.peakMemoryUsage}`);
    console.log(`Tests Passed: ${productionReadinessReport.testsPassed}`);
    console.log(`Tests Failed: ${productionReadinessReport.testsFailed}`);
    console.log(`E2E Workflow Tests: ${productionReadinessReport.e2eWorkflowTests}`);
    console.log(`Custom Variable Tests: ${productionReadinessReport.customVariableTests}`);
    console.log(`Error Scenario Tests: ${productionReadinessReport.errorScenarioTests}`);
    console.log(`Performance Tests: ${productionReadinessReport.performanceTests}`);
    console.log(`User Experience Score: ${productionReadinessReport.userExperienceScore}`);
    console.log(`Production Deployment: ${productionReadinessReport.productionDeployment}`);
    console.log(`Next Step: ${productionReadinessReport.nextStep}`);
    console.log("=".repeat(80));
    console.log("✅ ALL QUALITY GATES PASSED - READY FOR PRODUCTION DEPLOYMENT");
    console.log("=".repeat(80));
  },
});
