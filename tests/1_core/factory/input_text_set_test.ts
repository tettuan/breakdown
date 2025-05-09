// variables.input_textへの値セットテスト（TDDファースト）
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
// 仮の関数: setInputTextVariable
import { setInputTextVariable } from "$lib/factory/variables_util.ts";

Deno.test("input_textに値をセットできる", () => {
  const logger = new BreakdownLogger();
  logger.debug("input_textセットテスト開始");
  const variables = setInputTextVariable({}, "test input");
  logger.debug(`input_text: ${variables.input_text}`);
  assertEquals(variables.input_text, "test input");
  logger.debug("input_textセットテスト終了");
});

Deno.test("input_textが空の場合は空文字列になる", () => {
  const logger = new BreakdownLogger();
  logger.debug("input_text空テスト開始");
  const variables = setInputTextVariable({}, "");
  logger.debug(`input_text: ${variables.input_text}`);
  assertEquals(variables.input_text, "");
  logger.debug("input_text空テスト終了");
});
