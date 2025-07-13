/**
 * @fileoverview DirectiveType Type Definitions and Compatibility Layer
 *
 * This module provides type definitions and backward compatibility for DirectiveType.
 * The actual implementation has been moved to domain/core/value_objects/directive_type.ts
 * following DDD principles.
 *
 * @deprecated Import from "../domain/core/value_objects/directive_type.ts" for new code
 * @module types/directive_type
 */

// Import from domain implementation for re-export
import {
  DirectiveType as DomainDirectiveType,
  type DirectiveTypeError as DomainDirectiveTypeError,
  TwoParamsDirectivePattern as DomainTwoParamsDirectivePattern,
} from "../domain/core/value_objects/directive_type.ts";

// Re-export types from domain implementation
export {
  DirectiveType,
  type DirectiveTypeError,
  TwoParamsDirectivePattern,
} from "../domain/core/value_objects/directive_type.ts";

// Re-export unified validation error for compatibility
export type { ValidationError } from "../types/unified_error_types.ts";

// Re-export for backward compatibility
export type { ConfigProfileName } from "./config_profile_name.ts";

/**
 * @deprecated Use DirectiveType.create() from domain/core/value_objects/directive_type.ts instead
 */
export const createDirectiveType = DomainDirectiveType.create;

/**
 * Legacy type aliases for backward compatibility
 * @deprecated Use types from domain/core/value_objects/directive_type.ts
 */
export type LegacyDirectiveType = DomainDirectiveType;
export type LegacyDirectiveTypeError = DomainDirectiveTypeError;

// Note: All actual implementation logic has been moved to:
// lib/domain/core/value_objects/directive_type.ts
//
// This file now serves as a compatibility layer and type definition hub.
// For new code, import directly from the domain implementation:
//
// import { DirectiveType } from "../domain/core/value_objects/directive_type.ts";