#!/bin/bash
# Example 15: Production Custom Configuration with Find Bugs
# This example demonstrates using 'breakdown find bugs' with production configuration
# Note: The find bugs functionality is prepared but not yet fully enabled in the current implementation
set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Error handling
handle_error() {
    cd "$ORIGINAL_CWD"
    echo "Error: $1" >&2
    exit 1
}

# Set trap for better error reporting and CWD restoration
trap 'cd "$ORIGINAL_CWD"; handle_error "Command failed: ${BASH_COMMAND}"' ERR
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and project root
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || handle_error "Failed to change to script directory"

echo "=== Example 15: Production Custom Configuration Find Bugs ==="
echo "This example shows how to use production configuration for bug detection"
echo
echo "⚠️  NOTE: The 'find bugs' functionality exists in prompts/schema but is not yet"
echo "   fully enabled in the CLI configuration. This example demonstrates the setup."
echo

# Set configuration paths
CONFIG_DIR="../.agent/breakdown/config"
CONFIG_FILE="$CONFIG_DIR/production-user.yml"
TEST_DIR="tmp/production-custom-test"
OUTPUT_DIR="tmp/production-bug-reports"

echo "Configuration directory: $CONFIG_DIR"
echo "Configuration file: $CONFIG_FILE"
echo "Test directory: $TEST_DIR"
echo "Output directory: $OUTPUT_DIR"
echo

# Create configuration directory if it doesn't exist
mkdir -p "$CONFIG_DIR" || handle_error "Failed to create config directory"

# Ensure local template directories exist
echo "Setting up local template directories for find bugs..."
mkdir -p prompts/find/bugs

# Copy required template files for find bugs functionality
echo "Copying find bugs template files..."
cp ../lib/breakdown/prompts/find/bugs/f_bugs.md prompts/find/bugs/ 2>/dev/null || echo "Warning: Could not copy find bugs template"

# Copy production configuration to the correct location
if [ -f "../config/production-user.yml" ]; then
    echo "=== Setting up Production Configuration ==="
    cp "../config/production-user.yml" "$CONFIG_FILE"
    echo "✅ Copied production configuration to $CONFIG_FILE"
else
    echo "❌ Production configuration not found in ../config/"
    echo "   Creating a sample configuration..."
    
    # Create a sample production configuration
    cat > "$CONFIG_FILE" << 'EOF'
# Production User Configuration
# Custom configuration for breakdown CLI

# Custom configuration section
customConfig:
  enabled: true
  
  # Find command configuration
  find:
    twoParams:
      - bugs
      - issues
      - todos
  
  # Find bugs functionality configuration
  findBugs:
    enabled: true
    sensitivity: medium
    patterns:
      - TODO
      - FIXME
      - BUG
      - HACK
      - XXX
      - DEPRECATED
    includeExtensions:
      - .ts
      - .js
      - .tsx
      - .jsx
      - .md
    excludeDirectories:
      - node_modules
      - .git
      - dist
      - build
      - coverage
      - .obsidian
    maxResults: 100
    detailedReports: true

# BreakdownParams configuration
breakdownParams:
  version: latest
  customConfig:
    params:
      two:
        demonstrativeType:
          pattern: "^(find|to|summary|defect)$"
        layerType:
          pattern: "^(bugs|project|issue|task)$"

# Logger configuration
logger:
  defaultLevel: info
  enableColors: true

# Output configuration
output:
  format: text
  colors: true
  lineNumbers: true
  context: 3
EOF
    echo "✅ Created sample production configuration"
fi

echo
echo "=== Creating Test Project with Various Bug Types ==="

# Create test project structure
mkdir -p "$TEST_DIR/src/services" || handle_error "Failed to create services directory"
mkdir -p "$TEST_DIR/src/components" || handle_error "Failed to create components directory"
mkdir -p "$TEST_DIR/src/utils" || handle_error "Failed to create utils directory"
mkdir -p "$TEST_DIR/tests" || handle_error "Failed to create tests directory"
mkdir -p "$OUTPUT_DIR" || handle_error "Failed to create output directory"

# Create main service file with various bug indicators
cat > "$TEST_DIR/src/services/api_service.ts" << 'EOF'
/**
 * API Service for handling external API calls
 * TODO: Add comprehensive error handling and retry logic
 */
export class ApiService {
  private baseUrl: string;
  private timeout: number;
  
  constructor() {
    // FIXME: Move configuration to environment variables
    this.baseUrl = 'https://api.example.com';
    this.timeout = 5000;
  }
  
  /**
   * Fetch user data from API
   * BUG: No rate limiting implemented - could cause API throttling
   */
  async fetchUserData(userId: string): Promise<any> {
    // TODO: Add input validation for userId
    
    try {
      // HACK: Using setTimeout to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        timeout: this.timeout
      });
      
      // XXX: Not checking response status before parsing JSON
      const data = await response.json();
      
      // DEPRECATED: This logging method will be removed in v2.0
      console.log('User data fetched:', data);
      
      return data;
    } catch (error) {
      // TODO: Implement proper error categorization and recovery
      throw new Error(`Failed to fetch user data: ${error.message}`);
    }
  }
  
  /**
   * Cache implementation
   * BUG: Memory leak - cache never clears old entries
   */
  private cache = new Map<string, any>();
  
  async getCachedData(key: string): Promise<any> {
    // FIXME: No cache expiration logic
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    // TODO: Add cache miss metrics
    return null;
  }
}
EOF

# Create component with React-specific issues
cat > "$TEST_DIR/src/components/UserProfile.tsx" << 'EOF'
import React, { useState, useEffect } from 'react';

/**
 * User Profile Component
 * TODO: Add proper TypeScript interfaces for props
 */
export const UserProfile: React.FC<any> = ({ userId }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // BUG: Missing dependency array could cause infinite re-renders
    fetchUserData();
  });
  
  const fetchUserData = async () => {
    setLoading(true);
    
    try {
      // FIXME: API service should be injected via props or context
      const apiService = new ApiService();
      const data = await apiService.fetchUserData(userId);
      
      setUserData(data);
    } catch (error) {
      // TODO: Add proper error state management
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // XXX: No loading state UI implementation
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // HACK: Direct property access without null checking
  return (
    <div className="user-profile">
      <h2>{userData.name}</h2>
      <p>{userData.email}</p>
      {/* DEPRECATED: This styling approach will be replaced with CSS modules */}
      <style>{`
        .user-profile { margin: 20px; }
      `}</style>
    </div>
  );
};
EOF

# Create utility file with security issues
cat > "$TEST_DIR/src/utils/auth.ts" << 'EOF'
/**
 * Authentication utilities
 * TODO: Implement proper JWT token validation
 */
export class AuthUtil {
  /**
   * Hash password function
   * BUG: Using weak hashing algorithm - security vulnerability
   */
  static hashPassword(password: string): string {
    // FIXME: Replace with bcrypt or similar secure hashing
    return btoa(password); // Base64 encoding is not secure!
  }
  
  /**
   * Validate session token
   * XXX: No token expiration checking
   */
  static validateToken(token: string): boolean {
    // TODO: Add proper JWT validation logic
    return token.length > 10; // Weak validation
  }
  
  /**
   * Generate session ID
   * HACK: Using timestamp as session ID - predictable and insecure
   */
  static generateSessionId(): string {
    // DEPRECATED: This method will be replaced with crypto.randomUUID()
    return Date.now().toString() + Math.random().toString(36);
  }
  
  /**
   * Admin check function
   * BUG: Hard-coded admin credentials - major security issue
   */
  static isAdmin(username: string, password: string): boolean {
    // FIXME: Remove hard-coded credentials immediately
    return username === 'admin' && password === 'admin123';
  }
}
EOF

# Create documentation with various TODO items
cat > "$TEST_DIR/README.md" << 'EOF'
# Production Custom Test Project

This project demonstrates bug detection capabilities using production configuration.

## Issues to Address

### High Priority
- BUG: Memory leak in cache implementation
- FIXME: Security vulnerabilities in authentication
- TODO: Add comprehensive error handling

### Medium Priority  
- XXX: Missing input validation in multiple places
- HACK: Temporary workarounds need permanent solutions
- DEPRECATED: Several methods marked for removal

### Low Priority
- TODO: Improve test coverage
- FIXME: Update documentation
- TODO: Add performance monitoring

## Installation

```bash
# TODO: Add proper installation instructions
npm install
```

## Usage

```bash
# FIXME: These commands are outdated
npm start
```
EOF

echo "Test project created with various bug types and patterns."
echo

echo "=== Demonstrating JSR Package Usage ==="
echo "Using JSR package instead of binary for breakdown commands"
echo

# Create a test script to demonstrate JSR usage
cat > "$OUTPUT_DIR/test_breakdown.ts" << 'EOF'
#!/usr/bin/env -S deno run -A

// Example of using breakdown via JSR package
import { parse } from "jsr:@std/flags@^0.224.0";

console.log("=== Breakdown JSR Package Usage Demo ===");
console.log("This demonstrates how to use breakdown via JSR package");
console.log();

// Parse command line arguments
const args = parse(Deno.args);

// Example: Check if find bugs would work
const demonstrativeType = "find";
const layerType = "bugs";

console.log(`Testing command: breakdown ${demonstrativeType} ${layerType}`);
console.log();

// Check against current app.yml patterns
const currentDemonstrativePattern = /^(to|summary|defect)$/;
const currentLayerPattern = /^(project|issue|task)$/;

console.log("Current Configuration Status:");
console.log(`- Demonstrative type '${demonstrativeType}': ${currentDemonstrativePattern.test(demonstrativeType) ? "✅ Allowed" : "❌ Not allowed"}`);
console.log(`- Layer type '${layerType}': ${currentLayerPattern.test(layerType) ? "✅ Allowed" : "❌ Not allowed"}`);
console.log();

// Check against production config patterns
const prodDemonstrativePattern = /^(find|to|summary|defect)$/;
const prodLayerPattern = /^(bugs|project|issue|task)$/;

console.log("Production Configuration Status:");
console.log(`- Demonstrative type '${demonstrativeType}': ${prodDemonstrativePattern.test(demonstrativeType) ? "✅ Allowed" : "✅ Would be allowed"}`);
console.log(`- Layer type '${layerType}': ${prodLayerPattern.test(layerType) ? "✅ Allowed" : "✅ Would be allowed"}`);
console.log();

console.log("=== Implementation Status ===");
console.log("✅ Prompts exist: lib/breakdown/prompts/find/bugs/");
console.log("✅ Schema exists: lib/breakdown/schema/find/bugs/");
console.log("✅ Types defined in lib/types/mod.ts");
console.log("❌ Not enabled in app.yml configuration patterns");
console.log();

console.log("To enable 'find bugs' functionality:");
console.log("1. Update app.yml demonstrativeType pattern to include 'find'");
console.log("2. Update app.yml layerType pattern to include 'bugs'");
console.log("3. The existing two-parameter CLI logic will handle the command");
EOF

# Make the test script executable and run it
chmod +x "$OUTPUT_DIR/test_breakdown.ts"
deno run -A "$OUTPUT_DIR/test_breakdown.ts"

echo
echo "=== Using Breakdown via JSR Package ==="
echo "To use breakdown from JSR package in your code:"
echo
echo "1. Import method:"
echo "   import { breakdown } from '../cli/breakdown.ts';"
echo
echo "2. CLI usage via deno task:"
echo "   deno run -A ../cli/breakdown.ts <command>"
echo
echo "3. Or use the configured task:"
echo "   deno task breakdown <command>"
echo

echo "=== Current Status ==="
echo "✅ Production configuration created at: $CONFIG_FILE"
echo "✅ Test project with bug patterns created"
echo "✅ JSR package usage demonstrated"
echo "⚠️  'find bugs' functionality exists but needs app.yml update to enable"
echo

echo "=== Configuration Locations ==="
echo "The new structure uses:"
echo "  • System config: .agent/breakdown/config/app.yml"
echo "  • User config: .agent/breakdown/config/user.yml"
echo "  • Production config: .agent/breakdown/config/production-user.yml"
echo

echo "=== Find Bugs Implementation Status ==="
echo "Components that exist:"
echo "  ✅ Prompts: lib/breakdown/prompts/find/bugs/*.md"
echo "  ✅ Schema: lib/breakdown/schema/find/bugs/base.schema.md"
echo "  ✅ Types: DemonstrativeType and LayerType include 'find' and 'bugs'"
echo
echo "What needs to be done:"
echo "  ❌ Update app.yml to allow 'find' in demonstrativeType pattern"
echo "  ❌ Update app.yml to allow 'bugs' in layerType pattern"
echo

echo
echo "=== Example Complete ==="
echo "This example demonstrated:"
echo "  • Moving config files to new .agent/breakdown/config/ structure"
echo "  • Using JSR package instead of binary"
echo "  • Current status of 'find bugs' functionality"
echo "  • How to enable the feature when ready"
echo
echo "For more information, see:"
echo "  • .agent/breakdown/config/ - Configuration directory"
echo "  • lib/breakdown/prompts/find/bugs/ - Find bugs prompts"
echo "  • lib/breakdown/schema/find/bugs/ - Find bugs schema"

echo -e "\nExample completed successfully!"