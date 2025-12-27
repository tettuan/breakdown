/**
 * @fileoverview Supporting Domain Module - Unified exports for supporting domain components
 *
 * This module provides centralized exports for all supporting domain components
 * following Domain-Driven Design principles. The supporting domain contains
 * components that support the core domain but are not the primary business value.
 *
 * @module domain/supporting
 */

// Workspace Management Domain
// Export workspace management components when they are implemented
export * from "./workspace_management/index.ts";

// Template Management Domain (future implementation)
// TODO: When template_management is moved here from generic domain
// export * from "./template_management/mod.ts";

/**
 * Supporting Domain Factory for common creation patterns
 */
export class SupportingDomainFactory {
  /**
   * Create workspace management objects
   */
  static get workspace() {
    return {
      // TODO: Add factory methods when workspace management is implemented
      createWorkspace(_name: string) {
        // Placeholder for future implementation
        throw new Error("Workspace management not yet implemented");
      },
    };
  }

  /**
   * Create template management objects
   */
  static get templates() {
    return {
      // TODO: Add factory methods when template management is moved here
      createTemplateManager() {
        // Placeholder for future implementation
        throw new Error("Template management not yet implemented in supporting domain");
      },
    };
  }
}

/**
 * Supporting Domain Guards for type checking
 */
export class SupportingDomainGuards {
  /**
   * Type guards for workspace management
   */
  static get workspace() {
    return {
      // TODO: Add type guards when workspace management is implemented
      isWorkspace(_value: unknown): boolean {
        // Placeholder for future implementation
        return false;
      },
    };
  }

  /**
   * Type guards for template management
   */
  static get templates() {
    return {
      // TODO: Add type guards when template management is moved here
      isTemplateManager(_value: unknown): boolean {
        // Placeholder for future implementation
        return false;
      },
    };
  }
}
