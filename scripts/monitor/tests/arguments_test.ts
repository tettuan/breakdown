import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { ArgumentParser } from "../arguments.ts";
import { TimeManager, Logger } from "../services.ts";
import { MonitoringOptions, ValidatedTime } from "../models.ts";

// =============================================================================
// Mock classes for testing
// =============================================================================

class MockTimeManager extends TimeManager {
  constructor() {
    super();
  }
}

class MockLogger extends Logger {
  constructor() {
    super();
  }
}

// =============================================================================
// Test helper functions
// =============================================================================

function setupMockArgs(args: string[]): void {
  // Store original args
  const originalArgs = Deno.args;
  
  // Mock Deno.args
  Object.defineProperty(Deno, 'args', {
    value: args,
    writable: true,
    configurable: true
  });
}

function restoreMockArgs(): void {
  // Restore original args behavior
  Object.defineProperty(Deno, 'args', {
    value: [],
    writable: true,
    configurable: true
  });
}

// =============================================================================
// ArgumentParser Tests
// =============================================================================

Deno.test("ArgumentParser: parse() - no arguments", () => {
  setupMockArgs([]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assert(!result.data.isContinuous());
  assertEquals(result.data.getScheduledTime(), null);
  assertEquals(result.data.getInstructionFile(), null);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - continuous flag --continuous", () => {
  setupMockArgs(["--continuous"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assert(result.data.isContinuous());
  assertEquals(result.data.getScheduledTime(), null);
  assertEquals(result.data.getInstructionFile(), null);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - continuous flag -c", () => {
  setupMockArgs(["-c"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assert(result.data.isContinuous());
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - time flag --time=HH:MM", () => {
  setupMockArgs(["--time=14:30"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assert(!result.data.isContinuous());
  
  const scheduledTime = result.data.getScheduledTime();
  assertExists(scheduledTime);
  assertEquals(scheduledTime.getHours(), 14);
  assertEquals(scheduledTime.getMinutes(), 30);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - time flag -t HH:MM", () => {
  setupMockArgs(["-t", "04:00"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  
  const scheduledTime = result.data.getScheduledTime();
  assertExists(scheduledTime);
  assertEquals(scheduledTime.getHours(), 4);
  assertEquals(scheduledTime.getMinutes(), 0);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - invalid time format", () => {
  setupMockArgs(["--time=invalid"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(!result.ok);
  assertEquals(result.error.kind, "InvalidFormat");
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - instruction file --instruction=path", () => {
  setupMockArgs(["--instruction=test/file.md"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assertEquals(result.data.getInstructionFile(), "test/file.md");
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - instruction file -i path", () => {
  setupMockArgs(["-i", "draft/file.md"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assertEquals(result.data.getInstructionFile(), "draft/file.md");
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - combined arguments", () => {
  setupMockArgs(["-c", "--time=14:30", "--instruction=test.md"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assert(result.data.isContinuous());
  
  const scheduledTime = result.data.getScheduledTime();
  assertExists(scheduledTime);
  assertEquals(scheduledTime.getHours(), 14);
  assertEquals(scheduledTime.getMinutes(), 30);
  
  assertEquals(result.data.getInstructionFile(), "test.md");
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - missing argument for -t flag", () => {
  setupMockArgs(["-t"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  // Should succeed but with no scheduled time since no value provided
  assert(result.ok);
  assertEquals(result.data.getScheduledTime(), null);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - missing argument for -i flag", () => {
  setupMockArgs(["-i"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  // Should succeed but with no instruction file since no value provided
  assert(result.ok);
  assertEquals(result.data.getInstructionFile(), null);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - multiple time arguments (last one wins)", () => {
  setupMockArgs(["--time=10:00", "-t", "14:30"]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  
  const scheduledTime = result.data.getScheduledTime();
  assertExists(scheduledTime);
  assertEquals(scheduledTime.getHours(), 14);
  assertEquals(scheduledTime.getMinutes(), 30);
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - edge case empty time string", () => {
  setupMockArgs(["--time="]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(!result.ok);
  assertEquals(result.error.kind, "EmptyInput");
  
  restoreMockArgs();
});

Deno.test("ArgumentParser: parse() - edge case empty instruction string", () => {
  setupMockArgs(["--instruction="]);
  
  const timeManager = new MockTimeManager();
  const logger = new MockLogger();
  const parser = new ArgumentParser(timeManager, logger);

  const result = parser.parse();
  
  assert(result.ok);
  assertEquals(result.data.getInstructionFile(), "");
  
  restoreMockArgs();
});
