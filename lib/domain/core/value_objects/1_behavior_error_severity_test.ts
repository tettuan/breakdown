/**
 * @fileoverview ErrorSeverity Behavior Tests - Enhanced Totality Pattern Validation
 * 
 * Totality原則に基づくSmart Constructor、Result型、Discriminated Unionパターンの統合テスト。
 * 新しいTotality準拠実装の動作とエラーハンドリングを検証。
 * 
 * テスト構成:
 * - Smart Constructor (create) パターンの検証
 * - Result型によるエラーハンドリングの検証
 * - Discriminated Unionエラー型の検証
 * - 型ガード関数の検証
 * - レガシー互換性の検証
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  ErrorSeverity,
  SeverityLevel,
  ImpactScope,
  ErrorMetadata,
  ErrorSeverityError,
  isInvalidLevelError,
  isInvalidImpactError,
  isInvalidMetadataError,
  isNullOrUndefinedError,
  isInvalidTypeError,
  formatErrorSeverityError,
} from "./error_severity.ts";
import type { Result } from "../../../types/result.ts";

// =============================================================================
// TOTALITY PATTERN: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("Totality - ErrorSeverity implements Smart Constructor pattern with Result type", () => {
  // Smart Constructor: Private constructor, public static factory methods
  
  // Primary Smart Constructor methods
  assertExists(ErrorSeverity.create);
  assertExists(ErrorSeverity.fromString);
  
  // Legacy factory methods should still exist
  assertExists(ErrorSeverity.debug);
  assertExists(ErrorSeverity.info);
  assertExists(ErrorSeverity.warning);
  assertExists(ErrorSeverity.error);
  assertExists(ErrorSeverity.critical);
  assertExists(ErrorSeverity.fatal);
  assertExists(ErrorSeverity.custom);
  
  // Verify Smart Constructor returns Result type
  const result = ErrorSeverity.create(SeverityLevel.ERROR, ImpactScope.MODULE);
  assertExists(result);
  assertExists(result.ok);
  
  if (result.ok) {
    assertExists(result.data);
    assertEquals(result.data.getLevel(), SeverityLevel.ERROR);
  }
});

Deno.test("Architecture - SeverityLevel enum is properly defined with numeric values", () => {
  // Enum should be properly defined with correct numeric values
  assertExists(SeverityLevel);
  
  // Test enum values and ordering (higher number = higher severity)
  assertEquals(SeverityLevel.DEBUG, 0);
  assertEquals(SeverityLevel.INFO, 1);
  assertEquals(SeverityLevel.WARNING, 2);
  assertEquals(SeverityLevel.ERROR, 3);
  assertEquals(SeverityLevel.CRITICAL, 4);
  assertEquals(SeverityLevel.FATAL, 5);
  
  // Verify ordering relationship
  assertEquals(SeverityLevel.DEBUG < SeverityLevel.INFO, true);
  assertEquals(SeverityLevel.INFO < SeverityLevel.WARNING, true);
  assertEquals(SeverityLevel.WARNING < SeverityLevel.ERROR, true);
  assertEquals(SeverityLevel.ERROR < SeverityLevel.CRITICAL, true);
  assertEquals(SeverityLevel.CRITICAL < SeverityLevel.FATAL, true);
});

Deno.test("Architecture - ImpactScope enum uses Discriminated Union pattern", () => {
  // Enum should be properly defined with string discriminators
  assertExists(ImpactScope);
  
  // Test enum values (string-based discriminated union)
  assertEquals(ImpactScope.NONE, "none");
  assertEquals(ImpactScope.LOCAL, "local");
  assertEquals(ImpactScope.MODULE, "module");
  assertEquals(ImpactScope.SYSTEM, "system");
  assertEquals(ImpactScope.GLOBAL, "global");
  
  // Each value should be a string (discriminator)
  assertEquals(typeof ImpactScope.NONE, "string");
  assertEquals(typeof ImpactScope.LOCAL, "string");
  assertEquals(typeof ImpactScope.MODULE, "string");
  assertEquals(typeof ImpactScope.SYSTEM, "string");
  assertEquals(typeof ImpactScope.GLOBAL, "string");
});

Deno.test("Architecture - ErrorMetadata interface supports extensible metadata", () => {
  // Test metadata structure and immutability
  const metadata: ErrorMetadata = {
    code: "E001",
    category: "validation",
    timestamp: new Date(),
    context: {
      field: "username",
      value: "invalid_user",
    },
  };
  
  // All properties should be optional
  const emptyMetadata: ErrorMetadata = {};
  assertExists(emptyMetadata);
  
  // Context should support any structure
  const complexMetadata: ErrorMetadata = {
    context: {
      nested: {
        deep: {
          value: "test",
        },
      },
      array: [1, 2, 3],
      mixed: "string",
    },
  };
  assertExists(complexMetadata);
});

Deno.test("Architecture - ErrorSeverity factory methods create immutable instances", () => {
  // Test each factory method creates proper instances
  const debugSeverity = ErrorSeverity.debug();
  const infoSeverity = ErrorSeverity.info();
  const warningSeverity = ErrorSeverity.warning();
  const errorSeverity = ErrorSeverity.error();
  const criticalSeverity = ErrorSeverity.critical();
  const fatalSeverity = ErrorSeverity.fatal();
  
  // All should be instances of ErrorSeverity
  assertExists(debugSeverity);
  assertExists(infoSeverity);
  assertExists(warningSeverity);
  assertExists(errorSeverity);
  assertExists(criticalSeverity);
  assertExists(fatalSeverity);
  
  // Should have correct severity levels
  assertEquals(debugSeverity.getLevel(), SeverityLevel.DEBUG);
  assertEquals(infoSeverity.getLevel(), SeverityLevel.INFO);
  assertEquals(warningSeverity.getLevel(), SeverityLevel.WARNING);
  assertEquals(errorSeverity.getLevel(), SeverityLevel.ERROR);
  assertEquals(criticalSeverity.getLevel(), SeverityLevel.CRITICAL);
  assertEquals(fatalSeverity.getLevel(), SeverityLevel.FATAL);
  
  // Should have appropriate default impact scopes
  assertEquals(debugSeverity.getImpact(), ImpactScope.NONE);
  assertEquals(infoSeverity.getImpact(), ImpactScope.LOCAL);
  assertEquals(warningSeverity.getImpact(), ImpactScope.MODULE);
  assertEquals(errorSeverity.getImpact(), ImpactScope.MODULE);
  assertEquals(criticalSeverity.getImpact(), ImpactScope.SYSTEM);
  assertEquals(fatalSeverity.getImpact(), ImpactScope.GLOBAL);
});

Deno.test("Totality - ErrorSeverity.create validates all parameters comprehensively", () => {
  // Valid creation should succeed
  const validResult = ErrorSeverity.create(
    SeverityLevel.WARNING,
    ImpactScope.GLOBAL,
    {
      code: "CUSTOM001",
      category: "business",
    }
  );
  
  assert(validResult.ok);
  if (validResult.ok) {
    assertEquals(validResult.data.getLevel(), SeverityLevel.WARNING);
    assertEquals(validResult.data.getImpact(), ImpactScope.GLOBAL);
    
    const metadata = validResult.data.getMetadata();
    assertEquals(metadata.code, "CUSTOM001");
    assertEquals(metadata.category, "business");
  }
  
  // Invalid level should return error
  const invalidLevelResult = ErrorSeverity.create(
    999 as SeverityLevel,
    ImpactScope.MODULE
  );
  assert(!invalidLevelResult.ok);
  if (!invalidLevelResult.ok) {
    assertEquals(invalidLevelResult.error.kind, "InvalidLevel");
  }
  
  // Invalid impact should return error
  const invalidImpactResult = ErrorSeverity.create(
    SeverityLevel.ERROR,
    "invalid" as ImpactScope
  );
  assert(!invalidImpactResult.ok);
  if (!invalidImpactResult.ok) {
    assertEquals(invalidImpactResult.error.kind, "InvalidImpact");
  }
  
  // Invalid metadata should return error
  const invalidMetadataResult = ErrorSeverity.create(
    SeverityLevel.ERROR,
    ImpactScope.MODULE,
    "not an object" as any
  );
  assert(!invalidMetadataResult.ok);
  if (!invalidMetadataResult.ok) {
    assertEquals(invalidMetadataResult.error.kind, "InvalidMetadata");
  }
});

Deno.test("Totality - ErrorSeverity.fromString returns Result type with comprehensive validation", () => {
  // Valid string parsing should return success Result
  const debugResult = ErrorSeverity.fromString("debug");
  assert(debugResult.ok);
  if (debugResult.ok) {
    assertEquals(debugResult.data.getLevel(), SeverityLevel.DEBUG);
  }
  
  const errorResult = ErrorSeverity.fromString("ERROR");
  assert(errorResult.ok);
  if (errorResult.ok) {
    assertEquals(errorResult.data.getLevel(), SeverityLevel.ERROR);
  }
  
  const fatalResult = ErrorSeverity.fromString("Fatal");
  assert(fatalResult.ok);
  if (fatalResult.ok) {
    assertEquals(fatalResult.data.getLevel(), SeverityLevel.FATAL);
  }
  
  // Invalid string should return error Result (Totality pattern)
  const invalidResult = ErrorSeverity.fromString("invalid_level");
  assert(!invalidResult.ok);
  if (!invalidResult.ok) {
    assertEquals(invalidResult.error.kind, "InvalidLevel");
  }
  
  // Empty string should return error Result
  const emptyResult = ErrorSeverity.fromString("");
  assert(!emptyResult.ok);
  if (!emptyResult.ok) {
    assertEquals(emptyResult.error.kind, "InvalidLevel");
  }
  
  // Null/undefined should return error Result
  const nullResult = ErrorSeverity.fromString(null as any);
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    assertEquals(nullResult.error.kind, "NullOrUndefined");
  }
});

// =============================================================================
// DISCRIMINATED UNION ERROR TYPE TESTS
// =============================================================================

Deno.test("Totality - ErrorSeverityError type guards work correctly", () => {
  // Create different error types
  const invalidLevelResult = ErrorSeverity.fromString("invalid");
  assert(!invalidLevelResult.ok);
  if (!invalidLevelResult.ok) {
    const invalidLevelError = invalidLevelResult.error;
    
    const invalidImpactResult = ErrorSeverity.create(
      SeverityLevel.ERROR,
      "invalid" as ImpactScope
    );
    assert(!invalidImpactResult.ok);
    if (!invalidImpactResult.ok) {
      const invalidImpactError = invalidImpactResult.error;
      
      const nullResult = ErrorSeverity.fromString(null as any);
      assert(!nullResult.ok);
      if (!nullResult.ok) {
        const nullError = nullResult.error;
        
        // Test type guards
        assert(isInvalidLevelError(invalidLevelError));
        assert(!isInvalidImpactError(invalidLevelError));
        assert(!isNullOrUndefinedError(invalidLevelError));
        
        assert(isInvalidImpactError(invalidImpactError));
        assert(!isInvalidLevelError(invalidImpactError));
        
        assert(isNullOrUndefinedError(nullError));
        assert(!isInvalidLevelError(nullError));
      }
    }
  }
});

Deno.test("Totality - formatErrorSeverityError provides comprehensive error messages", () => {
  // Test InvalidLevel error formatting
  const invalidLevelResult = ErrorSeverity.fromString("unknown");
  assert(!invalidLevelResult.ok);
  if (!invalidLevelResult.ok) {
    const invalidLevelMessage = formatErrorSeverityError(invalidLevelResult.error);
    assert(invalidLevelMessage.includes("Invalid severity level"));
    assert(invalidLevelMessage.includes("unknown"));
    assert(invalidLevelMessage.includes("Valid levels:"));
  }
  
  // Test InvalidImpact error formatting
  const invalidImpactResult = ErrorSeverity.create(
    SeverityLevel.ERROR,
    "invalid" as ImpactScope
  );
  assert(!invalidImpactResult.ok);
  if (!invalidImpactResult.ok) {
    const invalidImpactMessage = formatErrorSeverityError(invalidImpactResult.error);
    assert(invalidImpactMessage.includes("Invalid impact scope"));
    assert(invalidImpactMessage.includes("invalid"));
  }
  
  // Test NullOrUndefined error formatting
  const nullResult = ErrorSeverity.create(null as any, ImpactScope.MODULE);
  assert(!nullResult.ok);
  if (!nullResult.ok) {
    const nullMessage = formatErrorSeverityError(nullResult.error);
    assert(nullMessage.includes("cannot be null or undefined"));
  }
});

// =============================================================================
// LEGACY COMPATIBILITY TESTS
// =============================================================================

Deno.test("Totality - Legacy methods maintain backward compatibility", () => {
  // Legacy factory methods should still work
  const debugSeverity = ErrorSeverity.debug();
  assertEquals(debugSeverity.getLevel(), SeverityLevel.DEBUG);
  
  // Legacy custom method should work but is deprecated
  const customSeverity = ErrorSeverity.custom(
    SeverityLevel.WARNING,
    ImpactScope.GLOBAL
  );
  assertEquals(customSeverity.getLevel(), SeverityLevel.WARNING);
  
  // Legacy fromStringUnsafe should exist and throw on error
  const validLegacy = ErrorSeverity.fromStringUnsafe("ERROR");
  assertEquals(validLegacy.getLevel(), SeverityLevel.ERROR);
  
  // Should throw on invalid input (legacy behavior)
  try {
    ErrorSeverity.fromStringUnsafe("invalid");
    assert(false, "Should have thrown");
  } catch (error) {
    assert(error instanceof Error);
    if (error instanceof Error) {
      assert(error.message.includes("Invalid severity level"));
    }
  }
});

// =============================================================================
// IMMUTABILITY AND VALUE OBJECT TESTS
// =============================================================================

Deno.test("Totality - ErrorSeverity instances are completely immutable", () => {
  const result = ErrorSeverity.create(
    SeverityLevel.ERROR,
    ImpactScope.SYSTEM,
    { code: "E001", category: "validation" }
  );
  assert(result.ok);
  if (result.ok) {
    const severity = result.data;
    
    // Object should be frozen
    assert(Object.isFrozen(severity));
    
    // Metadata should be frozen (defensive)
    const metadata = severity.getMetadata();
    // Note: getMetadata returns a copy, so we can't test freezing of the copy
    // But the original internal metadata should be frozen
    
    // Repeated calls should return identical values
    assertEquals(severity.getLevel(), severity.getLevel());
    assertEquals(severity.getImpact(), severity.getImpact());
    
    // Metadata should be defensive copies
    const metadata1 = severity.getMetadata();
    const metadata2 = severity.getMetadata();
    assertEquals(JSON.stringify(metadata1), JSON.stringify(metadata2));
  }
});

Deno.test("Architecture - ErrorSeverity is immutable Value Object", () => {
  const severity = ErrorSeverity.error(ImpactScope.SYSTEM, {
    code: "E001",
    category: "validation",
  });
  
  // Value Object methods must exist
  assertExists(severity.getLevel);
  assertExists(severity.getImpact);
  assertExists(severity.getMetadata);
  assertExists(severity.getLevelName);
  assertExists(severity.getNumericLevel);
  assertExists(severity.equals);
  assertExists(severity.toString);
  assertExists(severity.toJSON);
  
  // Immutability - repeated calls should return same values
  const level1 = severity.getLevel();
  const level2 = severity.getLevel();
  assertEquals(level1, level2);
  
  const impact1 = severity.getImpact();
  const impact2 = severity.getImpact();
  assertEquals(impact1, impact2);
  
  // Metadata should be copies (defensive copying)
  const metadata1 = severity.getMetadata();
  const metadata2 = severity.getMetadata();
  assertEquals(JSON.stringify(metadata1), JSON.stringify(metadata2));
  
  // Metadata should be defensive copies (immutable at interface level)
  // Note: In TypeScript, readonly properties prevent modification at compile time
  // The defensive copying is handled by getMetadata() method
  const metadata3 = severity.getMetadata();
  assertEquals(metadata3.code, "E001"); // Should still be original value
});

Deno.test("Architecture - ErrorSeverity supports functional composition methods", () => {
  const baseSeverity = ErrorSeverity.warning();
  
  // Composition methods should exist
  assertExists(baseSeverity.withMetadata);
  assertExists(baseSeverity.withCode);
  assertExists(baseSeverity.withCategory);
  assertExists(baseSeverity.withImpact);
  assertExists(baseSeverity.escalate);
  
  // Composition should create new instances (immutability)
  const withCode = baseSeverity.withCode("W001");
  assertExists(withCode);
  assertEquals(withCode.getMetadata().code, "W001");
  assertEquals(baseSeverity.getMetadata().code, undefined); // Original unchanged
  
  const withCategory = withCode.withCategory("business");
  assertEquals(withCategory.getMetadata().code, "W001");
  assertEquals(withCategory.getMetadata().category, "business");
  
  const withImpact = withCategory.withImpact(ImpactScope.GLOBAL);
  assertEquals(withImpact.getImpact(), ImpactScope.GLOBAL);
  assertEquals(baseSeverity.getImpact(), ImpactScope.MODULE); // Original unchanged
});

Deno.test("Architecture - ErrorSeverity supports escalation for priority management", () => {
  // Escalation should handle severity comparison and priority management
  const warning = ErrorSeverity.warning();
  const error = ErrorSeverity.error();
  const critical = ErrorSeverity.critical();
  
  // Escalate method should exist
  assertExists(warning.escalate);
  
  // Higher severity should be selected
  const escalated1 = warning.escalate(error);
  assertEquals(escalated1.getLevel(), SeverityLevel.ERROR);
  
  const escalated2 = error.escalate(critical);
  assertEquals(escalated2.getLevel(), SeverityLevel.CRITICAL);
  
  // Same level should consider impact scope
  const highImpactWarning = ErrorSeverity.warning(ImpactScope.GLOBAL);
  const lowImpactWarning = ErrorSeverity.warning(ImpactScope.LOCAL);
  const escalated3 = lowImpactWarning.escalate(highImpactWarning);
  assertEquals(escalated3.getImpact(), ImpactScope.GLOBAL);
});

Deno.test("Architecture - ErrorSeverity provides comprehensive comparison methods", () => {
  const warning = ErrorSeverity.warning();
  const error = ErrorSeverity.error();
  const critical = ErrorSeverity.critical();
  
  // Comparison methods must exist
  assertExists(warning.isAtLeast);
  assertExists(warning.isHigherThan);
  assertExists(warning.requiresNotification);
  assertExists(warning.requiresImmediateAction);
  assertExists(warning.requiresSystemHalt);
  assertExists(warning.shouldLog);
  
  // Level comparison
  assertEquals(warning.isAtLeast(SeverityLevel.WARNING), true);
  assertEquals(warning.isAtLeast(SeverityLevel.ERROR), false);
  
  assertEquals(error.isHigherThan(warning), true);
  assertEquals(warning.isHigherThan(error), false);
  
  // Action requirement checks
  assertEquals(critical.requiresImmediateAction(), true);
  assertEquals(warning.requiresImmediateAction(), false);
  
  assertEquals(ErrorSeverity.fatal().requiresSystemHalt(), true);
  assertEquals(critical.requiresSystemHalt(), false);
});

Deno.test("Architecture - ErrorSeverity serialization is consistent and reversible", () => {
  const severity = ErrorSeverity.error(ImpactScope.SYSTEM, {
    code: "E001",
    category: "validation",
    timestamp: new Date("2023-01-01T00:00:00Z"),
    context: { field: "username" },
  });
  
  // String representation
  const stringRepr = severity.toString();
  assertExists(stringRepr);
  assertEquals(typeof stringRepr, "string");
  assertEquals(stringRepr.includes("ErrorSeverity"), true);
  assertEquals(stringRepr.includes("ERROR"), true);
  assertEquals(stringRepr.includes("system"), true);
  
  // JSON representation
  const jsonRepr = severity.toJSON();
  assertExists(jsonRepr);
  assertEquals(typeof jsonRepr, "object");
  assertEquals(jsonRepr.level, "ERROR");
  assertEquals(jsonRepr.numericLevel, SeverityLevel.ERROR);
  assertEquals(jsonRepr.impact, ImpactScope.SYSTEM);
  assertExists(jsonRepr.metadata);
  assertEquals(typeof jsonRepr.requiresNotification, "boolean");
  assertEquals(typeof jsonRepr.requiresImmediateAction, "boolean");
  
  // Log format
  const logFormat = severity.toLogFormat();
  assertExists(logFormat);
  assertEquals(typeof logFormat, "string");
  assertEquals(logFormat.includes("[ERROR]"), true);
  assertEquals(logFormat.includes("impact=system"), true);
  assertEquals(logFormat.includes("code=E001"), true);
  assertEquals(logFormat.includes("category=validation"), true);
});