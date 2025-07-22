/**
 * @fileoverview ConfigProfile - Local implementation for profile name management
 *
 * This module provides ConfigProfile class for managing configuration profiles
 * following DDD and Totality principles. Local implementation as JSR package
 * does not export ConfigProfile/ConfigProfileName.
 *
 * @module config/config_profile_name
 */

/**
 * ConfigProfile class for managing configuration profile names
 */
export class ConfigProfile {
  /**
   * Default profile name constant
   */
  static readonly DEFAULT: "default" = "default" as const;

  /**
   * Private constructor to ensure controlled instantiation
   */
  private constructor(private readonly profileName: string) {}

  /**
   * Create ConfigProfile instance with validation
   * @param profileName - Profile name string
   * @returns ConfigProfile instance
   */
  static create(profileName?: string | null | undefined): ConfigProfile {
    const normalizedName = (typeof profileName === "string" ? profileName.trim() : "") || "";
    const finalName = normalizedName === "" ? ConfigProfile.DEFAULT : normalizedName;
    return new ConfigProfile(finalName);
  }

  /**
   * @deprecated createDefault() は廃止予定
   * BreakdownParams統合により設定ファイルベース実装に移行。
   * ConfigProfile.create() を使用してください。
   *
   * @returns Default ConfigProfile instance
   */
  static createDefault(): ConfigProfile {
    return new ConfigProfile(ConfigProfile.DEFAULT);
  }

  /**
   * Create ConfigProfile from CLI option value
   * @param cliOption - CLI option value
   * @returns ConfigProfile instance
   */
  static fromCliOption(cliOption?: string | null | undefined): ConfigProfile {
    return ConfigProfile.create(cliOption);
  }

  /**
   * Get the profile name value
   * @returns Profile name string
   */
  get value(): string {
    return this.profileName;
  }

  /**
   * Get the profile name value (legacy method)
   * @returns Profile name string
   */
  getValue(): string {
    return this.profileName;
  }

  /**
   * Convert to string representation
   * @returns Profile name string
   */
  toString(): string {
    return this.profileName;
  }

  /**
   * Check if this is the default profile
   * @returns True if default profile
   */
  isDefault(): boolean {
    return this.profileName === ConfigProfile.DEFAULT;
  }

  /**
   * Check equality with another ConfigProfile
   * @param other - Other ConfigProfile instance
   * @returns True if equal
   */
  equals(other: ConfigProfile): boolean {
    return this.profileName === other.profileName;
  }

  /**
   * Create ConfigProfile with validation feedback (Result type)
   * @param profileName - Profile name string
   * @returns Result containing ConfigProfile or error
   */
  static createOrError(
    profileName?: string | null | undefined,
  ): {
    ok: boolean;
    data?: ConfigProfile;
    error?: { message: string; kind: string; field: string };
  } {
    const normalizedName = (typeof profileName === "string" ? profileName.trim() : "") || "";

    if (normalizedName === "") {
      return {
        ok: false,
        error: {
          message: "Profile name cannot be empty, using default",
          kind: "InvalidInput",
          field: "profileName",
        },
      };
    }

    return {
      ok: true,
      data: new ConfigProfile(normalizedName),
    };
  }
}
