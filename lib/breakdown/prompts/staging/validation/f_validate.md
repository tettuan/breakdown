# Staging Validation Template

## Input
- {validation_checklist}
- {acceptance_criteria}
- {compliance_requirements}

## Output
- {validation_report}
- {sign_off_status}
- {production_readiness}

---

## Staging Validation Process

### Technical Validation
- [ ] All automated tests passed
- [ ] Manual test cases executed
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Code quality metrics satisfied

### Business Validation
- [ ] Feature completeness verified
- [ ] User workflows validated
- [ ] Business rules implemented correctly
- [ ] Reporting accuracy confirmed
- [ ] Data integrity maintained

### Compliance Validation
- GDPR compliance: {gdpr_status}
- HIPAA compliance: {hipaa_status}
- PCI DSS compliance: {pci_status}
- Accessibility (WCAG): {wcag_status}
- Industry standards: {industry_compliance}

### Operational Readiness
```yaml
operations_checklist:
  monitoring:
    - dashboards_configured: true
    - alerts_tested: true
    - runbooks_updated: true
  support:
    - documentation_complete: true
    - training_delivered: true
    - support_team_ready: true
  infrastructure:
    - capacity_verified: true
    - backup_tested: true
    - dr_plan_validated: true
```

### Stakeholder Sign-offs
| Stakeholder | Role | Status | Date | Comments |
|-------------|------|--------|------|----------|
| {qa_lead} | QA Lead | {status} | {date} | {comments} |
| {product_owner} | Product Owner | {status} | {date} | {comments} |
| {security_lead} | Security Lead | {status} | {date} | {comments} |
| {ops_lead} | Operations Lead | {status} | {date} | {comments} |

### Risk Assessment
```yaml
identified_risks:
  - risk: {risk_description}
    severity: {high|medium|low}
    mitigation: {mitigation_plan}
    owner: {risk_owner}
```

### Production Readiness Criteria
- All P0/P1 bugs resolved
- Performance SLAs met
- Security vulnerabilities addressed
- Rollback plan tested
- Communication plan prepared

## Instructions
1. Complete all validation checklists
2. Collect stakeholder sign-offs
3. Document any outstanding issues
4. Assess residual risks
5. Verify operational readiness
6. Make final go/no-go recommendation

## Output Format
- Executive summary of validation results
- Detailed checklist with completion status
- Stakeholder sign-off matrix
- Risk register with mitigation plans
- Clear production readiness statement
- Conditions or prerequisites for production deployment