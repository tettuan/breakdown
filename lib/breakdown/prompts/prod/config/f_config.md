# Production Configuration Template

## Input
- {prod_base_config}
- {security_config}
- {performance_config}
- {compliance_config}

## Output
- {production_configs}
- {config_validation_report}

---

## Production Configuration

### Core Production Settings
```yaml
environment: production
tier: production
debug: false
log_level: warn
error_reporting:
  enabled: true
  sampling_rate: 10%
  pii_scrubbing: true
```

### High Availability Configuration
```yaml
infrastructure:
  regions:
    primary: {primary_region}
    secondary: {secondary_region}
    dr_region: {dr_region}
  load_balancing:
    algorithm: least_connections
    health_check_interval: 10s
    unhealthy_threshold: 3
  auto_scaling:
    min_instances: 10
    max_instances: 100
    target_cpu: 70%
    scale_up_cooldown: 300s
```

### Security Configuration
```yaml
security:
  ssl:
    protocol: TLSv1.3
    cipher_suites: {production_ciphers}
    hsts_enabled: true
  authentication:
    mfa_required: true
    session_timeout: 3600
    token_rotation: enabled
  encryption:
    data_at_rest: AES-256
    data_in_transit: TLS
    key_management: HSM
```

### Performance Optimization
```yaml
performance:
  caching:
    cdn:
      enabled: true
      ttl: 86400
      purge_strategy: tag_based
    application:
      redis_cluster: true
      memcached: true
      query_cache: true
  database:
    connection_pool: 100
    read_replicas: 5
    query_timeout: 30s
    slow_query_log: true
```

### Production Services
```yaml
services:
  api:
    url: {prod_api_url}
    rate_limit: 10000_rpm
    timeout: 30s
  database:
    primary: {prod_db_primary}
    replicas: {prod_db_replicas}
    backup_schedule: "0 2 * * *"
  monitoring:
    apm: {apm_service}
    logging: {logging_service}
    metrics: {metrics_service}
```

### Compliance & Governance
```yaml
compliance:
  data_retention: 7_years
  audit_logging: enabled
  gdpr:
    enabled: true
    data_processor: {processor_info}
  backup:
    frequency: daily
    retention: 30_days
    encryption: true
    testing_schedule: monthly
```

### Feature Flags
```yaml
feature_flags:
  source: {feature_flag_service}
  cache_ttl: 60s
  default_state: false
  emergency_kill_switch: true
```

## Instructions
1. Apply production-grade security settings
2. Configure high availability infrastructure
3. Set performance optimization parameters
4. Enable compliance requirements
5. Validate all configurations
6. Test configuration in isolated environment

## Output Format
- Production configuration files (encrypted)
- Security audit report
- Performance baseline configuration
- Compliance checklist with status
- Deployment-ready configuration bundle