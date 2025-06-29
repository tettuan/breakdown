/**
 * Legacy factory implementations for backward compatibility with existing code.
 * 
 * This module provides the missing DemonstrativeTypeFactory, LayerTypeFactory,
 * and associated type guards that are referenced in temporary PoC files.
 * These implementations bridge the gap between legacy string-based types
 * and new Totality-compliant type systems.
 * 
 * @deprecated These factories are for backward compatibility only.
 * Use the new Totality-compliant TypeFactory instead.
 * 
 * @module
 */

import type { DemonstrativeType, LayerType } from "./mod.ts";

/**
 * Legacy factory for creating DemonstrativeType instances
 * @deprecated Use DirectiveType and TypeFactory instead
 */
export const DemonstrativeTypeFactory = {
  /**
   * Create a "to" directive type
   */
  to(): { kind: "to"; value: "to" } {
    return { kind: "to", value: "to" };
  },

  /**
   * Create a "summary" directive type
   */
  summary(): { kind: "summary"; value: "summary" } {
    return { kind: "summary", value: "summary" };
  },

  /**
   * Create a "defect" directive type
   */
  defect(): { kind: "defect"; value: "defect" } {
    return { kind: "defect", value: "defect" };
  },

  /**
   * Create an "init" directive type
   */
  init(): { kind: "init"; value: "init" } {
    return { kind: "init", value: "init" };
  },

  /**
   * Create a "find" directive type
   */
  find(): { kind: "find"; value: "find" } {
    return { kind: "find", value: "find" };
  },

  /**
   * Create a DemonstrativeType from string
   * @param input String representation of the directive
   * @returns DemonstrativeType object or null if invalid
   */
  fromString(input: string): { kind: DemonstrativeType; value: DemonstrativeType } | null {
    const normalized = input.trim().toLowerCase() as DemonstrativeType;
    
    switch (normalized) {
      case "to":
        return this.to();
      case "summary":
        return this.summary();
      case "defect":
        return this.defect();
      case "init":
        return this.init();
      case "find":
        return this.find();
      default:
        return null;
    }
  },
} as const;

/**
 * Legacy factory for creating LayerType instances
 * @deprecated Use NewLayerType and TypeFactory instead
 */
export const LayerTypeFactory = {
  /**
   * Create a "project" layer type
   */
  project(): { kind: "project"; value: "project" } {
    return { kind: "project", value: "project" };
  },

  /**
   * Create an "issue" layer type
   */
  issue(): { kind: "issue"; value: "issue" } {
    return { kind: "issue", value: "issue" };
  },

  /**
   * Create a "task" layer type
   */
  task(): { kind: "task"; value: "task" } {
    return { kind: "task", value: "task" };
  },

  /**
   * Create a "bugs" layer type
   */
  bugs(): { kind: "bugs"; value: "bugs" } {
    return { kind: "bugs", value: "bugs" };
  },

  /**
   * Create a "temp" layer type
   */
  temp(): { kind: "temp"; value: "temp" } {
    return { kind: "temp", value: "temp" };
  },

  /**
   * Create a LayerType from string
   * @param input String representation of the layer
   * @returns LayerType object or null if invalid
   */
  fromString(input: string): { kind: LayerType; value: LayerType } | null {
    const normalized = input.trim().toLowerCase() as LayerType;
    
    switch (normalized) {
      case "project":
        return this.project();
      case "issue":
        return this.issue();
      case "task":
        return this.task();
      case "bugs":
        return this.bugs();
      case "temp":
        return this.temp();
      default:
        return null;
    }
  },
} as const;

/**
 * Legacy type guards for DemonstrativeType
 * @deprecated Use DirectiveTypeGuards instead
 */
export const DemonstrativeTypeGuards = {
  /**
   * Check if directive is "to"
   */
  isTo(directive: { kind: DemonstrativeType; value: DemonstrativeType }): boolean {
    return directive.kind === "to";
  },

  /**
   * Check if directive is "summary"
   */
  isSummary(directive: { kind: DemonstrativeType; value: DemonstrativeType }): boolean {
    return directive.kind === "summary";
  },

  /**
   * Check if directive is "defect"
   */
  isDefect(directive: { kind: DemonstrativeType; value: DemonstrativeType }): boolean {
    return directive.kind === "defect";
  },

  /**
   * Check if directive is "init"
   */
  isInit(directive: { kind: DemonstrativeType; value: DemonstrativeType }): boolean {
    return directive.kind === "init";
  },

  /**
   * Check if directive is "find"
   */
  isFind(directive: { kind: DemonstrativeType; value: DemonstrativeType }): boolean {
    return directive.kind === "find";
  },
} as const;

/**
 * Legacy type guards for LayerType
 * @deprecated Use NewLayerType guards instead
 */
export const LayerTypeGuards = {
  /**
   * Check if layer is "project"
   */
  isProject(layer: { kind: LayerType; value: LayerType }): boolean {
    return layer.kind === "project";
  },

  /**
   * Check if layer is "issue"
   */
  isIssue(layer: { kind: LayerType; value: LayerType }): boolean {
    return layer.kind === "issue";
  },

  /**
   * Check if layer is "task"
   */
  isTask(layer: { kind: LayerType; value: LayerType }): boolean {
    return layer.kind === "task";
  },

  /**
   * Check if layer is "bugs"
   */
  isBugs(layer: { kind: LayerType; value: LayerType }): boolean {
    return layer.kind === "bugs";
  },

  /**
   * Check if layer is "temp"
   */
  isTemp(layer: { kind: LayerType; value: LayerType }): boolean {
    return layer.kind === "temp";
  },
} as const;