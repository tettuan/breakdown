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

export interface PromptVariableBase {
  name: string;
  type: string;
  required: boolean;
}

export interface StandardVariable extends PromptVariableBase {
  name: StandardVariableName;
  value: string;
}

export interface FilePathVariable extends PromptVariableBase {
  name: FilePathVariableName;
  path: string;
}

export interface StdinVariable extends PromptVariableBase {
  name: StdinVariableName;
  content: string;
}

export interface UserVariable extends PromptVariableBase {
  name: string;
  value: unknown;
}

export type StandardVariableName = 'directive_type' | 'layer_type' | 'input_file' | 'output_file';
export type FilePathVariableName = 'prompt_path' | 'schema_path';
export type StdinVariableName = 'stdin_content';

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

export function createPromptParams(variables: PromptVariables): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  for (const [key, variable] of Object.entries(variables)) {
    params[key] = variable.value;
  }
  return params;
}

export function toPromptParamsVariables(variables: PromptVariables): Record<string, unknown> {
  return createPromptParams(variables);
}