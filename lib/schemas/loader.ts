/**
 * Schema Loader
 * 
 * This module provides functionality to load schema definitions.
 */

import { exists, join } from "../../deps.ts";
import { getConfig } from "$lib/config/config.ts";
import { SCHEMAS } from "./definitions.ts";

// Environment variable to control resource loading mode
const USE_EMBEDDED_RESOURCES = Deno.env.get("USE_EMBEDDED_RESOURCES") === "true";

/**
 * Load a schema definition
 * 
 * @param type The command type (to, summary, defect)
 * @param layer The layer type (project, issue, task)
 * @returns The schema definition as a JSON object
 */
export async function loadSchema(type: string, layer: string): Promise<unknown> {
  // Use embedded resources if specified or if running in production mode
  if (USE_EMBEDDED_RESOURCES) {
    if (!SCHEMAS[type] || !SCHEMAS[type][layer]) {
      throw new Error(`Schema not found for ${type}/${layer}`);
    }
    return JSON.parse(SCHEMAS[type][layer]);
  }
  
  // Otherwise, load from file system
  const config = getConfig();
  const schemaPath = join(config.workingDirectory, "schemas", type, layer, "base.schema.json");
  
  if (!await exists(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }
  
  const content = await Deno.readTextFile(schemaPath);
  return JSON.parse(content);
} 