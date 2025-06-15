# Breakdown Debug Output Feature

## Enabling Debug Mode

You can obtain detailed debug output by enabling the `DEBUG` environment variable when running the Breakdown CLI or library.

Example:
```sh
DEBUG=1 deno run -A cli/breakdown.ts ...
```

## Output Contents
In debug mode, the following information is displayed to standard output via `console.log`:

- `[DEBUG] current working directory:`
  - Current directory at command execution
- `[DEBUG] app.yml path:`
  - Absolute path of the referenced app.yml
- `[DEBUG] app.yml content:`
  - Contents of app.yml
- `[DEBUG] user.yml path:`
  - Absolute path of the referenced user.yml
- `[DEBUG] user.yml content:`
  - Contents of user.yml
- `[DEBUG] prompt template path:`
  - Path of the actually referenced prompt template
- `[DEBUG] JSON schema path:`
  - Path of the referenced schema file
- `[DEBUG] variables for PromptManager:`
  - Variables passed to PromptManager (in JSON format)

## Output Locations and Search Methods

- Primarily output within `lib/prompt/processor.ts`
- Written in source code in the format `console.log("[DEBUG]`, so:
  - You can identify debug output locations by searching with `grep '\[DEBUG\]'` etc.
- Similar output can be added to other locations as needed

## Usage Examples and Troubleshooting

- Verify whether configuration files and template paths are as intended, and which variables are being used
- Helpful for identifying causes when paths are confused, configurations are incorrect, or templates cannot be found
- Can understand detailed execution status in test and CI environments by adding `DEBUG=1`

---

**Notes**
- Debug output goes to standard output, so redirection to log files and filtering are possible
- Please disable `DEBUG` in production operation