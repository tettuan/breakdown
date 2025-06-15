/**
 * Config Prefix Detector Tests
 */

import { assertEquals } from "@std/assert";
import { ConfigPrefixDetector } from "./config_prefix_detector.ts";

Deno.test("ConfigPrefixDetector.detectConfigPath - detects --config option", () => {
  const args = ["--config", "my-config.yml", "--other", "value"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, "my-config.yml");
});

Deno.test("ConfigPrefixDetector.detectConfigPath - detects -c short option", () => {
  const args = ["-c", "short-config.yml", "--other", "value"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, "short-config.yml");
});

Deno.test("ConfigPrefixDetector.detectConfigPath - returns undefined when not found", () => {
  const args = ["--other", "value", "--input", "test"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, undefined);
});

Deno.test("ConfigPrefixDetector.detectConfigPath - ignores config without value", () => {
  const args = ["--config"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, undefined);
});

Deno.test("ConfigPrefixDetector.detectConfigPath - ignores config followed by another option", () => {
  const args = ["--config", "--other-option", "value"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, undefined);
});

Deno.test("ConfigPrefixDetector.detectConfigPath - handles config at end of args", () => {
  const args = ["--other", "value", "--config", "end-config.yml"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, "end-config.yml");
});

Deno.test("ConfigPrefixDetector.detectConfigPath - returns first config when multiple exist", () => {
  const args = ["--config", "first.yml", "-c", "second.yml"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, "first.yml");
});

Deno.test("ConfigPrefixDetector.detectConfigPath - handles empty args array", () => {
  const args: string[] = [];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, undefined);
});

Deno.test("ConfigPrefixDetector.detectConfigPath - handles predefined config names", () => {
  const args = ["--config", "test", "--other", "value"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, "test");
});

Deno.test("ConfigPrefixDetector.detectConfigPath - handles file paths with spaces when quoted", () => {
  const args = ["--config", "my config file.yml", "--other", "value"];
  const result = ConfigPrefixDetector.detectConfigPath(args);
  assertEquals(result, "my config file.yml");
});