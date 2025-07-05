/**
 * @fileoverview Prompt variables for testing
 * 
 * This module provides prompt variable definitions
 * for test files.
 */

export interface PromptVariable {
  name: string;
  value: string | number | boolean;
}

export interface PromptVariables {
  [key: string]: PromptVariable;
}

export class PromptVariablesHelper {
  static create(data: Record<string, unknown>): PromptVariables {
    const variables: PromptVariables = {};
    for (const [key, value] of Object.entries(data)) {
      variables[key] = {
        name: key,
        value: value as string | number | boolean,
      };
    }
    return variables;
  }
}