/**
 * @fileoverview Template Request Value Object
 * 
 * Represents a request for template resolution with directive and layer information.
 */

import type { DirectiveType } from "../../../../types/directive_type.ts";
import type { LayerType } from "../../../../types/layer_type.ts";

/**
 * Template request data structure
 */
export interface TemplateRequestData {
  directive: DirectiveType;
  layer: LayerType;
  adaptation?: string;
  fromLayer?: LayerType;
}

/**
 * Template request result
 */
export interface TemplateRequestResult {
  ok: boolean;
  data?: TemplateRequest;
  error?: string;
}

/**
 * Template Request Value Object
 */
export class TemplateRequest {
  private constructor(
    public readonly directive: DirectiveType,
    public readonly layer: LayerType,
    public readonly adaptation?: string,
    public readonly fromLayer?: LayerType,
  ) {}

  /**
   * Create a new template request
   */
  static create(data: TemplateRequestData): TemplateRequestResult {
    try {
      if (!data.directive || !data.layer) {
        return {
          ok: false,
          error: "Directive and layer are required",
        };
      }

      return {
        ok: true,
        data: new TemplateRequest(
          data.directive,
          data.layer,
          data.adaptation,
          data.fromLayer,
        ),
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}