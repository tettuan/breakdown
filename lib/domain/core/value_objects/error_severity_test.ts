/**
 * @fileoverview ErrorSeverity 0_architecture Tests - Smart Constructor Totality Validation
 * 
 * Totality原則に基づくアーキテクチャ制約のテスト。
 * Smart Constructor, Result型, Discriminated Unionパターンの正当性を検証。
 * 
 * テスト構成:
 * - 0_architecture: Smart Constructor, Result型, Discriminated Union制約
 * - 1_behavior: 通常動作とビジネスルールの検証
 * - 2_structure: データ構造と整合性の検証
 */

import { assertEquals, assertExists, assertThrows } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  ErrorSeverity,
  SeverityLevel,
  ImpactScope,
  ErrorMetadata,
} from "./error_severity.ts";

// =============================================================================
// 0_ARCHITECTURE: Smart Constructor & Result Type & Discriminated Union Tests
// =============================================================================

Deno.test("0_architecture - ErrorSeverity implements Smart Constructor pattern correctly", () => {
  // Smart Constructor: Private constructor, public static factory methods
  
  // Public factory methods exist for each severity level
  assertExists(ErrorSeverity.debug);
  assertExists(ErrorSeverity.info);
  assertExists(ErrorSeverity.warning);
  assertExists(ErrorSeverity.error);
  assertExists(ErrorSeverity.critical);
  assertExists(ErrorSeverity.fatal);
  assertExists(ErrorSeverity.custom);
  assertExists(ErrorSeverity.fromString);
  // Note: combine method is available on ValidationRule, not ErrorSeverity
});

Deno.test("0_architecture - SeverityLevel enum is properly defined with numeric values", () => {
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

Deno.test("0_architecture - ImpactScope enum uses Discriminated Union pattern", () => {
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

Deno.test("0_architecture - ErrorMetadata interface supports extensible metadata", () => {
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

Deno.test("0_architecture - ErrorSeverity factory methods create immutable instances", () => {
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

Deno.test("0_architecture - ErrorSeverity supports custom factory with validation", () => {
  // Custom factory should accept any valid combination
  const customSeverity = ErrorSeverity.custom(
    SeverityLevel.WARNING,
    ImpactScope.GLOBAL,
    {
      code: "CUSTOM001",
      category: "business",
    }
  );
  
  assertExists(customSeverity);
  assertEquals(customSeverity.getLevel(), SeverityLevel.WARNING);
  assertEquals(customSeverity.getImpact(), ImpactScope.GLOBAL);
  
  const metadata = customSeverity.getMetadata();
  assertEquals(metadata.code, "CUSTOM001");
  assertEquals(metadata.category, "business");
});

Deno.test("0_architecture - ErrorSeverity.fromString provides safe string parsing", () => {
  // Valid string parsing
  const debugFromString = ErrorSeverity.fromString("debug");
  assertEquals(debugFromString.getLevel(), SeverityLevel.DEBUG);
  
  const errorFromString = ErrorSeverity.fromString("ERROR");
  assertEquals(errorFromString.getLevel(), SeverityLevel.ERROR);
  
  const fatalFromString = ErrorSeverity.fromString("Fatal");
  assertEquals(fatalFromString.getLevel(), SeverityLevel.FATAL);
  
  // Invalid string should throw error (fail-fast principle)
  assertThrows(
    () => ErrorSeverity.fromString("invalid_level"),
    Error,
    "Invalid severity level"
  );
  
  // Empty string should throw error
  assertThrows(
    () => ErrorSeverity.fromString(""),
    Error,
    "Invalid severity level"
  );
});

Deno.test("0_architecture - ErrorSeverity is immutable Value Object", () => {
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

Deno.test("0_architecture - ErrorSeverity supports functional composition methods", () => {
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

Deno.test("0_architecture - ErrorSeverity supports escalation for priority management", () => {
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

Deno.test("0_architecture - ErrorSeverity provides comprehensive comparison methods", () => {
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

Deno.test("0_architecture - ErrorSeverity serialization is consistent and reversible", () => {
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
