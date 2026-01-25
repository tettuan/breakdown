/**
 * @fileoverview Version management for external dependencies
 *
 * This module centralizes version management for all external dependencies,
 * eliminating hardcoded versions throughout the codebase.
 *
 * @module config/versions
 */

/**
 * External dependency versions
 */
export const DEPENDENCY_VERSIONS = {
  /** BreakdownConfig package version */
  BREAKDOWN_CONFIG: "^1.2.0",

  /** BreakdownParams package version */
  BREAKDOWN_PARAMS: "^1.1.1",

  /** BreakdownPrompt package version */
  BREAKDOWN_PROMPT: "^1.2.4",

  /** BreakdownLogger package version */
  BREAKDOWN_LOGGER: "^1.0.8",

  /** Standard library versions */
  STD: {
    YAML: "^1.0.6",
    PATH: "^0.224.0",
    FS: "^0.224.0",
  },
} as const;

import { error, ok, type Result } from "../types/result.ts";
import { ErrorFactory, type ValidationError } from "../types/unified_error_types.ts";

/**
 * Get JSR import URL for a dependency
 * @returns Result with import URL on success, ValidationError on failure
 */
export function getJsrImport(packageName: string): Result<string, ValidationError> {
  switch (packageName) {
    case "BREAKDOWN_CONFIG":
      return ok(`jsr:@tettuan/breakdownconfig@${DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG}`);
    case "BREAKDOWN_PARAMS":
      return ok(`jsr:@tettuan/breakdownparams@${DEPENDENCY_VERSIONS.BREAKDOWN_PARAMS}`);
    case "BREAKDOWN_PROMPT":
      return ok(`jsr:@tettuan/breakdownprompt@${DEPENDENCY_VERSIONS.BREAKDOWN_PROMPT}`);
    case "BREAKDOWN_LOGGER":
      return ok(`jsr:@tettuan/breakdownlogger@${DEPENDENCY_VERSIONS.BREAKDOWN_LOGGER}`);
    default:
      return error(ErrorFactory.validationError(
        "InvalidInput",
        {
          field: "packageName",
          value: packageName,
          reason: `Unknown package: ${packageName}`,
          context: {
            availablePackages: Object.keys(DEPENDENCY_VERSIONS).filter((k) => k !== "STD"),
          },
        },
      ));
  }
}

/**
 * Version compatibility checks
 */
export interface VersionRequirement {
  minimum: string;
  maximum?: string;
  recommended: string;
}

/**
 * Version requirements for each dependency
 */
export const VERSION_REQUIREMENTS: Record<string, VersionRequirement> = {
  BREAKDOWN_CONFIG: {
    minimum: "1.2.0",
    recommended: "1.2.0",
  },
  BREAKDOWN_PARAMS: {
    minimum: "1.1.0",
    recommended: "1.1.1",
  },
  BREAKDOWN_PROMPT: {
    minimum: "1.2.0",
    recommended: "1.2.4",
  },
  BREAKDOWN_LOGGER: {
    minimum: "1.0.8",
    recommended: "1.0.8",
  },
};

/**
 * Check if a version satisfies requirements
 */
export function checkVersionCompatibility(
  packageName: string,
  currentVersion: string,
): { compatible: boolean; message?: string } {
  const requirement = VERSION_REQUIREMENTS[packageName];
  if (!requirement) {
    return { compatible: true };
  }

  // Simple version comparison (can be enhanced with semver library)
  const current = parseVersion(currentVersion);
  const minimum = parseVersion(requirement.minimum);

  if (compareVersions(current, minimum) < 0) {
    return {
      compatible: false,
      message: `${packageName} version ${currentVersion} is below minimum ${requirement.minimum}`,
    };
  }

  if (requirement.maximum) {
    const maximum = parseVersion(requirement.maximum);
    if (compareVersions(current, maximum) > 0) {
      return {
        compatible: false,
        message: `${packageName} version ${currentVersion} exceeds maximum ${requirement.maximum}`,
      };
    }
  }

  return { compatible: true };
}

/**
 * Parse version string to comparable format
 */
function parseVersion(version: string): number[] {
  // Remove ^ or ~ prefix
  const cleanVersion = version.replace(/^[\^~]/, "");
  return cleanVersion.split(".").map((v) => parseInt(v, 10));
}

/**
 * Compare two version arrays
 */
function compareVersions(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const aVal = a[i] || 0;
    const bVal = b[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
}
