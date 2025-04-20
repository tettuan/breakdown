import { exists } from "@std/fs";

/**
 * Check if the current directory is a valid workspace
 */
export async function checkWorkingDir(): Promise<boolean> {
  return await exists("breakdown");
}
