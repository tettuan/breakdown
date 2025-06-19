#!/usr/bin/env -S deno run -A
/**
 * Breakdown CLI - Main Entry Point
 *
 * Architecture:
 * - Delegates to BreakdownConfig, BreakdownParams, BreakdownPrompt
 * - Handles only config prefix detection and STDIN processing
 * - Follows the flow: config prefix � BreakdownParams � STDIN � BreakdownPrompt � output
 *
 * @module
 */

import { ConfigPrefixDetector } from "$lib/factory/config_prefix_detector.ts";
import { isStdinAvailable, readStdin } from "$lib/io/stdin.ts";
import { loadBreakdownConfig, loadConfig } from "$lib/config/loader.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { ParamsParser } from "@tettuan/breakdownparams";
import { PromptManager } from "@tettuan/breakdownprompt";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import {
  type PromptCliParams,
  PromptVariablesFactory,
} from "$lib/factory/prompt_variables_factory.ts";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";

/**
 * Main CLI entry point for direct execution
 */
async function main() {
  await runBreakdown();
}

/**
 * Handle two parameters case
 */
async function handleTwoParams(
  params: string[],
  config: Record<string, unknown>,
  options: Record<string, any>,
) {
  console.log("Processing two parameters:", params);

  // 6. Check STDIN and prepare input_text
  let inputText = "";
  try {
    // Check if fromFile option specifies stdin ("-")
    if (options.from === "-" || options.fromFile === "-") {
      console.log("Reading from STDIN...");
      inputText = await readStdin({ allowEmpty: false });
      console.log("✅ STDIN input received:", inputText.length, "characters");
    } else if (isStdinAvailable()) {
      console.log("STDIN data available, reading...");
      inputText = await readStdin({ allowEmpty: true });
      console.log("✅ STDIN input received:", inputText.length, "characters");
    }
  } catch (error) {
    console.warn(
      "⚠️ STDIN reading failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  // Extract demonstrativeType and layerType
  if (params.length >= 2) {
    const [demonstrativeType, layerType] = params;
    console.log(`Parameters: demonstrativeType="${demonstrativeType}", layerType="${layerType}"`);

    // Convert ParamsParser result to PromptCliParams
    const customVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(options)) {
      if (key.startsWith("uv-")) {
        const varName = key.slice(3); // Remove 'uv-' prefix
        customVariables[varName] = String(value);
      }
    }

    // Add input text as a custom variable if available
    if (inputText) {
      customVariables.input_text = inputText;
    }

    const cliParams: PromptCliParams = {
      demonstrativeType: demonstrativeType as DemonstrativeType,
      layerType: layerType as LayerType,
      options: {
        fromFile: options.from || options.fromFile,
        destinationFile: options.destination || options.output || "output.md",
        adaptation: options.adaptation,
        promptDir: options.promptDir,
        fromLayerType: options.fromLayerType,
        input_text: inputText,
        customVariables,
        extended: options.extended,
        customValidation: options.customValidation,
        errorFormat: options.errorFormat,
        config: options.config,
      },
    };

    // 7. Use PromptVariablesFactory to resolve paths and parameters
    try {
      const factory = PromptVariablesFactory.createWithConfig(config, cliParams);

      // Validate all parameters
      factory.validateAll();

      // Get all resolved parameters
      const allParams = factory.getAllParams();

      console.log(`📝 Processing with BreakdownPrompt:`);
      console.log(`   Template: ${allParams.promptFilePath}`);
      console.log(`   Output: ${allParams.outputFilePath}`);
      console.log(`   Variables:`, allParams.customVariables);

      // Use PromptManager with resolved paths
      const promptManager = new PromptManager();
      const result = await promptManager.generatePrompt(
        allParams.promptFilePath,
        allParams.customVariables || {},
      );

      // Extract the generated content from the result
      let content: string;
      if (result && typeof result === "object" && "success" in result) {
        const res = result as any;
        if (res.success) {
          content = res.prompt || "";
        } else {
          throw new Error(res.error || "Prompt generation failed");
        }
      } else {
        content = String(result);
      }

      // Write the result to output (file or stdout)
      if (allParams.outputFilePath === "stdout" || allParams.outputFilePath === "-") {
        console.log(content);
      } else {
        // Ensure output directory exists
        const outputDir = allParams.outputFilePath.substring(
          0,
          allParams.outputFilePath.lastIndexOf("/"),
        );
        if (outputDir) {
          await ensureDir(outputDir);
        }
        await Deno.writeTextFile(allParams.outputFilePath, content);
        console.log(`✅ Output written to: ${allParams.outputFilePath}`);
      }
    } catch (error) {
      console.error(
        `❌ BreakdownPrompt error:`,
        error instanceof Error ? error.message : String(error),
      );
      if (error instanceof Error) {
        console.error(`Stack trace:`, error.stack);
      }
      console.log(`🔄 Fallback: Would process ${demonstrativeType} ${layerType} manually`);
    }
  }
}

/**
 * Handle one parameter case
 */
async function handleOneParams(
  params: string[],
  config: Record<string, unknown>,
  options: Record<string, any>,
) {
  console.log("Processing one parameter:", params);

  if (params.length >= 1) {
    const [command] = params;
    console.log(`Command: "${command}"`);

    // Handle common one-parameter commands
    if (command === "init") {
      await initializeBreakdownConfiguration();
    } else if (command === "version") {
      console.log("Breakdown v1.0.13");
      console.log("Breakdown - AI Development Instruction Tool");
    } else if (command === "help") {
      console.log("Breakdown - AI Development Instruction Tool");
      console.log(`
Usage: breakdown [command] [options]

Commands:
  init                    Initialize breakdown configuration
  to <type> <layer>       Process with two parameters
  version                 Show version information
  help                    Show this help message

Options:
  --config/-c <prefix>    Use custom config prefix
  --help/-h               Show this help message
  --version/-v            Show version information

Examples:
  breakdown init
  breakdown to project --config=custom
  breakdown to issue < input.md
`);
    } else {
      console.log(`Would process single command: ${command}`);
    }
  }
}

/**
 * Handle zero parameters case
 */
async function handleZeroParams(
  args: string[],
  config: Record<string, unknown>,
  options: Record<string, any>,
) {
  console.log("Processing zero parameters (help/usage):", args);

  // Check for help flags or specific help requests
  if (args.includes("--help") || args.includes("-h") || args.includes("help")) {
    console.log("Breakdown - AI Development Instruction Tool");
    console.log(`
Usage: breakdown [command] [options]

Commands:
  init                    Initialize breakdown configuration
  to <type> <layer>       Process with two parameters
  version                 Show version information
  help                    Show this help message

Options:
  --config/-c <prefix>    Use custom config prefix
  --help/-h               Show this help message
  --version/-v            Show version information

Examples:
  breakdown init
  breakdown to project --config=custom
  breakdown to issue < input.md
`);
  } else if (args.includes("--version") || args.includes("-v")) {
    console.log("Breakdown v1.0.13");
    console.log("Breakdown - AI Development Instruction Tool");
  } else {
    console.log("Breakdown - AI Development Instruction Tool");
    console.log("No parameters provided. Use --help for usage information.");
  }
}

/**
 * Exported function for module use
 */
export async function runBreakdown(args: string[] = Deno.args): Promise<void> {
  try {
    //     // console.log("🔍 DEBUG: Starting runBreakdown with args:", args);

    // 1. Extract config prefix (minimal implementation - cannot use BreakdownParams yet)
    const configDetector = new ConfigPrefixDetector();
    const configPrefix = configDetector.detect(args);
    //     console.log("🔍 DEBUG: Detected config prefix:", configPrefix);

    // 2. Initialize BreakdownConfig with prefix (with error handling)
    let config: Record<string, unknown> = {};
    try {
      config = await loadBreakdownConfig(configPrefix, Deno.cwd());
      console.log("✅ Configuration loaded successfully");
    } catch (error) {
      console.warn(
        "⚠️ Configuration not found, using defaults:",
        error instanceof Error ? error.message : String(error),
      );
      // Use default configuration when config files are not found
      config = {
        app_prompt: {
          base_dir: ".agent/breakdown/prompts",
        },
        app_schema: {
          base_dir: ".agent/breakdown/schema",
        },
        working_dir: ".agent/breakdown",
      };
    }

    // 3. Pass BreakdownConfig settings to BreakdownParams
    //     console.log("🔍 DEBUG: Creating ParamsParser with config from BreakdownConfig");

    // Extract params configuration for CustomConfig
    let customConfig: any = undefined;

    // Check for params in different possible locations
    const paramsConfig = config.params || (config as any).breakdownParams?.customConfig;

    if (paramsConfig) {
      // If it's already a complete customConfig object (from breakdownParams.customConfig)
      if (paramsConfig.params && paramsConfig.validation) {
        // Ensure the validation structure is complete even for pre-built configs
        const validation: any = paramsConfig.validation || {};
        customConfig = {
          ...paramsConfig,
          validation: {
            zero: { allowedOptions: [], allowedValueOptions: [], ...(validation.zero || {}) },
            one: { allowedOptions: [], allowedValueOptions: [], ...(validation.one || {}) },
            two: { allowedOptions: [], allowedValueOptions: [], ...(validation.two || {}) },
          },
        };
      } else {
        // Otherwise build the customConfig object
        // Ensure validation has all required properties
        // Use default values that allow common options
        const defaultValidation = {
          zero: {
            allowedOptions: ["help", "version"],
            allowedValueOptions: [],
          },
          one: {
            allowedOptions: ["help", "version", "verbose"],
            allowedValueOptions: ["config"],
          },
          two: {
            allowedOptions: ["help", "version", "verbose", "experimental"],
            allowedValueOptions: ["from", "destination", "input", "output", "config"],
          },
        };

        const validation: any = config.validation || {};
        const mergedValidation = {
          zero: { ...defaultValidation.zero, ...(validation.zero || {}) },
          one: { ...defaultValidation.one, ...(validation.one || {}) },
          two: { ...defaultValidation.two, ...(validation.two || {}) },
        };

        customConfig = {
          params: paramsConfig,
          validation: mergedValidation,
          options: config.options || {},
          errorHandling: config.errorHandling || {
            unknownOption: "error",
            duplicateOption: "error",
            emptyValue: "error",
          },
        };
      }
      // console.log(
      //   "🔍 DEBUG: Using custom config for ParamsParser:",
      //   JSON.stringify(customConfig, null, 2),
      // );
    } else {
      //       console.log("⚠️ DEBUG: No params configuration found in config");
    }

    const paramsParser = new ParamsParser(undefined, customConfig);

    //     console.log("🔍 DEBUG: Calling parse() with args:", args);
    const result = paramsParser.parse(args);
    //     console.log("🔍 DEBUG: ParamsParser result:", JSON.stringify(result, null, 2));

    // 4. Determine zero/one/two params and branch
    if (result.type === "two") {
      await handleTwoParams(result.params, config, result.options);
    } else if (result.type === "one") {
      await handleOneParams(result.params, config, result.options);
    } else if (result.type === "zero") {
      await handleZeroParams(args, config, result.options);
    } else if (result.type === "error") {
      throw new Error(`Parameter parsing error: ${result.error?.message || "Unknown error"}`);
    } else {
      throw new Error(`Unknown result type: ${result.type}`);
    }

    console.log("Breakdown execution completed");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Initialize breakdown configuration and directory structure
 */
async function initializeBreakdownConfiguration(): Promise<void> {
  console.log("🚀 Initializing breakdown configuration...");

  // TODO: If BreakdownConfig had write functionality, baseDir definition would be unnecessary
  // BreakdownConfig already knows the appropriate paths and should handle initialization
  const baseDir = `${Deno.cwd()}/.agent/breakdown`;

  // Create directory structure
  // TODO: Layer-specific directories should be derived from BreakdownParams
  // e.g., const layerTypes = BreakdownParams.getDefaultLayerTypes();
  //       const directories = ["config", ...layerTypes.map(t => t + "s"), "temp", "prompts", "schema"];
  // This would dynamically create "projects", "issues", "tasks" based on defaults
  const directories = [
    "config",
    "projects",
    "issues",
    "tasks",
    "temp",
    "prompts",
    "schema",
  ];

  for (const dir of directories) {
    const dirPath = `${baseDir}/${dir}`;
    await ensureDir(dirPath);
    console.log(`✅ Created directory: ${dirPath}`);
  }

  // Create basic app.yml config file
  // TODO: Default patterns should be obtained from BreakdownParams
  // BreakdownParams should provide methods like:
  //   - getDefaultDemonstrativeTypes() => ["to", "summary", "defect"]
  //   - getDefaultLayerTypes() => ["project", "issue", "task"]
  // This ensures consistency across the ecosystem
  const configContent = `# Breakdown Configuration
app_prompt:
  base_dir: "lib/breakdown/prompts"
app_schema:
  base_dir: "lib/breakdown/schema"
params:
  two:
    demonstrativeType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
`;

  // TODO: BreakdownConfig should provide a write method for config files
  // This direct file writing should be delegated to BreakdownConfig
  const configPath = `${baseDir}/config/app.yml`;
  await Deno.writeTextFile(configPath, configContent);
  console.log(`✅ Created config file: ${configPath}`);

  console.log("🎉 Breakdown initialization completed successfully!");
}

if (import.meta.main) {
  await main();
}
