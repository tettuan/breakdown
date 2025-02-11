import { assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { getConfig, setConfig } from "../breakdown/config/config.ts";
import { ensureDir, exists } from "https://deno.land/std@0.208.0/fs/mod.ts";

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
  assertEquals(error, "Invalid first argument. Must be one of: to, summary, defect, init");
});

Deno.test("CLI combines valid demonstrative and layer types with configured separator", async () => {
  const testCases = [
    ["to", "project"],
    ["to", "issue"],
    ["summary", "issue"],
    ["defect", "issue"],
    ["to", "task"],
  ];

  for (const [demonstrative, layer] of testCases) {
    const process = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", "cli/breakdown.ts", demonstrative, layer],
      stdout: "piped",
    });

    const { stdout } = await process.output();
    const output = new TextDecoder().decode(stdout).trim();
    assertEquals(output, `${demonstrative}${getConfig().output_format}${layer}`);
  }
});

Deno.test("CLI creates working directory on init", async () => {
  const config = getConfig();
  try {
    await Deno.remove(config.working_dir, { recursive: true });
  } catch {
    // ディレクトリが存在しない場合は無視
  }

  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "init"],
    stdout: "piped",
  });

  const { stdout } = await process.output();
  const output = new TextDecoder().decode(stdout).trim();
  assertEquals(output, `Created working directory: ${config.working_dir}`);
  
  const dirExists = await exists(config.working_dir);
  assertEquals(dirExists, true);
});

Deno.test("CLI reports existing directory on init", async () => {
  const config = getConfig();
  await ensureDir(config.working_dir);

  const process = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "cli/breakdown.ts", "init"],
    stdout: "piped",
  });

  const { stdout } = await process.output();
  const output = new TextDecoder().decode(stdout).trim();
  assertEquals(output, `Working directory already exists: ${config.working_dir}`);
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