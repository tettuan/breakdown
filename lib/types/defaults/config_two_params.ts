export const _defaultConfigTwoParams = Object.freeze({
  params: Object.freeze({
    two: Object.freeze({
      directiveType: Object.freeze({
        pattern: "^(to|summary|defect|find)$",
      }),
      layerType: Object.freeze({
        pattern: "^(project|issue|task|bugs)$",
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
