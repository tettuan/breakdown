# Staging Testing Template

## Input
- {test_plan}
- {production_test_scenarios}
- {performance_baselines}

## Output
- {test_execution_report}
- {performance_comparison}
- {risk_assessment}

---

## Staging Test Strategy

### Test Scope
1. **Functional Testing**
   - User acceptance tests
   - End-to-end workflows
   - Cross-browser testing
   - Mobile responsiveness

2. **Performance Testing**
   - Load testing (expected traffic)
   - Stress testing (2x traffic)
   - Spike testing
   - Endurance testing

3. **Security Testing**
   - Penetration testing
   - OWASP compliance
   - Authentication flows
   - Data encryption verification

### Test Data Strategy
- Production-like data volume
- Anonymized production data
- Edge case scenarios
- International data sets

### Test Execution Plan
```yaml
test_phases:
  phase_1:
    name: "Smoke Tests"
    duration: 30_minutes
    pass_criteria: 100%
  phase_2:
    name: "Functional Tests"
    duration: 4_hours
    pass_criteria: 98%
  phase_3:
    name: "Performance Tests"
    duration: 8_hours
    pass_criteria: meets_sla
  phase_4:
    name: "Security Tests"
    duration: 2_days
    pass_criteria: no_critical_issues
```

### Performance Benchmarks
- Page load time: < 2 seconds
- API response time: < 200ms (p95)
- Concurrent users: 10,000
- Throughput: 1,000 req/sec

### Integration Testing
- Third-party service integration
- Payment processing flows
- Email delivery verification
- Analytics tracking validation

### Disaster Recovery Testing
- Failover procedures
- Backup restoration
- Data recovery time
- Service degradation handling

### User Acceptance Criteria
- [ ] All critical user journeys functional
- [ ] Performance meets SLA requirements
- [ ] No data integrity issues
- [ ] Security vulnerabilities addressed
- [ ] Accessibility standards met

## Instructions
1. Execute test phases sequentially
2. Compare results with production baselines
3. Document all defects with severity
4. Verify fixes before proceeding
5. Conduct stakeholder demo
6. Prepare production readiness report

## Output Format
- Comprehensive test execution report
- Performance metrics vs. baselines
- Defect summary with resolution status
- Risk assessment for production deployment
- Go/no-go recommendation with evidence