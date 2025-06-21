# Production Monitoring Template

## Input
- {monitoring_requirements}
- {sla_targets}
- {alert_configuration}

## Output
- {monitoring_dashboard}
- {alert_rules}
- {runbook_references}

---

## Production Monitoring Strategy

### Key Performance Indicators (KPIs)
```yaml
sla_targets:
  availability: 99.99%
  latency_p50: < 100ms
  latency_p95: < 200ms
  latency_p99: < 500ms
  error_rate: < 0.01%
```

### Monitoring Layers

#### 1. Infrastructure Monitoring
```yaml
infrastructure:
  compute:
    - cpu_utilization
    - memory_usage
    - disk_io
    - network_throughput
  storage:
    - disk_space
    - iops
    - backup_status
  network:
    - bandwidth_usage
    - packet_loss
    - latency
```

#### 2. Application Monitoring
```yaml
application:
  performance:
    - request_rate
    - response_time
    - throughput
    - queue_depth
  errors:
    - error_rate
    - error_types
    - stack_traces
    - affected_users
  business_metrics:
    - conversion_rate
    - revenue_per_minute
    - active_users
    - feature_usage
```

#### 3. Security Monitoring
```yaml
security:
  access:
    - failed_login_attempts
    - unusual_access_patterns
    - privilege_escalations
  threats:
    - ddos_indicators
    - sql_injection_attempts
    - suspicious_traffic
  compliance:
    - audit_log_integrity
    - data_access_logs
    - configuration_changes
```

### Alert Configuration
```yaml
alerts:
  critical:
    - name: "Service Down"
      condition: "availability < 99.9%"
      duration: "5 minutes"
      channels: ["pagerduty", "slack-critical"]
    - name: "High Error Rate"
      condition: "error_rate > 1%"
      duration: "2 minutes"
      channels: ["pagerduty", "email-oncall"]
  
  warning:
    - name: "High Latency"
      condition: "p95_latency > 500ms"
      duration: "10 minutes"
      channels: ["slack-alerts", "email-team"]
    - name: "Disk Space Low"
      condition: "disk_usage > 80%"
      duration: "30 minutes"
      channels: ["slack-ops"]
```

### Dashboard Configuration
```yaml
dashboards:
  executive:
    - overall_health_score
    - revenue_metrics
    - user_satisfaction
    - sla_compliance
  
  operational:
    - real_time_metrics
    - error_analysis
    - performance_trends
    - capacity_planning
  
  technical:
    - detailed_traces
    - database_performance
    - api_analytics
    - infrastructure_health
```

### Automated Response
```yaml
auto_remediation:
  - trigger: "high_memory_usage"
    action: "restart_service"
    approval: "automatic"
  - trigger: "disk_space_critical"
    action: "cleanup_logs"
    approval: "automatic"
  - trigger: "traffic_spike"
    action: "scale_up"
    approval: "automatic"
```

### Reporting & Analytics
- Daily health reports
- Weekly trend analysis
- Monthly SLA reports
- Quarterly capacity planning
- Annual performance review

## Instructions
1. Configure monitoring across all layers
2. Set up dashboards for different stakeholders
3. Define alert rules with appropriate thresholds
4. Test alert channels and escalation
5. Document runbook references
6. Schedule regular reviews and updates

## Output Format
- Monitoring configuration files
- Dashboard URLs and access credentials
- Alert rule definitions
- Runbook links for each alert type
- Monitoring coverage report