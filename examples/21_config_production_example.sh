#!/bin/bash

# 21_config_production_example.sh
# Production configuration example using --config/-c option
# Demonstrates config prefix usage for different environments

echo "=== Production Configuration Example - Breakdown Tool ==="
echo "This example demonstrates using --config/-c option for production settings."
echo ""

# Prepare work directory
WORK_DIR="examples/tmp/production_config"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Create production configuration file
echo "=== 1. Creating production configuration file ==="
cat > production.yml << 'EOF'
# Production environment configuration
production:
  working_dir: .agent/breakdown/production
  app_prompt:
    base_dir: prompts/production
  app_schema:
    base_dir: schema/production
  
  # Production-specific settings
  settings:
    max_tokens: 4096
    temperature: 0.1
    model: "claude-3-opus"
    
  # Feature flags for production
  features:
    extended_validation: true
    detailed_error_reporting: false
    debug_mode: false
    
  # Production paths
  output:
    base_dir: output/production
    format: markdown
    
  # Security settings
  security:
    sanitize_output: true
    mask_sensitive_data: true
EOF

echo "✅ Created production.yml configuration file"

# Create staging configuration for comparison
echo ""
echo "=== 2. Creating staging configuration for comparison ==="
cat > staging.yml << 'EOF'
# Staging environment configuration  
staging:
  working_dir: .agent/breakdown/staging
  app_prompt:
    base_dir: prompts/staging
  app_schema:
    base_dir: schema/staging
  
  # Staging-specific settings
  settings:
    max_tokens: 8192
    temperature: 0.3
    model: "claude-3-haiku"
    
  # Feature flags for staging
  features:
    extended_validation: true
    detailed_error_reporting: true
    debug_mode: true
    
  # Staging paths
  output:
    base_dir: output/staging
    format: json
    
  # Security settings (relaxed for testing)
  security:
    sanitize_output: false
    mask_sensitive_data: false
EOF

echo "✅ Created staging.yml configuration file"

# Create sample input file
echo ""
echo "=== 3. Creating sample input file ==="
cat > system_architecture.md << 'EOF'
# Payment Processing System

## Overview
High-performance payment processing system for e-commerce platform

## Components
- API Gateway (Kong)
- Payment Service (Node.js)
- Fraud Detection (Python ML)
- Database Layer (PostgreSQL)
- Cache Layer (Redis)
- Message Queue (RabbitMQ)

## Requirements
- 10,000 TPS capacity
- < 100ms latency
- 99.99% uptime
- PCI DSS compliance

## Integration Points
- Stripe API
- PayPal API
- Bank APIs
- Internal microservices
EOF

echo "✅ Created sample input file: system_architecture.md"

# Create prompts and schema directories
echo ""
echo "=== 4. Setting up directory structure ==="
mkdir -p prompts/production/find/system
mkdir -p prompts/staging/find/system
mkdir -p schema/production/find/system
mkdir -p schema/staging/find/system

# Create production prompt template
cat > prompts/production/find/system/f_system.md << 'EOF'
# Production System Analysis Template

Analyze the provided system architecture with production-grade standards:

1. **Security Vulnerabilities**
   - Authentication/Authorization gaps
   - Data encryption requirements
   - Network security considerations

2. **Performance Bottlenecks**
   - Scalability limitations
   - Single points of failure
   - Resource optimization opportunities

3. **Compliance Issues**
   - Regulatory requirements
   - Industry standards
   - Audit trail requirements

4. **Operational Concerns**
   - Monitoring gaps
   - Backup/recovery procedures
   - Disaster recovery planning

Output format: Structured markdown with severity levels (Critical/High/Medium/Low)
EOF

# Create staging prompt template
cat > prompts/staging/find/system/f_system.md << 'EOF'
# Staging System Analysis Template

Analyze the system architecture for testing and development:

1. **Testing Coverage**
   - Unit test requirements
   - Integration test points
   - Performance test scenarios

2. **Development Workflow**
   - CI/CD pipeline integration
   - Environment parity issues
   - Development tooling needs

3. **Debug Capabilities**
   - Logging requirements
   - Trace collection points
   - Error reproduction setup

Output format: Detailed JSON with test scenarios and debug information
EOF

echo "✅ Created prompt templates for production and staging"

# Create schema files
cat > schema/production/find/system/output.yml << 'EOF'
type: object
properties:
  findings:
    type: array
    items:
      type: object
      properties:
        category:
          type: string
          enum: [security, performance, compliance, operational]
        severity:
          type: string
          enum: [critical, high, medium, low]
        description:
          type: string
        recommendation:
          type: string
      required: [category, severity, description, recommendation]
  summary:
    type: object
    properties:
      total_issues:
        type: integer
      critical_count:
        type: integer
      requires_immediate_action:
        type: boolean
required: [findings, summary]
EOF

cat > schema/staging/find/system/output.yml << 'EOF'
type: object
properties:
  test_scenarios:
    type: array
    items:
      type: object
      properties:
        scenario_name:
          type: string
        test_type:
          type: string
        priority:
          type: string
        implementation_notes:
          type: string
  debug_points:
    type: array
    items:
      type: object
      properties:
        component:
          type: string
        debug_level:
          type: string
        log_requirements:
          type: array
          items:
            type: string
required: [test_scenarios, debug_points]
EOF

echo "✅ Created schema files for production and staging"

# Example 1: Production configuration
echo ""
echo "=== 5. Running with production configuration ==="
echo "Command: breakdown find system -c=production --from system_architecture.md"
echo ""
echo "Expected behavior:"
echo "- Uses production.yml configuration"
echo "- Applies production prompts (security/compliance focused)"
echo "- Uses production schema for validation"
echo "- Output sanitized for production use"
echo ""

# Simulate the command (will fail without full implementation)
echo "$ breakdown find system -c=production --from system_architecture.md --destination findings_prod.md"
deno run -A ../../../cli/breakdown.ts find system \
  -c=production \
  --from system_architecture.md \
  --destination findings_prod.md 2>&1 | head -10 || true

# Example 2: Staging configuration
echo ""
echo "=== 6. Running with staging configuration ==="
echo "Command: breakdown find system --config staging --from system_architecture.md"
echo ""
echo "Expected behavior:"
echo "- Uses staging.yml configuration"
echo "- Applies staging prompts (testing/debug focused)"
echo "- Uses staging schema for validation"
echo "- Detailed output with debug information"
echo ""

echo "$ breakdown find system --config staging --from system_architecture.md --destination findings_staging.json"
deno run -A ../../../cli/breakdown.ts find system \
  --config staging \
  --from system_architecture.md \
  --destination findings_staging.json 2>&1 | head -10 || true

# Example 3: Comparing configurations
echo ""
echo "=== 7. Configuration comparison ==="
echo "Production vs Staging differences:"
echo ""
echo "Production (-c=production):"
echo "  - Conservative settings (temperature: 0.1)"
echo "  - Security-focused analysis"
echo "  - Sanitized output"
echo "  - Compliance-oriented"
echo ""
echo "Staging (--config staging):"
echo "  - Flexible settings (temperature: 0.3)"
echo "  - Development-focused analysis"
echo "  - Detailed debug output"
echo "  - Testing-oriented"

# Example 4: Team workflow with configs
echo ""
echo "=== 8. Team workflow example ==="
cat > team_workflow.sh << 'EOF'
#!/bin/bash
# Team workflow using different configurations

# Developer runs analysis in staging
breakdown find system -c=staging \
  --from new_feature.md \
  --destination staging_analysis.json

# QA validates in pre-production
breakdown find system -c=preprod \
  --from new_feature.md \
  --destination qa_validation.md

# DevOps checks production readiness
breakdown find system -c=production \
  --from new_feature.md \
  --destination prod_readiness.md

# Security team audit
breakdown find system -c=security \
  --from new_feature.md \
  --destination security_audit.md
EOF

chmod +x team_workflow.sh
echo "✅ Created team_workflow.sh demonstrating multi-config usage"

# Create a default configuration
echo ""
echo "=== 9. Default configuration (no prefix) ==="
cat > user.yml << 'EOF'
# Default configuration when no --config specified
working_dir: .agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schema

# Default settings
settings:
  max_tokens: 2048
  temperature: 0.2
  model: "claude-3-sonnet"
EOF

echo "✅ Created default user.yml"

# Summary
echo ""
echo "=== Configuration Usage Summary ==="
echo ""
echo "1. Use -c or --config to specify configuration prefix:"
echo "   breakdown find system -c=production ..."
echo "   breakdown find system --config staging ..."
echo ""
echo "2. Configuration file naming:"
echo "   - production.yml → Use with -c=production"
echo "   - staging.yml → Use with --config staging"
echo "   - user.yml → Default when no config specified"
echo ""
echo "3. Benefits of config prefixes:"
echo "   ✅ Environment-specific settings"
echo "   ✅ Different prompts per environment"
echo "   ✅ Custom validation rules"
echo "   ✅ Team-specific workflows"
echo "   ✅ Security/compliance policies"
echo ""
echo "4. Common use cases:"
echo "   - Development: -c=dev (relaxed validation, verbose output)"
echo "   - Staging: -c=staging (full validation, debug info)"
echo "   - Production: -c=production (strict validation, sanitized output)"
echo "   - CI/CD: -c=ci (automated testing settings)"
echo ""

# Show generated files
echo "=== Generated Files ==="
ls -la *.yml
echo ""
echo "Directory structure:"
tree -d prompts schema 2>/dev/null || find prompts schema -type d | sort

cd ../../..
echo ""
echo "🎉 Production configuration example completed!"
echo ""
echo "Note: This example demonstrates the intended usage of --config/-c option."
echo "Full implementation requires BreakdownConfigOption integration with BreakdownConfig."