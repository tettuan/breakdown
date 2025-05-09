import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.8";

# Application Prompt

---

**Using BreakdownPrompt**
BreakdownPrompt is a core module of the Breakdown application, responsible for prompt generation for AI development support. It automatically selects and generates optimal prompts based on user input and project state, providing instructions that are easy for AI agents to understand.

**Official Documentation**
For the latest usage, type definitions, and API details, refer to https://jsr.io/@tettuan/breakdownprompt and the GitHub repository's README. Always check the official documentation to understand the latest specifications and recommended usage methods.

**Roles and Responsibilities**
BreakdownPrompt's responsibility is limited to "variable substitution, schema reference, and prompt generation for identified prompt files." Identifying which prompt file to use and path resolution are the responsibilities of path.ja.md and app_factory.ja.md, while configuration value management is the responsibility of app_config.ja.md.

**Scope**
This module specializes in generating prompts by embedding given variables and schema information based on prompt file contents. File identification, path resolution, and configuration management are handled by other modules, and AI-based conversion, Markdown parsing, and schema validation are out of scope.

**Processing Overview**
It obtains necessary parameters from command-line arguments and configuration files, then generates and outputs the final prompt through prompt file selection, variable substitution, and schema information embedding. It also provides appropriate feedback in case of errors.

**Configuration Example**
By specifying baseDir and debug options in the app_config file, flexible operation is possible, such as setting the prompt storage directory and enabling debug mode.

```json
{
  "app_prompt": {
    "baseDir": "./.agent/breakdown/prompts/",
    "debug": false
  }
}
```

**Debugging Methods**
During debugging, you can enable detailed log output and behavior verification by setting the LOG_LEVEL=debug environment variable or specifying debug:true in the code. This helps identify the cause of problems when they occur.

---

For detailed path and variable handling, naming conventions, etc., refer to path.ja.md.
