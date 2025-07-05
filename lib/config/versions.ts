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
  BREAKDOWN_CONFIG: "^1.1.4",

  /** BreakdownParams package version */
  BREAKDOWN_PARAMS: "^1.0.1",

  /** BreakdownPrompt package version */
  BREAKDOWN_PROMPT: "^1.0.0",

  /** BreakdownLogger package version */
  BREAKDOWN_LOGGER: "^1.0.0",

  /** Standard library versions */
  STD: {
    YAML: "^1.0.6",
    PATH: "^0.224.0",
    FS: "^0.224.0",
  },
} as const;

/**
 * Get JSR import URL for a dependency
 */
export function getJsrImport(packageName: keyof typeof DEPENDENCY_VERSIONS): string {
  const version = DEPENDENCY_VERSIONS[packageName];

  switch (packageName) {
    case "BREAKDOWN_CONFIG":
      return `jsr:@tettuan/breakdownconfig@${version}`;
    case "BREAKDOWN_PARAMS":
      return `jsr:@tettuan/breakdownparams@${version}`;
    case "BREAKDOWN_PROMPT":
      return `jsr:@tettuan/breakdownprompt@${version}`;
    case "BREAKDOWN_LOGGER":
      return `jsr:@tettuan/breakdownlogger@${version}`;
    default:
      throw new Error(`Unknown package: ${packageName}`);
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
    minimum: "1.1.0",
    recommended: "1.1.4",
  },
  BREAKDOWN_PARAMS: {
    minimum: "1.0.0",
    recommended: "1.0.1",
  },
  BREAKDOWN_PROMPT: {
    minimum: "1.0.0",
    recommended: "1.0.0",
  },
  BREAKDOWN_LOGGER: {
    minimum: "1.0.0",
    recommended: "1.0.0",
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
