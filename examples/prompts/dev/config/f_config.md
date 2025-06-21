# Development Environment Configuration Template

## Input
- {base_config}
- {dev_overrides}
- {local_settings}

## Output
- {config_file_path}
- {validation_results}

---

## Development Configuration

### Core Settings
```yaml
environment: development
debug: true
log_level: debug
hot_reload: true
```

### Service Endpoints
- API URL: {dev_api_url}
- Database: {dev_db_connection}
- Cache: {dev_cache_endpoint}
- Queue: {dev_queue_service}

### Authentication & Security
- Auth mode: {dev_auth_mode}
- API keys: {dev_api_keys}
- CORS settings: {dev_cors_config}
- SSL/TLS: {dev_ssl_settings}

### Development Tools
- Debugger port: {debugger_port}
- Profiler: {profiler_settings}
- Mock services: {mock_service_config}
- Test data: {test_data_config}

### Feature Toggles
```yaml
features:
  experimental_feature_a: true
  beta_feature_b: false
  debug_toolbar: true
```

### Resource Limits
- Memory: {dev_memory_limit}
- CPU: {dev_cpu_limit}
- Connections: {dev_connection_pool}
- Timeouts: {dev_timeout_settings}

## Instructions
1. Start with base configuration
2. Apply development-specific overrides
3. Merge with local developer settings
4. Validate configuration completeness
5. Check for conflicts or invalid combinations
6. Generate environment-specific config file

## Output Format
- Complete configuration file in appropriate format (JSON/YAML/TOML)
- Validation report highlighting any issues
- List of active development features
- Warning for any production-only settings