/**
 * 初期化時のみ使用する最小限のデフォルト値
 *
 * 循環依存を避けるため、BreakdownConfigとは独立して定義
 * 初期化プロセス中にのみ使用し、通常の動作では設定ファイルの値を使用する
 */
export const INITIALIZATION_DEFAULTS = {
  /**
   * 初期化時のみ使用する最小限のパターン定義
   * 実際の値は設定ファイルから読み込まれる
   */
  minimalPatterns: {
    /**
     * DirectiveTypeの初期パターン
     * 初期化時の仮の値として使用
     */
    directiveType: "^(example1|example2)$",

    /**
     * LayerTypeの初期パターン
     * 初期化時の仮の値として使用
     */
    layerType: "^(layer1|layer2)$",
  },

  /**
   * 初期化時に作成するサンプル値
   * 設定ファイル生成時に使用
   */
  sampleValues: {
    directiveTypes: ["example1", "example2"],
    layerTypes: ["layer1", "layer2"],
  },
};
