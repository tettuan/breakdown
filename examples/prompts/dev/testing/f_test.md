# Development Testing Template

## Input
- {test_suite}
- {test_data}
- {dev_environment_config}

## Output
- {test_results}
- {coverage_report}
- {performance_metrics}

---

## Development Testing Strategy

### Test Execution Plan
- Unit tests: {unit_test_config}
- Integration tests: {integration_test_config}
- API tests: {api_test_config}
- UI tests: {ui_test_config}

### Test Environment Setup
```bash
# Environment variables
export NODE_ENV=development
export TEST_MODE=true
export LOG_LEVEL=debug
export MOCK_EXTERNAL_SERVICES=true
```

### Test Data Management
- Seed data location: {seed_data_path}
- Test database: {test_db_config}
- Mock service responses: {mock_responses}
- Test user accounts: {test_accounts}

### Development-Specific Tests
1. **Hot Reload Testing**
   - File change detection
   - Module replacement
   - State preservation

2. **Debug Mode Testing**
   - Debug endpoints
   - Verbose error messages
   - Stack trace availability

3. **Performance Profiling**
   - Memory usage tracking
   - CPU profiling
   - Response time analysis

### Coverage Requirements
- Unit test coverage: >= 80%
- Integration test coverage: >= 60%
- Critical path coverage: 100%

### Continuous Testing
```yaml
watch_mode:
  enabled: true
  file_patterns:
    - "src/**/*.ts"
    - "tests/**/*.test.ts"
  run_on_change: true
  notify_on_failure: true
```

## Instructions
1. Set up test environment with dev configurations
2. Load test data and mocks
3. Execute test suites in order
4. Collect coverage and performance data
5. Generate comprehensive test report
6. Identify areas needing additional testing

## Output Format
- Test results summary with pass/fail counts
- Detailed failure reports with stack traces
- Code coverage report with uncovered lines
- Performance metrics compared to baseline
- Recommendations for test improvements