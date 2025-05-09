# Breakdown Initialization (init) Process Specification

## Purpose
The Breakdown project initialization command (`init`) aims to automatically generate working directories, configuration files, and necessary subdirectories for AI development support, setting up the prerequisite environment for subsequent command execution.

# Initialization Flow

1. Create `app.yml` in the project root directory
   1-1. Initial location of app.yml is `.agent/breakdown/config/app.yml`
   1-2. The location where `breakdown init` is called is the starting point (assumed to be project root)
   1-3. Create `.agent/breakdown/config/` hierarchy recursively if it doesn't exist
2. Write initial values to `app.yml`
3. Load settings using `BreakdownConfig` (which loads `app.yml`)
4. 

## Default Working Directory
- Default working directory is `.agent/breakdown/`
- Specified in `working_dir` setting in `.agent/breakdown/config/app.yml` and determined by that setting

## Directory Structure Created During Initialization
- `.agent/breakdown/`
  - `projects/`
  - `issues/`
  - `tasks/`
  - `temp/`
  - `config/`
  - `prompts/` (or as specified by `app_prompt.base_dir`)
    - `to/project/f_project.md` etc., **copy template files from lib**
    # Prompt template source: lib/prompts/to/issue/, lib/prompts/to/task/, etc.
  - `schema/` (or as specified by `app_schema.base_dir`)
    - `to/project/base.schema.md` etc., **copy template files from lib**
    # Schema file source: lib/schemas/

## Configuration Files
- Based on the folder where the command is installed
- Automatically generate `.agent/breakdown/config/app.yml` (does not overwrite if exists)
- Template example:
  ```yaml
  working_dir: .agent/breakdown # use for output and temporary
  app_prompt:
    base_dir: .agent/breakdown/prompts # use for prompts. when init, command copy prompt files from app default (under lib) to this dir.
    # Prompt template source: lib/prompts/to/issue/, lib/prompts/to/task/, etc.
  app_schema:
    base_dir: .agent/breakdown/schema # use for JSON schema. when init, command copy schema files from app default (under lib) to this dir.
    # Schema file source: lib/schemas/
  ```
- If `app_prompt.base_dir` or `app_schema.base_dir` is customized, create the specified directory

## Handling Existing Environment
- Do not overwrite existing directories and files
- Do not overwrite existing `app.yml`

## Error Handling
- Return error if directory creation is not possible (e.g., file exists)
- Properly handle exceptions for permission errors etc.

## Testing Considerations
- Generate all directories and files in new environment
- Prevent overwriting in existing environment
- Create directories when custom base_dir is specified
- Exception handling during errors

## References
- Also refer to `docs/breakdown/app_config.md`
- Tests are covered in `tests/0_foundation/0_env/init_test.ts` 