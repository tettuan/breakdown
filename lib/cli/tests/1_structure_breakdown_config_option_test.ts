import { assertEquals } from "@std/assert";
import { BreakdownConfigOption } from "../../../lib/config/breakdown_config_option.ts";

Deno.test("BreakdownConfigOption - parses --config=prefix format", () => {
  const args = ["node", "script.js", "--config=production"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "production");
  assertEquals(option.hasConfigOption(), true);
});

Deno.test("BreakdownConfigOption - parses -c=prefix format", () => {
  const args = ["node", "script.js", "-c=staging"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "staging");
  assertEquals(option.hasConfigOption(), true);
});

Deno.test("BreakdownConfigOption - parses --config prefix space-separated format", () => {
  const args = ["node", "script.js", "--config", "development"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "development");
  assertEquals(option.hasConfigOption(), true);
});

Deno.test("BreakdownConfigOption - parses -c prefix space-separated format", () => {
  const args = ["node", "script.js", "-c", "test"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "test");
  assertEquals(option.hasConfigOption(), true);
});

Deno.test("BreakdownConfigOption - returns undefined when no config option", () => {
  const args = ["node", "script.js", "--other-option"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), undefined);
  assertEquals(option.hasConfigOption(), false);
});

Deno.test("BreakdownConfigOption - handles empty prefix", () => {
  const args = ["node", "script.js", "--config="];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "");
  assertEquals(option.hasConfigOption(), true);
});

Deno.test("BreakdownConfigOption - ignores next option as value", () => {
  const args = ["node", "script.js", "--config", "--another-option"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), undefined);
  assertEquals(option.hasConfigOption(), false);
});

Deno.test("BreakdownConfigOption - ignores -c at end of args", () => {
  const args = ["node", "script.js", "-c"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), undefined);
  assertEquals(option.hasConfigOption(), false);
});

Deno.test("BreakdownConfigOption - takes first config option when multiple exist", () => {
  const args = ["node", "script.js", "--config=first", "-c=second"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "first");
  assertEquals(option.hasConfigOption(), true);
});

Deno.test("BreakdownConfigOption - handles complex prefix values", () => {
  const args = ["node", "script.js", "--config=prod-v2.1"];
  const option = new BreakdownConfigOption(args);

  assertEquals(option.getConfigPrefix(), "prod-v2.1");
  assertEquals(option.hasConfigOption(), true);
});
