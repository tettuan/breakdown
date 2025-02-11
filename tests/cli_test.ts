import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";

Deno.test("CLI outputs 'to' when given valid argument", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "to"],
    stdout: "piped",
  });

  const { stdout } = await process.output();
  const output = new TextDecoder().decode(stdout).trim();
  assertEquals(output, "to");
});

Deno.test("CLI errors on invalid argument", async () => {
  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "invalid"],
    stderr: "piped",
  });

  const { stderr } = await process.output();
  const error = new TextDecoder().decode(stderr).trim();
  assertEquals(error, "Invalid argument. Must be one of: to, summary, defect");
}); 