import { PathResolutionStrategy, WorkspacePathResolver } from "../interfaces.ts";

export class WorkspacePathResolverImpl implements WorkspacePathResolver {
  private strategy: PathResolutionStrategy;

  constructor(strategy: PathResolutionStrategy) {
    this.strategy = strategy;
  }

  resolve(path: string): Promise<string> {
    return this.strategy.resolve(path);
  }

  normalize(path: string): Promise<string> {
    return this.strategy.normalize(path);
  }

  validate(path: string): Promise<boolean> {
    return this.strategy.validate(path);
  }

  updateStrategy(strategy: PathResolutionStrategy): void {
    this.strategy = strategy;
  }
}
