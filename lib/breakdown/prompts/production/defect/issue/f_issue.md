# Production Issue Detection Template

## Input
- {production_logs}
- {monitoring_data}
- {user_reports}
- {error_traces}

## Output
- {issue_analysis}
- {severity_assessment}
- {incident_report}

---

## Production Issue Analysis

### Critical Issue Detection
- **Service Outages**: Complete system unavailability
- **Data Corruption**: Data integrity violations
- **Security Breaches**: Unauthorized access or data leaks
- **Performance Degradation**: Response times > SLA
- **Financial Impact**: Revenue-affecting issues

### Issue Classification

#### Severity Levels
| Level | Description | Response Time | Example |
|-------|-------------|---------------|----------|
| P0 | Critical/Outage | < 15 min | Total service down |
| P1 | High/Degraded | < 1 hour | Major feature broken |
| P2 | Medium | < 4 hours | Minor feature issue |
| P3 | Low | < 24 hours | Cosmetic/enhancement |

#### Impact Assessment
- **User Impact**: Number of affected users
- **Business Impact**: Revenue/reputation damage
- **System Impact**: Infrastructure affected
- **Data Impact**: Data integrity concerns

### Root Cause Analysis Framework

1. **Immediate Cause**: What directly triggered the issue
2. **Contributing Factors**: What conditions allowed it
3. **Root Cause**: Why the system permitted this failure
4. **Systemic Issues**: Process or design flaws

### Production Monitoring Indicators
```yaml
error_patterns:
  - HTTP 5xx errors
  - Database connection failures
  - Memory leak indicators
  - CPU spike patterns
  - Disk space exhaustion
  - Network connectivity issues
```

### Incident Response Process

#### Immediate Actions (0-15 minutes)
1. Acknowledge incident
2. Assess severity
3. Activate incident response team
4. Implement immediate containment

#### Investigation (15-60 minutes)
1. Gather diagnostic data
2. Identify affected systems
3. Determine root cause
4. Develop fix/workaround

#### Resolution (1-4 hours)
1. Implement fix
2. Verify resolution
3. Monitor for recurrence
4. Update stakeholders

### Communication Templates

#### Internal Alert
```
SEVERITY: [P0/P1/P2/P3]
SYSTEM: [Affected System]
SUMMARY: [Brief description]
IMPACT: [User/business impact]
STATUS: [Investigating/Identified/Resolving/Resolved]
ETA: [Expected resolution time]
COMMAND CENTER: [Incident response channel]
```

#### Customer Communication
```
We are currently experiencing [brief description].
Affected services: [list]
We are actively working on a resolution.
Updates will be provided every [frequency].
For support: [contact information]
```

## Instructions

1. **Rapid Assessment**: Quickly determine severity and impact
2. **Evidence Collection**: Gather logs, metrics, and user reports
3. **Timeline Reconstruction**: Map when issues started and escalated
4. **Impact Analysis**: Quantify user and business impact
5. **Root Cause Investigation**: Use systematic debugging approach
6. **Resolution Planning**: Develop both immediate and long-term fixes
7. **Prevention Strategy**: Identify monitoring and process improvements

## Output Format

### Executive Summary
- Issue severity and current status
- User impact and affected systems
- Timeline and resolution ETA
- Key stakeholders and communication channels

### Technical Analysis
- Detailed error logs and stack traces
- System metrics and performance data
- Configuration changes or deployments
- Dependencies and external service status

### Action Plan
- Immediate remediation steps
- Long-term prevention measures
- Monitoring improvements
- Process refinements

### Post-Incident Report
- Complete timeline of events
- Root cause analysis
- Lessons learned
- Action items with owners and due dates