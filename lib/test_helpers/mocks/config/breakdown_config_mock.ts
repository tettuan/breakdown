/**
 * BreakdownConfig Mock
 * Mock implementation of BreakdownConfig for testing purposes.
 * Simulates BreakdownConfig behavior and supports configuration management in test environments.
 */

export interface MockConfigProfile {
  name: string;
  workingDir?: string;
  resourceDir?: string;
  customPatterns?: {
    directiveType?: string;
    layerType?: string;
  };
}

export interface MockConfigResult {
  success: boolean;
  profileName?: string;
  workingDir?: string;
  resourceDir?: string;
  error?: string;
}

export class BreakdownConfigMock {
  private profiles: Map<string, MockConfigProfile> = new Map();
  private currentProfile = "default";

  constructor() {
    // Add default profile
    this.addProfile({
      name: "default",
      workingDir: "/tmp/test-working",
      resourceDir: "/tmp/test-resources",
      customPatterns: {
        directiveType: "^(to|summary|defect)$",
        layerType: "^(project|issue|task)$",
      },
    });
  }

  /**
   * Add a profile
   */
  addProfile(profile: MockConfigProfile): void {
    this.profiles.set(profile.name, profile);
  }

  /**
   * Set the current profile
   */
  setCurrentProfile(profileName: string): boolean {
    if (this.profiles.has(profileName)) {
      this.currentProfile = profileName;
      return true;
    }
    return false;
  }

  /**
   * Get configuration (simulates BreakdownConfig.get)
   */
  get(profilePrefix?: string): MockConfigResult {
    const profileName = profilePrefix || this.currentProfile;
    const profile = this.profiles.get(profileName);

    if (!profile) {
      return {
        success: false,
        error: `Profile '${profileName}' not found`,
      };
    }

    return {
      success: true,
      profileName: profile.name,
      workingDir: profile.workingDir,
      resourceDir: profile.resourceDir,
    };
  }

  /**
   * Get working directory
   */
  async getWorkingDir(profilePrefix?: string): Promise<string> {
    const result = await this.get(profilePrefix);
    return result.workingDir || "/tmp/default-working";
  }

  /**
   * Get resource directory
   */
  async getResourceDir(profilePrefix?: string): Promise<string> {
    const result = await this.get(profilePrefix);
    return result.resourceDir || "/tmp/default-resources";
  }

  /**
   * Get custom patterns
   */
  getCustomPatterns(profileName?: string): { directiveType?: string; layerType?: string } {
    const profile = this.profiles.get(profileName || this.currentProfile);
    return profile?.customPatterns || {};
  }

  /**
   * Get list of available profiles
   */
  getAvailableProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * Check if a profile exists
   */
  hasProfile(profileName: string): boolean {
    return this.profiles.has(profileName);
  }

  /**
   * Reset function for testing
   */
  resetToDefaults(): void {
    this.profiles.clear();
    this.currentProfile = "default";
    this.addProfile({
      name: "default",
      workingDir: "/tmp/test-working",
      resourceDir: "/tmp/test-resources",
      customPatterns: {
        directiveType: "^(to|summary|defect)$",
        layerType: "^(project|issue|task)$",
      },
    });
  }

  /**
   * Simulate an error
   */
  simulateError(profileName: string, _errorMessage: string): void {
    this.profiles.set(profileName, {
      name: profileName,
      workingDir: undefined,
      resourceDir: undefined,
    });
  }
}

/**
 * Factory function for testing
 */
export function createMockBreakdownConfig(profiles?: MockConfigProfile[]): BreakdownConfigMock {
  const mock = new BreakdownConfigMock();

  if (profiles) {
    mock.resetToDefaults();
    profiles.forEach((profile) => mock.addProfile(profile));
  }

  return mock;
}

/**
 * Standard test profile set
 */
export const STANDARD_TEST_PROFILES: MockConfigProfile[] = [
  {
    name: "default",
    workingDir: "/tmp/test-working",
    resourceDir: "/tmp/test-resources",
    customPatterns: {
      directiveType: "^(to|summary|defect)$",
      layerType: "^(project|issue|task)$",
    },
  },
  {
    name: "development",
    workingDir: "/tmp/dev-working",
    resourceDir: "/tmp/dev-resources",
    customPatterns: {
      directiveType: "^(to|summary|defect|analyze)$",
      layerType: "^(project|issue|task|feature)$",
    },
  },
  {
    name: "production",
    workingDir: "/production/working",
    resourceDir: "/production/resources",
    customPatterns: {
      directiveType: "^(to|summary)$",
      layerType: "^(project|issue)$",
    },
  },
];
