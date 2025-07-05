/**
 * @fileoverview Layer type for testing
 * 
 * This module provides layer type definitions
 * for test files.
 */

export type LayerType = "project" | "issue" | "task" | "bugs" | "temp";

export class LayerTypeHelper {
  static isValid(type: string): type is LayerType {
    return ["project", "issue", "task", "bugs", "temp"].includes(type);
  }
}