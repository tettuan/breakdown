/**
 * Legacy API methods for PromptVariablesFactory
 * These methods provide backward compatibility for test files
 */

/**
 * Legacy methods to be added to PromptVariablesFactory
 */
export const legacyMethods = `
  /**
   * Legacy API: Build/initialize the factory (for backward compatibility)
   */
  public async build(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Legacy API: Get prompt path (for backward compatibility)
   */
  public get promptPath(): string {
    return this.promptFilePath;
  }

  /**
   * Legacy API: Get schema path (for backward compatibility)
   */
  public get schemaPath(): string {
    return this.schemaFilePath;
  }

  /**
   * Legacy API: Get directive type (for backward compatibility)
   */
  public getDirective(): string {
    return this.cliParams.demonstrativeType;
  }

  /**
   * Legacy API: Get layer type (for backward compatibility)
   */
  public getLayerType(): string {
    return this.cliParams.layerType;
  }
`;
