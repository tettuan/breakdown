# Detailed Bug Detection Analysis Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Comprehensive Analysis Framework

### 1. Static Code Analysis
- **Syntax Validation**: Check for syntax errors and malformed code
- **Code Structure**: Analyze function/class organization and complexity
- **Naming Conventions**: Review variable and function naming consistency
- **Code Duplication**: Identify repeated code patterns

### 2. Security Assessment
- **Input Validation**: Check for SQL injection, XSS, command injection vulnerabilities
- **Authentication/Authorization**: Verify proper access controls
- **Data Exposure**: Look for hardcoded secrets, exposed credentials
- **Cryptography**: Review encryption/hashing implementations

### 3. Error Handling & Robustness
- **Exception Management**: Verify comprehensive error handling
- **Graceful Degradation**: Check fallback mechanisms
- **Logging**: Ensure appropriate error logging without exposing sensitive data
- **Recovery Mechanisms**: Validate error recovery strategies

### 4. Performance & Resource Management
- **Memory Usage**: Identify potential memory leaks and inefficient allocations
- **CPU Performance**: Detect algorithmic inefficiencies and bottlenecks
- **I/O Operations**: Review file, network, and database operations
- **Resource Cleanup**: Verify proper resource disposal

### 5. Concurrency & Threading
- **Race Conditions**: Identify shared resource access issues
- **Deadlock Potential**: Check for circular dependencies in locking
- **Thread Safety**: Verify thread-safe operations
- **Synchronization**: Review locking mechanisms and patterns

### 6. API & Integration Issues
- **API Contract Compliance**: Verify API usage matches documentation
- **Version Compatibility**: Check for deprecated API usage
- **Error Response Handling**: Validate API error handling
- **Rate Limiting**: Review API rate limiting and retry logic

### 7. Configuration & Environment
- **Environment Variables**: Check for missing or misconfigured variables
- **Default Values**: Validate safe default configurations
- **Configuration Validation**: Ensure config values are properly validated
- **Deployment Issues**: Identify environment-specific problems

## Analysis Instructions

1. **Systematic Review**: Examine code through each framework category
2. **Context Awareness**: Consider the application domain and criticality
3. **Impact Assessment**: Evaluate potential consequences of each issue
4. **Actionability**: Provide specific, implementable solutions
5. **Prioritization**: Rank issues by risk and effort to fix

## Bug Classification

### Severity Levels
- **Critical**: System crashes, data corruption, security breaches
- **High**: Major functionality broken, significant security risks
- **Medium**: Minor functionality issues, performance degradation
- **Low**: Code quality issues, minor usability problems

### Bug Types
- **Logic Errors**: Incorrect business logic implementation
- **Runtime Errors**: Exceptions that occur during execution
- **Security Vulnerabilities**: Exploitable security weaknesses
- **Performance Issues**: Inefficient code causing slowdowns
- **Compatibility Issues**: Version or platform compatibility problems
- **Configuration Errors**: Incorrect setup or configuration

## Output Requirements

1. **Executive Summary**: High-level overview of findings
2. **Detailed Bug List**: Complete enumeration with full details
3. **Risk Assessment**: Impact and likelihood analysis
4. **Remediation Plan**: Prioritized action items with timelines
5. **Code Examples**: Before/after code snippets for fixes
6. **Testing Recommendations**: Suggested tests to prevent regression

## Quality Assurance

- Validate all suggestions with best practices
- Ensure fixes don't introduce new issues
- Consider maintainability and readability
- Reference authoritative sources and standards