import { PathResolutionStrategy, WorkspacePathResolver } from "../interfaces.ts";

/**
 * Implementation of the WorkspacePathResolver interface for resolving, normalizing, and validating workspace paths.
 */
export class WorkspacePathResolverImpl implements WorkspacePathResolver {
  private strategy: PathResolutionStrategy;

  /**
   * Creates a new WorkspacePathResolverImpl instance.
   * @param strategy The path resolution strategy to use.
   */
  constructor(strategy: PathResolutionStrategy) {
    this.strategy = strategy;
  }

  /**
   * Resolves a path to its absolute form using the current strategy.
   * @param path The path to resolve.
   * @returns A promise resolving to the absolute path.
   */
  resolve(path: string): Promise<string> {
    return this.strategy.resolve(path);
  }

  /**
   * Normalizes a path string using the current strategy.
   * @param path The path to normalize.
   * @returns A promise resolving to the normalized path.
   */
  normalize(path: string): Promise<string> {
    return this.strategy.normalize(path);
  }

  /**
   * Validates if a path exists or is correct using the current strategy.
   * @param path The path to validate.
   * @returns A promise resolving to true if valid, false otherwise.
   */
  validate(path: string): Promise<boolean> {
    return this.strategy.validate(path);
  }

  /**
   * Updates the path resolution strategy.
   * @param strategy The new path resolution strategy to use.
   */
  updateStrategy(strategy: PathResolutionStrategy): void {
    this.strategy = strategy;
  }
}
