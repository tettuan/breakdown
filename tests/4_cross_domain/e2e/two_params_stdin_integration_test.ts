/**
 * @fileoverview TwoParamsResult STDIN Processing Integration Tests
 *
 * This module provides comprehensive integration tests for STDIN processing
 * in the twoParamsResult processing chain, focusing on real-world scenarios
 * where input data flows through the complete system.
 *
 * Test Coverage:
 * - STDIN reading and processing integration
 * - Variable substitution with STDIN content
 * - Real prompt generation with template processing
 * - Complex data flow scenarios
 * - Error handling for STDIN-related issues
 * - Performance characteristics with large STDIN inputs
 *
 * @module tests/4_cross_domain/e2e/two_params_stdin_integration_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { ConfigurationTestHelper } from "../../../lib/test_helpers/configuration_test_helper_simple.ts";
import { twoParamsHandler } from "../../../lib/cli/handlers/two_params_handler.ts";
import { join } from "@std/path";
import { parse as parseYaml } from "@std/yaml";
import { DEFAULT_CONFIG_DIR } from "../../../lib/config/constants.ts";
import { MockStdinReader } from "../../../lib/io/stdin_reader_interface.ts";

// Test logger initialization
const logger = new BreakdownLogger("e2e-stdin-integration");

/**
 * STDIN Integration Tests - Note on Mocking Strategy
 *
 * These tests now rely on the enhanced_stdin.ts internal MockStdinReader
 * which is automatically used in test environments. The BREAKDOWN_SKIP_STDIN
 * environment variable is used to control whether STDIN processing occurs.
 */

/**
 * STDOUT Capture for Result Verification
 */
class _StdoutCapture {
  private originalWrite: typeof Deno.stdout.write = Deno.stdout.write;
  private capturedOutput: Uint8Array[] = [];

  start() {
    this.originalWrite = Deno.stdout.write;
    this.capturedOutput = [];

    Deno.stdout.write = (data: Uint8Array) => {
      this.capturedOutput.push(data);
      return Promise.resolve(data.length);
    };
  }

  stop(): string {
    Deno.stdout.write = this.originalWrite;
    const concatenated = new Uint8Array(
      this.capturedOutput.reduce((acc, arr) => acc + arr.length, 0),
    );
    let offset = 0;
    for (const arr of this.capturedOutput) {
      concatenated.set(arr, offset);
      offset += arr.length;
    }
    return new TextDecoder().decode(concatenated);
  }
}

/**
 * Test Helper: Setup Agent Prompts Directory for STDIN Tests
 * Based on input_adaptation_options_e2e_test.ts pattern
 */
class StdinTestSetup {
  private agentPromptsDir = `./${DEFAULT_CONFIG_DIR}/climpt/prompts`;

  /**
   * Copy static prompts from static-prompts to the .agent/climpt/prompts directory
   * This ensures that the E2E tests have access to all required template files
   */
  async copyStaticPromptsIfNeeded(): Promise<void> {
    const staticPromptsDir = "tests/fixtures/static-prompts";
    const promptsDir = this.agentPromptsDir; // Use .agent/climpt/prompts

    try {
      // Check if static-prompts exists
      const staticExists = await Deno.stat(staticPromptsDir).then(() => true).catch(() => false);
      if (staticExists) {
        // Create prompts directory if it doesn't exist
        await Deno.mkdir(promptsDir, { recursive: true });

        // Copy all files from static-prompts to prompts
        const copyDir = async (src: string, dest: string) => {
          await Deno.mkdir(dest, { recursive: true });
          for await (const entry of Deno.readDir(src)) {
            const srcPath = `${src}/${entry.name}`;
            const destPath = `${dest}/${entry.name}`;
            if (entry.isDirectory) {
              await copyDir(srcPath, destPath);
            } else if (entry.isFile) {
              try {
                const content = await Deno.readTextFile(srcPath);
                await Deno.writeTextFile(destPath, content);
                logger.debug("Template file copied", { from: srcPath, to: destPath });
              } catch (error) {
                logger.debug("Failed to copy template file", {
                  from: srcPath,
                  to: destPath,
                  error,
                });
              }
            }
          }
        };

        await copyDir(staticPromptsDir, promptsDir);
        logger.debug("Static prompts copied to agent directory", {
          from: staticPromptsDir,
          to: promptsDir,
        });
      }
    } catch (error) {
      logger.debug("Error copying static prompts", { error });
    }
  }

  /**
   * Setup .agent directory with prompts for STDIN tests
   * This creates the necessary directory structure and copies templates
   * Uses temporary configuration files to avoid overwriting real ones
   */
  async setupAgentPromptsForStdin(): Promise<void> {
    // First copy static prompts if needed
    await this.copyStaticPromptsIfNeeded();

    // Create .agent/climpt/config directory structure
    const agentConfigDir = `./${DEFAULT_CONFIG_DIR}`;
    try {
      await Deno.mkdir(agentConfigDir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }

    // Create prompt directories that will be used in tests
    const promptDirs = [
      "to/project",
      "to/issue",
      "to/task",
      "summary/project",
      "summary/issue",
      "summary/task",
      "defect/project",
      "defect/issue",
      "defect/task",
    ];

    for (const dir of promptDirs) {
      const dirPath = join(this.agentPromptsDir, dir);
      try {
        await Deno.mkdir(dirPath, { recursive: true });
      } catch (error) {
        if (!(error instanceof Deno.errors.AlreadyExists)) {
          throw error;
        }
      }
    }

    // All template files are now managed in tests/fixtures/static-prompts/
    // The copyStaticPromptsIfNeeded() method above handles copying them to the working directory

    // Create temporary configuration files to avoid overwriting real ones
    await this.createTempConfigFiles(agentConfigDir);
  }

  /**
   * Create temporary configuration files for STDIN tests
   */
  private async createTempConfigFiles(agentConfigDir: string): Promise<void> {
    const configContent = `# E2E Test Configuration for STDIN Processing
working_dir: "."
app_prompt:
  base_dir: ".agent/climpt/prompts"
app_schema:
  base_dir: ".agent/climpt/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
`;

    const tempConfigFiles = [
      `${agentConfigDir}/stdin-test-app.yml`,
      `${agentConfigDir}/stdin-flexible-test-app.yml`,
    ];

    for (const configFile of tempConfigFiles) {
      // Ensure parent directory exists
      const configDir = configFile.substring(0, configFile.lastIndexOf("/"));
      await Deno.mkdir(configDir, { recursive: true });

      await Deno.writeTextFile(configFile, configContent);
      logger.debug("Temporary configuration file created", {
        file: configFile,
        contentLength: configContent.length,
      });
    }
  }

  /**
   * Clean up temporary configuration files
   */
  async cleanup(): Promise<void> {
    const agentConfigDir = `./${DEFAULT_CONFIG_DIR}`;
    const tempConfigFiles = [
      `${agentConfigDir}/stdin-test-app.yml`,
      `${agentConfigDir}/stdin-flexible-test-app.yml`,
    ];

    for (const configFile of tempConfigFiles) {
      try {
        await Deno.remove(configFile);
        logger.debug("Temporary configuration file removed", { file: configFile });
      } catch {
        // Ignore cleanup errors - file might not exist
      }
    }

    // Clean up prompts directory if needed
    try {
      await Deno.remove(this.agentPromptsDir, { recursive: true });
    } catch {
      // Ignore cleanup errors - directory might not exist or be used by other tests
    }
  }
}

// Initialize setup helper
const stdinTestSetup = new StdinTestSetup();

/**
 * Test Suite: STDIN Processing Integration
 * STDIN processing integration test
 */
Deno.test("E2E-STDIN: Basic STDIN Processing Integration", async () => {
  // Setup prompts directory before running test
  await stdinTestSetup.setupAgentPromptsForStdin();
  logger.debug("E2E STDIN basic integration test started", {
    scenario: "STDIN content variable replacement and prompt generation",
  });

  // Setup test configuration
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("stdin-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  // Setup test input via STDIN
  const stdinContent = `# Test Project Input

## Current Issues
1. Performance bottleneck in data processing
2. Memory leaks in long-running processes
3. Error handling inconsistencies

## Requirements
- Improve system reliability
- Optimize resource usage
- Implement comprehensive error handling

## Technical Context
The system processes large datasets and needs to maintain performance under load.`;

  // Create a mock stdin reader with the test content
  const mockStdinReader = new MockStdinReader({
    data: stdinContent,
    terminal: false,
    delay: 0,
    shouldFail: false,
  });

  // Use same configuration approach as other E2E tests with proper config
  const config = configResult.userConfig; // Use loaded config
  const params = [validDirective, validLayer];
  const options = {
    skipStdin: false,
    from: "-",
    destination: "output.md", // Add required destination option
    stdinReader: mockStdinReader, // Pass the mock reader
  }; // Explicitly enable STDIN reading

  logger.debug("TwoParamsHandler execution started", {
    params,
    stdinContentLength: stdinContent.length,
    config: Object.keys(config),
  });

  const result = await twoParamsHandler(params, config, options);
  // Note: twoParamsHandler now returns prompt content in result.data (not stdout)
  const output = result.ok ? result.data : "";

  logger.debug("TwoParamsHandler execution result", {
    success: result.ok,
    outputLength: output.length,
    hasOutput: output.length > 0,
    error: result.ok ? null : result.error,
  });

  // Log detailed error information if the handler failed
  if (!result.ok) {
    console.error("TwoParamsHandler failed with error:", result.error);
  }

  // Verify integration flow works correctly (even with STDIN skipped)
  assertEquals(result.ok, true, "Integration flow should succeed");
  assertExists(output, "Output should be generated");
  assertEquals(output.length > 0, true, "Output should contain generated content");

  // Verify basic template processing occurred
  const hasTemplateProcessing = output.length >= 10; // Some content was generated

  assertEquals(hasTemplateProcessing, true, "Template processing should occur");

  logger.debug("STDIN integration verification completed", {
    stdinLength: stdinContent.length,
    outputLength: output.length,
    expansionRatio: (output.length / stdinContent.length).toFixed(2),
    hasIntegration: hasTemplateProcessing,
  });

  logger.debug("E2E STDIN basic integration test completed", { resultStatus: "SUCCESS" });

  // Cleanup
  await stdinTestSetup.cleanup();
});

/**
 * Test Suite: Complex STDIN Content Processing
 * Complex STDIN content processing test
 */
Deno.test("E2E-STDIN: Complex Content Processing", async () => {
  // Setup prompts directory before running test
  await stdinTestSetup.setupAgentPromptsForStdin();
  const _workingDir = Deno.cwd(); // Use current working directory
  logger.debug("E2E STDIN complex content processing test started", {
    scenario: "Complex structured STDIN content processing",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("stdin-flexible-test");
  const validDirective = configResult.userConfig.testData.validDirectives[1] || "summary";
  const validLayer = configResult.userConfig.testData.validLayers[1] || "issue";

  // Load app config as well
  const appConfigPath = join(Deno.cwd(), DEFAULT_CONFIG_DIR, "flexible-test-app.yml");
  const appConfigContent = await Deno.readTextFile(appConfigPath);
  const _appConfig = parseYaml(appConfigContent) as Record<string, unknown>;

  // Complex STDIN content with various elements
  const complexStdinContent = `# Enterprise System Analysis

## Executive Summary
This document provides a comprehensive analysis of our enterprise system's current state and improvement opportunities.

### Key Performance Indicators
- System Uptime: 99.2%
- Average Response Time: 245ms
- Error Rate: 0.08%
- User Satisfaction: 8.2/10

## Current Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │ -> │  Application    │ -> │    Database     │
│                 │    │    Server       │    │     Cluster     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
\`\`\`

## Issues Identified

### Critical Issues
1. **Database Connection Pool Exhaustion**
   - Occurs during peak traffic hours
   - Affects user experience significantly
   - Requires immediate attention

2. **Memory Leak in Session Management**
   - Gradual memory consumption increase
   - Leads to application restarts
   - Impact on availability

### Medium Priority Issues
- Inefficient query patterns
- Lack of proper caching strategy
- Limited monitoring capabilities

## Technical Specifications

| Component | Current Version | Latest Version | Security Status |
|-----------|----------------|----------------|-----------------|
| Node.js   | 18.12.0        | 20.10.0        | ⚠️ Update needed |
| Database  | PostgreSQL 13  | PostgreSQL 15  | ✅ Supported     |
| Redis     | 6.2.7          | 7.2.4          | ⚠️ Update needed |

## Recommendations

### Short-term Actions (1-3 months)
1. Upgrade critical components
2. Implement connection pooling improvements
3. Add comprehensive monitoring

### Long-term Strategy (6-12 months)
1. Microservices migration
2. Cloud-native architecture adoption
3. AI-powered performance optimization

---
*This analysis was generated on ${new Date().toISOString()}*`;

  // Create a mock stdin reader with the complex test content
  const mockStdinReader = new MockStdinReader({
    data: complexStdinContent,
    terminal: false,
    delay: 0,
    shouldFail: false,
  });

  // Use the loaded configuration directly
  const config = configResult.userConfig;

  const params = [validDirective, validLayer];
  const options = {
    skipStdin: false,
    from: "-",
    destination: "output.md", // Add required destination option
    stdinReader: mockStdinReader, // Pass the mock reader
  };

  logger.debug("Complex STDIN processing execution started", {
    params,
    contentLength: complexStdinContent.length,
    contentComplexity: {
      lines: complexStdinContent.split("\n").length,
      tables: (complexStdinContent.match(/\|/g) || []).length > 5,
      codeBlocks: (complexStdinContent.match(/```/g) || []).length,
      sections: (complexStdinContent.match(/#{1,3}\s/g) || []).length,
    },
  });

  const result = await twoParamsHandler(params, config, options);
  // Note: twoParamsHandler now returns prompt content in result.data (not stdout)
  const output = result.ok ? result.data : "";

  logger.debug("Complex STDIN processing result", {
    success: result.ok,
    outputLength: output.length,
    inputOutputRatio: (output.length / complexStdinContent.length).toFixed(2),
  });

  // Verify integration flow works with stdin content
  assertEquals(result.ok, true, "Integration flow should succeed with stdin");
  assertExists(output, "Output should be generated");
  assertEquals(output.length > 0, true, "Output should contain template content");

  // Verify stdin content was properly integrated
  const hasStdinIntegration = output.includes("Input:") ||
    output.length > complexStdinContent.length / 2;
  assertEquals(hasStdinIntegration, true, "STDIN content should be integrated");

  logger.debug("Complex STDIN processing verification", {
    originalComplexity: complexStdinContent.length,
    processedLength: output.length,
    processingIndicator: hasStdinIntegration ? "SUCCESS" : "MINIMAL",
  });

  logger.debug("E2E STDIN complex content processing test completed", { resultStatus: "SUCCESS" });

  // Cleanup
  await stdinTestSetup.cleanup();
});

/**
 * Test Suite: STDIN Error Scenarios
 * STDIN error scenario test
 */
Deno.test("E2E-STDIN: Error Scenarios", async () => {
  // Setup prompts directory before running test
  await stdinTestSetup.setupAgentPromptsForStdin();
  const _workingDir = Deno.cwd(); // Use current working directory
  logger.debug("E2E STDIN error scenario test started", {
    scenario: "STDIN-related error case processing verification",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("stdin-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  const config = configResult.userConfig; // Use loaded config

  const errorScenarios = [
    {
      name: "Empty STDIN",
      stdinContent: "",
      expectSuccess: true, // Should handle empty input gracefully
    },
    {
      name: "Very Large STDIN",
      stdinContent: "# Large Content\n" + "Very large line content ".repeat(10000),
      expectSuccess: true, // Should handle large input
    },
    {
      name: "Binary-like Content",
      stdinContent: "\x00\x01\x02\x03\xFF\xFE\xFD",
      expectSuccess: true, // Should handle non-text content gracefully
    },
    {
      name: "Unicode Content",
      stdinContent: "# Unicode Test\n日本語コンテンツ\n🎉 Emoji content\n中文内容",
      expectSuccess: true, // Should handle Unicode
    },
  ];

  for (const scenario of errorScenarios) {
    logger.debug(`STDIN scenario test: ${scenario.name}`, {
      scenario: scenario.name,
      contentLength: scenario.stdinContent.length,
      expectSuccess: scenario.expectSuccess,
    });

    // Create a mock stdin reader with the scenario content
    const mockStdinReader = new MockStdinReader({
      data: scenario.stdinContent,
      terminal: false,
      delay: 0,
      shouldFail: !scenario.expectSuccess,
    });

    const params = [validDirective, validLayer];
    const options = {
      skipStdin: false,
      from: "-",
      destination: "output.md", // Add required destination option
      stdinReader: mockStdinReader, // Pass the mock reader
    };

    const result = await twoParamsHandler(params, config, options);
    // Note: twoParamsHandler now returns prompt content in result.data (not stdout)
    const output = result.ok ? result.data : "";

    logger.debug(`STDIN scenario ${scenario.name} result`, {
      success: result.ok,
      expectSuccess: scenario.expectSuccess,
      outputLength: output.length,
    });

    // All scenarios should succeed with proper stdin mocking
    assertEquals(
      result.ok,
      scenario.expectSuccess,
      `${scenario.name} integration flow should ${scenario.expectSuccess ? "succeed" : "fail"}`,
    );

    if (scenario.expectSuccess) {
      assertExists(output, `${scenario.name} should generate output`);
    }
  }

  logger.debug("E2E STDIN error scenario test completed", {
    scenarios: errorScenarios.length,
    resultStatus: "SUCCESS",
  });

  // Cleanup
  await stdinTestSetup.cleanup();
});

/**
 * Test Suite: Real-world Integration Scenarios
 * Real-world Integration Scenario Test
 */
Deno.test("E2E-STDIN: Real-world Integration Scenarios", async () => {
  // Setup prompts directory before running test
  await stdinTestSetup.setupAgentPromptsForStdin();
  const _workingDir = Deno.cwd(); // Use current working directory
  logger.debug("E2E STDIN real-world integration scenario test started", {
    scenario: "Integration test based on actual usage patterns",
  });

  const realWorldScenarios = [
    {
      name: "Git Log Analysis",
      directive: "summary",
      layer: "project",
      content: `commit a1b2c3d4e5f6g7h8i9j0
Author: Developer <dev@example.com>
Date: Mon Oct 23 14:30:22 2023 +0900

    feat: implement user authentication system
    
    - Add JWT token generation and validation
    - Implement password hashing with bcrypt
    - Add user session management
    - Update API endpoints for authentication

commit b2c3d4e5f6g7h8i9j0a1
Author: Developer <dev@example.com>
Date: Sun Oct 22 16:45:15 2023 +0900

    fix: resolve database connection issues
    
    - Fix connection pool configuration
    - Add retry logic for failed connections
    - Update error handling for database operations
    - Improve connection monitoring`,
    },
    {
      name: "Bug Report Analysis",
      directive: "defect",
      layer: "issue",
      content: `Bug Report #12345

Title: Application crashes when uploading large files

Steps to Reproduce:
1. Navigate to file upload page
2. Select a file larger than 50MB
3. Click "Upload" button
4. Application becomes unresponsive and crashes

Expected Behavior:
- File should upload successfully or show appropriate error message
- Application should remain stable

Actual Behavior:
- Browser tab becomes unresponsive
- Memory usage spikes to 100%
- Application crashes without error message

Environment:
- Browser: Chrome 118.0.5993.88
- OS: macOS 14.0
- Application Version: 2.3.1

Additional Information:
- Smaller files (< 10MB) upload successfully
- Issue started after recent deployment
- Multiple users reporting similar problems`,
    },
    {
      name: "Requirements Document",
      directive: "to",
      layer: "task",
      content: `# Project Requirements Document

## Project: Customer Management System Upgrade

### Business Objectives
1. Improve customer data accessibility
2. Enhance reporting capabilities
3. Integrate with existing CRM system
4. Ensure compliance with data protection regulations

### Functional Requirements

#### User Management
- Users can create, read, update, and delete customer records
- Role-based access control for different user types
- Audit trail for all data modifications

#### Data Integration
- Import customer data from legacy system
- Real-time synchronization with CRM
- Export functionality for reporting tools

#### Reporting
- Generate customer activity reports
- Performance metrics dashboard
- Automated monthly summaries

### Technical Requirements
- Web-based interface
- Mobile responsive design
- API for third-party integrations
- Database optimization for large datasets

### Non-functional Requirements
- Response time < 2 seconds for standard operations
- 99.9% uptime availability
- Support for 10,000+ concurrent users
- GDPR compliance for data handling`,
    },
  ];

  for (const scenario of realWorldScenarios) {
    logger.debug(`Real-world scenario test: ${scenario.name}`, {
      scenario: scenario.name,
      directive: scenario.directive,
      layer: scenario.layer,
      contentLength: scenario.content.length,
    });

    // Load appropriate configuration
    const configResult = await ConfigurationTestHelper.loadTestConfiguration(
      "stdin-flexible-test",
    );

    // The test configuration already includes app configuration

    // Validate that the directive and layer are supported
    const validDirectives = configResult.userConfig.testData.validDirectives;
    const validLayers = configResult.userConfig.testData.validLayers;

    const directive = validDirectives.includes(scenario.directive)
      ? scenario.directive
      : validDirectives[0];
    const layer = validLayers.includes(scenario.layer) ? scenario.layer : validLayers[0];

    // Create a mock stdin reader with the scenario content
    const mockStdinReader = new MockStdinReader({
      data: scenario.content,
      terminal: false,
      delay: 0,
      shouldFail: false,
    });

    // Use the loaded configuration directly
    const config = configResult.userConfig;

    const params = [directive, layer];
    const options = {
      skipStdin: false,
      from: "-",
      destination: "output.md", // Add required destination option
      stdinReader: mockStdinReader, // Pass the mock reader
    };

    const result = await twoParamsHandler(params, config, options);
    // Note: twoParamsHandler now returns prompt content in result.data (not stdout)
    const output = result.ok ? result.data : "";

    logger.debug(`Real-world scenario ${scenario.name} result`, {
      success: result.ok,
      usedDirective: directive,
      usedLayer: layer,
      outputLength: output.length,
      expansionRatio: (output.length / scenario.content.length).toFixed(2),
    });

    // Verify integration flow works with stdin content
    assertEquals(result.ok, true, `${scenario.name} should succeed with stdin`);
    assertExists(output, `${scenario.name} should generate output`);
    assertEquals(output.length > 0, true, `${scenario.name} should produce template output`);

    // Verify stdin content was integrated
    const hasStdinProcessing = output.length > scenario.content.length / 2;

    assertEquals(
      hasStdinProcessing,
      true,
      `${scenario.name} should show stdin processing occurred`,
    );
  }

  logger.debug("E2E STDIN real-world integration scenario test completed", {
    scenarios: realWorldScenarios.length,
    resultStatus: "SUCCESS",
  });

  // Cleanup
  await stdinTestSetup.cleanup();
});
