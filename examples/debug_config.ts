import { BreakdownConfig } from "@tettuan/breakdownconfig";

console.log("Deno.cwd():", Deno.cwd());

const config = new BreakdownConfig();
await config.loadConfig();
const settings = await config.getConfig();

console.log("BreakdownConfig loaded settings:", settings); 