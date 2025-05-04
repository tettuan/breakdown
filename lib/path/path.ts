import { join } from "@std/path/join";
import { crypto } from "jsr:@std/crypto@^0.224.0";
import { PromptVariablesFactory } from "../factory/PromptVariablesFactory.ts";

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
 * パス解決をPromptVariablesFactory経由で一元化
 */
export function autoCompletePath(
  _filePath: string | undefined,
  _demonstrative: string,
  factory: PromptVariablesFactory
): string {
  return factory.inputFilePath;
}

/**
 * プロンプトファイルパスを取得
 */
export function getPromptPath(factory: PromptVariablesFactory): string {
  return factory.promptFilePath;
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

/**
 * パス解決のためのラッパークラス（PromptVariablesFactoryを内部で利用）
 */
export class PathResolver {
  private factory: PromptVariablesFactory;

  constructor(factory: PromptVariablesFactory) {
    this.factory = factory;
  }

  getInputPath(): string {
    return this.factory.inputFilePath;
  }

  getOutputPath(): string {
    return this.factory.outputFilePath;
  }

  getPromptPath(): string {
    return this.factory.promptFilePath;
  }

  getSchemaPath(): string {
    return this.factory.schemaFilePath;
  }
}
