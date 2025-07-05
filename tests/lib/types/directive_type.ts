/**
 * @fileoverview Directive type for testing
 * 
 * This module provides directive type definitions
 * for test files.
 */

export type DirectiveType = "to" | "summary" | "defect" | "find";

export interface TwoParamsDirectivePattern {
  pattern: string;
  description: string;
  directive: DirectiveType;
}

export class DirectiveTypeHelper {
  static isValid(type: string): type is DirectiveType {
    return ["to", "summary", "defect", "find"].includes(type);
  }

  static getValidDirectives(): DirectiveType[] {
    return ["to", "summary", "defect", "find"];
  }
}