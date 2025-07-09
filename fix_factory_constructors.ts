#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Script to fix private PromptVariablesFactory constructor calls
 */

const filesToFix = [
  "/Users/tettuan/github/breakdown/tests/2_generic_domain/factory/prompt_variables_factory_integration_test.ts",
  "/Users/tettuan/github/breakdown/tests/2_generic_domain/factory/input_file_path_resolver_integration_test.ts",
  "/Users/tettuan/github/breakdown/tests/2_generic_domain/templates/schema_repository_test.ts",
];

for (const filePath of filesToFix) {
  try {
    let content = await Deno.readTextFile(filePath);

    // Replace all instances of "new PromptVariablesFactory(config)" patterns
    content = content.replace(
      /const factory = new PromptVariablesFactory\(([^)]+)\);/g,
      (match, configVar) => {
        return `const factoryResult = PromptVariablesFactory.createWithConfig(${configVar}, createTestParams("to", "project", {}));
  if (!factoryResult.ok) throw new Error("Factory creation failed");
  const factory = factoryResult.data;`;
      },
    );

    // Replace other variations
    content = content.replace(
      /const ([a-zA-Z]+Factory) = new PromptVariablesFactory\(([^)]+)\);/g,
      (match, factoryName, configVar) => {
        return `const ${factoryName}Result = PromptVariablesFactory.createWithConfig(${configVar}, createTestParams("to", "project", {}));
  if (!${factoryName}Result.ok) throw new Error("${factoryName} creation failed");
  const ${factoryName} = ${factoryName}Result.data;`;
      },
    );

    // Replace factory.create(params) with factory.toPromptParams()
    content = content.replace(/factory\.create\(params\)/g, "factory.toPromptParams()");
    content = content.replace(/factory\.create\([^)]+\)/g, "factory.toPromptParams()");

    // Fix error handling
    content = content.replace(
      /error\.message/g,
      "error instanceof Error ? error.message : String(error)",
    );

    await Deno.writeTextFile(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

console.log("Factory constructor fixes completed");
