Start "execution example confirmation" after completing "specification understanding."

# Mission: Implementation Confirmation and Correction
Execute corrections in `tmp/examples_to_maincode.md`.

# Specification Understanding

Read all specification documents referenced from `docs/index.md` and `docs/breakdown/index.md`. Schema specification understanding is not required.
Especially `docs/breakdown/path.md`, `docs/breakdown/app_config.md`, `docs/breakdown/options.md` explain information necessary for initialization.

## Use Case: Prompt Selection Logic
Read the project README to understand use cases.

# Implementation Improvement
1. Extract parameter descriptions and filename generation specifications from specification documents under tests/
2. Add missing test code
3. Make changes to code under test
4. Proceed to "Execute main code implementation improvement"

## Execute Main Code Implementation Improvement
1. Execute `scripts/local_ci.sh`
2. For errors, understand CursorRules, `docs/breakdown/testing.md`
3. Add debug logs to tests. Add BreakdownLogger output before and after test code at error locations.
4. Execute `scripts/local_ci.sh` again
5. If there are unclear points or ambiguities, search for specification documents starting from `docs/`, read them, and derive solutions.
6. Return to the first step