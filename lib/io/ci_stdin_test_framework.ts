/**
 * CI Environment STDIN Test Framework
 * 
 * CI環境でも安全にSTDIN機能をテストできるフレームワーク
 * 
 * @module
 */

/**
 * STDIN test scenario types
 */
export enum StdinTestScenario {
  /** Normal piped input */
  PIPED_INPUT = "piped_input",
  /** No input available */
  NO_INPUT = "no_input", 
  /** Terminal interactive mode */
  TERMINAL_INTERACTIVE = "terminal_interactive",
  /** CI environment with piped input */
  CI_PIPED = "ci_piped",
  /** CI environment without input */
  CI_NO_INPUT = "ci_no_input",
  /** Test environment controlled */
  TEST_CONTROLLED = "test_controlled",
}

/**
 * STDIN mock configuration
 */
export interface StdinMockConfig {
  /** Scenario to simulate */
  scenario: StdinTestScenario;
  /** Mock input data */
  inputData?: string;
  /** Simulated environment variables */
  envVars?: Record<string, string>;
  /** Override isTerminal() result */
  isTerminal?: boolean;
  /** Timeout for mock operations */
  timeout?: number;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Test environment state
 */
export interface TestEnvironmentState {
  /** Original environment variables */
  originalEnv: Record<string, string>;
  /** Original stdin reference */
  originalStdin: typeof Deno.stdin;
  /** Mock configuration */
  mockConfig: StdinMockConfig;
  /** Test session ID */
  sessionId: string;
}

/**
 * Mock STDIN implementation for testing
 */
export class MockStdin {
  private data: Uint8Array;
  private consumed: boolean = false;
  private _isTerminal: boolean;

  constructor(data: string = "", isTerminal: boolean = false) {
    this.data = new TextEncoder().encode(data);
    this._isTerminal = isTerminal;
  }

  /** Mock implementation of isTerminal() */
  isTerminal(): boolean {
    return this._isTerminal;
  }

  /** Mock implementation of read() */
  async read(buffer: Uint8Array): Promise<number | null> {
    if (this.consumed) {
      return null; // EOF
    }

    const bytesToRead = Math.min(buffer.length, this.data.length);
    buffer.set(this.data.slice(0, bytesToRead));
    this.consumed = true;
    return bytesToRead;
  }

  /** Get readable stream (for readAll compatibility) */
  get readable(): ReadableStream<Uint8Array> {
    const data = this.data;
    let consumed = this.consumed;

    return new ReadableStream({
      start(controller) {
        if (!consumed) {
          controller.enqueue(data);
          consumed = true;
        }
        controller.close();
      }
    });
  }
}

/**
 * CI-safe STDIN test framework
 */
export class CIStdinTestFramework {
  private testSessions: Map<string, TestEnvironmentState> = new Map();

  /**
   * Setup mock STDIN environment for testing
   */
  async setupMockEnvironment(config: StdinMockConfig): Promise<TestEnvironmentState> {
    const sessionId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Backup original environment
    const originalEnv: Record<string, string> = {};
    const envKeysToBackup = [
      "CI", "GITHUB_ACTIONS", "GITLAB_CI", "JENKINS_URL", "NODE_ENV",
      "DENO_TESTING", "TEST", "STDIN_DEBUG", "BREAKDOWN_TIMEOUT"
    ];
    
    for (const key of envKeysToBackup) {
      const value = Deno.env.get(key);
      if (value !== undefined) {
        originalEnv[key] = value;
      }
    }

    // Setup test environment variables
    if (config.envVars) {
      for (const [key, value] of Object.entries(config.envVars)) {
        Deno.env.set(key, value);
      }
    }

    // Setup scenario-specific environment
    switch (config.scenario) {
      case StdinTestScenario.CI_PIPED:
        Deno.env.set("CI", "true");
        Deno.env.set("GITHUB_ACTIONS", "true");
        break;
        
      case StdinTestScenario.CI_NO_INPUT:
        Deno.env.set("CI", "true");
        Deno.env.set("GITHUB_ACTIONS", "true");
        break;
        
      case StdinTestScenario.TEST_CONTROLLED:
        Deno.env.set("DENO_TESTING", "true");
        Deno.env.set("TEST", "true");
        break;
    }

    // Set debug mode
    if (config.debug) {
      Deno.env.set("STDIN_DEBUG", "true");
    }

    // Create mock stdin
    const mockStdin = new MockStdin(
      config.inputData || "",
      config.isTerminal !== undefined ? config.isTerminal : this.getDefaultTerminalState(config.scenario)
    );

    // Store test state
    const testState: TestEnvironmentState = {
      originalEnv,
      originalStdin: Deno.stdin,
      mockConfig: config,
      sessionId,
    };

    this.testSessions.set(sessionId, testState);

    // Override Deno.stdin for this test
    const originalStdin = Deno.stdin;
    (globalThis as any).Deno = {
      ...Deno,
      stdin: mockStdin,
    };

    if (config.debug) {
      console.debug(`[CI-STDIN-TEST] Setup mock environment: ${sessionId}`, config);
    }

    return testState;
  }

  /**
   * Cleanup mock environment
   */
  async cleanupMockEnvironment(sessionId: string): Promise<void> {
    const testState = this.testSessions.get(sessionId);
    if (!testState) {
      throw new Error(`Test session not found: ${sessionId}`);
    }

    // Restore original environment variables
    for (const [key, value] of Object.entries(testState.originalEnv)) {
      Deno.env.set(key, value);
    }

    // Clear test-specific environment variables
    const testEnvKeys = Object.keys(testState.mockConfig.envVars || {});
    for (const key of testEnvKeys) {
      if (!(key in testState.originalEnv)) {
        Deno.env.delete(key);
      }
    }

    // Restore original stdin
    (globalThis as any).Deno = {
      ...Deno,
      stdin: testState.originalStdin,
    };

    // Remove test session
    this.testSessions.delete(sessionId);

    if (testState.mockConfig.debug) {
      console.debug(`[CI-STDIN-TEST] Cleaned up mock environment: ${sessionId}`);
    }
  }

  /**
   * Get default terminal state for scenario
   */
  private getDefaultTerminalState(scenario: StdinTestScenario): boolean {
    switch (scenario) {
      case StdinTestScenario.PIPED_INPUT:
      case StdinTestScenario.CI_PIPED:
        return false; // Not a terminal when piped
        
      case StdinTestScenario.NO_INPUT:
      case StdinTestScenario.CI_NO_INPUT:
        return true; // Terminal but no input
        
      case StdinTestScenario.TERMINAL_INTERACTIVE:
        return true; // Interactive terminal
        
      case StdinTestScenario.TEST_CONTROLLED:
        return false; // Controlled test environment
        
      default:
        return false;
    }
  }

  /**
   * Run STDIN test with automatic cleanup
   */
  async runStdinTest<T>(
    config: StdinMockConfig,
    testFunction: (testState: TestEnvironmentState) => Promise<T>
  ): Promise<T> {
    const testState = await this.setupMockEnvironment(config);
    
    try {
      return await testFunction(testState);
    } finally {
      await this.cleanupMockEnvironment(testState.sessionId);
    }
  }

  /**
   * Create test scenarios for comprehensive STDIN testing
   */
  createTestScenarios(): StdinMockConfig[] {
    return [
      {
        scenario: StdinTestScenario.PIPED_INPUT,
        inputData: "test input data",
        isTerminal: false,
        debug: true,
      },
      {
        scenario: StdinTestScenario.NO_INPUT,
        inputData: "",
        isTerminal: true,
        debug: true,
      },
      {
        scenario: StdinTestScenario.CI_PIPED,
        inputData: "ci test data",
        isTerminal: false,
        envVars: { CI: "true", GITHUB_ACTIONS: "true" },
        debug: true,
      },
      {
        scenario: StdinTestScenario.CI_NO_INPUT,
        inputData: "",
        isTerminal: true,
        envVars: { CI: "true", GITHUB_ACTIONS: "true" },
        debug: true,
      },
      {
        scenario: StdinTestScenario.TEST_CONTROLLED,
        inputData: "controlled test input",
        isTerminal: false,
        envVars: { DENO_TESTING: "true", TEST_STDIN_AVAILABLE: "true" },
        debug: true,
      },
    ];
  }
}

/**
 * Enhanced isTerminal() detection with CI environment awareness
 */
export class EnhancedTerminalDetector {
  /**
   * Detect terminal state with improved CI environment handling
   */
  static detectTerminalState(options?: {
    forceInteractive?: boolean;
    forceNonInteractive?: boolean;
    ciOverride?: boolean;
  }): {
    isTerminal: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    envInfo: {
      isCI: boolean;
      isTest: boolean;
      hasForceFlag: boolean;
    };
  } {
    const { forceInteractive, forceNonInteractive, ciOverride } = options || {};

    // Environment detection
    const isCI = !!(
      Deno.env.get("CI") === "true" ||
      Deno.env.get("GITHUB_ACTIONS") === "true" ||
      Deno.env.get("GITLAB_CI") === "true" ||
      Deno.env.get("JENKINS_URL")
    );

    const isTest = !!(
      Deno.env.get("DENO_TESTING") === "true" ||
      Deno.env.get("NODE_ENV") === "test" ||
      Deno.env.get("TEST") === "true"
    );

    const hasForceFlag = !!(forceInteractive || forceNonInteractive);

    // Force overrides
    if (forceInteractive) {
      return {
        isTerminal: true,
        confidence: 'high',
        reason: 'Forced interactive mode',
        envInfo: { isCI, isTest, hasForceFlag },
      };
    }

    if (forceNonInteractive) {
      return {
        isTerminal: false,
        confidence: 'high',
        reason: 'Forced non-interactive mode',
        envInfo: { isCI, isTest, hasForceFlag },
      };
    }

    // CI environment specific logic
    if (isCI && !ciOverride) {
      // In CI, check for explicit piped input indicators
      const hasStdinRedirect = Deno.env.get("STDIN_REDIRECTED") === "true";
      const hasPipeInput = Deno.env.get("PIPE_INPUT") === "true";
      
      if (hasStdinRedirect || hasPipeInput) {
        return {
          isTerminal: false,
          confidence: 'high',
          reason: 'CI environment with piped input detected',
          envInfo: { isCI, isTest, hasForceFlag },
        };
      }

      // Default CI behavior: assume terminal unless explicitly piped
      try {
        const nativeResult = Deno.stdin.isTerminal();
        return {
          isTerminal: nativeResult,
          confidence: 'medium',
          reason: `CI environment, native detection: ${nativeResult}`,
          envInfo: { isCI, isTest, hasForceFlag },
        };
      } catch (error) {
        return {
          isTerminal: true, // Conservative assumption in CI
          confidence: 'low',
          reason: `CI environment, detection failed: ${error}`,
          envInfo: { isCI, isTest, hasForceFlag },
        };
      }
    }

    // Test environment specific logic
    if (isTest) {
      const testStdinAvailable = Deno.env.get("TEST_STDIN_AVAILABLE");
      if (testStdinAvailable !== undefined) {
        const isTerminal = testStdinAvailable === "false";
        return {
          isTerminal,
          confidence: 'high',
          reason: `Test environment override: TEST_STDIN_AVAILABLE=${testStdinAvailable}`,
          envInfo: { isCI, isTest, hasForceFlag },
        };
      }
    }

    // Standard terminal detection
    try {
      const nativeResult = Deno.stdin.isTerminal();
      return {
        isTerminal: nativeResult,
        confidence: 'high',
        reason: 'Native isTerminal() detection',
        envInfo: { isCI, isTest, hasForceFlag },
      };
    } catch (error) {
      return {
        isTerminal: false, // Safe default
        confidence: 'low',
        reason: `Detection failed: ${error}`,
        envInfo: { isCI, isTest, hasForceFlag },
      };
    }
  }
}

/**
 * Environment variable configuration for STDIN behavior control
 */
export class StdinEnvironmentController {
  /**
   * Get complete environment configuration for STDIN behavior
   */
  static getEnvironmentConfig(): {
    ci: {
      enabled: boolean;
      provider?: string;
      stdinBehavior: 'strict' | 'permissive' | 'disabled';
    };
    test: {
      enabled: boolean;
      stdinAvailable: boolean;
      mockMode: boolean;
    };
    debug: {
      enabled: boolean;
      verboseLevel: 'minimal' | 'standard' | 'verbose';
    };
    timeout: {
      default: number;
      ci: number;
      test: number;
    };
    overrides: {
      forceInteractive: boolean;
      forceNonInteractive: boolean;
      skipStdinCheck: boolean;
    };
  } {
    return {
      ci: {
        enabled: Deno.env.get("CI") === "true",
        provider: this.detectCIProvider(),
        stdinBehavior: this.getCIStdinBehavior(),
      },
      test: {
        enabled: Deno.env.get("DENO_TESTING") === "true" || Deno.env.get("TEST") === "true",
        stdinAvailable: Deno.env.get("TEST_STDIN_AVAILABLE") === "true",
        mockMode: Deno.env.get("TEST_STDIN_MOCK") === "true",
      },
      debug: {
        enabled: Deno.env.get("STDIN_DEBUG") === "true",
        verboseLevel: this.getDebugLevel(),
      },
      timeout: {
        default: parseInt(Deno.env.get("BREAKDOWN_TIMEOUT") || "30000", 10),
        ci: parseInt(Deno.env.get("CI_STDIN_TIMEOUT") || "5000", 10),
        test: parseInt(Deno.env.get("TEST_STDIN_TIMEOUT") || "1000", 10),
      },
      overrides: {
        forceInteractive: Deno.env.get("FORCE_INTERACTIVE") === "true",
        forceNonInteractive: Deno.env.get("FORCE_NON_INTERACTIVE") === "true",
        skipStdinCheck: Deno.env.get("SKIP_STDIN_CHECK") === "true",
      },
    };
  }

  private static detectCIProvider(): string | undefined {
    if (Deno.env.get("GITHUB_ACTIONS") === "true") return "github";
    if (Deno.env.get("GITLAB_CI") === "true") return "gitlab";
    if (Deno.env.get("JENKINS_URL")) return "jenkins";
    if (Deno.env.get("TRAVIS") === "true") return "travis";
    if (Deno.env.get("CIRCLECI") === "true") return "circleci";
    return undefined;
  }

  private static getCIStdinBehavior(): 'strict' | 'permissive' | 'disabled' {
    const behavior = Deno.env.get("CI_STDIN_BEHAVIOR");
    if (behavior === "strict" || behavior === "permissive" || behavior === "disabled") {
      return behavior;
    }
    return "strict"; // Default
  }

  private static getDebugLevel(): 'minimal' | 'standard' | 'verbose' {
    const level = Deno.env.get("STDIN_DEBUG_LEVEL");
    if (level === "minimal" || level === "standard" || level === "verbose") {
      return level;
    }
    return "standard"; // Default
  }
}

// Global test framework instance
export const ciStdinTestFramework = new CIStdinTestFramework();