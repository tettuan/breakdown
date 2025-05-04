import { PromptManager } from "../deps.ts";
import { join, normalize } from "@std/path";
import { exists } from "@std/fs";
import { basename } from "@std/path/basename";
import { CliError, CliErrorCode } from "../cli/errors.ts";

// Define valid demonstrative types at runtime
const VALID_DEMONSTRATIVE_TYPES = ["to", "summary", "defect"] as const;

/**
 * Sanitize a path for use in prompt processing
 * @param path The path to sanitize
 * @returns The sanitized path
 */
export function sanitizePathForPrompt(path: string): string {
  // Handle null or undefined input
  if (!path) {
    return "";
  }

  // Remove any absolute path indicators and normalize slashes
  let sanitizedPath = path.replace(/\\/g, "/").replace(/^[\/\\]/, "");

  // Normalize multiple slashes
  sanitizedPath = sanitizedPath.replace(/\/+/g, "/");

  // Remove trailing slash
  sanitizedPath = sanitizedPath.replace(/\/$/, "");

  // Split path into segments and process each segment
  const parts = sanitizedPath.split("/");
  const sanitizedParts = parts.map((part) => {
    // Replace any non-ASCII segment with a single underscore
    if (/[^\p{ASCII}]/u.test(part)) {
      return "_";
    }
    // Replace spaces and special characters with underscores
    return part.replace(/[^a-zA-Z0-9\-_\.]/g, "_");
  });

  // Handle directory traversal
  const stack: string[] = [];
  for (const part of sanitizedParts) {
    if (part === "." || part === "") {
      continue;
    } else if (part === "..") {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  return stack.join("/");
}

/**
 * Ensure a path is absolute and normalized
 * @param path The path to resolve
 * @param baseDir The base directory to resolve relative paths against
 * @returns The absolute path
 */
function ensureAbsolutePath(path: string, baseDir: string): string {
  if (path.startsWith("/")) {
    return normalize(path);
  }
  return normalize(join(baseDir, path));
}

/**
 * Load a prompt file and replace variables using BreakdownPrompt
 * @param promptBaseDir Base directory for prompts
 * @param demonstrativeType The type of demonstrative
 * @param layer The layer type
 * @param fromFile The source file
 * @param destinationPath The destination path
 * @param fromLayerType The input layer type (project/issue/task)
 * @param logger Optional logger instance (for test/debug only)
 * @param adaptation Optional adaptation variant
 * @returns The loaded prompt content with variables replaced
 * @throws {Error} When prompt loading or processing fails
 */
export async function loadPrompt(
  promptBaseDir: string,
  demonstrativeType: string,
  layer: string,
  fromFile: string,
  destinationPath: string,
  fromLayerType: string,
  logger?: { debug: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
  adaptation?: string,
): Promise<{ success: boolean; content: string }> {
  try {
    // Validate inputs
    if (!promptBaseDir || promptBaseDir.trim() === "") {
      throw new CliError(
        CliErrorCode.INVALID_PARAMETERS,
        "Prompt base_dir must be set. No fallback allowed.",
      );
    }
    if (!demonstrativeType || !layer) {
      throw new CliError(CliErrorCode.INVALID_PARAMETERS, "Invalid input parameters");
    }
    // demonstrativeTypeバリデーション
    if (!((VALID_DEMONSTRATIVE_TYPES as readonly string[]).includes(demonstrativeType))) {
      return Promise.reject(
        new CliError(
          CliErrorCode.INVALID_PARAMETERS,
          `Unsupported demonstrative type: ${demonstrativeType}`,
        ),
      );
    }
    // layerバリデーション
    const validLayers = ["project", "issue", "task"];
    if (!validLayers.includes(layer)) {
      return {
        success: false,
        content: `Invalid layer type: ${layer}`,
      };
    }

    logger?.debug("Loading prompt", {
      promptBaseDir,
      demonstrativeType,
      layer,
      fromFile,
      destinationPath,
      fromLayerType,
      adaptation,
    });

    // Ensure absolute paths
    const currentDir = Deno.cwd();
    const absolutePromptBaseDir = ensureAbsolutePath(promptBaseDir, currentDir);
    const sanitizedDemonstrativeType = sanitizePathForPrompt(demonstrativeType);
    const sanitizedLayer = sanitizePathForPrompt(layer);
    const sanitizedFromLayerType = sanitizePathForPrompt(fromLayerType);

    // Debug: Output config file path and loaded config if DEBUG is set
    if (Deno.env.get("DEBUG")) {
      try {
        const cwd = Deno.cwd();
        console.log("[DEBUG] current working directory:", cwd);
      } catch (e) {
        console.log(
          "[DEBUG] failed to get current working directory:",
          e instanceof Error ? e.message : String(e),
        );
      }
      try {
        const configPath = Deno.realPathSync("./.agent/breakdown/config/app.yml");
        const configText = await Deno.readTextFile(configPath);
        console.log("[DEBUG] app.yml path:", configPath);
        console.log("[DEBUG] app.yml content:\n", configText);
      } catch (e) {
        console.log(
          "[DEBUG] app.yml not found or unreadable:",
          e instanceof Error ? e.message : String(e),
        );
      }
      try {
        const userConfigPath = Deno.realPathSync("./.agent/breakdown/config/user.yml");
        const userConfigText = await Deno.readTextFile(userConfigPath);
        console.log("[DEBUG] user.yml path:", userConfigPath);
        console.log("[DEBUG] user.yml content:\n", userConfigText);
      } catch (e) {
        console.log(
          "[DEBUG] user.yml not found or unreadable:",
          e instanceof Error ? e.message : String(e),
        );
      }
    }

    // Construct the prompt file name based on fromLayerType and adaptation
    const promptFileName = `f_${sanitizedFromLayerType}${adaptation ? `_${adaptation}` : ""}.md`;
    const promptPath = join(
      absolutePromptBaseDir,
      sanitizedDemonstrativeType,
      sanitizedLayer,
      promptFileName,
    );

    if (Deno.env.get("DEBUG")) {
      console.log("[DEBUG] prompt template path:", promptPath);
    }

    // If the adapted prompt doesn't exist, try the default prompt
    if (adaptation && !await exists(promptPath)) {
      const defaultPromptPath = join(
        absolutePromptBaseDir,
        sanitizedDemonstrativeType,
        sanitizedLayer,
        `f_${sanitizedFromLayerType}.md`,
      );
      if (!await exists(defaultPromptPath)) {
        throw new CliError(
          CliErrorCode.INVALID_PARAMETERS,
          `Prompt loading failed: template not found (promptBaseDir='${promptBaseDir}', demonstrativeType='${demonstrativeType}', layer='${layer}', adaptation='${adaptation}')`,
        );
      }
      logger?.debug("Adaptation prompt not found, falling back to default", {
        adaptation,
        defaultPath: defaultPromptPath,
      });
      return await loadPrompt(
        promptBaseDir,
        demonstrativeType,
        layer,
        fromFile,
        destinationPath,
        fromLayerType,
        logger,
      );
    }

    // Check if the prompt template exists
    if (!await exists(promptPath)) {
      throw new CliError(
        CliErrorCode.INVALID_PARAMETERS,
        `Prompt loading failed: template not found (promptPath='${promptPath}')`,
      );
    }

    // Check if the input file exists and ensure absolute path
    const absoluteFromFile = fromFile ? ensureAbsolutePath(fromFile, currentDir) : "";
    if (absoluteFromFile && !await exists(absoluteFromFile)) {
      throw new CliError(CliErrorCode.INVALID_PARAMETERS, `No such file: ${fromFile}`);
    }

    // Debug: print template path and permissions before calling generatePrompt
    if (logger) logger.debug("[DEBUG] About to read template file", { promptPath });
    let content = "";
    try {
      const stat = await Deno.stat(promptPath);
      if (logger) logger.debug("[DEBUG] Template file stat", { stat });
      content = await Deno.readTextFile(promptPath);
      if (logger) logger.debug("[DEBUG] Template file read success", { length: content.length });
    } catch (e) {
      if (logger) {
        logger.error("[DEBUG] Direct readTextFile/stat error", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // Initialize BreakdownPrompt
    const prompt = new PromptManager();

    // Read the input file content for input_text
    let inputText = "";
    if (absoluteFromFile && await exists(absoluteFromFile)) {
      inputText = await Deno.readTextFile(absoluteFromFile);
    }

    // JSON schema path
    const schemaPath = join(absolutePromptBaseDir, "schema", "implementation.json");
    if (Deno.env.get("DEBUG")) {
      console.log("[DEBUG] JSON schema path:", schemaPath);
    }

    // Prepare variables for PromptManager
    const variables = {
      schema_file: schemaPath,
      input_text: inputText,
      input_markdown_file: absoluteFromFile ? basename(absoluteFromFile) : "",
      destination_path: destinationPath ? sanitizePathForPrompt(destinationPath) : "output.md",
      fromLayerType,
    };
    if (Deno.env.get("DEBUG")) {
      console.log("[DEBUG] variables for PromptManager:", JSON.stringify(variables, null, 2));
    }

    // Remove testLogger and BreakdownLogger debug logging
    // Only keep application logic and comments
    const result = await prompt.generatePrompt(
      promptPath,
      variables,
    );

    if (!result.success) {
      throw new CliError(CliErrorCode.INVALID_PARAMETERS, result.error);
    }

    logger?.debug("Resolved prompt path", { promptPath, absolutePromptBaseDir });

    return {
      success: true,
      content: result.prompt || "",
    };
  } catch (error) {
    logger?.error("Failed to generate prompt:", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return {
      success: false,
      content: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Process a file with a prompt template
 *
 * According to the specification, this function:
 * - Selects the appropriate prompt template based on parameters
 * - Substitutes variables in the template
 * - Embeds schema reference information
 * - Returns the generated prompt string (never writes to a file)
 *
 * @param baseDir Base directory for prompts
 * @param demonstrativeType The type of demonstrative
 * @param layer The layer type
 * @param fromFile The source file
 * @param destinationPath The destination path (used as a variable, not for writing)
 * @param fromLayerType The input layer type (project/issue/task)
 * @param logger Optional logger instance (for test/debug only)
 * @param adaptation Optional adaptation variant
 * @returns The processed prompt content (never written to a file)
 */
export async function processWithPrompt(
  baseDir: string,
  demonstrativeType: string,
  layer: string,
  fromFile: string,
  destinationPath: string,
  fromLayerType: string,
  logger?: { debug: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
  adaptation?: string,
): Promise<{ success: boolean; content: string }> {
  // fromLayerTypeが未指定の場合は推論
  let resolvedFromLayerType = fromLayerType;
  if (!resolvedFromLayerType) {
    if (fromFile.includes("project")) {
      resolvedFromLayerType = "project";
    } else if (fromFile.includes("issue")) {
      resolvedFromLayerType = "issue";
    } else if (fromFile.includes("task")) {
      resolvedFromLayerType = "task";
    } else {
      resolvedFromLayerType = layer;
    }
  }
  const result = await loadPrompt(
    baseDir,
    demonstrativeType,
    layer,
    fromFile,
    destinationPath,
    resolvedFromLayerType,
    logger,
    adaptation,
  );

  return result;
}
