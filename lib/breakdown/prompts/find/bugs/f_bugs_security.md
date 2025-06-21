# Security-Focused Bug Detection Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Security Analysis Framework

### 1. Authentication & Authorization
- **Authentication Bypass**: Check for weak authentication mechanisms
- **Session Management**: Verify secure session handling
- **Privilege Escalation**: Identify potential elevation paths
- **Access Control**: Review role-based access controls

### 2. Input Validation & Sanitization
- **SQL Injection**: Check for unparameterized queries
- **Cross-Site Scripting (XSS)**: Identify unsanitized output
- **Command Injection**: Review system command execution
- **Path Traversal**: Check file system access patterns
- **XML/XXE Injection**: Validate XML parsing security

### 3. Data Protection
- **Sensitive Data Exposure**: Identify unencrypted sensitive data
- **Cryptographic Weaknesses**: Review encryption implementations
- **Password Storage**: Verify secure password hashing
- **Data Leakage**: Check logs and error messages for sensitive info

### 4. Security Configuration
- **Default Credentials**: Check for hardcoded passwords
- **Security Headers**: Verify proper HTTP security headers
- **CORS Configuration**: Review cross-origin resource sharing
- **TLS/SSL Usage**: Validate secure communication

### 5. Third-Party Dependencies
- **Vulnerable Components**: Check for known CVEs
- **License Compliance**: Verify license compatibility
- **Supply Chain Risks**: Assess dependency security
- **Update Status**: Check for outdated packages

## Security Bug Classification

### Severity Matrix
| Severity | Description | Examples |
|----------|-------------|----------|
| Critical | Immediate exploitation possible | RCE, Auth Bypass, Data Breach |
| High | Significant security impact | SQL Injection, XSS, Privilege Escalation |
| Medium | Moderate risk, harder to exploit | CSRF, Information Disclosure |
| Low | Minor security concern | Missing headers, verbose errors |

### OWASP Mapping
- Map findings to OWASP Top 10 categories
- Reference CWE identifiers for each vulnerability
- Provide CVSS scoring where applicable

## Analysis Instructions

1. **Threat Modeling**: Consider attacker perspective and motivations
2. **Attack Vectors**: Identify all possible exploitation paths
3. **Defense in Depth**: Recommend layered security controls
4. **Zero Trust**: Assume breach and minimize blast radius
5. **Compliance**: Consider regulatory requirements (GDPR, PCI-DSS, etc.)

## Output Format

### Security Report Structure
1. **Executive Summary**
   - Total vulnerabilities by severity
   - Critical findings requiring immediate action
   - Overall security posture assessment

2. **Vulnerability Details**
   - CVE/CWE references
   - Proof of concept (if safe to demonstrate)
   - Affected components and versions
   - Remediation steps with code examples

3. **Risk Assessment**
   - Business impact analysis
   - Likelihood of exploitation
   - Risk score calculation

4. **Remediation Timeline**
   - Immediate actions (< 24 hours)
   - Short-term fixes (< 1 week)
   - Long-term improvements (< 1 month)

5. **Security Testing Recommendations**
   - Automated security scans
   - Penetration testing scope
   - Security code review focus areas

## Best Practices Reference
- OWASP Secure Coding Practices
- SANS Top 25 Software Errors
- Industry-specific standards (PCI-DSS, HIPAA, etc.)
- Framework-specific security guidelines