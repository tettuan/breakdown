/**
 * BreakdownParams Mock
 * テスト用のbreakdownParamsモック実装
 */

import { ParamsCustomConfig } from "$lib/config/params_custom_config.ts";

export interface TwoParams {
  directive: string;
  layer: string;
  profile: string;
}

export interface ParamsError {
  message: string;
  directive?: string;
  layer?: string;
}

export interface BreakdownParamsResult {
  type: "two" | "error";
  params?: TwoParams;
  error?: ParamsError;
}

export function breakdownParams(
  args: string[],
  customConfig?: ParamsCustomConfig,
): BreakdownParamsResult {
  // 簡易的なバリデーション実装
  if (args.length < 2) {
    return { type: "error", error: { message: "Not enough arguments" } };
  }

  const [directive, layer] = args;

  // カスタム設定からパターンを取得
  const directivePattern = customConfig?.directivePattern || "^(to|summary|defect)$";
  const layerPattern = customConfig?.layerPattern || "^(project|issue|task|bugs)$";

  // パターンチェック（簡易版）
  const directiveValid = new RegExp(directivePattern).test(directive);
  const layerValid = new RegExp(layerPattern).test(layer);

  if (!directiveValid || !layerValid) {
    return {
      type: "error",
      error: {
        message: `Invalid ${!directiveValid ? "directive" : "layer"}`,
        directive: !directiveValid ? directive : undefined,
        layer: !layerValid ? layer : undefined,
      },
    };
  }

  return {
    type: "two",
    params: {
      directive,
      layer,
      profile: "default",
    },
  };
}
