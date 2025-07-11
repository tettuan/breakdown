/**
 * @fileoverview Workspace module entry point for Breakdown
 *
 * This module provides comprehensive workspace management functionality for
 * Breakdown projects. It exports types, errors, and the main Workspace class
 * that handles project initialization, configuration, and directory structure
 * management.
 *
 * ## Totality Principle
 *
 * The workspace module follows the Totality principle:
 * - All workspace operations return Result types for error handling
 * - No functions throw exceptions - all errors are represented as values
 * - Directory operations are validated before execution
 * - Path resolution is type-safe and total
 *
 * The module ensures Totality-compliant workspace management by wrapping all
 * file system operations in safe abstractions that cannot fail unexpectedly.
 *
 * @example Basic workspace initialization
 * ```typescript
 * import { initWorkspace, WorkspaceOptions } from "./mod.ts";
 *
 * // Initialize workspace with options
 * const options: WorkspaceOptions = {
 *   rootDir: "/path/to/project",
 *   createIfNotExists: true
 * };
 *
 * const result = await initWorkspace(options);
 * if (result.success) {
 *   console.log("Workspace initialized:", result.workspace);
 * } else {
 *   console.error("Failed to initialize:", result.error);
 * }
 * ```
 *
 * @example Error handling with custom error types
 * ```typescript
 * import { Workspace, WorkspaceInitError, WorkspacePathError } from "./mod.ts";
 *
 * try {
 *   const workspace = new Workspace("/invalid/path");
 * } catch (error) {
 *   if (error instanceof WorkspaceInitError) {
 *     console.error("Initialization failed:", error.message);
 *   } else if (error instanceof WorkspacePathError) {
 *     console.error("Path error:", error.message);
 *   }
 * }
 * ```
 *
 * @example Working with workspace structure
 * ```typescript
 * import { WorkspaceStructure, DirectoryStructure } from "./mod.ts";
 *
 * // Define workspace structure (Totality-compliant with validation)
 * const structure: WorkspaceStructure = {
 *   root: "/project",
 *   directories: {
 *     src: { path: "src", required: true },
 *     tests: { path: "tests", required: true },
 *     docs: { path: "docs", required: false }
 *   },
 *   files: {
 *     config: { path: "config.yml", required: true },
 *     readme: { path: "README.md", required: false }
 *   }
 * };
 *
 * // Validate structure
 * const isValid = await validateStructure(structure);
 * ```
 *
 * @example Path mapping and resolution
 * ```typescript
 * import { PathMapping, Workspace } from "./mod.ts";
 *
 * const workspace = new Workspace("/project");
 *
 * // Define path mappings (Totality-compliant resolution)
 * const mappings: PathMapping = {
 *   "@src": "src",
 *   "@tests": "tests",
 *   "@config": "config"
 * };
 *
 * // Resolve paths safely
 * const srcPath = workspace.resolvePath("@src/components");
 * const testPath = workspace.resolvePath("@tests/unit");
 * ```
 *
 * @module workspace
 */

/**
 * Types used for workspace management.
 * @see {@link ./types.ts}
 */
export * from "./types.ts";

/**
 * Error types related to workspace operations.
 * @see {@link ./errors.ts}
 */
export {
  createWorkspaceConfigError,
  createWorkspaceDirectoryError,
  // Interface-based error types
  createWorkspaceError,
  createWorkspacePathError,
  isWorkspaceConfigError,
  isWorkspaceDirectoryError,
  isWorkspaceError,
  isWorkspaceInitError,
  isWorkspacePathError,
  WorkspaceConfigError,
  type WorkspaceConfigErrorInterface,
  WorkspaceDirectoryError,
  type WorkspaceDirectoryErrorInterface,
  // Class-based error types for tests
  WorkspaceError,
  // Type aliases
  type WorkspaceErrorBase,
  type WorkspaceErrorType,
  type WorkspaceInitErrorInterface,
  type WorkspaceInitErrorType,
  WorkspacePathError,
  type WorkspacePathErrorInterface,
  type WorkspaceResult,
} from "./errors.ts";

/**
 * Workspace initialization error classes.
 * @see {@link ./workspace_init_error.ts}
 */
export {
  ConfigCreationError,
  createWorkspaceInitError,
  DirectoryCreationError,
  InvalidWorkspaceLocationError,
  WorkspaceExistsError,
  WorkspaceInitError,
  WorkspaceInitError as WorkspaceInitErrorClass,
} from "./workspace_init_error.ts";

/**
 * Main workspace class and related functions for managing Breakdown workspaces.
 * @see {@link ./workspace.ts}
 */
export * from "./workspace.ts";
