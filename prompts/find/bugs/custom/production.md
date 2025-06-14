# Find Bugs Analysis - Production Environment

Analyze code for production-critical issues with focus on reliability, security, and performance.

## Production-Specific Checks

1. **Security Audit**
   - SQL injection vulnerabilities
   - XSS attack vectors
   - CSRF protection gaps
   - Authentication/authorization flaws
   - Sensitive data exposure

2. **Performance Analysis**
   - Database query optimization needs
   - Memory usage patterns
   - CPU-intensive operations
   - Network request optimization
   - Caching opportunities

3. **Reliability Issues**
   - Error recovery mechanisms
   - Failover handling
   - Transaction integrity
   - Data consistency checks
   - Timeout handling

4. **Scalability Concerns**
   - Bottlenecks under load
   - Resource pooling issues
   - Concurrent request handling
   - State management problems

5. **Monitoring Gaps**
   - Missing logging
   - Insufficient metrics
   - Alert conditions
   - Debug information leaks

## Production Output Format

```markdown
## Bug Report - Production Analysis

### Summary
- Total Issues: X
- Critical: X
- High Priority: X
- Medium Priority: X
- Low Priority: X

### Critical Issues Requiring Immediate Action

#### ISSUE-XXX: [Issue Title]
- **Severity**: Critical
- **Component**: [Component Name]
- **Impact**: [Business Impact]
- **MTTR Estimate**: [Time to Fix]
- **Fix**:
  ```code
  [Corrected Code]
  ```

### Detailed Analysis
[Rest of issues organized by severity]
```

## Code to Analyze

```
{{CODE}}
```