/**
 * Type definitions for command-line arguments.
 */

import { DemonstrativeType, LayerType } from "../types/mod.ts";

export interface ParsedArgs {
  command?: DemonstrativeType;
  layerType?: LayerType;
  fromFile?: string;
  destinationFile?: string;
  inputLayerType?: string;
  help?: boolean;
  version?: boolean;
}
