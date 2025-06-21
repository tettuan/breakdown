# Staging Issue Defect Analysis Template

## Input
- {issue_report}
- {staging_logs}
- {staging_environment_config}
- {test_results}
- {monitoring_data}

## Output
- {issue_assessment}
- {impact_analysis}
- {rollback_plan}
- {fix_strategy}

---

## Staging Environment Analysis

### Issue Context
- Staging deployment version: {deployment_version}
- Environment configuration: {staging_config}
- Integration points: {connected_services}
- Data migration status: {migration_status}

### Issue Investigation
1. **Service Health Check**
   - API endpoints status: {api_health}
   - Database connections: {db_connections}
   - External service integrations: {service_status}
   - Resource utilization: {resource_metrics}

2. **Error Pattern Analysis**
   - Error frequency: {error_rate}
   - Affected users/tests: {affected_scope}
   - Error distribution: {error_distribution}
   - Performance degradation: {performance_impact}

3. **Staging-Specific Factors**
   - Test data inconsistencies
   - Configuration mismatches
   - Integration endpoint changes
   - Certificate/auth issues
   - Network connectivity problems

### Validation Results
```yaml
validation_suite:
  functional_tests: {functional_status}
  integration_tests: {integration_status}
  performance_tests: {performance_status}
  security_tests: {security_status}
  regression_tests: {regression_status}
```

### Impact Assessment
- Features affected: {affected_features}
- User journeys impacted: {impacted_journeys}
- Data integrity risks: {data_risks}
- Rollback requirements: {rollback_needs}

### Staging Environment Logs
```bash
# Key log entries
tail -f /var/log/staging/{service_name}.log
grep -E "ERROR|WARN" {log_file}
# Correlation IDs: {correlation_ids}
```

### Comparison with Development
| Aspect | Development | Staging | Difference |
|--------|-------------|---------|------------|
| Configuration | {dev_config} | {staging_config} | {config_diff} |
| Data Volume | {dev_data} | {staging_data} | {data_diff} |
| Integrations | {dev_integrations} | {staging_integrations} | {integration_diff} |

### Pre-Production Checklist
- [ ] All tests passing
- [ ] Performance within SLA
- [ ] Security scan clean
- [ ] Monitoring alerts configured
- [ ] Rollback procedure tested
- [ ] Documentation updated

## Instructions
1. Gather comprehensive staging environment data
2. Run full validation suite
3. Compare with development environment
4. Assess production readiness impact
5. Prepare rollback strategy if needed
6. Document all findings for production team

## Output Format
- Executive summary of staging issues
- Detailed technical analysis
- Risk assessment for production
- Go/No-go recommendation
- Required fixes before production
- Monitoring requirements for production