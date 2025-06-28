# Breakdown Initialization (init) Process Specification

## Purpose
The initialization command (`init`) of the Breakdown project aims to automatically generate the working directory, configuration files, and necessary subdirectories for AI development support, establishing the prerequisite environment for subsequent command execution.

# Initialization Flow

1. Create `app.yml` in the project root directory
1-1. The initial location for app.yml is `.agent/breakdown/config/app.yml`
1-2. The starting point is where `breakdown init` is called (assuming project root)
1-3. If the `.agent/breakdown/config/` hierarchy does not exist, create it recursively
2. Write initial values to `app.yml`
3. Load settings using `BreakdownConfig` (which loads `app.yml`)
4. 

## Default Working Directory
- The default working directory is `.agent/breakdown/`.
- It is defined in the `working_dir` setting in `.agent/breakdown/config/app.yml`, and that setting value is used.

## Directory Structure Created During Initialization
- `.agent/breakdown/`
  - `projects/`
  - `issues/`
  - `tasks/`
  - `temp/`
  - `config/`
  - `prompts/` (or specified by `app_prompt.base_dir`)
    - `to/project/f_project.md` etc., **copy template files from lib directory**
    # (EN) Prompt template source: lib/prompts/to/issue/, lib/prompts/to/task/, etc.
  - `schema/` (or specified by `app_schema.base_dir`)
    - `to/project/base.schema.md` etc., **copy template files from lib directory**
    # (EN) Schema file source: lib/schemas/

## Configuration File
- Starting point is the folder where the command was installed
- Automatically generate `.agent/breakdown/config/app.yml` (do not overwrite if exists)
- Template example:
  ```yaml
  working_dir: .agent/breakdown # use for output and temporary
  app_prompt:
    base_dir: .agent/breakdown/prompts # use for prompts. when init, command copy prompt files from app default (lib directory) to this dir.
    # Prompt template source: lib/prompts/to/issue/, lib/prompts/to/task/, etc.
  app_schema:
    base_dir: .agent/breakdown/schema # use for JSON schema. when init, command copy schema files from app default (lib directory) to this dir.
    # Schema file source: lib/schemas/
  ```
- If `app_prompt.base_dir` or `app_schema.base_dir` are customized, create the specified directories as well

## Handling Existing Environments
- Do not overwrite existing directories and files
- Do not overwrite existing `app.yml`

## Error Handling
- Return error if directories cannot be created (file exists, etc.)
- Properly handle exceptions for permission errors, etc.

## Test Perspectives
- Generate all directories and files in new environment
- Prevent overwriting in existing environment
- Directory generation when custom base_dir is specified
- Exception generation on errors

## Reference
- Also refer to `docs/breakdown/app_config.ja.md`
- Tests are comprehensively covered in `tests/0_foundation/0_env/init_test.ts`