import { join } from "jsr:@std/path@^0.224.0/join";
import { crypto } from "jsr:@std/crypto@^0.224.0";
import { getConfig } from "$lib/config/config.ts";

/**
 * Checks if a path points to a directory
 * @param path The path to check
 * @returns True if the path is a directory, false otherwise
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch (_error) {
    return false;
  }
}

/**
 * Normalizes a path by converting it to a proper file URL and back
 * @param path The path to normalize
 * @returns Normalized path starting with ./ or ../ as appropriate
 * @throws Error if path is empty
 */
export function normalizePath(path: string): string {
  if (!path) {
    throw new Error("Path is required");
  }

  // Convert Windows backslashes to forward slashes
  path = path.replace(/\\/g, "/");

  // Preserve relative path prefixes
  const parentDirMatches = path.match(/^(\.\.\/)+/);
  const parentDirPrefix = parentDirMatches ? parentDirMatches[0] : "";
  const isCurrentDir = path.startsWith("./");

  // Handle invalid URL schemes (but not file:// URLs) by preserving them
  if (path.includes("://") && !path.startsWith("file://")) {
    return path.startsWith("./") ? path : `./${path}`;
  }

  try {
    // For paths with spaces or special characters, we need to handle them differently
    if (path.includes(" ") || path.includes("%20")) {
      // Split the path into segments and handle each one
      const segments = path.split("/");
      const normalizedSegments = segments.map((segment) =>
        decodeURIComponent(segment.replace(/%20/g, " "))
      );
      path = normalizedSegments.join("/");
    } else {
      // For regular paths, use URL API
      const url = new URL(path, "file:///");
      path = decodeURIComponent(url.pathname).replace(/^\//, "");
    }
  } catch (_error) {
    // If URL parsing fails, use simple normalization
    path = path.replace(/^\.\//, "");
  }

  // Restore relative path prefixes or add ./ if needed
  if (parentDirPrefix) {
    return path.startsWith(parentDirPrefix) ? path : `${parentDirPrefix}${path}`;
  } else if (isCurrentDir) {
    return path.startsWith("./") ? path : `./${path}`;
  } else {
    return path.startsWith("./") ? path : `./${path}`;
  }
}

/**
 * Generates a default filename in the format YYYYMMDD_hash.md
 * @returns Generated filename
 */
export function generateDefaultFilename(): string {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    date.getDate().toString().padStart(2, "0");

  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const hash = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${dateStr}_${hash}.md`;
}

/**
 * Completes a file path based on the demonstrative type and configuration
 * @param filePath Optional file path to complete
 * @param demonstrative The demonstrative type
 * @returns Completed file path
 */
export function autoCompletePath(filePath: string | undefined, demonstrative: string): string {
  if (!filePath) {
    filePath = generateDefaultFilename();
  }

  try {
    // If it's already a valid URL path, just normalize it
    if (filePath.includes("/")) {
      return normalizePath(filePath);
    }

    const config = getConfig();
    const dirType = demonstrative === "to" ? "issue" : demonstrative;
    const baseUrl = new URL("file:///");

    // Build the path using URL
    const fullPath = join(config.working_dir, dirType + "s", filePath);
    const url = new URL(fullPath, baseUrl);
    return normalizePath(url.pathname);
  } catch (_error) {
    // If URL handling fails, fall back to simple path joining
    const config = getConfig();
    const dirType = demonstrative === "to" ? "issue" : demonstrative;
    return normalizePath(join(config.working_dir, dirType + "s", filePath));
  }
}

/**
 * Gets the prompt file path based on the given parameters
 * @param demonstrativeType The type of demonstrative
 * @param layerType The type of layer
 * @param fromFile The source file
 * @returns Path to the prompt file
 */
export function getPromptPath(
  demonstrativeType: string,
  layerType: string,
  fromFile: string,
): string {
  try {
    const config = getConfig();
    const baseDir = config.app_prompt?.base_dir || "./.agent/breakdown/prompts/";
    const fromType = fromFile.includes("project")
      ? "project"
      : fromFile.includes("issue")
      ? "issue"
      : fromFile.includes("task")
      ? "task"
      : layerType;

    const baseUrl = new URL("file:///");
    const fullPath = join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`);
    const url = new URL(fullPath, baseUrl);
    return normalizePath(url.pathname);
  } catch (_error) {
    // If URL handling fails, fall back to simple path joining
    const config = getConfig();
    const baseDir = config.app_prompt?.base_dir || "./.agent/breakdown/prompts/";
    const fromType = fromFile.includes("project")
      ? "project"
      : fromFile.includes("issue")
      ? "issue"
      : fromFile.includes("task")
      ? "task"
      : layerType;

    return normalizePath(join(baseDir, demonstrativeType, layerType, `f_${fromType}.md`));
  }
}

export interface PathResolverOptions {
  fromFile?: string;
  destinationFile?: string;
  fromLayerType?: string;
}

export interface PathResolverParams {
  demonstrativeType: string;
  layerType: string;
  options: PathResolverOptions;
}

export class PathResolver {
  private workingDir: string;

  constructor(workingDir: string) {
    this.workingDir = workingDir;
  }

  /**
   * Normalizes a path without adding the ./ prefix
   * @param path The path to normalize
   * @returns Normalized path
   */
  private normalizePath(path: string): string {
    if (!path) {
      throw new Error("Path is required");
    }

    // Convert Windows backslashes to forward slashes
    path = path.replace(/\\/g, "/");

    // Handle invalid URL schemes (but not file:// URLs)
    if (path.includes("://") && !path.startsWith("file://")) {
      throw new Error("Invalid URL scheme in path");
    }

    try {
      // For paths with spaces or special characters, we need to handle them differently
      if (path.includes(" ") || path.includes("%20")) {
        // Split the path into segments and handle each one
        const segments = path.split("/");
        const normalizedSegments = segments.map((segment) =>
          decodeURIComponent(segment.replace(/%20/g, " "))
        );
        return normalizedSegments.join("/");
      }

      // For regular paths, use URL API
      const url = new URL(path, "file:///");
      return decodeURIComponent(url.pathname).replace(/^\//, "");
    } catch (_error) {
      // If URL parsing fails, use simple normalization
      path = path.replace(/^\.\//, "");
    }

    return path;
  }

  async validateDirectoryStructure(): Promise<void> {
    // Ensure required directories exist
    const requiredDirs = ["project", "issue"];
    for (const dir of requiredDirs) {
      const dirPath = join(this.workingDir, dir);
      try {
        await Deno.mkdir(dirPath, { recursive: true });
      } catch (_error) {
        throw _error;
      }
    }
  }

  resolveInputPath(params: PathResolverParams): Promise<string> {
    const { fromFile, fromLayerType } = params.options;

    if (!fromFile) {
      return Promise.resolve("");
    }

    // If fromFile has path hierarchy, normalize it
    if (fromFile.includes("/") || fromFile.includes("\\")) {
      return Promise.resolve(this.normalizePath(fromFile));
    }

    // Use fromLayerType or layerType for directory
    const dirType = fromLayerType || params.layerType;
    return Promise.resolve(join(this.workingDir, dirType, fromFile));
  }

  async resolveOutputPath(params: PathResolverParams): Promise<string> {
    const { destinationFile } = params.options;

    if (!destinationFile) {
      // Generate default path
      return join(this.workingDir, params.layerType, this.generateDefaultFilename());
    }

    const fullPath = join(this.workingDir, destinationFile);

    // First check if the path exists and is a directory
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isDirectory) {
        return join(destinationFile, this.generateDefaultFilename());
      }
    } catch (_error) {
      // Path doesn't exist, continue with other checks
    }

    // If destinationFile has path hierarchy and extension
    if (
      (destinationFile.includes("/") || destinationFile.includes("\\")) &&
      destinationFile.includes(".")
    ) {
      return destinationFile;
    }

    // If destinationFile is filename only
    if (destinationFile.includes(".")) {
      return join(this.workingDir, params.layerType, destinationFile);
    }

    // If destinationFile has no extension, treat as directory
    return join(destinationFile, this.generateDefaultFilename());
  }

  private generateDefaultFilename(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");

    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const hash = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("").slice(0, 7);

    return `${dateStr}_${hash}.md`;
  }
}
