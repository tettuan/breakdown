/**
 * Legacy factory implementations for backward compatibility with existing code.
 *
 * This module provides the missing DemonstrativeTypeFactory, LegacyLayerTypeFactory,
 * and associated type guards that are referenced in temporary PoC files.
 * These implementations bridge the gap between legacy string-based types
 * and new Totality-compliant type systems.
 *
 * @deprecated These factories are for backward compatibility only.
 * Use the new Totality-compliant TypeFactory instead.
 *
 * @module
 */

// Legacy type definitions for backward compatibility
export type DemonstrativeType =
  | { kind: "to"; value: "to" }
  | { kind: "summary"; value: "summary" }
  | { kind: "defect"; value: "defect" }
  | { kind: "init"; value: "init" }
  | { kind: "find"; value: "find" };

export type LegacyLayerType =
  | { kind: "project"; value: "project" }
  | { kind: "issue"; value: "issue" }
  | { kind: "task"; value: "task" }
  | { kind: "bugs"; value: "bugs" }
  | { kind: "temp"; value: "temp" };

/**
 * Legacy factory for creating DemonstrativeType instances
 * @deprecated Use DirectiveType and TypeFactory instead
 */
export const DemonstrativeTypeFactory = {
  /**
   * Create a "to" directive type
   */
  to(): DemonstrativeType {
    return { kind: "to", value: "to" };
  },

  /**
   * Create a "summary" directive type
   */
  summary(): DemonstrativeType {
    return { kind: "summary", value: "summary" };
  },

  /**
   * Create a "defect" directive type
   */
  defect(): DemonstrativeType {
    return { kind: "defect", value: "defect" };
  },

  /**
   * Create an "init" directive type
   */
  init(): DemonstrativeType {
    return { kind: "init", value: "init" };
  },

  /**
   * Create a "find" directive type
   */
  find(): DemonstrativeType {
    return { kind: "find", value: "find" };
  },

  /**
   * Create a DemonstrativeType from string
   * @param input String representation of the directive
   * @returns DemonstrativeType object or null if invalid
   */
  fromString(input: string): DemonstrativeType | null {
    const normalized = input.trim().toLowerCase();

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
 * Legacy factory for creating LegacyLayerType instances
 * @deprecated Use LegacyLayerType and TypeFactory instead
 */
export const LegacyLayerTypeFactory = {
  /**
   * Create a "project" layer type
   */
  project(): LegacyLayerType {
    return { kind: "project", value: "project" };
  },

  /**
   * Create an "issue" layer type
   */
  issue(): LegacyLayerType {
    return { kind: "issue", value: "issue" };
  },

  /**
   * Create a "task" layer type
   */
  task(): LegacyLayerType {
    return { kind: "task", value: "task" };
  },

  /**
   * Create a "bugs" layer type
   */
  bugs(): LegacyLayerType {
    return { kind: "bugs", value: "bugs" };
  },

  /**
   * Create a "temp" layer type
   */
  temp(): LegacyLayerType {
    return { kind: "temp", value: "temp" };
  },

  /**
   * Create a LegacyLayerType from string
   * @param input String representation of the layer
   * @returns LegacyLayerType object or null if invalid
   */
  fromString(input: string): LegacyLayerType | null {
    const normalized = input.trim().toLowerCase();

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
  isTo(directive: DemonstrativeType): boolean {
    return directive.kind === "to";
  },

  /**
   * Check if directive is "summary"
   */
  isSummary(directive: DemonstrativeType): boolean {
    return directive.kind === "summary";
  },

  /**
   * Check if directive is "defect"
   */
  isDefect(directive: DemonstrativeType): boolean {
    return directive.kind === "defect";
  },

  /**
   * Check if directive is "init"
   */
  isInit(directive: DemonstrativeType): boolean {
    return directive.kind === "init";
  },

  /**
   * Check if directive is "find"
   */
  isFind(directive: DemonstrativeType): boolean {
    return directive.kind === "find";
  },
} as const;

/**
 * Legacy type guards for LegacyLayerType
 * @deprecated Use LegacyLayerType guards instead
 */
export const LegacyLayerTypeGuards = {
  /**
   * Check if layer is "project"
   */
  isProject(layer: LegacyLayerType): boolean {
    return layer.kind === "project";
  },

  /**
   * Check if layer is "issue"
   */
  isIssue(layer: LegacyLayerType): boolean {
    return layer.kind === "issue";
  },

  /**
   * Check if layer is "task"
   */
  isTask(layer: LegacyLayerType): boolean {
    return layer.kind === "task";
  },

  /**
   * Check if layer is "bugs"
   */
  isBugs(layer: LegacyLayerType): boolean {
    return layer.kind === "bugs";
  },

  /**
   * Check if layer is "temp"
   */
  isTemp(layer: LegacyLayerType): boolean {
    return layer.kind === "temp";
  },
} as const;

/**
 * Legacy DirectiveFactory for backward compatibility
 * @deprecated Use DirectiveType and TypeFactory instead
 */
export const DirectiveFactory = DemonstrativeTypeFactory;

/**
 * Legacy LayerFactory for backward compatibility
 * @deprecated Use LayerType and TypeFactory instead
 */
export const LayerFactory = LegacyLayerTypeFactory;

/**
 * Legacy TwoParamsConfigFactory (placeholder)
 * @deprecated Use TypeFactory for new code
 */
export const TwoParamsConfigFactory = {
  create: () => ({}),
};

/**
 * Legacy VariableResultFactory (placeholder)
 * @deprecated Use VariableResult functions directly
 */
export const VariableResultFactory = {
  createSuccess: <T>(data: T): { ok: true; data: T } => ({ ok: true, data }),
  createError: <E>(error: E): { ok: false; error: E } => ({ ok: false, error }),
};
