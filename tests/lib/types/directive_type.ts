/**
 * @fileoverview Directive type for testing
 * 
 * This module provides directive type definitions
 * for test files.
 */

export type DirectiveType = "to" | "summary" | "defect" | "find";

export class DirectiveTypeHelper {
  static isValid(type: string): type is DirectiveType {
    return ["to", "summary", "defect", "find"].includes(type);
  }
}