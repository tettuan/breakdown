export const _defaultConfigTwoParams = Object.freeze({
  params: Object.freeze({
    two: Object.freeze({
      directiveType: Object.freeze({
        pattern: "^(to|summary|defect)$",
      }),
      layerType: Object.freeze({
        pattern: "^(project|issue|task)$",
      }),
      validation: Object.freeze({
        allowedFlagOptions: Object.freeze([]),
        allowedValueOptions: Object.freeze([
          "from",
          "destination",
          "input",
          "config",
        ]),
        userVariableOption: true,
        stdinAllowed: true,
      }),
    }),
  }),
});
