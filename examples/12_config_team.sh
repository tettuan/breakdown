#!/bin/bash
# Example 19: Team shared configuration
# This example demonstrates a configuration file shared among team members with custom directories
set -euo pipefail

# Error handling
handle_error() {
    echo "Error: $1" >&2
    exit 1
}

# Set trap for better error reporting
trap 'handle_error "Command failed: ${BASH_COMMAND}"' ERR

# Get script directory and project root
SCRIPT_DIR="$(dirname "$0")"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || handle_error "Failed to change to project root"

# Use predefined dev configuration for team development
CONFIG_NAME="dev"

echo "Using team development configuration: $CONFIG_NAME"

# Create sample project documentation for team collaboration
mkdir -p /tmp/project-docs || handle_error "Failed to create temporary project-docs directory"
cat > /tmp/project-docs/architecture.md << 'EOF'
# MyApp Architecture Documentation

## Project Overview
MyApp is a modern web application built with microservices architecture.

## Core Components

### Authentication Service
Handles user authentication and authorization across all services.

**Technologies:**
- JWT tokens for session management
- OAuth2 integration for social logins
- Redis for token storage

### User Service
Manages user profiles and preferences.

**API Endpoints:**
- GET /users/:id - Get user profile
- PUT /users/:id - Update user profile
- DELETE /users/:id - Delete user account

### Product Service
Handles product catalog and inventory management.

**Key Features:**
- Real-time inventory tracking
- Product categorization
- Search and filtering capabilities

### Order Service
Processes customer orders and manages order lifecycle.

**Order States:**
- PENDING - Order created but not paid
- PROCESSING - Payment received, preparing order
- SHIPPED - Order shipped to customer
- DELIVERED - Order delivered successfully
- CANCELLED - Order cancelled by user or system

## Infrastructure

### Database Layer
- PostgreSQL for primary data storage
- MongoDB for product catalog
- Redis for caching and sessions

### Message Queue
- RabbitMQ for inter-service communication
- Event-driven architecture for order processing

### API Gateway
- Kong API Gateway for routing
- Rate limiting and authentication
- Request/response transformation

## Development Guidelines

### Code Style
- TypeScript for all services
- ESLint + Prettier for code formatting
- Jest for unit testing
- Cypress for E2E testing

### Git Workflow
- Feature branches from develop
- Pull requests require 2 approvals
- Automated CI/CD pipeline

### Documentation Standards
- API documentation with OpenAPI 3.0
- Architecture decisions in ADR format
- README files for each service
EOF

# Create another team document
cat > /tmp/project-docs/deployment.md << 'EOF'
# Deployment Guide

## Environments

### Development
- Local Docker Compose setup
- Hot reloading enabled
- Mock external services

### Staging
- Kubernetes cluster on AWS EKS
- Mirrors production configuration
- Uses production-like data

### Production
- Multi-region deployment
- Auto-scaling enabled
- Blue-green deployment strategy

## CI/CD Pipeline

### Build Stage
1. Run linters and formatters
2. Execute unit tests
3. Build Docker images
4. Push to container registry

### Deploy Stage
1. Update Kubernetes manifests
2. Apply rolling updates
3. Run smoke tests
4. Monitor deployment health

## Monitoring

### Application Metrics
- Prometheus for metrics collection
- Grafana for visualization
- Custom dashboards per service

### Logging
- ELK stack for centralized logging
- Structured JSON logs
- Log retention: 30 days

### Alerting
- PagerDuty integration
- Slack notifications
- Email alerts for critical issues
EOF

# Run breakdown with team config for architecture documentation
echo "Running breakdown with team shared configuration..."
echo "Processing architecture documentation..."
echo "Command: .deno/bin/breakdown to project --from /tmp/project-docs/architecture.md --destination /tmp/team-output/architecture --config $CONFIG_NAME"
.deno/bin/breakdown to project --from /tmp/project-docs/architecture.md --destination /tmp/team-output/architecture --config $CONFIG_NAME

# Process deployment documentation
echo -e "\nProcessing deployment documentation..."
echo "Command: .deno/bin/breakdown to project --from /tmp/project-docs/deployment.md --destination /tmp/team-output/deployment --config $CONFIG_NAME"
.deno/bin/breakdown to project --from /tmp/project-docs/deployment.md --destination /tmp/team-output/deployment --config $CONFIG_NAME

# Show results
echo -e "\nTeam documentation generated:"
echo "Architecture breakdown:"
find /tmp/team-output/architecture -type f -name "*.md" 2>/dev/null | head -5
echo -e "\nDeployment breakdown:"
find /tmp/team-output/deployment -type f -name "*.md" 2>/dev/null | head -5

# Clean up
echo -e "\nCleaning up temporary files..."
rm -rf /tmp/project-docs /tmp/team-output

echo "Example completed successfully!"