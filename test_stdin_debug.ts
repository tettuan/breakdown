import { runCommand } from "./tests/helpers/setup.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

const TEST_DIR = "tmp/test_stdin_debug";
await ensureDir(TEST_DIR);

// Initialize workspace
await runCommand(["init"], undefined, TEST_DIR);

// Create directories
const promptsDir = join(TEST_DIR, ".agent", "breakdown", "prompts");
await ensureDir(join(promptsDir, "summary", "project"));

// Create config
const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
await ensureDir(configDir);
await Deno.writeTextFile(
  join(configDir, "app.yml"),
  `working_dir: .agent/breakdown
app_prompt:
  base_dir: .agent/breakdown/prompts
app_schema:
  base_dir: schema
`,
);

// Create template
await Deno.writeTextFile(
  join(promptsDir, "summary", "project", "f_project.md"),
  "Input: {input_text}\nOutput: Summary",
);

// Test the command
const input = "This is a test project summary from stdin.";
const outputFile = "output/project_summary.md";
await ensureDir(join(TEST_DIR, "output"));
const result = await runCommand(
  ["summary", "project", "--from", "-", "-o", outputFile],
  input,
  TEST_DIR,
);

console.log("Result:", JSON.stringify(result, null, 2));

// Cleanup
await Deno.remove(TEST_DIR, { recursive: true });
EOF < /dev/null;
