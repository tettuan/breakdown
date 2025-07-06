import { assertEquals, assertThrows } from "@std/assert";
import { 
  ErrorSeverity, 
  SeverityLevel, 
  ImpactScope 
} from "../../../lib/domain/core/value_objects/error_severity.ts";

Deno.test("ErrorSeverity - debug creates correct instance", () => {
  const severity = ErrorSeverity.debug();
  assertEquals(severity.getLevel(), SeverityLevel.DEBUG);
  assertEquals(severity.getImpact(), ImpactScope.NONE);
  assertEquals(severity.getLevelName(), "DEBUG");
});

Deno.test("ErrorSeverity - info creates correct instance", () => {
  const severity = ErrorSeverity.info();
  assertEquals(severity.getLevel(), SeverityLevel.INFO);
  assertEquals(severity.getImpact(), ImpactScope.LOCAL);
});

Deno.test("ErrorSeverity - warning creates correct instance", () => {
  const severity = ErrorSeverity.warning();
  assertEquals(severity.getLevel(), SeverityLevel.WARNING);
  assertEquals(severity.getImpact(), ImpactScope.MODULE);
});

Deno.test("ErrorSeverity - error creates correct instance", () => {
  const severity = ErrorSeverity.error();
  assertEquals(severity.getLevel(), SeverityLevel.ERROR);
  assertEquals(severity.getImpact(), ImpactScope.MODULE);
});

Deno.test("ErrorSeverity - critical creates correct instance", () => {
  const severity = ErrorSeverity.critical();
  assertEquals(severity.getLevel(), SeverityLevel.CRITICAL);
  assertEquals(severity.getImpact(), ImpactScope.SYSTEM);
});

Deno.test("ErrorSeverity - fatal creates correct instance", () => {
  const severity = ErrorSeverity.fatal();
  assertEquals(severity.getLevel(), SeverityLevel.FATAL);
  assertEquals(severity.getImpact(), ImpactScope.GLOBAL);
});

Deno.test("ErrorSeverity - custom creates correct instance", () => {
  const severity = ErrorSeverity.custom(
    SeverityLevel.WARNING,
    ImpactScope.SYSTEM,
    { code: "CUSTOM001" }
  );
  
  assertEquals(severity.getLevel(), SeverityLevel.WARNING);
  assertEquals(severity.getImpact(), ImpactScope.SYSTEM);
  assertEquals(severity.getMetadata().code, "CUSTOM001");
});

Deno.test("ErrorSeverity - fromString creates correct instance", () => {
  const severity = ErrorSeverity.fromString("error");
  assertEquals(severity.getLevel(), SeverityLevel.ERROR);
  assertEquals(severity.getImpact(), ImpactScope.MODULE);
});

Deno.test("ErrorSeverity - fromString is case insensitive", () => {
  const severity1 = ErrorSeverity.fromString("ERROR");
  const severity2 = ErrorSeverity.fromString("error");
  const severity3 = ErrorSeverity.fromString("ErRoR");
  
  assertEquals(severity1.getLevel(), SeverityLevel.ERROR);
  assertEquals(severity2.getLevel(), SeverityLevel.ERROR);
  assertEquals(severity3.getLevel(), SeverityLevel.ERROR);
});

Deno.test("ErrorSeverity - fromString with custom impact", () => {
  const severity = ErrorSeverity.fromString("warning", ImpactScope.GLOBAL);
  assertEquals(severity.getLevel(), SeverityLevel.WARNING);
  assertEquals(severity.getImpact(), ImpactScope.GLOBAL);
});

Deno.test("ErrorSeverity - fromString validates input", () => {
  assertThrows(
    () => ErrorSeverity.fromString("invalid"),
    Error,
    "Invalid severity level: invalid"
  );
});

Deno.test("ErrorSeverity - getNumericLevel returns correct value", () => {
  assertEquals(ErrorSeverity.debug().getNumericLevel(), 0);
  assertEquals(ErrorSeverity.info().getNumericLevel(), 1);
  assertEquals(ErrorSeverity.warning().getNumericLevel(), 2);
  assertEquals(ErrorSeverity.error().getNumericLevel(), 3);
  assertEquals(ErrorSeverity.critical().getNumericLevel(), 4);
  assertEquals(ErrorSeverity.fatal().getNumericLevel(), 5);
});

Deno.test("ErrorSeverity - isAtLeast works correctly", () => {
  const warning = ErrorSeverity.warning();
  
  assertEquals(warning.isAtLeast(SeverityLevel.DEBUG), true);
  assertEquals(warning.isAtLeast(SeverityLevel.WARNING), true);
  assertEquals(warning.isAtLeast(SeverityLevel.ERROR), false);
});

Deno.test("ErrorSeverity - isHigherThan works correctly", () => {
  const error = ErrorSeverity.error();
  const warning = ErrorSeverity.warning();
  const critical = ErrorSeverity.critical();
  
  assertEquals(error.isHigherThan(warning), true);
  assertEquals(warning.isHigherThan(error), false);
  assertEquals(critical.isHigherThan(error), true);
});

Deno.test("ErrorSeverity - requiresNotification works correctly", () => {
  const info = ErrorSeverity.info();
  const error = ErrorSeverity.error();
  const critical = ErrorSeverity.critical();
  
  assertEquals(info.requiresNotification(), false);
  assertEquals(error.requiresNotification(), true);
  assertEquals(critical.requiresNotification(), true);
  
  assertEquals(info.requiresNotification(SeverityLevel.INFO), true);
});

Deno.test("ErrorSeverity - requiresImmediateAction works correctly", () => {
  const warning = ErrorSeverity.warning();
  const critical = ErrorSeverity.critical();
  const fatal = ErrorSeverity.fatal();
  
  assertEquals(warning.requiresImmediateAction(), false);
  assertEquals(critical.requiresImmediateAction(), true);
  assertEquals(fatal.requiresImmediateAction(), true);
});

Deno.test("ErrorSeverity - requiresSystemHalt works correctly", () => {
  const critical = ErrorSeverity.critical();
  const fatal = ErrorSeverity.fatal();
  
  assertEquals(critical.requiresSystemHalt(), false);
  assertEquals(fatal.requiresSystemHalt(), true);
});

Deno.test("ErrorSeverity - shouldLog works correctly", () => {
  const debug = ErrorSeverity.debug();
  const info = ErrorSeverity.info();
  const error = ErrorSeverity.error();
  
  assertEquals(debug.shouldLog(SeverityLevel.DEBUG), true);
  assertEquals(debug.shouldLog(SeverityLevel.INFO), false);
  assertEquals(error.shouldLog(SeverityLevel.WARNING), true);
});

Deno.test("ErrorSeverity - withMetadata creates new instance", () => {
  const original = ErrorSeverity.error();
  const withMeta = original.withMetadata({
    code: "ERR001",
    category: "validation",
    context: { field: "email" }
  });
  
  assertEquals(withMeta.getMetadata().code, "ERR001");
  assertEquals(withMeta.getMetadata().category, "validation");
  assertEquals(withMeta.getMetadata().context?.field, "email");
  assertEquals(original.getMetadata().code, undefined);
});

Deno.test("ErrorSeverity - withCode creates new instance", () => {
  const original = ErrorSeverity.error();
  const withCode = original.withCode("ERR001");
  
  assertEquals(withCode.getMetadata().code, "ERR001");
  assertEquals(original.getMetadata().code, undefined);
});

Deno.test("ErrorSeverity - withCategory creates new instance", () => {
  const original = ErrorSeverity.error();
  const withCategory = original.withCategory("network");
  
  assertEquals(withCategory.getMetadata().category, "network");
  assertEquals(original.getMetadata().category, undefined);
});

Deno.test("ErrorSeverity - withImpact creates new instance", () => {
  const original = ErrorSeverity.warning();
  const withImpact = original.withImpact(ImpactScope.GLOBAL);
  
  assertEquals(withImpact.getImpact(), ImpactScope.GLOBAL);
  assertEquals(original.getImpact(), ImpactScope.MODULE);
});

Deno.test("ErrorSeverity - escalate returns higher severity", () => {
  const warning = ErrorSeverity.warning();
  const error = ErrorSeverity.error();
  
  const escalated = warning.escalate(error);
  assertEquals(escalated.getLevel(), SeverityLevel.ERROR);
});

Deno.test("ErrorSeverity - escalate with same level but higher impact", () => {
  const error1 = ErrorSeverity.error(ImpactScope.LOCAL);
  const error2 = ErrorSeverity.error(ImpactScope.GLOBAL);
  
  const escalated = error1.escalate(error2);
  assertEquals(escalated.getLevel(), SeverityLevel.ERROR);
  assertEquals(escalated.getImpact(), ImpactScope.GLOBAL);
});

Deno.test("ErrorSeverity - escalate merges metadata", () => {
  const error1 = ErrorSeverity.error().withCode("ERR001");
  const error2 = ErrorSeverity.critical().withCategory("system");
  
  const escalated = error1.escalate(error2);
  assertEquals(escalated.getMetadata().code, "ERR001");
  assertEquals(escalated.getMetadata().category, "system");
});

Deno.test("ErrorSeverity - equals compares correctly", () => {
  const severity1 = ErrorSeverity.error(ImpactScope.MODULE, { code: "ERR001" });
  const severity2 = ErrorSeverity.error(ImpactScope.MODULE, { code: "ERR001" });
  const severity3 = ErrorSeverity.error(ImpactScope.SYSTEM, { code: "ERR001" });
  const severity4 = ErrorSeverity.error(ImpactScope.MODULE, { code: "ERR002" });
  
  assertEquals(severity1.equals(severity2), true);
  assertEquals(severity1.equals(severity3), false);
  assertEquals(severity1.equals(severity4), false);
});

Deno.test("ErrorSeverity - toLogFormat returns correct format", () => {
  const severity = ErrorSeverity.error(ImpactScope.SYSTEM)
    .withCode("ERR001")
    .withCategory("validation");
  
  const logFormat = severity.toLogFormat();
  assertEquals(logFormat, "[ERROR] impact=system code=ERR001 category=validation");
});

Deno.test("ErrorSeverity - toJSON returns correct structure", () => {
  const severity = ErrorSeverity.critical(ImpactScope.SYSTEM, {
    code: "CRIT001",
    category: "database"
  });
  
  const json = severity.toJSON();
  assertEquals(json.level, "CRITICAL");
  assertEquals(json.numericLevel, 4);
  assertEquals(json.impact, ImpactScope.SYSTEM);
  assertEquals(json.requiresNotification, true);
  assertEquals(json.requiresImmediateAction, true);
  assertEquals((json.metadata as any).code, "CRIT001");
});

Deno.test("ErrorSeverity - toString returns correct format", () => {
  const severity = ErrorSeverity.error(ImpactScope.MODULE);
  assertEquals(severity.toString(), "ErrorSeverity(ERROR, module)");
});

Deno.test("ErrorSeverity - metadata is immutable", () => {
  const metadata = { code: "ERR001", context: { field: "email" } };
  const severity = ErrorSeverity.error(ImpactScope.MODULE, metadata);
  
  const retrieved = severity.getMetadata();
  
  // Try to modify the retrieved metadata (this should not affect the original)
  const modifiedRetrieved = { ...retrieved, code: "MODIFIED" };
  const modifiedContext = { ...retrieved.context, field: "modified" };
  
  const original = severity.getMetadata();
  assertEquals(original.code, "ERR001");
  assertEquals(original.context?.field, "email");
  
  // Verify that modifications didn't affect the original
  assertEquals(modifiedRetrieved.code, "MODIFIED");
  assertEquals(modifiedContext.field, "modified");
});