#!/bin/bash

# Example 18: Production environment configuration
# This example shows a configuration optimized for production use with custom paths

# Use predefined production configuration
CONFIG_FILE="./configs/prod.json"
echo "Using production configuration: $CONFIG_FILE"

# Create sample API documentation as input
mkdir -p /tmp/docs
cat > /tmp/docs/api_documentation.md << 'EOF'
# Production API Documentation

## Authentication System
All API endpoints require authentication via Bearer token.

### Token Management
- POST /auth/login - Authenticate user and receive token
- POST /auth/refresh - Refresh expired token
- POST /auth/logout - Invalidate current token

## User Management Endpoints

### GET /api/v1/users
Returns a paginated list of all users in the system.

**Parameters:**
- page (integer): Page number (default: 1)
- limit (integer): Items per page (default: 20)
- sort (string): Sort field (default: created_at)

### POST /api/v1/users
Creates a new user with the provided data.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "role": "string"
}
```

## Product Catalog Endpoints

### GET /api/v1/products
Returns a list of available products with filtering options.

**Query Parameters:**
- category (string): Filter by category
- minPrice (number): Minimum price filter
- maxPrice (number): Maximum price filter
- inStock (boolean): Show only in-stock items

### PUT /api/v1/products/{id}
Updates an existing product.

**Path Parameters:**
- id (string): Product UUID

## Order Processing

### POST /api/v1/orders
Create a new order with cart items.

### GET /api/v1/orders/{id}/status
Check order processing status.
EOF

# Run breakdown with production config
echo "Running breakdown with production configuration..."
echo "Command: breakdown to system --from /tmp/docs/api_documentation.md --output /tmp/prod-output --config $CONFIG_FILE"
breakdown to system --from /tmp/docs/api_documentation.md --output /tmp/prod-output --config $CONFIG_FILE

# Show results
echo -e "\nProduction output generated:"
find /tmp/prod-output -type f -name "*.md" | head -10

# Clean up
rm -rf /tmp/docs /tmp/prod-output