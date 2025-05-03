import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.8";

# Application Prompt

---

**Use of BreakdownPrompt**
BreakdownPrompt is a core module of the Breakdown application, responsible for generating prompts to support AI development. It provides AI agents with easy-to-understand instructions by embedding variables and schema information into the specified prompt file, based on user input and project state.

**Official Documentation**
For the latest usage, type definitions, and API details, refer to https://jsr.io/@tettuan/breakdownprompt and the GitHub repository README. Always check the official documentation for up-to-date specifications and recommended usage.

**Role & Responsibility**
BreakdownPrompt's responsibility is strictly limited to variable substitution, schema reference, and prompt generation for a specified prompt file. The identification of which prompt file to use and path resolution are handled by path.ja.md and app_factory.ja.md, while configuration management is the responsibility of app_config.ja.md.

**Scope**
This module specializes in generating prompts by embedding given variables and schema information into the content of a prompt file. File identification, path resolution, and configuration management are handled by other modules. AI-driven conversion, Markdown parsing, and schema validation are also outside its scope.

**Processing Overview**
It obtains necessary parameters from command-line arguments and configuration files, selects the prompt file, performs variable substitution and schema embedding, and finally generates and outputs the prompt. Appropriate feedback is provided in case of errors.

**Configuration Example**
By specifying options such as baseDir and debug in the app_config file, you can flexibly manage the prompt storage directory and enable debug mode.

```json
{
  "app_prompt": {
    "baseDir": "./.agent/breakdown/prompts/",
    "debug": false
  }
}
```

**Debugging**
For debugging, set the LOG_LEVEL=debug environment variable or specify debug:true in the code to output detailed logs and check behavior. This is useful for identifying the cause of issues.

---

For details on path, variable handling, and naming conventions, refer to path.ja.md.
