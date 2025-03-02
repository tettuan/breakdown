// Re-export from main deps.ts
// Using explicit imports and exports to ensure everything is properly re-exported
import { 
  exists, 
  join, 
  dirname, 
  ensureDir, 
  parse, 
  assertEquals, 
  assert, 
  assertStringIncludes, 
  assertRejects 
} from "../deps.ts";

export { 
  exists, 
  join, 
  dirname, 
  ensureDir, 
  parse, 
  assertEquals, 
  assert, 
  assertStringIncludes, 
  assertRejects 
}; 