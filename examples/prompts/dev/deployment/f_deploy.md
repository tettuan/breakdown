# Development Environment Deployment Template

## Input
- {deployment_config}
- {source_branch}
- {target_environment}

## Output
- {deployment_log}
- {deployment_status}

---

## Development Deployment Process

### Pre-deployment Checks
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Linting checks passed
- [ ] Local integration tests passed
- [ ] Branch is up to date with main

### Environment Configuration
- Development server: {dev_server}
- Database: {dev_database}
- API endpoints: {dev_api_endpoints}
- Feature flags: {dev_feature_flags}

### Deployment Steps
1. Build application for development
2. Run pre-deployment scripts
3. Deploy to dev environment
4. Run post-deployment verification
5. Update deployment tracking

### Rollback Procedures
- Rollback trigger conditions
- Rollback steps
- Data recovery procedures
- Notification requirements

### Development-Specific Settings
- Debug mode: enabled
- Verbose logging: enabled
- Hot reload: enabled
- Source maps: included
- Test data: available

## Instructions
1. Verify all pre-deployment checks
2. Configure environment-specific variables
3. Execute deployment pipeline
4. Monitor deployment progress
5. Verify deployment success
6. Document any issues or deviations

## Output Format
- Deployment log with timestamps
- Success/failure status
- Environment verification results
- Next steps or required actions