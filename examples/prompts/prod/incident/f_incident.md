# Production Incident Response Template

## Input
- {incident_details}
- {impact_assessment}
- {available_resources}

## Output
- {incident_timeline}
- {resolution_steps}
- {post_mortem_report}

---

## Incident Response Process

### Incident Classification
```yaml
severity_levels:
  sev1:
    description: "Complete service outage"
    response_time: "< 5 minutes"
    escalation: "immediate"
    communication: "all_stakeholders"
  sev2:
    description: "Major feature unavailable"
    response_time: "< 15 minutes"
    escalation: "on_call_lead"
    communication: "internal_team"
  sev3:
    description: "Minor feature degraded"
    response_time: "< 1 hour"
    escalation: "team_lead"
    communication: "team_slack"
  sev4:
    description: "Minimal impact"
    response_time: "< 4 hours"
    escalation: "standard"
    communication: "ticket"
```

### Initial Response
1. **Assess Impact**
   - Affected services: {affected_services}
   - User impact: {user_impact}
   - Business impact: {business_impact}
   - Geographic scope: {geographic_scope}

2. **Establish Command**
   - Incident commander: {commander}
   - Technical lead: {tech_lead}
   - Communications lead: {comm_lead}
   - Scribe: {scribe}

3. **Communication Plan**
   - Internal updates: Every 15 minutes
   - Customer updates: Every 30 minutes
   - Executive updates: Hourly
   - Status page: Real-time

### Investigation Steps
```yaml
investigation:
  immediate:
    - check_monitoring_dashboards
    - review_recent_deployments
    - examine_error_logs
    - verify_external_dependencies
  
  detailed:
    - analyze_performance_metrics
    - review_configuration_changes
    - check_infrastructure_health
    - examine_security_indicators
  
  tools:
    - apm_dashboard: {apm_url}
    - log_aggregator: {logs_url}
    - metrics_explorer: {metrics_url}
    - trace_analyzer: {trace_url}
```

### Mitigation Strategies
1. **Quick Wins**
   - Restart affected services
   - Clear caches
   - Increase capacity
   - Enable circuit breakers

2. **Rollback Options**
   - Code rollback: {rollback_procedure}
   - Configuration rollback: {config_rollback}
   - Database rollback: {db_rollback}
   - Feature flag disable: {feature_flags}

3. **Workarounds**
   - Traffic rerouting
   - Graceful degradation
   - Manual interventions
   - Third-party failovers

### Resolution Tracking
```yaml
timeline:
  - time: {timestamp}
    action: "Incident detected"
    owner: {monitoring_system}
  - time: {timestamp}
    action: "Team notified"
    owner: {on_call}
  - time: {timestamp}
    action: "Impact assessed"
    owner: {incident_commander}
  - time: {timestamp}
    action: "Mitigation started"
    owner: {tech_lead}
  - time: {timestamp}
    action: "Service restored"
    owner: {ops_team}
```

### Post-Incident Process
1. **Immediate Actions**
   - Verify complete resolution
   - Monitor for recurrence
   - Update status page
   - Send all-clear notification

2. **Follow-up Actions**
   - Schedule post-mortem
   - Gather metrics and logs
   - Document timeline
   - Identify action items

### Post-Mortem Template
```markdown
# Incident Post-Mortem: {incident_id}

## Summary
- Date: {date}
- Duration: {duration}
- Severity: {severity}
- Impact: {impact_summary}

## Timeline
{detailed_timeline}

## Root Cause Analysis
{root_cause_description}

## Contributing Factors
{contributing_factors_list}

## What Went Well
{positive_aspects}

## What Could Be Improved
{improvement_areas}

## Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
{action_items_table}

## Lessons Learned
{lessons_learned}
```

## Instructions
1. Classify incident severity immediately
2. Activate appropriate response team
3. Establish communication channels
4. Execute investigation and mitigation
5. Track all actions in timeline
6. Conduct thorough post-mortem

## Output Format
- Real-time incident timeline
- Detailed resolution steps taken
- Complete post-mortem report
- Action items with owners and deadlines
- Process improvement recommendations