# Bug Detection Report

Analyze the following code for bug indicators and potential issues.

## Analysis Requirements

Look for the following bug indicators in the code:
{#each customConfig.findBugs.patterns}
- {this}
{/each}

## Code to Analyze

{input_text}

## Expected Output

Provide a comprehensive bug detection report that includes:

1. **Summary of Findings**
   - Total number of bug indicators found
   - Severity classification

2. **Detailed Analysis**
   - Location of each bug indicator
   - Type of issue
   - Suggested resolution

3. **Priority Recommendations**
   - Critical issues to address immediately
   - Medium priority improvements
   - Low priority enhancements

Format the output as a structured markdown report suitable for development teams.