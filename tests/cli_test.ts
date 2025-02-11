import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { getConfig, setConfig } from "../breakdown/config/config.ts";

Deno.test("CLI outputs 'to' when given single valid argument", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "to"],
    stdout: "piped",
  });

  const { stdout } = await process.output();
  const output = new TextDecoder().decode(stdout).trim();
  assertEquals(output, "to");
});

Deno.test("CLI errors on invalid first argument", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "invalid"],
    stderr: "piped",
  });

  const { stderr } = await process.output();
  const error = new TextDecoder().decode(stderr).trim();
  assertEquals(error, "Invalid first argument. Must be one of: to, summary, defect");
});

Deno.test("CLI combines valid demonstrative and layer types with default separator", async () => {
  const testCases = [
    ["to", "project", "to-project"],
    ["to", "issue", "to-issue"],
    ["summary", "issue", "summary-issue"],
    ["defect", "issue", "defect-issue"],
    ["to", "task", "to-task"],
  ];

  for (const [demonstrative, layer, expected] of testCases) {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "cli/breakdown.ts", demonstrative, layer],
      stdout: "piped",
    });

    const { stdout } = await process.output();
    const output = new TextDecoder().decode(stdout).trim();
    assertEquals(output, expected);
  }
});

Deno.test("CLI errors on invalid layer type", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "to", "invalid"],
    stderr: "piped",
  });

  const { stderr } = await process.output();
  const error = new TextDecoder().decode(stderr).trim();
  assertEquals(error, "Invalid second argument. Must be one of: project, issue, task");
}); 