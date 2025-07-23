/**
 * User Config Loader
 * テスト用の設定ファイルローダー
 */

import { join } from "@std/path";
import { parse } from "@std/yaml";
import { ConfigProfile } from "./config_profile_name.ts";

export async function loadUserConfig(profile: ConfigProfile): Promise<Record<string, unknown>> {
  // Get the directory of this module
  const moduleUrl = new URL(import.meta.url);
  const moduleDir = moduleUrl.pathname.substring(0, moduleUrl.pathname.lastIndexOf("/"));

  // Calculate path relative to this module
  const configPath = join(
    moduleDir,
    "../..", // Go up from lib/config to project root
    "tests",
    "fixtures",
    "configs",
    `${profile.value}-user.yml`,
  );

  try {
    const content = await Deno.readTextFile(configPath);
    return parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to load config ${configPath}: ${error}`);
  }
}
