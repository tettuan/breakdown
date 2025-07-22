# Find Bugs Template

## Input

function calculateTotal(items) {
    let total = 0;
    // TODO: Fix this calculation
    for (i = 0; i <= items.length; i++) {  // BUG: should be i < items.length
        total += items[i].price * items[i].quantity;  // FIXME: No null check
    }
    return total;
}

function processUser(user) {
    if (user == null) {  // BUG: should use === for strict comparison
        return;
    }
    // BUG: No validation for user.email
    const emailDomain = user.email.split('@')[1];
    document.innerHTML = `Welcome ${user.name}!`;  // BUG: XSS vulnerability
}


## Output

- bugs_report.md

---

## Bug Detection Perspectives

- Code smells and anti-patterns
- Security vulnerabilities
- Performance bottlenecks
- Error handling issues
- Concurrency problems
- Memory leaks
- API misuse
- Dead code

## Instructions

1. Analyze the code for potential bugs
2. Categorize issues by severity (Critical, High, Medium, Low)
3. Provide specific line numbers and code references
4. Suggest fixes for each identified issue
5. Include best practice recommendations

## Output Format

- Output as structured Markdown with severity levels
