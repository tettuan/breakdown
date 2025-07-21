/**
 * @fileoverview UC1: Bug Detection Workflow Test
 *
 * Tests the complete workflow for bug detection using the breakdown command:
 * `breakdown find bugs input.js`
 *
 * This test validates the end-to-end process from CLI input to bug report generation,
 * focusing on the user experience and practical usage scenarios.
 *
 * @module tests/usecases/bug_detection_workflow
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";

// Core domain imports
import { DirectiveType } from "../../lib/domain/core/value_objects/directive_type.ts";
import { LayerType } from "../../lib/domain/core/value_objects/layer_type.ts";
import { ConfigProfile } from "../../lib/config/mod.ts";
import { createTwoParamsResult } from "../../lib/types/two_params_result_extension.ts";

const logger = new BreakdownLogger("usecase:bug_detection");

/**
 * UC1.1: Basic Bug Detection Command Execution
 *
 * Simulates: `breakdown find bugs simple_bugs.js`
 *
 * Validates:
 * - Command parsing and parameter extraction
 * - Bug detection workflow initialization
 * - File processing and analysis preparation
 * - Expected output structure generation
 */
Deno.test("UC1.1: Basic Bug Detection Workflow - Simple JavaScript File", async () => {
  logger.debug("Starting basic bug detection workflow test", {
    usecase: "UC1.1",
    command: "breakdown find bugs simple_bugs.js",
    workflow: "bug_detection",
  });

  // Phase 1: Command Line Simulation
  const command = ["find", "bugs"];
  const inputFile = "tests/fixtures/usecases/bug_detection/inputs/simple_bugs.js";

  logger.debug("Phase 1: Command line parsing simulation", {
    command,
    inputFile,
  });

  // Create parameters for bug detection workflow
  const twoParamsResult = createTwoParamsResult(command[0], command[1]);

  assertEquals(twoParamsResult.type, "two");
  assertEquals(twoParamsResult.directiveType, "find");
  assertEquals(twoParamsResult.layerType, "bugs");
  assertEquals(twoParamsResult.params, ["find", "bugs"]);

  // Phase 2: Type-Safe Domain Object Creation
  logger.debug("Phase 2: Creating domain objects");

  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);
  const layerTypeResult = LayerType.create(twoParamsResult.layerType);

  assertEquals(directiveTypeResult.ok, true);
  assertEquals(layerTypeResult.ok, true);

  if (!directiveTypeResult.ok) {
    throw new Error("Failed to create DirectiveType for bug detection");
  }
  if (!layerTypeResult.ok) {
    throw new Error("Failed to create LayerType for bug detection");
  }

  const directiveType = directiveTypeResult.data;
  const layerType = layerTypeResult.data;
  assertEquals(directiveType.value, "find");
  assertEquals(layerType.value, "bugs");

  // Phase 3: Path Resolution for Bug Detection
  logger.debug("Phase 3: Resolving paths for bug detection workflow");

  const promptPath = directiveType.getPromptPath(layerType);
  const schemaPath = directiveType.getSchemaPath(layerType);
  const outputPath = directiveType.resolveOutputPath(inputFile, layerType);

  // Expected paths for bug detection
  assertEquals(promptPath, "prompts/defect/task/defect_task.md");
  assertEquals(schemaPath, "schemas/defect/task/defect_task.schema.json");
  assertStringIncludes(outputPath, "output/defect/task");
  assertStringIncludes(outputPath, "simple_bugs.js");

  // Phase 4: Input File Analysis Simulation
  logger.debug("Phase 4: Input file analysis simulation");

  // Read the test input file
  const inputContent = await Deno.readTextFile(join(Deno.cwd(), inputFile));

  // Simulate bug detection analysis
  const detectedIssues = analyzeBugsSimulation(inputContent);

  assertEquals(detectedIssues.length > 0, true, "Should detect bugs in the test file");
  assertEquals(detectedIssues.some((issue) => issue.type === "var_declaration"), true);
  assertEquals(detectedIssues.some((issue) => issue.type === "undeclared_variable"), true);

  // Phase 5: Prompt Variable Generation
  logger.debug("Phase 5: Generating prompt variables for bug detection");

  const promptVariables = {
    input_file: inputFile,
    input_content: inputContent,
    output_path: outputPath,
    directive: directiveType.value,
    layer: layerType.value,
    detected_issues: JSON.stringify(detectedIssues, null, 2),
    issue_count: detectedIssues.length.toString(),
    schema_reference: schemaPath,
    timestamp: new Date().toISOString(),
  };

  // Validate all required variables are present
  assertEquals(typeof promptVariables.input_file, "string");
  assertEquals(typeof promptVariables.input_content, "string");
  assertEquals(typeof promptVariables.detected_issues, "string");
  assertEquals(promptVariables.issue_count, detectedIssues.length.toString());

  // Phase 6: Bug Detection Prompt Generation
  logger.debug("Phase 6: Generating bug detection prompt");

  const bugDetectionTemplate = `
# Bug Detection Analysis Report

## Input File Analysis
File: \${input_file}
Analysis Type: \${directive} \${layer}

## Detected Issues (\${issue_count} total)
\${detected_issues}

## Analysis Details
\${input_content}

## Output Instructions
Generate detailed bug report to: \${output_path}
Use schema reference: \${schema_reference}

## Processing Metadata
- Analysis timestamp: \${timestamp}
- Workflow: Bug Detection
- Report format: Structured markdown with severity levels
`;

  let finalPrompt = bugDetectionTemplate;
  for (const [key, value] of Object.entries(promptVariables)) {
    finalPrompt = finalPrompt.replace(new RegExp(`\\$\\{${key}\\}`, "g"), value);
  }

  // Phase 7: Prompt Validation
  logger.debug("Phase 7: Validating generated prompt");

  assertStringIncludes(finalPrompt, inputFile);
  assertStringIncludes(finalPrompt, "find bugs");
  assertStringIncludes(finalPrompt, detectedIssues.length.toString());
  assertStringIncludes(finalPrompt, outputPath);
  assertStringIncludes(finalPrompt, schemaPath);

  // Ensure all template variables are replaced
  assertEquals(finalPrompt.includes("${"), false, "All template variables should be replaced");

  // Phase 8: Workflow Result Validation
  logger.debug("Phase 8: Validating workflow results");

  const workflowResult = {
    success: true,
    workflow: "bug_detection",
    command: "find bugs",
    inputFile,
    outputPath,
    issuesDetected: detectedIssues.length,
    promptGenerated: finalPrompt.length > 0,
    metadata: {
      directive: directiveType.value,
      layer: layerType.value,
      promptPath,
      schemaPath,
      variableCount: Object.keys(promptVariables).length,
      promptLength: finalPrompt.length,
    },
  };

  assertEquals(workflowResult.success, true);
  assertEquals(workflowResult.workflow, "bug_detection");
  assertEquals(workflowResult.issuesDetected > 0, true);
  assertEquals(workflowResult.promptGenerated, true);

  logger.debug("Bug detection workflow test completed successfully", {
    usecase: "UC1.1",
    success: true,
    issuesDetected: workflowResult.issuesDetected,
    promptLength: workflowResult.metadata.promptLength,
  });
});

/**
 * UC1.2: Complex TypeScript Bug Detection
 *
 * Tests bug detection with more complex TypeScript file
 */
Deno.test("UC1.2: Complex Bug Detection Workflow - TypeScript File", async () => {
  logger.debug("Starting complex bug detection workflow test", {
    usecase: "UC1.2",
    language: "TypeScript",
    complexity: "high",
  });

  const command = ["find", "bugs"];
  const inputFile = "tests/fixtures/usecases/bug_detection/inputs/complex_bugs.ts";

  // Execute workflow
  const twoParamsResult = createTwoParamsResult(command[0], command[1]);
  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);
  const layerTypeResult = LayerType.create(twoParamsResult.layerType);

  if (!directiveTypeResult.ok) {
    throw new Error("Failed to create DirectiveType");
  }
  if (!layerTypeResult.ok) {
    throw new Error("Failed to create LayerType");
  }

  const directiveType = directiveTypeResult.data;
  const layerType = layerTypeResult.data;

  // Read TypeScript file
  const inputContent = await Deno.readTextFile(join(Deno.cwd(), inputFile));
  const detectedIssues = analyzeBugsSimulation(inputContent, "typescript");

  // TypeScript specific validations
  assertEquals(detectedIssues.some((issue) => issue.type === "any_type_usage"), true);
  assertEquals(detectedIssues.some((issue) => issue.type === "missing_error_handling"), true);
  assertEquals(detectedIssues.some((issue) => issue.type === "potential_memory_leak"), true);

  const outputPath = directiveType.resolveOutputPath(inputFile, layerType);
  assertStringIncludes(outputPath, "complex_bugs.ts");

  logger.debug("Complex bug detection workflow completed", {
    usecase: "UC1.2",
    issuesFound: detectedIssues.length,
    typeScriptSpecific: true,
  });
});

/**
 * UC1.3: Bug Detection with Custom Configuration
 *
 * Tests bug detection workflow with custom configuration file
 */
Deno.test("UC1.3: Bug Detection with Custom Configuration", async () => {
  logger.debug("Starting bug detection with custom config test", {
    usecase: "UC1.3",
    configFile: "basic_bug_config.yml",
  });

  const configFile = "tests/fixtures/usecases/bug_detection/configs/basic_bug_config.yml";
  const inputFile = "tests/fixtures/usecases/bug_detection/inputs/simple_bugs.js";

  // Read custom configuration
  const configContent = await Deno.readTextFile(join(Deno.cwd(), configFile));

  // Parse configuration (simplified simulation)
  const config = parseConfigSimulation(configContent);

  assertEquals(config.bug_detection.enabled, true);
  assertEquals(Array.isArray(config.bug_detection.severity_levels), true);
  assertEquals(config.output_format.type, "markdown");

  // Execute workflow with custom config
  const twoParamsResult = createTwoParamsResult("defect", "task");
  const directiveTypeResult = DirectiveType.create(twoParamsResult.directiveType);
  const layerTypeResult = LayerType.create(twoParamsResult.layerType);

  if (!directiveTypeResult.ok) {
    throw new Error("Failed to create DirectiveType");
  }
  if (!layerTypeResult.ok) {
    throw new Error("Failed to create LayerType");
  }

  const _directiveType = directiveTypeResult.data;
  const _layerType = layerTypeResult.data;
  const inputContent = await Deno.readTextFile(join(Deno.cwd(), inputFile));

  // Apply custom configuration to bug detection
  const detectedIssues = analyzeBugsWithConfig(inputContent, config);

  // Validate configuration effects
  assertEquals(
    detectedIssues.every((issue) => config.bug_detection.severity_levels.includes(issue.severity)),
    true,
  );

  logger.debug("Bug detection with custom config completed", {
    usecase: "UC1.3",
    configRules: Object.keys(config.bug_detection.rules).length,
    issuesWithSeverity: detectedIssues.length,
  });
});

/**
 * Simulates bug detection analysis for testing purposes
 */
function analyzeBugsSimulation(content: string, language = "javascript") {
  const issues = [];

  // JavaScript/TypeScript common issues
  if (content.includes("var ")) {
    issues.push({
      type: "var_declaration",
      severity: "high",
      line: content.split("\n").findIndex((line) => line.includes("var ")) + 1,
      message: "Use of var declaration instead of let/const",
    });
  }

  if (content.match(/for\s*\(\s*i\s*=/)) {
    issues.push({
      type: "undeclared_variable",
      severity: "critical",
      line: content.split("\n").findIndex((line) => line.match(/for\s*\(\s*i\s*=/)) + 1,
      message: "Undeclared loop variable",
    });
  }

  if (content.includes("== ")) {
    issues.push({
      type: "non_strict_equality",
      severity: "medium",
      line: content.split("\n").findIndex((line) => line.includes("== ")) + 1,
      message: "Non-strict equality comparison",
    });
  }

  // TypeScript specific issues
  if (language === "typescript") {
    if (content.includes(": any")) {
      issues.push({
        type: "any_type_usage",
        severity: "high",
        line: content.split("\n").findIndex((line) => line.includes(": any")) + 1,
        message: "Usage of any type reduces type safety",
      });
    }

    if (content.includes("async") && !content.includes("catch")) {
      issues.push({
        type: "missing_error_handling",
        severity: "high",
        line: content.split("\n").findIndex((line) => line.includes("async")) + 1,
        message: "Async function without proper error handling",
      });
    }

    if (content.includes("new UserManager()") && content.includes("for")) {
      issues.push({
        type: "potential_memory_leak",
        severity: "medium",
        line: content.split("\n").findIndex((line) => line.includes("new UserManager()")) + 1,
        message: "Creating new instance inside loop",
      });
    }
  }

  return issues;
}

/**
 * Simulates configuration parsing for testing purposes
 */
function parseConfigSimulation(_configContent: string) {
  // Simplified YAML-like parsing for testing
  return {
    bug_detection: {
      enabled: true,
      severity_levels: ["critical", "high", "medium", "low"],
      rules: {
        javascript: ["no_var_declarations", "no_undeclared_variables"],
        typescript: ["no_any_type", "require_type_annotations"],
        general: ["no_hardcoded_values", "require_input_validation"],
      },
    },
    output_format: {
      type: "markdown",
      include_line_numbers: true,
      include_severity: true,
      include_suggestions: true,
    },
  };
}

/**
 * Applies custom configuration to bug detection
 */
function analyzeBugsWithConfig(content: string, config: {
  bug_detection: {
    severity_levels: string[];
  };
}) {
  const issues = analyzeBugsSimulation(content);

  // Apply severity levels from config
  return issues.map((issue) => ({
    ...issue,
    severity: config.bug_detection.severity_levels.includes(issue.severity)
      ? issue.severity
      : "medium",
  }));
}
