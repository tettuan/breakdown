# Staging Environment Deployment Template

## Input
- {release_candidate}
- {deployment_config}
- {staging_checklist}

## Output
- {deployment_report}
- {validation_results}
- {go_no_go_decision}

---

## Staging Deployment Process

### Pre-deployment Requirements
- [ ] All dev tests passed
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Release notes prepared
- [ ] Rollback plan documented

### Staging Environment Configuration
- Environment: {staging_env_name}
- Infrastructure: {staging_infrastructure}
- Database: {staging_database}
- External integrations: {staging_integrations}

### Deployment Pipeline
1. **Build Stage**
   - Production-like build
   - Optimization enabled
   - Source maps excluded
   - Assets minified

2. **Deploy Stage**
   - Blue-green deployment
   - Database migrations
   - Configuration updates
   - Service dependencies

3. **Validation Stage**
   - Smoke tests
   - Integration tests
   - Performance tests
   - Security validation

### Staging-Specific Configuration
```yaml
environment: staging
debug: false
log_level: info
monitoring: enhanced
alerts: enabled
```

### Quality Gates
- Performance: Response time < 200ms
- Error rate: < 0.1%
- Security: No critical vulnerabilities
- Functionality: All acceptance criteria met

### Stakeholder Validation
- QA sign-off required
- Product owner review
- Security team approval
- Performance team validation

## Instructions
1. Verify all pre-deployment requirements
2. Execute staging deployment pipeline
3. Run comprehensive validation suite
4. Collect stakeholder approvals
5. Document any issues or concerns
6. Make go/no-go decision for production

## Output Format
- Detailed deployment report with all metrics
- Test results summary
- Stakeholder approval status
- List of known issues with severity
- Clear go/no-go recommendation with justification