# Application Schema

During runtime, the application identifies and uses Schema files.
It determines which Schema file to use based on the provided arguments and options.

## Application Schema File Naming Convention

- Refer to `./path.ja.md`
- The Schema to use is also determined by parameters, so the result of `./path.ja.md` identifies the Schema to use

# Schema Definition

Breakdown provides schema definitions for each combination of command and layer.
Schema definitions are embedded in the prompt output and are used in parallel with other prompt input values when the AI interprets the prompt.

## Schema Placement

- Schema files are placed in the following directory structure:

```
- lib/
  - schema/
    - to/
      - project/
        - base.schema.json
      - issue/
        - base.schema.json
      - task/
        - base.schema.json
    - summary/
      - project/
        - base.schema.json
      - issue/
        - base.schema.json
      - task/
        - base.schema.json
    - defect/
      - project/
        - base.schema.json
      - issue/
        - base.schema.json
      - task/
        - base.schema.json
```

## Schema Structure

Each schema file is written in JSON Schema format. 