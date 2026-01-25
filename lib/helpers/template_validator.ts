/**
 * Template Validator Module
 *
 * Provides template validation and completion functionality before running examples
 *
 * @module
 */

import { exists } from "@std/fs";
import { join } from "@std/path";
import { DEFAULT_WORKSPACE_ROOT } from "../config/constants.ts";

/**
 * Template validation result
 */
export interface TemplateValidation_Result {
  /** Whether all required templates exist */
  isValid: boolean;
  /** List of missing template files */
  missingTemplates: string[];
  /** List of existing template files */
  existingTemplates: string[];
  /** Total number of required templates */
  totalRequired: number;
}

/**
 * Template mapping configuration
 */
export interface TemplateMapping {
  /** Source template path (relative to project root) */
  source: string;
  /** Destination template path (relative to project root) */
  destination: string;
  /** Whether this template is required for examples */
  required: boolean;
}

/**
 * Default template mappings for examples
 */
export const DEFAULT_TEMPLATE_MAPPINGS: TemplateMapping[] = [
  {
    source: "lib/breakdown/prompts/summary/issue/f_issue.md",
    destination: "examples/prompts/summary/issue/f_issue.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/summary/project/f_project.md",
    destination: "examples/prompts/summary/project/f_project.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/defect/issue/f_issue.md",
    destination: "examples/prompts/defect/issue/f_issue.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/dev/defect/issue/f_issue.md",
    destination: "examples/prompts/dev/defect/issue/f_issue.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/find/bugs/f_bugs.md",
    destination: "examples/prompts/find/bugs/f_bugs.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/prod/defect/issue/f_issue.md",
    destination: "examples/prompts/prod/defect/issue/f_issue.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/production/defect/issue/f_issue.md",
    destination: "examples/prompts/production/defect/issue/f_issue.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/staging/defect/issue/f_issue.md",
    destination: "examples/prompts/staging/defect/issue/f_issue.md",
    required: true,
  },
  {
    source: "lib/breakdown/prompts/team/to/task/f_task.md",
    destination: "examples/prompts/team/to/task/f_task.md",
    required: true,
  },
];

/**
 * Template Validator Class
 */
export class TemplateValidator {
  private projectRoot: string;
  private templateMappings: TemplateMapping[];

  constructor(projectRoot: string, templateMappings?: TemplateMapping[]) {
    this.projectRoot = projectRoot;
    this.templateMappings = templateMappings || DEFAULT_TEMPLATE_MAPPINGS;
  }

  /**
   * Validate all required templates exist
   */
  async validateTemplates(): Promise<TemplateValidation_Result> {
    const missingTemplates: string[] = [];
    const existingTemplates: string[] = [];

    const requiredMappings = this.templateMappings.filter((m) => m.required);

    // Check all templates in parallel using Promise.all
    const results = await Promise.all(
      requiredMappings.map(async (mapping) => {
        const destinationPath = join(this.projectRoot, mapping.destination);
        const templateExists = await exists(destinationPath);
        return { mapping, templateExists };
      }),
    );

    for (const { mapping, templateExists } of results) {
      if (templateExists) {
        existingTemplates.push(mapping.destination);
      } else {
        missingTemplates.push(mapping.destination);
      }
    }

    const totalRequired = requiredMappings.length;
    const isValid = missingTemplates.length === 0;

    return {
      isValid,
      missingTemplates,
      existingTemplates,
      totalRequired,
    };
  }

  /**
   * Generate missing templates by copying from source
   */
  async generateMissingTemplates(): Promise<{
    generated: string[];
    failed: { template: string; error: string }[];
  }> {
    const requiredMappings = this.templateMappings.filter((m) => m.required);

    // Process all templates in parallel
    const results = await Promise.all(
      requiredMappings.map(async (mapping) => {
        const sourcePath = join(this.projectRoot, mapping.source);
        const destinationPath = join(this.projectRoot, mapping.destination);

        // Skip if destination already exists
        if (await exists(destinationPath)) {
          return { status: "skipped" as const, mapping };
        }

        try {
          // Check if source exists
          if (!(await exists(sourcePath))) {
            return {
              status: "failed" as const,
              mapping,
              error: `Source template not found: ${mapping.source}`,
            };
          }

          // Create destination directory
          const destinationDir = destinationPath.substring(0, destinationPath.lastIndexOf("/"));
          await Deno.mkdir(destinationDir, { recursive: true });

          // Copy template file
          await Deno.copyFile(sourcePath, destinationPath);
          return { status: "generated" as const, mapping };
        } catch (error) {
          return {
            status: "failed" as const,
            mapping,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    // Collect results
    const generated: string[] = [];
    const failed: { template: string; error: string }[] = [];

    for (const result of results) {
      if (result.status === "generated") {
        generated.push(result.mapping.destination);
      } else if (result.status === "failed") {
        failed.push({
          template: result.mapping.destination,
          error: result.error,
        });
      }
    }

    return { generated, failed };
  }

  /**
   * Pre-flight check for examples execution
   */
  async preflightCheck(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validate templates
    const validation = await this.validateTemplates();

    if (!validation.isValid) {
      issues.push(`Missing ${validation.missingTemplates.length} required templates`);
      recommendations.push("Run: bash scripts/template_generator.sh generate");

      for (const missing of validation.missingTemplates) {
        issues.push(`  - ${missing}`);
      }
    }

    // Check if examples directory structure exists
    const examplesDir = join(this.projectRoot, "examples");
    if (!(await exists(examplesDir))) {
      issues.push("Examples directory not found");
      recommendations.push("Ensure you're in the project root directory");
    }

    // Check if config directory exists
    const configDir = join(this.projectRoot, `examples/${DEFAULT_WORKSPACE_ROOT}/config`);
    if (!(await exists(configDir))) {
      issues.push("Config directory structure missing");
      recommendations.push("Run: deno run -A cli/breakdown.ts init (from examples directory)");
    }

    const ready = issues.length === 0;
    return { ready, issues, recommendations };
  }
}

/**
 * CLI utility function for template validation
 */
export async function validateTemplatesForExamples(projectRoot?: string): Promise<void> {
  const root = projectRoot || Deno.cwd();
  const validator = new TemplateValidator(root);

  const validation = await validator.validateTemplates();

  if (validation.isValid) {
    console.log(`[OK] All ${validation.totalRequired} required templates are present`);
  } else {
    console.warn(
      `[ERROR] ${validation.missingTemplates.length}/${validation.totalRequired} templates missing:`,
    );
    for (const missing of validation.missingTemplates) {
      console.warn(`   - ${missing}`);
    }
    console.log("\n[TIP] Run: bash scripts/template_generator.sh generate");
  }

  // Perform preflight check
  const preflight = await validator.preflightCheck();

  if (preflight.ready) {
    console.log("[READY] Examples are ready to run!");
  } else {
    console.warn("\n[WARNING] Issues detected:");
    for (const issue of preflight.issues) {
      console.warn(`   ${issue}`);
    }

    if (preflight.recommendations.length > 0) {
      console.log("\n[TIP] Recommendations:");
      for (const rec of preflight.recommendations) {
        console.log(`   ${rec}`);
      }
    }
  }
}
