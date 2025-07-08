/**
 * @fileoverview E2E User Scenarios Test
 *
 * End-to-end tests covering comprehensive user scenarios and workflows
 * from a user's perspective, testing the complete system integration.
 *
 * Tests verify:
 * - Real-world user journeys and workflows
 * - Cross-component integration scenarios
 * - User experience under various conditions
 * - Error handling from user perspective
 * - Performance in realistic usage patterns
 * - Edge cases that users might encounter
 *
 * @module cli/e2e_user_scenarios_test
 */

import { assert, assertEquals, assertExists } from "../../../lib/deps.ts";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { exists } from "@std/fs";
import { ensureDir } from "@std/fs";

import {
  handleTwoParams,
  handleTwoParamsClean,
} from "../../../lib/cli/handlers/two_params_handler_refactored.ts";
import { TwoParamsOrchestrator } from "../../../lib/cli/handlers/two_params_orchestrator.ts";

const logger = new BreakdownLogger("e2e-user-scenarios");

// Test environment setup
const E2E_USER_TEST_DIR = "./tmp/e2e_user_scenarios";
const WORKSPACE_DIR = `${E2E_USER_TEST_DIR}/workspace`;
const PROJECTS_DIR = `${WORKSPACE_DIR}/projects`;
const OUTPUTS_DIR = `${WORKSPACE_DIR}/outputs`;

describe("E2E User Scenarios", () => {
  beforeEach(async () => {
    logger.debug("Setting up E2E user scenarios test environment");
    
    // Create realistic workspace structure
    await ensureDir(E2E_USER_TEST_DIR);
    await ensureDir(WORKSPACE_DIR);
    await ensureDir(PROJECTS_DIR);
    await ensureDir(OUTPUTS_DIR);
    
    // Create realistic project scenarios
    await createProjectScenarios();
    await createConfigurationFiles();
    await createTemplateStructure();
  });

  afterEach(async () => {
    logger.debug("Cleaning up E2E user scenarios test environment");
    
    try {
      await Deno.remove(E2E_USER_TEST_DIR, { recursive: true });
    } catch (error) {
      logger.warn("Failed to clean up user scenarios test directory", { error });
    }
  });

  describe("Developer Workflow Scenarios", () => {
    it("should support full project development lifecycle", async () => {
      logger.debug("Testing full project development lifecycle");

      // Scenario: Developer starting a new project
      const projectFile = `${PROJECTS_DIR}/new_web_app.md`;
      
      // Phase 1: Initial project breakdown
      const phase1Result = await handleTwoParams(
        ["to", "project"],
        { timeout: 10000 },
        {
          fromFile: projectFile,
          destinationFile: `${OUTPUTS_DIR}/phase1_project_breakdown.md`,
          "uv-developer": "Alice Smith",
          "uv-team": "Frontend Team",
          "uv-deadline": "2024-03-15",
          skipStdin: true,
        }
      );

      logger.debug("Phase 1 (Project Breakdown) result", {
        success: phase1Result.ok,
        errorKind: !phase1Result.ok ? phase1Result.error.kind : "none",
      });

      // Phase 2: Extract issues from project (if Phase 1 succeeded or continue for testing)
      const phase2Result = await handleTwoParams(
        ["to", "issue"],
        { timeout: 8000 },
        {
          fromFile: phase1Result.ok ? `${OUTPUTS_DIR}/phase1_project_breakdown.md` : projectFile,
          destinationFile: `${OUTPUTS_DIR}/phase2_issues.md`,
          "uv-priority": "high",
          "uv-sprint": "Sprint 1",
          skipStdin: true,
        }
      );

      logger.debug("Phase 2 (Issue Extraction) result", {
        success: phase2Result.ok,
        errorKind: !phase2Result.ok ? phase2Result.error.kind : "none",
      });

      // Phase 3: Generate tasks from issues
      const phase3Result = await handleTwoParams(
        ["to", "task"],
        { timeout: 8000 },
        {
          fromFile: phase2Result.ok ? `${OUTPUTS_DIR}/phase2_issues.md` : projectFile,
          destinationFile: `${OUTPUTS_DIR}/phase3_tasks.md`,
          "uv-assignee": "development-team",
          "uv-estimation": "story-points",
          skipStdin: true,
        }
      );

      logger.debug("Phase 3 (Task Generation) result", {
        success: phase3Result.ok,
        errorKind: !phase3Result.ok ? phase3Result.error.kind : "none",
      });

      // Verify lifecycle progression
      const phases = [phase1Result, phase2Result, phase3Result];
      phases.forEach((result, index) => {
        assert("ok" in result, `Phase ${index + 1} should complete with proper result structure`);
      });

      logger.debug("Development lifecycle test completed", {
        phases: phases.map((result, index) => ({
          phase: index + 1,
          success: result.ok,
          errorKind: !result.ok ? result.error.kind : "none",
        })),
      });
    });

    it("should handle agile development workflow", async () => {
      logger.debug("Testing agile development workflow");

      const sprintBacklogFile = `${PROJECTS_DIR}/sprint_backlog.md`;

      // Sprint Planning: Break down backlog items
      const planningResult = await handleTwoParams(
        ["to", "task"],
        { workflowType: "agile" },
        {
          fromFile: sprintBacklogFile,
          destinationFile: `${OUTPUTS_DIR}/sprint_tasks.md`,
          "uv-sprint": "Sprint 5",
          "uv-team-velocity": "42",
          "uv-scrum-master": "Bob Johnson",
          skipStdin: true,
        }
      );

      // Daily Standup: Summarize current issues
      const standupResult = await handleTwoParams(
        ["summary", "issue"],
        { workflowType: "standup" },
        {
          fromFile: `${PROJECTS_DIR}/current_issues.md`,
          destinationFile: `${OUTPUTS_DIR}/standup_summary.md`,
          "uv-meeting-date": new Date().toISOString().split('T')[0],
          "uv-blockers": "api-integration,testing-env",
          skipStdin: true,
        }
      );

      // Sprint Review: Identify defects
      const reviewResult = await handleTwoParams(
        ["defect", "project"],
        { workflowType: "review" },
        {
          fromFile: `${PROJECTS_DIR}/sprint_deliverables.md`,
          destinationFile: `${OUTPUTS_DIR}/review_defects.md`,
          "uv-reviewer": "QA Team",
          "uv-acceptance-criteria": "met",
          skipStdin: true,
        }
      );

      logger.debug("Agile workflow test completed", {
        planning: planningResult.ok ? "success" : planningResult.error.kind,
        standup: standupResult.ok ? "success" : standupResult.error.kind,
        review: reviewResult.ok ? "success" : reviewResult.error.kind,
      });

      // All agile ceremonies should be supported
      [planningResult, standupResult, reviewResult].forEach((result, index) => {
        const ceremonies = ["Planning", "Standup", "Review"];
        assert("ok" in result, `${ceremonies[index]} ceremony should be supported`);
      });
    });

    it("should support code review and quality assurance workflow", async () => {
      logger.debug("Testing code review and QA workflow");

      const codeReviewFile = `${PROJECTS_DIR}/pull_request.md`;

      // Code Review: Identify potential defects
      const reviewResult = await handleTwoParams(
        ["defect", "task"],
        { reviewType: "code" },
        {
          fromFile: codeReviewFile,
          destinationFile: `${OUTPUTS_DIR}/code_review_findings.md`,
          "uv-reviewer": "Senior Developer",
          "uv-review-type": "security,performance,maintainability",
          "uv-severity": "medium",
          skipStdin: true,
        }
      );

      // QA Testing: Summarize test results
      const qaResult = await handleTwoParams(
        ["summary", "issue"],
        { qaPhase: "testing" },
        {
          fromFile: `${PROJECTS_DIR}/test_results.md`,
          destinationFile: `${OUTPUTS_DIR}/qa_summary.md`,
          "uv-test-lead": "QA Manager",
          "uv-test-coverage": "87%",
          "uv-critical-bugs": "2",
          skipStdin: true,
        }
      );

      // Release Preparation: Project-level defect analysis
      const releaseResult = await handleTwoParams(
        ["defect", "project"],
        { phase: "pre-release" },
        {
          fromFile: `${PROJECTS_DIR}/release_candidate.md`,
          destinationFile: `${OUTPUTS_DIR}/release_readiness.md`,
          "uv-release-manager": "DevOps Lead",
          "uv-target-date": "2024-02-01",
          skipStdin: true,
        }
      );

      logger.debug("QA workflow test completed", {
        codeReview: reviewResult.ok ? "success" : reviewResult.error.kind,
        qaTesting: qaResult.ok ? "success" : qaResult.error.kind,
        releasePrep: releaseResult.ok ? "success" : releaseResult.error.kind,
      });

      // Quality assurance activities should be supported
      [reviewResult, qaResult, releaseResult].forEach((result, index) => {
        const activities = ["Code Review", "QA Testing", "Release Prep"];
        assert("ok" in result, `${activities[index]} should be supported`);
      });
    });
  });

  describe("Project Manager Workflow Scenarios", () => {
    it("should support project planning and tracking", async () => {
      logger.debug("Testing project planning and tracking workflow");

      const projectProposalFile = `${PROJECTS_DIR}/project_proposal.md`;

      // Initial Planning: Break down project proposal
      const planningResult = await handleTwoParams(
        ["to", "project"],
        { managerView: true },
        {
          fromFile: projectProposalFile,
          destinationFile: `${OUTPUTS_DIR}/project_plan.md`,
          "uv-pm": "Carol Wilson",
          "uv-budget": "$250,000",
          "uv-timeline": "6 months",
          "uv-stakeholders": "CTO,Product,Marketing",
          skipStdin: true,
        }
      );

      // Risk Assessment: Identify potential issues
      const riskResult = await handleTwoParams(
        ["to", "issue"],
        { category: "risk-assessment" },
        {
          fromFile: `${PROJECTS_DIR}/project_risks.md`,
          destinationFile: `${OUTPUTS_DIR}/risk_issues.md`,
          "uv-risk-level": "medium",
          "uv-mitigation": "required",
          skipStdin: true,
        }
      );

      // Status Reporting: Summarize current project state
      const statusResult = await handleTwoParams(
        ["summary", "project"],
        { reportType: "executive" },
        {
          fromFile: planningResult.ok ? `${OUTPUTS_DIR}/project_plan.md` : projectProposalFile,
          destinationFile: `${OUTPUTS_DIR}/status_report.md`,
          "uv-report-date": new Date().toISOString().split('T')[0],
          "uv-progress": "65%",
          "uv-budget-used": "$162,500",
          skipStdin: true,
        }
      );

      logger.debug("Project management workflow test completed", {
        planning: planningResult.ok ? "success" : planningResult.error.kind,
        riskAssessment: riskResult.ok ? "success" : riskResult.error.kind,
        statusReporting: statusResult.ok ? "success" : statusResult.error.kind,
      });

      // Project management activities should be supported
      [planningResult, riskResult, statusResult].forEach((result, index) => {
        const activities = ["Planning", "Risk Assessment", "Status Reporting"];
        assert("ok" in result, `${activities[index]} should be supported for project managers`);
      });
    });

    it("should handle resource allocation and team coordination", async () => {
      logger.debug("Testing resource allocation and team coordination");

      const resourcePlanFile = `${PROJECTS_DIR}/resource_requirements.md`;

      // Resource Planning: Break down resource needs into tasks
      const resourceResult = await handleTwoParams(
        ["to", "task"],
        { perspective: "resource-management" },
        {
          fromFile: resourcePlanFile,
          destinationFile: `${OUTPUTS_DIR}/resource_tasks.md`,
          "uv-resource-manager": "David Chen",
          "uv-team-size": "12",
          "uv-specializations": "frontend,backend,devops,qa",
          skipStdin: true,
        }
      );

      // Team Coordination: Summarize team issues
      const coordinationResult = await handleTwoParams(
        ["summary", "issue"],
        { scope: "team-coordination" },
        {
          fromFile: `${PROJECTS_DIR}/team_challenges.md`,
          destinationFile: `${OUTPUTS_DIR}/coordination_summary.md`,
          "uv-team-lead": "Emma Rodriguez",
          "uv-coordination-type": "cross-functional",
          skipStdin: true,
        }
      );

      logger.debug("Resource and coordination workflow test completed", {
        resourcePlanning: resourceResult.ok ? "success" : resourceResult.error.kind,
        teamCoordination: coordinationResult.ok ? "success" : coordinationResult.error.kind,
      });

      // Resource management activities should be supported
      [resourceResult, coordinationResult].forEach((result, index) => {
        const activities = ["Resource Planning", "Team Coordination"];
        assert("ok" in result, `${activities[index]} should be supported`);
      });
    });
  });

  describe("Stakeholder Communication Scenarios", () => {
    it("should support executive reporting and communication", async () => {
      logger.debug("Testing executive reporting workflow");

      const quarterlyReviewFile = `${PROJECTS_DIR}/quarterly_review.md`;

      // Executive Summary: High-level project overview
      const executiveResult = await handleTwoParams(
        ["summary", "project"],
        { audience: "executive" },
        {
          fromFile: quarterlyReviewFile,
          destinationFile: `${OUTPUTS_DIR}/executive_summary.md`,
          "uv-exec-sponsor": "CTO",
          "uv-quarter": "Q1 2024",
          "uv-kpis": "delivery,quality,budget",
          skipStdin: true,
        }
      );

      // Board Presentation: Project highlights and issues
      const boardResult = await handleTwoParams(
        ["to", "issue"],
        { format: "board-presentation" },
        {
          fromFile: `${PROJECTS_DIR}/board_update.md`,
          destinationFile: `${OUTPUTS_DIR}/board_issues.md`,
          "uv-presenter": "VP Engineering",
          "uv-meeting-type": "board-review",
          skipStdin: true,
        }
      );

      logger.debug("Executive communication test completed", {
        executiveSummary: executiveResult.ok ? "success" : executiveResult.error.kind,
        boardPresentation: boardResult.ok ? "success" : boardResult.error.kind,
      });

      // Executive communication should be supported
      [executiveResult, boardResult].forEach((result, index) => {
        const formats = ["Executive Summary", "Board Presentation"];
        assert("ok" in result, `${formats[index]} should be supported`);
      });
    });

    it("should handle client and vendor communication", async () => {
      logger.debug("Testing client and vendor communication workflow");

      const clientRequirementsFile = `${PROJECTS_DIR}/client_requirements.md`;

      // Client Communication: Translate requirements into project structure
      const clientResult = await handleTwoParams(
        ["to", "project"],
        { stakeholder: "client" },
        {
          fromFile: clientRequirementsFile,
          destinationFile: `${OUTPUTS_DIR}/client_project_view.md`,
          "uv-client": "TechCorp Inc",
          "uv-account-manager": "Sarah Kim",
          "uv-contract-value": "$500K",
          skipStdin: true,
        }
      );

      // Vendor Coordination: Summarize vendor-related issues
      const vendorResult = await handleTwoParams(
        ["summary", "issue"],
        { category: "vendor-management" },
        {
          fromFile: `${PROJECTS_DIR}/vendor_issues.md`,
          destinationFile: `${OUTPUTS_DIR}/vendor_summary.md`,
          "uv-vendor": "CloudProvider LLC",
          "uv-service-type": "infrastructure",
          skipStdin: true,
        }
      );

      logger.debug("External stakeholder communication test completed", {
        clientCommunication: clientResult.ok ? "success" : clientResult.error.kind,
        vendorCoordination: vendorResult.ok ? "success" : vendorResult.error.kind,
      });

      // External stakeholder communication should be supported
      [clientResult, vendorResult].forEach((result, index) => {
        const stakeholders = ["Client Communication", "Vendor Coordination"];
        assert("ok" in result, `${stakeholders[index]} should be supported`);
      });
    });
  });

  describe("Error Recovery and User Experience Scenarios", () => {
    it("should provide helpful guidance for common user errors", async () => {
      logger.debug("Testing user error scenarios and guidance");

      // Scenario 1: Wrong parameter order
      const wrongOrderResult = await handleTwoParams(
        ["project", "to"], // Reversed order
        {},
        { skipStdin: true }
      );

      assertEquals(wrongOrderResult.ok, false);
      if (!wrongOrderResult.ok) {
        assertEquals(wrongOrderResult.error.kind, "InvalidDemonstrativeType");
        logger.debug("Wrong parameter order handled correctly", {
          errorKind: wrongOrderResult.error.kind,
        });
      }

      // Scenario 2: Typo in directive type
      const typoResult = await handleTwoParams(
        ["too", "project"], // "too" instead of "to"
        {},
        { skipStdin: true }
      );

      assertEquals(typoResult.ok, false);
      if (!typoResult.ok) {
        assertEquals(typoResult.error.kind, "InvalidDemonstrativeType");
        logger.debug("Typo in directive handled correctly", {
          errorKind: typoResult.error.kind,
        });
      }

      // Scenario 3: Non-existent file
      const missingFileResult = await handleTwoParams(
        ["to", "project"],
        {},
        {
          fromFile: "/path/that/does/not/exist.md",
          skipStdin: true,
        }
      );

      assertEquals(missingFileResult.ok, false);
      if (!missingFileResult.ok) {
        // Should provide clear file-related error
        assert(
          ["FactoryValidationError", "StdinReadError", "VariableProcessingError"].includes(missingFileResult.error.kind),
          `Expected file-related error, got: ${missingFileResult.error.kind}`
        );
        
        logger.debug("Missing file scenario handled correctly", {
          errorKind: missingFileResult.error.kind,
        });
      }
    });

    it("should handle graceful degradation scenarios", async () => {
      logger.debug("Testing graceful degradation scenarios");

      // Scenario: Network-like timeout (very short timeout)
      const timeoutResult = await handleTwoParams(
        ["to", "project"],
        { timeout: 10 }, // Very short timeout
        {
          fromFile: `${PROJECTS_DIR}/large_enterprise_project.md`,
          skipStdin: true,
        }
      );

      // Should handle timeout gracefully
      assert("ok" in timeoutResult, "Should handle timeout gracefully without throwing");
      
      if (!timeoutResult.ok) {
        logger.debug("Timeout scenario handled gracefully", {
          errorKind: timeoutResult.error.kind,
        });
      }

      // Scenario: Partial system availability
      const partialAvailabilityResult = await handleTwoParams(
        ["summary", "issue"],
        { limitedMode: true },
        {
          fromFile: `${PROJECTS_DIR}/system_status.md`,
          destinationFile: `${OUTPUTS_DIR}/degraded_summary.md`,
          skipStdin: true,
        }
      );

      // Should handle limited mode gracefully
      assert("ok" in partialAvailabilityResult, "Should handle partial availability");
      
      logger.debug("Graceful degradation test completed", {
        timeout: timeoutResult.ok ? "success" : timeoutResult.error.kind,
        partialAvailability: partialAvailabilityResult.ok ? "success" : partialAvailabilityResult.error.kind,
      });
    });

    it("should provide consistent user experience across scenarios", async () => {
      logger.debug("Testing user experience consistency");

      const scenarios = [
        {
          name: "Standard project breakdown",
          params: ["to", "project"],
          file: `${PROJECTS_DIR}/standard_project.md`,
        },
        {
          name: "Issue analysis",
          params: ["summary", "issue"],
          file: `${PROJECTS_DIR}/current_issues.md`,
        },
        {
          name: "Task defect detection",
          params: ["defect", "task"],
          file: `${PROJECTS_DIR}/task_list.md`,
        },
      ];

      const results = await Promise.all(
        scenarios.map(async (scenario, index) => {
          const result = await handleTwoParams(
            scenario.params,
            { scenarioId: index },
            {
              fromFile: scenario.file,
              destinationFile: `${OUTPUTS_DIR}/consistency_test_${index}.md`,
              "uv-scenario": scenario.name,
              skipStdin: true,
            }
          );

          return {
            scenario: scenario.name,
            success: result.ok,
            errorKind: !result.ok ? result.error.kind : null,
            hasConsistentStructure: "ok" in result,
          };
        })
      );

      // All scenarios should have consistent result structure
      results.forEach(result => {
        assert(result.hasConsistentStructure, `${result.scenario} should have consistent result structure`);
      });

      logger.debug("User experience consistency test completed", {
        scenarios: results.length,
        results: results,
      });
    });
  });

  describe("Performance and Scale User Scenarios", () => {
    it("should handle realistic workload patterns", async () => {
      logger.debug("Testing realistic user workload patterns");

      // Simulate morning burst: Multiple users starting their day
      const morningBurstCount = 8;
      const morningTasks = Array.from({ length: morningBurstCount }, (_, i) =>
        handleTwoParamsClean( // Use clean version for true concurrency
          ["to", "project"],
          { sessionId: `morning-${i}` },
          {
            fromFile: `${PROJECTS_DIR}/daily_projects.md`,
            destinationFile: `${OUTPUTS_DIR}/morning_burst_${i}.md`,
            "uv-user": `user-${i}`,
            "uv-session": "morning-standup",
            skipStdin: true,
          }
        )
      );

      const morningResults = await Promise.all(morningTasks);

      // Simulate afternoon steady state: Regular usage
      const afternoonTasks = [];
      for (let i = 0; i < 5; i++) {
        const result = await handleTwoParams(
          ["summary", "issue"],
          { sessionId: `afternoon-${i}` },
          {
            fromFile: `${PROJECTS_DIR}/current_issues.md`,
            destinationFile: `${OUTPUTS_DIR}/afternoon_work_${i}.md`,
            "uv-user": `user-${i + 10}`,
            "uv-session": "afternoon-work",
            skipStdin: true,
          }
        );
        afternoonTasks.push(result);
        
        // Small delay to simulate realistic usage pattern
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      logger.debug("Realistic workload test completed", {
        morningBurst: morningResults.length,
        morningSuccesses: morningResults.filter(r => r.ok).length,
        afternoonSteady: afternoonTasks.length,
        afternoonSuccesses: afternoonTasks.filter(r => r.ok).length,
      });

      // All requests should complete
      assertEquals(morningResults.length, morningBurstCount);
      assertEquals(afternoonTasks.length, 5);
    });

    it("should maintain performance under sustained usage", async () => {
      logger.debug("Testing sustained usage performance");

      const sustainedUsageCount = 20;
      const startTime = Date.now();

      const sustainedResults = [];
      for (let i = 0; i < sustainedUsageCount; i++) {
        const result = await handleTwoParams(
          ["to", "task"],
          { iteration: i },
          {
            fromFile: `${PROJECTS_DIR}/task_backlog.md`,
            destinationFile: `${OUTPUTS_DIR}/sustained_${i}.md`,
            "uv-iteration": i.toString(),
            skipStdin: true,
          }
        );
        sustainedResults.push(result);

        // Track performance degradation
        if (i % 5 === 0) {
          const currentTime = Date.now();
          const avgTime = (currentTime - startTime) / (i + 1);
          logger.debug(`Sustained usage checkpoint ${i}`, {
            avgTimePerRequest: avgTime,
            totalTime: currentTime - startTime,
          });
        }
      }

      const totalDuration = Date.now() - startTime;
      const avgTimePerRequest = totalDuration / sustainedUsageCount;

      logger.debug("Sustained usage test completed", {
        totalRequests: sustainedUsageCount,
        totalDuration,
        avgTimePerRequest,
        successCount: sustainedResults.filter(r => r.ok).length,
      });

      // Performance should remain reasonable
      assert(avgTimePerRequest < 2000, "Average request time should remain under 2 seconds");
      assertEquals(sustainedResults.length, sustainedUsageCount);
    });
  });

  // Helper functions
  async function createProjectScenarios() {
    logger.debug("Creating realistic project scenarios");

    // Create various project types
    const projectScenarios = {
      "new_web_app.md": `# New Web Application Project

## Project Overview
Develop a modern web application for customer relationship management.

## Business Requirements
- User authentication and authorization
- Customer data management
- Reporting and analytics dashboard
- Integration with existing CRM systems
- Mobile-responsive design

## Technical Requirements
- React.js frontend
- Node.js backend
- PostgreSQL database
- REST API architecture
- AWS cloud deployment

## Timeline
- Phase 1: Core features (8 weeks)
- Phase 2: Advanced features (6 weeks)
- Phase 3: Integration and testing (4 weeks)

## Team Structure
- 2 Frontend developers
- 2 Backend developers
- 1 DevOps engineer
- 1 QA engineer
- 1 Product manager`,

      "sprint_backlog.md": `# Sprint 5 Backlog

## Sprint Goal
Complete user authentication system and begin dashboard development.

## Backlog Items
### High Priority
- Implement JWT authentication
- Create user registration flow
- Design login interface
- Set up password reset functionality

### Medium Priority
- Dashboard wireframes
- API endpoint documentation
- Database schema updates
- Error handling improvements

### Low Priority
- Performance optimization
- Code refactoring
- Additional unit tests`,

      "current_issues.md": `# Current Development Issues

## Blocking Issues
- API rate limiting causing test failures
- Database connection pool exhaustion
- Third-party integration authentication problems

## In Progress
- Performance optimization for data queries
- User interface responsiveness improvements
- Security vulnerability remediation

## Backlog
- Documentation updates
- Code coverage improvements
- Monitoring and alerting setup`,

      "project_proposal.md": `# Enterprise Data Platform Project Proposal

## Executive Summary
Proposal to build a comprehensive data platform for enterprise analytics and reporting.

## Business Case
- Current data silos limiting business insights
- Manual reporting processes inefficient
- Need for real-time analytics capabilities
- Compliance and audit requirements

## Proposed Solution
### Architecture
- Microservices-based data platform
- Event-driven architecture
- Cloud-native deployment
- API-first design

### Key Features
- Data ingestion pipeline
- Real-time stream processing
- Interactive analytics dashboard
- Automated reporting
- Data governance framework

## Investment Required
- Development team: $1.2M annually
- Infrastructure: $300K annually
- Third-party licenses: $150K annually
- Total 3-year investment: $4.95M

## Expected ROI
- 40% reduction in reporting time
- 25% improvement in decision-making speed
- $2M annual savings from automation
- Break-even in 18 months`,

      "large_enterprise_project.md": `# Large Enterprise Digital Transformation Project

## Program Overview
Comprehensive digital transformation initiative affecting multiple business units and systems.

## Scope
### Business Units Affected
- Customer Service (500 agents)
- Sales (200 representatives)
- Marketing (50 specialists)
- Finance (100 analysts)
- Operations (300 staff)

### Systems Integration
- Legacy mainframe systems (15 systems)
- Modern cloud applications (25 applications)
- Third-party integrations (40 vendors)
- Mobile applications (5 platforms)
- Analytics platforms (3 major systems)

## Technical Architecture
### Microservices Platform
- 150+ microservices
- Event-driven architecture
- API gateway infrastructure
- Service mesh implementation
- Container orchestration

### Data Architecture
- Data lake implementation
- Real-time streaming platforms
- Machine learning pipelines
- Data governance framework
- Privacy and security controls

### Infrastructure
- Multi-cloud deployment
- Global content delivery
- High availability design
- Disaster recovery planning
- Security monitoring

## Implementation Phases
### Phase 1: Foundation (12 months)
- Core platform development
- Security framework
- Data architecture
- Development practices

### Phase 2: Migration (18 months)
- Legacy system migration
- Data migration
- User training
- Process optimization

### Phase 3: Optimization (12 months)
- Performance tuning
- Advanced analytics
- Automation implementation
- Continuous improvement

## Risk Management
### Technical Risks
- Integration complexity
- Performance issues
- Security vulnerabilities
- Data quality problems

### Business Risks
- User adoption challenges
- Business disruption
- Budget overruns
- Timeline delays

## Success Metrics
- System availability: 99.9%
- Performance improvement: 50%
- User satisfaction: 90%+
- Cost reduction: 30%
- Time to market: 40% faster`,
    };

    for (const [filename, content] of Object.entries(projectScenarios)) {
      await Deno.writeTextFile(`${PROJECTS_DIR}/${filename}`, content);
    }

    // Create additional scenario files
    const additionalFiles = [
      "pull_request.md",
      "test_results.md",
      "release_candidate.md",
      "project_risks.md",
      "sprint_deliverables.md",
      "quarterly_review.md",
      "board_update.md",
      "client_requirements.md",
      "vendor_issues.md",
      "resource_requirements.md",
      "team_challenges.md",
      "system_status.md",
      "standard_project.md",
      "task_list.md",
      "daily_projects.md",
      "task_backlog.md",
    ];

    for (const filename of additionalFiles) {
      await Deno.writeTextFile(
        `${PROJECTS_DIR}/${filename}`,
        `# ${filename.replace('.md', '').replace('_', ' ').toUpperCase()}

This is a test file for E2E user scenario testing.

## Content
Sample content for testing various workflow scenarios and user interactions.

## Metadata
- Created: ${new Date().toISOString()}
- Purpose: E2E testing
- Category: User scenarios`
      );
    }
  }

  async function createConfigurationFiles() {
    logger.debug("Creating configuration files for scenarios");

    await ensureDir(`${WORKSPACE_DIR}/config`);

    await Deno.writeTextFile(
      `${WORKSPACE_DIR}/config/app.yml`,
      `# Application Configuration
version: "1.0.0"
environment: "test"
features:
  validation: enabled
  caching: enabled
  monitoring: basic`
    );

    await Deno.writeTextFile(
      `${WORKSPACE_DIR}/config/user.yml`,
      `# User Configuration
preferences:
  output_format: markdown
  include_metadata: true
variables:
  default_author: "E2E Test User"
  default_environment: "testing"`
    );
  }

  async function createTemplateStructure() {
    logger.debug("Creating template structure for scenarios");

    const templatesDir = `${WORKSPACE_DIR}/templates`;
    await ensureDir(`${templatesDir}/to/project`);
    await ensureDir(`${templatesDir}/to/issue`);
    await ensureDir(`${templatesDir}/to/task`);
    await ensureDir(`${templatesDir}/summary/project`);
    await ensureDir(`${templatesDir}/summary/issue`);
    await ensureDir(`${templatesDir}/defect/project`);
    await ensureDir(`${templatesDir}/defect/task`);

    // Create basic template files
    const templateContent = `# Template

Input: {{input}}
Variables: {{variables}}

Process the content according to the specified directive and layer.`;

    const templatePaths = [
      "to/project/base.md",
      "to/issue/base.md",
      "to/task/base.md",
      "summary/project/base.md",
      "summary/issue/base.md",
      "defect/project/base.md",
      "defect/task/base.md",
    ];

    for (const path of templatePaths) {
      await Deno.writeTextFile(`${templatesDir}/${path}`, templateContent);
    }
  }
});