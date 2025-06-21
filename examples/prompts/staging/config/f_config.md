# Staging Environment Configuration Template

## Input
- {production_config_template}
- {staging_overrides}
- {feature_flags}

## Output
- {staging_config_files}
- {config_diff_report}

---

## Staging Configuration Management

### Core Configuration
```yaml
environment: staging
tier: pre-production
debug: false
log_level: info
monitoring:
  enabled: true
  detailed_metrics: true
  sampling_rate: 100%
```

### Infrastructure Settings
- Load balancer: {staging_lb_config}
- Auto-scaling: {staging_scaling_rules}
- CDN configuration: {staging_cdn_config}
- DNS settings: {staging_dns_config}

### Service Configuration
```yaml
services:
  api:
    url: {staging_api_url}
    timeout: 30s
    retry_policy: exponential_backoff
  database:
    host: {staging_db_host}
    pool_size: 50
    read_replicas: 2
  cache:
    provider: redis
    ttl: 3600
    eviction_policy: lru
```

### Security Configuration
- SSL certificates: {staging_ssl_certs}
- API rate limiting: {staging_rate_limits}
- WAF rules: {staging_waf_config}
- Access controls: {staging_access_config}

### Feature Management
```yaml
feature_flags:
  new_checkout_flow: true
  advanced_analytics: true
  beta_features: false
  a_b_testing:
    enabled: true
    experiments: {active_experiments}
```

### External Integrations
- Payment gateway: sandbox mode
- Email service: staging credentials
- Analytics: staging property
- Third-party APIs: test endpoints

### Monitoring & Alerts
```yaml
monitoring:
  apm: enabled
  error_tracking: enabled
  custom_metrics: enabled
alerts:
  error_threshold: 1%
  latency_threshold: 500ms
  availability_target: 99.5%
```

## Instructions
1. Start with production configuration template
2. Apply staging-specific overrides
3. Enable appropriate feature flags
4. Configure monitoring and alerting
5. Validate configuration consistency
6. Generate environment-specific files

## Output Format
- Complete staging configuration files
- Diff report showing changes from production
- Feature flag status summary
- Configuration validation results
- Deployment readiness checklist