import { Result, ValidationError, createError } from "./types.ts";

/**
 * CI Manager Class - Single Responsibility: CI Environment Management
 */
export class CIManager {
  private constructor(
    private commandExecutor: any,
    private logger: any
  ) {}

  static create(commandExecutor: any, logger: any): CIManager {
    return new CIManager(commandExecutor, logger);
  }

  async detectCIEnvironment(): Promise<Result<boolean, ValidationError & { message: string }>> {
    const ciIndicators = [
      'CI',
      'CONTINUOUS_INTEGRATION',
      'GITHUB_ACTIONS',
      'GITLAB_CI',
      'JENKINS_URL',
      'CIRCLECI',
      'TRAVIS',
      'BUILDKITE',
      'DRONE'
    ];

    for (const indicator of ciIndicators) {
      if (Deno.env.get(indicator)) {
        this.logger.info(`CI environment detected: ${indicator}`);
        return { ok: true, data: true };
      }
    }

    return { ok: true, data: false };
  }

  async handleCIMonitoring(): Promise<Result<void, ValidationError & { message: string }>> {
    this.logger.info("Running in CI environment - executing single monitoring cycle");
    
    // In CI environment, we typically want to avoid interactive features
    // and run a single monitoring cycle
    
    return { ok: true, data: undefined };
  }
}
