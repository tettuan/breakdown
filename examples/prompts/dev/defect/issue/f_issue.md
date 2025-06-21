# Development Issue Defect Analysis Template

## Input
- {issue_report}
- {error_logs}
- {dev_environment_config}
- {stack_trace}

## Output
- {issue_analysis}
- {root_cause}
- {fix_recommendations}
- {test_requirements}

---

## Development Environment Analysis

### Issue Context
- Development branch: {branch_name}
- Local environment setup: {local_config}
- Debug mode enabled: {debug_status}
- Recent code changes: {recent_commits}

### Error Investigation
1. **Stack Trace Analysis**
   - Error type: {error_type}
   - Error location: {file_path}:{line_number}
   - Call stack: {call_stack}
   - Variable state: {debug_variables}

2. **Environment Factors**
   - Node/Runtime version: {runtime_version}
   - Package versions: {dependency_versions}
   - Environment variables: {env_vars}
   - Local database state: {db_state}

3. **Reproduction Steps**
   ```bash
   # Development reproduction
   git checkout {branch_name}
   npm install
   npm run dev
   # Steps to reproduce: {reproduction_steps}
   ```

### Development-Specific Checks
- Hot reload conflicts
- Module resolution issues
- TypeScript compilation errors
- Linting violations
- Unused imports/variables
- Development tool conflicts

### Debug Information
```javascript
// Debug points
console.log({debug_point_1});
debugger; // {breakpoint_location}
// Performance markers
performance.mark({perf_marker});
```

### Related Development Issues
- Similar errors in commit history
- Related pull requests
- Known development environment issues
- Dependency update impacts

### Quick Fix Attempts
1. **Immediate Actions**
   - Clear cache: `npm run clean`
   - Rebuild: `npm run build:dev`
   - Reset database: `npm run db:reset`
   - Update dependencies: `npm update`

2. **Debug Tools**
   - Browser DevTools
   - Node.js Inspector
   - VS Code Debugger
   - Performance profiler

## Instructions
1. Collect all error information from development environment
2. Analyze stack traces and debug output
3. Check recent code changes and dependencies
4. Test quick fixes in isolated environment
5. Document reproduction steps precisely
6. Propose both quick fixes and proper solutions

## Output Format
- Detailed error analysis with code references
- Step-by-step reproduction guide
- Quick fix for immediate development continuation
- Proper solution with test requirements
- Prevention recommendations for similar issues