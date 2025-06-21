# Defect Discovery Template

## Input
- {input_text_file}
- {input_text}

## Output
- {destination_path}

---

## Defect Detection Framework

### Defect Categories
1. **Functional Defects**
   - Features not working as specified
   - Missing functionality
   - Incorrect business logic
   - Workflow interruptions

2. **Non-Functional Defects**
   - Performance issues
   - Security vulnerabilities
   - Usability problems
   - Compatibility issues

3. **Data Defects**
   - Data corruption
   - Validation failures
   - Inconsistent states
   - Missing data integrity

4. **Integration Defects**
   - API failures
   - Service communication issues
   - Third-party integration problems
   - Data synchronization errors

### Detection Methods

#### Automated Detection
- **Static Code Analysis**: Code quality violations
- **Unit Test Failures**: Functional regressions
- **Integration Test Failures**: System interaction issues
- **Performance Monitoring**: Response time degradation
- **Error Logs**: Runtime exceptions and errors
- **Security Scans**: Vulnerability detection

#### Manual Detection
- **Code Reviews**: Human inspection of changes
- **User Testing**: Manual workflow validation
- **Exploratory Testing**: Ad-hoc issue discovery
- **User Feedback**: Customer-reported problems

### Severity Classification

| Severity | Impact | Urgency | Examples |
|----------|--------|---------|----------|
| Critical | System unusable | Fix immediately | Total system failure |
| High | Major feature broken | Fix within hours | Payment processing fails |
| Medium | Minor feature affected | Fix within days | Search not working optimally |
| Low | Cosmetic or edge case | Fix when convenient | UI alignment issue |

### Root Cause Analysis

#### Common Root Causes
1. **Code Quality Issues**
   - Logic errors
   - Missing error handling
   - Inadequate validation
   - Poor exception management

2. **Process Issues**
   - Insufficient testing
   - Incomplete requirements
   - Rushed development
   - Inadequate code review

3. **Environmental Issues**
   - Configuration problems
   - Infrastructure failures
   - Third-party service issues
   - Data environment problems

4. **Communication Issues**
   - Misunderstood requirements
   - Assumptions not validated
   - Changes not communicated
   - Knowledge gaps

### Analysis Instructions

1. **Evidence Collection**: Gather logs, error messages, user reports
2. **Reproduction**: Attempt to recreate the defect consistently
3. **Impact Assessment**: Determine user and business impact
4. **Root Cause Analysis**: Identify underlying cause
5. **Fix Verification**: Ensure resolution doesn't create new issues
6. **Prevention**: Identify process improvements

## Output Format

### Defect Report Structure
```markdown
## Defect: [Defect Title]

### Summary
- **ID**: [Unique identifier]
- **Severity**: [Critical/High/Medium/Low]
- **Status**: [New/Assigned/In Progress/Resolved/Closed]
- **Found In**: [Version/Environment]
- **Reporter**: [Who discovered it]
- **Assignee**: [Who will fix it]

### Description
[Clear, detailed description of the defect]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Expected result]
4. [Actual result]

### Environment
- **OS**: [Operating system]
- **Browser**: [If applicable]
- **Version**: [Software version]
- **Configuration**: [Relevant settings]

### Evidence
- **Screenshots**: [Visual evidence]
- **Log Files**: [Relevant log entries]
- **Error Messages**: [Exact error text]
- **Stack Traces**: [Technical details]

### Impact Analysis
- **Users Affected**: [Number or percentage]
- **Business Impact**: [Revenue, reputation, etc.]
- **Workaround**: [Temporary solution if available]

### Root Cause
[Detailed analysis of why the defect occurred]

### Resolution
- **Fix Applied**: [What was changed]
- **Testing**: [How fix was verified]
- **Regression Risk**: [Assessment of side effects]

### Prevention
- **Process Improvements**: [How to prevent similar issues]
- **Testing Enhancements**: [Additional test coverage needed]
- **Monitoring**: [Detection improvements]
```

### Quality Metrics
- Track defect discovery rate
- Monitor defect resolution time
- Analyze defect root cause patterns
- Measure prevention effectiveness

## Quality Assurance
- Verify defects are reproducible
- Ensure severity assessment is accurate
- Check for duplicate defects
- Validate root cause analysis