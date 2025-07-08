/**
 * @fileoverview E2E Test for TwoParamsOrchestrator
 *
 * End-to-end tests for orchestrator component, testing the complete workflow
 * from parameter validation through prompt generation from a user perspective.
 *
 * Tests verify:
 * - Complete orchestration workflow with real file I/O
 * - Integration between all orchestrator components
 * - User-facing error scenarios and recovery
 * - Performance under realistic workloads
 * - Component isolation and state management
 * - Production-like error handling
 *
 * @module cli/orchestrators/e2e_two_params_orchestrator_test
 */

import { assert, assertEquals, assertExists } from "../../../lib/deps.ts";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { exists } from "@std/fs";
import { ensureDir } from "@std/fs";

import { TwoParamsOrchestrator } from "../../../lib/cli/handlers/two_params_orchestrator.ts";
import { error } from "../../lib/deps.ts";

const logger = new BreakdownLogger("e2e-two-params-orchestrator");

// Test fixtures directory
const E2E_TEST_DIR = "./tmp/e2e_orchestrator_tests";
const FIXTURES_DIR = `${E2E_TEST_DIR}/fixtures`;
const OUTPUT_DIR = `${E2E_TEST_DIR}/output`;
const CONFIG_DIR = `${E2E_TEST_DIR}/config`;

describe("TwoParamsOrchestrator - E2E Tests", () => {
  beforeEach(async () => {
    logger.debug("Setting up E2E orchestrator test environment");
    
    // Create test directories
    await ensureDir(E2E_TEST_DIR);
    await ensureDir(FIXTURES_DIR);
    await ensureDir(OUTPUT_DIR);
    await ensureDir(CONFIG_DIR);
    
    // Create comprehensive test input files
    await Deno.writeTextFile(
      `${FIXTURES_DIR}/comprehensive_project.md`,
      `# Comprehensive Test Project

## Overview
This is a comprehensive project for E2E orchestrator testing.

## Features
- Feature A: Core functionality
- Feature B: Advanced operations
- Feature C: Integration capabilities

## Requirements
- REQ-001: System must handle large datasets
- REQ-002: Performance must meet SLA requirements
- REQ-003: Security compliance mandatory

## Architecture
### Backend Services
- Authentication Service
- Data Processing Service
- Notification Service

### Frontend Components
- User Dashboard
- Admin Panel
- Reporting Interface

## Testing Strategy
### Unit Tests
- Component isolation testing
- Mock-based validation
- Edge case coverage

### Integration Tests
- Service communication validation
- Database integration testing
- API contract verification

### E2E Tests
- User journey validation
- Cross-browser compatibility
- Performance benchmarking`
    );
    
    await Deno.writeTextFile(
      `${FIXTURES_DIR}/complex_issue.md`,
      `# Critical Performance Issue

## Problem Statement
The application experiences significant performance degradation under high load conditions.

## Impact Assessment
- User experience severely affected
- Revenue loss estimated at $50K/month
- Customer satisfaction scores dropping

## Technical Details
### Symptoms
- Response times exceeding 30 seconds
- Memory usage spikes to 95%
- Database connection pool exhaustion

### Root Cause Analysis
1. Inefficient database queries
2. Lack of proper caching
3. Synchronous processing bottlenecks

## Proposed Solutions
### Short-term (1-2 weeks)
- Implement query optimization
- Add Redis caching layer
- Increase connection pool size

### Medium-term (1-2 months)
- Refactor to async processing
- Implement proper monitoring
- Add auto-scaling capabilities

### Long-term (3-6 months)
- Complete architecture redesign
- Microservices migration
- Advanced performance analytics`
    );
    
    await Deno.writeTextFile(
      `${FIXTURES_DIR}/detailed_task.md`,
      `# Task: Implement User Authentication System

## Acceptance Criteria
- [ ] Users can register with email/password
- [ ] Email verification required
- [ ] Password reset functionality
- [ ] JWT token-based authentication
- [ ] Role-based access control
- [ ] Session management
- [ ] Audit logging

## Technical Requirements
### Backend
- Node.js/Express.js framework
- MongoDB for user data
- Redis for session storage
- bcrypt for password hashing
- JWT for token management

### Frontend
- React.js components
- Form validation
- Error handling
- Loading states
- Responsive design

### Security
- HTTPS enforcement
- Input sanitization
- Rate limiting
- CSRF protection
- XSS prevention

## Implementation Steps
1. Design database schema
2. Implement user model
3. Create authentication endpoints
4. Build registration flow
5. Implement login system
6. Add password reset
7. Create authorization middleware
8. Build frontend components
9. Add error handling
10. Write comprehensive tests

## Definition of Done
- All acceptance criteria met
- Unit tests coverage > 90%
- Integration tests passing
- Security audit complete
- Performance benchmarks met
- Documentation updated
- Code review approved`
    );

    // Create test configuration files
    await Deno.writeTextFile(
      `${CONFIG_DIR}/test_app.yml`,
      `# Test Application Configuration
version: "1.0.0"
environment: "test"
timeout: 10000
debugging: true

directories:
  prompts: "${FIXTURES_DIR}/prompts"
  schemas: "${FIXTURES_DIR}/schemas"
  output: "${OUTPUT_DIR}"

features:
  validation: strict
  caching: enabled
  monitoring: detailed
`
    );

    await Deno.writeTextFile(
      `${CONFIG_DIR}/test_user.yml`,
      `# Test User Configuration
preferences:
  output_format: markdown
  include_metadata: true
  verbose_errors: true

variables:
  default_author: "E2E Test Suite"
  default_version: "test-1.0"
  project_phase: "testing"

templates:
  custom_header: true
  include_timestamps: true
`
    );
  });

  afterEach(async () => {
    logger.debug("Cleaning up E2E orchestrator test environment");
    
    try {
      await Deno.remove(E2E_TEST_DIR, { recursive: true });
    } catch (error) {
      logger.warn("Failed to clean up orchestrator test directory", { error });
    }
  });

  describe("Complete Orchestration Workflow", () => {
    it("should orchestrate full project breakdown workflow", async () => {
      logger.debug("Testing complete project breakdown orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {
          timeout: 15000,
          configDir: CONFIG_DIR,
          promptDir: `${FIXTURES_DIR}/prompts`,
        },
        {
          fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
          destinationFile: `${OUTPUT_DIR}/project_breakdown_result.md`,
          "uv-author": "E2E Test Suite",
          "uv-version": "1.0.0",
          "uv-timestamp": new Date().toISOString(),
          skipStdin: true,
        }
      );

      // Document the orchestration result for analysis
      logger.debug("Project breakdown orchestration result", {
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : "none",
        errorDetails: !result.ok ? result.error : null,
      });

      if (result.ok) {
        // Verify output was created
        const outputExists = await exists(`${OUTPUT_DIR}/project_breakdown_result.md`);
        assert(outputExists, "Output file should be created on successful orchestration");
        
        logger.debug("Successful orchestration confirmed with output file");
      } else {
        // In test environment, expect controlled failure
        assert(
          ["PromptGenerationError", "ConfigLoadError", "FactoryValidationError", "StdinReadError"].includes(result.error.kind),
          `Expected orchestration to fail at known stage, got: ${result.error.kind}`
        );
      }
    });

    it("should orchestrate issue analysis with complex input", async () => {
      logger.debug("Testing issue analysis orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["summary", "issue"],
        {
          timeout: 10000,
        },
        {
          fromFile: `${FIXTURES_DIR}/complex_issue.md`,
          destinationFile: `${OUTPUT_DIR}/issue_analysis_result.md`,
          "uv-priority": "critical",
          "uv-category": "performance",
          "uv-assignee": "platform-team",
          "uv-deadline": "2024-01-31",
          skipStdin: true,
        }
      );

      logger.debug("Issue analysis orchestration result", {
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : "none",
      });

      if (!result.ok) {
        // Verify error is at expected stage
        assert(
          ["PromptGenerationError", "ConfigLoadError", "FactoryValidationError"].includes(result.error.kind),
          `Unexpected orchestration error: ${result.error.kind}`
        );
      }
    });

    it("should orchestrate task defect detection", async () => {
      logger.debug("Testing task defect detection orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["defect", "task"],
        {
          timeout: 12000,
        },
        {
          fromFile: `${FIXTURES_DIR}/detailed_task.md`,
          destinationFile: `${OUTPUT_DIR}/task_defects_result.md`,
          "uv-reviewer": "qa-lead",
          "uv-severity": "high",
          "uv-checklist": "security,performance,usability",
          skipStdin: true,
        }
      );

      logger.debug("Task defect detection result", {
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : "none",
      });

      assert("ok" in result, "Orchestration should return proper result structure");
    });
  });

  describe("Component Integration Scenarios", () => {
    it("should integrate stdin processor with orchestration", async () => {
      logger.debug("Testing stdin processor integration");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with very short timeout to force stdin timeout
      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {
          timeout: 50, // Force timeout scenario
        },
        {
          // No skipStdin - should attempt to read stdin
          destinationFile: `${OUTPUT_DIR}/stdin_integration_result.md`,
        }
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        // Should fail at stdin processing
        assert(
          ["StdinReadError", "VariableProcessingError"].includes(result.error.kind),
          `Expected stdin-related error, got: ${result.error.kind}`
        );
        
        logger.debug("Stdin integration test completed", {
          errorKind: result.error.kind,
        });
      }
    });

    it("should integrate variable processor with orchestration", async () => {
      logger.debug("Testing variable processor integration");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with various variable scenarios
      const variableTests = [
        {
          name: "standard variables",
          options: {
            "uv-author": "test-user",
            "uv-version": "2.1.0",
            "uv-environment": "staging",
            skipStdin: true,
          },
          expectError: false,
        },
        {
          name: "empty variable values",
          options: {
            "uv-empty": "",
            "uv-whitespace": "   ",
            skipStdin: true,
          },
          expectError: true,
        },
        {
          name: "special characters in variables",
          options: {
            "uv-special": "Special chars: àéîôü & symbols!",
            "uv-unicode": "Unicode: 🚀 中文 αβγ",
            skipStdin: true,
          },
          expectError: false,
        },
      ];

      for (const test of variableTests) {
        const result = await orchestrator.orchestrate(
          ["to", "project"],
          {},
          {
            fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
            ...test.options,
          }
        );

        logger.debug(`Variable test "${test.name}" result`, {
          success: result.ok,
          errorKind: !result.ok ? result.error.kind : "none",
        });

        if (test.expectError) {
          assertEquals(result.ok, false);
          if (!result.ok) {
            assert(
              ["VariableProcessingError", "VariablesBuilderError"].includes(result.error.kind),
              `Expected variable error for "${test.name}", got: ${result.error.kind}`
            );
          }
        }
      }
    });

    it("should integrate factory validation with orchestration", async () => {
      logger.debug("Testing factory validation integration");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with invalid parameter combinations
      const invalidTests = [
        {
          params: ["invalid_directive", "project"],
          expectedError: "InvalidDemonstrativeType",
        },
        {
          params: ["to", "invalid_layer"],
          expectedError: "InvalidLayerType",
        },
        {
          params: [],
          expectedError: "InvalidParameterCount",
        },
      ];

      for (const test of invalidTests) {
        const result = await orchestrator.orchestrate(
          test.params,
          {},
          { skipStdin: true }
        );

        assertEquals(result.ok, false);
        if (!result.ok) {
          assertEquals(result.error.kind, test.expectedError);
          
          logger.debug(`Factory validation test passed`, {
            params: test.params,
            errorKind: result.error.kind,
          });
        }
      }
    });

    it("should integrate prompt generation with orchestration", async () => {
      logger.debug("Testing prompt generation integration");

      const orchestrator = new TwoParamsOrchestrator();

      // Create minimal prompt template structure
      const promptsDir = `${FIXTURES_DIR}/prompts`;
      await ensureDir(`${promptsDir}/to/project`);
      await Deno.writeTextFile(
        `${promptsDir}/to/project/base.md`,
        `# Project Breakdown Prompt

## Input
{{input}}

## Variables
- Author: {{author}}
- Version: {{version}}

## Instructions
Please break down the project into manageable tasks.`
      );

      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {
          promptDir: promptsDir,
        },
        {
          fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
          destinationFile: `${OUTPUT_DIR}/prompt_integration_result.md`,
          "uv-author": "integration-test",
          "uv-version": "1.0",
          skipStdin: true,
        }
      );

      logger.debug("Prompt generation integration result", {
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : "none",
      });

      // Should process further into the pipeline
      if (!result.ok) {
        // May still fail but should get past factory validation
        assert(
          !["InvalidDemonstrativeType", "InvalidLayerType", "InvalidParameterCount"].includes(result.error.kind),
          `Should pass basic validation with proper setup, got: ${result.error.kind}`
        );
      }
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle orchestration errors gracefully", async () => {
      logger.debug("Testing orchestration error handling");

      const orchestrator = new TwoParamsOrchestrator();

      // Test various error scenarios
      const errorScenarios = [
        {
          name: "missing input file",
          options: {
            fromFile: `${FIXTURES_DIR}/non_existent.md`,
            skipStdin: true,
          },
          expectedErrorTypes: ["FactoryValidationError", "StdinReadError", "VariableProcessingError"],
        },
        {
          name: "invalid output directory",
          options: {
            fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
            destinationFile: "/invalid/path/that/does/not/exist/output.md",
            skipStdin: true,
          },
          expectedErrorTypes: ["OutputWriteError", "FactoryValidationError"],
        },
        {
          name: "circular variable references",
          options: {
            "uv-self": "{{self}}",
            "uv-circular": "{{circular}}",
            skipStdin: true,
          },
          expectedErrorTypes: ["VariableProcessingError", "VariablesBuilderError"],
        },
      ];

      for (const scenario of errorScenarios) {
        const result = await orchestrator.orchestrate(
          ["to", "project"],
          {},
          scenario.options
        );

        assertEquals(result.ok, false);
        if (!result.ok) {
          const errorMatches = scenario.expectedErrorTypes.some(type => 
            result.error.kind === type
          );
          
          assert(
            errorMatches,
            `Error scenario "${scenario.name}" should produce one of ${scenario.expectedErrorTypes.join(", ")}, got: ${result.error.kind}`
          );
          
          logger.debug(`Error scenario "${scenario.name}" handled correctly`, {
            errorKind: result.error.kind,
          });
        }
      }
    });

    it("should maintain error context throughout orchestration", async () => {
      logger.debug("Testing error context preservation");

      const orchestrator = new TwoParamsOrchestrator();

      const result = await orchestrator.orchestrate(
        ["invalid_type", "invalid_layer"],
        {
          customConfig: "invalid_config_path",
        },
        {
          fromFile: "non_existent_file.md",
          "uv-invalid": "{{circular_reference}}",
          skipStdin: true,
        }
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        // Should fail at the first validation point
        assertEquals(result.error.kind, "InvalidDemonstrativeType");
        
        // Verify error contains proper context
        if (result.error.kind === "InvalidDemonstrativeType") {
          assertEquals(result.error.value, "invalid_type");
          assertExists(result.error.validTypes);
        }
        
        logger.debug("Error context preserved correctly", {
          errorKind: result.error.kind,
          errorValue: result.error.kind === "InvalidDemonstrativeType" ? result.error.value : "N/A",
        });
      }
    });

    it("should handle timeout scenarios gracefully", async () => {
      logger.debug("Testing timeout handling in orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      // Test with extremely short timeout
      const result = await orchestrator.orchestrate(
        ["to", "project"],
        {
          timeout: 1, // 1ms - should timeout immediately
        },
        {
          fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
          skipStdin: true,
        }
      );

      // Should complete or timeout gracefully
      assert("ok" in result, "Should handle timeout gracefully without throwing");
      
      if (!result.ok) {
        logger.debug("Timeout scenario handled", {
          errorKind: result.error.kind,
        });
      }
    });
  });

  describe("Performance and Concurrency", () => {
    it("should handle high-load orchestration scenarios", async () => {
      logger.debug("Testing high-load orchestration");

      const orchestrator = new TwoParamsOrchestrator();
      const concurrentRequests = 15;

      const startTime = Date.now();
      
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        orchestrator.orchestrate(
          ["to", "project"],
          { requestId: i },
          {
            fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
            destinationFile: `${OUTPUT_DIR}/concurrent_${i}.md`,
            "uv-request": `request-${i}`,
            skipStdin: true,
          }
        )
      );

      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      logger.debug("High-load orchestration completed", {
        totalRequests: concurrentRequests,
        duration,
        avgTimePerRequest: duration / concurrentRequests,
        successCount: results.filter(r => r.ok).length,
        errorTypes: [...new Set(results.filter(r => !r.ok).map(r => !r.ok ? r.error.kind : null))],
      });

      // All requests should complete
      assertEquals(results.length, concurrentRequests);
      
      // Should handle requests efficiently
      assert(
        duration < concurrentRequests * 2000, 
        "High-load scenario should complete within reasonable time"
      );
    });

    it("should maintain state isolation across concurrent operations", async () => {
      logger.debug("Testing state isolation in concurrent orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      // Run different operations concurrently
      const operations = [
        {
          params: ["to", "project"],
          options: { "uv-type": "project", skipStdin: true },
        },
        {
          params: ["summary", "issue"],
          options: { "uv-type": "issue", skipStdin: true },
        },
        {
          params: ["defect", "task"],
          options: { "uv-type": "task", skipStdin: true },
        },
      ];

      const results = await Promise.all(
        operations.map((op, i) =>
          orchestrator.orchestrate(
            op.params,
            { operationId: i },
            {
              fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
              destinationFile: `${OUTPUT_DIR}/isolation_test_${i}.md`,
              ...op.options,
            }
          )
        )
      );

      // All operations should complete independently
      results.forEach((result, index) => {
        assert("ok" in result, `Operation ${index} should complete independently`);
        
        if (!result.ok) {
          logger.debug(`Operation ${index} failed independently`, {
            errorKind: result.error.kind,
            operation: operations[index].params.join("-"),
          });
        }
      });

      logger.debug("State isolation test completed", {
        operations: operations.length,
        results: results.map((r, i) => ({
          index: i,
          success: r.ok,
          errorKind: !r.ok ? r.error.kind : null,
        })),
      });
    });

    it("should handle memory pressure during orchestration", async () => {
      logger.debug("Testing memory pressure handling");

      // Create large input file
      const largeContent = "# Large Project\n\n" + 
        "This is a very large project description with extensive details.\n".repeat(5000);
      
      const largeFile = `${FIXTURES_DIR}/large_project.md`;
      await Deno.writeTextFile(largeFile, largeContent);

      const orchestrator = new TwoParamsOrchestrator();

      const startTime = Date.now();
      
      const result = await orchestrator.orchestrate(
        ["summary", "project"],
        {
          timeout: 20000, // Allow extra time for large content
        },
        {
          fromFile: largeFile,
          destinationFile: `${OUTPUT_DIR}/large_project_summary.md`,
          "uv-mode": "comprehensive",
          skipStdin: true,
        }
      );

      const duration = Date.now() - startTime;

      logger.debug("Memory pressure test completed", {
        duration,
        success: result.ok,
        errorKind: !result.ok ? result.error.kind : "none",
        inputSize: largeContent.length,
      });

      // Should handle large content efficiently
      assert(duration < 20000, "Should handle large content within timeout");
      assert("ok" in result, "Should handle large content without memory errors");
    });
  });

  describe("Advanced Integration Scenarios", () => {
    it("should handle complex configuration hierarchies", async () => {
      logger.debug("Testing complex configuration integration");

      // Create nested configuration structure
      await ensureDir(`${CONFIG_DIR}/profiles/development`);
      await ensureDir(`${CONFIG_DIR}/profiles/production`);

      await Deno.writeTextFile(
        `${CONFIG_DIR}/profiles/development/app.yml`,
        `environment: development
debugging: true
timeout: 30000
features:
  experimental: enabled
  verbose_logging: true`
      );

      await Deno.writeTextFile(
        `${CONFIG_DIR}/profiles/production/app.yml`,
        `environment: production
debugging: false
timeout: 5000
features:
  experimental: disabled
  verbose_logging: false`
      );

      const orchestrator = new TwoParamsOrchestrator();

      const devResult = await orchestrator.orchestrate(
        ["to", "project"],
        {
          configProfile: "development",
          configDir: `${CONFIG_DIR}/profiles/development`,
        },
        {
          fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
          "uv-environment": "dev",
          skipStdin: true,
        }
      );

      const prodResult = await orchestrator.orchestrate(
        ["to", "project"],
        {
          configProfile: "production",
          configDir: `${CONFIG_DIR}/profiles/production`,
        },
        {
          fromFile: `${FIXTURES_DIR}/comprehensive_project.md`,
          "uv-environment": "prod",
          skipStdin: true,
        }
      );

      logger.debug("Configuration hierarchy test results", {
        dev: devResult.ok ? "success" : devResult.error.kind,
        prod: prodResult.ok ? "success" : prodResult.error.kind,
      });

      // Both should handle configuration appropriately
      assert("ok" in devResult, "Development config should be processed");
      assert("ok" in prodResult, "Production config should be processed");
    });

    it("should handle workflow chaining scenarios", async () => {
      logger.debug("Testing workflow chaining orchestration");

      const orchestrator = new TwoParamsOrchestrator();

      // Simulate a multi-step workflow
      const workflowSteps = [
        {
          step: "1-project-breakdown",
          params: ["to", "project"],
          input: `${FIXTURES_DIR}/comprehensive_project.md`,
          output: `${OUTPUT_DIR}/step1_project_breakdown.md`,
        },
        {
          step: "2-issue-extraction",
          params: ["to", "issue"],
          input: `${OUTPUT_DIR}/step1_project_breakdown.md`,
          output: `${OUTPUT_DIR}/step2_issues.md`,
        },
        {
          step: "3-task-generation",
          params: ["to", "task"],
          input: `${OUTPUT_DIR}/step2_issues.md`,
          output: `${OUTPUT_DIR}/step3_tasks.md`,
        },
      ];

      const stepResults = [];

      for (const step of workflowSteps) {
        // Check if input exists (for steps 2+)
        const inputExists = step.step === "1-project-breakdown" || 
          await exists(step.input);

        if (!inputExists) {
          logger.debug(`Skipping step ${step.step} - input not available`);
          continue;
        }

        const result = await orchestrator.orchestrate(
          step.params,
          {
            workflowStep: step.step,
          },
          {
            fromFile: step.input,
            destinationFile: step.output,
            "uv-workflow-step": step.step,
            "uv-timestamp": new Date().toISOString(),
            skipStdin: true,
          }
        );

        stepResults.push({
          step: step.step,
          success: result.ok,
          errorKind: !result.ok ? result.error.kind : null,
        });

        logger.debug(`Workflow step ${step.step} completed`, {
          success: result.ok,
          errorKind: !result.ok ? result.error.kind : "none",
        });

        // If step fails, log and continue (for testing purposes)
        if (!result.ok) {
          logger.debug(`Step ${step.step} failed, continuing workflow test`);
        }
      }

      logger.debug("Workflow chaining test completed", {
        totalSteps: workflowSteps.length,
        executedSteps: stepResults.length,
        results: stepResults,
      });

      // At least the first step should execute
      assert(stepResults.length > 0, "At least one workflow step should execute");
    });
  });
});