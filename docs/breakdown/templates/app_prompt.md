# Application Prompt

---

**Using BreakdownPrompt**
BreakdownPrompt is a core module of the Breakdown application, responsible for generating prompts for AI development support. It automatically selects and generates optimal prompts based on user input and project state, providing instructions that AI agents can easily understand.

**Official Documentation**
For the latest usage, type definitions, and API details, please refer to https://jsr.io/@tettuan/breakdownprompt and the README in the GitHub repository. By consistently checking the official documentation, you can stay informed about the latest specifications and recommended usage patterns.

**Roles and Responsibilities**
BreakdownPrompt's responsibility is limited to "variable substitution, schema referencing, and prompt generation for identified prompt files." Identifying which prompt file to use and path resolution are responsibilities of path.ja.md and app_factory.ja.md, while configuration management is the responsibility of app_config.ja.md.

**Scope**
This module specializes in generating prompts by embedding given variables and schema information based on prompt file content. File identification, path resolution, and configuration management are handled by other modules, and AI-based transformation, Markdown parsing, and schema validation are out of scope.

**Processing Overview**
The module obtains necessary parameters from command-line arguments and configuration files, selects prompt files, performs variable substitution, embeds schema information, and finally generates and outputs the complete prompt. It also provides appropriate feedback in case of errors.

**Configuration Example**
By specifying baseDir and debug options in the app_config file, flexible operation is possible, including setting prompt storage directories and enabling debug mode.

```json
{
  "app_prompt": {
    "base_dir": "./.agent/breakdown/prompts/",
    "debug": false
  }
}
```

# Template Variable Notation
- `{variable_name}`: Template variables are enclosed in `{` and `}`
- `{{variable_name}}` is incorrect.

---

For detailed information about paths, variable handling, and naming conventions, please refer to path.ja.md.