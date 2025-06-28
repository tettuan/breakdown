export const defaultConfigTwoParams = {
  params: {
    two: {
      demonstrativeType: {
        pattern: "^(to|summary|defect)$",
      },
      layerType: {
        pattern: "^(project|issue|task)$",
      },
      validation: {
        allowedFlagOptions: [],
        allowedValueOptions: [
          "from",
          "destination",
          "input",
          "config",
        ],
        userVariableOption: true,
        stdinAllowed: true,
      },
    },
  },
};
