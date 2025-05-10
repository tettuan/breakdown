/**
 * The help text displayed by the Breakdown CLI.
 * This string is shown when users invoke the CLI with --help or no arguments.
 * It describes available commands, options, and usage examples.
 */
export const HELP_TEXT: string = `
Breakdown - AI Development Instruction Tool

Usage:
  breakdown [command] [options]

Commands:
  init                    Initialize a new workspace
  to <layer>             Convert to specified layer type
  summary <layer>        Generate summary for layer type
  defect <layer>         Generate defect report for layer type

Layer Types:
  project, issue, task

Options:
  -h, --help            Show this help message
  -v, --version         Show version information
  -f, --from <file>     Input file path
  -o, --destination <file>  Output file path
  -i, --input <type>    Input layer type (project|issue|task)
  -a, --adaptation <type>  Adaptation type for template selection
`; 