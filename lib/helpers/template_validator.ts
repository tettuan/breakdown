/**
 * Template Validator Module
 *
 * exampleス実行前のテンプレート確認・補完機能を提供
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

    for (const mapping of this.templateMappings) {
      if (!mapping.required) continue;

      const destinationPath = join(this.projectRoot, mapping.destination);
      const templateExists = await exists(destinationPath);

      if (templateExists) {
        existingTemplates.push(mapping.destination);
      } else {
        missingTemplates.push(mapping.destination);
      }
    }

    const totalRequired = this.templateMappings.filter((m) => m.required).length;
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
    const generated: string[] = [];
    const failed: { template: string; error: string }[] = [];

    for (const mapping of this.templateMappings) {
      if (!mapping.required) continue;

      const sourcePath = join(this.projectRoot, mapping.source);
      const destinationPath = join(this.projectRoot, mapping.destination);

      // Skip if destination already exists
      if (await exists(destinationPath)) {
        continue;
      }

      try {
        // Check if source exists
        if (!(await exists(sourcePath))) {
          failed.push({
            template: mapping.destination,
            error: `Source template not found: ${mapping.source}`,
          });
          continue;
        }

        // Create destination directory
        const destinationDir = destinationPath.substring(0, destinationPath.lastIndexOf("/"));
        await Deno.mkdir(destinationDir, { recursive: true });

        // Copy template file
        await Deno.copyFile(sourcePath, destinationPath);
        generated.push(mapping.destination);
      } catch (error) {
        failed.push({
          template: mapping.destination,
          error: error instanceof Error ? error.message : String(error),
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
    console.log(`✅ All ${validation.totalRequired} required templates are present`);
  } else {
    console.warn(
      `❌ ${validation.missingTemplates.length}/${validation.totalRequired} templates missing:`,
    );
    for (const missing of validation.missingTemplates) {
      console.warn(`   - ${missing}`);
    }
    console.log("\n💡 Run: bash scripts/template_generator.sh generate");
  }

  // Perform preflight check
  const preflight = await validator.preflightCheck();

  if (preflight.ready) {
    console.log("🚀 Examples are ready to run!");
  } else {
    console.warn("\n⚠️  Issues detected:");
    for (const issue of preflight.issues) {
      console.warn(`   ${issue}`);
    }

    if (preflight.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      for (const rec of preflight.recommendations) {
        console.log(`   ${rec}`);
      }
    }
  }
}
