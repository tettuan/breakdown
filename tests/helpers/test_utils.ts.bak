import { join } from "@std/path/join";

/**
 * Base directory for all test files
 */
export const TEST_BASE_DIR = "./tmp/test";

/**
 * Gets test environment options for a specific test module
 */
export function getTestEnvOptions(testModule: string) {
  return {
    workingDir: join(TEST_BASE_DIR, testModule),
  };
}
