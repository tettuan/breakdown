/**
 * Boundary Value Tests for BreakdownConfigPrefix Detection
 *
 * Tests edge cases and boundary values for --config/-c option parsing
 * in BreakdownConfigOption class.
 */

import { assertEquals } from "@std/assert";
import { BreakdownConfigOption } from "../../../lib/config/breakdown_config_option.ts";

Deno.test("BreakdownConfigPrefix - Boundary Value Tests", async (t) => {
  await t.step("Empty prefix boundary", () => {
    const option = new BreakdownConfigOption(["--config="]);
    assertEquals(option.getConfigPrefix(), "");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Single character prefix", () => {
    const option = new BreakdownConfigOption(["-c=a"]);
    assertEquals(option.getConfigPrefix(), "a");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Very long prefix", () => {
    const longPrefix = "a".repeat(1000);
    const option = new BreakdownConfigOption([`--config=${longPrefix}`]);
    assertEquals(option.getConfigPrefix(), longPrefix);
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Prefix with special characters", () => {
    const specialPrefix = "config=prod-v2.1_custom@env.yml";
    const option = new BreakdownConfigOption([`--config=${specialPrefix}`]);
    assertEquals(option.getConfigPrefix(), specialPrefix);
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Unicode prefix", () => {
    const unicodePrefix = "設定ファイル-テスト.yml";
    const option = new BreakdownConfigOption([`-c=${unicodePrefix}`]);
    assertEquals(option.getConfigPrefix(), unicodePrefix);
    assertEquals(option.hasConfigOption(), true);
  });
});

Deno.test("BreakdownConfigPrefix - Error Boundary Tests", async (t) => {
  await t.step("Missing value at end of arguments", () => {
    const option = new BreakdownConfigOption(["--config"]);
    assertEquals(option.getConfigPrefix(), undefined);
    assertEquals(option.hasConfigOption(), false);
  });

  await t.step("Missing value with short form", () => {
    const option = new BreakdownConfigOption(["-c"]);
    assertEquals(option.getConfigPrefix(), undefined);
    assertEquals(option.hasConfigOption(), false);
  });

  await t.step("Next argument is another option", () => {
    const option = new BreakdownConfigOption(["--config", "--help"]);
    assertEquals(option.getConfigPrefix(), undefined);
    assertEquals(option.hasConfigOption(), false);
  });

  await t.step("Next argument is another short option", () => {
    const option = new BreakdownConfigOption(["-c", "-h"]);
    assertEquals(option.getConfigPrefix(), undefined);
    assertEquals(option.hasConfigOption(), false);
  });

  await t.step("Config option in middle with missing value", () => {
    const option = new BreakdownConfigOption(["somecommand", "--config", "--other"]);
    assertEquals(option.getConfigPrefix(), undefined);
    assertEquals(option.hasConfigOption(), false);
  });
});

Deno.test("BreakdownConfigPrefix - Multiple Options Boundary", async (t) => {
  await t.step("First config wins with equals format", () => {
    const option = new BreakdownConfigOption(["--config=first", "-c=second"]);
    assertEquals(option.getConfigPrefix(), "first");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("First config wins with space format", () => {
    const option = new BreakdownConfigOption(["--config", "first", "-c", "second"]);
    assertEquals(option.getConfigPrefix(), "first");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Mixed format - equals first", () => {
    const option = new BreakdownConfigOption(["-c=first", "--config", "second"]);
    assertEquals(option.getConfigPrefix(), "first");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Mixed format - space first", () => {
    const option = new BreakdownConfigOption(["--config", "first", "-c=second"]);
    assertEquals(option.getConfigPrefix(), "first");
    assertEquals(option.hasConfigOption(), true);
  });
});

Deno.test("BreakdownConfigPrefix - Integration with Other Options", async (t) => {
  await t.step("Config with command arguments", () => {
    const option = new BreakdownConfigOption(["find", "bugs", "--config=test", "--from=src/"]);
    assertEquals(option.getConfigPrefix(), "test");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config at beginning", () => {
    const option = new BreakdownConfigOption(["--config=prod", "find", "bugs"]);
    assertEquals(option.getConfigPrefix(), "prod");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config at end", () => {
    const option = new BreakdownConfigOption(["find", "bugs", "--from=src/", "-c=custom"]);
    assertEquals(option.getConfigPrefix(), "custom");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config with help flag", () => {
    const option = new BreakdownConfigOption(["--config=help.yml", "--help"]);
    assertEquals(option.getConfigPrefix(), "help.yml");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Complex integration", () => {
    const option = new BreakdownConfigOption([
      "find",
      "bugs",
      "--config=./configs/find-bugs.yml",
      "--from=/src/app/",
      "--destination=/tmp/report.md",
      "--extended",
    ]);
    assertEquals(option.getConfigPrefix(), "./configs/find-bugs.yml");
    assertEquals(option.hasConfigOption(), true);
  });
});

Deno.test("BreakdownConfigPrefix - Path and File Format Tests", async (t) => {
  await t.step("Relative path", () => {
    const option = new BreakdownConfigOption(["--config=./config/app.yml"]);
    assertEquals(option.getConfigPrefix(), "./config/app.yml");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Absolute path", () => {
    const option = new BreakdownConfigOption(["-c=/etc/breakdown/config.json"]);
    assertEquals(option.getConfigPrefix(), "/etc/breakdown/config.json");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Windows-style path", () => {
    const option = new BreakdownConfigOption(["--config=C:\\Users\\test\\config.yml"]);
    assertEquals(option.getConfigPrefix(), "C:\\Users\\test\\config.yml");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config name only", () => {
    const option = new BreakdownConfigOption(["-c=production"]);
    assertEquals(option.getConfigPrefix(), "production");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("URL-like config", () => {
    const option = new BreakdownConfigOption(["--config=http://example.com/config.yml"]);
    assertEquals(option.getConfigPrefix(), "http://example.com/config.yml");
    assertEquals(option.hasConfigOption(), true);
  });
});

Deno.test("BreakdownConfigPrefix - Whitespace and Special Cases", async (t) => {
  await t.step("Config with spaces in value", () => {
    const option = new BreakdownConfigOption(["--config", "my config file.yml"]);
    assertEquals(option.getConfigPrefix(), "my config file.yml");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config with tabs", () => {
    const option = new BreakdownConfigOption(["-c", "config\tfile.yml"]);
    assertEquals(option.getConfigPrefix(), "config\tfile.yml");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config with newlines", () => {
    const option = new BreakdownConfigOption(["--config=config\nfile.yml"]);
    assertEquals(option.getConfigPrefix(), "config\nfile.yml");
    assertEquals(option.hasConfigOption(), true);
  });

  await t.step("Config with quotes", () => {
    const option = new BreakdownConfigOption(['-c="quoted-config.yml"']);
    assertEquals(option.getConfigPrefix(), '"quoted-config.yml"');
    assertEquals(option.hasConfigOption(), true);
  });
});
