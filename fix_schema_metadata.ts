#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script to fix schema metadata objects in test file
 */

const filePath =
  "/Users/tettuan/github/breakdown/tests/2_generic_domain/templates/schema_repository_test.ts";

try {
  let content = await Deno.readTextFile(filePath);

  // Replace all metadata objects with createMockMetadata calls
  content = content.replace(
    /{ version: "1\.0\.0" }/g,
    'createMockMetadata({ version: "1.0.0" })',
  );

  content = content.replace(
    /{ title: "([^"]+)", version: "([^"]+)" }/g,
    'createMockMetadata({ title: "$1", version: "$2" })',
  );

  content = content.replace(
    /{ title: "([^"]+)", description: "([^"]+)", version: "([^"]+)" }/g,
    'createMockMetadata({ title: "$1", description: "$2", version: "$3" })',
  );

  await Deno.writeTextFile(filePath, content);
  console.log("Fixed metadata objects");
} catch (error) {
  console.error("Error fixing metadata:", error);
}

console.log("Schema metadata fixes completed");
