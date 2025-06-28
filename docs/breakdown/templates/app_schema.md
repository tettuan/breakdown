# Application Schema

At runtime, the application identifies and uses Schema files. It determines which Schema file to use based on the passed arguments and options.

## Application Schema File Naming Convention

- Refer to `./path.ja.md`
- Since the schema to be used is determined by parameters, the result from `./path.ja.md` identifies the schema to use

# Schema Definition

Breakdown provides schema definitions for each combination of command and layer.
Schema definitions are embedded in the prompt output and used in parallel with other prompt input values when AI interprets the prompt.

## Schema Placement

- Schema files are organized in the following directory structure:

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