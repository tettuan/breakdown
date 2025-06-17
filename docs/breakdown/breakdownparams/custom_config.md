# Custom Configuration Usage

```ts
import { ParamsParser, CustomConfig } from 'jsr:@tettuan/breakdownparams@1.0.3';

const customConfig: CustomConfig = {
  params: {
    two: {
      demonstrativeType: {
        pattern: "^(to|from|via)$",
        errorMessage: "Invalid demonstrative type. Must be one of: to, from, via"
      },
      layerType: {
        pattern: "^(project|issue|task|epic)$", 
        errorMessage: "Invalid layer type. Must be one of: project, issue, task, epic"
      }
    }
  },
  validation: {
    zero: {
      allowedOptions: ["help", "version"],
      allowedValueOptions: []
    },
    one: {
      allowedOptions: ["verbose"],
      allowedValueOptions: ["config"]
    },
    two: {
      allowedOptions: ["verbose", "experimental"],
      allowedValueOptions: ["from", "destination", "input", "config"]
    }
  }
};

const parser = new ParamsParser(undefined, customConfig);
```
