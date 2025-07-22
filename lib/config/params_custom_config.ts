/**
 * Params Custom Config
 * BreakdownParams用のカスタム設定
 */

// Internal type definitions for type safety
interface DirectiveTypeConfig {
  pattern?: string;
  errorMessage?: string;
}

interface LayerTypeConfig {
  pattern?: string;
  errorMessage?: string;
}

interface TwoParamsConfig {
  directiveType?: DirectiveTypeConfig;
  layerType?: LayerTypeConfig;
}

interface ParamsSection {
  two?: TwoParamsConfig;
}

interface UserConfigStructure {
  params?: ParamsSection;
  testData?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ParamsCustomConfig {
  private constructor(
    private readonly config: UserConfigStructure,
  ) {}

  static create(userConfig: Record<string, unknown>): ParamsCustomConfig {
    return new ParamsCustomConfig(userConfig as UserConfigStructure);
  }

  get directivePattern(): string | undefined {
    return this.config.params?.two?.directiveType?.pattern;
  }

  get layerPattern(): string | undefined {
    return this.config.params?.two?.layerType?.pattern;
  }

  get testData(): Record<string, unknown> | undefined {
    return this.config.testData as Record<string, unknown> | undefined;
  }

  toJSON(): Record<string, unknown> {
    return {
      params: this.config.params,
      testData: this.config.testData,
    };
  }
}
