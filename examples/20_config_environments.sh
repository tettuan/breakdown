#!/bin/bash

# Example 20: Environment-specific configurations
# This example shows how to use different configs for different environments

# Define configuration files for different environments
DEV_CONFIG="./configs/dev.json"
TEST_CONFIG="./configs/test.json"
PROD_CONFIG="./configs/prod.json"

echo "Using environment configurations:"
echo "  Development: $DEV_CONFIG"
echo "  Test/Staging: $TEST_CONFIG"
echo "  Production: $PROD_CONFIG"

# Create a sample application specification
mkdir -p /tmp/app-specs
cat > /tmp/app-specs/main.md << 'EOF'
# E-Commerce Platform Specification

## System Overview
A comprehensive e-commerce platform supporting B2C and B2B operations.

## Core Features

### Customer Portal
- User registration and authentication
- Product browsing and search
- Shopping cart management
- Order placement and tracking
- Payment processing
- Review and rating system

### Admin Dashboard
- Product management (CRUD operations)
- Inventory tracking
- Order management
- Customer support tools
- Analytics and reporting
- Marketing campaign management

### API Services
- RESTful API for mobile apps
- GraphQL API for web frontend
- Webhook support for integrations
- Rate limiting and API key management

## Technical Requirements

### Performance
- Page load time < 2 seconds
- API response time < 200ms
- Support for 10,000 concurrent users
- 99.9% uptime SLA

### Security
- PCI DSS compliance for payment processing
- GDPR compliance for data protection
- SSL/TLS encryption
- Regular security audits

### Scalability
- Horizontal scaling capability
- Database sharding support
- CDN integration
- Microservices architecture

## Integration Points

### Payment Gateways
- Stripe
- PayPal
- Square
- Bank transfers

### Shipping Providers
- FedEx
- UPS
- DHL
- Local carriers

### Third-party Services
- Email service (SendGrid)
- SMS notifications (Twilio)
- Analytics (Google Analytics)
- Search (Elasticsearch)

## Database Schema

### Core Tables
- users
- products
- categories
- orders
- order_items
- payments
- reviews
- inventory

### Relationships
- Users have many orders
- Orders have many order_items
- Products belong to categories
- Products have many reviews
EOF

# Function to run breakdown with different configs
run_with_env() {
  local env=$1
  echo -e "\n=== Running breakdown for $env environment ==="
  
  case $env in
    development)
      echo "Command: breakdown to project --from /tmp/app-specs/main.md --output /tmp/$env-docs --config $DEV_CONFIG"
      breakdown to project --from /tmp/app-specs/main.md --output /tmp/$env-docs --config $DEV_CONFIG
      ;;
    staging)
      echo "Command: breakdown to system --from /tmp/app-specs/main.md --output /tmp/$env-docs --config $TEST_CONFIG"
      breakdown to system --from /tmp/app-specs/main.md --output /tmp/$env-docs --config $TEST_CONFIG
      ;;
    production)
      echo "Command: breakdown to system --from /tmp/app-specs/main.md --output /tmp/$env-docs --config $PROD_CONFIG --extended"
      breakdown to system --from /tmp/app-specs/main.md --output /tmp/$env-docs --config $PROD_CONFIG --extended
      ;;
  esac
  
  echo "Output saved to /tmp/$env-docs/"
}

# Run for each environment
run_with_env "development"
run_with_env "staging"
run_with_env "production"

# Show the different outputs
echo -e "\n=== Environment-specific outputs ==="
echo "Development docs:"
find /tmp/development-docs -type f -name "*.md" 2>/dev/null | head -3 || echo "  (not created)"

echo -e "\nStaging docs:"
find /tmp/staging-docs -type f -name "*.md" 2>/dev/null | head -3 || echo "  (not created)"

echo -e "\nProduction docs (with --extended):"
find /tmp/production-docs -type f -name "*.md" 2>/dev/null | head -3 || echo "  (not created)"

# Compare config usage
echo -e "\n=== Configuration Summary ==="
echo "Development: Uses dev.json - local development paths, project-level breakdown"
echo "Staging: Uses test.json - test environment paths, system-level breakdown"
echo "Production: Uses prod.json - production paths, system-level with extended mode"

# Clean up
rm -rf /tmp/app-specs /tmp/development-docs /tmp/staging-docs /tmp/production-docs