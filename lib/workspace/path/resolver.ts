import { WorkspacePathResolver, PathResolutionStrategy } from "../interfaces.ts";

export class WorkspacePathResolverImpl implements WorkspacePathResolver {
  private strategy: PathResolutionStrategy;

  constructor(strategy: PathResolutionStrategy) {
    this.strategy = strategy;
  }

  async resolve(path: string): Promise<string> {
    return this.strategy.resolve(path);
  }

  async normalize(path: string): Promise<string> {
    return this.strategy.normalize(path);
  }

  async validate(path: string): Promise<boolean> {
    return this.strategy.validate(path);
  }

  updateStrategy(strategy: PathResolutionStrategy): void {
    this.strategy = strategy;
  }
} 