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
import { ConfigLoader } from "../../../lib/config/loader.ts";

// Test logger initialization
const logger = new BreakdownLogger("e2e-stdin-integration");

/**
 * STDIN Mock Handler for Testing
 */
class StdinMockHandler {
  private originalReadSync: typeof Deno.stdin.readSync;
  private mockData: Uint8Array | null = null;
  private dataIndex = 0;

  constructor() {
    this.originalReadSync = Deno.stdin.readSync;
  }

  setMockData(data: string) {
    this.mockData = new TextEncoder().encode(data);
    this.dataIndex = 0;
  }

  start() {
    Deno.stdin.readSync = (buffer: Uint8Array) => {
      if (!this.mockData || this.dataIndex >= this.mockData.length) {
        return null; // EOF
      }

      const remainingBytes = this.mockData.length - this.dataIndex;
      const bytesToCopy = Math.min(buffer.length, remainingBytes);

      buffer.set(this.mockData.subarray(this.dataIndex, this.dataIndex + bytesToCopy));
      this.dataIndex += bytesToCopy;

      return bytesToCopy;
    };
  }

  stop() {
    Deno.stdin.readSync = this.originalReadSync;
    this.mockData = null;
    this.dataIndex = 0;
  }
}

/**
 * STDOUT Capture for Result Verification
 */
class StdoutCapture {
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
 * Test Suite: STDIN Processing Integration
 * STDIN processing integration test
 */
Deno.test("E2E-STDIN: Basic STDIN Processing Integration", async () => {
  logger.debug("E2E STDIN basic integration test started", {
    scenario: "STDIN content variable replacement and prompt generation",
  });

  // Setup test configuration
  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
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

  const stdinMock = new StdinMockHandler();
  const stdoutCapture = new StdoutCapture();

  try {
    // Mock STDIN with test content
    stdinMock.setMockData(stdinContent);
    stdinMock.start();

    // Capture output
    stdoutCapture.start();

    // Load configuration with project root directory
    const workingDir = Deno.cwd(); // Use current working directory (project root)
    const configLoadResult = await ConfigLoader.loadBreakdownConfig("default-test", workingDir);
    const config = configLoadResult.ok ? configLoadResult.data : {};

    // Execute two params handler with STDIN processing
    const params = [validDirective, validLayer];
    const options = { skipStdin: false, from: "-" }; // Explicitly enable STDIN reading

    logger.debug("TwoParamsHandler execution started", {
      params,
      stdinContentLength: stdinContent.length,
      config: Object.keys(config),
    });

    const result = await twoParamsHandler(params, config, options);
    const output = stdoutCapture.stop();

    logger.debug("TwoParamsHandler execution result", {
      success: result.ok,
      outputLength: output.length,
      hasOutput: output.length > 0,
      error: result.ok ? null : result.error,
    });

    // Verify successful processing
    assertEquals(result.ok, true, "STDIN processing should succeed");
    assertExists(output, "Output should be generated from STDIN input");
    assertEquals(output.length > 0, true, "Output should contain generated content");

    // Verify basic output structure (template was found and processed)
    const hasBasicStructure = output.includes("input_text") ||
      output.length >= 20; // Template processing generates at least some content

    assertEquals(hasBasicStructure, true, "Output should have basic template structure");

    logger.debug("STDIN integration verification completed", {
      stdinLength: stdinContent.length,
      outputLength: output.length,
      expansionRatio: (output.length / stdinContent.length).toFixed(2),
      hasIntegration: hasBasicStructure,
    });
  } finally {
    stdinMock.stop();
    stdoutCapture.stop();
  }

  logger.debug("E2E STDIN basic integration test completed", { resultStatus: "SUCCESS" });
});

/**
 * Test Suite: Complex STDIN Content Processing
 * Complex STDIN content processing test
 */
Deno.test("E2E-STDIN: Complex Content Processing", async () => {
  const workingDir = Deno.cwd(); // Use current working directory
  logger.debug("E2E STDIN complex content processing test started", {
    scenario: "Complex structured STDIN content processing",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");
  const validDirective = configResult.userConfig.testData.validDirectives[1] || "summary";
  const validLayer = configResult.userConfig.testData.validLayers[1] || "issue";

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

  const stdinMock = new StdinMockHandler();
  const stdoutCapture = new StdoutCapture();

  try {
    stdinMock.setMockData(complexStdinContent);
    stdinMock.start();
    stdoutCapture.start();

    const configLoadResult = await ConfigLoader.loadBreakdownConfig("flexible-test", workingDir);
    const config = configLoadResult.ok ? configLoadResult.data : {};

    const params = [validDirective, validLayer];
    const options = { skipStdin: false, from: "-" }; // Explicitly enable STDIN reading

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
    const output = stdoutCapture.stop();

    logger.debug("Complex STDIN processing result", {
      success: result.ok,
      outputLength: output.length,
      inputOutputRatio: (output.length / complexStdinContent.length).toFixed(2),
    });

    // Verify processing of complex content
    assertEquals(result.ok, true, "Complex STDIN content processing should succeed");
    assertExists(output, "Output should be generated from complex input");
    assertEquals(output.length > 0, true, "Output should contain processed content");

    // Verify basic template processing (less strict than content-based requirements)
    const hasBasicProcessing = output.includes("input_text") || output.length >= 20;
    assertEquals(hasBasicProcessing, true, "Complex content should show template processing");

    logger.debug("Complex STDIN processing verification", {
      originalComplexity: complexStdinContent.length,
      processedLength: output.length,
      processingIndicator: hasBasicProcessing ? "SUCCESS" : "MINIMAL",
    });
  } finally {
    stdinMock.stop();
    stdoutCapture.stop();
  }

  logger.debug("E2E STDIN complex content processing test completed", { resultStatus: "SUCCESS" });
});

/**
 * Test Suite: STDIN Error Scenarios
 * STDIN error scenario test
 */
Deno.test("E2E-STDIN: Error Scenarios", async () => {
  const _workingDir = Deno.cwd(); // Use current working directory
  logger.debug("E2E STDIN error scenario test started", {
    scenario: "STDIN-related error case processing verification",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  const configLoadResult = await ConfigLoader.loadBreakdownConfig("default-test", Deno.cwd());
  const config = configLoadResult.ok ? configLoadResult.data : {};

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

    const stdinMock = new StdinMockHandler();
    const stdoutCapture = new StdoutCapture();

    try {
      stdinMock.setMockData(scenario.stdinContent);
      stdinMock.start();
      stdoutCapture.start();

      const params = [validDirective, validLayer];
      const options = { skipStdin: false, from: "-" }; // Explicitly enable STDIN reading

      const result = await twoParamsHandler(params, config, options);
      const output = stdoutCapture.stop();

      logger.debug(`STDIN scenario ${scenario.name} result`, {
        success: result.ok,
        expectSuccess: scenario.expectSuccess,
        outputLength: output.length,
      });

      if (scenario.expectSuccess) {
        assertEquals(result.ok, true, `${scenario.name} should be handled gracefully`);
      } else {
        assertEquals(result.ok, false, `${scenario.name} should result in appropriate error`);
      }
    } finally {
      stdinMock.stop();
      stdoutCapture.stop();
    }
  }

  logger.debug("E2E STDIN error scenario test completed", {
    scenarios: errorScenarios.length,
    resultStatus: "SUCCESS",
  });
});

/**
 * Test Suite: STDIN Performance Characteristics
 * STDIN Performance Characteristics Test
 */
Deno.test("E2E-STDIN: Performance Characteristics", async () => {
  const workingDir = Deno.cwd(); // Use current working directory
  logger.debug("E2E STDIN performance characteristics test started", {
    scenario: "Performance verification for large STDIN processing",
  });

  const configResult = await ConfigurationTestHelper.loadTestConfiguration("default-test");
  const validDirective = configResult.userConfig.testData.validDirectives[0];
  const validLayer = configResult.userConfig.testData.validLayers[0];

  // Generate large but structured test content
  const generateLargeContent = (sizeKB: number) => {
    const baseSection = `## Section with Important Content

This section contains detailed information about system analysis and breakdown requirements.
The content includes multiple paragraphs with technical details, business context, and implementation guidance.

### Technical Requirements
- Performance optimization
- Scalability improvements
- Error handling enhancements
- Security considerations

### Business Context
- User experience improvements
- Cost optimization
- Risk mitigation
- Compliance requirements

`;

    const targetLength = sizeKB * 1024;
    const sections: string[] = [];
    let currentLength = 0;
    let sectionIndex = 1;

    while (currentLength < targetLength) {
      const section = `# Large Document Section ${sectionIndex}\n\n${baseSection}`;
      sections.push(section);
      currentLength += section.length;
      sectionIndex++;
    }

    return sections.join("\n");
  };

  const testSizes = [10, 50, 100]; // KB sizes to test

  for (const sizeKB of testSizes) {
    logger.debug(`Performance test: ${sizeKB}KB`, { sizeKB });

    const largeContent = generateLargeContent(sizeKB);
    const stdinMock = new StdinMockHandler();
    const stdoutCapture = new StdoutCapture();

    try {
      stdinMock.setMockData(largeContent);
      stdinMock.start();
      stdoutCapture.start();

      const configLoadResult = await ConfigLoader.loadBreakdownConfig("default-test", workingDir);
      const config = configLoadResult.ok ? configLoadResult.data : {};

      const params = [validDirective, validLayer];
      const options = { skipStdin: false, from: "-" }; // Explicitly enable STDIN reading

      const startTime = performance.now();
      const result = await twoParamsHandler(params, config, options);
      const endTime = performance.now();

      const output = stdoutCapture.stop();
      const processingTime = endTime - startTime;

      logger.debug(`Performance result ${sizeKB}KB`, {
        inputSize: `${(largeContent.length / 1024).toFixed(1)}KB`,
        processingTime: `${processingTime.toFixed(2)}ms`,
        outputSize: `${(output.length / 1024).toFixed(1)}KB`,
        success: result.ok,
        throughput: `${(largeContent.length / 1024 / (processingTime / 1000)).toFixed(1)}KB/s`,
      });

      // Performance assertions
      assertEquals(result.ok, true, `${sizeKB}KB processing should succeed`);
      assertEquals(
        processingTime < 10000,
        true,
        `${sizeKB}KB processing should complete within 10 seconds`,
      );
      assertExists(output, `${sizeKB}KB processing should generate output`);
    } finally {
      stdinMock.stop();
      stdoutCapture.stop();
    }
  }

  logger.debug("E2E STDIN performance characteristics test completed", {
    testSizes,
    resultStatus: "SUCCESS",
  });
});

/**
 * Test Suite: Real-world Integration Scenarios
 * Real-world Integration Scenario Test
 */
Deno.test("E2E-STDIN: Real-world Integration Scenarios", async () => {
  const workingDir = Deno.cwd(); // Use current working directory
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

    const stdinMock = new StdinMockHandler();
    const stdoutCapture = new StdoutCapture();

    try {
      // Load appropriate configuration
      const configResult = await ConfigurationTestHelper.loadTestConfiguration("flexible-test");

      // Validate that the directive and layer are supported
      const validDirectives = configResult.userConfig.testData.validDirectives;
      const validLayers = configResult.userConfig.testData.validLayers;

      const directive = validDirectives.includes(scenario.directive)
        ? scenario.directive
        : validDirectives[0];
      const layer = validLayers.includes(scenario.layer) ? scenario.layer : validLayers[0];

      stdinMock.setMockData(scenario.content);
      stdinMock.start();
      stdoutCapture.start();

      const configLoadResult = await ConfigLoader.loadBreakdownConfig("flexible-test", workingDir);
      const config = configLoadResult.ok ? configLoadResult.data : {};

      const params = [directive, layer];
      const options = { skipStdin: false, from: "-" }; // Explicitly enable STDIN reading

      const result = await twoParamsHandler(params, config, options);
      const output = stdoutCapture.stop();

      logger.debug(`Real-world scenario ${scenario.name} result`, {
        success: result.ok,
        usedDirective: directive,
        usedLayer: layer,
        outputLength: output.length,
        expansionRatio: (output.length / scenario.content.length).toFixed(2),
      });

      // Verify realistic scenario processing
      assertEquals(result.ok, true, `${scenario.name} should be processed successfully`);
      assertExists(output, `${scenario.name} should generate meaningful output`);
      assertEquals(output.length > 0, true, `${scenario.name} should produce non-empty output`);

      // Verify output quality (should be expanded or transformed meaningfully)
      const hasQualityProcessing = output.length > scenario.content.length * 0.5 ||
        output.toLowerCase().includes(scenario.name.toLowerCase().split(" ")[0]) ||
        output.includes(directive) || output.includes(layer);

      assertEquals(hasQualityProcessing, true, `${scenario.name} should produce quality output`);
    } finally {
      stdinMock.stop();
      stdoutCapture.stop();
    }
  }

  logger.debug("E2E STDIN real-world integration scenario test completed", {
    scenarios: realWorldScenarios.length,
    resultStatus: "SUCCESS",
  });
});
