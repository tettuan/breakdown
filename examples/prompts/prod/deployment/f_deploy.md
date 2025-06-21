# Production Deployment Template

## Input
- {release_version}
- {deployment_plan}
- {rollback_plan}
- {approvals}

## Output
- {deployment_log}
- {deployment_metrics}
- {post_deployment_report}

---

## Production Deployment Process

### Pre-deployment Checklist
- [ ] All staging tests passed
- [ ] Change approval board sign-off
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] On-call team ready
- [ ] Rollback plan reviewed

### Deployment Authorization
```yaml
approvals:
  change_board: {approval_id}
  release_manager: {manager_approval}
  security_team: {security_approval}
  compliance_team: {compliance_approval}
deployment_window:
  start: {start_time}
  end: {end_time}
  maintenance_mode: {true|false}
```

### Production Infrastructure
- Region: {prod_regions}
- Availability zones: {prod_azs}
- Load balancers: {prod_lb_config}
- Auto-scaling: {prod_scaling_config}
- CDN: {prod_cdn_config}

### Deployment Strategy
1. **Blue-Green Deployment**
   - Current environment: Blue
   - Deploy to: Green
   - Health checks
   - Traffic switch
   - Monitor metrics

2. **Canary Release**
   - Initial traffic: 5%
   - Monitor for 15 minutes
   - Increase to 25%
   - Monitor for 30 minutes
   - Full rollout

### Production Safeguards
```yaml
circuit_breakers:
  error_threshold: 5%
  latency_threshold: 1000ms
  cooldown_period: 60s
rate_limiting:
  requests_per_second: 10000
  burst_size: 15000
auto_rollback:
  enabled: true
  triggers:
    - error_rate > 5%
    - latency_p99 > 2000ms
    - health_check_failures > 3
```

### Monitoring & Alerts
- Real-time dashboards active
- Alert channels configured
- Escalation paths defined
- War room established

### Post-deployment Validation
1. Health check verification
2. Smoke test execution
3. Performance validation
4. Business metrics verification
5. User feedback monitoring

## Instructions
1. Verify all pre-deployment requirements
2. Initiate deployment during approved window
3. Monitor key metrics continuously
4. Execute validation tests
5. Document any anomalies
6. Confirm deployment success or initiate rollback

## Output Format
- Timestamped deployment log
- Key performance metrics comparison
- Incident report (if any)
- Lessons learned
- Post-deployment action items