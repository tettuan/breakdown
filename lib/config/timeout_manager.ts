/**
 * Unified Timeout Management Module
 *
 * 環境変数に依存しない統一されたタイムアウト管理システム
 * YAMLベースの階層的設定による環境別タイムアウト制御
 *
 * @module
 */

import {
  detectEnvironment,
  type EnvironmentDetectionConfig,
  type EnvironmentInfo,
} from "../io/enhanced_stdin.ts";

/**
 * BreakdownConfig互換のCustomConfig型定義
 */
export interface BreakdownConfigCompatible {
  performance?: YamlPerformanceConfig;
  customConfig?: Record<string, unknown>;
  breakdownParams?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 基本タイムアウト設定インターフェース
 */
export interface TimeoutConfig {
  /** デフォルトタイムアウト（ミリ秒） */
  default: number;
  /** CI環境用タイムアウト（ミリ秒） */
  ci: number;
  /** テスト環境用タイムアウト（ミリ秒） */
  test: number;
  /** インタラクティブ環境用タイムアウト（ミリ秒） */
  interactive: number;
}

/**
 * STDIN固有のタイムアウト設定インターフェース
 */
export interface StdinTimeoutConfig {
  /** タイムアウト値（ミリ秒） */
  timeout: number;
  /** 空入力を許可するか */
  allowEmpty: boolean;
  /** 強制読み込みモード */
  forceRead: boolean;
  /** デバッグ出力を有効にするか */
  debug: boolean;
}

/**
 * YAML設定のPerformance部分の型定義
 */
export interface YamlPerformanceConfig {
  timeout?: number;
  timeouts?: {
    default?: number;
    ci?: number;
    test?: number;
    interactive?: number;
  };
  stdin?: {
    timeout?: number;
    allowEmpty?: boolean;
    forceRead?: boolean;
    debug?: boolean;
    environments?: {
      ci?: Partial<StdinTimeoutConfig>;
      test?: Partial<StdinTimeoutConfig>;
      interactive?: Partial<StdinTimeoutConfig>;
    };
  };
}

/**
 * 環境別タイムアウト設定の完全な構造
 */
export interface EnvironmentTimeoutConfig {
  /** 基本タイムアウト設定 */
  timeouts: TimeoutConfig;
  /** STDIN用設定（デフォルト） */
  stdin: StdinTimeoutConfig & {
    /** 環境別のSTDIN設定 */
    environments: {
      ci: StdinTimeoutConfig;
      test: StdinTimeoutConfig;
      interactive: StdinTimeoutConfig;
    };
  };
}

/**
 * 環境タイプの定義
 */
export type EnvironmentType = "ci" | "test" | "interactive";

/**
 * デフォルトタイムアウト設定
 */
export const DEFAULT_TIMEOUT_CONFIG: EnvironmentTimeoutConfig = {
  timeouts: {
    default: 30000,
    ci: 5000,
    test: 1000,
    interactive: 30000,
  },
  stdin: {
    timeout: 30000,
    allowEmpty: false,
    forceRead: false,
    debug: false,
    environments: {
      ci: {
        timeout: 5000,
        allowEmpty: true,
        forceRead: false,
        debug: true,
      },
      test: {
        timeout: 1000,
        allowEmpty: true,
        forceRead: false,
        debug: false,
      },
      interactive: {
        timeout: 30000,
        allowEmpty: false,
        forceRead: false,
        debug: false,
      },
    },
  },
};

/**
 * 統一タイムアウト管理クラス
 *
 * 環境変数に依存しない、設定ベースのタイムアウト管理を提供します。
 * YAMLから読み込まれた設定と環境検出機能を組み合わせて、
 * 適切なタイムアウト値を自動的に選択します。
 */
export class TimeoutManager {
  private config: EnvironmentTimeoutConfig;
  private environmentType: EnvironmentType;
  private environmentInfo: EnvironmentInfo;
  private debugMode: boolean;

  /**
   * TimeoutManagerのコンストラクタ
   *
   * @param config タイムアウト設定（省略時はデフォルト設定を使用）
   * @param environmentType 環境タイプの明示的指定（省略時は自動検出）
   * @param debugMode デバッグモードの有効/無効（省略時は設定から取得）
   */
  constructor(
    config?: Partial<EnvironmentTimeoutConfig>,
    environmentType?: EnvironmentType,
    debugMode?: boolean,
  ) {
    // 設定のマージ（デフォルト設定 + 提供された設定）
    this.config = this.mergeConfig(DEFAULT_TIMEOUT_CONFIG, config);

    // 環境情報の取得
    this.environmentInfo = detectEnvironment();

    // 環境タイプの決定（明示的指定 > 自動検出）
    this.environmentType = environmentType || this.detectEnvironmentType();

    // デバッグモードの決定
    this.debugMode = debugMode ?? this.config.stdin.environments[this.environmentType].debug;

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * 設定のディープマージを行う
   */
  private mergeConfig(
    defaultConfig: EnvironmentTimeoutConfig,
    userConfig?: Partial<EnvironmentTimeoutConfig>,
  ): EnvironmentTimeoutConfig {
    if (!userConfig) return defaultConfig;

    return {
      timeouts: {
        ...defaultConfig.timeouts,
        ...userConfig.timeouts,
      },
      stdin: {
        ...defaultConfig.stdin,
        ...userConfig.stdin,
        environments: {
          ci: {
            ...defaultConfig.stdin.environments.ci,
            ...userConfig.stdin?.environments?.ci,
          },
          test: {
            ...defaultConfig.stdin.environments.test,
            ...userConfig.stdin?.environments?.test,
          },
          interactive: {
            ...defaultConfig.stdin.environments.interactive,
            ...userConfig.stdin?.environments?.interactive,
          },
        },
      },
    };
  }

  /**
   * 環境タイプの自動検出
   * enhanced_stdin.tsのdetectEnvironment()機能を活用
   */
  private detectEnvironmentType(): EnvironmentType {
    if (this.environmentInfo.isCI) {
      // Debug logging removed - use BreakdownLogger instead
      return "ci";
    }

    if (this.environmentInfo.isTest) {
      // Debug logging removed - use BreakdownLogger instead
      return "test";
    }

    // Debug logging removed - use BreakdownLogger instead
    return "interactive";
  }

  /**
   * BREAKDOWN_TIMEOUT環境変数から値を取得
   *
   * @returns 環境変数から取得したタイムアウト値、または undefined
   */
  private getEnvironmentTimeout(): number | undefined {
    const envTimeout = Deno.env.get("BREAKDOWN_TIMEOUT");
    if (envTimeout) {
      const parsed = parseInt(envTimeout, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return undefined;
  }

  /**
   * 現在の環境に応じた基本タイムアウト値を取得
   *
   * @returns 環境に適したタイムアウト値（ミリ秒）
   */
  getTimeout(): number {
    // BREAKDOWN_TIMEOUTが最優先
    const envTimeout = this.getEnvironmentTimeout();
    if (envTimeout !== undefined) {
      // Debug logging removed - use BreakdownLogger instead
      return envTimeout;
    }

    // 既存のロジック
    const timeout = this.config.timeouts[this.environmentType];

    // Debug logging removed - use BreakdownLogger instead

    return timeout;
  }

  /**
   * STDIN用のタイムアウト値を取得
   *
   * @returns STDIN処理用のタイムアウト値（ミリ秒）
   */
  getStdinTimeout(): number {
    // BREAKDOWN_TIMEOUTが最優先
    const envTimeout = this.getEnvironmentTimeout();
    if (envTimeout !== undefined) {
      // Debug logging removed - use BreakdownLogger instead
      return envTimeout;
    }

    // 既存のロジック
    const timeout = this.config.stdin.environments[this.environmentType].timeout;

    // Debug logging removed - use BreakdownLogger instead

    return timeout;
  }

  /**
   * STDIN用の完全な設定を取得
   *
   * @returns STDIN処理用の全設定
   */
  getStdinConfig(): StdinTimeoutConfig {
    const config = this.config.stdin.environments[this.environmentType];

    // Debug logging removed - use BreakdownLogger instead

    return config;
  }

  /**
   * カスタムタイムアウト値の適用
   *
   * カスタム値が提供された場合はそれを使用し、
   * そうでなければ環境に応じたデフォルト値を返す
   *
   * @param customTimeout カスタムタイムアウト値（省略可能）
   * @returns 適用されるタイムアウト値（ミリ秒）
   */
  applyCustomTimeout(customTimeout?: number): number {
    const timeout = customTimeout || this.getTimeout();

    // Debug logging removed - use BreakdownLogger instead

    return timeout;
  }

  /**
   * 環境タイプを取得
   *
   * @returns 現在の環境タイプ
   */
  getEnvironmentType(): EnvironmentType {
    return this.environmentType;
  }

  /**
   * 環境情報を取得
   *
   * @returns 詳細な環境情報
   */
  getEnvironmentInfo(): EnvironmentInfo {
    return this.environmentInfo;
  }

  /**
   * 設定のバリデーション
   *
   * @returns バリデーション結果
   */
  validateConfig(): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // タイムアウト値の範囲チェック
    const timeouts = this.config.timeouts;
    Object.entries(timeouts).forEach(([env, timeout]) => {
      if (timeout < 0) {
        errors.push(`Invalid timeout for ${env}: ${timeout} (must be >= 0)`);
      }
      if (timeout > 300000) { // 5分以上
        warnings.push(`Very long timeout for ${env}: ${timeout}ms (>5 minutes)`);
      }
    });

    // STDIN設定のチェック
    Object.entries(this.config.stdin.environments).forEach(([env, config]) => {
      if (config.timeout < 0) {
        errors.push(`Invalid stdin timeout for ${env}: ${config.timeout} (must be >= 0)`);
      }
      if (env === "ci" && config.timeout > 10000) {
        warnings.push(`Long CI stdin timeout: ${config.timeout}ms (CI should be fast)`);
      }
    });

    const valid = errors.length === 0;

    // Debug logging removed - use BreakdownLogger instead

    return { valid, errors, warnings };
  }

  /**
   * デバッグ情報の取得
   *
   * 現在の設定状態と環境情報を含む詳細な情報を返す
   *
   * @returns デバッグ用の詳細情報
   */
  getDebugInfo(): {
    environmentType: EnvironmentType;
    environmentInfo: EnvironmentInfo;
    timeout: number;
    stdinTimeout: number;
    stdinConfig: StdinTimeoutConfig;
    config: EnvironmentTimeoutConfig;
    validation: { valid: boolean; errors: string[]; warnings: string[] };
  } {
    return {
      environmentType: this.environmentType,
      environmentInfo: this.environmentInfo,
      timeout: this.getTimeout(),
      stdinTimeout: this.getStdinTimeout(),
      stdinConfig: this.getStdinConfig(),
      config: this.config,
      validation: this.validateConfig(),
    };
  }

  /**
   * 設定の更新
   *
   * 実行時に設定を部分的に更新する
   *
   * @param updates 更新する設定の部分
   */
  updateConfig(updates: Partial<EnvironmentTimeoutConfig>): void {
    this.config = this.mergeConfig(this.config, updates);

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * 環境タイプの強制変更
   *
   * テスト時などに環境タイプを強制的に変更する
   *
   * @param environmentType 新しい環境タイプ
   */
  setEnvironmentType(environmentType: EnvironmentType): void {
    const _previousType = this.environmentType;
    this.environmentType = environmentType;

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * デバッグモードの切り替え
   *
   * @param enabled デバッグモードを有効にするか
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;

    // Debug logging removed - use BreakdownLogger instead
  }

  /**
   * 環境検出設定を取得
   *
   * enhanced_stdin.tsのdetectEnvironment関数で使用される設定を提供します。
   * これにより、環境変数への直接依存を回避します。
   *
   * @returns 環境検出設定
   */
  getEnvironmentDetectionConfig(): EnvironmentDetectionConfig {
    // デフォルトはDeno.env.getを使用（後方互換性のため）
    // 将来的には、設定から環境変数の値を注入できるようにする
    return {
      getEnvVar: (name: string) => Deno.env.get(name),
    };
  }

  /**
   * 互換性API: lib/io/timeout_manager.tsとの後方互換性のための静的メソッド
   *
   * @param customTimeout カスタムタイムアウト値（省略可能）
   * @returns STDIN処理用のタイムアウト値（ミリ秒）
   */
  static getStdinTimeout(customTimeout?: number): number {
    if (customTimeout !== undefined) {
      return customTimeout;
    }

    const manager = new TimeoutManager();
    return manager.getStdinTimeout();
  }

  /**
   * 互換性API: タイムアウトコンテキストの作成
   *
   * @param customTimeout カスタムタイムアウト値（省略可能）
   * @returns タイムアウトコンテキスト
   */
  static createContext(customTimeout?: number): {
    isCI: boolean;
    isTest: boolean;
    customTimeout?: number;
  } {
    const manager = new TimeoutManager();
    const envInfo = manager.getEnvironmentInfo();

    return {
      isCI: envInfo.isCI,
      isTest: envInfo.isTest,
      customTimeout,
    };
  }

  /**
   * 互換性API: 環境に応じたタイムアウト値を取得
   *
   * @param context タイムアウトコンテキスト
   * @returns 適切なタイムアウト値（ミリ秒）
   */
  static getTimeout(context: {
    isCI: boolean;
    isTest: boolean;
    customTimeout?: number;
  }): number {
    if (context.customTimeout !== undefined) {
      return context.customTimeout;
    }

    const envType: EnvironmentType = context.isTest ? "test" : context.isCI ? "ci" : "interactive";

    const manager = new TimeoutManager(undefined, envType);
    return manager.getTimeout();
  }
}

/**
 * ファクトリー関数: デフォルト設定でTimeoutManagerを作成
 *
 * @returns デフォルト設定のTimeoutManager
 */
export function createDefaultTimeoutManager(): TimeoutManager {
  return new TimeoutManager();
}

/**
 * ファクトリー関数: YAML設定からTimeoutManagerを作成
 *
 * @param yamlConfig YAML設定オブジェクト
 * @returns 設定済みのTimeoutManager
 */
export function createTimeoutManagerFromConfig(
  yamlConfig: BreakdownConfigCompatible,
): TimeoutManager {
  const performanceConfig: YamlPerformanceConfig = yamlConfig?.performance || {};

  const config: Partial<EnvironmentTimeoutConfig> = {
    timeouts: {
      default: performanceConfig.timeout || DEFAULT_TIMEOUT_CONFIG.timeouts.default,
      ci: performanceConfig.timeouts?.ci || DEFAULT_TIMEOUT_CONFIG.timeouts.ci,
      test: performanceConfig.timeouts?.test || DEFAULT_TIMEOUT_CONFIG.timeouts.test,
      interactive: performanceConfig.timeouts?.interactive ||
        DEFAULT_TIMEOUT_CONFIG.timeouts.interactive,
    },
  };

  // STDIN設定が存在する場合
  if (performanceConfig.stdin) {
    config.stdin = {
      timeout: performanceConfig.stdin.timeout || DEFAULT_TIMEOUT_CONFIG.stdin.timeout,
      allowEmpty: performanceConfig.stdin.allowEmpty ?? DEFAULT_TIMEOUT_CONFIG.stdin.allowEmpty,
      forceRead: performanceConfig.stdin.forceRead ?? DEFAULT_TIMEOUT_CONFIG.stdin.forceRead,
      debug: performanceConfig.stdin.debug ?? DEFAULT_TIMEOUT_CONFIG.stdin.debug,
      environments: {
        ci: {
          ...DEFAULT_TIMEOUT_CONFIG.stdin.environments.ci,
          ...(performanceConfig.stdin.environments?.ci || {}),
        },
        test: {
          ...DEFAULT_TIMEOUT_CONFIG.stdin.environments.test,
          ...(performanceConfig.stdin.environments?.test || {}),
        },
        interactive: {
          ...DEFAULT_TIMEOUT_CONFIG.stdin.environments.interactive,
          ...(performanceConfig.stdin.environments?.interactive || {}),
        },
      },
    };
  }

  return new TimeoutManager(config);
}

/**
 * ファクトリー関数: BREAKDOWN_TIMEOUT環境変数からTimeoutManagerを作成
 *
 * @returns 環境変数設定を反映したTimeoutManager
 */
export function createTimeoutManagerFromEnvironment(): TimeoutManager {
  const envTimeout = Deno.env.get("BREAKDOWN_TIMEOUT");
  const config: Partial<EnvironmentTimeoutConfig> = {};

  if (envTimeout) {
    const parsed = parseInt(envTimeout, 10);
    if (!isNaN(parsed) && parsed > 0) {
      // 全環境に同じタイムアウトを適用
      config.timeouts = {
        default: parsed,
        ci: parsed,
        test: parsed,
        interactive: parsed,
      };

      // STDIN設定にも適用
      config.stdin = {
        timeout: parsed,
        allowEmpty: false,
        forceRead: false,
        debug: false,
        environments: {
          ci: {
            timeout: parsed,
            allowEmpty: true,
            forceRead: false,
            debug: false,
          },
          test: {
            timeout: parsed,
            allowEmpty: true,
            forceRead: false,
            debug: false,
          },
          interactive: {
            timeout: parsed,
            allowEmpty: false,
            forceRead: false,
            debug: false,
          },
        },
      };
    }
  }

  return new TimeoutManager(config);
}
