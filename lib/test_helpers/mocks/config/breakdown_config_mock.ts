/**
 * BreakdownConfig Mock
 * テスト用のBreakdownConfigモック実装
 * BreakdownConfigの動作を模擬し、テスト環境での設定管理をサポート
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
    // デフォルトプロファイルを追加
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
   * プロファイルを追加
   */
  addProfile(profile: MockConfigProfile): void {
    this.profiles.set(profile.name, profile);
  }

  /**
   * 現在のプロファイルを設定
   */
  setCurrentProfile(profileName: string): boolean {
    if (this.profiles.has(profileName)) {
      this.currentProfile = profileName;
      return true;
    }
    return false;
  }

  /**
   * 設定を取得（BreakdownConfig.get模擬）
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
   * 作業ディレクトリを取得
   */
  async getWorkingDir(profilePrefix?: string): Promise<string> {
    const result = await this.get(profilePrefix);
    return result.workingDir || "/tmp/default-working";
  }

  /**
   * リソースディレクトリを取得
   */
  async getResourceDir(profilePrefix?: string): Promise<string> {
    const result = await this.get(profilePrefix);
    return result.resourceDir || "/tmp/default-resources";
  }

  /**
   * カスタムパターンを取得
   */
  getCustomPatterns(profileName?: string): { directiveType?: string; layerType?: string } {
    const profile = this.profiles.get(profileName || this.currentProfile);
    return profile?.customPatterns || {};
  }

  /**
   * 利用可能なプロファイル一覧を取得
   */
  getAvailableProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * プロファイルが存在するかチェック
   */
  hasProfile(profileName: string): boolean {
    return this.profiles.has(profileName);
  }

  /**
   * テスト用のリセット機能
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
   * エラーをシミュレート
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
 * テスト用のファクトリー関数
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
 * 標準的なテストプロファイルセット
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
