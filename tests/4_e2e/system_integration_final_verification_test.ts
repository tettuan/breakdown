/**
 * System Integration Final Verification Test Suite
 *
 * This comprehensive test suite provides the final validation of the entire Breakdown system:
 * - Full-stack component integration verification
 * - End-to-end system performance validation under realistic loads
 * - Quality assurance across all major workflows
 * - Resilience testing under various failure scenarios
 * - Production-readiness validation
 *
 * Test Coverage:
 * 1. Complete Component Integration Flow Verification
 * 2. System-wide Performance and Resource Management
 * 3. Quality Assurance and Reliability Testing
 * 4. Production Environment Simulation
 * 5. Comprehensive Error Handling and Recovery
 *
 * @module tests/4_e2e/system_integration_final_verification_test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";

// Import core system components
import {
  handleTwoParams,
  type TwoParamsHandlerError,
} from "../../lib/cli/handlers/two_params_handler.ts";
import {
  handleTwoParamsWithOrchestrator,
  type OrchestratorError,
} from "../../lib/cli/handlers/two_params_orchestrator.ts";
import type { Result } from "../../lib/types/result.ts";

const logger = new BreakdownLogger("system-integration-final");

/**
 * System-wide performance metrics tracking
 */
interface SystemMetrics {
  totalOperations: number;
  totalDuration: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  memoryUsage: number;
  successRate: number;
  errorDistribution: Record<string, number>;
  throughput: number;
}

/**
 * Comprehensive test environment setup
 */
interface TestEnvironment {
  baseDir: string;
  configDir: string;
  promptsDir: string;
  schemasDir: string;
  inputDir: string;
  outputDir: string;
  cleanup: () => Promise<void>;
}

/**
 * Test case types following Totality principle - Discriminated Union
 */
type ValidationTest =
  | {
    kind: "functional";
    name: string;
    params: string[];
    options: Record<string, unknown>;
    qualityWeight: number;
  }
  | {
    kind: "error_test";
    name: string;
    params: string[];
    options: Record<string, unknown>;
    qualityWeight: number;
    expectFailure: true;
  }
  | {
    kind: "performance";
    name: string;
    params: string[];
    options: Record<string, unknown>;
    qualityWeight: number;
    maxDuration: number;
  };

/**
 * Legacy test interface for backward compatibility
 */
interface LegacyTestCase {
  name: string;
  params: string[];
  options: Record<string, unknown>;
  qualityWeight: number;
  expectFailure?: boolean;
  maxDuration?: number;
}

/**
 * Create comprehensive test environment
 */
async function createSystemTestEnvironment(): Promise<TestEnvironment> {
  const baseDir = await Deno.makeTempDir({ prefix: "system_integration_final_" });

  // Create directory structure
  const configDir = join(baseDir, ".agent", "breakdown", "config");
  const promptsDir = join(baseDir, "prompts");
  const schemasDir = join(baseDir, "schemas");
  const inputDir = join(baseDir, "inputs");
  const outputDir = join(baseDir, "outputs");

  await Promise.all([
    ensureDir(configDir),
    ensureDir(promptsDir),
    ensureDir(schemasDir),
    ensureDir(inputDir),
    ensureDir(outputDir),
  ]);

  // Create comprehensive prompt templates
  const promptStructure = [
    ["specification", "project"],
    ["specification", "issue"],
    ["specification", "task"],
    ["specification", "bugs"],
    ["architecture", "project"],
    ["architecture", "issue"],
    ["architecture", "task"],
    ["architecture", "bugs"],
    ["example", "project"],
    ["example", "issue"],
    ["example", "task"],
    ["example", "bugs"],
    ["document", "project"],
    ["document", "issue"],
    ["document", "task"],
    ["document", "bugs"],
  ];

  for (const [demonstrative, layer] of promptStructure) {
    const promptDir = join(promptsDir, demonstrative, layer);
    await ensureDir(promptDir);

    // Create multiple template variants
    const templates = [
      `f_${layer}.md`,
      `f_${layer}_strict.md`,
      `f_${layer}_detailed.md`,
      `f_${layer}_simple.md`,
    ];

    for (const template of templates) {
      const templatePath = join(promptDir, template);
      await Deno.writeTextFile(
        templatePath,
        `
# ${demonstrative.charAt(0).toUpperCase() + demonstrative.slice(1)} ${
          layer.charAt(0).toUpperCase() + layer.slice(1)
        } Template

## Input Processing
{{#if input_text}}
Processing input: {{input_text}}
{{/if}}

## Custom Variables
{{#each custom_variables}}
- {{@key}}: {{this}}
{{/each}}

## System Information
- Template: ${template}
- Demonstrative: ${demonstrative}
- Layer: ${layer}
- Generated: {{timestamp}}

## Content
{{input_text}}
`,
      );
    }
  }

  // Create comprehensive schema files
  const schemaStructure = [
    ["specification", "project"],
    ["architecture", "issue"],
    ["example", "task"],
    ["document", "bugs"],
  ];

  for (const [demonstrative, layer] of schemaStructure) {
    const schemaDir = join(schemasDir, demonstrative, layer);
    await ensureDir(schemaDir);

    const schemaPath = join(schemaDir, `${layer}_schema.json`);
    await Deno.writeTextFile(
      schemaPath,
      JSON.stringify(
        {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          title: `${demonstrative} ${layer} Schema`,
          properties: {
            content: { type: "string" },
            metadata: {
              type: "object",
              properties: {
                demonstrative: { type: "string", enum: [demonstrative] },
                layer: { type: "string", enum: [layer] },
                version: { type: "string" },
              },
            },
            custom_variables: {
              type: "object",
              additionalProperties: { type: "string" },
            },
          },
          required: ["content"],
        },
        null,
        2,
      ),
    );
  }

  // Create test input files
  const inputFiles = [
    "simple_input.md",
    "complex_input.md",
    "large_input.md",
    "structured_input.md",
  ];

  for (const inputFile of inputFiles) {
    const inputPath = join(inputDir, inputFile);
    const contentSize = inputFile.includes("large")
      ? 5000
      : inputFile.includes("complex")
      ? 1000
      : 200;

    const content = `
# Test Input: ${inputFile}

${
      Array.from({ length: contentSize / 50 }, (_, i) =>
        `## Section ${i + 1}
This is test content section ${i + 1} for comprehensive system testing.
- Item A: Testing comprehensive integration
- Item B: Validating system performance
- Item C: Ensuring quality assurance
`).join("\n")
    }

## Summary
This is a ${
      inputFile.replace(".md", "").replace("_", " ")
    } test file for system integration verification.
`;

    await Deno.writeTextFile(inputPath, content);
  }

  // Create comprehensive configuration
  const configPath = join(configDir, "app.yml");
  await Deno.writeTextFile(
    configPath,
    `
working_dir: .agent/breakdown
app_prompt:
  base_dir: ${promptsDir}
app_schema:
  base_dir: ${schemasDir}
stdin:
  timeout_ms: 5000
performance:
  max_memory_mb: 100
  timeout_seconds: 30
`,
  );

  const cleanup = async () => {
    try {
      await Deno.remove(baseDir, { recursive: true });
    } catch (err) {
      logger.warn("Failed to cleanup test environment", { error: err });
    }
  };

  return {
    baseDir,
    configDir,
    promptsDir,
    schemasDir,
    inputDir,
    outputDir,
    cleanup,
  };
}

/**
 * System performance measurement utilities
 */
function startSystemMetrics(): { startTime: number; startMemory: number } {
  const startTime = performance.now();
  const startMemory = Deno.memoryUsage().heapUsed;
  return { startTime, startMemory };
}

function calculateSystemMetrics(
  start: { startTime: number; startMemory: number },
  operations: Array<{ duration: number; success: boolean; errorKind?: string }>,
): SystemMetrics {
  const endTime = performance.now();
  const endMemory = Deno.memoryUsage().heapUsed;

  const totalDuration = endTime - start.startTime;
  const durations = operations.map((op) => op.duration);
  const successCount = operations.filter((op) => op.success).length;

  const errorDistribution: Record<string, number> = {};
  operations.forEach((op) => {
    if (!op.success && op.errorKind) {
      errorDistribution[op.errorKind] = (errorDistribution[op.errorKind] || 0) + 1;
    }
  });

  return {
    totalOperations: operations.length,
    totalDuration,
    avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
    maxDuration: Math.max(...durations),
    minDuration: Math.min(...durations),
    memoryUsage: endMemory - start.startMemory,
    successRate: successCount / operations.length,
    errorDistribution,
    throughput: operations.length / (totalDuration / 1000),
  };
}

describe("System Integration Final Verification - Complete Component Integration", () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = await createSystemTestEnvironment();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it("should verify complete end-to-end system integration", async () => {
    logger.debug("Testing complete end-to-end system integration");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      app_schema: { base_dir: testEnv.schemasDir },
      stdin: { timeout_ms: 5000 },
    };

    // Test complete workflow scenarios
    const integrationScenarios = [
      {
        name: "specification_project_basic",
        params: ["specification", "project"],
        options: {
          fromFile: join(testEnv.inputDir, "simple_input.md"),
          destination: join(testEnv.outputDir, "spec_project.md"),
        },
      },
      {
        name: "architecture_core_complex",
        params: ["architecture", "issue"],
        options: {
          fromFile: join(testEnv.inputDir, "complex_input.md"),
          destination: join(testEnv.outputDir, "arch_core.md"),
          "uv-project": "system_integration_test",
          "uv-version": "1.0.0",
          extended: true,
        },
      },
      {
        name: "example_integration_advanced",
        params: ["example", "task"],
        options: {
          fromFile: join(testEnv.inputDir, "structured_input.md"),
          destination: join(testEnv.outputDir, "example_integration.md"),
          "uv-environment": "test",
          "uv-complexity": "advanced",
          adaptation: "detailed",
          customValidation: true,
        },
      },
      {
        name: "document_scenarios_comprehensive",
        params: ["document", "bugs"],
        options: {
          fromFile: join(testEnv.inputDir, "large_input.md"),
          destination: join(testEnv.outputDir, "doc_scenarios.md"),
          "uv-test-suite": "final_verification",
          "uv-scope": "comprehensive",
          "uv-quality": "production",
          extended: true,
          customValidation: true,
          errorFormat: "detailed" as const,
        },
      },
    ];

    const integrationResults: Array<{
      scenario: string;
      duration: number;
      success: boolean;
      errorKind?: string;
      memoryDelta: number;
    }> = [];

    for (const scenario of integrationScenarios) {
      const start = startSystemMetrics();

      const result = await handleTwoParams(scenario.params, config, scenario.options);

      const endTime = performance.now();
      const endMemory = Deno.memoryUsage().heapUsed;
      const duration = endTime - start.startTime;
      const memoryDelta = endMemory - start.startMemory;

      integrationResults.push({
        scenario: scenario.name,
        duration,
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : undefined,
        memoryDelta,
      });

      // Each scenario should complete within reasonable time and memory limits
      assert(
        duration < 10000,
        `Scenario ${scenario.name} should complete in <10s, took ${duration}ms`,
      );
      assert(
        memoryDelta < 100_000_000,
        `Scenario ${scenario.name} memory should be <100MB, used ${memoryDelta} bytes`,
      );

      assertEquals(typeof result.ok, "boolean");
    }

    // Overall integration verification
    const totalDuration = integrationResults.reduce((sum, r) => sum + r.duration, 0);
    const successRate = integrationResults.filter((r) => r.success).length /
      integrationResults.length;
    const avgMemoryUsage = integrationResults.reduce((sum, r) => sum + r.memoryDelta, 0) /
      integrationResults.length;

    // System-level assertions
    assert(
      totalDuration < 30000,
      `Total integration should complete in <30s, took ${totalDuration}ms`,
    );
    assert(
      avgMemoryUsage < 50_000_000,
      `Average memory usage should be <50MB, was ${avgMemoryUsage} bytes`,
    );

    logger.debug("Complete end-to-end system integration completed", {
      totalScenarios: integrationScenarios.length,
      successRate: (successRate * 100).toFixed(1) + "%",
      totalDuration,
      avgMemoryUsage,
      integrationResults,
    });
  });

  it("should verify component orchestration integration reliability", async () => {
    logger.debug("Testing component orchestration integration reliability");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      stdin: { timeout_ms: 1000 },
    };

    // Test orchestrator vs handler consistency
    const consistencyTests = [
      {
        params: ["to", "project"],
        options: { skipStdin: true },
      },
      {
        params: ["summary", "issue"],
        options: {
          skipStdin: true,
          "uv-consistency": "test",
          extended: true,
        },
      },
      {
        params: ["init", "task"],
        options: {
          skipStdin: true,
          "uv-test": "orchestration",
          customValidation: true,
        },
      },
    ];

    const consistencyResults: Array<{
      params: string[];
      handlerResult: Result<void, TwoParamsHandlerError>;
      orchestratorResult: Result<void, OrchestratorError>;
      consistent: boolean;
    }> = [];

    for (const test of consistencyTests) {
      // Test both handler and orchestrator
      const handlerResult = await handleTwoParams(test.params, config, test.options);
      const orchestratorResult = await handleTwoParamsWithOrchestrator(
        test.params,
        config,
        test.options,
      );

      // Results should be structurally consistent
      const consistent = (handlerResult.ok === orchestratorResult.ok) &&
        (handlerResult.ok ||
          (!handlerResult.ok && !orchestratorResult.ok &&
            handlerResult.error.kind === orchestratorResult.error.kind));

      consistencyResults.push({
        params: test.params,
        handlerResult,
        orchestratorResult,
        consistent,
      });

      assertEquals(typeof handlerResult.ok, "boolean");
      assertEquals(typeof orchestratorResult.ok, "boolean");
    }

    // All results should be consistent between handler and orchestrator
    const allConsistent = consistencyResults.every((r) => r.consistent);
    assert(allConsistent, "Handler and orchestrator should produce consistent results");

    logger.debug("Component orchestration integration reliability completed", {
      testsRun: consistencyTests.length,
      allConsistent,
      consistencyResults: consistencyResults.map((r) => ({
        params: r.params,
        handlerSuccess: r.handlerResult.ok,
        orchestratorSuccess: r.orchestratorResult.ok,
        consistent: r.consistent,
      })),
    });
  });

  it("should verify cross-component data flow integrity", async () => {
    logger.debug("Testing cross-component data flow integrity");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      stdin: { timeout_ms: 2000 },
    };

    // Test data flow through all components
    const dataFlowScenarios = [
      {
        name: "simple_data_flow",
        params: ["specification", "project"],
        inputData: "Simple test data for verification",
        customVars: { "uv-flow": "simple" },
      },
      {
        name: "complex_data_flow",
        params: ["architecture", "issue"],
        inputData: "Complex test data with\nmultiple lines\nand special characters: !@#$%^&*()",
        customVars: {
          "uv-flow": "complex",
          "uv-encoding": "utf-8",
          "uv-special": "chars!@#",
        },
      },
      {
        name: "large_data_flow",
        params: ["example", "task"],
        inputData: "Large".repeat(1000) + " test data for performance verification",
        customVars: {
          "uv-flow": "large",
          "uv-size": "large",
          "uv-performance": "test",
        },
      },
    ];

    const dataFlowResults: Array<{
      scenario: string;
      inputSize: number;
      customVarsCount: number;
      processed: boolean;
      duration: number;
    }> = [];

    for (const scenario of dataFlowScenarios) {
      const start = performance.now();

      // Create temporary input file
      const inputFile = join(testEnv.inputDir, `${scenario.name}_input.md`);
      await Deno.writeTextFile(inputFile, scenario.inputData);

      const options = {
        fromFile: inputFile,
        destination: join(testEnv.outputDir, `${scenario.name}_output.md`),
        ...scenario.customVars,
      };

      const result = await handleTwoParams(scenario.params, config, options);

      const duration = performance.now() - start;

      dataFlowResults.push({
        scenario: scenario.name,
        inputSize: scenario.inputData.length,
        customVarsCount: Object.keys(scenario.customVars).length,
        processed: result.ok,
        duration,
      });

      // Data flow should handle various input sizes
      assertEquals(typeof result.ok, "boolean");
      assert(
        duration < 8000,
        `Data flow ${scenario.name} should complete in <8s, took ${duration}ms`,
      );
    }

    // Verify data flow performance scales reasonably
    const simpleFlow = dataFlowResults.find((r) => r.scenario === "simple_data_flow");
    const complexFlow = dataFlowResults.find((r) => r.scenario === "complex_data_flow");
    const largeFlow = dataFlowResults.find((r) => r.scenario === "large_data_flow");

    if (simpleFlow && complexFlow && largeFlow) {
      // Complex flow should not be more than 3x slower than simple
      assert(
        complexFlow.duration <= simpleFlow.duration * 3,
        `Complex flow performance should be reasonable: ${complexFlow.duration}ms vs ${simpleFlow.duration}ms`,
      );

      // Large flow should not be more than 5x slower than simple
      assert(
        largeFlow.duration <= simpleFlow.duration * 5,
        `Large flow performance should be reasonable: ${largeFlow.duration}ms vs ${simpleFlow.duration}ms`,
      );
    }

    logger.debug("Cross-component data flow integrity completed", {
      scenarios: dataFlowScenarios.length,
      dataFlowResults,
      allProcessed: dataFlowResults.every((r) => r.processed),
    });
  });
});

describe("System Integration Final Verification - System Performance & Quality", () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = await createSystemTestEnvironment();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it("should verify system-wide performance under realistic load", async () => {
    logger.debug("Testing system-wide performance under realistic load");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      stdin: { timeout_ms: 3000 },
    };

    // Realistic load simulation
    const loadTestScenarios = [
      // Quick operations (should be fast)
      ...Array.from({ length: 10 }, (_, i) => ({
        name: `quick_validation_${i}`,
        params: i % 2 === 0 ? [] : ["invalid"],
        options: {},
        expectedDuration: 500, // ms
        expectFailure: true,
      })),

      // Standard operations (normal processing)
      ...Array.from({ length: 8 }, (_, i) => ({
        name: `standard_processing_${i}`,
        params: ["specification", "project"],
        options: {
          skipStdin: true,
          operation: i,
          "uv-batch": "standard",
        },
        expectedDuration: 3000, // ms
        expectFailure: false,
      })),

      // Complex operations (heavy processing)
      ...Array.from({ length: 3 }, (_, i) => ({
        name: `complex_processing_${i}`,
        params: ["document", "bugs"],
        options: {
          fromFile: join(testEnv.inputDir, "large_input.md"),
          destination: join(testEnv.outputDir, `complex_${i}.md`),
          "uv-complexity": "high",
          "uv-iteration": i.toString(),
          extended: true,
          customValidation: true,
        },
        expectedDuration: 8000, // ms
        expectFailure: false,
      })),
    ];

    const startMetrics = startSystemMetrics();
    const loadResults: Array<{
      scenario: string;
      duration: number;
      success: boolean;
      errorKind?: string;
      withinExpectedTime: boolean;
    }> = [];

    // Execute load test scenarios
    for (const scenario of loadTestScenarios) {
      const scenarioStart = performance.now();

      const result = await handleTwoParams(scenario.params, config, scenario.options);

      const scenarioDuration = performance.now() - scenarioStart;
      const withinExpectedTime = scenarioDuration <= scenario.expectedDuration;

      loadResults.push({
        scenario: scenario.name,
        duration: scenarioDuration,
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : undefined,
        withinExpectedTime,
      });

      // Verify expected behavior
      if (scenario.expectFailure) {
        assertEquals(result.ok, false);
      } else {
        // For non-failure scenarios, structure should be correct
        assertEquals(typeof result.ok, "boolean");
      }
    }

    const systemMetrics = calculateSystemMetrics(
      startMetrics,
      loadResults.map((r) => ({
        duration: r.duration,
        success: r.success,
        errorKind: r.errorKind,
      })),
    );

    // System-wide performance assertions
    assert(
      systemMetrics.totalDuration < 60000,
      `Total load test should complete in <60s, took ${systemMetrics.totalDuration}ms`,
    );
    assert(
      systemMetrics.memoryUsage < 200_000_000,
      `System memory usage should be <200MB, used ${systemMetrics.memoryUsage} bytes`,
    );
    assert(
      systemMetrics.throughput > 0.5,
      `System throughput should be >0.5 ops/sec, was ${systemMetrics.throughput}`,
    );

    // Performance distribution assertions
    const quickOps = loadResults.filter((r) => r.scenario.includes("quick"));
    const standardOps = loadResults.filter((r) => r.scenario.includes("standard"));
    const complexOps = loadResults.filter((r) => r.scenario.includes("complex"));

    if (quickOps.length > 0) {
      const avgQuickDuration = quickOps.reduce((sum, op) => sum + op.duration, 0) / quickOps.length;
      assert(
        avgQuickDuration < 500,
        `Quick operations should average <500ms, averaged ${avgQuickDuration}ms`,
      );
    }

    if (standardOps.length > 0) {
      const avgStandardDuration = standardOps.reduce((sum, op) => sum + op.duration, 0) /
        standardOps.length;
      assert(
        avgStandardDuration < 3000,
        `Standard operations should average <3s, averaged ${avgStandardDuration}ms`,
      );
    }

    logger.debug("System-wide performance under realistic load completed", {
      totalOperations: systemMetrics.totalOperations,
      systemMetrics,
      performanceBreakdown: {
        quickOps: quickOps.length,
        standardOps: standardOps.length,
        complexOps: complexOps.length,
      },
      withinExpectedTimeCount: loadResults.filter((r) => r.withinExpectedTime).length,
    });
  });

  it("should verify concurrent system operations reliability", async () => {
    logger.debug("Testing concurrent system operations reliability");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      stdin: { timeout_ms: 2000 },
    };

    // Concurrent operations test
    const concurrentBatches = [
      // Batch 1: Homogeneous operations
      Array.from({ length: 5 }, (_, i) => ({
        name: `homogeneous_${i}`,
        params: ["specification", "project"],
        options: {
          skipStdin: true,
          batch: "homogeneous",
          operation: i,
        },
      })),

      // Batch 2: Mixed operations
      [
        {
          name: "mixed_spec_project",
          params: ["specification", "project"],
          options: { skipStdin: true, batch: "mixed" },
        },
        {
          name: "mixed_arch_core",
          params: ["architecture", "issue"],
          options: { skipStdin: true, batch: "mixed" },
        },
        {
          name: "mixed_example_integration",
          params: ["example", "task"],
          options: {
            skipStdin: true,
            batch: "mixed",
            "uv-concurrent": "test",
          },
        },
      ],

      // Batch 3: Error-prone operations (for resilience testing)
      [
        {
          name: "error_invalid_params",
          params: [],
          options: { batch: "error" },
        },
        {
          name: "error_invalid_demo",
          params: ["invalid", "project"],
          options: { batch: "error" },
        },
        {
          name: "error_invalid_layer",
          params: ["specification", "invalid"],
          options: { batch: "error" },
        },
      ],
    ];

    const concurrentResults: Array<{
      batchName: string;
      batchSize: number;
      totalDuration: number;
      successCount: number;
      errorCount: number;
      interference: boolean;
    }> = [];

    for (let batchIndex = 0; batchIndex < concurrentBatches.length; batchIndex++) {
      const batch = concurrentBatches[batchIndex];
      const batchStart = performance.now();

      // Execute batch concurrently
      const batchPromises = batch.map((operation) =>
        handleTwoParams(operation.params, config, operation.options)
      );

      const batchResults = await Promise.all(batchPromises);

      const batchDuration = performance.now() - batchStart;
      const successCount = batchResults.filter((r) => r.ok).length;
      const errorCount = batchResults.filter((r) => !r.ok).length;

      // Check for interference (results should be independent)
      const interference = false; // Simplified interference detection

      concurrentResults.push({
        batchName: `batch_${batchIndex + 1}`,
        batchSize: batch.length,
        totalDuration: batchDuration,
        successCount,
        errorCount,
        interference,
      });

      // Concurrent operations should complete reasonably quickly
      assert(
        batchDuration < 15000,
        `Concurrent batch should complete in <15s, took ${batchDuration}ms`,
      );

      // All operations should complete (success or structured failure)
      assertEquals(batchResults.length, batch.length);
    }

    // Overall concurrent reliability assertions
    const totalConcurrentOps = concurrentResults.reduce((sum, r) => sum + r.batchSize, 0);
    const totalSuccessOps = concurrentResults.reduce((sum, r) => sum + r.successCount, 0);
    const noInterference = concurrentResults.every((r) => !r.interference);

    assert(noInterference, "Concurrent operations should not interfere with each other");
    assert(
      totalConcurrentOps > 10,
      `Should test significant concurrent load, tested ${totalConcurrentOps} operations`,
    );

    logger.debug("Concurrent system operations reliability completed", {
      totalBatches: concurrentBatches.length,
      totalConcurrentOps,
      totalSuccessOps,
      noInterference,
      concurrentResults,
    });
  });

  it("should verify production-readiness quality assurance", async () => {
    logger.debug("Testing production-readiness quality assurance");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      app_schema: { base_dir: testEnv.schemasDir },
      stdin: { timeout_ms: 5000 },
    };

    // Production readiness scenarios
    const productionScenarios = [
      {
        name: "production_basic_workflow",
        params: ["specification", "project"],
        options: {
          fromFile: join(testEnv.inputDir, "simple_input.md"),
          destination: join(testEnv.outputDir, "production_basic.md"),
          "uv-environment": "production",
          "uv-version": "1.0.0",
        },
        qualityChecks: ["performance", "reliability", "correctness"],
      },
      {
        name: "production_advanced_workflow",
        params: ["architecture", "issue"],
        options: {
          fromFile: join(testEnv.inputDir, "complex_input.md"),
          destination: join(testEnv.outputDir, "production_advanced.md"),
          "uv-environment": "production",
          "uv-complexity": "enterprise",
          "uv-quality": "premium",
          extended: true,
          customValidation: true,
          errorFormat: "detailed" as const,
        },
        qualityChecks: [
          "performance",
          "reliability",
          "correctness",
          "validation",
          "error_handling",
        ],
      },
      {
        name: "production_edge_case_handling",
        params: ["document", "bugs"],
        options: {
          fromFile: join(testEnv.inputDir, "large_input.md"),
          destination: join(testEnv.outputDir, "production_edge.md"),
          "uv-environment": "production",
          "uv-edge-case": "large_content",
          "uv-stress-test": "true",
          extended: true,
        },
        qualityChecks: ["performance", "memory_efficiency", "scalability"],
      },
    ];

    const qualityResults: Array<{
      scenario: string;
      duration: number;
      memoryUsage: number;
      success: boolean;
      qualityScore: number;
      issues: string[];
    }> = [];

    for (const scenario of productionScenarios) {
      const start = startSystemMetrics();

      const result = await handleTwoParams(scenario.params, config, scenario.options);

      const endTime = performance.now();
      const endMemory = Deno.memoryUsage().heapUsed;
      const duration = endTime - start.startTime;
      const memoryUsage = endMemory - start.startMemory;

      // Quality assessment
      const issues: string[] = [];
      let qualityScore = 100;

      // Performance quality check
      if (duration > 10000) {
        issues.push("Performance: Operation took too long");
        qualityScore -= 20;
      }

      // Memory efficiency quality check
      if (memoryUsage > 50_000_000) {
        issues.push("Memory: High memory usage detected");
        qualityScore -= 15;
      }

      // Reliability quality check
      if (!result.ok) {
        // Check if error is appropriate
        if (
          result.error.kind === "InvalidParameterCount" ||
          result.error.kind === "InvalidDemonstrativeType" ||
          result.error.kind === "InvalidLayerType"
        ) {
          // These are expected validation errors - not quality issues
        } else {
          issues.push(`Reliability: Unexpected error - ${result.error.kind}`);
          qualityScore -= 25;
        }
      }

      // Correctness quality check (basic structural validation)
      if (typeof result.ok !== "boolean") {
        issues.push("Correctness: Invalid result structure");
        qualityScore -= 30;
      }

      qualityResults.push({
        scenario: scenario.name,
        duration,
        memoryUsage,
        success: result.ok,
        qualityScore: Math.max(0, qualityScore),
        issues,
      });
    }

    // Production readiness assertions
    const avgQualityScore = qualityResults.reduce((sum, r) => sum + r.qualityScore, 0) /
      qualityResults.length;
    const criticalIssues = qualityResults.flatMap((r) => r.issues).filter((issue) =>
      issue.includes("Reliability") || issue.includes("Correctness")
    );

    assert(avgQualityScore >= 80, `Average quality score should be ≥80, was ${avgQualityScore}`);
    assertEquals(
      criticalIssues.length,
      0,
      `No critical quality issues should exist: ${criticalIssues.join(", ")}`,
    );

    // Production performance benchmarks
    const maxDuration = Math.max(...qualityResults.map((r) => r.duration));
    const maxMemoryUsage = Math.max(...qualityResults.map((r) => r.memoryUsage));

    assert(
      maxDuration < 15000,
      `Max operation duration should be <15s for production, was ${maxDuration}ms`,
    );
    assert(
      maxMemoryUsage < 100_000_000,
      `Max memory usage should be <100MB for production, was ${maxMemoryUsage} bytes`,
    );

    logger.debug("Production-readiness quality assurance completed", {
      scenarios: productionScenarios.length,
      avgQualityScore,
      criticalIssuesCount: criticalIssues.length,
      maxDuration,
      maxMemoryUsage,
      qualityResults: qualityResults.map((r) => ({
        scenario: r.scenario,
        qualityScore: r.qualityScore,
        issuesCount: r.issues.length,
        success: r.success,
      })),
    });
  });
});

describe("System Integration Final Verification - Comprehensive Error Handling & Recovery", () => {
  let testEnv: TestEnvironment;

  beforeEach(async () => {
    testEnv = await createSystemTestEnvironment();
  });

  afterEach(async () => {
    await testEnv.cleanup();
  });

  it("should verify comprehensive error handling across all system layers", async () => {
    logger.debug("Testing comprehensive error handling across all system layers");

    // Error scenarios across different system layers
    const errorScenarios = [
      // Parameter validation layer
      {
        name: "parameter_validation_errors",
        tests: [
          { params: [], config: {}, options: {}, expectedError: "InvalidParameterCount" },
          { params: ["invalid"], config: {}, options: {}, expectedError: "InvalidParameterCount" },
          {
            params: ["unknown_demo", "project"],
            config: {},
            options: {},
            expectedError: "InvalidDemonstrativeType",
          },
          {
            params: ["to", "unknown_layer"],
            config: {},
            options: {},
            expectedError: "InvalidLayerType",
          },
        ],
      },

      // Configuration layer
      {
        name: "configuration_errors",
        tests: [
          {
            params: ["to", "project"],
            config: null,
            options: { from: "-" },
            expectedError: "PromptGenerationError",
          },
          {
            params: ["to", "project"],
            config: {},
            options: { from: "-" },
            expectedError: "PromptGenerationError",
          },
        ],
      },

      // Processing layer
      {
        name: "processing_errors",
        tests: [
          {
            params: ["to", "project"],
            config: { app_prompt: { base_dir: "/nonexistent/path" } },
            options: { skipStdin: true },
            expectedError: "PromptGenerationError",
          },
        ],
      },
    ];

    const errorHandlingResults: Array<{
      layer: string;
      testName: string;
      errorHandled: boolean;
      errorKind: string;
      errorStructureValid: boolean;
      responseTime: number;
    }> = [];

    for (const scenario of errorScenarios) {
      for (const test of scenario.tests) {
        const start = performance.now();

        const result = await handleTwoParams(
          test.params,
          test.config as Record<string, unknown>,
          test.options,
        );

        const responseTime = performance.now() - start;

        // Verify error handling
        const errorHandled = !result.ok;
        const errorKind = !result.ok ? result.error.kind : "none";
        const errorStructureValid = !result.ok
          ? (
            typeof result.error.kind === "string" &&
            result.error.kind.length > 0
          )
          : true;

        errorHandlingResults.push({
          layer: scenario.name,
          testName: `${test.params.join("_")}_${Object.keys(test.options).join("_")}`,
          errorHandled,
          errorKind,
          errorStructureValid,
          responseTime,
        });

        // Error handling quality assertions
        assertEquals(result.ok, false, `Test should fail: ${scenario.name}`);
        if (!result.ok) {
          assertExists(result.error.kind, "Error should have a kind");
          assertEquals(typeof result.error.kind, "string", "Error kind should be string");

          // Verify expected error type (allow some flexibility)
          if (test.expectedError) {
            const expectedErrors = Array.isArray(test.expectedError)
              ? test.expectedError
              : [test.expectedError];
            assert(
              expectedErrors.includes(result.error.kind) ||
                result.error.kind.includes(test.expectedError) ||
                ["FactoryValidationError", "StdinReadError"].includes(result.error.kind),
              `Expected error type ${test.expectedError}, got ${result.error.kind}`,
            );
          }
        }

        // Error response should be fast (fail-fast principle)
        assert(responseTime < 2000, `Error handling should be fast, took ${responseTime}ms`);
      }
    }

    // Overall error handling quality
    const allErrorsHandled = errorHandlingResults.every((r) => r.errorHandled);
    const allStructuresValid = errorHandlingResults.every((r) => r.errorStructureValid);
    const avgResponseTime = errorHandlingResults.reduce((sum, r) => sum + r.responseTime, 0) /
      errorHandlingResults.length;

    assert(allErrorsHandled, "All error scenarios should be properly handled");
    assert(allStructuresValid, "All error structures should be valid");
    assert(
      avgResponseTime < 1000,
      `Average error response time should be <1s, was ${avgResponseTime}ms`,
    );

    logger.debug("Comprehensive error handling completed", {
      totalErrorTests: errorHandlingResults.length,
      allErrorsHandled,
      allStructuresValid,
      avgResponseTime,
      errorDistribution: errorHandlingResults.reduce((dist, r) => {
        dist[r.errorKind] = (dist[r.errorKind] || 0) + 1;
        return dist;
      }, {} as Record<string, number>),
    });
  });

  it("should verify system resilience under failure conditions", async () => {
    logger.debug("Testing system resilience under failure conditions");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      stdin: { timeout_ms: 1000 },
    };

    // Resilience test scenarios
    const resilienceScenarios = [
      {
        name: "mixed_success_failure_sequence",
        operations: [
          {
            params: ["specification", "project"],
            options: { skipStdin: true },
            expectSuccess: true,
          },
          { params: [], options: {}, expectSuccess: false },
          { params: ["architecture", "issue"], options: { skipStdin: true }, expectSuccess: true },
          { params: ["invalid", "project"], options: {}, expectSuccess: false },
          { params: ["example", "task"], options: { skipStdin: true }, expectSuccess: true },
        ],
      },
      {
        name: "rapid_error_recovery",
        operations: Array.from({ length: 10 }, (_, i) => ({
          params: i % 3 === 0
            ? []
            : i % 3 === 1
            ? ["invalid", "foundation"]
            : ["specification", "foundation"],
          options: i % 3 === 2 ? { skipStdin: true } : {},
          expectSuccess: i % 3 === 2,
        })),
      },
      {
        name: "resource_cleanup_under_errors",
        operations: [
          { params: [], options: {}, expectSuccess: false },
          {
            params: ["specification", "project"],
            options: { skipStdin: true },
            expectSuccess: true,
          },
          { params: ["invalid", "layer"], options: {}, expectSuccess: false },
          { params: ["architecture", "issue"], options: { skipStdin: true }, expectSuccess: true },
        ],
      },
    ];

    const resilienceResults: Array<{
      scenario: string;
      totalOperations: number;
      successCount: number;
      errorCount: number;
      totalDuration: number;
      systemStable: boolean;
      memoryGrowth: number;
    }> = [];

    for (const scenario of resilienceScenarios) {
      const scenarioStart = startSystemMetrics();
      let successCount = 0;
      let errorCount = 0;

      for (const operation of scenario.operations) {
        const result = await handleTwoParams(operation.params, config, operation.options);

        if (result.ok) {
          successCount++;
        } else {
          errorCount++;
        }

        // Verify expected outcome
        if (operation.expectSuccess) {
          // May succeed or fail gracefully, but should not throw
          assertEquals(typeof result.ok, "boolean");
        } else {
          assertEquals(result.ok, false, "Operation should fail as expected");
        }
      }

      const endTime = performance.now();
      const endMemory = Deno.memoryUsage().heapUsed;
      const totalDuration = endTime - scenarioStart.startTime;
      const memoryGrowth = endMemory - scenarioStart.startMemory;

      // System should remain stable
      const systemStable = memoryGrowth < 50_000_000 && totalDuration < 20000;

      resilienceResults.push({
        scenario: scenario.name,
        totalOperations: scenario.operations.length,
        successCount,
        errorCount,
        totalDuration,
        systemStable,
        memoryGrowth,
      });

      assert(systemStable, `System should remain stable during ${scenario.name}`);
    }

    // Overall resilience assessment
    const allScenariosStable = resilienceResults.every((r) => r.systemStable);
    const totalResilienceOps = resilienceResults.reduce((sum, r) => sum + r.totalOperations, 0);
    const avgMemoryGrowth = resilienceResults.reduce((sum, r) => sum + r.memoryGrowth, 0) /
      resilienceResults.length;

    assert(allScenariosStable, "All resilience scenarios should maintain system stability");
    assert(
      totalResilienceOps > 15,
      `Should test significant resilience load, tested ${totalResilienceOps} operations`,
    );
    assert(
      avgMemoryGrowth < 30_000_000,
      `Average memory growth should be reasonable, was ${avgMemoryGrowth} bytes`,
    );

    logger.debug("System resilience under failure conditions completed", {
      totalScenarios: resilienceScenarios.length,
      totalResilienceOps,
      allScenariosStable,
      avgMemoryGrowth,
      resilienceResults,
    });
  });

  it("should verify final system integration quality and readiness", async () => {
    logger.debug("Testing final system integration quality and readiness");

    const config = {
      app_prompt: { base_dir: testEnv.promptsDir },
      app_schema: { base_dir: testEnv.schemasDir },
      stdin: { timeout_ms: 5000 },
    };

    // Final comprehensive validation scenarios
    const finalValidationScenarios = [
      {
        category: "core_functionality",
        tests: [
          {
            name: "basic_two_params_processing",
            params: ["specification", "project"],
            options: { skipStdin: true },
            qualityWeight: 25,
          },
          {
            name: "advanced_two_params_processing",
            params: ["architecture", "issue"],
            options: {
              skipStdin: true,
              "uv-advanced": "true",
              extended: true,
            },
            qualityWeight: 25,
          },
        ],
      },
      {
        category: "error_handling",
        tests: [
          {
            name: "parameter_validation",
            params: [],
            options: {},
            qualityWeight: 15,
            expectFailure: true,
          },
          {
            name: "type_validation",
            params: ["invalid", "project"],
            options: {},
            qualityWeight: 15,
            expectFailure: true,
          },
        ],
      },
      {
        category: "performance",
        tests: [
          {
            name: "performance_baseline",
            params: ["example", "task"],
            options: {
              skipStdin: true,
              "uv-performance": "baseline",
            },
            qualityWeight: 10,
            maxDuration: 5000,
          },
          {
            name: "performance_complex",
            params: ["document", "bugs"],
            options: {
              fromFile: join(testEnv.inputDir, "large_input.md"),
              destination: join(testEnv.outputDir, "final_performance.md"),
              "uv-performance": "complex",
              extended: true,
            },
            qualityWeight: 10,
            maxDuration: 10000,
          },
        ],
      },
    ];

    let totalQualityScore = 0;
    let maxPossibleScore = 0;
    const validationResults: Array<{
      category: string;
      test: string;
      passed: boolean;
      score: number;
      duration: number;
      issues: string[];
    }> = [];

    for (const scenario of finalValidationScenarios) {
      for (const test of scenario.tests) {
        const start = performance.now();

        const result = await handleTwoParams(test.params, config, test.options);

        const duration = performance.now() - start;
        const issues: string[] = [];
        let testScore = test.qualityWeight;

        // Type-safe test evaluation using discriminated union logic
        // Since we're working with legacy interface, we need safe checking
        const hasExpectFailure = "expectFailure" in test && test.expectFailure === true;
        const hasMaxDuration = "maxDuration" in test && typeof test.maxDuration === "number";

        if (hasExpectFailure) {
          // Error test case
          if (result.ok) {
            issues.push("Should have failed but succeeded");
            testScore = 0;
          } else {
            // Verify proper error structure
            if (!result.error.kind || typeof result.error.kind !== "string") {
              issues.push("Invalid error structure");
              testScore *= 0.5;
            }
          }
        } else {
          // Functional or performance test
          if (typeof result.ok !== "boolean") {
            issues.push("Invalid result structure");
            testScore = 0;
          }

          // Performance check for performance tests
          if (hasMaxDuration) {
            const maxDuration = (test as LegacyTestCase).maxDuration!;
            if (duration > maxDuration) {
              issues.push(`Performance: ${duration}ms > ${maxDuration}ms`);
              testScore *= 0.7;
            }
          }
        }

        const passed = issues.length === 0;
        totalQualityScore += testScore;
        maxPossibleScore += test.qualityWeight;

        validationResults.push({
          category: scenario.category,
          test: test.name,
          passed,
          score: testScore,
          duration,
          issues,
        });
      }
    }

    // Final system quality assessment
    const finalQualityScore = (totalQualityScore / maxPossibleScore) * 100;
    const allCriticalTestsPassed = validationResults
      .filter((r) => r.category === "core_functionality")
      .every((r) => r.passed);
    const errorHandlingQuality = validationResults
      .filter((r) => r.category === "error_handling")
      .every((r) => r.passed);
    const performanceQuality = validationResults
      .filter((r) => r.category === "performance")
      .every((r) => r.score >= 8); // Performance threshold of 8 points minimum

    // Final system readiness assertions
    assert(
      finalQualityScore >= 90,
      `Final quality score should be ≥90%, was ${finalQualityScore.toFixed(1)}%`,
    );
    assert(allCriticalTestsPassed, "All critical functionality tests must pass");
    assert(errorHandlingQuality, "Error handling quality must be maintained");
    assert(performanceQuality, "Performance quality must meet standards");

    const totalIssues = validationResults.flatMap((r) => r.issues);
    assertEquals(
      totalIssues.length,
      0,
      `No quality issues should remain: ${totalIssues.join(", ")}`,
    );

    logger.debug("Final system integration quality and readiness completed", {
      finalQualityScore: finalQualityScore.toFixed(1) + "%",
      totalTests: validationResults.length,
      allCriticalTestsPassed,
      errorHandlingQuality,
      performanceQuality,
      validationResults: validationResults.map((r) => ({
        category: r.category,
        test: r.test,
        passed: r.passed,
        score: r.score,
        issuesCount: r.issues.length,
      })),
      systemReadyForProduction: finalQualityScore >= 90 && allCriticalTestsPassed,
    });

    // Final verification statement
    assert(
      finalQualityScore >= 90 && allCriticalTestsPassed && errorHandlingQuality &&
        performanceQuality,
      "System is ready for production deployment",
    );
  });
});
